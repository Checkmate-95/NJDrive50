import { useEffect, useState, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { CapgoCompass } from "@capgo/capacitor-compass"
import type { HeadingChangeEvent, AccuracyChangeEvent } from "@capgo/capacitor-compass"
import { CompassAccuracy } from "@capgo/capacitor-compass"

// Correct sign: New Jersey has WEST declination ≈ -13°
const DEFAULT_DECLINATION = -13

type Cardinal = "N" | "E" | "S" | "W"
const CENTERS: Record<Cardinal, number> = { N: 0, E: 90, S: 180, W: 270 }

function angularDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function smoothHeading(prev: number | null, next: number, alpha = 0.22): number {
  if (prev == null) return next
  const diff = ((next - prev + 540) % 360) - 180
  return (prev + alpha * diff + 360) % 360
}

function getOrientationOffset(): number {
  try {
    const screenAny = (typeof window !== "undefined" && (window as any).screen)
      ? (window as any).screen
      : null

    const type = screenAny?.orientation?.type ?? ""

    if (typeof type === "string") {
      if (type.startsWith("landscape-primary")) return 90
      if (type.startsWith("landscape-secondary")) return 270
      if (type === "portrait-secondary") return 180
    }
  } catch (_) {}

  return 0
}

function applyDeclination(magneticHeading: number, declinationDegrees: number): number {
  return ((magneticHeading + declinationDegrees) % 360 + 360) % 360
}

function stableCardinal(prev: Cardinal, heading: number): Cardinal {
  const pad = 15
  const baseHalfWidth = 45

  if (angularDistance(CENTERS[prev], heading) <= baseHalfWidth + pad) return prev

  let closest: Cardinal = prev
  let smallestDistance = Infinity

  for (const direction of Object.keys(CENTERS) as Cardinal[]) {
    const distance = angularDistance(CENTERS[direction], heading)
    if (distance < smallestDistance) {
      smallestDistance = distance
      closest = direction
    }
  }

  return closest
}

export type UseCompassResult = {
  cardinal: Cardinal
  needsCalibration: boolean
  rawHeading: number | null
}

export function useCompass({ declination = DEFAULT_DECLINATION } = {}): UseCompassResult {
  const [cardinal, setCardinal] = useState<Cardinal>("N")
  const [needsCalibration, setNeedsCalibration] = useState(false)
  const [rawHeadingState, setRawHeadingState] = useState<number | null>(null)

  const lastHeading = useRef<number | null>(null)
  const headingHandle = useRef<{ remove: () => Promise<void> } | null>(null)
  const accuracyHandle = useRef<{ remove: () => Promise<void> } | null>(null)
  const cancelled = useRef(false)

  useEffect(() => {
    if (Capacitor.getPlatform() === "web") {
      console.warn("Compass not available on web")
      return
    }

    cancelled.current = false

    const setup = async () => {
      try {
        // Idempotent guard: prevents duplicate listeners in React StrictMode
        try { await CapgoCompass.stopListening() } catch {}

        await CapgoCompass.startListening()

        const h = await CapgoCompass.addListener("headingChange", (event: HeadingChangeEvent) => {
          const raw = event?.value
          if (raw == null || Number.isNaN(raw)) return

          const orientationCorrected = (raw + getOrientationOffset() + 360) % 360
          const declinationCorrected = applyDeclination(orientationCorrected, declination)

          if (lastHeading.current == null) {
            lastHeading.current = declinationCorrected
            setRawHeadingState(declinationCorrected)
            setCardinal((prev) => stableCardinal(prev, declinationCorrected))
            return
          }

          const jump = angularDistance(lastHeading.current, declinationCorrected)
          if (jump > 120) return

          const smoothed = smoothHeading(lastHeading.current, declinationCorrected)
          lastHeading.current = smoothed
          setRawHeadingState(smoothed)

          setCardinal((prev) => stableCardinal(prev, smoothed))
        })

        try {
          await CapgoCompass.watchAccuracy()
          const a = await CapgoCompass.addListener("accuracyChange", (ev: AccuracyChangeEvent) => {
            setNeedsCalibration(
              ev.accuracy === CompassAccuracy.LOW ||
              ev.accuracy === CompassAccuracy.UNRELIABLE
            )
          })
          accuracyHandle.current = a
        } catch {}

        if (!cancelled.current) headingHandle.current = h
        else await h.remove()
      } catch (err) {
        console.error("Compass setup failed:", err)
      }
    }

    setup()

    return () => {
      cancelled.current = true
      ;(async () => {
        try { if (headingHandle.current) await headingHandle.current.remove() } catch {}
        headingHandle.current = null

        try { if (accuracyHandle.current) await accuracyHandle.current.remove() } catch {}
        accuracyHandle.current = null

        try { await CapgoCompass.stopListening() } catch {}
        try { await CapgoCompass.unwatchAccuracy() } catch {}
      })()
    }
  }, [declination])

  return { cardinal, needsCalibration, rawHeading: rawHeadingState }
}
