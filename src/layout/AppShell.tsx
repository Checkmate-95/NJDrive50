import { useState } from "react"
import type { PropsWithChildren } from "react"
import type { User } from "firebase/auth"
import type { Screen } from "../App"
import FloatingAIButton from "../components/FloatingAIButton"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"

type AppShellProps = PropsWithChildren<{
  user: User | null
  setScreen: (s: Screen | ((prev: Screen) => Screen)) => void
  active: Screen
  locationPermissionGranted: boolean
}>

const CHROMELESS_SCREENS: Screen[] = [
  "landing",
  "landingApp",
  "pricing",
  "intro",
  "onboarding",
  "privacy",
  "terms",
  "login",
  "register",
  "forgotPassword",
]

const MORE_SCREENS: Screen[] = [
  "milestones",
  "exportLogs",
  "paperwork",
  "teenInfo",
  "parentInfo",
  "settings",
  "aiFaq",
  "aiHelper",
  "helpFaq",
  "about",
  "share",
  "dmv",
  "reminderSettings",
]

type DrawerItem = { label: string; screen: Screen }
type DrawerSection = { title: string; items: DrawerItem[] }

const DRAWER_SECTIONS: DrawerSection[] = [
  {
    title: "👤 Profile",
    items: [
      { label: "Teen Info", screen: "teenInfo" },
      { label: "Parent Info", screen: "parentInfo" },
    ],
  },
  {
    title: "📊 Progress & Logs",
    items: [
      { label: "Milestones", screen: "milestones" },
      { label: "Export Logs", screen: "exportLogs" },
      { label: "Share Log", screen: "share" },
    ],
  },
  {
    title: "📋 DMV & Paperwork",
    items: [
      { label: "Paperwork", screen: "paperwork" },
      { label: "DMV Bundle", screen: "dmv" },
    ],
  },
  {
    title: "❓ Help & Support",
    items: [
      { label: "Help & FAQ", screen: "helpFaq" },
      { label: "AI Assistant", screen: "aiHelper" },
    ],
  },
  {
    title: "⚙️ Settings",
    items: [
      { label: "Settings", screen: "settings" },
      { label: "Reminders", screen: "reminderSettings" },
      { label: "About", screen: "about" },
    ],
  },
]

