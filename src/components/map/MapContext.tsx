import { createContext, useContext } from "react"

type MapContextValue = {
  isLoaded: boolean
}

export const MapContext = createContext<MapContextValue | null>(null)

export const useMapContext = () => {
  const ctx = useContext(MapContext)
  if (!ctx) {
    throw new Error("useMapContext must be used inside <MapProvider>")
  }
  return ctx
}
