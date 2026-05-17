// src/screens/HelpFAQ/index.tsx

import { useId, useMemo, useState } from "react"
import { useNav } from "../../state/navStore"

export default function HelpFaq() {
  const { goBack } = useNav()
  const [query, setQuery] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  const q = query.trim().toLowerCase()

  const sections = useMemo(
    () => [
      {
        title: "Getting Started",
        children: (
          <>
            <FAQ
              question="How do I log a drive?"
              answer="Go to Home → Start New Drive. NJDrive50 automatically tracks time and conditions."
            />
            <FAQ
              question="How many hours are required?"
              answer="NJ requires 50 supervised hours, including 10 at night."
            />
            <FAQ
              question="Can I edit a drive?"
              answer="Yes — go to Driving Log → select a drive → Edit."
            />
            <FAQ
              question="Can I delete a drive?"
              answer="Yes — open the drive → scroll down → Delete Drive."
            />
            <FAQ
              question="Does NJDrive50 work offline?"
              answer="Yes — drives save locally and sync when online."
            />
          </>
        ),
      },
      {
        title: "Road Test Day",
        children: (
          <>
            <FAQ
              question="What documents do I need?"
              answer="Permit, registration, insurance, and your completed NJDrive50 log."
            />
            <FAQ
              question="What if the examiner says the car isn't safe?"
              answer="NJDrive50 includes a pre-test checklist to help avoid this."
            />
            <FAQ
              question="Can we use a rental car?"
              answer="Only if the rental company allows it and the car meets MVC rules."
            />
            <FAQ
              question="What time should we arrive?"
              answer="MVC recommends arriving 15 minutes early."
            />
            <FAQ
              question="What if we fail?"
              answer="You can reschedule. NJDrive50 helps track remaining practice hours."
            />
          </>
        ),
      },
      {
        title: "Troubleshooting",
        children: (
          <>
            <FAQ
              question="My hours aren't updating."
              answer="Make sure each drive is saved. Restart the app if needed."
            />
            <FAQ
              question="The timer didn't stop."
              answer="You can manually adjust the end time in the Driving Log."
            />
            <FAQ
              question="The app froze during a drive."
              answer="Reopen the app — your drive is auto-saved every 10 seconds."
            />
            <FAQ
              question="Night hours aren't counting."
              answer="NJDrive50 uses sunset data — drives after sunset count automatically."
            />
            <FAQ
              question="Weather didn't load."
              answer="Weather requires a connection. You can manually edit conditions."
            />
          </>
        ),
      },
      {
        title: "Parent Questions",
        children: (
          <>
            <FAQ
              question="Can multiple parents log drives?"
              answer="Yes — NJDrive50 supports multi-supervisor logging."
            />
            <FAQ
              question="Can I track both my kids?"
              answer="Multi-teen support is coming soon."
            />
            <FAQ
              question="How do I export the log?"
              answer="Go to Settings → Export Log → Download PDF."
            />
            <FAQ
              question="Is NJDrive50 accepted by MVC?"
              answer="Yes — the log format matches MVC requirements."
            />
            <FAQ
              question="Are we behind?"
              answer="NJDrive50 shows progress bars so you always know where you stand."
            />
          </>
        ),
      },
      {
        title: "Drive Tracking & Accuracy",
        children: (
          <>
            <FAQ
              question="How does NJDrive50 track time?"
              answer="A precise internal timer runs even if the app is minimized."
            />
            <FAQ
              question="Does it track location?"
              answer="Only if you enable it — used for distance and route summaries."
            />
            <FAQ
              question="Does it track speed?"
              answer="No — NJDrive50 avoids collecting sensitive driving data."
            />
            <FAQ
              question="How does it detect night hours?"
              answer="Based on official sunset times for your location."
            />
            <FAQ
              question="Can I split a drive?"
              answer="Yes — edit the drive and adjust start/end times."
            />
          </>
        ),
      },
    ],
    []
  )

  async function handleAskAI() {
    if (!aiQuestion.trim() || loading) return

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
    } finally {
      setLoading(false)
    }
  }

  const visibleSectionCount = sections.filter((section) => {
    const text = extractText(section.children).toLowerCase()
    return !q || section.title.toLowerCase().includes(q) || text.includes(q)
  }).length

  return (
    <div className="min-h-screen w-full bg-[#F7F9FC] text-[#08194A]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 pb-24 pt-4 sm:px-4 lg:px-6">
        <header className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => goBack()}
                className="inline-flex items-center rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
              >
                ← Back
              </button>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
                Support Center
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Help & FAQ
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                Search help topics, review common answers, or ask NJDrive50 AI
                for quick guidance about logs, road tests, and requirements.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-medium text-[#08194A]/60">
              <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
                {visibleSectionCount} sections
              </span>
              {q ? (
                <span className="rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[#8A6500]">
                  Filter: {query}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="help-search" className="sr-only">
              Search help topics
            </label>
            <input
              id="help-search"
              type="text"
              placeholder="Search help topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            {sections.map((section) => (
              <FilteredCollapse key={section.title} title={section.title} query={q}>
                {section.children}
              </FilteredCollapse>
            ))}

            {visibleSectionCount === 0 && (
              <div className="rounded-3xl border border-dashed border-[#08194A]/12 bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                <p className="text-sm font-semibold text-[#08194A]">
                  No matching help topics found.
                </p>
                <p className="mt-2 text-sm text-[#08194A]/60">
                  Try a different keyword like “night hours”, “export”, or “road test”.
                </p>
              </div>
            )}
          </section>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-5">
              <div className="inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
                Ask NJDrive50 AI
              </div>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight text-[#08194A]">
                Need a faster answer?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                Ask about driving logs, road test prep, night hours, or New Jersey
                requirements.
              </p>

              <div className="mt-4">
                <label htmlFor="ai-question" className="sr-only">
                  Ask NJDrive50 AI
                </label>
                <input
                  id="ai-question"
                  type="text"
                  placeholder="Type your question…"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
                />
              </div>

              <button
  type="button"
  className={`mt-3 min-h-[48px] w-full rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition ${
    loading || !aiQuestion.trim()
      ? "cursor-not-allowed bg-[#08194A] opacity-50"
      : "bg-[#08194A] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
  }`}
  aria-disabled={loading || !aiQuestion.trim()}
  onClick={() => {
    if (loading || !aiQuestion.trim()) return
    handleAskAI()
  }}
>
  {loading ? "Thinking…" : "Ask NJDrive50 AI"}
</button>


              {aiAnswer && (
                <div className="mt-4 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 text-sm leading-6 text-[#08194A] whitespace-pre-wrap">
                  {aiAnswer}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function FAQ({
  question,
  answer,
}: {
  question: string
  answer: string
}) {
  return (
    <div className="rounded-2xl bg-[#F7F9FC] px-4 py-3">
      <p className="text-sm font-bold text-[#08194A]">{question}</p>
      <p className="mt-1 text-sm leading-6 text-[#08194A]/72">{answer}</p>
    </div>
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
  const panelId = useId()
  const buttonId = useId()

  const contentText = extractText(children).toLowerCase()
  const matches =
    !query ||
    title.toLowerCase().includes(query) ||
    contentText.includes(query)

  if (!matches) return null

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
      <h2>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((prev) => !prev)}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
        >
          <span className="text-base font-bold text-[#0A1E5E] sm:text-lg">
            {title}
          </span>

          <span
            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#F7F9FC] text-xl font-medium text-[#0A1E5E]"
            aria-hidden="true"
          >
            {open ? "−" : "+"}
          </span>
        </button>
      </h2>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className="border-t border-[#08194A]/8 px-4 pb-4 pt-3 sm:px-5 sm:pb-5"
        >
          <div className="space-y-3">{children}</div>
        </div>
      )}
    </section>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join(" ")
  if (node !== null && typeof node === "object" && "props" in node) {
    const el = node as { props?: { children?: React.ReactNode } }
    return extractText(el.props?.children ?? "")
  }
  return ""
}