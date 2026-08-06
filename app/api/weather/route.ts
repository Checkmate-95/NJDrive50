import { NextResponse } from "next/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

async function getTemperatureF(
  lat: number,
  lon: number
): Promise<number | null> {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY

    if (!apiKey) return null

    const url =
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
      `&units=imperial&appid=${apiKey}`

    const res = await fetch(url, { cache: "no-store" })

    if (!res.ok) return null

    const data: unknown = await res.json()

const tempF =
  data &&
  typeof data === "object" &&
  typeof (data as { main?: { temp?: unknown } }).main?.temp === "number"
    ? (data as { main: { temp: number } }).main.temp
    : null

return typeof tempF === "number" && Number.isFinite(tempF)
  ? Math.round(tempF)
  : null
} catch {
  return null
}
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lat = Number(searchParams.get("lat"))
  const lon = Number(searchParams.get("lon"))

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json({ tempF: null }, { headers: corsHeaders })
  }

  const tempF = await getTemperatureF(lat, lon)

  return NextResponse.json(
    { tempF: Number.isFinite(tempF) ? tempF : null },
    { headers: corsHeaders }
  )
}