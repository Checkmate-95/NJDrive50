import { useCallback, useEffect, useRef, useState } from "react"
import { Capacitor } from "@capacitor/core"
import {
  CapgoCompass,
  CompassAccuracy,
  type AccuracyChangeEvent,
  type HeadingChangeEvent,
} from "@capgo/capacitor-compass"

// New Jersey is roughly 13° west of true north.
// Magnetic north is west of geographic/true north here, so this correction
// is negative: true heading = magnetic heading + (-13°).
const DEFAULT_DECLINATION = -13

// Below this speed, GPS course-over-ground is unreliable because position
// noise dominates. Above it, GPS heading is preferred because it is not
// affected by a magnetic phone mount, vehicle metal, chargers, or magnets.
const DEFAULT_GPS_HEADING_THRESHOLD_MPH = 2

// Normal smoothing for stationary/slow-speed magnetometer readings.
const MAGNETOMETER_SMOOTHING_ALPHA = 0.4

// GPS course updates are expected around once per second. Use a stronger
// response so turns feel prompt rather than lagging behind the vehicle.
const GPS_SMOOTHING_ALPHA = 0.7

// LOW magnetometer accuracy is degraded but not necessarily unusable.
// Heavier smoothing avoids dramatic swings from noisy readings.
const LOW_ACCURACY_SMOOTHING_ALPHA = 0.12

type Cardinal = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW"

const CENTERS: Record<Cardinal, number> = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315,
}

function normalizeHeadingDegrees(value: number): number {
  return ((value % 360) + 360) % 360
}

function angularDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

function smoothHeading(
  previous: number | null,
  next: number,
  alpha = MAGNETOMETER_SMOOTHING_ALPHA
): number {
  if (previous === null) return next

  // Take the shortest circular path. For example, 359° → 1° moves forward
  // by 2°, rather than incorrectly rotating backward by 358°.
  const difference = ((next - previous + 540) % 360) - 180

  return normalizeHeadingDegrees(previous + alpha * difference)
}

function applyDeclination(
  magneticHeading: number,
  declinationDegrees: number
): number {
  return normalizeHeadingDegrees(magneticHeading + declinationDegrees)
}

