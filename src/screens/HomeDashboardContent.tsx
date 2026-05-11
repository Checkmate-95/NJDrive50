// src/screens/HomeDashboardContent.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  Miles card progress bar removed — no false NJ GDL compliance signal
// [FIX-2]  useDriveHistory() reactive hook (was imperative getDriveHistory())
// [FIX-3]  lastDrive sorted by startTime timestamp (was array tail — insertion-order dependent)
// [FIX-4]  getLightingLabel reads dayDurationHours directly (was total - night derivation)
// [FIX-5]  updateSolarForDrive() removed — solar seeding belongs in activeDriveStore.startDrive()
// [FIX-6]  Miles card redesigned as informational stat — no bar, no false compliance framing
// [FIX-7]  Hour format uses shared toFixed(1) consistent with other panels pending shared util

import { useState, type Dispatch, type SetStateAction } from "react"
import type { Screen } from "../App"
import { useDriveHistory } from "../state/driveStore"
import { loadOnboardingData } from "../../core/ReminderEngine"
import { useTeenPhoto } from "../state/profileStore"
import { navigate } from "../navigation/navMap"
import { useActiveDriveStore } from "../state/activeDriveStore"

type HomeDashboardContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

// ------------------------------
// Helpers
// ------------------------------

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "NJ"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function safeNumber(val: unknown): number {
  const num = Number(val)
  return Number.isFinite(num) ? num : 0
}

// [FIX‑4] Reads dayDurationHours directly — never derives day as (total − night)
function getLightingLabel(day: number, night: number): "Day" | "Night" | "Mixed" {
  if (night > 0 && day > 0) return "Mixed"
  if (night > 0) return "Night"
  return "Day"
}

// ------------------------------
// Component
// ------------------------------

