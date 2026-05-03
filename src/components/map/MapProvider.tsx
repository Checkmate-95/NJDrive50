// src/components/map/MapProvider.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  libraries array moved to module-level constant — a new array
//          literal on every render causes useJsApiLoader to reload the
//          Google Maps script repeatedly, triggering the LoadScript
//          performance warning and potential double-load on Android Capacitor
// [FIX-2]  apiKey guarded — missing VITE_GOOGLE_MAPS_API_KEY surfaces as a
//          dev console error and a user-visible fallback instead of silently
//          passing undefined to useJsApiLoader and producing a blank map

import type { ReactNode } from "react"
import { useJsApiLoader } from "@react-google-maps/api"

// [FIX-1] Defined outside the component so the reference is stable across
// renders — useJsApiLoader uses referential equality to decide whether to
// reload the script. An inline array literal fails that check every time.
const LIBRARIES: ("geometry")[] = ["geometry"]

type MapProviderProps = {
  children: ReactNode
}

export const MapProvider = ({ children }: MapProviderProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  // [FIX-2] Surface missing key in dev so it's caught immediately
  if (!apiKey && import.meta.env.DEV) {
    console.error(
      "[MapProvider] VITE_GOOGLE_MAPS_API_KEY is not set. " +
      "Add it to your .env file."
    )
  }

  // [FIX-2] Bail early with a clear message — never pass undefined to useJsApiLoader
  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/10 text-red-500 text-sm">
        Map unavailable — API key not configured.
      </div>
    )
  }

  return <MapProviderInner apiKey={apiKey}>{children}</MapProviderInner>
}

// Inner component receives a guaranteed non-undefined apiKey so
// useJsApiLoader is never called with an undefined value.
const MapProviderInner = ({
  apiKey,
  children,
}: {
  apiKey: string
  children: ReactNode
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES, // [FIX-1] stable reference
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#0A1E5E]/60 text-sm">
        Loading map…
      </div>
    )
  }

  return <>{children}</>
}