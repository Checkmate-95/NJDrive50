// src/screens/AIHelper.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  API URL reads from VITE_API_BASE_URL env var — hardcoded localhost
//          breaks on Android where localhost refers to the device itself,
//          not the dev machine. Add VITE_API_BASE_URL=http://localhost:3001
//          to your .env file (use your machine's LAN IP for device testing)
// [FIX-2]  setLoading(false) moved to finally block — guaranteed to reset
//          even if res.json() throws or an early return is added in future
// [FIX-3]  res.ok checked before parsing JSON — 4xx/5xx responses now show
//          a meaningful server error instead of "No response received."
// [FIX-4]  Inline styles updated to match NJDrive50 design system colors
//          (#08194A / #f9c80e) — was using generic #2563eb blue

import { useState } from "react"

// [FIX-1] Env-driven base URL — safe for both web and Android Capacitor
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"

export default function AIHelper() {
  const [prompt,   setPrompt]   = useState("")
  const [response, setResponse] = useState("")
  const [loading,  setLoading]  = useState(false)

  const sendPrompt = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse("")

    try {
      const res = await fetch(`${API_BASE}/api/njdrive50-ai`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ prompt }),
      })

      // [FIX-3] Check res.ok before parsing — surfaces real server errors
      if (!res.ok) {
        setResponse(`Server error: ${res.status}`)
        return
      }

      const data = await res.json()
      setResponse(data.output ?? "No response received.")
    } catch {
      setResponse("Error contacting AI server.")
    } finally {
      // [FIX-2] Always resets loading — even if res.json() throws
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding:      "20px",
        background:   "#f0f4ff",
        borderRadius: "12px",
        border:       "1px solid #d0d9f0",
      }}
    >
      {/* [FIX-4] Header matches app color system */}
      <h2
        style={{
          fontSize:     "20px",
          fontWeight:   700,
          marginBottom: "12px",
          color:        "#08194A",
        }}
      >
        NJDrive50 AI Helper
      </h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask a driving question..."
        style={{
          width:        "100%",
          height:       "80px",
          padding:      "10px",
          borderRadius: "8px",
          border:       "1px solid #c4cde0",
          fontSize:     "14px",
          resize:       "vertical",
          boxSizing:    "border-box",
        }}
      />

      {/* [FIX-4] Button uses app brand colors */}
      <button
        onClick={sendPrompt}
        disabled={loading}
        style={{
          marginTop:    "10px",
          padding:      "10px 20px",
          background:   loading ? "#4a5e8a" : "#08194A",
          color:        "#f9c80e",
          border:       "2px solid #f9c80e",
          borderRadius: "8px",
          fontWeight:   700,
          fontSize:     "14px",
          cursor:       loading ? "not-allowed" : "pointer",
          transition:   "background 0.2s ease",
        }}
      >
        {loading ? "Thinking…" : "Ask AI"}
      </button>

      {response && (
        <div
          style={{
            marginTop:    "16px",
            padding:      "12px",
            background:   "white",
            borderRadius: "8px",
            border:       "1px solid #d0d9f0",
            fontSize:     "14px",
            lineHeight:   "1.6",
            color:        "#08194A",
          }}
        >
          <strong style={{ display: "block", marginBottom: "6px" }}>
            AI Response:
          </strong>
          <p style={{ margin: 0 }}>{response}</p>
        </div>
      )}
    </div>
  )
}