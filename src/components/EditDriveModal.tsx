// src/components/EditDriveModal.tsx
import { useEffect, useMemo, useState } from "react"
import {
  type DriveEntry,
  updateDriveInHistory,
} from "../state/driveStore"

type Props = {
  open: boolean
  entry: DriveEntry
  onClose: () => void
  onSaved: (entry: DriveEntry) => void
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => n.toString().padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function parseMilesInput(value: string) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function EditDriveModal({ open, entry, onClose, onSaved }: Props) {
  const [startInput, setStartInput] = useState(toLocalInputValue(entry.startTime))
  const [endInput, setEndInput] = useState(toLocalInputValue(entry.endTime))
  const [miles, setMiles] = useState(String(entry.miles ?? ""))

  useEffect(() => {
    setStartInput(toLocalInputValue(entry.startTime))
    setEndInput(toLocalInputValue(entry.endTime))
    setMiles(String(entry.miles ?? ""))
  }, [entry])

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const computedDuration = useMemo(() => {
    const start = new Date(startInput)
    const end = new Date(endInput)

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      return null
    }

    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, [startInput, endInput])

  if (!open) return null

  function handleSave() {
    const start = new Date(startInput)
    const end = new Date(endInput)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      alert("End time must be after start time.")
      return
    }

    const totalDurationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    const updated: DriveEntry = {
      ...entry,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalDurationHours,
      miles: parseMilesInput(miles),
    }

    updateDriveInHistory(updated)
    onSaved(updated)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#08194A]/40 px-4 py-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-drive-title"
        aria-describedby="edit-drive-description"
        className="w-full max-w-lg rounded-3xl border border-[#08194A]/10 bg-white p-5 text-[#08194A] shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
              Edit Drive Entry
            </div>

            <h2
              id="edit-drive-title"
              className="mt-3 text-2xl font-extrabold tracking-tight text-[#08194A]"
            >
              Update Drive Log
            </h2>

            <p
              id="edit-drive-description"
              className="mt-2 max-w-md text-sm leading-6 text-[#08194A]/65"
            >
              Adjust the saved time range and mileage for this drive entry, then
              save your changes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit drive modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] text-lg font-semibold text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
          >
            ×
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="edit-drive-start"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              Start Time
            </label>
            <input
              id="edit-drive-start"
              type="datetime-local"
              className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="edit-drive-end"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              End Time
            </label>
            <input
              id="edit-drive-end"
              type="datetime-local"
              className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="edit-drive-miles"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              Miles
            </label>
            <input
              id="edit-drive-miles"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="min-h-[48px] w-full rounded-2xl border border-[#08194A]/10 bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:border-[#08194A]/20 focus:bg-white focus:ring-2 focus:ring-[#08194A]/8"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#08194A]/8 bg-[#F7F9FC] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
            Calculated Duration
          </p>
          <p className="mt-1 text-sm font-semibold text-[#08194A]">
            {computedDuration !== null
              ? `${computedDuration.toFixed(2)} hrs`
              : "Invalid time range"}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border border-[#08194A]/10 bg-white px-5 py-3 text-sm font-semibold text-[#08194A]/75 transition hover:bg-[#F7F9FC] hover:text-[#08194A]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] rounded-xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}