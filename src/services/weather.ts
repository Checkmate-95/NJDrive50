// src/services/weather.ts

export type WeatherResponse = {
  tempF: number | null
  updatedAt: number
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherResponse> {
  try {
    const url = `/api/weather?lat=${lat}&lon=${lng}`

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      return { tempF: null, updatedAt: Date.now() }
    }

    const data = await res.json()

    const tempF =
      typeof data.tempF === "number" && Number.isFinite(data.tempF)
        ? data.tempF
        : null

    return {
      tempF,
      updatedAt: Date.now(),
    }
  } catch {
    return { tempF: null, updatedAt: Date.now() }
  }
}
