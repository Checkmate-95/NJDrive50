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
    <main className="min-h-screen bg-[#F7F9FC] text-[#08194A] flex flex-col items-center p-6 relative">
      {/* Close Button */}
      <button
        onClick={() => goBack()}
        className="absolute top-4 right-4 text-[#08194A] text-3xl font-bold hover:text-[#f9c80e] transition"
        aria-label="Close Settings"
      >
        ×
      </button>

      {/* Header */}
      <h1 className="text-3xl font-extrabold mt-10 tracking-tight">Settings</h1>
      <p className="text-sm text-[#08194A]/70 mt-1 mb-6">
        Manage your NJDrive50 preferences
      </p>

      <div className="w-full max-w-md space-y-6">
        {/* Preferences */}
        <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-lg font-bold mb-4">Preferences</h2>

          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Notifications</span>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="w-5 h-5 accent-[#08194A]"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="font-medium">Auto‑Export Logs</span>
            <input
              type="checkbox"
              checked={autoExport}
              onChange={() => setAutoExport(!autoExport)}
              className="w-5 h-5 accent-[#08194A]"
            />
          </div>

          <button
            onClick={() => setScreen("reminderSettings")}
            className="mt-4 w-full bg-[#F7F9FC] border border-[#08194A]/20 text-[#08194A] py-3 rounded-xl font-semibold hover:bg-[#f9c80e]/10 transition"
          >
            Reminder Settings
          </button>
        </section>

        {/* Account */}
        <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-lg font-bold mb-4">Account</h2>

          <button
            onClick={() => setScreen("onboarding")}
            className="w-full bg-[#F7F9FC] text-[#08194A] py-3 rounded-xl font-semibold border border-[#08194A]/15 hover:bg-[#f9c80e]/10 transition"
          >
            Manage Profile
          </button>

          <button
            className="w-full bg-[#F7F9FC] text-[#08194A] py-3 rounded-xl font-semibold border border-[#08194A]/15 mt-3 hover:bg-[#f9c80e]/10 transition"
          >
            Sign Out
          </button>
        </section>

        {/* System Tools */}
        <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-lg font-bold mb-4">System Tools</h2>

          <button
            onClick={() => setScreen("teenDriverRules")}
            className="w-full bg-[#F7F9FC] text-[#08194A] py-3 rounded-xl font-semibold border border-[#08194A]/15 hover:bg-[#f9c80e]/10 transition"
          >
            Teen Driver Rules
          </button>

          <button
            onClick={() => setScreen("restartOnboarding")}
            className="w-full bg-red-50 text-red-700 py-3 rounded-xl font-semibold border border-red-300 mt-3 hover:bg-red-100 transition"
          >
            Reset Onboarding
          </button>

          {/* Developer Reset */}
          <button
            onClick={handleDevReset}
            className="w-full bg-[#08194A] text-white py-3 rounded-xl font-semibold mt-4 hover:bg-[#0A1E5E] transition shadow-lg"
          >
            Developer Reset (Wipe All Data)
          </button>
        </section>

        {/* About */}
        <section className="rounded-2xl border border-[#08194A]/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] p-5">
          <h2 className="text-lg font-bold mb-2">About</h2>
          <p className="text-sm text-[#08194A]/70 leading-snug">
            NJDrive50 helps parents and teens track supervised driving hours
            with clarity, accuracy, and DMV‑ready documentation.
          </p>

          <p className="mt-3 text-xs text-[#08194A]/50">Version 1.0.0</p>

          <button
            onClick={() => {
              window.location.href = "mailto:support@njdrive50.com"
            }}
            className="mt-4 w-full bg-[#F7F9FC] text-[#08194A] py-3 rounded-xl font-semibold border border-[#08194A]/15 hover:bg-[#f9c80e]/10 transition"
          >
            Contact Support
          </button>
        </section>

        {/* Footer Navigation */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={() => setScreen("summary")}
            className="flex-1 bg-[#08194A] text-white py-3 rounded-xl font-semibold hover:bg-[#0A1E5E] transition"
          >
            Back to Summary
          </button>

          <button
            onClick={() => setScreen("driveHistory")}
            className="flex-1 bg-[#f9c80e] text-[#08194A] py-3 rounded-xl font-semibold hover:bg-[#ffd84a] transition"
          >
            View History
          </button>
        </div>
      </div>
    </main>
  )
}
