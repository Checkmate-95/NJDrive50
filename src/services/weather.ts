// src/services/weather.ts

export type WeatherResponse = {
  tempF: number | null
  updatedAt: number
}

const FETCH_TIMEOUT_MS = 8000

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

  const apiKey = process.env.EXPO_PUBLIC_WEATHER_KEY
  if (!apiKey) {
    console.warn("Missing EXPO_PUBLIC_WEATHER_KEY")
    return { tempF: null, updatedAt: Date.now() }
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
  const { signal, cancel } = withTimeout(FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal })

    if (!res.ok) {
      console.warn("Weather request failed:", res.status)
      return { tempF: null, updatedAt: Date.now() }
    }

    const data = await res.json()

    return {
      tempF: typeof data.main?.temp === "number" ? data.main.temp : null,
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
