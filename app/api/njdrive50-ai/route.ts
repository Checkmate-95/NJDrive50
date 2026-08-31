// redeploy trigger
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import OpenAI from "openai"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const isProd = process.env.NODE_ENV === "production"
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const AI_RATE_LIMIT_MAX = Number(process.env.AI_RATE_LIMIT_MAX) || 20
const MAX_PROMPT_LENGTH = 2000
const ALLOWED_MODES = new Set(["faq", "chat"])

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)

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
)

function getCorsHeaders(origin: string | null) {
  const allowOrigin =
    !origin || !isProd || allowedOrigins.includes(origin) ? origin || "*" : ""

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  }
}

const redis = Redis.fromEnv()

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(AI_RATE_LIMIT_MAX, "15 m"),
  analytics: true,
  prefix: "njdrive50-ai",
})

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export function OPTIONS(req: Request) {
  const origin = req.headers.get("origin")
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  })
}

export async function POST(req: Request) {
  const requestId = randomUUID()
  const origin = req.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server misconfigured.", requestId },
        { status: 500, headers: corsHeaders }
      )
    }

    const contentType = req.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json.", requestId },
        { status: 415, headers: corsHeaders }
      )
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous"

    const { success, reset } = await ratelimit.limit(ip)

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)
      return NextResponse.json(
        {
          error: "Too many requests — try again soon.",
          requestId,
          retryAfterSeconds,
        },
        { status: 429, headers: corsHeaders }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { prompt, mode } = body || {}
    const cleanPrompt = typeof prompt === "string" ? prompt.trim() : ""

    if (!cleanPrompt) {
      return NextResponse.json(
        { error: "Missing or empty prompt.", requestId },
        { status: 400, headers: corsHeaders }
      )
    }

    if (cleanPrompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters.`,
          requestId,
        },
        { status: 400, headers: corsHeaders }
      )
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return NextResponse.json(
        {
          error: `Invalid mode. Allowed: ${[...ALLOWED_MODES].join(", ")}`,
          requestId,
        },
        { status: 400, headers: corsHeaders }
      )
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
          ].join("\n")

    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: cleanPrompt },
      ],
      temperature: mode === "faq" ? 0.3 : 0.5,
    })

    const answer = completion.choices?.[0]?.message?.content ?? ""

    return NextResponse.json(
      { output: answer || "No response received.", requestId },
      { headers: corsHeaders }
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal Server Error"
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        error: message,
      })
    )
    return NextResponse.json(
      { error: message, requestId },
      { status: 500, headers: corsHeaders }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "njdrive50-ai route active" });
}
