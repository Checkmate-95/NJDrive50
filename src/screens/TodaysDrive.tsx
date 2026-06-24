// src/screens/TodaysDrive.tsx
import { useNav } from "../state/navStore"
import { useActiveDriveStore } from "../state/activeDriveStore"

import { MapProvider } from "../components/map/MapProvider"
import { DriveMapPanel } from "../components/map/DriveMapPanel"
import type { DriveEntry } from "../engine/driveEngine"  // ✅ import from engine, not driveStore

type Coord = {
  lat: number
  lng: number
}

type TodaysDriveProps = {
  drive: (DriveEntry & { isPreview?: boolean }) | null
}

/* -------------------------------------------------------
   FORMATTERS
------------------------------------------------------- */

function formatHours(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0.00 hrs"
  return `${(ms / 3600000).toFixed(2)} hrs`
}

function formatClockTime(ms: number): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return "Invalid time"
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}

function formatDateTime(ms: number): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString()
}

/* -------------------------------------------------------
   LIGHTING LABEL
------------------------------------------------------- */

function getLightingLabel(
  dayMs: number,
  nightMs: number
): "Day Drive" | "Night Drive" | "Mixed Drive" {
  if (nightMs > 0 && dayMs > 0) return "Mixed Drive"
  if (nightMs > 0) return "Night Drive"
  return "Day Drive"
}

function getMapTimeOfDay(nightMs: number): "Day" | "Night" {
  return nightMs > 0 ? "Night" : "Day"
}

/* -------------------------------------------------------
   ROUTE NORMALIZER
------------------------------------------------------- */

function normalizeRoute(value: unknown): Coord[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (coord): coord is Coord =>
      !!coord &&
      typeof coord === "object" &&
      typeof (coord as Coord).lat === "number" &&
      typeof (coord as Coord).lng === "number" &&
      Number.isFinite((coord as Coord).lat) &&
      Number.isFinite((coord as Coord).lng)
  )
}

/* -------------------------------------------------------
   VERIFICATION — matches engine exactly
------------------------------------------------------- */

function getVerification(drive: DriveEntry): boolean {
  // Verified night: solar mode with actual night duration
  if (drive.nightCalcMode === "solar" && drive.nightDuration > 0) return true
  // Verified day: engine confirmed fully daytime via solar
  if (drive.isVerifiedDay === true) return true
  return false
}

/* -------------------------------------------------------
   DISPLAY SEGMENTS — time ranges for day/night portions
------------------------------------------------------- */

function getDisplaySegments(drive: DriveEntry) {
  const { start, end, nightDuration, dayDuration } = drive

  let dayRange = ""
  let nightRange = ""

  const totalMs = end - start
  if (totalMs <= 0) {
    return { dayRange, nightRange }
  }

  if (nightDuration <= 0) {
    // Pure day drive
    dayRange = `${formatClockTime(start)} – ${formatClockTime(end)}`
  } else if (dayDuration <= 0) {
    // Pure night drive
    nightRange = `${formatClockTime(start)} – ${formatClockTime(end)}`
  } else {
    // Mixed: day first, then night (approximation — day portion starts at drive start)
    const splitMs = start + dayDuration
    dayRange = `${formatClockTime(start)} – ${formatClockTime(splitMs)}`
    nightRange = `${formatClockTime(splitMs)} – ${formatClockTime(end)}`
  }

  return { dayRange, nightRange }
}

/* -------------------------------------------------------
   BADGES
------------------------------------------------------- */

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

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */

