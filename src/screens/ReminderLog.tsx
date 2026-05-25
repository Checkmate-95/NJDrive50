import { useEffect, useState, useCallback, useMemo } from "react"
import { useNav } from "../state/navStore"
import {
  loadReminderScheduleForUI,
  type ReminderScheduleEntry,
} from "../../core/ReminderEngine"

const REMINDER_SCHEDULE_STORAGE_KEY = "njdrive50_reminder_schedule"
const REMINDER_SCHEDULE_EVENT = "njdrive50-reminder-schedule-change"

export default function ReminderLog() {
  const { goBack } = useNav()
  const [entries, setEntries] = useState<ReminderScheduleEntry[]>([])

  const reload = useCallback(() => {
    const all = loadReminderScheduleForUI()

    const valid = all
      .filter((e) => {
        const timestamp = e.trigger?.getTime()
        return e.enabled === true && typeof timestamp === "number" && !Number.isNaN(timestamp)
      })
      .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())

    setEntries(valid)
  }, [])

  useEffect(() => {
    reload()

    const onStorageChange = (e: StorageEvent) => {
      if (e.key === REMINDER_SCHEDULE_STORAGE_KEY) {
        reload()
      }
    }

    const onFocus = () => {
      reload()
    }

    const onVisibilityChange = () => {
      if (!document.hidden) {
        reload()
      }
    }

    const onScheduleChange = () => {
      reload()
    }

    window.addEventListener("storage", onStorageChange)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener(REMINDER_SCHEDULE_EVENT, onScheduleChange)

    const intervalId = window.setInterval(() => {
      reload()
    }, 45000)

    return () => {
      window.removeEventListener("storage", onStorageChange)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener(REMINDER_SCHEDULE_EVENT, onScheduleChange)
      window.clearInterval(intervalId)
    }
  }, [reload])

  const { upcoming, expired } = useMemo(() => {
    const now = Date.now()

    const upcomingList = entries.filter((e) => e.trigger.getTime() >= now)
    const expiredList = entries
      .filter((e) => e.trigger.getTime() < now)
      .sort((a, b) => b.trigger.getTime() - a.trigger.getTime())

    return {
      upcoming: upcomingList,
      expired: expiredList,
    }
  }, [entries])

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#F7F9FC] p-6 text-[#08194A]">
      <div className="w-full max-w-md space-y-6">
        <header className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight">Reminder Log</h1>
          <p className="mt-1 text-sm text-[#08194A]/70">
            See which reminders are scheduled and when they&apos;ll trigger.
          </p>
        </header>

        <section className="space-y-3 rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#08194A]/60">
            Upcoming
          </h2>

          {upcoming.length === 0 && (
            <p className="text-sm text-[#08194A]/60">
              No upcoming reminders are currently scheduled. Turn them on in Reminder
              Settings.
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

        {expired.length > 0 && (
          <section className="space-y-3 rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#08194A]/60">
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
          type="button"
          onClick={() => goBack("settings")}
          className="w-full rounded-xl bg-[#08194A] py-3 font-semibold text-white transition hover:bg-[#0A1E5E]"
        >
          Back to Settings
        </button>
      </div>
    </main>
  )
}

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

  if (diffDays < 3) return "border-red-200 bg-red-50 text-red-800"
  if (diffDays < 7) return "border-yellow-200 bg-yellow-50 text-yellow-800"
  return "border-green-200 bg-green-50 text-green-800"
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
    ? "border-gray-200 bg-gray-100 text-gray-500"
    : getUrgencyClass(entry.trigger)

  const message = entry.message?.trim() || "No reminder message available."

  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-4 py-3 ${colorClass}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{getLabel(entry.type)}</span>

        <div className="flex items-center gap-2">
          {isExpired && (
            <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs font-semibold text-gray-600">
              Expired
            </span>
          )}
          <span className="whitespace-nowrap text-xs opacity-80">
            {formatDate(entry.trigger)}
          </span>
        </div>
      </div>

      <p className="whitespace-pre-line text-xs leading-snug">{message}</p>
    </div>
  )
}