function stableCardinal(previous: Cardinal, heading: number): Cardinal {
  // Eight equal sectors: 45° each, with a 22.5° base half-width.
  // Add a small 4° hysteresis buffer to prevent label flicker near borders.
  const baseHalfWidth = 22.5
  const hysteresisPadding = 4

  if (
    angularDistance(CENTERS[previous], heading) <=
    baseHalfWidth + hysteresisPadding
  ) {
    return previous
  }

  let closest: Cardinal = previous
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

  const lastHeadingRef = useRef<number | null>(null)
  const isUsingGpsRef = useRef(false)
  const accuracyRef = useRef<CompassAccuracy | null>(null)

  // GPS course-over-ground becomes the heading source while the car moves.
  const isUsingGps =
    speedMph !== null &&
    Number.isFinite(speedMph) &&
    speedMph >= gpsHeadingThresholdMph &&
    gpsHeading !== null &&
    Number.isFinite(gpsHeading)

  useEffect(() => {
    isUsingGpsRef.current = isUsingGps
  }, [isUsingGps])

  const applyHeadingUpdate = useCallback(
    (
      headingTrueNorth: number,
      alpha: number = MAGNETOMETER_SMOOTHING_ALPHA
    ) => {
      const normalizedHeading = normalizeHeadingDegrees(headingTrueNorth)

      if (lastHeadingRef.current === null) {
        lastHeadingRef.current = normalizedHeading
        setRawHeadingState(normalizedHeading)
        setCardinal((previous) =>
          stableCardinal(previous, normalizedHeading)
        )
        return
      }

      const jump = angularDistance(lastHeadingRef.current, normalizedHeading)

      // A very large difference usually indicates a valid reacquisition
      // after unavailable/poor sensor data. Snap to it rather than retaining
      // a stale direction for several updates.
      if (jump > 170) {
        lastHeadingRef.current = normalizedHeading
        setRawHeadingState(normalizedHeading)
        setCardinal((previous) =>
          stableCardinal(previous, normalizedHeading)
        )
        return
      }

      const smoothedHeading = smoothHeading(
        lastHeadingRef.current,
        normalizedHeading,
        alpha
      )

      lastHeadingRef.current = smoothedHeading
      setRawHeadingState(smoothedHeading)
      setCardinal((previous) =>
        stableCardinal(previous, smoothedHeading)
      )
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

    lastHeadingRef.current = null
    accuracyRef.current = null
    setNeedsCalibration(false)

    const setupCompass = async () => {
      try {
        await CapgoCompass.startListening()

        const headingListener = await CapgoCompass.addListener(
          "headingChange",
          (event: HeadingChangeEvent) => {
            // GPS course-over-ground is authoritative while driving.
            if (isUsingGpsRef.current) return

            // Do not use completely unreliable magnetometer readings.
            if (accuracyRef.current === CompassAccuracy.UNRELIABLE) {
              return
            }

            const rawHeading = event?.value

            if (
              rawHeading === null ||
              rawHeading === undefined ||
              !Number.isFinite(rawHeading)
            ) {
              return
            }

            const magneticHeading = normalizeHeadingDegrees(rawHeading)
            const trueHeading = applyDeclination(
              magneticHeading,
              declination
            )

            const smoothingAlpha =
              accuracyRef.current === CompassAccuracy.LOW
                ? LOW_ACCURACY_SMOOTHING_ALPHA
                : MAGNETOMETER_SMOOTHING_ALPHA

            applyHeadingUpdate(trueHeading, smoothingAlpha)
          }
        )

        if (cancelled) {
          await headingListener.remove()
          return
        }

        headingHandle = headingListener

        try {
          await CapgoCompass.watchAccuracy()

          const accuracyListener = await CapgoCompass.addListener(
            "accuracyChange",
            (event: AccuracyChangeEvent) => {
              accuracyRef.current = event.accuracy

              const accuracyIsPoor =
                event.accuracy === CompassAccuracy.LOW ||
                event.accuracy === CompassAccuracy.UNRELIABLE

              setNeedsCalibration(accuracyIsPoor)
            }
          )

          if (cancelled) {
            await accuracyListener.remove()
            return
          }

          accuracyHandle = accuracyListener
        } catch {
          // Accuracy monitoring is optional. Normal heading updates still
          // work if it is unavailable on the device/plugin version.
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Compass setup failed:", error)
        }
      }
    }

    void setupCompass()

    return () => {
      cancelled = true

      void (async () => {
        try {
          if (headingHandle) {
            await headingHandle.remove()
          }
        } catch {
          // Ignore listener cleanup failures.
        }

        headingHandle = null

        try {
          if (accuracyHandle) {
            await accuracyHandle.remove()
          }
        } catch {
          // Ignore listener cleanup failures.
        }

        accuracyHandle = null

        try {
          await CapgoCompass.stopListening()
        } catch {
          // Ignore sensor shutdown failures.
        }
      })()
    }
  }, [applyHeadingUpdate, declination])

  // Feed GPS course through the same cardinal/hysteresis pipeline while GPS
  // is active. GPS gets a higher alpha so turns respond promptly.
  useEffect(() => {
    if (
      !isUsingGps ||
      gpsHeading === null ||
      !Number.isFinite(gpsHeading)
    ) {
      return
    }

    applyHeadingUpdate(
      normalizeHeadingDegrees(gpsHeading),
      GPS_SMOOTHING_ALPHA
    )
  }, [applyHeadingUpdate, gpsHeading, isUsingGps])

  return {
    cardinal,
    needsCalibration,
    rawHeading: rawHeadingState,
    headingSource: isUsingGps ? "gps" : "magnetometer",
  }
}