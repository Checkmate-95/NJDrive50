// src/screens/TodaysDrive.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  isPreview banner — unsaved previews are visually distinguished from saved drives
// [FIX-2]  Timestamps use toLocaleString() — date included for midnight-crossing drives
// [FIX-3]  getMapTimeOfDay: Mixed drives render map in Night mode (safety-relevant)
// [FIX-4]  formatHours unit included in function return — no bare unitless strings
// [FIX-5]  drive.isPreview checked before rendering — unsaved state clearly communicated
// [FIX-6]  Start New Drive checks for active session — no silent second-session risk

import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"
import { navigate } from "../navigation/navMap"
import { useActiveDriveStore } from "../state/activeDriveStore"

import { MapProvider } from "../components/map/MapProvider"
import { DriveMapPanel } from "../components/map/DriveMapPanel"
import type { DriveEntry } from "../state/driveStore"

type Coord = {
  lat: number
  lng: number
}

type TodaysDriveProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
  drive: (DriveEntry & {
    isPreview?: boolean
    milesSource?: "routes-api" | "gps-accumulated"
  }) | null
}

// [FIX-4] Returns value + unit together — no bare unitless number strings at call sites
function formatHours(hours?: number): string {
  if (typeof hours !== "number" || Number.isNaN(hours)) return "0.00 hrs"
  return `${hours.toFixed(2)} hrs`
}

function getLightingLabel(
  dayHours: number,
  nightHours: number
): "Day" | "Night" | "Mixed" {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  return "Day"
}

// [FIX-3] Mixed drives render as Night — the safety-relevant condition.
// Previously Mixed collapsed to "Day", causing the map to contradict the
// "Mixed" text label shown directly above it.
// dayHours param removed — only nightHours determines map style.
function getMapTimeOfDay(nightHours: number): "Day" | "Night" {
  if (nightHours > 0) return "Night"
  return "Day"
}

function normalizeMiles(value: unknown): number {
  const numericMiles =
    typeof value === "number" ? value : Number(value ?? 0)
  return Number.isFinite(numericMiles) ? numericMiles : 0
}

function normalizeRoute(value: unknown): Coord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (coord): coord is Coord =>
      !!coord &&
      typeof coord === "object" &&
      typeof coord.lat === "number" &&
      typeof coord.lng === "number"
  )
}

