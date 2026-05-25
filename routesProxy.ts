import express from "express"
import fetch from "node-fetch"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

dotenv.config()

const PORT = Number(process.env.PORT ?? 3001)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error("Missing GOOGLE_MAPS_API_KEY")
}

const app = express()

app.use(helmet())

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(new Error("Not allowed by CORS"))
    },
    methods: ["POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
)

app.use(express.json({ limit: "100kb" }))

type LatLng = {
  latitude: number
  longitude: number
}

type Waypoint = {
  location: {
    latLng: LatLng
  }
}

type ComputeRoutesRequest = {
  origin: Waypoint
  destination: Waypoint
  travelMode?: "DRIVE"
  routingPreference?: "TRAFFIC_UNAWARE" | "TRAFFIC_AWARE" | "TRAFFIC_AWARE_OPTIMAL"
  departureTime?: string
  intermediates?: Waypoint[]
  units?: "METRIC" | "IMPERIAL"
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isValidLatLng(value: unknown): value is LatLng {
  return (
    isObject(value) &&
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude)
  )
}

function isValidWaypoint(value: unknown): value is Waypoint {
  return (
    isObject(value) &&
    isObject(value.location) &&
    isValidLatLng(value.location.latLng)
  )
}

function normalizeComputeRoutesBody(body: unknown): ComputeRoutesRequest | null {
  if (!isObject(body)) return null
  if (!isValidWaypoint(body.origin) || !isValidWaypoint(body.destination)) return null

  const normalized: ComputeRoutesRequest = {
    origin: body.origin,
    destination: body.destination,
    travelMode: "DRIVE",
    routingPreference:
      body.routingPreference === "TRAFFIC_UNAWARE" ||
      body.routingPreference === "TRAFFIC_AWARE" ||
      body.routingPreference === "TRAFFIC_AWARE_OPTIMAL"
        ? body.routingPreference
        : "TRAFFIC_AWARE",
  }

  if (typeof body.departureTime === "string") {
    normalized.departureTime = body.departureTime
  }

  if (Array.isArray(body.intermediates) && body.intermediates.every(isValidWaypoint)) {
    normalized.intermediates = body.intermediates
  }

  if (body.units === "METRIC" || body.units === "IMPERIAL") {
    normalized.units = body.units
  }

  return normalized
}

app.post("/api/computeRoutes", async (req, res) => {
  try {
    const normalizedBody = normalizeComputeRoutesBody(req.body)

    if (!normalizedBody) {
      return res.status(400).json({ error: "Invalid computeRoutes payload" })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
          },
          body: JSON.stringify(normalizedBody),
          signal: controller.signal,
        }
      )

      const text = await response.text()

      if (!response.ok) {
        console.error("Routes API error:", response.status, text)
        return res.status(response.status).json({
          error: "Routing service unavailable",
          status: response.status,
        })
      }

      try {
        return res.json(JSON.parse(text))
      } catch {
        return res.status(502).json({ error: "Invalid upstream JSON response" })
      }
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return res.status(504).json({ error: "Routing request timed out" })
    }

    console.error("Proxy error:", err)
    return res.status(500).json({ error: "Failed to compute routes" })
  }
})

app.listen(PORT, () => {
  console.log(
    `Routes API proxy running on http://localhost:${PORT} (${process.env.NODE_ENV ?? "development"})`
  )
})