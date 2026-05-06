// src/screens/DriveHistoryContent.tsx
import { useMemo, useState } from "react"
import {
  getDriveHistory,
  type DriveEntry,
  deleteDriveEntry,
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

const formatClockTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })
}

const getLightingLabel = (
  dayHours: number,
  nightHours: number
): "Day Drive" | "Night Drive" | "Mixed Drive" => {
  if (nightHours > 0 && dayHours > 0) return "Mixed Drive"
  if (nightHours > 0) return "Night Drive"
  return "Day Drive"
}

const getNightData = (d: DriveEntry) => {
  const verifiedNight = safeNumber(d.verifiedNightDurationHours)
  const estimatedNight = safeNumber(d.nightDurationHours)
  const effectiveNight = verifiedNight > 0 ? verifiedNight : estimatedNight
  const isVerified = verifiedNight > 0

  return {
    effectiveNight,
    verifiedNight,
    estimatedNight,
    isVerified,
  }
}

const getDisplaySegments = (d: DriveEntry) => {
  const start = new Date(d.startTime)
  const end = new Date(d.endTime)

  const startMs = start.getTime()
  const endMs = end.getTime()
  const totalMs = Math.max(endMs - startMs, 0)

  const totalHours = safeNumber(d.totalDurationHours)
  const { effectiveNight, isVerified } = getNightData(d)
  const dayHours = Math.max(totalHours - effectiveNight, 0)
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

const escapeCsv = (value: unknown) => {
  const stringValue = String(value ?? "")
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
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

export default function DriveHistoryContent() {
  const { goBack } = useNav()

  const [drives, setDrives] = useState<DriveEntry[]>(() =>
    getDriveHistory().slice().reverse()
  )

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

    return {
      total: drives.length,
      dayOnly,
      nightOnly,
      mixed,
      verifiedCount,
    }
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
    setDrives(prev => prev.map(d => (d.id === updated.id ? updated : d)))
    setEditDrive(updated)
    handleCloseEdit()
  }

  function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this drive entry?")
    if (!confirmDelete) return
    deleteDriveEntry(id)
    setDrives(prev => prev.filter(d => d.id !== id))
  }

  function handleExportLogs() {
    if (!drives.length) {
      alert("No logs to export.")
      return
    }

    const header = [
      "id",
      "startTime",
      "endTime",
      "totalDurationHours",
      "dayDurationHours",
      "nightDurationHours",
      "verifiedNightDurationHours",
      "nightCalcMode",
      "lighting",
      "dayRange",
      "nightRange",
      "miles",
      "weather",
      "notes",
    ]

    const rows = drives.map(d => {
      const { dayHours, nightHours, dayRange, nightRange } = getDisplaySegments(d)
      const totalHours = safeNumber(d.totalDurationHours)
      const miles = safeNumber(d.miles)

      return [
        d.id,
        d.startTime,
        d.endTime,
        totalHours.toFixed(2),
        dayHours.toFixed(2),
        nightHours.toFixed(2),
        safeNumber(d.verifiedNightDurationHours).toFixed(2),
        d.nightCalcMode ?? "",
        getLightingLabel(dayHours, nightHours),
        dayRange,
        nightRange,
        miles.toFixed(2),
        d.weather ?? "",
        d.notes ?? "",
      ]
    })

    const csv = [
      header.map(escapeCsv).join(","),
      ...rows.map(row => row.map(escapeCsv).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "njdrive50_history.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex w-full justify-center px-3 pt-4 pb-28 text-[#08194A] sm:px-4">
      <section className="w-full max-w-md rounded-[24px] border border-white/30 bg-white/95 px-6 py-7 text-left shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">
          Drive History Logs
        </h2>

        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
          <span>Total Drives: {summary.total}</span>
          {summary.verifiedCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              {summary.verifiedCount} Verified
            </span>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-3 text-sm font-medium text-gray-600">
          <span>Day Only: {summary.dayOnly}</span>
          <span>Night Only: {summary.nightOnly}</span>
          <span>Mixed: {summary.mixed}</span>
        </div>

        {drives.length === 0 && (
          <div className="mt-6 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600">
            No drives logged yet.
          </div>
        )}

        <div className="space-y-3">
          {drives.map(drive => {
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

            return (
              <div
                key={drive.id}
                className="rounded-lg bg-gray-100 px-4 py-3 transition-colors hover:bg-gray-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#08194A]">
                      {formatHours(totalHours)}
                    </p>

                    <p className="text-sm text-gray-600">
                      {start} → {end}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {miles.toFixed(1)} miles
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-[#08194A]/75">
                        Lighting: {lighting}
                      </p>
                      {isVerified ? <VerifiedBadge /> : <EstimatedBadge />}
                    </div>

                    {dayHours > 0 && (
                      <p className="mt-1 text-[11px] text-gray-500">
                        <span className="font-semibold text-[#08194A]/80">
                          Day:
                        </span>{" "}
                        {dayHours.toFixed(2)} hrs
                        {dayRange ? ` (${dayRange})` : ""}
                      </p>
                    )}

                    {nightHours > 0 && (
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        <span className="font-semibold text-[#08194A]/80">
                          Night:
                        </span>{" "}
                        {nightHours.toFixed(2)} hrs
                        {nightRange ? ` (${nightRange})` : ""}
                      </p>
                    )}

                    {drive.weather ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Weather: {drive.weather}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center space-x-3">
                    <div
                      title={lighting}
                      className={`h-3 w-3 rounded-full ${
                        lighting === "Night Drive"
                          ? "bg-[#f9c80e]"
                          : lighting === "Mixed Drive"
                          ? "bg-[#0A1E5E]"
                          : "bg-gray-400"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(drive)}
                      className="rounded-md bg-[#08194A] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#f9c80e] hover:text-[#08194A]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(drive.id)}
                      className="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={handleExportLogs}
          className="mt-6 w-full rounded-lg bg-[#08194A] py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[#f9c80e] hover:text-[#08194A]"
        >
          Export Logs
        </button>

        <button
          type="button"
          onClick={() => goBack()}
          className="mt-3 w-full rounded-lg bg-gray-200 py-2 text-sm font-semibold text-[#08194A] transition hover:bg-[#f9c80e]"
        >
          Back to Home
        </button>
      </section>

      {editDrive && (
        <EditDriveModal
          open={isEditOpen}
          entry={editDrive}
          onClose={handleCloseEdit}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  )
}