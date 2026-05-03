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

const getLightingLabel = (
  dayHours: number,
  nightHours: number
): "Day" | "Night" | "Mixed" => {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  return "Day"
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

export default function DriveHistoryContent() {
  const { goBack } = useNav()

  const [drives, setDrives] = useState<DriveEntry[]>(() =>
    getDriveHistory().slice().reverse()
  )

  const [editDrive, setEditDrive] = useState<DriveEntry | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const summary = useMemo(() => {
    let dayCount = 0
    let nightCount = 0
    let mixedCount = 0

    for (const drive of drives) {
      const lighting = getLightingLabel(
        safeNumber(drive.dayDurationHours),
        safeNumber(drive.nightDurationHours)
      )
      if (lighting === "Mixed") mixedCount += 1
      else if (lighting === "Night") nightCount += 1
      else dayCount += 1
    }

    return { dayCount, nightCount, mixedCount }
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
    setDrives((prev) =>
      prev.map((d) => (d.id === updated.id ? updated : d))
    )
    setEditDrive(updated)
    handleCloseEdit()
  }

  function handleDelete(id: string) {
    const confirmDelete = window.confirm("Delete this drive entry?")
    if (!confirmDelete) return
    deleteDriveEntry(id)
    setDrives((prev) => prev.filter((d) => d.id !== id))
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
      "lighting",
      "miles",
      "weather",
      "notes",
    ]

    const rows = drives.map((d) => {
      const dayHours   = safeNumber(d.dayDurationHours)
      const nightHours = safeNumber(d.nightDurationHours)
      const totalHours = safeNumber(d.totalDurationHours)
      const miles      = safeNumber(d.miles)

      return [
        d.id,
        d.startTime,
        d.endTime,
        totalHours.toFixed(2),
        dayHours.toFixed(2),
        nightHours.toFixed(2),
        getLightingLabel(dayHours, nightHours),
        miles.toFixed(2),
        d.weather ?? "",
        d.notes   ?? "",
      ]
    })

    const csv = [
      header.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url  = URL.createObjectURL(blob)
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

        <div className="mb-3 flex flex-wrap justify-between gap-2 text-sm font-medium text-gray-600">
          <span>Day Drives: {summary.dayCount}</span>
          <span>Night Drives: {summary.nightCount}</span>
        </div>

        {summary.mixedCount > 0 && (
          <div className="mb-3 text-xs font-medium text-[#08194A]/70">
            Mixed Drives: {summary.mixedCount}
          </div>
        )}

        {drives.length === 0 && (
          <div className="mt-6 rounded-xl bg-gray-100 p-4 text-center text-sm text-gray-600">
            No drives logged yet.
          </div>
        )}

        <div className="space-y-3">
          {drives.map((drive) => {
            const start      = new Date(drive.startTime).toLocaleString()
            const end        = new Date(drive.endTime).toLocaleString()
            const totalHours = safeNumber(drive.totalDurationHours)
            const dayHours   = safeNumber(drive.dayDurationHours)
            const nightHours = safeNumber(drive.nightDurationHours)
            const miles      = safeNumber(drive.miles)
            const lighting   = getLightingLabel(dayHours, nightHours)

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
                    <p className="mt-1 text-xs font-semibold text-[#08194A]/75">
                      Lighting: {lighting}
                    </p>
                    {drive.weather ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Weather: {drive.weather}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center space-x-3">
                    {/* [FIX-3] Replaced ● emoji with a styled div dot */}
                    <div
                      title={lighting}
                      className={`h-3 w-3 rounded-full ${
                        lighting === "Night"
                          ? "bg-[#f9c80e]"
                          : lighting === "Mixed"
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

        {/* [FIX-1] goBack() replaces hardcoded setScreen("home") */}
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