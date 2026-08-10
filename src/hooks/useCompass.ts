import { useEffect, useState, useRef } from "react"
import { Capacitor } from "@capacitor/core"
import { CapgoCompass } from "@capgo/capacitor-compass"
import type { HeadingChangeEvent } from "@capgo/capacitor-compass"

// Smooth heading with wrap‑around handling
function smoothHeading(prev: number, next: number, alpha = 0.25): number {
  const diff = ((next - prev + 540) % 360) - 180
  return Math.round((prev + alpha * diff + 360) % 360)
}

type Cardinal = "N" | "E" | "S" | "W"

const CENTERS: Record<Cardinal, number> = {
  N: 0,
  E: 90,
  S: 180,
  W: 270,
}

// Distance between two headings on a 360° circle, always 0-180
function angularDistance(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180)
}

// Stable cardinal direction selection — full circle coverage, no dead zones,
// with hysteresis so the label doesn't flicker near quadrant boundaries
function stableCardinal(prev: Cardinal, heading: number): Cardinal {
  const pad = 15 // degrees of hysteresis before switching away from current direction
  const baseHalfWidth = 45 // each quadrant covers 90° total (45° each side of center)

  // Current direction gets a wider zone before we let go of it
  if (angularDistance(CENTERS[prev], heading) <= baseHalfWidth + pad) {
    return prev
  }

  // Heading has clearly left the current quadrant — find the nearest actual quadrant
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

export function useCompass() {
  const [cardinal, setCardinal] = useState<Cardinal>("N")
  const lastHeading = useRef(0)

  useEffect(() => {
    // 🚨 Prevent plugin from running on web
    if (Capacitor.getPlatform() === "web") {
      console.warn("Compass not available on web")
      return
    }

    let listenerHandle: { remove: () => Promise<void> } | undefined
    let cancelled = false

    const setup = async () => {
      await CapgoCompass.startListening()

      const handle = await CapgoCompass.addListener(
        "headingChange",
        (event: HeadingChangeEvent) => {
          const raw = event.value
          const smoothed = smoothHeading(lastHeading.current, raw)
          lastHeading.current = smoothed
          setCardinal((prev) => stableCardinal(prev, smoothed))
        }
      )

      if (!cancelled) listenerHandle = handle
      else handle.remove()
    }

    setup()

    return () => {
      cancelled = true
      listenerHandle?.remove()
      CapgoCompass.stopListening()
    }
  }, [])

  return cardinal
}