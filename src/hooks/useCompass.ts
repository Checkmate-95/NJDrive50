import { useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import {
  CapgoCompass,
  CompassAccuracy,
  type AccuracyChangeEvent,
  type HeadingChangeEvent,
} from "@capgo/capacitor-compass"

// New Jersey is west of true north by about 13°
const DEFAULT_DECLINATION = -13

type Cardinal = "N" | "E" | "S" | "W"

const CENTERS: Record<Cardinal, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
}

function normalizeHeadingDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

function angularDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function smoothHeading(
  prev: number | null,
  next: number,
  alpha = 0.22
): number {
  if (prev == null) return next
  const diff = ((next - prev + 540) % 360) - 180
  return normalizeHeadingDegrees(prev + alpha * diff)
}

function applyDeclination(
  magneticHeading: number,
  declinationDegrees: number
): number {
  return normalizeHeadingDegrees(magneticHeading + declinationDegrees)
}

function stableCardinal(prev: Cardinal, heading: number): Cardinal {
  const pad = 15
  const baseHalfWidth = 45

  if (angularDistance(CENTERS[prev], heading) <= baseHalfWidth + pad) {
    return prev
  }

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

export function useCompass({
  declination = DEFAULT_DECLINATION,
}: {
  declination?: number
} = {}): UseCompassResult {
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
    lastHeading.current = null

    const setup = async () => {
      try {
        try {
          await CapgoCompass.stopListening()
        } catch {}

        await CapgoCompass.startListening()

        const h = await CapgoCompass.addListener(
          "headingChange",
          (event: HeadingChangeEvent) => {
            const raw = event?.value

            if (raw == null || !Number.isFinite(raw)) return

            const magneticHeading = normalizeHeadingDegrees(raw)
            const declinationCorrected = applyDeclination(
              magneticHeading,
              declination
            )

            if (lastHeading.current == null) {
              lastHeading.current = declinationCorrected
              setRawHeadingState(declinationCorrected)
              setCardinal((prev) =>
                stableCardinal(prev, declinationCorrected)
              )
              return
            }

            const jump = angularDistance(
              lastHeading.current,
              declinationCorrected
            )

            if (jump > 120) return

            const smoothed = smoothHeading(
              lastHeading.current,
              declinationCorrected
            )

            lastHeading.current = smoothed
            setRawHeadingState(smoothed)
            setCardinal((prev) => stableCardinal(prev, smoothed))
          }
        )

        if (!cancelled.current) {
          headingHandle.current = h
        } else {
          await h.remove()
        }

        try {
          await CapgoCompass.watchAccuracy()

          const a = await CapgoCompass.addListener(
            "accuracyChange",
            (ev: AccuracyChangeEvent) => {
              setNeedsCalibration(
                ev.accuracy === CompassAccuracy.LOW ||
                  ev.accuracy === CompassAccuracy.UNRELIABLE
              )
            }
          )

          if (!cancelled.current) {
            accuracyHandle.current = a
          } else {
            await a.remove()
          }
        } catch {}
      } catch (err) {
        console.error("Compass setup failed:", err)
      }
    }

    void setup()

    return () => {
      cancelled.current = true

      void (async () => {
        try {
          if (headingHandle.current) await headingHandle.current.remove()
        } catch {}
        headingHandle.current = null

        try {
          if (accuracyHandle.current) await accuracyHandle.current.remove()
        } catch {}
        accuracyHandle.current = null

        try {
          await CapgoCompass.stopListening()
        } catch {}

        try {
          await CapgoCompass.unwatchAccuracy()
        } catch {}
      })()
    }
  }, [declination])

  return {
    cardinal,
    needsCalibration,
    rawHeading: rawHeadingState,
  }
}