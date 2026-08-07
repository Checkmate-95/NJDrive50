// src/hooks/useCompass.ts
import { useEffect, useState, useRef } from 'react'
import { CapgoCompass } from '@capgo/capacitor-compass'

function smoothHeading(prev: number, next: number, alpha = 0.15): number {
  const diff = ((next - prev + 540) % 360) - 180
  return Math.round((prev + alpha * diff + 360) % 360)
}

export function useCompass() {
  const [heading, setHeading] = useState(0)
  const lastHeading = useRef(0)

  useEffect(() => {
    let listenerHandle: { remove: () => void } | undefined

    const setup = async () => {
      await CapgoCompass.startListening()
      const listener = await CapgoCompass.addListener('headingChange', (event) => {
        const smoothed = smoothHeading(lastHeading.current, event.value)
        lastHeading.current = smoothed
        setHeading(smoothed)
      })
      listenerHandle = listener
    }

    setup()

    return () => {
      listenerHandle?.remove()
      CapgoCompass.stopListening()
    }
  }, [])

  return heading
}