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
import {
  computeDayNightSplit,
  splitDriveBySolar,
  classifyDriveType,
  getSolarWindowForDate,
} from "../engine/solarEngine"

type Coord = {
  lat: number
  lng: number
}

type TodaysDriveProps = {
  drive: (DriveEntry & { isPreview?: boolean }) | null
}

const EPSILON = 0.01

/* -------------------------------------------------------
   FORMATTERS
------------------------------------------------------- */

function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "0.00 hrs"
  return `${hours.toFixed(2)} hrs`
}

function formatClockTime(isoOrMs: string | number): string {
  const date =
    typeof isoOrMs === "number" ? new Date(isoOrMs) : new Date(isoOrMs)
  if (Number.isNaN(date.getTime())) return "Invalid time"
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString()
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
   SOLAR HELPERS
------------------------------------------------------- */

const DEFAULT_COORD: Coord = {
  lat: 39.9537,
  lng: -74.1979,
}

function getSolarCoords(drive: DriveEntry): Coord | null {
  const lat = drive.startLatitude
  const lng = drive.startLongitude

  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === "number" &&
    Number.isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  ) {
    return { lat, lng }
  }

  const route = drive.routeCoords
  if (
    route &&
    route.length > 0 &&
    Number.isFinite(route[0].lat) &&
    Number.isFinite(route[0].lng)
  ) {
    const rLat = route[0].lat
    const rLng = route[0].lng
    if (rLat >= -90 && rLat <= 90 && rLng >= -180 && rLng <= 180) {
      return { lat: rLat, lng: rLng }
    }
  }

  return null
}

function getSolarSplitForDrive(drive: DriveEntry) {
  const start = new Date(drive.startTime)
  const end = new Date(drive.endTime)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      dayHours: 0,
      nightHours: 0,
      mode: "unverified" as const,
      dayRange: "",
      nightRange: "",
    }
  }

  const coord = getSolarCoords(drive) ?? DEFAULT_COORD

  const solarWindow = getSolarWindowForDate(coord.lat, coord.lng, start)
  const split = computeDayNightSplit(start, end, solarWindow)

  if (split.mode === "unverified") {
    const totalDurationHours = drive.totalDurationHours ?? 0
    const verifiedNight = drive.verifiedNightDurationHours ?? 0
    const estimatedNight = drive.nightDurationHours ?? 0
    const nightHours = verifiedNight > 0 ? verifiedNight : estimatedNight
    const dayHours = Math.max(totalDurationHours - nightHours, 0)

    return {
      dayHours,
      nightHours,
      mode: "unverified" as const,
      dayRange: "",
      nightRange: "",
    }
  }

  const segments = splitDriveBySolar(start, end, solarWindow)

  const dayHours = split.dayHours
  const nightHours = split.nightHours

  let dayRange = ""
  let nightRange = ""

  if (segments.type === "Day Only") {
    if (segments.dayStartMs !== null && segments.dayEndMs !== null) {
      dayRange = `${formatClockTime(segments.dayStartMs)} – ${formatClockTime(segments.dayEndMs)}`
    }
  } else if (segments.type === "Night Only") {
    if (segments.nightStartMs !== null && segments.nightEndMs !== null) {
      nightRange = `${formatClockTime(segments.nightStartMs)} – ${formatClockTime(segments.nightEndMs)}`
    }
  } else if (segments.type === "Mixed Drive") {
    if (segments.dayStartMs !== null && segments.dayEndMs !== null) {
      dayRange = `${formatClockTime(segments.dayStartMs)} – ${formatClockTime(segments.dayEndMs)}`
    }
    if (segments.nightStartMs !== null && segments.nightEndMs !== null) {
      nightRange = `${formatClockTime(segments.nightStartMs)} – ${formatClockTime(segments.nightEndMs)}`
    }
  }

  return {
    dayHours,
    nightHours,
    mode: split.mode,
    dayRange,
    nightRange,
  }
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

  const totalDurationHours = drive.totalDurationHours ?? 0
  const isPreview =
    (drive as DriveEntry & { isPreview?: boolean }).isPreview

  const solarSplit = getSolarSplitForDrive(drive)
  const dayHours = solarSplit.dayHours
  const nightHours = solarSplit.nightHours
  const { dayRange, nightRange } = solarSplit

  const isVerified = isDriveVerified(drive)

  const lightingLabel = classifyDriveType(dayHours, nightHours)

  const mapTimeOfDay =
    lightingLabel === "Night Only"
      ? "Night"
      : lightingLabel === "Day Only"
      ? "Day"
      : nightHours >= dayHours
      ? "Night"
      : "Day"

  const showDaySection = dayHours > EPSILON
  const showNightSection = nightHours > EPSILON

  const safeRoute = normalizeRoute(
    (drive as DriveEntry & { routeCoords?: unknown }).routeCoords
  )

  const rawMiles = (drive as DriveEntry & { miles?: unknown }).miles
  const numericMiles = Number.isFinite(Number(rawMiles))
    ? Number(rawMiles)
    : 0
  const milesSource = (drive as DriveEntry & { milesSource?: string })
    .milesSource
  const weather = (drive as DriveEntry & { weather?: string }).weather

  const handleStartNew = () => setScreen("active")
  const handleViewSummary = () => setScreen("summary")

  return (
    <div className="flex w-full flex-col items-center px-3 pb-24 pt-3 text-[#0A1E5E] sm:px-4">
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
            <strong>Start Time:</strong> {formatDateTime(drive.startTime)}
          </p>

          <p>
            <strong>End Time:</strong> {formatDateTime(drive.endTime)}
          </p>

          {numericMiles > 0 && (
            <p>
              <strong>Miles:</strong> {numericMiles.toFixed(1)}
              {milesSource === "gps-accumulated" && (
                <span className="ml-1 text-[10px] text-[#0A1E5E]/45">
                  (GPS est.)
                </span>
              )}
              {milesSource === "routes-api" && (
                <span className="ml-1 text-[10px] text-[#0A1E5E]/45">
                  (Route)
                </span>
              )}
            </p>
          )}

          <p>
            <strong>Total Duration:</strong>{" "}
            {formatHours(totalDurationHours)}
          </p>

          <p>
            <strong>Lighting:</strong> {lightingLabel}
          </p>

          {showDaySection && (
            <p>
              <strong>Day Driving:</strong> {formatHours(dayHours)}
              {dayRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">
                  ({dayRange})
                </span>
              )}
            </p>
          )}

          {showNightSection && (
            <p>
              <strong>Night Driving:</strong> {formatHours(nightHours)}
              {nightRange && (
                <span className="ml-1 text-xs text-[#0A1E5E]/60">
                  ({nightRange})
                </span>
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

        <div className="mt-2 rounded-xl border border-[#0A1E5E]/10 bg-[#F4F7FF] px-4 py-3">
          <button
            type="button"
            onClick={() =>
              setShowSolarExplainer((prev) => !prev)
            }
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
              NJDrive50 determines Day and Night driving using built‑in
              solar calculations rather than a fixed 6 AM/PM cutoff. The
              app computes your exact sunrise and sunset each day based on
              your location, using those solar events to define when
              “daylight” and “darkness” legally begin. Because sunrise and
              sunset shift slightly throughout the year, the logged
              Day/Night transition updates automatically to reflect the
              current solar time, ensuring precise, GDL‑compliant tracking.
            </p>
          )}
        </div>
      </section>

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
