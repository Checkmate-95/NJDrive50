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



  const isDev = import.meta.env.DEV



  const handleDevReset = async () => {
    await devResetAll()
    setScreen("intro")
  }



  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-24 pt-4 text-[#08194A] sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="rounded-[28px] border border-[#08194A]/8 bg-white px-4 py-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => goBack()}
                className="inline-flex min-h-[44px] items-center rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
              >
                ← Back
              </button>



              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/45">
                Preferences
              </p>



              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A] sm:text-3xl">
                Settings
              </h1>



              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
                Manage reminders, exports, profile tools, DMV helpers, and
                support options for NJDrive50 in one organized place.
              </p>
            </div>



            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-1 text-xs font-semibold text-[#08194A]/65">
                Version 1.0.0
              </span>
              <span className="rounded-full border border-[#16A34A]/15 bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#166534]">
                Active
              </span>
            </div>
          </div>
        </header>



        <div className="mt-6 space-y-6">
          <section className="grid grid-cols-1 auto-rows-fr gap-6 lg:grid-cols-2">
            <SettingsCard
              eyebrow="Core"
              title="App preferences"
              description="Choose how reminders and exports behave across the app."
            >
              <div className="space-y-3">
                <ToggleRow
                  title="Notifications"
                  description="Receive reminders and helpful nudges throughout the permit journey."
                  checked={notifications}
                  onToggle={() => setNotifications(!notifications)}
                />



                <ToggleRow
                  title="Auto-export logs"
                  description="Automatically prepare your log data for quicker export workflows."
                  checked={autoExport}
                  onToggle={() => setAutoExport(!autoExport)}
                />
              </div>
            </SettingsCard>



            <SettingsCard
              eyebrow="Reminders"
              title="Reminder tools"
              description="Adjust how NJDrive50 helps you stay on track."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton
                  label="Reminder Settings"
                  tone="secondary"
                  onClick={() => setScreen("reminderSettings")}
                />
                <ActionButton
                  label="Back to Summary"
                  tone="primary"
                  onClick={() => setScreen("summary")}
                />
              </div>
            </SettingsCard>



            // AFTER
<SettingsCard
  eyebrow="Profile"
  title="Account & profile"
  description="Manage your profile details and account access."
>
  <div className="grid gap-3 sm:grid-cols-2">
    <ActionButton
      label="Manage Profile"
      tone="secondary"
      onClick={() => setScreen("manageProfile")}
    />
    <ActionButton
      label="Change Password"
      tone="secondary"
      onClick={() => setScreen("forgotPassword")}
    />
    <ActionButton
      label="Sign Out"
      tone="secondary"
    />
    <ActionButton
      label="Delete Account"
      tone="danger"
      onClick={() => setScreen("deleteAccount")}
    />
    <ActionButton
      label="Delete My Data"
      tone="danger"
      onClick={() => setScreen("deleteData")}
    />
  </div>
</SettingsCard>



            <SettingsCard
              eyebrow="DMV"
              title="DMV tools & history"
              description="Open permit rules, review your activity, and revisit onboarding tools."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton
                  label="Teen Driver Rules"
                  tone="secondary"
                  onClick={() => setScreen("teenDriverRules")}
                />
                <ActionButton
                  label="View History"
                  tone="accent"
                  onClick={() => setScreen("driveHistory")}
                />
                <ActionButton
                  label="Restart Onboarding"
                  tone="secondary"
                  onClick={() => setScreen("restartOnboarding")}
                />
              </div>
            </SettingsCard>



            <SettingsCard
              eyebrow="Support"
              title="Help & contact"
              description="Reach support and get help when you need it."
            >
              <div className="flex h-full flex-col justify-between">
                <div className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
                    Quick help
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                    Use support if you need help with reminders, progress, or
                    navigating NJDrive50 features.
                  </p>
                </div>



                <div className="mt-4">
                  <a
                    href="mailto:support@njdrive50.com"
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            </SettingsCard>



            <SettingsCard
              eyebrow="Status"
              title="App status"
              description="Quickly review the current state of your core settings."
            >
              <div className="space-y-3">
                <SidebarStat
                  label="Notifications"
                  value={notifications ? "On" : "Off"}
                  tone={notifications ? "success" : "muted"}
                />
                <SidebarStat
                  label="Auto-export"
                  value={autoExport ? "Enabled" : "Disabled"}
                  tone={autoExport ? "success" : "muted"}
                />
                <SidebarStat
                  label="App Version"
                  value="1.0.0"
                  tone="neutral"
                />
              </div>
            </SettingsCard>
          </section>



          <SettingsCard
            eyebrow="AI Assistant"
            title="NJDrive50 Q&A"
            description="Ask questions about permit rules, night hours, logs, or anything related to your driving journey."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <ActionButton
                label="Open AI Q&A"
                tone="primary"
                onClick={() => setScreen("aiHelper")}
              />
              <ActionButton
                label="FAQ Mode"
                tone="secondary"
                onClick={() => setScreen("helpFaq")}
              />
            </div>
          </SettingsCard>



          {/* ── Legal ──────────────────────────────────────────────────────── */}
          <SettingsCard
            eyebrow="Legal"
            title="Privacy & Terms"
            description="Review the privacy policy and terms of use for NJDrive50."
          >
            <div className="divide-y divide-[#08194A]/8 rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] overflow-hidden">
              <button
                type="button"
                onClick={() => setScreen("privacy")}
                className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Privacy Policy</span>
                <span className="text-[#08194A]/30 text-base">›</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen("terms")}
                className="flex min-h-[48px] w-full items-center justify-between px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Terms of Use</span>
                <span className="text-[#08194A]/30 text-base">›</span>
              </button>
            </div>
          </SettingsCard>



          {isDev && (
            <SettingsCard
              eyebrow="Internal"
              title="Reset and developer tools"
              description="Temporary builder/testing actions. Keep this section isolated at the bottom until removed from production."
              tone="danger"
            >
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
                <p className="text-sm font-bold text-red-800">
                  Internal testing only
                </p>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  These controls are only for development and testing. They should
                  stay visually separated from user-facing settings and be removed
                  from the final production version.
                </p>
              </div>



              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ActionButton
                  label="Developer Reset (Wipe All Data)"
                  tone="danger"
                  onClick={handleDevReset}
                />
              </div>
            </SettingsCard>
          )}
        </div>
      </div>
    </main>
  )
}



