// src/layout/AppShell.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  React default import removed — project uses React 17+ JSX transform
//          (react-jsx), the manual import is unused and raises TS6133
// [FIX-2]  setScreen typed as (s: Screen | ((prev: Screen) => Screen)) => void
//          instead of React.Dispatch<React.SetStateAction<Screen>> — matches
//          the setScreenCompat wrapper in App.tsx accurately
// [FIX-3]  FloatingAIButton call site updated — setScreen and active props
//          removed now that FloatingAIButton uses useNav() internally

import type { PropsWithChildren } from "react"
import type { Screen } from "../App"
import FloatingAIButton from "../components/FloatingAIButton"

// [FIX-2] Accurate prop type — matches setScreenCompat signature in App.tsx
type AppShellProps = PropsWithChildren<{
  setScreen: (s: Screen | ((prev: Screen) => Screen)) => void
  active: Screen
}>

export default function AppShell({
  children,
  setScreen,
  active,
}: AppShellProps) {
  const navHidden = active === "onboarding"

  const itemClasses = (screen: Screen) =>
    [
      "flex min-w-0 flex-col items-center justify-center rounded-xl px-1 py-2",
      "text-center text-[11px] font-semibold leading-tight transition-colors duration-200",
      "sm:px-2 sm:py-3 sm:text-sm",
      active === screen ? "text-[#f9c80e]" : "text-white/88 hover:text-[#f9c80e]",
    ].join(" ")

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#08194A]">

      {/* Header */}
      <header className="w-full shrink-0 bg-[#08194A] px-4 pt-5 pb-3 sm:pt-6 sm:pb-4">
        <div className="mx-auto flex w-full max-w-[42rem] justify-center">
          <img
            src="/NJDrive50.png"
            alt="NJ Drive 50 Logo"
            className="h-[88px] w-auto sm:h-[120px]"
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 justify-center px-3 pb-4 sm:px-4">
        <section className="w-full max-w-[42rem] min-w-0 overflow-y-auto">
          {children}
        </section>
      </main>

      {/* Bottom navigation */}
      {!navHidden && (
        <nav className="sticky bottom-0 z-20 w-full shrink-0 border-t border-white/10 bg-[#08194A]/95 backdrop-blur supports-[backdrop-filter]:bg-[#08194A]/88">
          <div className="mx-auto w-full max-w-[42rem] px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-3 sm:pt-3">
            <div className="grid grid-cols-5 gap-1 sm:gap-2">

              <button
                type="button"
                className={itemClasses("home")}
                onClick={() => setScreen("home")}
                aria-current={active === "home" ? "page" : undefined}
              >
                <span className="block truncate">Home</span>
              </button>

              <button
  type="button"
  className={itemClasses("driveHistory")}
  onClick={() => setScreen("driveHistory")}
  aria-current={active === "driveHistory" ? "page" : undefined}
              >
                <span className="block sm:hidden">Driving</span>
                <span className="block sm:hidden">Log</span>
                <span className="hidden sm:block">Driving Log</span>
              </button>

              <button
                type="button"
                className={itemClasses("practiceTest")}
                onClick={() => setScreen("practiceTest")}
                aria-current={active === "practiceTest" ? "page" : undefined}
              >
                <span className="block sm:hidden">Practice</span>
                <span className="block sm:hidden">Test</span>
                <span className="hidden sm:block">Practice Test</span>
              </button>

              <button
                type="button"
                className={itemClasses("settings")}
                onClick={() => setScreen("settings")}
                aria-current={active === "settings" ? "page" : undefined}
              >
                <span className="block truncate">Settings</span>
              </button>

              <button
                type="button"
                className={itemClasses("helpFaq")}
                onClick={() => setScreen("helpFaq")}
                aria-current={active === "helpFaq" ? "page" : undefined}
              >
                <span className="block sm:hidden">Help</span>
                <span className="block sm:hidden">FAQ</span>
                <span className="hidden sm:block">Help FAQ</span>
              </button>

            </div>
          </div>
        </nav>
      )}

      {/* [FIX-3] FloatingAIButton — fully self-contained via useNav() now.
          No setScreen or active props needed. */}
      <div
        className={`pointer-events-none fixed right-4 z-30 sm:right-6 ${
          navHidden
            ? "bottom-[max(1rem,env(safe-area-inset-bottom))]"
            : "bottom-[calc(6.5rem+env(safe-area-inset-bottom))] sm:bottom-[calc(7.25rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <div className="pointer-events-auto">
          <FloatingAIButton />
        </div>
      </div>

    </div>
  )
}