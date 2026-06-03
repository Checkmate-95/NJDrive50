import { Suspense, lazy, useEffect, useRef, useState } from "react"

import AppShell from "./layout/AppShell"
import ErrorBoundary from "./components/ErrorBoundary"

import HomeDashboardContent from "./screens/HomeDashboardContent"

import ActiveDrive from "./screens/ActiveDriveContent"
import Onboarding from "./screens/OnboardingContent"
import HomeIntro from "./screens/HomeIntroContent"

import PrivacyPolicy from "./legal/PrivacyPolicy"
import TermsOfUse from "./legal/TermsOfUse"

import { Preferences } from "@capacitor/preferences"

const DriveSummary = lazy(() => import("./screens/DriveSummaryContent"))
const DriveHistoryContent = lazy(() => import("./screens/DriveHistoryContent"))
const MilestonesContent = lazy(() => import("./screens/MilestonesContent"))
const ExportLog = lazy(() => import("./screens/ExportLog"))
const Settings = lazy(() => import("./screens/Settings"))
const TeenDriverRules = lazy(() => import("./screens/TeenDriverRules"))
const ReminderSettings = lazy(() => import("./screens/ReminderSettings"))
const DMVBundle = lazy(() => import("./screens/DMVBundle"))
const DMVAppointmentPrep = lazy(() => import("./screens/DMVAppointmentPrep"))
const ReminderLog = lazy(() => import("./screens/ReminderLog"))
const ShareLogView = lazy(() => import("./screens/ShareLogView"))
const TodaysDrive = lazy(() => import("./screens/TodaysDrive"))
const HelpFaq = lazy(() => import("./screens/HelpFAQ"))
const AIHelperScreen = lazy(() => import("./screens/AIHelperScreen"))
const PublicPracticeTestPage = lazy(() => import("./screens/PublicPracticeTestPage"))
const RestartOnboarding = lazy(() => import("./screens/RestartOnboarding"))
const DataCleared = lazy(() => import("./screens/DataCleared"))
const PricingPage = lazy(() => import("./screens/PricingPage"))
const LandingPage = lazy(() => import("./landing/LandingPage"))

import {
  loadReminderPreferences,
  initializeReminders,
  loadOnboardingData,
} from "../core/ReminderEngine"

import { useNav } from "./state/navStore"
import type { DriveEntry } from "./state/driveStore"
import { MapProvider } from "./components/map/MapProvider"

export type Screen =
  | "landing"
  | "intro"
  | "onboarding"
  | "home"
  | "active"
  | "activeDrive"
  | "todaysDrive"
  | "summary"
  | "milestones"
  | "driveHistory"
  | "export"
  | "exportLogs"
  | "settings"
  | "reminderSettings"
  | "reminderLog"
  | "dmv"
  | "dmvPrep"
  | "paperwork"
  | "share"
  | "helpFaq"
  | "aiHelper"
  | "aiFaq"
  | "teenDriverRules"
  | "teenInfo"
  | "parentInfo"
  | "manageProfile"
  | "restartOnboarding"
  | "dataCleared"
  | "practiceTest"
  | "pricing"
  | "privacy"
  | "terms"
  | "about"

const VALID_SCREENS: readonly Screen[] = [
  "landing",
  "intro",
  "onboarding",
  "home",
  "active",
  "activeDrive",
  "todaysDrive",
  "summary",
  "milestones",
  "driveHistory",
  "export",
  "exportLogs",
  "settings",
  "reminderSettings",
  "reminderLog",
  "dmv",
  "dmvPrep",
  "paperwork",
  "share",
  "helpFaq",
  "aiHelper",
  "aiFaq",
  "teenDriverRules",
  "teenInfo",
  "parentInfo",
  "manageProfile",
  "restartOnboarding",
  "dataCleared",
  "practiceTest",
  "pricing",
  "privacy",
  "terms",
  "about",
] as const

function isBrowser() {
  return typeof window !== "undefined"
}

function isNativePlatform() {
  return !!(window as any).Capacitor?.isNativePlatform
}

function isValidScreen(value: unknown): value is Screen {
  return typeof value === "string" && VALID_SCREENS.includes(value as Screen)
}

function ScreenLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 py-12 text-center text-white">
      <div className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur-sm">
        Loading screen...
      </div>
    </div>
  )
}

