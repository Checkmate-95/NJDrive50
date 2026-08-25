// src/screens/DriveHistoryContent.tsx
import { useMemo, useState } from "react"
import {
  useDriveHistory,
  type DriveEntry,
  deleteDriveEntry,
  isDriveVerified,
} from "../state/driveStore"
import { EditDriveModal } from "../components/EditDriveModal"
import { useNav } from "../state/navStore"

const safeNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatHours = (hours: number) => {
  return `${safeNumber(hours).toFixed(2)} hrs`
}

const formatClockTime = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return ""
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

const formatRange = (
  startMs: number | null | undefined,
  endMs: number | null | undefined
): string => {
  const start = formatClockTime(startMs)
  const end = formatClockTime(endMs)
  if (!start || !end) return ""
  return `${start} – ${end}`
}

const getLightingLabel = (
  dayHours: number,
  nightHours: number
): "Day Drive" | "Night Drive" | "Mixed Drive" => {
  if (nightHours > 0 && dayHours > 0) return "Mixed Drive"
  if (nightHours > 0) return "Night Drive"
  return "Day Drive"
}

/*
 * FIX: dayHours/nightHours now read the exact fields stored at save time
 * in ActiveDriveContent.tsx (drive.dayDurationHours / drive.nightDurationHours)
 * instead of deriving dayHours via subtraction. This guarantees History
 * always agrees with TodaysDrive.tsx and ExportLog.tsx, since all three
 * now read the identical frozen fields.
 */
const getNightData = (d: DriveEntry) => {
  const verifiedNight = safeNumber(d.verifiedNightDurationHours)
  const estimatedNight = safeNumber(d.nightDurationHours)
  const effectiveNight = verifiedNight > 0 ? verifiedNight : estimatedNight
  const isVerified = isDriveVerified(d)

  return {
    effectiveNight,
    verifiedNight,
    estimatedNight,
    isVerified,
  }
}

/*
 * FIX: Ranges are now read from the stored dayRangeStartMs/dayRangeEndMs/
 * nightRangeStartMs/nightRangeEndMs fields, computed ONCE at save time by
 * ActiveDriveContent.tsx using splitDriveBySolar. This removes the
 * previous bug where the day segment was always assumed to come before
 * the night segment — which was wrong for drives that started at night
 * and ended after sunrise.
 *
 * For older drives saved before this schema existed (all four range
 * fields are null/undefined), no range text is shown at all. This is
 * intentionally honest rather than guessing an order.
 */
const getDisplaySegments = (d: DriveEntry) => {
  const dayHours = safeNumber(d.dayDurationHours)
  const { effectiveNight, isVerified } = getNightData(d)
  const nightHours = effectiveNight

  const dayRange = formatRange(d.dayRangeStartMs, d.dayRangeEndMs)
  const nightRange = formatRange(d.nightRangeStartMs, d.nightRangeEndMs)

  return { dayHours, nightHours, dayRange, nightRange, isVerified }
}

const VerifiedBadge = () => (
  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
    <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
    Verified
  </span>
)

const EstimatedBadge = () => (
  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700">
    Estimated
  </span>
)

const LocationEstimatedBadge = () => (
  <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-orange-700">
    Location Estimated
  </span>
)

