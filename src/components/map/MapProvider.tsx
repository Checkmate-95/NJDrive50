// src/components/map/MapProvider.tsx
// TRUST‑CORRECTED + UNIFIED LIBRARIES VERSION

import { MapContext } from "./MapContext"
import type { ReactNode } from "react"
import { useJsApiLoader } from "@react-google-maps/api"


// Unified libraries — this MUST include everything the entire app needs.
// This prevents the fatal "Loader must not be called again with different options" error.
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]

type MapProviderProps = {
  children: ReactNode
}

export const MapProvider = ({ children }: MapProviderProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  // Surface missing key in dev
  if (!apiKey && import.meta.env.DEV) {
    console.error(
      "[MapProvider] VITE_GOOGLE_MAPS_API_KEY is not set. " +
      "Add it to your .env file."
    )
  }

  // Never pass undefined to useJsApiLoader
  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/10 text-red-500 text-sm">
        Map unavailable — API key not configured.
      </div>
    )
  }

  return <MapProviderInner apiKey={apiKey}>{children}</MapProviderInner>
}

const MapProviderInner = ({
  apiKey,
  children,
}: {
  apiKey: string
  children: ReactNode
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES, // unified + stable reference
  })

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-white/10 text-[#0A1E5E]/60 text-sm">
        Loading map…
      </div>
    )
  }

  return (
    <MapContext.Provider value={{ isLoaded }}>
      {children}
    </MapContext.Provider>
  )
}
