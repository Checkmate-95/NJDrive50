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

// [FIX-4] Reads dayDurationHours directly — never derives day as (total - night)
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

  // [FIX-2] Reactive drive history — updates automatically when drives are saved/edited/deleted
  const drives = useDriveHistory() || []

  // Onboarding
  const onboarding = loadOnboardingData()
  const teenName = onboarding.teenName?.trim() || "Teen Driver"
  const teenPhoto = useTeenPhoto()
  const teenInitials = getInitials(teenName)

  // NJ GDL requirements — hours only (no mileage requirement in NJ GDL)
  const totalRequired = 50
  const nightRequired = 10

  // Canonical totals — single computation, sourced from reactive hook
  const totalHours = drives.reduce((sum, d) => sum + safeNumber(d.totalDurationHours), 0)
  const nightHours = drives.reduce((sum, d) => sum + safeNumber(d.nightDurationHours), 0)
  const totalMiles = drives.reduce((sum, d) => sum + safeNumber(d.miles), 0)

  // Progress — capped at 100%, hours only
  const totalPercent = Math.min((totalHours / totalRequired) * 100, 100)
  const nightPercent = Math.min((nightHours / nightRequired) * 100, 100)

  const totalRemaining = Math.max(totalRequired - totalHours, 0)
  const nightRemaining = Math.max(nightRequired - nightHours, 0)

  // [FIX-3] Last drive — sorted by startTime so insertion order never affects result
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

  // toLocaleString includes full date+time — correct for midnight-crossing drives
  const lastDriveStart = lastDrive ? new Date(lastDrive.startTime).toLocaleString() : "--"
  const lastDriveEnd = lastDrive ? new Date(lastDrive.endTime).toLocaleString() : "--"

  // [FIX-5] Solar seeding removed — belongs inside activeDriveStore.startDrive()
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
          <div className="rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-inner sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#f9c80e]/90">
                  Driving Progress
                </p>

                <h2 className="mt-2 text-[1.75rem] font-extrabold leading-tight sm:text-3xl">
                  Welcome back, {teenName}
                </h2>

                <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-white/75">
                  Track total hours, monitor night driving, and start a new drive when you&apos;re ready.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">
                    TOTAL HOURS
                  </span>
                  <span className="rounded-full border border-[#f9c80e]/35 bg-[#f9c80e]/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#f9c80e]">
                    NIGHT HOURS
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <div className="flex flex-col items-center">
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
          </div>

          {/* PROGRESS CARDS — hours only, matching NJ GDL requirements */}
          {/* [FIX-1][FIX-6] Miles card is purely informational: no progress bar,
              no compliance framing. Total Hours and Night Hours are the only
              NJ GDL requirements tracked with progress indicators. */}
          <div className="mt-5 grid grid-cols-3 auto-rows-fr gap-2 sm:gap-3">

            {/* Total Hours — NJ GDL requirement */}
            <div className="grid h-full min-h-[190px] grid-rows-[auto_auto_auto_auto_auto] justify-items-center rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3 text-center shadow-sm sm:min-h-[220px] sm:p-4">
              <div className="flex h-[34px] min-h-[34px] flex-col items-center justify-center sm:h-[40px] sm:min-h-[40px]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Total</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Hours</p>
              </div>
              <p className="flex min-h-[36px] items-end text-2xl font-extrabold leading-none tracking-tight text-[#0A1E5E] sm:min-h-[42px] sm:text-3xl">
                {totalHours.toFixed(1)}
                <span className="text-sm font-semibold text-[#0A1E5E]/65 sm:text-lg"> / {totalRequired}</span>
              </p>
              <p className="flex min-h-[28px] items-center text-xs leading-snug text-[#0A1E5E]/68 sm:min-h-[32px] sm:text-sm">
                {totalRemaining.toFixed(1)} hours remaining
              </p>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
                <div
                  className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
                  style={{ width: `${totalPercent}%` }}
                />
              </div>
              <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70 sm:h-[26px] sm:min-w-[80px] sm:text-[11px]">
                LOGGED
              </div>
            </div>

            {/* Night Hours — NJ GDL requirement */}
            <div className="grid h-full min-h-[190px] grid-rows-[auto_auto_auto_auto_auto] justify-items-center rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-3 text-center shadow-sm sm:min-h-[220px] sm:p-4">
              <div className="flex h-[34px] min-h-[34px] flex-col items-center justify-center sm:h-[40px] sm:min-h-[40px]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Night</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Hours</p>
              </div>
              <p className="flex min-h-[36px] items-end text-2xl font-extrabold leading-none tracking-tight text-[#0A1E5E] sm:min-h-[42px] sm:text-3xl">
                {nightHours.toFixed(1)}
                <span className="text-sm font-semibold text-[#0A1E5E]/65 sm:text-lg"> / {nightRequired}</span>
              </p>
              <p className="flex min-h-[28px] items-center text-xs leading-snug text-[#0A1E5E]/68 sm:min-h-[32px] sm:text-sm">
                {nightRemaining.toFixed(1)} hours remaining
              </p>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
                <div
                  className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
                  style={{ width: `${nightPercent}%` }}
                />
              </div>
              <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70 sm:h-[26px] sm:min-w-[80px] sm:text-[11px]">
                NIGHT
              </div>
            </div>

            {/* Total Miles — informational only, no compliance bar */}
            {/* [FIX-1][FIX-6] NJ GDL has no mileage requirement. This card is
                purely informational. No progress bar, no percent fill.
                Sub-label explicitly states "Info only" to prevent
                parents from treating mileage as a compliance gate. */}
            <div className="grid h-full min-h-[190px] grid-rows-[auto_auto_auto_1fr_auto] justify-items-center rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3 text-center shadow-sm sm:min-h-[220px] sm:p-4">
              <div className="flex h-[34px] min-h-[34px] flex-col items-center justify-center sm:h-[40px] sm:min-h-[40px]">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Total</p>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/55 sm:text-[11px] sm:tracking-[0.18em]">Miles</p>
              </div>
              <p className="flex min-h-[36px] items-end text-2xl font-extrabold leading-none tracking-tight text-[#0A1E5E] sm:min-h-[42px] sm:text-3xl">
                {totalMiles.toFixed(1)}
                <span className="text-sm font-semibold text-[#0A1E5E]/65 sm:text-lg"> mi</span>
              </p>
              <p className="flex min-h-[28px] items-center text-xs leading-snug text-[#0A1E5E]/68 sm:min-h-[32px] sm:text-sm">
                Across all drives
              </p>
              {/* No progress bar — mileage is not a NJ GDL compliance requirement */}
              <div className="h-2.5 w-full" />
              <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70 sm:h-[26px] sm:min-w-[80px] sm:text-[11px]">
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