// server/index.js
// TRUST-CORRECTED VERSION
// [FIX-1]  /api/reminder-log no longer calls loadReminderScheduleForUI() from
//          Node.js — localStorage does not exist server-side. Route now returns
//          a clear 501 so the client knows to read reminders directly
//          from its own localStorage instead of asking the server.
// [FIX-2]  loadReminderEngine() removed entirely — requiring a .ts file in
//          Node.js crashes without ts-node. No server-side ReminderEngine load.
// [FIX-3]  Rate limiting added to /api/njdrive50-ai via express-rate-limit —
//          20 requests per IP per 15 minutes. Prevents runaway billing from
//          a misconfigured polling component or malicious client.
// [FIX-4]  Prompt length capped at 2000 characters before hitting OpenAI —
//          prevents oversized prompt cost amplification.
// [FIX-5]  mode validated against an explicit allowlist — any value outside
//          ["faq", "chat"] is rejected with 400 before reaching OpenAI.
// [FIX-6]  API key startup log uses a masked pattern that cannot accidentally
//          expand into the full key value under copy-paste debugging.
// [FIX-7]  Server binding documented — 0.0.0.0 is intentional for Capacitor
//          device testing but noted clearly so it is not silently promoted
//          to production without adding auth middleware.
// [FIX-8]  All catch blocks use err instanceof Error guards — err.message is
//          never accessed on an unknown type in strict mode.

const path    = require("path")
const dotenv  = require("dotenv")
const express = require("express")
const cors    = require("cors")
const OpenAI  = require("openai")

// express-rate-limit must be installed:
// npm install express-rate-limit
const rateLimit = require("express-rate-limit")

dotenv.config({ path: path.resolve(__dirname, ".env") })

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY not loaded from C:\\Dev\\NJDRIVE50\\server\\.env"
  )
}

const isProd = process.env.NODE_ENV === "production"
const PORT   = Number(process.env.PORT) || 3001

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (!isProd && allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
}

const app = express()
app.use(cors(corsOptions))
app.use(express.json({ limit: "1mb" }))

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// [FIX-5] Explicit allowlist — rejects anything outside these two values
const ALLOWED_MODES = new Set(["faq", "chat"])

// [FIX-3] 20 req / 15 min per IP on the AI route only
const aiRateLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    error: "Too many requests — please wait a few minutes before trying again.",
  },
})

// [FIX-4] 2000 chars ≈ ~500 tokens — sufficient for all NJDrive50 use cases
const MAX_PROMPT_LENGTH = 2000

// ------------------------------
// Health Check
// ------------------------------
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", service: "NJDrive50 AI" })
})

// ------------------------------
// Reminder Log
// [FIX-1][FIX-2] localStorage is a browser API — it does not exist in Node.js.
// Reminder schedules must be read client-side via loadReminderScheduleForUI()
// from src/core/ReminderEngine.ts. This route returns 501 so any caller
// immediately knows to fix its data source rather than getting silent empty data.
// ------------------------------
app.get("/api/reminder-log", (_, res) => {
  res.status(501).json({
    error: "Not implemented server-side.",
    reason:
      "Reminder schedules are stored in the browser's localStorage and are " +
      "not accessible from the Node.js server process. Read reminder data " +
      "directly in the client using loadReminderScheduleForUI() from " +
      "src/core/ReminderEngine.ts.",
  })
})

// ------------------------------
// AI Route
// ------------------------------
app.post("/api/njdrive50-ai", aiRateLimiter, async (req, res) => {
  try {
    const { prompt, mode } = req.body || {}

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({ error: "Missing or empty prompt." })
    }

    // [FIX-4] Reject before hitting OpenAI
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`,
      })
    }

    // [FIX-5] Reject any mode not in the explicit allowlist
    if (!mode || !ALLOWED_MODES.has(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Allowed values: ${[...ALLOWED_MODES].join(", ")}.`,
      })
    }

    const cleanPrompt = prompt.trim()

    const systemPrompt =
      mode === "faq"
        ? `
You are NJDrive50's Help Panel AI.
Your job is to give:
- medium-length answers (3–5 sentences)
- clear, parent-friendly explanations
- practical, real-world clarity
- a short "Why this matters:" sentence at the end

Tone: calm, confident, supportive, never dramatic, never overly long.
Do NOT ask questions back. Do NOT start conversations. Just answer clearly.
`
        : `
You are NJDrive50's full conversational AI helper.
Your job is to give warm, supportive, step-by-step guidance,
explain rules clearly, reduce parent anxiety, and help them
understand next steps.

Tone: warm, conversational, reassuring, detailed when needed.
`

    const completion = await client.chat.completions.create({
      model:       process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: cleanPrompt  },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    })

    const answer = completion.choices?.[0]?.message?.content ?? ""
    res.json({ output: answer || "No response received." })

  } catch (err) {
    // [FIX-8] err is unknown — never access .message without instanceof guard
    const message = err instanceof Error ? err.message : String(err)
    console.error("AI Error:", message)
    res.status(500).json({
      error:   "AI request failed",
      details: isProd ? undefined : message,
    })
  }
})

app.post("/api/computeRoutes", (req, res) => {
  res.json({
    status: "ok",
    message: "computeRoutes placeholder active — replace with real logic later",
  })
})

// ------------------------------
// Graceful Shutdown
// ------------------------------
process.on("SIGINT", () => {
  console.log("NJDrive50 server shutting down...")
  process.exit(0)
})

// ------------------------------
// SERVER START
// ------------------------------
app.listen(PORT, "0.0.0.0", () => {
  // [FIX-6] Masked — shows last 4 chars only, cannot accidentally expand
  const keyHint = process.env.OPENAI_API_KEY
    ? `sk-...${process.env.OPENAI_API_KEY.slice(-4)}`
    : "undefined"

  console.log(`NJDrive50 AI server running on http://localhost:${PORT}`)
  console.log(`OPENAI_API_KEY : ${keyHint}`)
  console.log(`OPENAI_MODEL   : ${process.env.OPENAI_MODEL || "gpt-4o-mini (default)"}`)
  console.log(`CORS_ORIGIN    : ${allowedOrigins.length > 0 ? allowedOrigins.join(", ") : "(dev fallback — all origins)"}`)
  console.log(`RATE_LIMIT     : ${Number(process.env.AI_RATE_LIMIT_MAX) || 20} requests / 15 min per IP`)

  // [FIX-7] Intentional for Capacitor Android device testing — add auth before prod
  if (!isProd) {
    console.log(
      "⚠  Binding to 0.0.0.0 — all LAN devices can reach this server. " +
      "Add auth middleware before production deployment."
    )
  }
})