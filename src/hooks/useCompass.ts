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
  const isUsingGpsRef = useRef(false)
  const isAccuracyPoorRef = useRef(false)

  // GPS course-over-ground does not depend on device sensors or screen
  // rotation, so prefer it while the device is moving fast enough.
  const isUsingGps =
    speedMph != null && speedMph >= gpsHeadingThresholdMph && gpsHeading != null

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

    // Treat a large difference as a valid re-acquisition after a period of
    // unavailable/poor sensor data rather than keeping a stale heading forever.
    if (jump > 170) {
      lastHeading.current = headingTrueNorth
      setRawHeadingState(headingTrueNorth)
      setCardinal((prev) => stableCardinal(prev, headingTrueNorth))
      return
    }

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

    let cancelled = false
    let headingHandle: { remove: () => Promise<void> } | null = null
    let accuracyHandle: { remove: () => Promise<void> } | null = null

    lastHeading.current = null
    isAccuracyPoorRef.current = false
    setNeedsCalibration(false)

    const setup = async () => {
      try {
        await CapgoCompass.startListening()

        const h = await CapgoCompass.addListener(
          "headingChange",
          (event: HeadingChangeEvent) => {
            // GPS course is authoritative while driving above the threshold.
            if (isUsingGpsRef.current) return

            // Hold the last valid heading rather than applying sensor input
            // Android reports as LOW or UNRELIABLE.
            if (isAccuracyPoorRef.current) return

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

        if (cancelled) {
          await h.remove()
          return
        }

        headingHandle = h

        try {
          await CapgoCompass.watchAccuracy()

          const a = await CapgoCompass.addListener(
            "accuracyChange",
            (event: AccuracyChangeEvent) => {
              const poor =
                event.accuracy === CompassAccuracy.LOW ||
                event.accuracy === CompassAccuracy.UNRELIABLE

              isAccuracyPoorRef.current = poor
              setNeedsCalibration(poor)
            }
          )

          if (cancelled) {
            await a.remove()
            return
          }

          accuracyHandle = a
        } catch {
          // Accuracy monitoring is optional; keep normal heading behavior if
          // this feature is unavailable on the current platform/plugin build.
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Compass setup failed:", error)
        }
      }
    }

    void setup()

    return () => {
      cancelled = true

      void (async () => {
        try {
          if (headingHandle) await headingHandle.remove()
        } catch {
          // Ignore listener cleanup failures.
        }
        headingHandle = null

        try {
          if (accuracyHandle) await accuracyHandle.remove()
        } catch {
          // Ignore listener cleanup failures.
        }
        accuracyHandle = null
      })()
    }
  }, [declination, applyHeadingUpdate])

  // Feed GPS heading through the same smoothing/cardinal pipeline whenever it
  // is the active source.
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