export default function TodaysDrive({ setScreen, drive }: TodaysDriveProps) {
  // [FIX-6] Check for active session to prevent silent second-session start
  const activeSession = useActiveDriveStore((s) => s.session)
  const hasActiveDrive = Boolean(activeSession?.isActive)

  if (!drive || !drive.startTime || !drive.endTime) {
    return (
      <div className="p-6 text-center text-red-600">
        No drive data available.
      </div>
    )
  }

  const {
    startTime,
    endTime,
    miles,
    weather,
    notes,
    routeCoords,
    totalDurationHours,
    dayDurationHours,
    nightDurationHours,
    isPreview,
    milesSource,
  } = drive

  const numericMiles = normalizeMiles(miles)
  const totalHours =
    typeof totalDurationHours === "number" ? totalDurationHours : 0
  const dayHours =
    typeof dayDurationHours === "number" ? dayDurationHours : 0
  const nightHours =
    typeof nightDurationHours === "number" ? nightDurationHours : 0

  const lightingLabel = getLightingLabel(dayHours, nightHours)
  const mapTimeOfDay = getMapTimeOfDay(nightHours)
  const safeRoute = normalizeRoute(routeCoords)

  // [FIX-6] Start New Drive handler — redirects to active drive if one exists
  const handleStartNew = () => {
    if (hasActiveDrive) {
      setScreen("active")
      return
    }
    navigate("todaysDrive", "startNew", setScreen)
  }

  return (
    <div className="w-full flex flex-col items-center px-3 pb-24 pt-3 text-[#0A1E5E] sm:px-4">

      {/* [FIX-1][FIX-5] Preview banner — shown whenever this screen receives
          an unsaved preview drive. Prominently communicates that this data has
          NOT been saved and will not appear in History, Summary, or Exports. */}
      {isPreview && (
        <div className="mb-4 w-full max-w-md rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            Preview Only — Not Saved
          </p>
          <p className="mt-1 text-sm text-amber-800 leading-snug">
            This drive has <strong>not been saved</strong> yet. It will not
            appear in your History, Summary totals, or any exports. Return to
            the Active Drive screen and tap <strong>Stop Drive</strong> to
            save it permanently.
          </p>
        </div>
      )}

      <section className="w-full max-w-md rounded-[24px] border border-white/30 bg-white/95 px-6 py-7 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">

        {/* Title row — shows PREVIEW badge when unsaved */}
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {isPreview ? "Drive Preview" : "Today's Drive"}
          </h2>
          {isPreview && (
            <span className="rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
              NOT SAVED
            </span>
          )}
        </div>

        <p className="mb-5 text-sm text-[#1b2755]">
          {isPreview
            ? "This is a live snapshot. Save the drive to make it permanent."
            : "Great job today — here's what you completed."}
        </p>

        <div className="mb-4 space-y-2 text-sm text-[#1b2755]">
          {/* [FIX-2] toLocaleString() includes date — correct for midnight-crossing drives.
              Previously toLocaleTimeString() dropped the date entirely. */}
          <p>
            <strong>Start Time:</strong>{" "}
            {new Date(startTime).toLocaleString()}
          </p>
          <p>
            <strong>End Time:</strong>{" "}
            {new Date(endTime).toLocaleString()}
          </p>
          <p>
            <strong>Miles:</strong>{" "}
            {numericMiles.toFixed(1)}
            {/* [FIX-3] If mileage came from GPS accumulation (not Routes API),
                note that the saved value may differ slightly */}
            {milesSource === "gps-accumulated" && (
              <span className="ml-1 text-[10px] text-[#0A1E5E]/45">(GPS est.)</span>
            )}
          </p>
          <p>
            <strong>Total Duration:</strong> {formatHours(totalHours)}
          </p>
          <p>
            <strong>Day Driving:</strong> {formatHours(dayHours)}
          </p>
          <p>
            <strong>Night Driving:</strong> {formatHours(nightHours)}
          </p>
          <p>
            <strong>Lighting:</strong> {lightingLabel}
          </p>
          <p>
            <strong>Weather:</strong> {weather || "—"}
          </p>
        </div>

        {notes && (
          <div className="mb-4">
            <p className="text-sm text-[#1b2755]">
              <strong>Notes:</strong> {notes}
            </p>
          </div>
        )}
      </section>

      <div className="mt-6 h-[400px] w-full max-w-md overflow-hidden rounded-[24px] border border-[#00bfff] shadow-lg">
        <MapProvider>
          <DriveMapPanel
            route={safeRoute}
            driveMeta={{
              miles: numericMiles,
              duration: formatHours(totalHours),
              timeOfDay: mapTimeOfDay,
            }}
          />
        </MapProvider>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 pt-6">
        {/* [FIX-6] Checks for active session before navigating to start flow.
            If a session is already running/paused, redirects to Active Drive
            instead of silently allowing a second session to be started. */}
        <button
          onClick={handleStartNew}
          className="w-full rounded-lg bg-[#0A1E5E] py-3 font-semibold text-white transition-colors hover:bg-[#f9c80e] hover:text-[#0A1E5E]"
        >
          {hasActiveDrive ? "Return to Active Drive" : "Start New Drive"}
        </button>

        <button
          onClick={() => navigate("todaysDrive", "summary", setScreen)}
          className="w-full rounded-lg border border-[#0A1E5E] bg-white py-3 font-semibold text-[#0A1E5E] transition-colors hover:bg-[#0A1E5E] hover:text-white"
        >
          View Summary
        </button>
      </div>
    </div>
  )
}