export default function AppShell({
  children,
  user: _user,
  setScreen,
  active,
  locationPermissionGranted,
}: AppShellProps) {
  const [showMore, setShowMore] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  const chromeHidden = CHROMELESS_SCREENS.includes(active)
  const isLegal = active === "privacy" || active === "terms"
  const moreIsActive = MORE_SCREENS.includes(active)
  const shouldShowFloatingUi = locationPermissionGranted && !chromeHidden

  const go = (screen: Screen) => {
    setScreen(screen)
    setShowMore(false)
  }

  const handleLogout = async () => {
    setLogoutError(null)
    try {
      await signOut(auth)
      setShowMore(false)
      setScreen("login")
    } catch (error) {
      console.error("Logout failed:", error)
      setLogoutError("Logout failed. Please try again.")
    }
  }

  const itemClasses = (screen: Screen | "more") =>
    [
      "flex min-w-0 min-h-11 flex-col items-center justify-center self-stretch rounded-xl px-1 py-2",
      "text-center text-[11px] font-semibold leading-tight transition-colors duration-200",
      "sm:px-2 sm:py-3 sm:text-sm",
      (screen === "more" ? moreIsActive || showMore : active === screen)
        ? "text-[#f9c80e]"
        : "text-white/88 hover:text-[#f9c80e]",
    ].join(" ")

  // ─── Chromeless Mode ──────────────────────────────────────────────────────
  if (chromeHidden) {
    return (
      <div
        className={
          isLegal
            ? "relative min-h-dvh w-full overflow-x-hidden bg-white text-[#08194A]"
            : "relative min-h-dvh w-full overflow-x-hidden bg-[#08194A]"
        }
      >
        {children}
      </div>
    )
  }

  // ─── Full App Mode ────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-[#08194A]">
      <header className="w-full shrink-0 bg-[#08194A] px-4 pb-3 pt-5 sm:pb-4 sm:pt-6">
        <div className="mx-auto flex w-full max-w-[42rem] justify-center">
          <img
            src="/NJDrive50.png"
            alt="NJ Drive 50 Logo"
            className="h-[88px] w-auto sm:h-[120px]"
          />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 justify-center px-3 sm:px-4">
        <section className="min-h-0 w-full max-w-[42rem] overflow-y-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
          {children}
        </section>
      </main>

      {shouldShowFloatingUi && (
        <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40">
          <div className="pointer-events-auto">
            <FloatingAIButton />
          </div>
        </div>
      )}

      {showMore && shouldShowFloatingUi && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />

          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[42rem] px-3">
            <div className="max-h-[70dvh] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#0d2260] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
              <div className="flex justify-center pb-1 pt-3">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>

              <div className="absolute right-5 top-3 z-50">
                <button
                  type="button"
                  onClick={() => setShowMore(false)}
                  className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 active:bg-white/30"
                  aria-label="Close drawer"
                >
                  ✕
                </button>
              </div>

              <div className="px-3 pb-4 pt-2">
                {DRAWER_SECTIONS.map((section, si) => (
                  <div key={section.title} className={si > 0 ? "mt-4" : ""}>
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                      {section.title}
                    </p>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {section.items.map((item) => {
                        const isActive = active === item.screen
                        return (
                          <button
                            key={item.screen}
                            type="button"
                            onClick={() => go(item.screen)}
                            className={[
                              "min-h-[44px] rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition-colors duration-150",
                              isActive
                                ? "bg-[#f9c80e] text-[#08194A]"
                                : "bg-white/8 text-white/90 hover:bg-white/14 active:bg-white/20",
                            ].join(" ")}
                          >
                            {item.label}
                          </button>
                        )
                      })}
                    </div>

                    {section.title === "⚙️ Settings" && (
                      <>
                        <div className="mt-3 h-px bg-white/10" />
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="col-span-2 min-h-[44px] rounded-xl bg-red-500/15 px-3 py-2.5 text-left text-[13px] font-semibold text-red-400 transition-colors duration-150 hover:bg-red-500/25 active:bg-red-500/35 sm:col-span-3"
                          >
                            🚪 Log Out
                          </button>
                          {logoutError && (
                            <p className="col-span-2 px-1 text-[11px] text-red-400 sm:col-span-3">
                              {logoutError}
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {si < DRAWER_SECTIONS.length - 1 && (
                      <div className="mt-4 h-px bg-white/8" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {shouldShowFloatingUi && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#08194A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08194A]/88">
          <div className="mx-auto w-full max-w-[42rem] px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 sm:px-3 sm:pt-3">
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
              <button
  type="button"
  className={itemClasses("home")}
  onClick={() => go("home")}
>
  <span className="block truncate">Home</span>
</button>

<button
  type="button"
  className={itemClasses("driveHistory")}
  onClick={() => go("driveHistory")}
>
  <span className="block truncate sm:hidden">Logs</span>
  <span className="hidden truncate sm:block">Logs</span>
</button>

<button
  type="button"
  className={itemClasses("activeDrive")}
  onClick={() => go("activeDrive")}
>
  <span className="block truncate sm:hidden">Drive</span>
  <span className="hidden truncate sm:block">Start Drive</span>
</button>

<button
  type="button"
  className={itemClasses("practiceTest")}
  onClick={() => go("practiceTest")}
>
  <span className="block truncate sm:hidden">Test</span>
  <span className="hidden truncate sm:block">Practice Test</span>
</button>

<button
  type="button"
  className={itemClasses("more")}
  onClick={() => setShowMore((prev) => !prev)}
>
  <span className="block truncate">More</span>
</button>
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}