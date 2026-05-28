import { useState } from "react"
import type { PropsWithChildren } from "react"
import type { Screen } from "../App"
import FloatingAIButton from "../components/FloatingAIButton"

type AppShellProps = PropsWithChildren<{
  setScreen: (s: Screen | ((prev: Screen) => Screen)) => void
  active: Screen
}>

const CHROMELESS_SCREENS: Screen[] = [
  "landing",
  "pricing",
  "intro",
  "onboarding",
  "privacy",
  "terms",
]

const MORE_SCREENS: Screen[] = [
  "milestones",
  "exportLogs",
  "paperwork",
  "teenInfo",
  "parentInfo",
  "settings",
  "aiFaq",
  "helpFaq",
  "about",
]

export default function AppShell({
  children,
  setScreen,
  active,
}: AppShellProps) {
  const [showMore, setShowMore] = useState(false)

  const chromeHidden = CHROMELESS_SCREENS.includes(active)
  const isLegal = active === "privacy" || active === "terms"
  const moreIsActive = MORE_SCREENS.includes(active)

  const itemClasses = (screen: Screen | "more") =>
    [
      "flex min-w-0 min-h-11 flex-col items-center justify-center rounded-xl px-1 py-2",
      "text-center text-[11px] font-semibold leading-tight transition-colors duration-200",
      "sm:px-2 sm:py-3 sm:text-sm",
      (screen === "more" ? moreIsActive || showMore : active === screen)
        ? "text-[#f9c80e]"
        : "text-white/88 hover:text-[#f9c80e]",
    ].join(" ")

  // CHROMELESS MODE
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

  // FULL COCKPIT MODE
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

      {/* ── AI Bubble — always behind drawer when open ── */}
      {/* ✅ z-40 so drawer/backdrop at z-50 covers it */}
      <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40">
        <div className="pointer-events-auto">
          <FloatingAIButton />
        </div>
      </div>

      {/* ── More Drawer ── */}
      {showMore && (
        <>
          {/* ✅ Backdrop z-50 — covers AI bubble */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />

          {/* ✅ Drawer panel z-50 — sits above backdrop and AI bubble */}
          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[42rem] px-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d2260] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">

              {/* Compliance & Records */}
              <div className="px-4 pt-4 pb-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Compliance & Records
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Milestones", screen: "milestones" as Screen },
                    { label: "Export Logs", screen: "exportLogs" as Screen },
                    { label: "Paperwork", screen: "paperwork" as Screen },
                  ].map(({ label, screen }) => (
                    <button
                      key={screen}
                      type="button"
                      onClick={() => { setScreen(screen); setShowMore(false) }}
                      className={`rounded-xl px-2 py-3 text-[11px] font-semibold transition ${
                        active === screen
                          ? "bg-[#f9c80e] text-[#08194A]"
                          : "bg-white/8 text-white/90 hover:bg-white/15"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mx-4 my-2 h-px bg-white/8" />

              {/* Profile & Setup */}
              <div className="px-4 py-2">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Profile & Setup
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Teen Info", screen: "teenInfo" as Screen },
                    { label: "Parent Info", screen: "parentInfo" as Screen },
                    { label: "Settings", screen: "settings" as Screen },
                  ].map(({ label, screen }) => (
                    <button
                      key={screen}
                      type="button"
                      onClick={() => { setScreen(screen); setShowMore(false) }}
                      className={`rounded-xl px-2 py-3 text-[11px] font-semibold transition ${
                        active === screen
                          ? "bg-[#f9c80e] text-[#08194A]"
                          : "bg-white/8 text-white/90 hover:bg-white/15"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mx-4 my-2 h-px bg-white/8" />

              {/* Support & Info */}
              <div className="px-4 pt-2 pb-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Support & Info
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "AI FAQ", screen: "aiFaq" as Screen },
                    { label: "Help & FAQ", screen: "helpFaq" as Screen },
                    { label: "About", screen: "about" as Screen },
                  ].map(({ label, screen }) => (
                    <button
                      key={screen}
                      type="button"
                      onClick={() => { setScreen(screen); setShowMore(false) }}
                      className={`rounded-xl px-2 py-3 text-[11px] font-semibold transition ${
                        active === screen
                          ? "bg-[#f9c80e] text-[#08194A]"
                          : "bg-white/8 text-white/90 hover:bg-white/15"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Bottom Nav — z-50 so it stays above backdrop ── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#08194A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08194A]/88">
        <div className="mx-auto w-full max-w-[42rem] px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-3 sm:pt-3">
          <div className="grid grid-cols-5 gap-1 sm:gap-2">

            <button
              type="button"
              className={itemClasses("home")}
              onClick={() => { setScreen("home"); setShowMore(false) }}
              aria-current={active === "home" ? "page" : undefined}
            >
              <span className="block truncate">Home</span>
            </button>

            <button
              type="button"
              className={itemClasses("driveHistory")}
              onClick={() => { setScreen("driveHistory"); setShowMore(false) }}
              aria-current={active === "driveHistory" ? "page" : undefined}
            >
              <span className="block sm:hidden">Driving</span>
              <span className="block sm:hidden">Log</span>
              <span className="hidden sm:block">Driving Log</span>
            </button>

            <button
              type="button"
              className={itemClasses("activeDrive")}
              onClick={() => { setScreen("activeDrive"); setShowMore(false) }}
              aria-current={active === "activeDrive" ? "page" : undefined}
            >
              <span className="block sm:hidden">Start</span>
              <span className="block sm:hidden">Drive</span>
              <span className="hidden sm:block">Start Drive</span>
            </button>

            <button
              type="button"
              className={itemClasses("practiceTest")}
              onClick={() => { setScreen("practiceTest"); setShowMore(false) }}
              aria-current={active === "practiceTest" ? "page" : undefined}
            >
              <span className="block sm:hidden">Practice</span>
              <span className="block sm:hidden">Test</span>
              <span className="hidden sm:block">Practice Test</span>
            </button>

            <button
              type="button"
              className={itemClasses("more")}
              onClick={() => setShowMore((prev) => !prev)}
              aria-expanded={showMore}
              aria-label="More options"
            >
              <span className="block truncate">More</span>
            </button>

          </div>
        </div>
      </nav>
    </div>
  )
}