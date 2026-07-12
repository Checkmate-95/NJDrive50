// server/index.cjs
// NJDRIVE50 — PRODUCTION-GRADE SERVER (FINAL)
// Includes:
// - Security headers (helmet)
// - Compression
// - Disabled x-powered-by
// - JSON structured logging
// - Request ID tracing (header + body + logs)
// - Bearer-token auth (kept for protected non-browser routes)
// - Rate limiting with JSON 429 handler
// - CORS allowlist enforcement
// - trust proxy for correct IP handling behind proxies
// - Async wrapper
// - Global 404 + global error handler
// - Graceful shutdown
// - Optional HTTPS in development/production via server.key + server.cert

const path = require("path")
const fs = require("fs")
const http = require("http")
const https = require("https")
const dotenv = require("dotenv")
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const { randomUUID, timingSafeEqual } = require("crypto")
const OpenAI = require("openai")
const rateLimit = require("express-rate-limit")

dotenv.config({ path: path.resolve(__dirname, ".env") })

// ------------------------------
// ENV VALIDATION
// ------------------------------
const isProd = process.env.NODE_ENV === "production"
const PORT = Number(process.env.PORT) || 3001
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const REQUIRE_API_AUTH = isProd || process.env.REQUIRE_API_AUTH === "true"
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20
const TRUST_PROXY = process.env.TRUST_PROXY || (isProd ? "1" : "false")
const ENABLE_HTTPS = process.env.ENABLE_HTTPS === "true"
const HTTPS_PORT = Number(process.env.HTTPS_PORT) || 3443

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing from server/.env")
}

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)

if (isProd && allowedOrigins.length === 0) {
  throw new Error("CORS_ORIGIN must be set in production.")
}

if (REQUIRE_API_AUTH && !process.env.API_BEARER_TOKEN) {
  throw new Error("API_BEARER_TOKEN must be set when API auth is enabled.")
}

if (!Number.isFinite(PORT) || PORT <= 0) {
  throw new Error("PORT must be a valid positive number.")
}

if (!Number.isFinite(HTTPS_PORT) || HTTPS_PORT <= 0) {
  throw new Error("HTTPS_PORT must be a valid positive number.")
}

if (!Number.isFinite(AI_RATE_LIMIT_MAX) || AI_RATE_LIMIT_MAX <= 0) {
  throw new Error("AI_RATE_LIMIT_MAX must be a valid positive number.")
}

// ------------------------------
// APP INIT
// ------------------------------
const app = express()
app.disable("x-powered-by")

if (TRUST_PROXY !== "false") {
  const proxyValue =
    TRUST_PROXY === "true"
      ? true
      : Number.isNaN(Number(TRUST_PROXY))
        ? TRUST_PROXY
        : Number(TRUST_PROXY)

  app.set("trust proxy", proxyValue)
}

// ------------------------------
// HELPERS
// ------------------------------
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

function safeTokenEqual(a, b) {
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

function createHttpError(statusCode, message) {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}

function requireBearerToken(req, res, next) {
  if (!REQUIRE_API_AUTH) return next()

  const expected = process.env.API_BEARER_TOKEN
  if (!expected) {
    return res.status(500).json({
      error: "Server auth misconfigured.",
      requestId: req.id,
    })
  }

  const header = req.headers.authorization || ""
  const [scheme, token] = header.split(" ")

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header.",
      requestId: req.id,
    })
  }

  if (!safeTokenEqual(token, expected)) {
    return res.status(403).json({
      error: "Invalid bearer token.",
      requestId: req.id,
    })
  }

  next()
}

function requireTrustedBrowserOrigin(req, res, next) {
  const origin = req.headers.origin || ""
  const contentType = req.headers["content-type"] || ""

  if (isProd) {
    if (!origin || !allowedOrigins.includes(origin)) {
      return res.status(403).json({
        error: "Request origin not allowed.",
        requestId: req.id,
      })
    }
  }

  if (!String(contentType).toLowerCase().includes("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json.",
      requestId: req.id,
    })
  }

  next()
}

// ------------------------------
// MIDDLEWARE
// ------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
)

app.use(compression())
app.use(express.json({ limit: "1mb" }))

const corsOptions = {
  origin(origin, callback) {
    try {
      // Allow null origins (Android WebView, file://, direct mobile contexts)
      if (!origin) return callback(null, true)

      // Allow all origins in development
      if (!isProd) return callback(null, true)

      // Strict allowlist in production
      if (allowedOrigins.includes(origin)) return callback(null, true)

      return callback(createHttpError(403, `CORS blocked for origin: ${origin}`))
    } catch (err) {
      return callback(err instanceof Error ? err : new Error(String(err)))
    }
  },
}

app.use(cors(corsOptions))

app.use((req, res, next) => {
  req.id = randomUUID()
  res.setHeader("X-Request-Id", req.id)
  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    const log = {
      timestamp: new Date().toISOString(),
      level:
        res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      origin: req.headers.origin || "no-origin",
      ip: req.ip,
      userAgent: req.get("user-agent") || "unknown",
    }

    console.log(JSON.stringify(log))
  })

  next()
})

// ------------------------------
// OPENAI CLIENT
// ------------------------------
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ------------------------------
// CONSTANTS
// ------------------------------
const ALLOWED_MODES = new Set(["faq", "chat"])
const MAX_PROMPT_LENGTH = 2000

