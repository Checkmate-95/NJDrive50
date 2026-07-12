import { useEffect, useRef, useState } from "react"

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim()
const API_BASE = RAW_BASE.replace(/\/+$/, "")

console.log("API_BASE:", API_BASE)


const STABLE_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
}

export default function AIHelper() {
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const abortRef = useRef(null)
  const inFlightRef = useRef(false)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const sendPrompt = async () => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt || loading || inFlightRef.current) return

    inFlightRef.current = true

    if (!API_BASE) {
      setError("Missing API base URL. Set VITE_API_BASE_URL.")
      setResponse("")
      inFlightRef.current = false
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setResponse("")

    try {
      const res = await fetch(`${API_BASE}/api/njdrive50-ai`, {
        method: "POST",
        headers: STABLE_HEADERS,
        body: JSON.stringify({
          prompt: cleanPrompt,
          mode: "faq",
        }),
        signal: controller.signal,
      })

      let data = null
      try {
        data = await res.json()
      } catch {
        data = null
      }

      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 403 && "Request origin not allowed.") ||
          (res.status === 415 && "Content-Type must be application/json.") ||
          (res.status === 429 && "Too many requests — try again soon.") ||
          `Server error: ${res.status}`

        setError(msg)
        setResponse("")
        return
      }

      setResponse(data?.output?.trim() || "No response received.")
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError("Error contacting AI server. Check connection and API URL.")
        setResponse("")
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setLoading(false)
      inFlightRef.current = false
    }
  }

  return (
    <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F7FC] p-4 shadow-sm">
      <h2 className="text-lg font-bold text-[#08194A]">NJDrive50 AI Helper</h2>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask a driving question..."
        className="mt-3 min-h-[96px] w-full rounded-xl border border-[#0A1E5E]/15 bg-white px-3 py-3 text-sm text-[#08194A] outline-none transition focus:border-[#f9c80e] focus:ring-2 focus:ring-[#f9c80e]/35"
      />

      <button
        type="button"
        onClick={sendPrompt}
        disabled={loading}
        className={`mt-3 rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition ${
          loading
            ? "cursor-not-allowed border-[#f9c80e]/50 bg-[#4a5e8a] text-[#f9c80e]/80"
            : "border-[#f9c80e] bg-[#08194A] text-[#f9c80e] active:scale-[0.99]"
        }`}
      >
        {loading ? "Thinking…" : "Ask AI"}
      </button>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <strong className="mb-1 block">AI Error</strong>
          <span>{error}</span>
        </div>
      )}

      {response && (
        <div className="mt-4 rounded-xl border border-[#0A1E5E]/10 bg-white px-4 py-3 text-sm leading-relaxed text-[#08194A]">
          <strong className="mb-1 block">AI Response</strong>
          <p className="m-0 whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  )
}