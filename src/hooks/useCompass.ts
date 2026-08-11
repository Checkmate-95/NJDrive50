// C:\Dev\NJDRIVE50\src\hooks\useCompass.ts
import { useEffect, useState, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { CapgoCompass } from "@capgo/capacitor-compass"
import type { HeadingChangeEvent, AccuracyChangeEvent } from "@capgo/capacitor-compass"
import { CompassAccuracy } from "@capgo/capacitor-compass"

const DEFAULT_DECLINATION = 13 // approximate for New Jersey — overrideable via hook param

type Cardinal = "N" | "E" | "S" | "W"
const CENTERS: Record<Cardinal, number> = { N: 0, E: 90, S: 180, W: 270 }

function angularDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

// Keep floats internally; only round for display in UI
function smoothHeading(prev: number | null, next: number, alpha = 0.22): number {
  if (prev === null || prev === undefined) return next
  const diff = ((next - prev + 540) % 360) - 180
  return (prev + alpha * diff + 360) % 360
}

function getOrientationOffset(): number {
  try {
    const screenAny = (typeof window !== "undefined" && (window as any).screen) ? (window as any).screen : null
    const type = screenAny?.orientation?.type ?? screenAny?.mozOrientation ?? screenAny?.msOrientation ?? ""
    if (typeof type === "string") {
      if (type.startsWith("landscape-primary")) return 90
      if (type.startsWith("landscape-secondary")) return 270
      if (type === "portrait-secondary") return 180
    }
  } catch (e) {
    // ignore and fall through
  }
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

export function useCompass({ declination = DEFAULT_DECLINATION } = { declination: DEFAULT_DECLINATION }): UseCompassResult {
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
        await CapgoCompass.startListening()

        const h = await CapgoCompass.addListener("headingChange", (event: HeadingChangeEvent) => {
          const raw = event?.value
          if (raw === null || raw === undefined || Number.isNaN(raw)) return

          const orientationCorrected = (raw + getOrientationOffset() + 360) % 360
          const declinationCorrected = applyDeclination(orientationCorrected, declination)

          // initialize on first valid reading to avoid large initial jumps
          if (lastHeading.current === null) {
            lastHeading.current = declinationCorrected
            setRawHeadingState(declinationCorrected)
            setCardinal((prev) => stableCardinal(prev, lastHeading.current as number))
            return
          }

          // spike filter: ignore impossible jumps (likely bad sensor spike)
          const jump = angularDistance(lastHeading.current, declinationCorrected)
          if (jump > 120) return

          const smoothed = smoothHeading(lastHeading.current, declinationCorrected)
          lastHeading.current = smoothed
          setRawHeadingState(smoothed)

          setCardinal((prev) => {
            const next = stableCardinal(prev, smoothed)
            return next === prev ? prev : next
          })
        })

        // accuracy/watch (guarded because not all platforms implement it)
        try {
          await CapgoCompass.watchAccuracy()
          const a = await CapgoCompass.addListener("accuracyChange", (ev: AccuracyChangeEvent) => {
            // ev.accuracy is typed; compare against runtime enum values
            setNeedsCalibration(ev.accuracy === CompassAccuracy.LOW || ev.accuracy === CompassAccuracy.UNRELIABLE)
          })
          accuracyHandle.current = a
        } catch (e) {
          // some platforms may not support watchAccuracy; ignore
        }

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
        try {
          if (headingHandle.current) {
            await headingHandle.current.remove()
            headingHandle.current = null
          }
        } catch (e) {
          console.warn("Error removing heading listener", e)
        }
        try {
          if (accuracyHandle.current) {
            await accuracyHandle.current.remove()
            accuracyHandle.current = null
          }
        } catch (e) {
          console.warn("Error removing accuracy listener", e)
        }
        try {
          await CapgoCompass.stopListening()
        } catch (e) {
          // ignore
        }
        try {
          await CapgoCompass.unwatchAccuracy()
        } catch (e) {
          // ignore
        }
      })()
    }
  }, [declination])

  return { cardinal, needsCalibration, rawHeading: rawHeadingState }
}