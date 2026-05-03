// src/screens/ReminderSettings.tsx
import { useEffect, useMemo, useState } from "react"
import {
  loadReminderPreferences,
  saveReminderPreferences,
  scheduleReminder,
  cancelReminder,
  computeReminderTriggers,
  loadOnboardingData,
  ROAD_TEST_WARNING_MESSAGE,
} from "../../core/ReminderEngine"
import type { ReminderPreferences, ReminderType } from "../../core/ReminderEngine"
import { useNav } from "../state/navStore"

// ---------------------------------------------------------
// Preview Modal
// ---------------------------------------------------------
function PreviewModal({
  title,
  body,
  onClose,
}: {
  title: string
  body: string
  onClose: () => void
}) {
  // Escape-to-close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#08194A]/45 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl transition-all duration-200 scale-95 opacity-0 animate-[modalIn_0.2s_ease-out_forwards]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0A1E5E]/45">
              Notification Preview
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#0A1E5E]">{title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#0A1E5E]/55 transition hover:bg-[#F7F9FF] hover:text-[#0A1E5E]"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-[#0A1E5E]/10 bg-[#F7F9FF] p-4">
          <p className="text-sm leading-relaxed text-[#0A1E5E]/80 whitespace-pre-line">
            {body}
          </p>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[#0A1E5E]/55">
          This is a preview only. It does not send or schedule a real notification.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-[#0A1E5E] py-3 font-semibold text-white transition-colors hover:bg-[#08194A]"
        >
          Close Preview
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------
// Setting Item
// ---------------------------------------------------------
function SettingItem({
  title,
  description,
  timing,
  checked,
  onChange,
  onPreview,
  id,
}: {
  title: string
  description: string
  timing: string
  checked: boolean
  onChange: (checked: boolean) => void
  onPreview: () => void
  id: string
}) {
  return (
    <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F7F9FF] px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="flex-1 cursor-pointer">
          <p className="font-semibold text-[#0A1E5E]">{title}</p>
          <p className="text-sm leading-relaxed text-[#0A1E5E]/70">{description}</p>
          <p className="mt-1 text-xs font-medium text-[#0A1E5E]/55">{timing}</p>
        </label>

        <div className="relative shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="peer sr-only"
          />
          <label
            htmlFor={id}
            className="relative flex h-7 w-12 cursor-pointer items-center rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-[#0A1E5E] peer-focus-visible:ring-2 peer-focus-visible:ring-[#f9c80e] peer-focus-visible:ring-offset-2"
          >
            <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-5" />
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={checked ? onPreview : undefined}
        disabled={!checked}
        className={`mt-3 text-xs font-semibold underline underline-offset-4 transition ${
          checked
            ? "text-[#0A1E5E]/75 decoration-[#0A1E5E]/30 hover:text-[#08194A]"
            : "text-[#0A1E5E]/30 decoration-transparent opacity-40 pointer-events-none"
        }`}
      >
        Preview notification
      </button>
    </div>
  )
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function formatLastSaved(timestamp: number | null) {
  if (!timestamp) return "Changes save automatically."

  const diffMs = Date.now() - timestamp
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000))

  if (diffSeconds < 5) return "Saved just now."
  if (diffSeconds < 60) return `Saved ${diffSeconds} seconds ago.`

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes === 1) return "Saved 1 minute ago."
  if (diffMinutes < 60) return `Saved ${diffMinutes} minutes ago.`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours === 1) return "Saved 1 hour ago."
  if (diffHours < 24) return `Saved ${diffHours} hours ago.`

  return `Saved on ${new Date(timestamp).toLocaleDateString()}.`
}

// ---------------------------------------------------------
// Reminder Metadata
// ---------------------------------------------------------
const defaultPrefs: ReminderPreferences = {
  weeklyHoursReminder: true,
  permitExpiryReminder: true,
  roadTestReminder: true,
}

const reminderContent: Record<
  ReminderType,
  {
    id: string
    title: string
    description: string
    timing: string
    message: string
    previewTitle: string
    previewBody: string
  }
> = {
  weeklyHoursReminder: {
    id: "weekly-hours-reminder",
    title: "Weekly Driving Hours",
    description: "Get a weekly summary of logged hours.",
    timing: "Sends on your scheduled weekly reminder time.",
    message: "Weekly reminder: Log your supervised driving hours in NJDrive50.",
    previewTitle: "Weekly Driving Hours",
    previewBody: "Weekly reminder: Log your supervised driving hours in NJDrive50.",
  },
  permitExpiryReminder: {
    id: "permit-expiry-reminder",
    title: "Permit Expiration",
    description: "Get notified before the permit expires.",
    timing: "Sends 30 days before the permit expiration date.",
    message:
      "Your permit expires in 30 days. Make sure all requirements are complete.",
    previewTitle: "Permit Expiration Reminder",
    previewBody:
      "Your permit expires in 30 days. Make sure all requirements are complete.",
  },
  roadTestReminder: {
    id: "road-test-reminder",
    title: "Road Test Eligibility",
    description: "Get notified when the teen is eligible for the road test.",
    timing: "Sends when NJ road test eligibility is reached.",
    message: ROAD_TEST_WARNING_MESSAGE,
    previewTitle: "Road Test Eligibility",
    previewBody: ROAD_TEST_WARNING_MESSAGE,
  },
}

