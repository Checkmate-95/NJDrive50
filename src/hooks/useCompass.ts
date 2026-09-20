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
//
// Lowered from 5 -> 2 mph: at 5 mph, the compass was staying on the
// magnetometer path for a wider low-speed band, which meant a poor-
// accuracy magnetometer reading (common on a magnetic phone mount) had
// more opportunity to freeze the heading before GPS course-over-ground
// became authoritative. 2 mph is close to the floor where GPS heading is
// still meaningfully accurate; below it, position noise dominates and we
// still need the magnetometer path (see the LOW/UNRELIABLE handling below
// for how that path now behaves while stationary).
const DEFAULT_GPS_HEADING_THRESHOLD_MPH = 2
 
// Default smoothing factor for a normal-accuracy magnetometer reading or a
// GPS heading update.
const DEFAULT_SMOOTHING_ALPHA = 0.4
 
// Smoothing factor used for magnetometer readings while accuracy is LOW.
// Much heavier smoothing than normal so a noisy/degraded reading doesn't
// visibly swing the needle — this keeps the compass responsive instead of
// fully frozen while stationary/idle on a magnetic mount, without acting on
// a single bad sample at full strength. UNRELIABLE readings are still
// blocked outright below; this only softens the LOW tier.
const LOW_ACCURACY_SMOOTHING_ALPHA = 0.12
 
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
  alpha = DEFAULT_SMOOTHING_ALPHA
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
 
  // Tracks the raw accuracy enum (not just a poor/not-poor boolean) so the
  // heading listener can tell LOW apart from UNRELIABLE and treat them
  // differently — see applyHeadingUpdate's alpha argument below.
  const accuracyRef = useRef<CompassAccuracy | null>(null)
 
  // GPS course-over-ground does not depend on device sensors or screen
  // rotation, so prefer it while the device is moving fast enough.
  const isUsingGps =
    speedMph != null && speedMph >= gpsHeadingThresholdMph && gpsHeading != null
 
  useEffect(() => {
    isUsingGpsRef.current = isUsingGps
  }, [isUsingGps])
 
  const applyHeadingUpdate = useCallback(
    (headingTrueNorth: number, alpha: number = DEFAULT_SMOOTHING_ALPHA) => {
      if (lastHeading.current == null) {
        lastHeading.current = headingTrueNorth
        setRawHeadingState(headingTrueNorth)
        setCardinal((prev) => stableCardinal(prev, headingTrueNorth))
        return
      }
 
      const jump = angularDistance(lastHeading.current, headingTrueNorth)
 
      // Treat a large difference as a valid re-acquisition after a period of
      // unavailable/poor sensor data rather than keeping a stale heading
      // forever.
      if (jump > 170) {
        lastHeading.current = headingTrueNorth
        setRawHeadingState(headingTrueNorth)
        setCardinal((prev) => stableCardinal(prev, headingTrueNorth))
        return
      }
 
      const smoothed = smoothHeading(lastHeading.current, headingTrueNorth, alpha)
 
      lastHeading.current = smoothed
      setRawHeadingState(smoothed)
      setCardinal((prev) => stableCardinal(prev, smoothed))
    },
    []
  )
 
  useEffect(() => {
    if (Capacitor.getPlatform() === "web") {
      console.warn("Compass not available on web")
      return
    }
 
    let cancelled = false
    let headingHandle: { remove: () => Promise<void> } | null = null
    let accuracyHandle: { remove: () => Promise<void> } | null = null
 
    lastHeading.current = null
    accuracyRef.current = null
    setNeedsCalibration(false)
 
    const setup = async () => {
      try {
        await CapgoCompass.startListening()
 
        const h = await CapgoCompass.addListener(
          "headingChange",
          (event: HeadingChangeEvent) => {
            // GPS course is authoritative while driving above the threshold.
            if (isUsingGpsRef.current) return
 
            // UNRELIABLE means the sensor data isn't usable at all — hold
            // the last valid heading rather than acting on it, same as
            // before. LOW is handled further down: it's degraded but not
            // garbage, so we let it through with much heavier smoothing
            // instead of freezing completely.
            if (accuracyRef.current === CompassAccuracy.UNRELIABLE) return
 
            const raw = event?.value
            if (raw == null || !Number.isFinite(raw)) return
 
            const magneticHeading = normalizeHeadingDegrees(raw)
            const declinationCorrected = applyDeclination(
              magneticHeading,
              declination
            )
 
            const alpha =
              accuracyRef.current === CompassAccuracy.LOW
                ? LOW_ACCURACY_SMOOTHING_ALPHA
                : DEFAULT_SMOOTHING_ALPHA
 
            applyHeadingUpdate(declinationCorrected, alpha)
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
              accuracyRef.current = event.accuracy
 
              const poor =
                event.accuracy === CompassAccuracy.LOW ||
                event.accuracy === CompassAccuracy.UNRELIABLE
 
              // Both LOW and UNRELIABLE still surface the calibration
              // warning — the heading softening/blocking above changes how
              // much we act on the data, not whether the person is told
              // accuracy is degraded.
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
 