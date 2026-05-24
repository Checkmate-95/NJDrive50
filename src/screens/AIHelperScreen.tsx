import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react"
import { useNav } from "../state/navStore"

const QUICK_PROMPTS = [
  "What documents do I need for the road test?",
  "How do I know if the 50-hour requirement is complete?",
  "What counts as night driving in New Jersey?",
]

const API_URL =
  import.meta.env.VITE_AI_HELPER_API_URL || "/api/njdrive50-ai"

const srOnly: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
}

export default function AIHelperScreen() {
  const { goBack } = useNav()

  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const responseRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const canSend = !!prompt.trim() && !loading
  const canClear = !!prompt.trim() && !loading

  const sendPrompt = async () => {
    if (!canSend) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setResponse("")

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), mode: "chat" }),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json().catch(() => null)
      setResponse(data?.output ?? "No response received.")
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return
      setResponse(
        "We couldn't reach the AI helper right now. Please try again in a moment."
      )
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
      }
      setLoading(false)
    }
  }

  const clearPrompt = () => {
    if (!canClear) return
    setPrompt("")
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault()
      void sendPrompt()
    }
  }

  useEffect(() => {
    if (loading || response) {
      responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [loading, response])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return (
    <div
      style={{
        minHeight: "100%",
        background: "#F4F7FB",
        padding: 16,
        paddingBottom: 112,
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div aria-live="polite" style={srOnly}>
          {loading ? "Generating AI response." : response ? "AI response ready." : ""}
        </div>

        <button
          type="button"
          onClick={() => goBack()}
          style={{
            alignSelf: "flex-start",
            background: "#FFFFFF",
            color: "#08194A",
            border: "1px solid #D7E0EA",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          ← Close
        </button>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #DCE4EE",
            borderRadius: 20,
            padding: 20,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#EEF4FF",
              color: "#08194A",
              border: "1px solid #D4E2FF",
              borderRadius: 999,
              padding: "6px 10px",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 12,
              letterSpacing: 0.3,
            }}
          >
            NJDRIVE50 AI HELPER
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.15,
              color: "#08194A",
              fontWeight: 800,
            }}
          >
            Clear guidance for logs, permits, paperwork, and next steps
          </h1>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#475569",
              fontSize: 16,
              lineHeight: 1.65,
              maxWidth: 720,
            }}
          >
            Ask NJDrive50 anything about New Jersey driving requirements in plain
            language. The AI helper is designed to give calm, practical
            explanations for parents and teens.
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #DCE4EE",
            borderRadius: 20,
            padding: 20,
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#08194A",
              marginBottom: 8,
            }}
          >
            Ask a question
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#64748B",
              marginBottom: 12,
              lineHeight: 1.55,
            }}
          >
            You can ask about practice hours, parent rules, night driving,
            appointments, or road test preparation.
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={3000}
            placeholder="Example: My teen is getting close to the road test. What should I check before we schedule it, and what paperwork should we bring?"
            style={{
              width: "100%",
              minHeight: 140,
              padding: 14,
              borderRadius: 14,
              border: "1px solid #CBD5E1",
              background: "#F8FAFC",
              color: "#0F172A",
              fontSize: 16,
              lineHeight: 1.6,
              boxSizing: "border-box",
              resize: "vertical",
              outline: "none",
            }}
          />

          <div
            style={{
              marginTop: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Tip: Press Ctrl + Enter to send
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600 }}>
              {prompt.trim().length} / 3000 characters
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.5,
            }}
          >
            Long questions may take a little longer to answer.
          </div>

          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 10 }}>
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                disabled={loading}
                style={{
                  background: "#FFF8DB",
                  color: loading ? "#A8A29E" : "#6B5600",
                  border: "1px solid #F4E08A",
                  borderRadius: 999,
                  padding: "9px 12px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Parent-friendly guidance with practical next steps.
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={clearPrompt}
                disabled={!canClear}
                style={{
                  background: "#FFFFFF",
                  color: canClear ? "#08194A" : "#94A3B8",
                  border: "1px solid #CBD5E1",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: canClear ? "pointer" : "not-allowed",
                  opacity: canClear ? 1 : 0.75,
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => {
                  void sendPrompt()
                }}
                disabled={!canSend}
                style={{
                  background: canSend ? "#08194A" : "#94A3B8",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 12,
                  padding: "12px 18px",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: canSend ? "pointer" : "not-allowed",
                  minWidth: 130,
                }}
              >
                {loading ? "Thinking..." : "Ask AI"}
              </button>
            </div>
          </div>
        </div>

        <div
          ref={responseRef}
          style={{
            background: "#FFFFFF",
            border: "1px solid #DCE4EE",
            borderRadius: 18,
            padding: 16,
            boxShadow: "0 6px 18px rgba(15, 23, 42, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: "#08194A" }}>
              AI response
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: loading ? "#92400E" : response ? "#166534" : "#475569",
                background: loading ? "#FFF7ED" : response ? "#ECFDF3" : "#F8FAFC",
                border: `1px solid ${
                  loading ? "#FED7AA" : response ? "#BBF7D0" : "#E2E8F0"
                }`,
                borderRadius: 999,
                padding: "6px 9px",
              }}
            >
              {loading ? "Generating" : response ? "Ready" : "Waiting"}
            </div>
          </div>

          <div
            style={{
              minHeight: 110,
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              background: "#FAFCFE",
              padding: 14,
              whiteSpace: "pre-wrap",
              color: "#334155",
              fontSize: 15,
              lineHeight: 1.65,
              opacity: loading || response ? 1 : 0.92,
              transform: loading || response ? "translateY(0)" : "translateY(2px)",
              transition: "opacity 220ms ease, transform 220ms ease",
            }}
          >
            {loading
              ? "Preparing your answer..."
              : response || "Your answer will appear here."}
          </div>
        </div>
      </div>
    </div>
  )
}