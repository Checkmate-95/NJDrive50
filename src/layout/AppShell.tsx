import { useState } from "react"

import type { PropsWithChildren } from "react"
import type { Screen } from "../App"
import FloatingAIButton from "../components/FloatingAIButton"

type AppShellProps = PropsWithChildren<{
  setScreen: (s: Screen | ((prev: Screen) => Screen)) => void
  active: Screen
  locationPermissionGranted: boolean
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
  locationPermissionGranted,
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

  // ⭐ CHROMELESS MODE
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

  // ⭐ FULL APP MODE
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

      {/* ⭐ AI Bubble */}
      {locationPermissionGranted && (
        <div className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-40">
          <div className="pointer-events-auto">
            <FloatingAIButton />
          </div>
        </div>
      )}

      {/* ⭐ More Drawer */}
      {showMore && locationPermissionGranted && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />

          <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto w-full max-w-[42rem] px-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d2260] shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
              {/* drawer content */}
            </div>
          </div>
        </>
      )}

      {/* ⭐ Bottom Nav */}
      {locationPermissionGranted && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#08194A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08194A]/88">
          <div className="mx-auto w-full max-w-[42rem] px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-3 sm:pt-3">
            <div className="grid grid-cols-5 gap-1 sm:gap-2">

              <button
                type="button"
                className={itemClasses("home")}
                onClick={() => { setScreen("home"); setShowMore(false) }}
              >
                <span className="block truncate">Home</span>
              </button>

              <button
                type="button"
                className={itemClasses("driveHistory")}
                onClick={() => { setScreen("driveHistory"); setShowMore(false) }}
              >
                <span className="block sm:hidden">Driving</span>
                <span className="block sm:hidden">Log</span>
                <span className="hidden sm:block">Driving Log</span>
              </button>

              <button
                type="button"
                className={itemClasses("activeDrive")}
                onClick={() => { setScreen("activeDrive"); setShowMore(false) }}
              >
                <span className="block sm:hidden">Start</span>
                <span className="block sm:hidden">Drive</span>
                <span className="hidden sm:block">Start Drive</span>
              </button>

              <button
                type="button"
                className={itemClasses("practiceTest")}
                onClick={() => { setScreen("practiceTest"); setShowMore(false) }}
              >
                <span className="block sm:hidden">Practice</span>
                <span className="block sm:hidden">Test</span>
                <span className="hidden sm:block">Practice Test</span>
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
