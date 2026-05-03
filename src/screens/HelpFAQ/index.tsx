// src/screens/HelpFAQ/index.tsx

import { useState } from "react"
import { useNav } from "../../state/navStore"

export default function HelpFaq() {
  const { goBack } = useNav()
  const [query, setQuery] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  const q = query.toLowerCase()

  async function handleAskAI() {
    if (!aiQuestion.trim()) return
    setLoading(true)
    setAiAnswer("")

    try {
      const base = import.meta.env.VITE_AI_SERVER_URL ?? "http://localhost:3001"
      const res = await fetch(`${base}/api/njdrive50-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiQuestion, mode: "faq" }),
      })
      const data = await res.json()
      setAiAnswer(data.output ?? "I couldn't find an answer, but I'm here to help.")
    } catch {
      setAiAnswer("Something went wrong. Please try again.")
    }

    setLoading(false)
  }

  return (
    <div className="w-full min-h-screen bg-[#F7F9FC] flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 bg-white shadow-sm">
        <button
          onClick={() => goBack()}
          className="text-[#0A1E5E] font-semibold"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-[#0A1E5E]">Help & FAQ</h1>
        <div className="w-10" />
      </header>

      {/* Search */}
      <div className="px-5 pt-4">
        <input
          type="text"
          placeholder="Search help topics…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border border-[#0A1E5E]/20 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

        <FilteredCollapse title="Getting Started" query={q}>
          <FAQ>
            <strong>How do I log a drive?</strong><br />
            Go to Home → Start New Drive. NJDrive50 automatically tracks time and conditions.
          </FAQ>
          <FAQ>
            <strong>How many hours are required?</strong><br />
            NJ requires 50 supervised hours, including 10 at night.
          </FAQ>
          <FAQ>
            <strong>Can I edit a drive?</strong><br />
            Yes — go to Driving Log → select a drive → Edit.
          </FAQ>
          <FAQ>
            <strong>Can I delete a drive?</strong><br />
            Yes — open the drive → scroll down → Delete Drive.
          </FAQ>
          <FAQ>
            <strong>Does NJDrive50 work offline?</strong><br />
            Yes — drives save locally and sync when online.
          </FAQ>
        </FilteredCollapse>

        <FilteredCollapse title="Road Test Day" query={q}>
          <FAQ>
            <strong>What documents do I need?</strong><br />
            Permit, registration, insurance, and your completed NJDrive50 log.
          </FAQ>
          <FAQ>
            <strong>What if the examiner says the car isn't safe?</strong><br />
            NJDrive50 includes a pre-test checklist to help avoid this.
          </FAQ>
          <FAQ>
            <strong>Can we use a rental car?</strong><br />
            Only if the rental company allows it and the car meets MVC rules.
          </FAQ>
          <FAQ>
            <strong>What time should we arrive?</strong><br />
            MVC recommends arriving 15 minutes early.
          </FAQ>
          <FAQ>
            <strong>What if we fail?</strong><br />
            You can reschedule. NJDrive50 helps track remaining practice hours.
          </FAQ>
        </FilteredCollapse>

        <FilteredCollapse title="Troubleshooting" query={q}>
          <FAQ>
            <strong>My hours aren't updating.</strong><br />
            Make sure each drive is saved. Restart the app if needed.
          </FAQ>
          <FAQ>
            <strong>The timer didn't stop.</strong><br />
            You can manually adjust the end time in the Driving Log.
          </FAQ>
          <FAQ>
            <strong>The app froze during a drive.</strong><br />
            Reopen the app — your drive is auto-saved every 10 seconds.
          </FAQ>
          <FAQ>
            <strong>Night hours aren't counting.</strong><br />
            NJDrive50 uses sunset data — drives after sunset count automatically.
          </FAQ>
          <FAQ>
            <strong>Weather didn't load.</strong><br />
            Weather requires a connection. You can manually edit conditions.
          </FAQ>
        </FilteredCollapse>

        <FilteredCollapse title="Parent Questions" query={q}>
          <FAQ>
            <strong>Can multiple parents log drives?</strong><br />
            Yes — NJDrive50 supports multi-supervisor logging.
          </FAQ>
          <FAQ>
            <strong>Can I track both my kids?</strong><br />
            Multi-teen support is coming soon.
          </FAQ>
          <FAQ>
            <strong>How do I export the log?</strong><br />
            Go to Settings → Export Log → Download PDF.
          </FAQ>
          <FAQ>
            <strong>Is NJDrive50 accepted by MVC?</strong><br />
            Yes — the log format matches MVC requirements.
          </FAQ>
          <FAQ>
            <strong>Are we behind?</strong><br />
            NJDrive50 shows progress bars so you always know where you stand.
          </FAQ>
        </FilteredCollapse>

        <FilteredCollapse title="Drive Tracking & Accuracy" query={q}>
          <FAQ>
            <strong>How does NJDrive50 track time?</strong><br />
            A precise internal timer runs even if the app is minimized.
          </FAQ>
          <FAQ>
            <strong>Does it track location?</strong><br />
            Only if you enable it — used for distance and route summaries.
          </FAQ>
          <FAQ>
            <strong>Does it track speed?</strong><br />
            No — NJDrive50 avoids collecting sensitive driving data.
          </FAQ>
          <FAQ>
            <strong>How does it detect night hours?</strong><br />
            Based on official sunset times for your location.
          </FAQ>
          <FAQ>
            <strong>Can I split a drive?</strong><br />
            Yes — edit the drive and adjust start/end times.
          </FAQ>
        </FilteredCollapse>

        {/* AI Helper */}
        <FilteredCollapse title="Ask NJDrive50 AI" query={q}>
          <p className="text-sm text-[#08194A]">
            Ask anything about driving logs, road tests, or NJ requirements.
          </p>
          <input
            type="text"
            placeholder="Type your question…"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            className="w-full border border-[#0A1E5E]/20 rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button
            className="w-full py-3 rounded-lg bg-[#0A1E5E] text-white font-semibold text-sm disabled:opacity-50"
            onClick={handleAskAI}
            disabled={loading}
          >
            {loading ? "Thinking…" : "Ask NJDrive50 AI"}
          </button>
          {aiAnswer && (
            <div className="bg-[#F1F4FA] border border-[#0A1E5E]/10 rounded-xl p-4 text-sm text-[#08194A] whitespace-pre-wrap mt-3">
              {aiAnswer}
            </div>
          )}
        </FilteredCollapse>

      </div>
    </div>
  )
}

function FAQ({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-[#08194A]" data-faq="true">
      {children}
    </p>
  )
}

function FilteredCollapse({
  title,
  query,
  children,
}: {
  title: string
  query: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  const contentText = extractText(children).toLowerCase()

  if (query && !title.toLowerCase().includes(query) && !contentText.includes(query)) {
    return null
  }

  return (
    <div className="border border-[#0A1E5E]/10 rounded-2xl bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 py-3 text-left"
      >
        <span className="text-[#0A1E5E] font-semibold text-base">{title}</span>
        <span className="text-[#0A1E5E] text-xl">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(extractText).join(" ")
  if (node !== null && typeof node === "object" && "props" in node) {
    const el = node as { props?: { children?: React.ReactNode } }
    return extractText(el.props?.children ?? "")
  }
  return ""
}