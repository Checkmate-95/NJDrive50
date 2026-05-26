import express from "express"
import dotenv from "dotenv"
import path from "node:path"
import { fileURLToPath } from "node:url"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import OpenAI from "openai"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, "server", ".env")
const dotenvResult = dotenv.config({ path: envPath })
if (dotenvResult.error) {
  console.error("dotenv load error:", dotenvResult.error)
}

const PORT = Number(process.env.PORT ?? 3001)
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini"

const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

if (!GOOGLE_MAPS_API_KEY) {
  throw new Error("Missing GOOGLE_MAPS_API_KEY in server/.env")
}
if (!OPENAI_API_KEY) {
  console.warn("⚠️ Missing OPENAI_API_KEY — AI helper will not work until added.")
}

const app = express()
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

app.set("trust proxy", 1)
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

// ---------------- Google Routes Proxy ----------------
type LatLng = { latitude: number; longitude: number }
type Waypoint = { location: { latLng: LatLng } }
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
  return isObject(value) && isObject(value.location) && isValidLatLng(value.location.latLng)
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

  if (typeof body.departureTime === "string") normalized.departureTime = body.departureTime
  if (Array.isArray(body.intermediates) && body.intermediates.every(isValidWaypoint))
    normalized.intermediates = body.intermediates
  if (body.units === "METRIC" || body.units === "IMPERIAL") normalized.units = body.units

  return normalized
}

app.post("/api/computeRoutes", async (req, res) => {
  try {
    const normalizedBody = normalizeComputeRoutesBody(req.body)
    if (!normalizedBody) return res.status(400).json({ error: "Invalid computeRoutes payload" })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify(normalizedBody),
        signal: controller.signal,
      })

      const text = await response.text()
      if (!response.ok) {
        console.error("Routes API error:", response.status, text)
        return res.status(response.status).json({ error: "Routing service unavailable" })
      }

      return res.json(JSON.parse(text))
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError")
      return res.status(504).json({ error: "Routing request timed out" })
    console.error("Proxy error:", err)
    return res.status(500).json({ error: "Failed to compute routes" })
  }
})

// ---------------- AI Helper Endpoint ----------------
app.post("/api/njdrive50-ai", async (req, res) => {
  try {
    const { prompt } = req.body
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt" })
    }

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OpenAI API key" })
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content ?? "No response"
    res.status(200).json({ message: reply })
  } catch (err) {
    console.error("AI helper error:", err)
    res.status(500).json({ error: "AI helper failed" })
  }
})

// ---------------- Server Start ----------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Routes API proxy running on http://192.168.0.157:${PORT} (${process.env.NODE_ENV ?? "development"})`
  )
})