export default function HomeDashboardContent({ setScreen }: HomeDashboardContentProps) {
  const [startingDrive, setStartingDrive] = useState(false)

  // Active drive state (reactive)
  const activeSession = useActiveDriveStore((s) => s.session)
  const hasActiveDrive = Boolean(activeSession?.isActive)

  // [FIX‑2] Reactive drive history — updates automatically when drives are saved/edited/deleted
  const drives = useDriveHistory() || []

  // Onboarding (used only for name/photo, not for progress data)
  const onboarding = loadOnboardingData()
  const teenName = onboarding.teenName?.trim() || "Teen Driver"
  const teenPhoto = useTeenPhoto()
  const teenInitials = getInitials(teenName)

  // NJ GDL requirements — hours only (no mileage requirement in NJ GDL)
  const totalRequired = 50
  const nightRequired = 10

  // Canonical totals — single computation, sourced from reactive hook
  const totalHours = drives.reduce((sum, d) => sum + safeNumber(d.totalDurationHours), 0)

  // ✅ Verified‑first aggregation for night hours
  const nightHours = drives.reduce((sum, d) => {
    const verified = safeNumber(d.verifiedNightDurationHours)
    const estimated = safeNumber(d.nightDurationHours)
    return sum + (verified > 0 ? verified : estimated)
  }, 0)

  const totalMiles = drives.reduce((sum, d) => sum + safeNumber(d.miles), 0)

  // Progress — capped at 100%, hours only
  const totalPercent = Math.min((totalHours / totalRequired) * 100, 100)
  const nightPercent = Math.min((nightHours / nightRequired) * 100, 100)

  const totalRemaining = Math.max(totalRequired - totalHours, 0)
  const nightRemaining = Math.max(nightRequired - nightHours, 0)

  // [FIX‑3] Last drive — sorted by startTime so insertion order never affects result
  const lastDrive = drives.length
    ? [...drives].sort((a, b) => safeNumber(b.startTime) - safeNumber(a.startTime))[0]
    : null

  const lastDriveDuration = lastDrive
    ? `${safeNumber(lastDrive.totalDurationHours).toFixed(2)} hrs`
    : "0.00 hrs"

  const lastDriveMode = lastDrive
    ? getLightingLabel(
        safeNumber(lastDrive.dayDurationHours),
        safeNumber(lastDrive.nightDurationHours)
      )
    : "Day"

  // toLocaleString includes full date+time — correct for midnight‑crossing drives
  const lastDriveStart = lastDrive ? new Date(lastDrive.startTime).toLocaleString() : "--"
  const lastDriveEnd = lastDrive ? new Date(lastDrive.endTime).toLocaleString() : "--"

  // [FIX‑5] Solar seeding removed — belongs inside activeDriveStore.startDrive()
  // using the coord passed at drive start, not at UI navigation time
  const handleStartDrive = async () => {
    if (startingDrive) return

    if (hasActiveDrive) {
      setScreen("active")
      return
    }

    try {
      setStartingDrive(true)
      navigate("home", "startDrive", setScreen)
    } finally {
      setStartingDrive(false)
    }
  }

  const driveActionLabel = hasActiveDrive
    ? activeSession?.isRunning
      ? "Return to Active Drive"
      : "Resume Paused Drive"
    : startingDrive
    ? "Starting..."
    : "Start New Drive"

  const driveActionState = hasActiveDrive
    ? activeSession?.isRunning
      ? "ACTIVE"
      : "PAUSED"
    : startingDrive
    ? "STARTING"
    : "READY"

  // ------------------------------
  // UI
  // ------------------------------
  // (UI section continues unchanged)

  return (
    <div className="flex w-full justify-center px-3 pt-4 pb-28 text-[#0A1E5E] sm:px-4">
      <section className="relative w-full max-w-[46rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

        <div className="mx-auto w-full max-w-[42rem] p-4 pt-6 sm:p-6 sm:pt-7">

          {/* ACTIVE DRIVE BANNER */}
          {hasActiveDrive && (
            <button
              type="button"
              onClick={() => setScreen("active")}
              className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-white shadow-md transition-all hover:brightness-110 ${
                activeSession?.isRunning
                  ? "border border-[#00C851]/40 bg-[#00C851] shadow-[0_4px_12px_rgba(0,200,81,0.35)] animate-[pulseGreen_2s_infinite]"
                  : "border border-[#D93025]/40 bg-[#D93025] shadow-[0_4px_12px_rgba(217,48,37,0.35)] animate-[pulseRed_2s_infinite]"
              }`}
            >
              <span className="text-lg">🚗</span>
              <span>
                {activeSession?.isRunning
                  ? "Drive Active — Tap to return"
                  : "Drive Paused — Tap to resume"}
              </span>
            </button>
          )}

          {/* HERO CARD */}
<div className="rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] px-5 pt-6 pb-5 text-white shadow-inner sm:px-6 sm:pt-8 sm:pb-6">
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#f9c80e]/90">
        Driving Progress
      </p>

      <h2 className="mt-2 text-[1.75rem] font-extrabold leading-tight sm:text-3xl">
        Welcome back, {teenName}
      </h2>

      <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-white/75">
        Track total hours, monitor night driving, and start a new drive when you're ready.
      </p>

      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">
          TOTAL HOURS
        </span>
        <span className="rounded-full border border-[#f9c80e]/35 bg-[#f9c80e]/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#f9c80e]">
          NIGHT HOURS
        </span>
      </div>
    </div>

    <div className="shrink-0 flex flex-col items-center justify-center">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#f9c80e]/70 bg-white/10 shadow-[0_0_18px_rgba(249,200,14,0.18)] sm:h-20 sm:w-20">
        {teenPhoto ? (
          <img
            src={teenPhoto}
            alt={`${teenName} profile`}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-sm font-extrabold tracking-[0.14em] text-[#f9c80e] sm:text-base">
            {teenInitials}
          </span>
        )}
      </div>
    </div>
  </div>
</div>


          {/* PROGRESS CARDS — Plan B layout: 2 panels on top, 1 full-width panel below */}
<div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 items-stretch">

  {/* Total Hours — top left */}
  <div className="flex flex-col justify-between h-full min-h-[210px] rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-center shadow-sm sm:min-h-[240px]">
    <div className="flex flex-col items-center justify-center h-[40px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Total</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Hours</p>
    </div>

    <p className="flex items-end justify-center text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
      {totalHours.toFixed(1)}
      <span className="text-lg font-semibold text-[#0A1E5E]/65"> / {totalRequired}</span>
    </p>

    <p className="text-sm leading-snug text-[#0A1E5E]/68">
      {totalRemaining.toFixed(1)} Hours Remaining
    </p>

    <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
      <div
        className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
        style={{ width: `${totalPercent}%` }}
      />
    </div>

    <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
      LOGGED
    </div>
  </div>

  {/* Night Hours — top right */}
  <div className="flex flex-col justify-between h-full min-h-[210px] rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4 text-center shadow-sm sm:min-h-[240px]">
    <div className="flex flex-col items-center justify-center h-[40px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Night</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Hours</p>
    </div>

    <p className="flex items-end justify-center text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
      {nightHours.toFixed(1)}
      <span className="text-lg font-semibold text-[#0A1E5E]/65"> / {nightRequired}</span>
    </p>

    <p className="text-sm leading-snug text-[#0A1E5E]/68">
      {nightRemaining.toFixed(1)} Hours Remaining
    </p>

    <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
      <div
        className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
        style={{ width: `${nightPercent}%` }}
      />
    </div>

    <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
      NIGHT
    </div>
  </div>

  {/* Total Miles — short wide horizontal panel */}
  <div className="col-span-2 flex items-center justify-between rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] px-4 py-2 shadow-sm">
    <div className="flex flex-col leading-tight">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Total Miles</p>
      <p className="text-xs text-[#0A1E5E]/60">Across all drives</p>
    </div>

    <p className="flex items-end text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
      {totalMiles.toFixed(1)}
      <span className="ml-1 text-lg font-semibold text-[#0A1E5E]/65">mi</span>
    </p>

    <div className="inline-flex h-[26px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
      INFO
    </div>
  </div>
</div>


          {/* LAST DRIVE CARD */}
          <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#0A1E5E]/55">
                  Last Drive
                </p>

                <h3 className="mt-1 text-lg font-bold text-[#0A1E5E] sm:text-xl">
                  {lastDrive
                    ? `${lastDriveDuration} • ${lastDriveMode}`
                    : "No drives logged yet"}
                </h3>

                <p className="mt-1 max-w-[36rem] text-sm leading-relaxed text-[#0A1E5E]/68">
                  {lastDrive
                    ? `Started: ${lastDriveStart} • Ended: ${lastDriveEnd}`
                    : "Start your first drive to begin tracking progress."}
                </p>
              </div>

              <div className="w-fit rounded-full border border-[#0A1E5E]/10 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
                {lastDrive ? "RECENT" : "NONE"}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("home", "history", setScreen)}
                className="w-full rounded-xl border border-[#0A1E5E]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0A1E5E] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)] sm:flex-1"
              >
                View History
              </button>

              <button
                type="button"
                onClick={handleStartDrive}
                disabled={startingDrive}
                className={`w-full rounded-xl border border-[#0A1E5E]/15 px-4 py-3 text-sm font-semibold transition duration-200 sm:flex-1 ${
                  startingDrive
                    ? "cursor-not-allowed bg-[#08194A]/[0.03] text-[#0A1E5E]/45"
                    : "bg-[#08194A]/[0.03] text-[#0A1E5E] hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)]"
                }`}
              >
                {hasActiveDrive
                  ? activeSession?.isRunning
                    ? "Return to Active Drive"
                    : "Resume Paused Drive"
                  : "Start Drive"}
              </button>
            </div>
          </div>

          {/* DRIVE CONTROL CARD */}
          <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
                  Drive Control
                </p>
                <h3 className="mt-1 text-lg font-bold sm:text-xl">
                  {hasActiveDrive ? "Continue your current drive" : "Start a new drive"}
                </h3>
                <p className="mt-1 max-w-[34rem] text-sm leading-relaxed text-white/72">
                  {hasActiveDrive
                    ? "A drive session is already in progress. Return to it instead of resetting progress."
                    : "Begin timing and detect day or night conditions for this session."}
                </p>
              </div>

              <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                {driveActionState}
              </div>
            </div>

            <div className="mx-auto mt-4 w-full max-w-[28rem]">
              <button
                type="button"
                onClick={handleStartDrive}
                disabled={startingDrive}
                className={`block w-full rounded-xl py-3.5 text-base font-bold transition duration-200 ${
                  startingDrive
                    ? "cursor-not-allowed bg-white/15 text-white/45"
                    : "bg-[#f9c80e] text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] hover:-translate-y-[1px] hover:brightness-105 hover:shadow-[0_0_22px_rgba(249,200,14,0.38)]"
                }`}
              >
                {driveActionLabel}
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}