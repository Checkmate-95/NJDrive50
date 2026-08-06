import { NextResponse } from "next/server"

// Replace this with your real weather provider
async function getTemperatureF(lat: number, lon: number): Promise<number | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY

    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
      `&units=imperial&appid=${apiKey}`

    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null

    const data = await res.json()
    const tempF = data.main?.temp

    return Number.isFinite(tempF) ? Math.round(tempF) : null
  } catch {
    return null
  }
}


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lon = Number(searchParams.get("lon"))

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ tempF: null })
  }

  const tempF = await getTemperatureF(lat, lon)

  return NextResponse.json({
    tempF: Number.isFinite(tempF) ? tempF : null
  })
}
