// src/screens/MilestonesContent.tsx
// TRUST-CORRECTED VERSION
// [FIX-1] useDriveHistory() falls back to [] — null state never crashes reduce()
// [FIX-2] Night milestone text explicitly says "(night hours)"
// [FIX-3] Shared-style formatHours() for consistency with Summary
// [FIX-4] Day Hours labeled informationally in compliance grid
// [FIX-5] Compliance completion message is direct and certification-oriented
// [FIX-6] Close button uses goBack() — consistent with app-wide back-stack pattern
// [FIX-7] setScreen prop removed — no longer needed after goBack() adoption

import { motion } from "framer-motion"
import { useMemo, useState } from "react"
import { useTeenPhoto } from "../state/profileStore"
import { useDriveHistory, type DriveEntry } from "../state/driveStore"
import { useNav } from "../state/navStore"

const REQUIRED_TOTAL_HOURS = 50
const REQUIRED_NIGHT_HOURS = 10

const safeNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatHours = (hours: number) => {
  const safeHours = Number.isFinite(hours) ? Math.max(hours, 0) : 0
  const wholeHours = Math.floor(safeHours)
  const minutes = Math.round((safeHours - wholeHours) * 60)

  if (minutes === 60) {
    return `${wholeHours + 1}h 0m`
  }

  return `${wholeHours}h ${minutes}m`
}

type MilestoneItem = {
  label: string
  requirement: number
  value: number
  kind: "total" | "night"
}

