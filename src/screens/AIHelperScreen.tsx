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
        body: JSON.stringify({ prompt: prompt.trim(), mode: "faq" }),
        signal: controller.signal,
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || `Server error: ${res.status}`)
      }

      setResponse(data?.output ?? "No response received.")
    } catch (error) {
      if ((error as Error)?.name === "AbortError") return

      setResponse(
        error instanceof Error && error.message
          ? error.message
          : "We couldn't reach the AI helper right now. Please try again in a moment."
      )
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
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
              fontSize: 16,
              fontWeight: 800,
              color: "#08194A",
              marginBottom: 6,
            }}
          >
            Ask a question
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#475569",
              marginBottom: 2,
              fontWeight: 600,
            }}
          >
            Tap the box below to type
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

          <div
            style={{
              marginTop: 14,
              border: "2px solid #B8C7DC",
              borderRadius: 18,
              background: "#F8FBFF",
              boxShadow:
                "inset 0 1px 2px rgba(8, 25, 74, 0.05), 0 6px 18px rgba(8, 25, 74, 0.04)",
              padding: 12,
            }}
          >
            <label
              htmlFor="ai-helper-prompt"
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 800,
                color: "#08194A",
                marginBottom: 10,
                letterSpacing: 0.2,
              }}
            >
              Type your question here
            </label>

            <textarea
              id="ai-helper-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={3000}
              placeholder="Example: My teen is getting close to the road test. What should I check before we schedule it, and what paperwork should we bring?"
              style={{
                width: "100%",
                minHeight: 170,
                padding: 16,
                borderRadius: 14,
                border: "2px solid #7C93B3",
                background: "#FFFFFF",
                color: "#0F172A",
                fontSize: 16,
                lineHeight: 1.65,
                boxSizing: "border-box",
                resize: "vertical",
                outline: "none",
                boxShadow: "inset 0 1px 3px rgba(15, 23, 42, 0.06)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "2px solid #08194A"
                e.currentTarget.style.boxShadow =
                  "0 0 0 4px rgba(8, 25, 74, 0.12), inset 0 1px 3px rgba(15, 23, 42, 0.05)"
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.border = "2px solid #08194A"
                  e.currentTarget.parentElement.style.background = "#F3F8FF"
                }
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "2px solid #7C93B3"
                e.currentTarget.style.boxShadow =
                  "inset 0 1px 3px rgba(15, 23, 42, 0.06)"
                if (e.currentTarget.parentElement) {
                  e.currentTarget.parentElement.style.border = "2px solid #B8C7DC"
                  e.currentTarget.parentElement.style.background = "#F8FBFF"
                }
              }}
            />

            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 12, color: "#5B6B82", fontWeight: 600 }}>
                Ask anything about permits, hours, paperwork, or the road test.
              </div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 700 }}>
                {prompt.trim().length} / 3000 characters
              </div>
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
          role="status"
          aria-live="polite"
          style={{
            background: "#FFFFFF",
            border: "1px solid #C9D7E6",
            borderRadius: 20,
            padding: 18,
            boxShadow: "0 10px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#08194A",
                }}
              >
                AI response
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: "#64748B",
                  fontWeight: 600,
                }}
              >
                Your answer appears below after NJDrive50 finishes generating it.
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: loading ? "#92400E" : response ? "#166534" : "#475569",
                background: loading ? "#FFF7ED" : response ? "#ECFDF3" : "#F8FAFC",
                border: `1px solid ${
                  loading ? "#FED7AA" : response ? "#BBF7D0" : "#CBD5E1"
                }`,
                borderRadius: 999,
                padding: "7px 10px",
                letterSpacing: 0.2,
              }}
            >
              {loading ? "Generating" : response ? "Ready" : "Waiting"}
            </div>
          </div>

          <div
            style={{
              minHeight: 140,
              border: loading
                ? "2px solid #F59E0B"
                : response
                  ? "2px solid #86EFAC"
                  : "2px solid #D6E0EA",
              borderRadius: 16,
              background: loading
                ? "#FFFDF7"
                : response
                  ? "#F8FFFB"
                  : "#F8FAFC",
              padding: 16,
              whiteSpace: "pre-wrap",
              color: "#1E293B",
              fontSize: 15,
              lineHeight: 1.7,
              boxShadow: "inset 0 1px 3px rgba(15, 23, 42, 0.05)",
              transition:
                "border-color 220ms ease, background 220ms ease, box-shadow 220ms ease",
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