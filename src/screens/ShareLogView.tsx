// src/screens/ShareLogView.tsx
import { useEffect, useState } from "react"

type SharedDrive = {
  id: string
  startTime: string
  endTime: string
  durationHours: number
  isNight: boolean
}

type SharedLogPayload = {
  teenName: string
  totalHours: number
  nightHours: number
  drives: SharedDrive[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isSharedDrive(value: unknown): value is SharedDrive {
  if (!isRecord(value)) return false

  return (
    typeof value.id === "string" &&
    typeof value.startTime === "string" &&
    typeof value.endTime === "string" &&
    typeof value.durationHours === "number" &&
    Number.isFinite(value.durationHours) &&
    typeof value.isNight === "boolean"
  )
}

function isSharedLogPayload(value: unknown): value is SharedLogPayload {
  if (!isRecord(value)) return false

  return (
    typeof value.teenName === "string" &&
    typeof value.totalHours === "number" &&
    Number.isFinite(value.totalHours) &&
    typeof value.nightHours === "number" &&
    Number.isFinite(value.nightHours) &&
    Array.isArray(value.drives) &&
    value.drives.every(isSharedDrive)
  )
}

function decodeBase64Url(input: string): string {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  return atob(padded)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString()
}

export default function ShareLogView() {
  const [data, setData] = useState<SharedLogPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rawHash = window.location.hash.slice(1)

      if (!rawHash) {
        setError("Invalid or expired share link.")
        return
      }

      const decodedHash = decodeURIComponent(rawHash)
      const json = decodeBase64Url(decodedHash)
      const parsed: unknown = JSON.parse(json)

      if (!isSharedLogPayload(parsed)) {
        setError("This share link contains invalid driving log data.")
        return
      }

      setData(parsed)
    } catch (err) {
      console.error("Invalid share link", err)
      setError("Invalid or expired share link.")
    }
  }, [])

  if (error || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center text-[#08194A] p-6">
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-lg font-semibold">
            {error ?? "Invalid or expired share link."}
          </p>
          <p className="text-sm text-gray-600">
            Make sure the link was copied correctly.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white text-[#08194A] p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">Driving Log</h1>

      <div className="rounded-xl bg-gray-100 p-4 text-center">
        <p className="text-sm font-semibold">Teen Driver</p>
        <p className="text-lg font-bold mt-1">{data.teenName}</p>

        <p className="text-sm text-gray-700 mt-3">
          Total Hours: <strong>{data.totalHours.toFixed(2)}</strong>
        </p>
        <p className="text-sm text-gray-700">
          Night Hours: <strong>{data.nightHours.toFixed(2)}</strong>
        </p>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm font-semibold mb-2">Drive History</p>

        {data.drives.length === 0 ? (
          <p className="text-sm text-gray-600">No drives were included in this shared log.</p>
        ) : (
          data.drives.map((drive) => {
            const start = formatDateTime(drive.startTime)
            const end = formatDateTime(drive.endTime)
            const duration = `${drive.durationHours.toFixed(2)} hrs`

            return (
              <div
                key={drive.id}
                className="mb-3 pb-3 border-b border-gray-200 last:border-none last:pb-0"
              >
                <p className="text-sm font-semibold">{duration}</p>
                <p className="text-xs text-gray-600">
                  {start} → {end}
                </p>
                <p className="text-xs text-gray-600">
                  Mode: {drive.isNight ? "Night" : "Day"}
                </p>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}