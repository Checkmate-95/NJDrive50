// C:\Dev\NJDRIVE50\api\njdrive50-ai.cjs

const { randomUUID } = require("crypto");
const OpenAI = require("openai");
const { Ratelimit } = require("@upstash/ratelimit");
const { Redis } = require("@upstash/redis");

const isProd = process.env.NODE_ENV === "production";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20;
const MAX_PROMPT_LENGTH = 2000;
const ALLOWED_MODES = new Set(["faq", "chat"]);

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY missing from environment variables.");
}

if (!Number.isFinite(AI_RATE_LIMIT_MAX) || AI_RATE_LIMIT_MAX <= 0) {
  throw new Error("AI_RATE_LIMIT_MAX must be a valid positive number.");
}

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error(
    "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set for rate limiting."
  );
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT_MAX, "15 m"),
  analytics: true,
  prefix: "njdrive50-ai",
});

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "";

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

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (!isProd) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    return;
  }

  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    return;
  }

  const err = new Error(`CORS blocked for origin: ${origin}`);
  err.statusCode = 403;
  throw err;
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
    const { prompt, mode } = body;
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : "";

    if (!cleanPrompt) {
      return res.status(400).json({
        error: "Missing or empty prompt.",
        requestId,
      });
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.`,
        requestId,
      });
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return res.status(400).json({
        error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}`,
        requestId,
      });
    }

    const systemPrompt =
      mode === "faq"
        ? [
            "You are NJDrive50's Help Panel AI.",
            "Give medium-length answers (3-5 sentences), clear explanations,",
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

    return res.status(200).json({
      output: answer || "No response received.",
      requestId,
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