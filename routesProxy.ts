// routesProxy.ts (ESM-compatible)

import express from "express"
import fetch from "node-fetch"
import dotenv from "dotenv"
import cors from "cors"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())


app.post("/api/computeRoutes", async (req, res) => {
  try {
    const response = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,

          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
        },
        body: JSON.stringify(req.body)
      }
    )

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error("Proxy error:", err)
    res.status(500).json({ error: "Failed to compute routes" })
  }
})

app.listen(3001, () => {
  console.log("Routes API proxy running on http://localhost:3001")
})
