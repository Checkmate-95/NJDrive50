import { useState } from "react"

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"
const API_TOKEN = import.meta.env.VITE_API_BEARER_TOKEN ?? ""

export default function AIHelper() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const sendPrompt = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    setResponse("")

    try {
      const headers = {
        "Content-Type": "application/json",
      }

      if (API_TOKEN) {
        headers.Authorization = `Bearer ${API_TOKEN}`
      }

      const res = await fetch(`${API_BASE}/api/njdrive50-ai`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode: "faq",
        }),
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        setResponse(
          data?.error ? `Server error: ${data.error}` : `Server error: ${res.status}`
        )
        return
      }

      setResponse(data?.output ?? "No response received.")
    } catch {
      setResponse("Error contacting AI server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: "20px",
        background: "#f0f4ff",
        borderRadius: "12px",
        border: "1px solid #d0d9f0",
      }}
    >
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          marginBottom: "12px",
          color: "#08194A",
        }}
      >
        NJDrive50 AI Helper
      </h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask a driving question..."
        style={{
          width: "100%",
          height: "80px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #c4cde0",
          fontSize: "14px",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />

      <button
        onClick={sendPrompt}
        disabled={loading}
        style={{
          marginTop: "10px",
          padding: "10px 20px",
          background: loading ? "#4a5e8a" : "#08194A",
          color: "#f9c80e",
          border: "2px solid #f9c80e",
          borderRadius: "8px",
          fontWeight: 700,
          fontSize: "14px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s ease",
        }}
      >
        {loading ? "Thinking…" : "Ask AI"}
      </button>

      {response && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "white",
            borderRadius: "8px",
            border: "1px solid #d0d9f0",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#08194A",
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