export default function App() {
  const { screen, setScreen, stack } = useNav()
  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const prevStackLengthRef = useRef(stack.length)

  // ⭐ NEW — required for HomeDashboardContent
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  // ⭐ PATCH — auto‑grant permission in browser
  useEffect(() => {
    if (!isNativePlatform()) {
      setLocationPermissionGranted(true)
    }
  }, [])

  const safeScreen: Screen = isValidScreen(screen) ? screen : "landing"

  // ⭐ DIAGNOSTIC LOGS — screen + permission
  useEffect(() => {
    console.log("[App] screen changed to:", safeScreen)
    console.log("[App] locationPermissionGranted:", locationPermissionGranted)
  }, [safeScreen, locationPermissionGranted])

  const setScreenCompat = (nextScreen: Screen | ((prev: Screen) => Screen)) => {
    const next = typeof nextScreen === "function" ? nextScreen(safeScreen) : nextScreen
    setScreen(next)
  }

  useEffect(() => {
    const data = loadOnboardingData()
    if (!data?.teenName) return

    const prefs = loadReminderPreferences()
    initializeReminders(prefs)
  }, [])

  // ⭐ BOOTSTRAP FIXED SECTION
  useEffect(() => {
    let cancelled = false

    const runBootstrap = async () => {
      try {
        const nav = useNav.getState()
        const current = isValidScreen(nav.screen) ? nav.screen : "landing"

        // ⭐ DIAGNOSTIC LOGS
        console.log("[Bootstrap] running bootstrap")
        console.log("[Bootstrap] current screen:", current)

        // ⭐ CRITICAL FIX — protect ActiveDrive from being overridden
        if (current === "activeDrive" || current === "active") {
          console.log("[Bootstrap] skipping — user is in ActiveDrive")
          setBootstrapped(true)
          return
        }

        let hasOnboardingData = false
        const result = await Preferences.get({ key: "onboardingData" })

        if (cancelled) return

        if (result.value) {
          try {
            const data = JSON.parse(result.value)
            hasOnboardingData = !!data?.teenName
          } catch {
            hasOnboardingData = false
          }
        }

        if (!isValidScreen(nav.screen)) {
          nav.setScreen("landing")
        } else if (hasOnboardingData) {
          if (
            current === "landing" ||
            current === "intro" ||
            current === "onboarding"
          ) {
            nav.setScreen("home")
          }
        } else if (
          current !== "landing" &&
          current !== "pricing" &&
          current !== "intro" &&
          current !== "onboarding"
        ) {
          nav.setScreen("intro")
        }
      } catch (err) {
        console.warn("App bootstrap failed:", err)
        if (!cancelled) {
          setScreen("landing")
        }
      } finally {
        if (!cancelled) {
          setBootstrapped(true)
        }
      }
    }

    if (useNav.persist.hasHydrated()) {
      void runBootstrap()
      return () => {
        cancelled = true
      }
    }

    const unsubscribe = useNav.persist.onFinishHydration(() => {
      void runBootstrap()
    })

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [setScreen])

  // ⭐ SCROLL RESET (unchanged)
  useEffect(() => {
    if (!isBrowser()) return

    const wasGoBack = stack.length < prevStackLengthRef.current
    prevStackLengthRef.current = stack.length

    if (!wasGoBack) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" })
      })
    }
  }, [safeScreen, stack.length])

  // ⭐ SCREEN RENDERER
  const renderScreen = () => {
    switch (safeScreen) {
      case "landing":
        return <LandingPage />
      case "intro":
        return <HomeIntro setScreen={setScreenCompat} />
      case "onboarding":
        return <Onboarding setScreen={setScreenCompat} />

      case "home":
        return (
          <HomeDashboardContent
            setScreen={setScreenCompat}
            setLocationPermissionGranted={setLocationPermissionGranted}
          />
        )

      case "active":
      case "activeDrive":
        return (
          <ActiveDrive
            setScreen={setScreenCompat}
            setCurrentDrive={setCurrentDrive}
          />
        )

      case "todaysDrive":
        return <TodaysDrive drive={currentDrive} />
      case "summary":
        return <DriveSummary setScreen={setScreenCompat} />
      case "driveHistory":
        return <DriveHistoryContent />

      case "export":
      case "exportLogs":
        return <ExportLog setScreen={setScreenCompat} />

      case "settings":
        return <Settings />
      case "teenDriverRules":
        return <TeenDriverRules />
      case "manageProfile":
        return <Onboarding setScreen={setScreenCompat} />
      case "reminderSettings":
        return <ReminderSettings />
      case "reminderLog":
        return <ReminderLog />
      case "milestones":
        return <MilestonesContent />
      case "dmv":
        return <DMVBundle />
      case "dmvPrep":
        return <DMVAppointmentPrep />

      case "paperwork":
        return <DMVBundle />

      case "share":
        return <ShareLogView />
      case "helpFaq":
        return <HelpFaq />

      case "aiHelper":
      case "aiFaq":
        return <AIHelperScreen />

      case "teenInfo":
      case "parentInfo":
      case "manageProfile":
        return <Onboarding setScreen={setScreenCompat} />

      case "practiceTest":
        return <PublicPracticeTestPage />
      case "restartOnboarding":
        return <RestartOnboarding />
      case "dataCleared":
        return <DataCleared />
      case "pricing":
        return <PricingPage />
      case "privacy":
        return <PrivacyPolicy />
      case "terms":
        return <TermsOfUse />

      case "about":
        return <Settings />

      default:
        return null
    }
  }

  // ⭐ LOADING STATE
  if (!bootstrapped) {
    return (
      <AppShell
        setScreen={setScreenCompat}
        active={safeScreen}
        locationPermissionGranted={locationPermissionGranted}
      >
        <MapProvider>
          <ScreenLoader />
        </MapProvider>
      </AppShell>
    )
  }

  // ⭐ MAIN RENDER
  return (
    <AppShell
      setScreen={setScreenCompat}
      active={safeScreen}
      locationPermissionGranted={locationPermissionGranted}
    >
      <MapProvider>
        <ErrorBoundary
          key={safeScreen}
          onReloadApp={() => {
            setScreen("landing")
            if (isBrowser()) {
              window.location.reload()
            }
          }}
        >
          <Suspense fallback={<ScreenLoader />}>
            {renderScreen()}
          </Suspense>
        </ErrorBoundary>
      </MapProvider>
    </AppShell>
  )
}
