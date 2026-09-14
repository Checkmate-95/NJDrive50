import { useCallback, useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import {
  CapgoCompass,
  CompassAccuracy,
  type AccuracyChangeEvent,
  type HeadingChangeEvent,
} from "@capgo/capacitor-compass"

// New Jersey is west of true north by about 13°
const DEFAULT_DECLINATION = -13

// Below this speed, GPS-derived heading is unreliable (position noise
// dominates), so we fall back to the magnetometer.
const DEFAULT_GPS_HEADING_THRESHOLD_MPH = 5

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
  alpha = 0.4
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
  const pad = 8
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
  headingSource: "gps" | "magnetometer"
}

export function useCompass({
  declination = DEFAULT_DECLINATION,
  gpsHeading = null,
  speedMph = null,
  gpsHeadingThresholdMph = DEFAULT_GPS_HEADING_THRESHOLD_MPH,
}: {
  declination?: number
  gpsHeading?: number | null
  speedMph?: number | null
  gpsHeadingThresholdMph?: number
} = {}): UseCompassResult {
  const [cardinal, setCardinal] = useState<Cardinal>("N")
  const [needsCalibration, setNeedsCalibration] = useState(false)
  const [rawHeadingState, setRawHeadingState] = useState<number | null>(null)

  const lastHeading = useRef<number | null>(null)
  const headingHandle = useRef<{ remove: () => Promise<void> } | null>(null)
  const accuracyHandle = useRef<{ remove: () => Promise<void> } | null>(null)
  const cancelled = useRef(false)

  // GPS course-over-ground doesn't depend on device sensors or screen
  // rotation, so it sidesteps the magnetometer's broken landscape behavior.
  // Only trust it above a speed threshold, where position-delta noise is
  // small relative to actual movement.
  const isUsingGps =
    speedMph != null && speedMph >= gpsHeadingThresholdMph && gpsHeading != null

  const isUsingGpsRef = useRef(false)
  useEffect(() => {
    isUsingGpsRef.current = isUsingGps
  }, [isUsingGps])

  const applyHeadingUpdate = useCallback((headingTrueNorth: number) => {
    if (lastHeading.current == null) {
      lastHeading.current = headingTrueNorth
      setRawHeadingState(headingTrueNorth)
      setCardinal((prev) => stableCardinal(prev, headingTrueNorth))
      return
    }

    const jump = angularDistance(lastHeading.current, headingTrueNorth)

    if (jump > 170) return

    const smoothed = smoothHeading(lastHeading.current, headingTrueNorth)

    lastHeading.current = smoothed
    setRawHeadingState(smoothed)
    setCardinal((prev) => stableCardinal(prev, smoothed))
  }, [])

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
        } catch {
          // Ignore cleanup errors from prior listeners.
        }

        await CapgoCompass.startListening()

        const h = await CapgoCompass.addListener(
          "headingChange",
          (event: HeadingChangeEvent) => {
            // While GPS heading is authoritative (moving above threshold),
            // ignore magnetometer updates entirely rather than blending —
            // blending a broken landscape reading back in would just
            // reintroduce the wrong-direction problem.
            if (isUsingGpsRef.current) return

            const raw = event?.value

            if (raw == null || !Number.isFinite(raw)) return

            const magneticHeading = normalizeHeadingDegrees(raw)
            const declinationCorrected = applyDeclination(
              magneticHeading,
              declination
            )

            applyHeadingUpdate(declinationCorrected)
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
        } catch {
          // Accuracy watching is optional; continue without it.
        }
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
        } catch {
          // Ignore listener removal failures during cleanup.
        }
        headingHandle.current = null

        try {
          if (accuracyHandle.current) await accuracyHandle.current.remove()
        } catch {
          // Ignore listener removal failures during cleanup.
        }
        accuracyHandle.current = null

        try {
          await CapgoCompass.stopListening()
        } catch {
          // Ignore stop failures during cleanup.
        }

        try {
          await CapgoCompass.unwatchAccuracy()
        } catch {
          // Ignore accuracy unwatch failures during cleanup.
        }
      })()
    }
  }, [declination, applyHeadingUpdate])

  // Feed GPS heading updates through the same smoothing/cardinal pipeline
  // whenever it's the active source.
  useEffect(() => {
    if (!isUsingGps || gpsHeading == null) return
    applyHeadingUpdate(normalizeHeadingDegrees(gpsHeading))
  }, [isUsingGps, gpsHeading, applyHeadingUpdate])

  return {
    cardinal,
    needsCalibration,
    rawHeading: rawHeadingState,
    headingSource: isUsingGps ? "gps" : "magnetometer",
  }
}