import { useMemo, useState } from "react"
import { practiceQuestions as QUESTIONS } from "../data/practiceQuestions"
import {
  buildTestQuestions,
  calcScorePercent,
  isPassing,
} from "../utils/practiceTestUtils"

const PASSING_PERCENT = 80
const QUESTION_COUNT = 23
const LANDING_PAGE_URL = "https://your-landing-page-url.com"

export default function PracticeTestPanel() {
  const [testSeed, setTestSeed] = useState(0)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const sessionQuestions = useMemo(() => {
    return buildTestQuestions(QUESTIONS, QUESTION_COUNT)
  }, [testSeed])

  const totalQuestions = sessionQuestions.length
  const isFinished = index >= totalQuestions
  const current = sessionQuestions[index]

  const answeredCount = Math.min(index, totalQuestions)
  const progressPercent = isFinished
    ? 100
    : Math.round(((index + 1) / totalQuestions) * 100)

  const scorePercent = useMemo(
    () => calcScorePercent(score, totalQuestions),
    [score, totalQuestions]
  )

  const passed = isPassing(scorePercent, PASSING_PERCENT)

  const handleSelect = (i: number) => {
    if (showResult) return
    setSelected(i)
  }

  const handleSubmit = () => {
    if (selected === null || !current || showResult) return

    if (selected === current.correctIndex) {
      setScore((s) => s + 1)
    }

    setShowResult(true)
  }

  const handleNext = () => {
    if (index >= totalQuestions - 1) {
      setIndex(totalQuestions)
      setSelected(null)
      setShowResult(false)
      return
    }

    setIndex((i) => i + 1)
    setSelected(null)
    setShowResult(false)
  }

  const handleRestart = () => {
    setTestSeed((n) => n + 1)
    setIndex(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
  }

  if (isFinished) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pb-6 pt-4">
        <div className="overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
                  23-Question Test Complete
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-[#08194A]">
                  23-Question Practice Test
                </h1>
              </div>

              <div
                className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] ${
                  passed
                    ? "bg-[#f9c80e] text-[#08194A]"
                    : "bg-[#F4F6FA] text-[#08194A] ring-1 ring-[#08194A]/10"
                }`}
              >
                {passed ? "PASSING RANGE" : "KEEP PRACTICING"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-[#08194A]/50 bg-[#F7F9FC] p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-[#08194A]/55">
                  Final Score
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-[#08194A]">
                  {score}
                  <span className="ml-1 text-base font-bold text-[#08194A]/60">
                    / {totalQuestions}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#08194A]/50 bg-[#F7F9FC] p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-[#08194A]/55">
                  Score %
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-[#08194A]">
                  {scorePercent}%
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-[#08194A]/50 bg-[#F4F6FA] p-4 shadow-sm">
              <p className="text-sm font-semibold text-[#08194A]">
                {passed
                  ? "Nice work — you're in a strong range for the NJ knowledge test."
                  : "Good start — keep practicing until you can consistently score at or above 80%."}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#08194A]/72">
                This practice quiz is based on New Jersey permit-test concepts
                and is for study support only.
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-[#08194A]/10 bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)]">
              <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/70 to-[#0A1E5E]" />

              <div className="p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">
                  Go Further
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-white">
                  More than practice questions
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  NJDrive50 helps families track supervised driving, log hours,
                  and stay aligned with NJ GDL expectations.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Restart Test
                  </button>

                  <a
                    href={LANDING_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-[#f9c80e] py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] transition hover:-translate-y-[1px] hover:brightness-105"
                  >
                    Visit NJDrive50
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!current) return null

  return (
    <div className="mx-auto w-full max-w-md px-4 pb-6 pt-4">
      <div className="overflow-hidden rounded-[28px] border border-[#0A1E5E]/15 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#08194A]" />

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#08194A]/55">
                Free NJ Practice Test
              </p>
              <h1 className="mt-1 text-2xl font-black leading-tight text-[#08194A]">
                New Jersey Permit Test
              </h1>
            </div>

            <div className="rounded-full bg-[#08194A] px-3 py-1 text-xs font-bold tracking-[0.14em] text-white ring-1 ring-[#f9c80e]/35">
              Q {index + 1}/{totalQuestions}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#08194A]/55">
                  Progress
                </p>
                <p className="mt-1 text-sm font-semibold text-[#08194A]">
                  {answeredCount} answered • Score {score}/{totalQuestions}
                </p>
              </div>

              <div className="rounded-full bg-[#f9c80e] px-3 py-1 text-xs font-bold text-[#08194A]">
                {progressPercent}%
              </div>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#08194A]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#f9c80e] to-[#08194A] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border-2 border-[#08194A]/50 bg-[#F4F6FA] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.16em] text-[#08194A]/55">
              Current Question
            </p>
            <p className="mt-2 text-lg font-bold leading-snug text-[#08194A]">
              {current.question}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {current.answers.map((answer, i) => {
              const isSelected = selected === i
              const isCorrect = i === current.correctIndex
              const showCorrect = showResult && isCorrect
              const showWrong = showResult && isSelected && !isCorrect

              let classes =
                "border-[#08194A]/15 bg-white text-[#08194A] hover:border-[#08194A]/35 hover:bg-[#F7F9FC]"

              if (isSelected && !showResult) {
                classes =
                  "border-[#f9c80e] bg-[#fff8d8] text-[#08194A] ring-2 ring-[#f9c80e]/30"
              }

              if (showCorrect) {
                classes =
                  "border-[#f9c80e] bg-[#fff8d8] text-[#08194A] ring-2 ring-[#f9c80e]/30"
              } else if (showWrong) {
                classes = "border-red-300 bg-red-50 text-red-700"
              }

              return (
                <button
                  key={`${current.id}-${i}`}
                  type="button"
                  onClick={() => handleSelect(i)}
                  disabled={showResult}
                  aria-pressed={isSelected}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${classes} ${
                    showResult ? "cursor-default" : "active:scale-[0.99]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        showCorrect
                          ? "bg-[#08194A] text-[#f9c80e]"
                          : showWrong
                          ? "bg-red-100 text-red-700"
                          : isSelected
                          ? "bg-[#08194A] text-[#f9c80e]"
                          : "bg-[#F4F6FA] text-[#08194A]"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-relaxed">
                        {answer}
                      </p>

                      {showCorrect && (
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/65">
                          Correct answer
                        </p>
                      )}

                      {showWrong && (
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-red-600">
                          Your selection
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {!showResult && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selected === null}
              className={`mt-5 w-full rounded-xl py-3 font-bold transition ${
                selected === null
                  ? "cursor-not-allowed bg-gray-300 text-gray-600"
                  : "bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.22)] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
              }`}
            >
              Check Answer
            </button>
          )}

          {showResult && (
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#08194A]/10 bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)]">
              <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/70 to-[#0A1E5E]" />

              <div className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-extrabold">
                    {selected === current.correctIndex ? "Correct!" : "Not quite."}
                  </p>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.14em] ${
                      selected === current.correctIndex
                        ? "bg-[#f9c80e] text-[#08194A]"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {selected === current.correctIndex ? "POINT EARNED" : "REVIEW"}
                  </div>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-white/82">
                  {current.explanation}
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full rounded-xl bg-[#f9c80e] py-3 text-sm font-bold text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] transition hover:-translate-y-[1px] hover:brightness-105"
                  >
                    {index === totalQuestions - 1
                      ? "Finish Practice Test"
                      : "Next Question"}
                  </button>

                  <button
                    type="button"
                    onClick={handleRestart}
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Restart Test
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 text-center">
            <a
              href={LANDING_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#08194A] underline underline-offset-4"
            >
              Learn more about NJDrive50
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}