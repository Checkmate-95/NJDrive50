// src/screens/ReminderLog.tsx
// TRUST-CORRECTED VERSION + INVALID DATE GUARD

import { useEffect, useState, useCallback } from "react"
import { useNav } from "../state/navStore"
import {
  loadReminderScheduleForUI,
  type ReminderScheduleEntry,
} from "../../core/ReminderEngine"

export default function ReminderLog() {
  const { goBack } = useNav()
  const [entries, setEntries] = useState<ReminderScheduleEntry[]>([])

  // Load + filter helper
  const reload = useCallback(() => {
    const all = loadReminderScheduleForUI()

    // FINAL FIX: guard against invalid dates + disabled entries
    const valid = all.filter((e) => {
      const t = e.trigger?.getTime()
      return e.enabled === true && typeof t === "number" && !isNaN(t)
    })

    setEntries(valid)
  }, [])

  useEffect(() => {
    reload()

    const onStorage = (e: StorageEvent) => {
      if (e.key === "njdrive50_reminder_schedule") reload()
    }

    const onFocus = () => reload()

    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", onFocus)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", onFocus)
    }
  }, [reload])

  const now = Date.now()
  const upcoming = entries.filter((e) => e.trigger.getTime() >= now)
  const expired = entries.filter((e) => e.trigger.getTime() < now)

  return (
    <main className="min-h-screen bg-[#F7F9FC] text-[#08194A] flex flex-col items-center p-6">
      <div className="w-full max-w-md space-y-6">

        <header className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Reminder Log</h1>
          <p className="text-sm text-[#08194A]/70 mt-1">
            See which reminders are scheduled and when they'll trigger.
          </p>
        </header>

        {/* Upcoming */}
        <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#08194A]/60 uppercase tracking-wide">
            Upcoming
          </h2>

          {upcoming.length === 0 && (
            <p className="text-sm text-[#08194A]/60">
              No upcoming reminders are currently scheduled. Turn them on in
              Reminder Settings.
            </p>
          )}

          {upcoming.map((entry) => (
            <ReminderCard
              key={`${entry.type}-${entry.trigger.toISOString()}`}
              entry={entry}
              isExpired={false}
            />
          ))}
        </section>

        {/* Expired */}
        {expired.length > 0 && (
          <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#08194A]/60 uppercase tracking-wide">
              Already Triggered
            </h2>

            {expired.map((entry) => (
              <ReminderCard
                key={`${entry.type}-${entry.trigger.toISOString()}`}
                entry={entry}
                isExpired={true}
              />
            ))}
          </section>
        )}

        <button
          onClick={() => goBack("settings")}
          className="w-full bg-[#08194A] text-white py-3 rounded-xl font-semibold hover:bg-[#0A1E5E] transition"
        >
          Back to Settings
        </button>

      </div>
    </main>
  )
}

// -------------------------------------------------------------------
// Sub-components
// -------------------------------------------------------------------

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function getUrgencyClass(trigger: Date) {
  const diffDays = (trigger.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diffDays < 3) return "bg-red-50 text-red-800 border-red-200"
  if (diffDays < 7) return "bg-yellow-50 text-yellow-800 border-yellow-200"
  return "bg-green-50 text-green-800 border-green-200"
}

function getLabel(type: ReminderScheduleEntry["type"]) {
  if (type === "weeklyHoursReminder") return "Weekly Driving Hours"
  if (type === "permitExpiryReminder") return "Permit Expiration"
  if (type === "roadTestReminder") return "Road Test Eligibility"
  return type
}

type ReminderCardProps = {
  entry: ReminderScheduleEntry
  isExpired: boolean
}

function ReminderCard({ entry, isExpired }: ReminderCardProps) {
  const colorClass = isExpired
    ? "bg-gray-100 text-gray-500 border-gray-200"
    : getUrgencyClass(entry.trigger)

  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${colorClass}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-semibold">{getLabel(entry.type)}</span>

        <div className="flex items-center gap-2">
          {isExpired && (
            <span className="text-xs font-semibold bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">
              Expired
            </span>
          )}
          <span className="text-xs opacity-80 whitespace-nowrap">
            {formatDate(entry.trigger)}
          </span>
        </div>
      </div>

      <p className="text-xs leading-snug whitespace-pre-line">
        {entry.message.trim()}
      </p>
    </div>
  )
}
