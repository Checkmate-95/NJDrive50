// src/components/map/MapProvider.tsx
import type { ReactNode } from "react"
import { useMemo } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import { MapContext } from "./MapContext"

const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"]

type MapProviderProps = {
  children: ReactNode
}

type MapProviderInnerProps = {
  apiKey: string
  children: ReactNode
}

export const MapProvider = ({ children }: MapProviderProps) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  if (!apiKey && import.meta.env.DEV) {
    console.error(
      "[MapProvider] VITE_GOOGLE_MAPS_API_KEY is not set. Add it to your .env file."
    )
  }

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/10 px-4 text-center text-sm text-red-500">
        Map unavailable — API key not configured.
      </div>
    )
  }

  return <MapProviderInner apiKey={apiKey}>{children}</MapProviderInner>
}

const MapProviderInner = ({ apiKey, children }: MapProviderInnerProps) => {
  const loaderOptions = useMemo(
    () => ({
      googleMapsApiKey: apiKey,
      libraries: LIBRARIES,
      version: "weekly", // ⭐ FORCE NEW PLACES API
    }),
    [apiKey]
  )

  const { isLoaded, loadError } = useJsApiLoader(loaderOptions)

  const contextValue = useMemo(
    () => ({
      isLoaded,
    }),
    [isLoaded]
  )

  if (loadError) {
    if (import.meta.env.DEV) {
      console.error("[MapProvider] Failed to load Google Maps API:", loadError)
    }

    return (
      <div className="flex h-full w-full items-center justify-center bg-white/10 px-4 text-center text-sm text-red-500">
        Map unavailable — failed to load Google Maps.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white/10 text-sm text-[#0A1E5E]/60">
        Loading map…
      </div>
    )
  }

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  )
}
