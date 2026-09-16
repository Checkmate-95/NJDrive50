import { useCallback, useEffect, useRef, useState } from "react"

const SNAP_THRESHOLD_MPH = 0.05

// Derive animation response from the actual interval between raw GPS-speed
// updates. This keeps the UI smooth when a request takes longer than the
// nominal live-poll interval or when an in-flight request causes a poll skip.
const MIN_GAP_SECONDS = 0.4
const MAX_GAP_SECONDS = 3.0
const CONVERGENCE_TIME_CONSTANTS = 3

// Let the speedometer fall more quickly than it rises so stops and
// deceleration feel responsive while acceleration remains smooth.
const DECELERATION_RESPONSE_MULTIPLIER = 1.8

function useSmoothedSpeed(rawSpeed: number | null) {
  const isValidSpeed =
    rawSpeed != null && Number.isFinite(rawSpeed) && rawSpeed >= 0

  const [animatedSpeed, setAnimatedSpeed] = useState<number>(
    isValidSpeed ? rawSpeed : 0
  )

  const rawSpeedRef = useRef<number | null>(rawSpeed)
  const frameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const lastRawUpdateAtRef = useRef<number | null>(null)

  const accelResponsePerSecondRef = useRef(
    CONVERGENCE_TIME_CONSTANTS / MAX_GAP_SECONDS
  )

  const step = useCallback((timestamp: number) => {
    const target = rawSpeedRef.current

    if (target == null || !Number.isFinite(target) || target < 0) {
      frameRef.current = null
      lastFrameTimeRef.current = null
      return
    }

    const previousFrameTime = lastFrameTimeRef.current ?? timestamp

    // Avoid a giant visual jump if the web view was paused or resumed
    // between animation frames.
    const elapsedSeconds = Math.min(
      Math.max((timestamp - previousFrameTime) / 1_000, 0),
      0.25
    )

    lastFrameTimeRef.current = timestamp

    let shouldContinue = true

    setAnimatedSpeed((previous) => {
      if (!Number.isFinite(previous)) {
        shouldContinue = false
        return target
      }

      const responsePerSecond =
        target < previous
          ? accelResponsePerSecondRef.current *
            DECELERATION_RESPONSE_MULTIPLIER
          : accelResponsePerSecondRef.current

      // Time-based, frame-rate-independent exponential smoothing.
      const blend = 1 - Math.exp(-responsePerSecond * elapsedSeconds)
      const next = previous + (target - previous) * blend

      if (Math.abs(target - next) < SNAP_THRESHOLD_MPH) {
        shouldContinue = false
        return target
      }

      return next
    })

    frameRef.current = shouldContinue ? requestAnimationFrame(step) : null
  }, [])

  // Update the raw target and calculate the response rate from the actual
  // time between speed updates. A currently running rAF loop reads these
  // refs on its next frame, so it retargets without a visual interruption.
  // If it previously converged and stopped, restart it for the new sample.
  useEffect(() => {
    rawSpeedRef.current = rawSpeed

    if (!isValidSpeed) {
      lastRawUpdateAtRef.current = null
      return
    }

    const now = performance.now()

    const measuredGapSeconds =
      lastRawUpdateAtRef.current === null
        ? MAX_GAP_SECONDS
        : (now - lastRawUpdateAtRef.current) / 1_000

    const clampedGapSeconds = Math.min(
      MAX_GAP_SECONDS,
      Math.max(MIN_GAP_SECONDS, measuredGapSeconds)
    )

    accelResponsePerSecondRef.current =
      CONVERGENCE_TIME_CONSTANTS / clampedGapSeconds

    lastRawUpdateAtRef.current = now

    if (frameRef.current === null) {
      lastFrameTimeRef.current = null
      frameRef.current = requestAnimationFrame(step)
    }
  }, [rawSpeed, isValidSpeed, step])

  // Start the animation after an invalid-to-valid transition and stop it
  // cleanly when the source no longer provides a usable speed. The display
  // intentionally returns to 0 mph rather than retaining a stale number.
  useEffect(() => {
    if (!isValidSpeed) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      lastFrameTimeRef.current = null
      setAnimatedSpeed(0)
      return
    }

    if (frameRef.current === null) {
      lastFrameTimeRef.current = null
      frameRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      lastFrameTimeRef.current = null
    }
  }, [isValidSpeed, step])

  return animatedSpeed
}

export { useSmoothedSpeed }