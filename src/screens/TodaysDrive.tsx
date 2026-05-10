// src/screens/TodaysDrive.tsx
import { useNav } from "../state/navStore"
import { useActiveDriveStore } from "../state/activeDriveStore"

import { MapProvider } from "../components/map/MapProvider"
import { DriveMapPanel } from "../components/map/DriveMapPanel"
import type { DriveEntry } from "../state/driveStore"

type Coord = {
  lat: number
  lng: number
}

type TodaysDriveProps = {
  drive: (DriveEntry & {
    isPreview?: boolean
    milesSource?: "routes-api" | "gps-accumulated"
  }) | null
}

function formatHours(hours?: number): string {
  if (typeof hours !== "number" || Number.isNaN(hours)) return "0.00 hrs"
  return `${hours.toFixed(2)} hrs`
}

function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function getLightingLabel(
  dayHours: number,
  nightHours: number
): "Day Drive" | "Night Drive" | "Mixed Drive" {
  if (nightHours > 0 && dayHours > 0) return "Mixed Drive"
  if (nightHours > 0) return "Night Drive"
  return "Day Drive"
}

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
      typeof (coord as Coord).lat === "number" &&
      typeof (coord as Coord).lng === "number"
  )
}

function safeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function getNightData(drive: DriveEntry) {
  const verifiedNight = safeNumber(drive.verifiedNightDurationHours)
  const estimatedNight = safeNumber(drive.nightDurationHours)
  const effectiveNight = verifiedNight > 0 ? verifiedNight : estimatedNight
  const isVerified = verifiedNight > 0

  return {
    verifiedNight,
    estimatedNight,
    effectiveNight,
    isVerified,
  }
}

function getDisplaySegments(drive: DriveEntry) {
  const start = new Date(drive.startTime)
  const end = new Date(drive.endTime)

  const startMs = start.getTime()
  const endMs = end.getTime()
  const totalMs = Math.max(endMs - startMs, 0)

  const totalHours = safeNumber(drive.totalDurationHours)
  const storedDayHours = safeNumber(drive.dayDurationHours)
  const { effectiveNight, isVerified } = getNightData(drive)

  const dayHours =
    totalHours > 0
      ? Math.max(totalHours - effectiveNight, 0)
      : Math.max(storedDayHours, 0)

  const nightHours = effectiveNight

  let dayRange = ""
  let nightRange = ""

  if (totalMs <= 0) {
    return {
      dayHours,
      nightHours,
      dayRange,
      nightRange,
      isVerified,
    }
  }

  if (nightHours <= 0) {
    dayRange = `${formatClockTime(start)} – ${formatClockTime(end)}`
  } else if (dayHours <= 0) {
    nightRange = `${formatClockTime(start)} – ${formatClockTime(end)}`
  } else {
    const dayMs = dayHours * 60 * 60 * 1000
    const split = new Date(startMs + dayMs)

    dayRange = `${formatClockTime(start)} – ${formatClockTime(split)}`
    nightRange = `${formatClockTime(split)} – ${formatClockTime(end)}`
  }

  return {
    dayHours,
    nightHours,
    dayRange,
    nightRange,
    isVerified,
  }
}

const VerifiedBadge = () => (
  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
    Verified
  </span>
)

const EstimatedBadge = () => (
  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
    Estimated
  </span>
)

export default function TodaysDrive({ drive }: TodaysDriveProps) {
  const { setScreen } = useNav()

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
    isPreview,
    milesSource,
  } = drive

  const numericMiles = normalizeMiles(miles)
  const totalHours =
    typeof totalDurationHours === "number" ? totalDurationHours : 0

  const {
    dayHours,
    nightHours,
    dayRange,
    nightRange,
    isVerified,
  } = getDisplaySegments(drive)

  const lightingLabel = getLightingLabel(dayHours, nightHours)
  const mapTimeOfDay = getMapTimeOfDay(nightHours)
  const safeRoute = normalizeRoute(routeCoords)

  const handleStartNew = () => {
    setScreen("active")
  }

  const handleViewSummary = () => {
    setScreen("summary")
  }

  return (
    <div className="w-full flex flex-col items-center px-3 pb-24 pt-3 text-[#0A1E5E] sm:px-4">
      {isPreview && (
        <div className="mb-4 w-full max-w-md rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-700">
            Preview Only — Not Saved
          </p>
          <p className="mt-1 text-sm leading-snug text-amber-800">
            This drive has <strong>not been saved</strong> yet. It will not
            appear in your History, Summary totals, or any exports. Return to
            the Active Drive screen and tap <strong>Stop Drive</strong> to
            save it permanently.
          </p>
        </div>
      )}

      <section className="w-full max-w-md rounded-[24px] border border-white/30 bg-white/95 px-6 py-7 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {isPreview ? "Drive Preview" : "Today's Drive"}
          </h2>

          <div className="flex items-center gap-2">
            {isPreview && (
              <span className="rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Not Saved
              </span>
            )}
            {isVerified ? <VerifiedBadge /> : <EstimatedBadge />}
          </div>
        </div>

        <p className="mb-5 text-sm text-[#1b2755]">
          {isPreview
            ? "This is a live snapshot. Save the drive to make it permanent."
            : "Great job today — here's what you completed."}
        </p>

        <div className="mb-4 space-y-2 text-sm text-[#1b2755]">
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
            {milesSource === "gps-accumulated" && (
              <span className="ml-1 text-[10px] text-[#0A1E5E]/45">
                (GPS est.)
              </span>
            )}
          </p>

          <p>
            <strong>Total Duration:</strong> {formatHours(totalHours)}
          </p>

          <p>
            <strong>Lighting:</strong> {lightingLabel}
          </p>

          {dayHours > 0 && (
            <p>
              <strong>Day Driving:</strong> {formatHours(dayHours)}
              {dayRange ? (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">
                  ({dayRange})
                </span>
              ) : null}
            </p>
          )}

          {nightHours > 0 && (
            <p>
              <strong>Night Driving:</strong> {formatHours(nightHours)}
              {nightRange ? (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">
                  ({nightRange})
                </span>
              ) : null}
            </p>
          )}

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
        <button
          onClick={handleStartNew}
          className="w-full rounded-lg bg-[#0A1E5E] py-3 font-semibold text-white transition-colors hover:bg-[#f9c80e] hover:text-[#0A1E5E]"
        >
          {hasActiveDrive ? "Return to Active Drive" : "Start New Drive"}
        </button>

        <button
          onClick={handleViewSummary}
          className="w-full rounded-lg border border-[#0A1E5E] bg-white py-3 font-semibold text-[#0A1E5E] transition-colors hover:bg-[#0A1E5E] hover:text-white"
        >
          View Summary
        </button>
      </div>
    </div>
  )
}

