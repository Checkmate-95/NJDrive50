// src/services/weather.ts

export type WeatherResponse = {
  tempF: number | null
  updatedAt: number
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/$/,
  ""
)

export async function fetchWeather(
  lat: number,
  lng: number
): Promise<WeatherResponse> {
  try {
    const url =
      `${API_BASE_URL}/api/weather?lat=${encodeURIComponent(lat)}` +
      `&lon=${encodeURIComponent(lng)}`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!res.ok) {
      console.warn("Weather request failed:", res.status, url)
      return { tempF: null, updatedAt: Date.now() }
    }

    const data: unknown = await res.json()

    const tempF =
      data &&
      typeof data === "object" &&
      typeof (data as { tempF?: unknown }).tempF === "number" &&
      Number.isFinite((data as { tempF: number }).tempF)
        ? (data as { tempF: number }).tempF
        : null

    if (tempF === null) {
      console.warn("Weather API returned no valid temperature:", data)
    }

    return {
      tempF,
      updatedAt: Date.now(),
    }
  } catch (error) {
    console.warn("Weather request failed:", error)
    return { tempF: null, updatedAt: Date.now() }
  }
}