export default function MilestonesContent() {
  // [FIX-1] Safe fallback prevents crash if store hydrates as null/undefined
  const history = useDriveHistory() || []
  const teenPhoto = useTeenPhoto()
  const [teenImgFailed, setTeenImgFailed] = useState(false)
  // [FIX-6] goBack() for close — consistent with app-wide back-stack pattern
  const { goBack } = useNav()

  const summary = useMemo(() => {
    return history.reduce(
      (acc, entry: DriveEntry) => {
        acc.totalHours += safeNumber(entry.totalDurationHours)
        acc.dayHours   += safeNumber(entry.dayDurationHours)
        acc.nightHours += safeNumber(entry.nightDurationHours)
        return acc
      },
      { totalHours: 0, dayHours: 0, nightHours: 0 }
    )
  }, [history])

  const { totalHours, dayHours, nightHours } = summary

  const remainingHours      = Math.max(REQUIRED_TOTAL_HOURS - totalHours, 0)
  const remainingNightHours = Math.max(REQUIRED_NIGHT_HOURS - nightHours, 0)

  const progressPercent = Math.min(
    (totalHours / REQUIRED_TOTAL_HOURS) * 100,
    100
  )

  const nightProgressPercent = Math.min(
    (nightHours / REQUIRED_NIGHT_HOURS) * 100,
    100
  )

  const isFullyCompliant =
    totalHours >= REQUIRED_TOTAL_HOURS &&
    nightHours >= REQUIRED_NIGHT_HOURS

  const milestones: MilestoneItem[] = [
    { label: "First 10 Hours",  requirement: 10,                   value: totalHours, kind: "total" },
    { label: "20 Hours Logged", requirement: 20,                   value: totalHours, kind: "total" },
    { label: "Night Driving",   requirement: REQUIRED_NIGHT_HOURS, value: nightHours, kind: "night" },
    { label: "40 Hours Logged", requirement: 40,                   value: totalHours, kind: "total" },
    { label: "Full 50 Hours",   requirement: REQUIRED_TOTAL_HOURS, value: totalHours, kind: "total" },
  ]

  const complianceMessage = isFullyCompliant
    ? "50 total supervised hours and 10 night hours are complete — ready for NJ supervised-driving certification."
    : totalHours >= REQUIRED_TOTAL_HOURS && nightHours < REQUIRED_NIGHT_HOURS
    ? `Total hours are complete — ${formatHours(remainingNightHours)} of night driving still needed.`
    : `Keep going — ${formatHours(remainingHours)} total and ${formatHours(remainingNightHours)} night hours still needed.`

  return (
    <div className="w-full px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_48px_rgba(8,25,74,0.08)]">
        <div className="relative border-b-4 border-[#f9c80e] bg-white p-8 pb-12 text-[#08194A]">

          {/* [FIX-6] goBack() replaces navigate() */}
          <button
            type="button"
            onClick={() => goBack("summary")}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-[#08194A]/10 bg-white shadow-sm transition hover:bg-[#F7FAFF]"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-[#08194A]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Milestones
            </h1>
            <p className="mt-1 text-sm text-[#08194A]/70">
              Track your teen's progress toward New Jersey's supervised driving requirements.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[#f9c80e] shadow-[0_4px_12px_rgba(8,25,74,0.25)]">
              {teenPhoto && !teenImgFailed ? (
                <img
                  src={teenPhoto}
                  alt="Teen driver"
                  onError={() => setTeenImgFailed(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#fff8d6] to-[#ffe566] text-xs font-bold text-[#08194A]">
                  NJ
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6">
          {milestones.map((m, i) => {
            const pct       = Math.min((m.value / m.requirement) * 100, 100)
            const done      = m.value >= m.requirement
            const remaining = Math.max(m.requirement - m.value, 0)

            return (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="rounded-2xl border border-[#08194A]/10 bg-[#F7FAFF] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-[#08194A]">{m.label}</h3>
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.12em] ${
                      done ? "text-[#00C49A]" : "text-[#f9c80e]"
                    }`}
                  >
                    {done ? "Complete" : `${pct.toFixed(0)}%`}
                  </span>
                </div>

                <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#E2E9F5]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{
                      background: done
                        ? "linear-gradient(90deg,#00C49A,#00e8b8)"
                        : "linear-gradient(90deg,#08194A,#f9c80e)",
                    }}
                  />
                </div>

                <p className="mt-2 text-sm text-[#08194A]/70">
                  {done
                    ? "Milestone completed — great progress!"
                    : m.kind === "night"
                    ? `${formatHours(remaining)} remaining (night hours)`
                    : `${formatHours(remaining)} remaining`}
                </p>
              </motion.div>
            )
          })}
        </div>

        <div className="border-t border-[#08194A]/10 bg-[#F9FAFF] p-6">
          <h2 className="mb-3 text-lg font-bold text-[#08194A]">
            Compliance Summary
          </h2>

          <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-4">
            {[
              {
                label: "Total Hours",
                value: `${formatHours(totalHours)} / ${formatHours(REQUIRED_TOTAL_HOURS)}`,
              },
              {
                label: "Day Hours",
                value: `${formatHours(dayHours)}`,
                info: true,
              },
              {
                label: "Night Hours",
                value: `${formatHours(nightHours)} / ${formatHours(REQUIRED_NIGHT_HOURS)}`,
              },
              {
                label: "Night Remaining",
                value: `${formatHours(remainingNightHours)}`,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-[#08194A]/10 bg-white p-3"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#08194A]/50">
                  {s.label}
                  {"info" in s && s.info && (
                    <span className="ml-1.5 rounded-full border border-[#08194A]/10 bg-[#F4F6FA] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#08194A]/45">
                      INFO
                    </span>
                  )}
                </p>
                <p className="mt-1 text-base font-black text-[#08194A]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#08194A]/10 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#08194A] to-[#f9c80e] transition-all duration-700 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-[#08194A]/75">
              {progressPercent.toFixed(0)}% of total required hours completed
            </p>
          </div>

          <div className="mt-4">
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#08194A]/10 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0A1E5E] to-[#00C49A] transition-all duration-700 ease-in-out"
                style={{ width: `${nightProgressPercent}%` }}
              />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-[#08194A]/75">
              {nightProgressPercent.toFixed(0)}% of required night hours completed
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#f9c80e]/60 bg-white px-4 py-3 text-center text-sm font-medium text-[#08194A] shadow-sm">
            {complianceMessage}
          </div>

          <p className="mt-4 text-center text-xs text-[#08194A]/60">
            NJ GDL law requires 50 total supervised hours, including 10 night hours.
          </p>
        </div>
      </div>
    </div>
  )
}