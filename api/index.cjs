// C:\Dev\NJDRIVE50\api\index.cjs

// NJDRIVE50 — AI API SERVER (Vercel Serverless Function)
// Converted from server/index.cjs
// - Helmet, compression, structured logs, request IDs
// - Upstash Redis rate limiting, CORS allowlist, optional bearer auth
// - OpenAI-backed NJDrive50 AI Helper

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { randomUUID, timingSafeEqual } = require("crypto");
const OpenAI = require("openai");
const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

// ------------------------------
// ENV / RUNTIME CONFIG
// ------------------------------
const isProd = process.env.NODE_ENV === "production";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const REQUIRE_API_AUTH = isProd || process.env.REQUIRE_API_AUTH === "true";
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20;

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing from Vercel environment variables.");
}

if (!Number.isFinite(AI_RATE_LIMIT_MAX) || AI_RATE_LIMIT_MAX <= 0) {
  throw new Error("AI_RATE_LIMIT_MAX must be a valid positive number.");
}

if (REQUIRE_API_AUTH && !process.env.API_BEARER_TOKEN) {
  throw new Error("API_BEARER_TOKEN must be set when API auth is enabled.");
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for rate limiting."
  );
}

// ------------------------------
// CORS ORIGINS
// ------------------------------
// Add production origins in Vercel env vars as a comma-separated list:
// CORS_ORIGIN=https://www.njdrive50.com,https://njdrive50.com
const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    "https://www.njdrive50.com",
    "https://njdrive50.com",
    "http://localhost:5173",
    "http://localhost",
    "https://localhost",
    "capacitor://localhost",
    ...envOrigins,
  ])
);

if (isProd && envOrigins.length === 0) {
  throw new Error(
    "CORS_ORIGIN must be set in production. Example: CORS_ORIGIN=https://www.njdrive50.com"
  );
}

// ------------------------------
// HELPERS
// ------------------------------
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function safeTokenEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

// ------------------------------
// APP INIT
// ------------------------------
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1); // Vercel always sits behind a proxy

// ------------------------------
// CORS
// ------------------------------
const corsOptions = {
  origin(origin, callback) {
    try {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProd) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(createHttpError(403, `CORS blocked for origin: ${origin}`));
    } catch (err) {
      return callback(err instanceof Error ? err : new Error(String(err)));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ------------------------------
// SECURITY / PARSING / LOGGING
// ------------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());
app.use(express.json({ limit: "1mb" }));

app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);

  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level:
          res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs,
        origin: req.headers.origin || "no-origin",
        ip: req.ip,
        userAgent: req.get("user-agent") || "unknown",
      })
    );
  });

  next();
});

// ------------------------------
// AUTH / REQUEST VALIDATION
// ------------------------------
function requireBearerToken(req, res, next) {
  if (!REQUIRE_API_AUTH) {
    return next();
  }

  const expected = process.env.API_BEARER_TOKEN;

  if (!expected) {
    return res.status(500).json({
      error: "Server auth misconfigured.",
      requestId: req.id,
    });
  }

  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header.",
      requestId: req.id,
    });
  }

  if (!safeTokenEqual(token, expected)) {
    return res.status(403).json({
      error: "Invalid bearer token.",
      requestId: req.id,
    });
  }

  return next();
}

function requireTrustedBrowserOrigin(req, res, next) {
  const origin = req.headers.origin || "";
  const contentType = String(req.headers["content-type"] || "").toLowerCase();

  if (isProd && origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: "Request origin not allowed.",
      requestId: req.id,
    });
  }

  if (!contentType.includes("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json.",
      requestId: req.id,
    });
  }

  return next();
}

// ------------------------------
// OPENAI / RATE LIMITING (Upstash Redis)
// ------------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_MODES = new Set(["faq", "chat"]);
const MAX_PROMPT_LENGTH = 2000;

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT_MAX, "15 m"),
  analytics: true,
  prefix: "njdrive50-ai",
});

async function aiRateLimiter(req, res, next) {
  try {
    const identifier = req.ip || "anonymous";
    const { success, reset } = await ratelimit.limit(identifier);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);

      return res.status(429).json({
        error: "Too many requests — try again soon.",
        requestId: req.id,
        retryAfterSeconds,
      });
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

// ------------------------------
// ROUTES
// ------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "NJDrive50 AI",
    requestId: req.id,
    authEnabled: REQUIRE_API_AUTH,
  });
});

app.get("/api/reminder-log", (req, res) => {
  res.status(501).json({
    error: "Not implemented server-side.",
    reason:
      "Reminder schedules live in browser localStorage and must be read client-side.",
    requestId: req.id,
  });
});

app.post(
  "/api/njdrive50-ai",
  requireTrustedBrowserOrigin,
  aiRateLimiter,
  asyncHandler(async (req, res) => {
    const { prompt, mode } = req.body || {};
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!cleanPrompt) {
      return res.status(400).json({
        error: "Missing or empty prompt.",
        requestId: req.id,
      });
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.`,
        requestId: req.id,
      });
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}`,
        requestId: req.id,
      });
    }

    const systemPrompt =
      mode === "faq"
        ? [
            "You are NJDrive50's Help Panel AI.",
            "Give medium-length answers (3–5 sentences), clear explanations,",
            'practical guidance, and end with "Why this matters:".',
            "Tone: calm, confident, supportive.",
            "Do NOT ask questions back.",
          ].join("\n")
        : [
            "You are NJDrive50's conversational helper.",
            "Give warm, supportive, step-by-step guidance.",
            "Tone: warm, reassuring, detailed when needed.",
          ].join("\n");

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    });

    const answer = completion.choices?.[0]?.message?.content ?? "";

    return res.json({
      output: answer || "No response received.",
      requestId: req.id,
    });
  })
);

app.post("/api/computeRoutes", requireBearerToken, aiRateLimiter, (req, res) => {
  res.json({
    status: "ok",
    message: "computeRoutes placeholder active",
    requestId: req.id,
  });
});

// ------------------------------
// 404 + ERROR HANDLING
// ------------------------------
app.use((req, _res, next) => {
  next(createHttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use((err, req, res, _next) => {
  const status =
    typeof err?.statusCode === "number" && err.statusCode >= 400 ? err.statusCode : 500;

  const message = err instanceof Error ? err.message : "Internal Server Error";

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: status >= 500 ? "error" : "warn",
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status,
      error: message,
    })
  );

  res.status(status).json({
    error: message,
    requestId: req.id,
    details: isProd || status < 500 ? undefined : err?.stack,
  });
});

// ------------------------------
// GRACEFUL SHUTDOWN (Vercel scale-down cleanup)
// ------------------------------
process.on("SIGTERM", () => {
  console.log("SIGTERM received — function scaling down.");
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`NJDrive50 AI server running on http://localhost:${PORT}`);
  });
}