// ---------------------------------------------------------
// Main Component
// ---------------------------------------------------------
export default function ReminderSettings() {
  const { setScreen, goBack } = useNav()

  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    loadReminderPreferences()
  )
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [flash, setFlash] = useState<{ type: "saved" | "restored" | null; message: string }>({
    type: null,
    message: "Changes save automatically.",
  })
  const [previewKey, setPreviewKey] = useState<ReminderType | null>(null)

  // Flash timeout
  useEffect(() => {
    if (!flash.type) return

    const timer = window.setTimeout(() => {
      setFlash({
        type: null,
        message: formatLastSaved(lastSavedAt),
      })
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [flash.type, lastSavedAt])

  const lastSavedText = useMemo(() => {
    if (flash.type) return flash.message
    return formatLastSaved(lastSavedAt)
  }, [flash, lastSavedAt])

  function markSaved(message = "Saved just now.") {
    const now = Date.now()
    setLastSavedAt(now)
    setFlash({
      type: "saved",
      message,
    })
  }

  // Update preference
  function updatePref(key: ReminderType, value: boolean) {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    saveReminderPreferences(updated)
    markSaved()

    if (value) {
      const onboarding = loadOnboardingData()
      if (!onboarding) return

      const triggers = computeReminderTriggers(onboarding, updated)
      const trigger = triggers[key]
      if (trigger) {
        scheduleReminder(key, trigger, reminderContent[key].message)
      }
    } else {
      cancelReminder(key)
    }
  }

  // Restore defaults
  function restoreDefaults() {
    setPrefs(defaultPrefs)
    saveReminderPreferences(defaultPrefs)

    const onboarding = loadOnboardingData()

    ;(Object.keys(defaultPrefs) as ReminderType[]).forEach((key) => {
      cancelReminder(key)

      if (!onboarding) return
      if (!defaultPrefs[key]) return

      const triggers = computeReminderTriggers(onboarding, defaultPrefs)
      const trigger = triggers[key]

      if (trigger) {
        scheduleReminder(key, trigger, reminderContent[key].message)
      }
    })

    const now = Date.now()
    setLastSavedAt(now)
    setFlash({
      type: "restored",
      message: "Defaults restored.",
    })
  }

  const previewItem = previewKey ? reminderContent[previewKey] : null

  return (
    <>
      <div className="flex flex-col items-center space-y-6 pt-6 pb-6">
        <div className="w-full text-center">
          <h1 className="text-2xl font-bold text-white">Reminder Settings</h1>
          <p className="mt-2 text-sm text-white/75">
            Choose which helpful driving reminders you want to receive.
          </p>
        </div>

        <section className="w-full max-w-md rounded-[28px] border border-white/10 bg-white p-6 shadow-xl md:p-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#0A1E5E]">Reminder Types</h2>
            <p className="mt-1 text-sm text-[#0A1E5E]/65">
              Your changes save automatically as soon as you toggle a setting.
            </p>
          </div>

          <div className="space-y-4">
            {(Object.keys(reminderContent) as ReminderType[]).map((key) => {
              const item = reminderContent[key]

              return (
                <SettingItem
                  key={key}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  timing={item.timing}
                  checked={prefs[key]}
                  onChange={(checked) => updatePref(key, checked)}
                  onPreview={() => setPreviewKey(key)}
                />
              )
            })}
          </div>

          <div className="h-px w-full bg-[#0A1E5E]/10 my-4" />

          <div className="rounded-2xl bg-[#F7F9FC] px-4 py-3 space-y-1">
            <h3 className="text-sm font-bold text-[#0A1E5E]">System Status</h3>

            <div className="flex items-center justify-between gap-3">
              <p
                className={`text-sm transition-colors ${
                  flash.type ? "font-semibold text-[#0A1E5E]" : "text-[#0A1E5E]/65"
                }`}
              >
                {lastSavedText}
              </p>

              <button
                type="button"
                onClick={restoreDefaults}
                className="shrink-0 text-sm font-semibold text-[#0A1E5E] underline decoration-[#0A1E5E]/30 underline-offset-4 transition hover:text-[#08194A]"
              >
                Restore defaults
              </button>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-lg border border-[#08194A]/20 bg-[#F7F9FC] py-3 font-semibold text-[#08194A] transition hover:bg-[#f9c80e]/10"
            onClick={() => setScreen("reminderLog")}
          >
            View Reminder Log
          </button>

          <p className="mt-2 text-center text-xs leading-relaxed text-[#0A1E5E]/55">
            Review recent reminder activity and confirm which notifications have been logged.
          </p>

          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-[#0A1E5E] py-3 font-semibold text-white transition-colors hover:bg-[#08194A]"
            onClick={() => goBack()}
          >
            Back
          </button>
        </section>
      </div>

      {previewItem && (
        <PreviewModal
          title={previewItem.previewTitle}
          body={previewItem.previewBody}
          onClose={() => setPreviewKey(null)}
        />
      )}
    </>
  )
}
