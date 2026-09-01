// src/screens/Settings.tsx
import { useState, type ReactNode } from "react"
import { useNav } from "../state/navStore"
import { useSettingsStore } from "../state/settingsStore"
import { devResetAll } from "../utils/devReset"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"

export default function Settings() {
  const { setScreen, goBack } = useNav()

  const {
    notifications,
    autoExport,
    setNotifications,
    setAutoExport,
  } = useSettingsStore()

  const isDev = import.meta.env.DEV

  const [signOutError, setSignOutError] = useState("")
  const [signingOut, setSigningOut] = useState(false)

  const handleDevReset = async () => {
    await devResetAll()
    setScreen("login")
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSignOutError("")
    setSigningOut(true)
    try {
      await signOut(auth)
    } catch (err) {
      console.error("Sign out failed:", err)
      setSignOutError("Could not sign out. Please check your connection and try again.")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-20 pt-3 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">
        <header className="rounded-2xl border border-[#08194A]/8 bg-white px-4 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => goBack()}
            className="mb-3 inline-flex h-9 w-full items-center justify-center rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/70 transition hover:bg-[#EEF3FA]"
          >
            ← Back
          </button>

          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#08194A]/40">
              Preferences
            </p>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-2 py-0.5 text-[10px] font-semibold text-[#08194A]/55">
                v1.0.0
              </span>
              <span className="rounded-full border border-[#16A34A]/15 bg-[#ECFDF3] px-2 py-0.5 text-[10px] font-semibold text-[#166534]">
                Active
              </span>
            </div>
          </div>

          <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#08194A]">
            Settings
          </h1>
        </header>

        <div className="mt-3 space-y-3">
          <CompactCard eyebrow="Core" title="App Preferences">
            <ToggleRow
              title="Notifications"
              description="Reminders and nudges during your permit journey."
              checked={notifications}
              onToggle={() => setNotifications(!notifications)}
            />
            <ToggleRow
              title="Auto-export logs"
              description="Prepare log data automatically for quicker exports."
              checked={autoExport}
              onToggle={() => setAutoExport(!autoExport)}
            />
          </CompactCard>

          <CompactCard eyebrow="Status" title="App Status">
            <div className="grid grid-cols-3 gap-2">
              <SidebarStat
                label="Notifs"
                value={notifications ? "On" : "Off"}
                tone={notifications ? "success" : "muted"}
              />
              <SidebarStat
                label="Export"
                value={autoExport ? "On" : "Off"}
                tone={autoExport ? "success" : "muted"}
              />
              <SidebarStat
                label="Ver"
                value="1.0.0"
                tone="neutral"
              />
            </div>
          </CompactCard>

          <CompactCard eyebrow="Reminders" title="Reminder Tools">
            <div className="flex flex-col gap-2">
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
          </CompactCard>

          <CompactCard eyebrow="Profile" title="Account & Profile">
            <div className="flex flex-col gap-2">
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
                label={signingOut ? "Signing Out..." : "Sign Out"}
                tone="secondary"
                onClick={handleSignOut}
              />
              {signOutError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {signOutError}
                </div>
              )}
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
          </CompactCard>

          <CompactCard eyebrow="DMV" title="DMV Tools & History">
            <div className="flex flex-col gap-2">
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
          </CompactCard>

          <CompactCard eyebrow="AI Assistant" title="NJDrive50 Q&A">
            <div className="flex flex-col gap-2">
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
          </CompactCard>

          <CompactCard eyebrow="Support" title="Help & Contact">
            <a
              href="mailto:support@njdrive50.com"
              className="flex h-11 w-full items-center justify-center rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
            >
              support@njdrive50.com
            </a>
          </CompactCard>

          <CompactCard eyebrow="Legal" title="Privacy & Terms">
            <div className="divide-y divide-[#08194A]/8 overflow-hidden rounded-xl border border-[#08194A]/10 bg-[#F7F9FC]">
              <button
                type="button"
                onClick={() => setScreen("privacy")}
                className="flex h-11 w-full items-center justify-between px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Privacy Policy</span>
                <span className="text-[#08194A]/30">›</span>
              </button>
              <button
                type="button"
                onClick={() => setScreen("terms")}
                className="flex h-11 w-full items-center justify-between px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
              >
                <span>Terms of Use</span>
                <span className="text-[#08194A]/30">›</span>
              </button>
            </div>
          </CompactCard>

          {isDev && (
            <CompactCard eyebrow="Internal" title="Developer Tools" tone="danger">
              <div className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-xs font-bold text-red-800">
                  Internal testing only
                </p>
                <p className="mt-0.5 text-xs text-red-700">
                  Remove before production release.
                </p>
              </div>
              <ActionButton
                label="Dev Reset — Wipe All Data"
                tone="danger"
                onClick={handleDevReset}
              />
            </CompactCard>
          )}
        </div>
      </div>
    </main>
  )
}

function CompactCard({
  eyebrow,
  title,
  children,
  tone = "default",
}: {
  eyebrow?: string
  title: string
  children: ReactNode
  tone?: "default" | "danger"
}) {
  return (
    <section
      className={`rounded-2xl border bg-white px-4 py-3 shadow-sm ${
        tone === "danger" ? "border-red-200" : "border-[#08194A]/10"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-2">
        {eyebrow && (
          <span
            className={`text-[10px] font-bold uppercase tracking-[0.16em] ${
              tone === "danger" ? "text-red-500" : "text-[#08194A]/40"
            }`}
          >
            {eyebrow}
          </span>
        )}
        <span className="text-[10px] text-[#08194A]/20">·</span>
        <h2 className="text-sm font-extrabold tracking-tight text-[#08194A]">
          {title}
        </h2>
      </div>
      <div className="space-y-2">{children}</div>
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
      "h-11 w-full rounded-xl bg-[#08194A] px-4 text-sm font-extrabold text-white transition hover:bg-[#0A1E5E]",
    secondary:
      "h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 text-sm font-bold text-[#08194A] transition hover:bg-[#EEF3FA]",
    accent:
      "h-11 w-full rounded-xl bg-[#f9c80e] px-4 text-sm font-extrabold text-[#08194A] transition hover:bg-[#ffd84a]",
    danger:
      "h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-extrabold text-red-700 transition hover:bg-red-100",
  } as const

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
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 py-2.5 text-left transition hover:bg-[#EEF3FA]"
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[#08194A]">{title}</span>
        <span className="block text-xs leading-5 text-[#08194A]/55">
          {description}
        </span>
      </span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#08194A]" : "bg-[#CBD5E1]"
        }`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
            checked ? "left-5" : "left-0.5"
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
        ? "border-[#08194A]/10 bg-[#F7F9FC] text-[#08194A]/60"
        : "border-[#f9c80e]/30 bg-[#FFF7DB] text-[#8A6500]"

  return (
    <div className={`rounded-xl border px-2 py-2 text-center ${toneClasses}`}>
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  )
}