const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, _next, options) => {
    const retryAfterSeconds = Math.ceil(options.windowMs / 1000)

    res.status(options.statusCode).json({
      error: "Too many requests — try again soon.",
      requestId: req.id,
      retryAfterSeconds,
    })
  },
})

// ------------------------------
// ROUTES
// ------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NJDrive50 AI",
    requestId: req.id,
    authEnabled: REQUIRE_API_AUTH,
    httpsEnabled: ENABLE_HTTPS,
  })
})

app.get("/api/reminder-log", (req, res) => {
  res.status(501).json({
    error: "Not implemented server-side.",
    reason:
      "Reminder schedules live in browser localStorage and must be read client-side.",
    requestId: req.id,
  })
})

app.post(
  "/api/njdrive50-ai",
  requireTrustedBrowserOrigin,
  aiRateLimiter,
  asyncHandler(async (req, res) => {
    const { prompt, mode } = req.body || {}
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : ""

    if (!cleanPrompt) {
      return res.status(400).json({
        error: "Missing or empty prompt.",
        requestId: req.id,
      })
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.`,
        requestId: req.id,
      })
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}`,
        requestId: req.id,
      })
    }

    const systemPrompt =
      mode === "faq"
        ? `
You are NJDrive50's Help Panel AI.
Give medium-length answers (3–5 sentences), clear explanations,
practical guidance, and end with "Why this matters:".
Tone: calm, confident, supportive.
Do NOT ask questions back.
`
        : `
You are NJDrive50's conversational helper.
Give warm, supportive, step-by-step guidance.
Tone: warm, reassuring, detailed when needed.
`

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    })

    const answer = completion.choices?.[0]?.message?.content ?? ""

    res.json({
      output: answer || "No response received.",
      requestId: req.id,
    })
  })
)

app.post("/api/computeRoutes", requireBearerToken, aiRateLimiter, (req, res) => {
  res.json({
    status: "ok",
    message: "computeRoutes placeholder active",
    requestId: req.id,
  })
})

// ------------------------------
// 404 HANDLER
// ------------------------------
app.use((req, _res, next) => {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`))
})

// ------------------------------
// GLOBAL ERROR HANDLER
// ------------------------------
app.use((err, req, res, _next) => {
  const status =
    typeof err?.statusCode === "number" && err.statusCode >= 400
      ? err.statusCode
      : 500

  const message = err instanceof Error ? err.message : "Internal Server Error"

  const errorLog = {
    timestamp: new Date().toISOString(),
    level: status >= 500 ? "error" : "warn",
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status,
    error: message,
  }

  console.error(JSON.stringify(errorLog))

  res.status(status).json({
    error: message,
    requestId: req.id,
    details: isProd || status < 500 ? undefined : err?.stack,
  })
})

// ------------------------------
// SERVER START + SHUTDOWN
// ------------------------------
const server = http.createServer(app)
let httpsServer = null

if (ENABLE_HTTPS) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(path.resolve(__dirname, "server.key")),
      cert: fs.readFileSync(path.resolve(__dirname, "server.cert")),
    }

    httpsServer = https.createServer(httpsOptions, app)
  } catch (err) {
    console.error(
      "HTTPS disabled: could not load server.key/server.cert",
      err instanceof Error ? err.message : String(err)
    )
  }
}

server.listen(PORT, "0.0.0.0", () => {
  const key = process.env.OPENAI_API_KEY
  const keyHint = key.length > 8 ? `sk-...${key.slice(-4)}` : "[set]"

  console.log(`NJDrive50 AI server running on http://localhost:${PORT}`)
  console.log(`NJDrive50 AI server LAN   on http://0.0.0.0:${PORT}`)
  console.log(`OPENAI_API_KEY : ${keyHint}`)
  console.log(`OPENAI_MODEL   : ${OPENAI_MODEL}`)
  console.log(`TRUST_PROXY    : ${TRUST_PROXY}`)
  console.log(
    `CORS_ORIGIN    : ${
      allowedOrigins.length > 0
        ? allowedOrigins.join(", ")
        : "(dev fallback — all origins)"
    }`
  )
  console.log(`API_AUTH       : ${REQUIRE_API_AUTH ? "enabled" : "disabled (dev)"}`)
  console.log(`RATE_LIMIT     : ${AI_RATE_LIMIT_MAX} requests / 15 min per IP`)
})

if (httpsServer) {
  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log(`NJDrive50 AI HTTPS server running on https://localhost:${HTTPS_PORT}`)
    console.log(`NJDrive50 AI HTTPS LAN   running on https://192.168.0.157:${HTTPS_PORT}`)
  })
}

function shutdown(signal) {
  console.log(`${signal} received — shutting down NJDrive50 server...`)

  const serversToClose = [server]
  if (httpsServer) serversToClose.push(httpsServer)

  let remaining = serversToClose.length
  let exited = false

  const finish = (err) => {
    if (exited) return

    if (err) {
      exited = true
      console.error(
        "Error during shutdown:",
        err instanceof Error ? err.message : String(err)
      )
      process.exit(1)
    }

    remaining -= 1
    if (remaining === 0) {
      exited = true
      process.exit(0)
    }
  }

  for (const srv of serversToClose) {
    srv.close(finish)
  }

  setTimeout(() => {
    if (!exited) {
      console.error("Forced shutdown after timeout.")
      process.exit(1)
    }
  }, 5000).unref()
}

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))