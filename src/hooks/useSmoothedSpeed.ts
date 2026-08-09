import { useState, useEffect } from "react"

function useSmoothedSpeed(rawSpeed: number | null, smoothingFactor = 0.18) {
  const [smoothSpeed, setSmoothSpeed] = useState<number | null>(rawSpeed)

  useEffect(() => {
    // If GPS speed is missing or invalid → show "--"
    if (rawSpeed === null || Number.isNaN(rawSpeed)) {
      setSmoothSpeed(null)
      return
    }

    setSmoothSpeed((prev: number | null) => {
      // If previous value was null → snap immediately to raw speed
      if (prev === null || Number.isNaN(prev)) return rawSpeed

      // Exponential smoothing (UI-only)
      return prev + smoothingFactor * (rawSpeed - prev)
    })
  }, [rawSpeed, smoothingFactor])

  return smoothSpeed
}

export { useSmoothedSpeed }
