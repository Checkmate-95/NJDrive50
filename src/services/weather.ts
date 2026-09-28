// src/services/weather.ts
// Weather goes through the NJDrive50 server so the OpenWeather API key never ships in the app.

export type WeatherResponse = {
  tempF: number | null
  updatedAt: number
}

const FETCH_TIMEOUT_MS = 8000

// Optional override for local testing (e.g. http://localhost:3000/api/weather).
const WEATHER_ENDPOINT =
  (import.meta.env.VITE_WEATHER_ENDPOINT as string | undefined) || "https://www.njdrive50.com/api/weather"

// About 1 km precision: enough for current temperature, and no precise GPS leaves the device.
function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100
}

function withTimeout(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeoutId) }
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherResponse> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    console.warn("Weather request skipped: invalid coordinates", { lat, lon })
    return { tempF: null, updatedAt: Date.now() }
  }

  const url = `${WEATHER_ENDPOINT}?lat=${roundCoordinate(lat)}&lon=${roundCoordinate(lon)}`
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal })

    if (!res.ok) {
      console.warn("Weather request failed:", res.status)
      return { tempF: null, updatedAt: Date.now() }
    }

    const data: unknown = await res.json()
    const tempF =
      data && typeof data === "object" && typeof (data as { tempF?: unknown }).tempF === "number"
        ? (data as { tempF: number }).tempF
        : null

    return {
      tempF: tempF !== null && Number.isFinite(tempF) ? tempF : null,
      updatedAt: Date.now(),
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn("Weather request timed out")
    } else {
      console.warn("Weather request error:", err)
    }
    return { tempF: null, updatedAt: Date.now() }
  } finally {
    cancel()
  }
}