export default function TodaysDrive({ drive }: TodaysDriveProps) {
  const { setScreen } = useNav()
  const activeSession = useActiveDriveStore((s) => s.session)
  const hasActiveDrive = Boolean(activeSession?.isActive)

  if (!drive || !Number.isFinite(drive.start) || !Number.isFinite(drive.end)) {
    return (
      <div className="p-6 text-center text-red-600">
        No drive data available.
      </div>
    )
  }

  const { start, end, duration, nightDuration, dayDuration, notes, isPreview } = drive

  const isVerified = getVerification(drive)
  const lightingLabel = getLightingLabel(dayDuration, nightDuration)
  const mapTimeOfDay = getMapTimeOfDay(nightDuration)
  const { dayRange, nightRange } = getDisplaySegments(drive)
  const safeRoute = normalizeRoute((drive as DriveEntry & { routeCoords?: unknown }).routeCoords)

  // Miles — optional field not in engine type, safe-read defensively
  const rawMiles = (drive as DriveEntry & { miles?: unknown }).miles
  const numericMiles = Number.isFinite(Number(rawMiles)) ? Number(rawMiles) : 0
  const milesSource = (drive as DriveEntry & { milesSource?: string }).milesSource

  const handleStartNew = () => setScreen("active")
  const handleViewSummary = () => setScreen("summary")

  return (
    <div className="flex w-full flex-col items-center px-3 pb-24 pt-3 text-[#0A1E5E] sm:px-4">

      {/* Preview warning */}
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

        {/* Header */}
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

        {/* Drive details */}
        <div className="mb-4 space-y-2 text-sm text-[#1b2755]">

          <p>
            <strong>Start Time:</strong> {formatDateTime(start)}
          </p>

          <p>
            <strong>End Time:</strong> {formatDateTime(end)}
          </p>

          {numericMiles > 0 && (
            <p>
              <strong>Miles:</strong> {numericMiles.toFixed(1)}
              {milesSource === "gps-accumulated" && (
                <span className="ml-1 text-[10px] text-[#0A1E5E]/45">(GPS est.)</span>
              )}
              {milesSource === "routes-api" && (
                <span className="ml-1 text-[10px] text-[#0A1E5E]/45">(Route)</span>
              )}
            </p>
          )}

          <p>
            <strong>Total Duration:</strong> {formatHours(duration)}
          </p>

          <p>
            <strong>Lighting:</strong> {lightingLabel}
          </p>

          {dayDuration > 0 && (
            <p>
              <strong>Day Driving:</strong> {formatHours(dayDuration)}
              {dayRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">({dayRange})</span>
              )}
            </p>
          )}

          {nightDuration > 0 && (
            <p>
              <strong>Night Driving:</strong> {formatHours(nightDuration)}
              {nightRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">({nightRange})</span>
              )}
            </p>
          )}

          {/* Weather — optional field, safe-read */}
          {(() => {
            const weather = (drive as DriveEntry & { weather?: string }).weather
            return (
              <p>
                <strong>Weather:</strong> {weather || "—"}
              </p>
            )
          })()}

        </div>

        {notes && (
          <div className="mb-4">
            <p className="text-sm text-[#1b2755]">
              <strong>Notes:</strong> {notes}
            </p>
          </div>
        )}

      </section>

      {/* Map */}
      <div className="mt-6 h-[400px] w-full max-w-md overflow-hidden rounded-[24px] border border-[#00bfff] shadow-lg">
        <MapProvider>
          <DriveMapPanel
            route={safeRoute}
            driveMeta={{
              miles: numericMiles,
              duration: formatHours(duration),
              timeOfDay: mapTimeOfDay,
            }}
          />
        </MapProvider>
      </div>

      {/* Actions */}
      <div className="flex w-full max-w-md flex-col gap-3 pt-6">
        <button
          type="button"
          onClick={handleStartNew}
          className="w-full rounded-lg bg-[#0A1E5E] py-3 font-semibold text-white transition-colors hover:bg-[#f9c80e] hover:text-[#0A1E5E]"
        >
          {hasActiveDrive ? "Return to Active Drive" : "Start New Drive"}
        </button>

        <button
          type="button"
          onClick={handleViewSummary}
          className="w-full rounded-lg border border-[#0A1E5E] bg-white py-3 font-semibold text-[#0A1E5E] transition-colors hover:bg-[#0A1E5E] hover:text-white"
        >
          View Summary
        </button>
      </div>

    </div>
  )
}