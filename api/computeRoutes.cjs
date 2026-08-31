// C:\Dev\NJDRIVE50\api\computeRoutes.cjs

const { randomUUID, timingSafeEqual } = require("crypto");
const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

const isProd = process.env.NODE_ENV === "production";
const REQUIRE_API_AUTH = isProd || process.env.REQUIRE_API_AUTH === "true";
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20;

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

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT_MAX, "15 m"),
  analytics: true,
  prefix: "njdrive50-computeRoutes",
});

function safeTokenEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));

  if (aBuf.length !== bBuf.length) {
    return false;
  }

  return timingSafeEqual(aBuf, bBuf);
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (!isProd) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    return;
  }

  const envOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const allowedOrigins = Array.from(
    new Set([
      "https://www.njdrive50.com",
      "https://njdrive50.com",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost",
      "https://localhost",
      "capacitor://localhost",
      ...envOrigins,
    ])
  );

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    return;
  }

  throw Object.assign(new Error(`CORS blocked for origin: ${origin}`), { statusCode: 403 });
}

function requireBearerToken(req, requestId) {
  if (!REQUIRE_API_AUTH) {
    return null;
  }

  const expected = process.env.API_BEARER_TOKEN;
  if (!expected) {
    return {
      status: 500,
      body: { error: "Server auth misconfigured.", requestId },
    };
  }

  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return {
      status: 401,
      body: { error: "Missing or invalid Authorization header.", requestId },
    };
  }

  if (!safeTokenEqual(token, expected)) {
    return {
      status: 403,
      body: { error: "Invalid bearer token.", requestId },
    };
  }

  return null;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || "anonymous";
}

module.exports = async function handler(req, res) {
  const requestId = randomUUID();
  res.setHeader("X-Request-Id", requestId);

  try {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Method not allowed.",
        requestId,
      });
    }

    const authError = requireBearerToken(req, requestId);
    if (authError) {
      return res.status(authError.status).json(authError.body);
    }

    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (!contentType.includes("application/json")) {
      return res.status(415).json({
        error: "Content-Type must be application/json.",
        requestId,
      });
    }

    const identifier = getClientIp(req);
    const { success, reset } = await ratelimit.limit(identifier);

    if (!success) {
      const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return res.status(429).json({
        error: "Too many requests — try again soon.",
        requestId,
        retryAfterSeconds,
      });
    }

    const body = req.body || {};
    const start = body.start ?? req.query?.start;
    const end = body.end ?? req.query?.end;

    if (!start || !end) {
      return res.status(400).json({
        error: "Missing start or end coordinates.",
        requestId,
      });
    }

    return res.status(200).json({
      status: "ok",
      message: "computeRoutes placeholder active",
      requestId,
      route: {
        start,
        end,
      },
    });
  } catch (err) {
    const status =
      typeof err?.statusCode === "number" && err.statusCode >= 400 ? err.statusCode : 500;

    const message = err instanceof Error ? err.message : "Internal Server Error";

    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        method: req.method,
        url: req.url,
        status,
        error: message,
      })
    );

    return res.status(status).json({
      error: message,
      requestId,
    });
  }
};