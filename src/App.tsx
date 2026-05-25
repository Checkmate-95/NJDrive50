import { Suspense, lazy, useEffect, useRef, useState } from "react"
import AppShell from "./layout/AppShell"
import ErrorBoundary from "./components/ErrorBoundary"

import HomeDashboard from "./screens/HomeDashboardContent"
import ActiveDrive from "./screens/ActiveDriveContent"
import Onboarding from "./screens/OnboardingContent"
import HomeIntro from "./screens/HomeIntroContent"

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
  | "todaysDrive"
  | "summary"
  | "milestones"
  | "driveHistory"
  | "export"
  | "settings"
  | "reminderSettings"
  | "reminderLog"
  | "dmv"
  | "dmvPrep"
  | "share"
  | "helpFaq"
  | "aiHelper"
  | "teenDriverRules"
  | "manageProfile"
  | "restartOnboarding"
  | "dataCleared"
  | "practiceTest"
  | "pricing"

const VALID_SCREENS: readonly Screen[] = [
  "landing",
  "intro",
  "onboarding",
  "home",
  "active",
  "todaysDrive",
  "summary",
  "milestones",
  "driveHistory",
  "export",
  "settings",
  "reminderSettings",
  "reminderLog",
  "dmv",
  "dmvPrep",
  "share",
  "helpFaq",
  "aiHelper",
  "teenDriverRules",
  "manageProfile",
  "restartOnboarding",
  "dataCleared",
  "practiceTest",
  "pricing",
] as const

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

  const safeScreen: Screen = isValidScreen(screen) ? screen : "landing"

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

  useEffect(() => {
    let cancelled = false

    const runBootstrap = async () => {
      try {
        const nav = useNav.getState()
        const current = isValidScreen(nav.screen) ? nav.screen : "landing"

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
          if (current === "landing" || current === "intro" || current === "onboarding") {
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

  useEffect(() => {
    const wasGoBack = stack.length < prevStackLengthRef.current
    prevStackLengthRef.current = stack.length

    if (!wasGoBack) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" })
      })
    }
  }, [safeScreen, stack.length])

  const renderScreen = () => {
    switch (safeScreen) {
      case "landing":
        return <LandingPage />
      case "intro":
        return <HomeIntro setScreen={setScreenCompat} />
      case "onboarding":
        return <Onboarding setScreen={setScreenCompat} />
      case "home":
        return <HomeDashboard setScreen={setScreenCompat} />
      case "active":
        return <ActiveDrive setScreen={setScreenCompat} setCurrentDrive={setCurrentDrive} />
      case "todaysDrive":
        return <TodaysDrive drive={currentDrive} />
      case "summary":
        return <DriveSummary setScreen={setScreenCompat} />
      case "driveHistory":
        return <DriveHistoryContent />
      case "export":
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
      case "share":
        return <ShareLogView />
      case "helpFaq":
        return <HelpFaq />
      case "aiHelper":
        return <AIHelperScreen />
      case "practiceTest":
        return <PublicPracticeTestPage />
      case "restartOnboarding":
        return <RestartOnboarding />
      case "dataCleared":
        return <DataCleared />
      case "pricing":
        return <PricingPage />
      default:
        return null
    }
  }

  if (!bootstrapped) {
    return (
      <AppShell setScreen={setScreenCompat} active={safeScreen}>
        <MapProvider>
          <ScreenLoader />
        </MapProvider>
      </AppShell>
    )
  }

  return (
    <AppShell setScreen={setScreenCompat} active={safeScreen}>
      <MapProvider>
        <ErrorBoundary
          key={safeScreen}
          onReloadApp={() => {
            setScreen("landing")
            window.location.reload()
          }}
        >
          <Suspense fallback={<ScreenLoader />}>{renderScreen()}</Suspense>
        </ErrorBoundary>
      </MapProvider>
    </AppShell>
  )
}