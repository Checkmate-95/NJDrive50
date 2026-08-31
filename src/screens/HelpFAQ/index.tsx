// src/screens/HelpFAQ/index.tsx
import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useNav } from "../../state/navStore"

type FAQItem = {
  question: string
  answer: string
}

type FAQSection = {
  title: string
  items: FAQItem[]
}

type HighlightedTextProps = {
  text: string
  query: string
}

type FilteredFAQItem = FAQItem & {
  matches: boolean
}

type FilteredFAQSection = FAQSection & {
  titleMatches: boolean
  items: FilteredFAQItem[]
}

const AI_URL = import.meta.env.VITE_AI_HELPER_API_URL?.trim() || "/api/njdrive50-ai"
const MAX_AI_QUESTION_LENGTH = 2000

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function HighlightedText({ text, query }: HighlightedTextProps) {
  const trimmed = query.trim()
  if (!trimmed) return <>{text}</>

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, "ig")
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === trimmed.toLowerCase()
        return isMatch ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-[#FFF0B3] px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      })}
    </>
  )
}

export default function HelpFaq() {
  const { goBack } = useNav()
  const [query, setQuery] = useState("")
  const [aiQuestion, setAiQuestion] = useState("")
  const [aiAnswer, setAiAnswer] = useState("")
  const [loading, setLoading] = useState(false)

  const abortRef = useRef<AbortController | null>(null)

  const q = query.trim().toLowerCase()
  const trimmedAiQuestion = aiQuestion.trim()
  const canAskAI = Boolean(trimmedAiQuestion) && !loading

  const sections = useMemo<FAQSection[]>(
    () => [
      {
        title: "Getting Started",
        items: [
          {
            question: "How do I log a drive?",
            answer:
              "Go to Home → Start New Drive. NJDrive50 automatically tracks time and conditions.",
          },
          {
            question: "How many hours are required?",
            answer: "NJ requires 50 supervised hours, including 10 at night.",
          },
          {
            question: "Can I edit a drive?",
            answer: "Yes — go to Driving Log → select a drive → Edit.",
          },
          {
            question: "Can I delete a drive?",
            answer: "Yes — open the drive → scroll down → Delete Drive.",
          },
          {
            question: "Does NJDrive50 work offline?",
            answer: "Yes — drives save locally and sync when online.",
          },
        ],
      },
      {
        title: "Road Test Day",
        items: [
          {
            question: "What documents do I need?",
            answer:
              "Permit, registration, insurance, and your completed NJDrive50 log.",
          },
          {
            question: "What if the examiner says the car isn't safe?",
            answer:
              "NJDrive50 includes a pre-test checklist to help avoid this.",
          },
          {
            question: "Can we use a rental car?",
            answer:
              "Only if the rental company allows it and the car meets MVC rules.",
          },
          {
            question: "What time should we arrive?",
            answer: "MVC recommends arriving 15 minutes early.",
          },
          {
            question: "What if we fail?",
            answer:
              "You can reschedule. NJDrive50 helps track remaining practice hours.",
          },
        ],
      },
      {
        title: "Troubleshooting",
        items: [
          {
            question: "My hours aren't updating.",
            answer:
              "Make sure each drive is saved. Restart the app if needed.",
          },
          {
            question: "The timer didn't stop.",
            answer:
              "You can manually adjust the end time in the Driving Log.",
          },
          {
            question: "The app froze during a drive.",
            answer:
              "Reopen the app — your drive is auto-saved every 10 seconds.",
          },
          {
            question: "Night hours aren't counting.",
            answer:
              "NJDrive50 uses sunset data — drives after sunset count automatically.",
          },
          {
            question: "Weather didn't load.",
            answer:
              "Weather requires a connection. You can manually edit conditions.",
          },
        ],
      },
      {
        title: "Parent Questions",
        items: [
          {
            question: "Can multiple parents log drives?",
            answer:
              "Yes — NJDrive50 supports multi-supervisor logging.",
          },
          {
            question: "Can I track both my kids?",
            answer: "Multi-teen support is coming soon.",
          },
          {
            question: "How do I export the log?",
            answer: "Go to Settings → Export Log → Download PDF.",
          },
          {
            question: "Is NJDrive50 accepted by MVC?",
            answer: "Yes — the log format matches MVC requirements.",
          },
          {
            question: "Are we behind?",
            answer:
              "NJDrive50 shows progress bars so you always know where you stand.",
          },
        ],
      },
      {
        title: "Drive Tracking & Accuracy",
        items: [
          {
            question: "How does NJDrive50 track time?",
            answer:
              "A precise internal timer runs even if the app is minimized.",
          },
          {
            question: "Does it track location?",
            answer:
              "Only if you enable it — used for distance and route summaries.",
          },
          {
            question: "Does it track speed?",
            answer:
              "No — NJDrive50 avoids collecting sensitive driving data.",
          },
          {
            question: "How does it detect night hours?",
            answer:
              "Based on official sunset times for your location.",
          },
          {
            question: "Can I split a drive?",
            answer: "Yes — edit the drive and adjust start/end times.",
          },
        ],
      },
    ],
    []
  )

  const filteredSections = useMemo<FilteredFAQSection[]>(() => {
    return sections
      .map((section) => {
        const titleMatches = section.title.toLowerCase().includes(q)

        if (!q) {
          return {
            ...section,
            titleMatches: false,
            items: section.items.map((item) => ({
              ...item,
              matches: false,
            })),
          }
        }

        const items: FilteredFAQItem[] = section.items
  .map((item) => {
    const haystack = `${item.question} ${item.answer}`.toLowerCase()
    return {
      ...item,
      matches: titleMatches || haystack.includes(q),
    }
  })
  .filter((item) => titleMatches || item.matches)

        if (titleMatches) {
          return {
            ...section,
            titleMatches: true,
            items: section.items.map((item) => ({
              ...item,
              matches: true,
            })),
          }
        }

        return {
          ...section,
          titleMatches: false,
          items,
        }
      })
      .filter((section) => section.items.length > 0)
  }, [sections, q])

  async function handleAskAI() {
    const prompt = trimmedAiQuestion
    if (!prompt || loading) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setAiAnswer("")

    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ prompt, mode: "faq" }),
        signal: controller.signal,
      })

      const contentType = res.headers.get("content-type") ?? ""
      const data = contentType.includes("application/json")
        ? await res.json().catch(() => null)
        : null

      const output =
        typeof data === "object" &&
        data !== null &&
        "output" in data &&
        typeof (data as { output?: unknown }).output === "string"
          ? (data as { output: string }).output.trim()
          : null

      const errorMessage =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error?: unknown }).error === "string"
          ? (data as { error: string }).error
          : null

      if (!res.ok) {
        throw new Error(errorMessage || output || `Server error: ${res.status}`)
      }

      setAiAnswer(output || "I couldn't find an answer, but I'm here to help.")
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return

      setAiAnswer(
        error instanceof TypeError && error.message === "Failed to fetch"
          ? "Could not connect to NJDrive50 AI. Please check your internet connection and try again."
          : error instanceof Error && error.message
            ? error.message
            : "Something went wrong. Please try again."
      )
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function clearSearch() {
    setQuery("")
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return (
    <div className="w-full bg-[#F7F9FC] text-[#08194A]">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-3 pb-24 pt-4 sm:px-4 lg:px-6">
        <header className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <button
                type="button"
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
                {filteredSections.length} sections
              </span>
              {q ? (
                <span className="rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[#8A6500]">
                  Filter: {query}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="help-search" className="sr-only">
                Search help topics
              </label>
              <input
                id="help-search"
                type="text"
                placeholder="Search help topics..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
              />
            </div>

            {q ? (
              <button
                type="button"
                onClick={clearSearch}
                className="min-h-[48px] rounded-2xl border border-[#08194A]/10 bg-white px-4 py-3 text-sm font-semibold text-[#08194A]/75 transition hover:bg-[#F7F9FC] hover:text-[#08194A]"
              >
                Clear search
              </button>
            ) : null}
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
  <section className="space-y-4" aria-label="Help topics">
    {filteredSections.map((section: FilteredFAQSection) => (
      <FilteredCollapse
        key={section.title}
        title={section.title}
        query={q}
        autoOpen={Boolean(
          q &&
            (section.titleMatches ||
              section.items.some((item: FilteredFAQItem) => item.matches))
        )}
      >
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <FAQ
                      key={item.question}
                      question={item.question}
                      answer={item.answer}
                      query={q}
                    />
                  ))}
                </div>
              </FilteredCollapse>
            ))}

            {filteredSections.length === 0 && (
              <div className="rounded-3xl border border-dashed border-[#08194A]/12 bg-white px-5 py-8 text-center shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                <p className="text-sm font-semibold text-[#08194A]">
                  No matching help topics found.
                </p>
                <p className="mt-2 text-sm text-[#08194A]/60">
                  Try a different keyword like "night hours", "export", or "road test".
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
                  placeholder="Type your question..."
                  value={aiQuestion}
                  maxLength={MAX_AI_QUESTION_LENGTH}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canAskAI) {
                      e.preventDefault()
                      void handleAskAI()
                    }
                  }}
                  className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#08194A]/50">
                  <span>Short, specific questions work best.</span>
                  <span>
                    {aiQuestion.length} / {MAX_AI_QUESTION_LENGTH}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={!canAskAI}
                className={`mt-3 min-h-[48px] w-full rounded-xl px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition ${
                  canAskAI
                    ? "bg-[#08194A] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
                    : "cursor-not-allowed bg-[#08194A] opacity-50"
                }`}
                onClick={() => {
                  void handleAskAI()
                }}
              >
                {loading ? "Thinking..." : "Ask NJDrive50 AI"}
              </button>

              <div role="status" aria-live="polite" aria-atomic="true" className="mt-4">
                <div className="min-h-[96px] whitespace-pre-wrap rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 text-sm leading-6 text-[#08194A]">
                  {loading
                    ? "Preparing your answer..."
                    : aiAnswer || "Your answer will appear here."}
                </div>
              </div>
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
  query,
}: {
  question: string
  answer: string
  query: string
}) {
  return (
    <div className="rounded-2xl bg-[#F7F9FC] px-4 py-3">
      <p className="text-sm font-bold text-[#08194A]">
        <HighlightedText text={question} query={query} />
      </p>
      <p className="mt-1 text-sm leading-6 text-[#08194A]/72">
        <HighlightedText text={answer} query={query} />
      </p>
    </div>
  )
}

function FilteredCollapse({
  title,
  query,
  autoOpen,
  children,
}: {
  title: string
  query: string
  autoOpen: boolean
  children: ReactNode
}) {
  const [manualOpen, setManualOpen] = useState(false)
  const panelId = useId()
  const buttonId = useId()

  const open = autoOpen || manualOpen

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
      <h2>
        <button
          id={buttonId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setManualOpen((prev) => !prev)}
          className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 py-4 text-left sm:px-5"
        >
          <span className="text-base font-bold text-[#0A1E5E] sm:text-lg">
            <HighlightedText text={title} query={query} />
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
          {children}
        </div>
      )}
    </section>
  )
}