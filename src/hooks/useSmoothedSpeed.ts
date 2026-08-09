import { useState, useEffect } from "react"

function useSmoothedSpeed(rawSpeed: number | null, smoothingFactor = 0.25) {
  const [smoothSpeed, setSmoothSpeed] = useState<number | null>(rawSpeed)

  useEffect(() => {
    if (typeof rawSpeed !== "number" || Number.isNaN(rawSpeed)) {
      setSmoothSpeed(null)
      return
    }

    setSmoothSpeed((prev: number | null) => {
      if (prev === null || Number.isNaN(prev)) return rawSpeed
      return prev + smoothingFactor * (rawSpeed - prev)
    })
  }, [rawSpeed, smoothingFactor])

  return smoothSpeed
}

export { useSmoothedSpeed }