export default function DriveHistoryContent() {
  const { goBack, setScreen } = useNav()

  const history = useDriveHistory()
  const drives = useMemo(() => (history ?? []).slice().reverse(), [history])

  const [editDrive, setEditDrive] = useState<DriveEntry | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const summary = useMemo(() => {
    let dayOnly = 0
    let nightOnly = 0
    let mixed = 0
    let verifiedCount = 0

    for (const drive of drives) {
      const { dayHours, nightHours, isVerified } = getDisplaySegments(drive)
      const lighting = getLightingLabel(dayHours, nightHours)

      if (lighting === "Mixed Drive") mixed += 1
      else if (lighting === "Night Drive") nightOnly += 1
      else dayOnly += 1

      if (isVerified) verifiedCount += 1
    }

    return { total: drives.length, dayOnly, nightOnly, mixed, verifiedCount }
  }, [drives])

  function handleOpenEdit(entry: DriveEntry) {
    setEditDrive(entry)
    setIsEditOpen(true)
  }

  function handleCloseEdit() {
    setIsEditOpen(false)
    setEditDrive(null)
  }

  function handleEditSaved(updated: DriveEntry) {
    setEditDrive(updated)
    handleCloseEdit()
  }

  function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this drive entry?")
    if (!confirmDelete) return

    deleteDriveEntry(id)
  }

  function handleExportLogs() {
    if (!drives.length) {
      alert("No logs to export.")
      return
    }

    window.scrollTo({ top: 0, behavior: "smooth" })
    setScreen("export")
  }

  return (
    <div className="flex w-full justify-center px-3 pb-28 pt-4 text-[#08194A] sm:px-4">
      <section className="w-full max-w-3xl rounded-[28px] border border-white/30 bg-white/95 px-4 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md sm:px-6 sm:py-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#08194A]/50">
              Drive History
            </p>

            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Drive History Logs
            </h2>

            <p className="mt-2 text-sm text-[#08194A]/65 sm:text-base">
              Review saved drives, lighting breakdowns, and verified night-hour
              entries.
            </p>
          </div>

          <button
            type="button"
            onClick={() => goBack()}
            aria-label="Close drive history"
            title="Close"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#08194A]/15 bg-[#F7F9FC] text-2xl font-light leading-none text-[#08194A]/70 transition hover:bg-[#E9EDF5] hover:text-[#08194A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2"
          >
            ×
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#08194A]/60">
          <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
            Total Drives: {summary.total}
          </span>

          <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
            Day Only: {summary.dayOnly}
          </span>

          <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
            Night Only: {summary.nightOnly}
          </span>

          <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
            Mixed: {summary.mixed}
          </span>

          {summary.verifiedCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              {summary.verifiedCount} Verified
            </span>
          )}
        </div>

        {drives.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-[#08194A]/12 bg-[#F7F9FC] p-5 text-center text-sm text-[#08194A]/60">
            No drives logged yet.
          </div>
        )}

        <div className="mt-6 space-y-4">
          {drives.map((drive) => {
            const start = new Date(drive.startTime).toLocaleString()
            const end = new Date(drive.endTime).toLocaleString()
            const totalHours = safeNumber(drive.totalDurationHours)
            const miles = safeNumber(drive.miles)

            const {
              dayHours,
              nightHours,
              dayRange,
              nightRange,
              isVerified,
            } = getDisplaySegments(drive)

            const lighting = getLightingLabel(dayHours, nightHours)
            const locationEstimated = drive.locationEstimated === true

            return (
              <div
                key={drive.id}
                className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-4 shadow-sm transition-colors hover:bg-[#EEF3FA] sm:px-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-extrabold text-[#08194A] sm:text-lg">
                        {formatHours(totalHours)}
                      </p>

                      <span
                        title={lighting}
                        className={`inline-flex h-2.5 w-2.5 rounded-full ${
                          lighting === "Night Drive"
                            ? "bg-[#f9c80e]"
                            : lighting === "Mixed Drive"
                              ? "bg-[#0A1E5E]"
                              : "bg-gray-400"
                        }`}
                      />

                      <span className="text-xs font-semibold text-[#08194A]/72">
                        {lighting}
                      </span>

                      {isVerified ? <VerifiedBadge /> : <EstimatedBadge />}

                      {locationEstimated && <LocationEstimatedBadge />}
                    </div>

                    <p className="mt-2 break-words text-sm text-[#08194A]/68">
                      {start} → {end}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#08194A]/58">
                      <span>{miles.toFixed(1)} miles</span>
                      {drive.weather ? (
                        <span>Weather: {drive.weather}</span>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {dayHours > 0 && (
                        <div className="rounded-xl bg-white px-3 py-2 text-[11px] text-[#08194A]/65">
                          <span className="font-semibold text-[#08194A]/82">
                            Day:
                          </span>{" "}
                          {dayHours.toFixed(2)} hrs
                          {dayRange ? ` (${dayRange})` : ""}
                        </div>
                      )}

                      {nightHours > 0 && (
                        <div className="rounded-xl bg-white px-3 py-2 text-[11px] text-[#08194A]/65">
                          <span className="font-semibold text-[#08194A]/82">
                            Night:
                          </span>{" "}
                          {nightHours.toFixed(2)} hrs
                          {nightRange ? ` (${nightRange})` : ""}
                        </div>
                      )}
                    </div>

                    {drive.notes ? (
                      <div className="mt-3 rounded-xl bg-white px-3 py-2 text-[11px] text-[#08194A]/65">
                        <span className="font-semibold text-[#08194A]/82">
                          Notes:
                        </span>{" "}
                        {drive.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:max-w-[220px] sm:justify-end">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(drive)}
                      className="min-h-[40px] rounded-lg bg-[#08194A] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#f9c80e] hover:text-[#08194A]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(drive.id)}
                      className="min-h-[40px] rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleExportLogs}
            className="min-h-[44px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#f9c80e] hover:text-[#08194A]"
          >
            Export Logs
          </button>

          <button
            type="button"
            onClick={() => goBack()}
            className="min-h-[44px] w-full rounded-xl bg-[#E9EDF5] px-4 py-3 text-sm font-semibold text-[#08194A] transition hover:bg-[#DCE4F2]"
          >
            Back to Home
          </button>
        </div>
      </section>

      {editDrive && (
        <EditDriveModal
          key={editDrive.id}
          open={isEditOpen}
          entry={editDrive}
          onClose={handleCloseEdit}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}