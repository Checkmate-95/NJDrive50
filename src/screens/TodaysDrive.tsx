// src/screens/TodaysDrive.tsx
import { useState } from "react"
import { useNav } from "../state/navStore"
import { useActiveDriveStore } from "../state/activeDriveStore"
import { MapProvider } from "../components/map/MapProvider"
import { DriveMapPanel } from "../components/map/DriveMapPanel"
import {
  isDriveVerified,
  type DriveEntry,
} from "../state/driveStore"


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


function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "0.00 hrs"
  return `${hours.toFixed(2)} hrs`
}


function formatClockTime(isoOrMs: string | number): string {
  const date = typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs)
  if (Number.isNaN(date.getTime())) return "Invalid time"
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
}


function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString()
}


/* -------------------------------------------------------
   LIGHTING LABEL
------------------------------------------------------- */


function getLightingLabel(
  dayHours: number,
  nightHours: number
): "Day Drive" | "Night Drive" | "Mixed Drive" {
  if (nightHours > 0 && dayHours > 0) return "Mixed Drive"
  if (nightHours > 0) return "Night Drive"
  return "Day Drive"
}


function getMapTimeOfDay(nightHours: number): "Day" | "Night" {
  return nightHours > 0 ? "Night" : "Day"
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
   DISPLAY SEGMENTS — time ranges for day/night portions
------------------------------------------------------- */


function getDisplaySegments(drive: DriveEntry) {
  const startMs = new Date(drive.startTime).getTime()
  const endMs   = new Date(drive.endTime).getTime()


  const totalDurationHours = drive.totalDurationHours ?? 0
  const verifiedNight = drive.verifiedNightDurationHours ?? 0
  const estimatedNight = drive.nightDurationHours ?? 0
  const nightHours = verifiedNight > 0 ? verifiedNight : estimatedNight
  const dayHours   = Math.max(totalDurationHours - nightHours, 0)


  let dayRange   = ""
  let nightRange = ""


  const totalMs = endMs - startMs
  if (totalMs <= 0) return { dayRange, nightRange }


  if (nightHours <= 0) {
    dayRange = `${formatClockTime(startMs)} – ${formatClockTime(endMs)}`
  } else if (dayHours <= 0) {
    nightRange = `${formatClockTime(startMs)} – ${formatClockTime(endMs)}`
  } else {
    const splitMs = startMs + dayHours * 3600 * 1000
    dayRange   = `${formatClockTime(startMs)} – ${formatClockTime(splitMs)}`
    nightRange = `${formatClockTime(splitMs)} – ${formatClockTime(endMs)}`
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
  const [showSolarExplainer, setShowSolarExplainer] = useState(false)


  if (!drive || !drive.startTime || !drive.endTime) {
    return (
      <div className="p-6 text-center text-red-600">
        No drive data available.
      </div>
    )
  }


  const verifiedNight    = drive.verifiedNightDurationHours ?? 0
  const estimatedNight   = drive.nightDurationHours ?? 0
  const nightHours       = verifiedNight > 0 ? verifiedNight : estimatedNight
  const dayHours         = Math.max((drive.totalDurationHours ?? 0) - nightHours, 0)
  const totalDurationHours = drive.totalDurationHours ?? 0
  const isPreview        = (drive as DriveEntry & { isPreview?: boolean }).isPreview


  const isVerified       = isDriveVerified(drive)
  const lightingLabel    = getLightingLabel(dayHours, nightHours)
  const mapTimeOfDay     = getMapTimeOfDay(nightHours)
  const { dayRange, nightRange } = getDisplaySegments(drive)
  const safeRoute        = normalizeRoute((drive as DriveEntry & { routeCoords?: unknown }).routeCoords)


  const rawMiles         = (drive as DriveEntry & { miles?: unknown }).miles
  const numericMiles     = Number.isFinite(Number(rawMiles)) ? Number(rawMiles) : 0
  const milesSource      = (drive as DriveEntry & { milesSource?: string }).milesSource
  const weather          = (drive as DriveEntry & { weather?: string }).weather


  const handleStartNew      = () => setScreen("active")
  const handleViewSummary   = () => setScreen("summary")


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
            <strong>Start Time:</strong> {formatDateTime(drive.startTime)}
          </p>


          <p>
            <strong>End Time:</strong> {formatDateTime(drive.endTime)}
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
            <strong>Total Duration:</strong> {formatHours(totalDurationHours)}
          </p>


          <p>
            <strong>Lighting:</strong> {lightingLabel}
          </p>


          {dayHours > 0 && (
            <p>
              <strong>Day Driving:</strong> {formatHours(dayHours)}
              {dayRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">({dayRange})</span>
              )}
            </p>
          )}


          {nightHours > 0 && (
            <p>
              <strong>Night Driving:</strong> {formatHours(nightHours)}
              {nightRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">({nightRange})</span>
              )}
            </p>
          )}


          <p>
            <strong>Weather:</strong> {weather || "—"}
          </p>


        </div>


        {drive.notes && (
          <div className="mb-4">
            <p className="text-sm text-[#1b2755]">
              <strong>Notes:</strong> {drive.notes}
            </p>
          </div>
        )}


        {/* ── Solar Time Explainer (collapsible) ──────────────────────── */}
        <div className="mt-2 rounded-xl border border-[#0A1E5E]/10 bg-[#F4F7FF] px-4 py-3">
          <button
            type="button"
            onClick={() => setShowSolarExplainer((prev) => !prev)}
            className="flex w-full items-center justify-between gap-2 text-left"
            aria-expanded={showSolarExplainer}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#0A1E5E]/50">ⓘ</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0A1E5E]/60">
                Why the Logged Switch Time Changes
              </p>
            </div>
            <span className="shrink-0 text-xs text-[#0A1E5E]/40">
              {showSolarExplainer ? "▲" : "▼"}
            </span>
          </button>

          {showSolarExplainer && (
            <p className="mt-2 text-xs leading-relaxed text-[#0A1E5E]/70">
              The on‑screen timer always switches at 6:00 AM and 6:00 PM for a simple,
              predictable display. Your teen's logged driving hours, however, use real
              sunrise and sunset times for your location — the legal standard under
              New Jersey's GDL rules. Because sunrise and sunset shift slightly each
              day, the logged Day/Night switch time will also change.
            </p>
          )}
        </div>
        {/* ─────────────────────────────────────────────────────────────── */}


      </section>


      {/* Map */}
      <div className="mt-6 h-[400px] w-full max-w-md overflow-hidden rounded-[24px] border border-[#00bfff] shadow-lg">
        <MapProvider>
          <DriveMapPanel
            route={safeRoute}
            driveMeta={{
              miles: numericMiles,
              duration: formatHours(totalDurationHours),
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