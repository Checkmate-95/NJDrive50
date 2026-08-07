import { useEffect, useState, useRef } from 'react'
import { CapgoCompass } from '@capgo/capacitor-compass'
import type { HeadingChangeEvent } from '@capgo/capacitor-compass'

function smoothHeading(prev: number, next: number, alpha = 0.15): number {
  const diff = ((next - prev + 540) % 360) - 180
  return Math.round((prev + alpha * diff + 360) % 360)
}

const CARDINAL_ZONES = {
  N: { min: 330, max: 30 },
  E: { min: 30, max: 150 },
  S: { min: 150, max: 210 },
  W: { min: 210, max: 330 }
} as const

function stableCardinal(prev: "N" | "E" | "S" | "W", heading: number): "N" | "E" | "S" | "W" {
  const pad = 10
  const zone = CARDINAL_ZONES[prev]

  if (prev === "N") {
    if (heading >= (zone.min - pad + 360) % 360 || heading <= zone.max + pad) {
      return "N"
    }
  } else {
    if (heading >= zone.min - pad && heading <= zone.max + pad) {
      return prev
    }
  }

  if (heading >= 330 || heading < 30) return "N"
  if (heading >= 30 && heading < 150) return "E"
  if (heading >= 150 && heading < 210) return "S"
  return "W"
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
        'headingChange',
        (event: HeadingChangeEvent) => {
          console.log("COMPASS EVENT:", event)

          const raw = (event as any).degree ?? (event as any).value ?? (event as any).heading
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
