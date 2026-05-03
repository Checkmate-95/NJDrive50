// src/components/EditDriveModal.tsx
import { useEffect, useState } from "react"
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

export function EditDriveModal({ open, entry, onClose, onSaved }: Props) {
  const [startTime, setStartTime] = useState(entry.startTime)
  const [endTime, setEndTime] = useState(entry.endTime)

  // ⭐ Miles stored as STRING for perfect UX
  const [miles, setMiles] = useState(entry.miles.toString())

  useEffect(() => {
    setStartTime(entry.startTime)
    setEndTime(entry.endTime)
    setMiles(entry.miles.toString())
  }, [entry])

  if (!open) return null

  function handleSave() {
    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      alert("End time must be after start time.")
      return
    }

    const durationMs = end.getTime() - start.getTime()
    const totalDurationHours = durationMs / (1000 * 60 * 60)

    const updated: DriveEntry = {
      ...entry,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      totalDurationHours,
      miles: parseFloat(miles) || 0, // ⭐ Clean conversion here
    }

    updateDriveInHistory(updated)
    onSaved(updated)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#020617] p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-white">
          Edit Drive
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Start Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
              value={toLocalInputValue(startTime)}
              onChange={(e) =>
                setStartTime(new Date(e.target.value).toISOString())
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              End Time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
              value={toLocalInputValue(endTime)}
              onChange={(e) =>
                setEndTime(new Date(e.target.value).toISOString())
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-gray-300">
              Miles
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2 text-sm text-white"
              value={miles}
              onChange={(e) => setMiles(e.target.value)} // ⭐ Allows empty string
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
