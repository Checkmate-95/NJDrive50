import { useEffect, useRef, useState } from "react"

const SNAP_THRESHOLD = 0.05

function useSmoothedSpeed(
  rawSpeed: number | null,
  smoothingFactor = 0.18
) {
  const isValidSpeed =
    rawSpeed != null && Number.isFinite(rawSpeed) && rawSpeed >= 0

  const [animatedSpeed, setAnimatedSpeed] = useState<number | null>(
    isValidSpeed ? rawSpeed : null
  )
  const rawSpeedRef = useRef(rawSpeed)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    rawSpeedRef.current = rawSpeed
  }, [rawSpeed])

  useEffect(() => {
    if (!isValidSpeed) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      return
    }

    const step = () => {
      const target = rawSpeedRef.current

      if (target == null || Number.isNaN(target) || target < 0) {
        frameRef.current = null
        return
      }

      let shouldContinue = true

      setAnimatedSpeed((prev) => {
        if (prev == null || Number.isNaN(prev)) {
          return target
        }

        const next = prev + smoothingFactor * (target - prev)

        if (Math.abs(target - next) < SNAP_THRESHOLD) {
          shouldContinue = false
          return target
        }

        return next
      })

      frameRef.current = shouldContinue
        ? requestAnimationFrame(step)
        : null
    }

    if (frameRef.current === null) {
      frameRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [isValidSpeed, rawSpeed, smoothingFactor])

  return isValidSpeed ? animatedSpeed : null
}

export { useSmoothedSpeed }