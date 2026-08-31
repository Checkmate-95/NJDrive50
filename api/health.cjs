// C:\Dev\NJDRIVE50\api\health.cjs

const { randomUUID } = require("crypto");

const isProd = process.env.NODE_ENV === "production";

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

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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

module.exports = async function handler(req, res) {
  const requestId = randomUUID();
  res.setHeader("X-Request-Id", requestId);

  try {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({
        error: "Method not allowed.",
        requestId,
      });
    }

    return res.status(200).json({
      status: "ok",
      service: "NJDrive50 AI",
      requestId,
      authEnabled: isProd || process.env.REQUIRE_API_AUTH === "true",
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