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

type ShareLogState = {
  data: SharedLogPayload | null
  error: string | null
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
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Invalid date"
  return date.toLocaleString()
}

function parseSharedLogFromHash(): ShareLogState {
  try {
    const rawHash = window.location.hash.slice(1)

    if (!rawHash) {
      return {
        data: null,
        error: "Invalid or expired share link.",
      }
    }

    const decodedHash = decodeURIComponent(rawHash)
    const json = decodeBase64Url(decodedHash)
    const parsed: unknown = JSON.parse(json)

    if (!isSharedLogPayload(parsed)) {
      return {
        data: null,
        error: "This share link contains invalid driving log data.",
      }
    }

    return {
      data: parsed,
      error: null,
    }
  } catch (err) {
    console.error("Invalid share link", err)
    return {
      data: null,
      error: "Invalid or expired share link.",
    }
  }
}

export default function ShareLogView() {
  const [{ data, error }] = useState<ShareLogState>(() => parseSharedLogFromHash())

  useEffect(() => {
    if (!data) return

    window.history.replaceState(
      null,
      document.title,
      window.location.pathname + window.location.search
    )
  }, [data])

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 text-[#08194A]">
        <div className="max-w-sm space-y-2 text-center">
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
    <main className="min-h-screen space-y-6 bg-white p-6 text-[#08194A]">
      <h1 className="text-center text-3xl font-bold">Driving Log</h1>

      <div className="rounded-xl bg-gray-100 p-4 text-center">
        <p className="text-sm font-semibold">Teen Driver</p>
        <p className="mt-1 text-lg font-bold">{data.teenName}</p>

        <p className="mt-3 text-sm text-gray-700">
          Total Hours: <strong>{data.totalHours.toFixed(2)}</strong>
        </p>
        <p className="text-sm text-gray-700">
          Night Hours: <strong>{data.nightHours.toFixed(2)}</strong>
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-sm font-semibold">Drive History</p>

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
                className="mb-3 border-b border-gray-200 pb-3 last:border-none last:pb-0"
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