function SettingsCard({
  eyebrow,
  title,
  description,
  children,
  tone = "default",
}: {
  eyebrow?: string
  title: string
  description?: string
  children: React.ReactNode
  tone?: "default" | "danger"
}) {
  const cardClasses =
    tone === "danger"
      ? "h-full rounded-[28px] border border-red-200 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-6"
      : "h-full rounded-[28px] border border-[#08194A]/10 bg-white p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] sm:p-6"



  return (
    <section className={cardClasses}>
      {eyebrow ? (
        <p
          className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
            tone === "danger" ? "text-red-600/70" : "text-[#08194A]/45"
          }`}
        >
          {eyebrow}
        </p>
      ) : null}



      <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[#08194A]">
        {title}
      </h2>



      {description ? (
        <p className="mt-2 text-sm leading-6 text-[#08194A]/65">{description}</p>
      ) : null}



      <div className="mt-4">{children}</div>
    </section>
  )
}



function ActionButton({
  label,
  onClick,
  tone = "secondary",
}: {
  label: string
  onClick?: () => void
  tone?: "primary" | "secondary" | "accent" | "danger"
}) {
  const classMap = {
    primary:
      "min-h-[48px] w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E]",
    secondary:
      "min-h-[48px] w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 py-3 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]",
    accent:
      "min-h-[48px] w-full rounded-xl bg-[#f9c80e] px-4 py-3 text-sm font-extrabold text-[#08194A] transition hover:bg-[#ffd84a]",
    danger:
      "min-h-[48px] w-full rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-extrabold text-red-700 transition hover:bg-red-100",
  }



  return (
    <button type="button" onClick={onClick} className={classMap[tone]}>
      {label}
    </button>
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



function SidebarStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "success" | "muted" | "neutral"
}) {
  const toneClasses =
    tone === "success"
      ? "border-[#16A34A]/15 bg-[#ECFDF3] text-[#166534]"
      : tone === "muted"
        ? "border-[#08194A]/10 bg-[#F7F9FC] text-[#08194A]/70"
        : "border-[#f9c80e]/30 bg-[#FFF7DB] text-[#8A6500]"



  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}