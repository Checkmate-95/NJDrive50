import { useEffect, useState, useRef } from 'react'
import { CapgoCompass } from '@capgo/capacitor-compass'
import type { HeadingChangeEvent } from '@capgo/capacitor-compass'

function smoothHeading(prev: number, next: number, alpha = 0.15): number {
  const diff = ((next - prev + 540) % 360) - 180
  return Math.round((prev + alpha * diff + 360) % 360)
}

function cardinalFromHeading(heading: number): "N" | "E" | "S" | "W" {
  if (heading >= 315 || heading < 45) return "N"
  if (heading >= 45 && heading < 135) return "E"
  if (heading >= 135 && heading < 225) return "S"
  return "W"
}

export function useCompass() {
  const [heading, setHeading] = useState<"N" | "E" | "S" | "W">("N")
  const lastHeading = useRef(0)

  useEffect(() => {
    let listenerHandle: { remove: () => Promise<void> } | undefined
    let cancelled = false

    const setup = async () => {
      await CapgoCompass.startListening()
      const handle = await CapgoCompass.addListener(
        'headingChange',
        (event: HeadingChangeEvent) => {
          const raw = event.value
          const smoothed = smoothHeading(lastHeading.current, raw)
          lastHeading.current = smoothed
          setHeading(cardinalFromHeading(smoothed))
        }
      )
      if (!cancelled) {
        listenerHandle = handle
      } else {
        handle.remove()
      }
    }

    setup()

    return () => {
      cancelled = true
      listenerHandle?.remove()
      CapgoCompass.stopListening()
    }
  }, [])

  return heading
}