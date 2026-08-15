import { useEffect, useRef, useState } from "react"

// Snap when we're extremely close to the target speed.
// Prevents infinite asymptotic smoothing.
const SNAP_THRESHOLD = 0.05 // mph

function useSmoothedSpeed(
  rawSpeed: number | null,
  smoothingFactor = 0.18
) {
  const [smoothSpeed, setSmoothSpeed] = useState<number | null>(rawSpeed)

  // Latest raw speed (kept in a ref so animation loop always sees newest value)
  const rawSpeedRef = useRef(rawSpeed)

  // Animation frame ID
  const frameRef = useRef<number | null>(null)

  // Always keep the ref updated
  rawSpeedRef.current = rawSpeed

  useEffect(() => {
    // Treat null, NaN, and negative speed (GPS invalid sentinel) as unavailable
    if (rawSpeed == null || Number.isNaN(rawSpeed) || rawSpeed < 0) {
      setSmoothSpeed(null)

      // Stop animation loop immediately
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      return
    }

    const step = () => {
      const target = rawSpeedRef.current

      // If target becomes invalid mid-animation, stop
      if (target == null || Number.isNaN(target) || target < 0) {
        frameRef.current = null
        return
      }

      setSmoothSpeed((prev) => {
        // If previous value was null, snap immediately
        if (prev == null || Number.isNaN(prev)) return target

        // Exponential smoothing toward target
        const next = prev + smoothingFactor * (target - prev)

        // Snap when extremely close to avoid infinite tiny updates
        if (Math.abs(target - next) < SNAP_THRESHOLD) return target

        return next
      })

      // Continue animation loop
      frameRef.current = requestAnimationFrame(step)
    }

    // Start animation loop if not already running
    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(step)
    }

    // Cleanup on unmount or rawSpeed change
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [rawSpeed, smoothingFactor])

  return smoothSpeed
}

export { useSmoothedSpeed }
