// src/screens/DriveSummaryContent.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  lastDrive sorted by startTime — never insertion-order dependent
// [FIX-2]  hardReset() fires AFTER navigate() — session not destroyed before nav confirmed
// [FIX-3]  Active duration uses store's getElapsedSeconds() — no duplicate implementation
// [FIX-4]  LIVE SESSION / PAUSED / SUMMARY READY / NO DRIVES — both badges use sessionBadgeLabel
// [FIX-5]  Score and lastDriveTimeOfDay sourced from timestamp-sorted lastDrive

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { Screen } from "../App"
import { computeDriveScoreV2 } from "../utils/driveLogic"
import { useDriveHistory, type DriveEntry } from "../state/driveStore"
import { useTeenPhoto } from "../state/profileStore"
import { navigate } from "../navigation/navMap"
import { useActiveDriveStore } from "../state/activeDriveStore"

type DriveSummaryContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

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

const formatClock = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}

const getLightingLabel = (
  dayHours: number,
  nightHours: number
): "Day" | "Night" | "Mixed" => {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  return "Day"
}

export default function DriveSummaryContent({
  setScreen,
}: DriveSummaryContentProps) {
  const drives = useDriveHistory() || []
  const teenPhoto = useTeenPhoto()

  const activeSession = useActiveDriveStore((s) => s.session)
  const hardReset = useActiveDriveStore((s) => s.hardReset)
  // [FIX-3] Use store's canonical elapsed-seconds selector — no duplicate impl
const getElapsedSeconds = useActiveDriveStore((s) => s.getElapsedSeconds)

const [activeDurationSeconds, setActiveDurationSeconds] = useState(0)
const [teenImgFailed, setTeenImgFailed] = useState(false)
const [showScoreHelp, setShowScoreHelp] = useState(false)

const toTimestamp = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Date.parse(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

// [FIX-1] Sort by startTime — never trust insertion order
const lastDrive: DriveEntry | null = useMemo(() => {
  if (drives.length === 0) return null
  return [...drives].sort(
    (a, b) => toTimestamp(b.startTime) - toTimestamp(a.startTime)
  )[0]
}, [drives])



  const hasActiveDrive = !!activeSession?.isActive
  const hasLastDrive = !!lastDrive

 


useEffect(() => {
  // Always set initial value
  setActiveDurationSeconds(getElapsedSeconds())

  // ✅ Use single-argument form for subscribe (compatible with all Zustand versions)
  const unsub = useActiveDriveStore.subscribe(() => {
    setActiveDurationSeconds(getElapsedSeconds())
  })

  // Cleanup on unmount
  return () => unsub()
}, [getElapsedSeconds])





  const {
    totalHours,
    dayHours,
    nightHours,
    totalMilesValue,
    remainingTotalHours,
    remainingNightHours,
    progressPercent,
    nightProgressPercent,
    isFullyCompliant,
  } = useMemo(() => {
    const totals = drives.reduce(
  (acc, d) => {
    acc.totalHours += safeNumber(d.totalDurationHours)
    acc.dayHours += safeNumber(d.dayDurationHours)

    // ✅ Verified‑first aggregation for night hours
    const verified = safeNumber(d.verifiedNightDurationHours)
    const estimated = safeNumber(d.nightDurationHours)
    acc.nightHours += verified > 0 ? verified : estimated

    acc.totalMilesValue += safeNumber(d.miles)
    return acc
  },
  {
    totalHours: 0,
    dayHours: 0,
    nightHours: 0,
    totalMilesValue: 0,
  }
)


    const remainingTotalHours = Math.max(
      REQUIRED_TOTAL_HOURS - totals.totalHours,
      0
    )
    const remainingNightHours = Math.max(
      REQUIRED_NIGHT_HOURS - totals.nightHours,
      0
    )

    return {
      ...totals,
      remainingTotalHours,
      remainingNightHours,
      progressPercent: Math.min(
        (totals.totalHours / REQUIRED_TOTAL_HOURS) * 100,
        100
      ),
      nightProgressPercent: Math.min(
        (totals.nightHours / REQUIRED_NIGHT_HOURS) * 100,
        100
      ),
      isFullyCompliant:
        totals.totalHours >= REQUIRED_TOTAL_HOURS &&
        totals.nightHours >= REQUIRED_NIGHT_HOURS,
    }
  }, [drives])

  // [FIX-1][FIX-5] All lastDrive-derived values sourced from timestamp-sorted lastDrive
  const lastDriveDayHours = hasLastDrive
    ? safeNumber(lastDrive?.dayDurationHours)
    : 0

  const lastDriveNightHours = hasLastDrive
    ? safeNumber(lastDrive?.nightDurationHours)
    : 0

  const lastDriveTimeOfDay = hasLastDrive
    ? getLightingLabel(lastDriveDayHours, lastDriveNightHours)
    : "—"

  const lastDriveMinutes = hasLastDrive
    ? Math.round(safeNumber(lastDrive?.totalDurationHours) * 60)
    : 0

  // [FIX-5] Score sourced from timestamp-sorted lastDrive
  const score = hasLastDrive
    ? computeDriveScoreV2({
        minutes: lastDriveMinutes,
        isNight: lastDriveNightHours > 0,
        weather: lastDrive?.weather || "Clear",
        confirmed: true,
      })
    : 0

  const scoreExplanation = hasLastDrive
    ? `Score factors: duration (${lastDriveMinutes} minutes), time of day (${lastDriveTimeOfDay}), and weather (${lastDrive?.weather || "Clear"}).`
    : "Drive score will appear after your first saved drive."

  const complianceMessage = useMemo(() => {
    if (isFullyCompliant) {
      return "✅ 50 supervised hours and 10 night hours completed — ready for NJ MVC supervised-driving certification."
    }

    if (totalHours >= REQUIRED_TOTAL_HOURS && nightHours < REQUIRED_NIGHT_HOURS) {
      return `Total hours complete, but you still need ${formatHours(
        remainingNightHours
      )} of night driving to meet NJ MVC requirements.`
    }

    if (progressPercent >= 80) {
      return `Almost there — ${formatHours(
        remainingTotalHours
      )} total and ${formatHours(
        remainingNightHours
      )} night hours remaining.`
    }

    if (progressPercent >= 50) {
      return `Good progress — ${formatHours(
        remainingTotalHours
      )} total and ${formatHours(
        remainingNightHours
      )} night hours still needed.`
    }

    if (progressPercent >= 1) {
      return `Progress building — keep logging supervised drives. Remaining: ${formatHours(
        remainingTotalHours
      )} total and ${formatHours(remainingNightHours)} night hours.`
    }

    return "Start logging drives to begin building NJ MVC supervised-driving progress."
  }, [
    isFullyCompliant,
    totalHours,
    nightHours,
    progressPercent,
    remainingTotalHours,
    remainingNightHours,
  ])

  const lastDriveMiles = hasLastDrive
    ? safeNumber(lastDrive?.miles).toFixed(1)
    : "0.0"

  // [FIX-3] Clock reads from store selector — no local elapsed reimplementation
  const activeDurationLabel = hasActiveDrive
    ? formatClock(activeDurationSeconds)
    : "—"

  // [FIX-4] Single source of truth for badge — used in BOTH badge locations
  const sessionBadgeLabel = hasActiveDrive
    ? activeSession?.isRunning
      ? "LIVE SESSION"
      : "PAUSED"
    : drives.length > 0
    ? "SUMMARY READY"
    : "NO DRIVES"

  // [FIX-2] navigate() fires BEFORE hardReset() — session not destroyed until
  // navigation is confirmed. If navigate() throws, session is preserved.
  const handleStartNewDrive = () => {
    navigate("summary", "startNew", setScreen)
    hardReset()
  }

  const handleContinueDrive = () => {
    navigate("summary", "continue", setScreen)
  }

  const handleGoHistory = () => {
    navigate("summary", "history", setScreen)
  }

  const handleGoMilestones = () => {
    navigate("summary", "milestones", setScreen)
  }

  const handleGoDmv = () => {
    navigate("summary", "dmv", setScreen)
  }

  


  return (
  <div className="flex w-full justify-center px-3 pb-28 pt-4 text-[#08194A] sm:px-4">
    <section className="w-full max-w-[46rem] overflow-hidden rounded-[32px] border border-white/25 bg-white/95 shadow-[0_12px_34px_rgba(255,255,255,0.12)] backdrop-blur-md">
      <div className="mx-auto w-full max-w-[42rem] p-4 pt-6 sm:p-6 sm:pt-7">
        <div className="rounded-[28px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-inner sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#f9c80e]/90">
                Drive Summary
              </p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">
                Session Overview
              </h1>
              <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-white/75">
                Review drive progress, latest totals, and the current session
                status before heading back out.
              </p>
            </div>

            <div className="flex justify-center sm:justify-end">
              {teenPhoto && !teenImgFailed ? (
                <img
                  src={teenPhoto}
                  alt="Teen Driver Photo"
                  onError={() => setTeenImgFailed(true)}
                  className="h-[92px] w-[92px] rounded-full border-4 border-[#f9c80e] object-cover shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:h-[110px] sm:w-[110px]"
                />
              ) : (
                <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border border-white/15 bg-white/10 text-center text-xs font-semibold text-white/75 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:h-[110px] sm:w-[110px] sm:text-sm">
                  No Photo
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/12 bg-white/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#f9c80e]/85">
                  {hasActiveDrive ? "Active Drive Duration" : "Last Session Duration"}
                </p>
                <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.75rem,7vw,3.4rem)] font-black leading-none tracking-[0.08em] tabular-nums">
                  {activeDurationLabel}
                </p>
              </div>
              <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                {sessionBadgeLabel}
              </div>
            </div>
          </div>
        </div>

        {/* DRIVE SCORE BLOCK */}
        <div className="mt-5 rounded-2xl border border-[#f9c80e]/30 bg-[#08194A] px-4 py-3 text-white shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label="Drive score explanation"
              aria-expanded={showScoreHelp}
              aria-describedby={showScoreHelp ? "drive-score-help" : undefined}
              onClick={() => setShowScoreHelp((prev) => !prev)}
              className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xl text-[#f9c80e] transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#f9c80e]"
            >
              <span aria-hidden="true">⭐</span>
              <span className="absolute text-[10px] font-bold text-[#08194A]">?</span>
            </button>
            <p className="text-base font-semibold text-[#f9c80e] sm:text-lg">
              Drive Score: {score}
            </p>
          </div>
          {showScoreHelp && (
            <div
              id="drive-score-help"
              role="note"
              className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm leading-snug text-white/90"
            >
              {scoreExplanation}
            </div>
          )}
        </div>

        {/* Drive Summary Mini Panels */}
<div className="mt-5 rounded-[28px] border border-[#0A1E5E]/10 bg-[#F7F9FC] p-4 shadow-sm sm:p-5">
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {/* Total Hours */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Total<br />Hours
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {formatHours(totalHours)}
      </p>
    </div>

    {/* Day Hours */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Day<br />Hours
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {formatHours(dayHours)}
      </p>
    </div>

    {/* Night Hours */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Night<br />Hours
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {formatHours(nightHours)}
      </p>
    </div>

    {/* Night Remain */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Night<br />Remain
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {formatHours(remainingNightHours)}
      </p>
    </div>

    {/* Total Remain */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Total<br />Remain
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {formatHours(remainingTotalHours)}
      </p>
    </div>

    {/* Last Drive */}
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white p-3 shadow-sm min-h-[110px] text-center">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#0A1E5E]/55 leading-tight">
        Last<br />Drive
      </p>
      <p className="mt-2 text-lg font-black leading-tight text-[#08194A] sm:text-xl tabular-nums">
        {hasActiveDrive
          ? formatHours(activeDurationSeconds / 3600)
          : hasLastDrive
            ? formatHours(safeNumber(lastDrive?.totalDurationHours))
            : "—"}
      </p>
      <p className="mt-1 text-[10px] font-semibold text-[#0A1E5E]/65 truncate">
        {hasActiveDrive
          ? getLightingLabel(
              safeNumber(activeSession?.dayMs) / 3600000,
              safeNumber(activeSession?.nightMs) / 3600000
            )
          : hasLastDrive
            ? lastDriveTimeOfDay
            : "No drive saved"}
      </p>
    </div>

    {/* Miles — spans full width */}
    <div className="col-span-2 sm:col-span-3 rounded-2xl border border-[#0A1E5E]/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 leading-tight">
            Total<br />Miles
            <span className="ml-1.5 rounded-full border border-[#0A1E5E]/10 bg-[#F4F6FA] px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#0A1E5E]/45">
              INFO
            </span>
          </p>
          <p className="mt-2 text-2xl font-black leading-none tracking-tight text-[#08194A] sm:text-3xl tabular-nums">
            {totalMilesValue.toFixed(1)}
            <span className="ml-1 text-base font-bold text-[#0A1E5E]/65">mi</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 leading-tight">
            Last<br />Drive<br />Miles
          </p>
          <p className="mt-2 text-xl font-black leading-none tracking-tight text-[#08194A] sm:text-2xl tabular-nums">
            {lastDriveMiles}
            <span className="ml-1 text-sm font-bold text-[#0A1E5E]/65">mi</span>
          </p>
        </div>
      </div>
    </div>
  </div>

          {/* Total hours progress bar */}
          <div className="mt-5">
            <div className="relative mx-auto h-4 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#08194A] to-[#f9c80e] transition-all duration-700 ease-in-out"
                style={{ width: `${progressPercent}%` }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-[#0A1E5E]/70">
              {progressPercent.toFixed(0)}% of total-hour goal complete
            </p>
          </div>

          {/* Night hours progress bar */}
          <div className="mt-4">
            <div className="relative mx-auto h-4 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10 shadow-inner">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#0A1E5E] to-[#00C49A] transition-all duration-700 ease-in-out"
                style={{ width: `${nightProgressPercent}%` }}
              />
              <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]" />
            </div>
            <p className="mt-3 text-center text-sm font-medium text-[#0A1E5E]/70">
              {nightProgressPercent.toFixed(0)}% of night-hour goal complete
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#f9c80e]/60 bg-white px-4 py-3 text-sm font-medium text-[#08194A] shadow-sm">
            {complianceMessage}
          </div>

          <p className="mt-4 text-center text-xs text-[#0A1E5E]/60">
            NJ supervised-driving progress is tracked here as 50 total hours
            with 10 night hours.
          </p>
        </div>

        <div className="mt-5 rounded-[28px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
                Next Steps
              </p>
              <h2 className="mt-1 text-lg font-bold sm:text-xl">
                Choose your next action
              </h2>
              <p className="mt-1 max-w-[34rem] text-sm leading-relaxed text-white/72">
                Continue an active session or review history, milestones, and
                downloadable records.
              </p>
            </div>

              {/* [FIX-4] Next Steps badge — also uses sessionBadgeLabel */}
              <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                {sessionBadgeLabel}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {hasActiveDrive ? (
                <button
                  type="button"
                  onClick={handleContinueDrive}
                  className="w-full rounded-xl bg-white py-3.5 font-semibold text-[#08194A] shadow-md transition hover:bg-white/95"
                >
                  Continue Drive
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStartNewDrive}
                  className="w-full rounded-xl bg-[#f9c80e] py-3.5 font-semibold text-[#08194A] shadow-md transition hover:brightness-105"
                >
                  Start New Drive
                </button>
              )}

              <button
                type="button"
                onClick={handleGoHistory}
                className="w-full rounded-xl bg-white/10 py-3.5 font-semibold text-white shadow-md transition hover:bg-white/15"
              >
                View History
              </button>

              <button
                type="button"
                onClick={handleGoMilestones}
                className="w-full rounded-xl bg-green-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-green-700"
              >
                View Milestones
              </button>

              <button
                type="button"
                onClick={handleGoDmv}
                className="w-full rounded-xl border-2 border-[#f9c80e] bg-white py-3.5 font-semibold text-[#08194A] shadow-sm transition hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)]"
              >
                DMV Bundle Download
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}