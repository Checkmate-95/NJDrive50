import { useEffect, useState, useRef } from "react"
import { CapgoCompass } from "@capgo/capacitor-compass"
import type { HeadingChangeEvent } from "@capgo/capacitor-compass"

// Smooth heading with wrap‑around handling
function smoothHeading(prev: number, next: number, alpha = 0.25): number {
  const diff = ((next - prev + 540) % 360) - 180
  return Math.round((prev + alpha * diff + 360) % 360)
}

// Tighter, more realistic cardinal zones
const CARDINAL_ZONES = {
  N: { min: 350, max: 10 },
  E: { min: 80, max: 100 },
  S: { min: 170, max: 190 },
  W: { min: 260, max: 280 }
} as const

// Stable cardinal direction selection
function stableCardinal(prev: "N" | "E" | "S" | "W", heading: number): "N" | "E" | "S" | "W" {
  const pad = 12
  const zone = CARDINAL_ZONES[prev]

  // Handle wrap-around for North
  if (prev === "N") {
    if (heading >= (zone.min - pad + 360) % 360 || heading <= zone.max + pad) {
      return "N"
    }
  } else {
    if (heading >= zone.min - pad && heading <= zone.max + pad) {
      return prev
    }
  }

  // Fresh direction detection
  if (heading >= 350 || heading < 10) return "N"
  if (heading >= 80 && heading < 100) return "E"
  if (heading >= 170 && heading < 190) return "S"
  if (heading >= 260 && heading < 280) return "W"

  // Fallback (should never hit)
  return prev
}

export function useCompass() {
  const [cardinal, setCardinal] = useState<"N" | "E" | "S" | "W">("N")
  const lastHeading = useRef(0)

  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | undefined
    let cancelled = false

    const setup = async () => {
      await CapgoCompass.startListening()

      const handle = await CapgoCompass.addListener(
        "headingChange",
        (event: HeadingChangeEvent) => {
          console.log("COMPASS EVENT:", event)

          // Correct field — CapgoCompass uses ONLY event.value
          const raw = event.value

          const smoothed = smoothHeading(lastHeading.current, raw)
          lastHeading.current = smoothed

          setCardinal(prev => stableCardinal(prev, smoothed))
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
