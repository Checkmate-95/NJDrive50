// src/screens/Settings.tsx
import { useNav } from "../state/navStore"
import { useSettingsStore } from "../state/settingsStore"
import { devResetAll } from "../utils/devReset"

export default function Settings() {
  const { setScreen, goBack } = useNav()

  const {
    notifications,
    autoExport,
    setNotifications,
    setAutoExport,
  } = useSettingsStore()

  const handleDevReset = async () => {
    await devResetAll()
    setScreen("intro")
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-24 pt-4 text-[#08194A] sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <button
                onClick={() => goBack()}
                className="inline-flex items-center rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
              >
                ← Back
              </button>

              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
                Preferences
              </p>

              <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                Manage notifications, export behavior, account tools, and app
                preferences for NJDrive50.
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 text-xs font-medium text-[#08194A]/60">
              <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1">
                Version 1.0.0
              </span>
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6">
            <SettingsCard
              title="Preferences"
              description="Choose how reminders and exports behave."
            >
              <ToggleRow
                title="Notifications"
                description="Receive reminders and helpful nudges throughout the permit journey."
                checked={notifications}
                onToggle={() => setNotifications(!notifications)}
              />

              <ToggleRow
                title="Auto-Export Logs"
                description="Automatically prepare your log data for quick export workflows."
                checked={autoExport}
                onToggle={() => setAutoExport(!autoExport)}
              />

              <button
                onClick={() => setScreen("reminderSettings")}
                className="mt-4 min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                Reminder Settings
              </button>
            </SettingsCard>

            <SettingsCard
              title="Account"
              description="Manage profile information and account-level actions."
            >
              <div className="space-y-3">
                <button
                  onClick={() => setScreen("manageProfile")}
                  className="min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
                >
                  Manage Profile
                </button>

                <button
                  type="button"
                  className="min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
                >
                  Sign Out
                </button>
              </div>
            </SettingsCard>

            <SettingsCard
              title="System Tools"
              description="Review rules, onboarding, and advanced tools."
            >
              <div className="space-y-3">
                <button
                  onClick={() => setScreen("teenDriverRules")}
                  className="min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
                >
                  Teen Driver Rules
                </button>

                <button
                  onClick={() => setScreen("restartOnboarding")}
                  className="min-h-[48px] w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  Reset Onboarding
                </button>

                <button
                  onClick={handleDevReset}
                  className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
                >
                  Developer Reset (Wipe All Data)
                </button>
              </div>
            </SettingsCard>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setScreen("summary")}
                className="min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E]"
              >
                Back to Summary
              </button>

              <button
                onClick={() => setScreen("driveHistory")}
                className="min-h-[48px] w-full rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-extrabold text-[#08194A] transition hover:bg-[#ffd84a]"
              >
                View History
              </button>
            </div>
          </section>

          <aside className="xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-[28px] border border-white/30 bg-white/95 px-4 py-5 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md sm:px-5">
              <div className="inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
                About NJDrive50
              </div>

              <h2 className="mt-3 text-xl font-extrabold tracking-tight">
                Built for permit progress
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                NJDrive50 helps parents and teens track supervised driving hours
                with clarity, accuracy, and DMV-ready documentation.
              </p>

              <div className="mt-5 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                  App Version
                </p>
                <p className="mt-1 text-sm font-semibold text-[#08194A]">
                  Version 1.0.0
                </p>
              </div>

              <button
                onClick={() => {
                  window.location.href = "mailto:support@njdrive50.com"
                }}
                className="mt-4 min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                Contact Support
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-[#08194A]/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-6">
      <h2 className="text-xl font-extrabold tracking-tight text-[#08194A]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[#08194A]/65">{description}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string
  description: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-4 text-left transition hover:bg-[#EEF3FA]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#08194A]">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-[#08194A]/65">
          {description}
        </span>
      </span>

      <span
        className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-[#08194A]" : "bg-[#CBD5E1]"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  )
}