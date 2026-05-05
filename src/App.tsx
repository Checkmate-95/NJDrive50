import { Suspense, lazy, useEffect, useRef, useState } from "react"
import AppShell from "./layout/AppShell"
import ErrorBoundary from "./components/ErrorBoundary"

import HomeDashboard from "./screens/HomeDashboardContent"
import ActiveDrive from "./screens/ActiveDriveContent"
import Onboarding from "./screens/OnboardingContent"
import HomeIntro from "./screens/HomeIntroContent"

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

import {
  loadReminderPreferences,
  initializeReminders,
  loadOnboardingData,
} from "../core/ReminderEngine"

import { useNav } from "./state/navStore"
import type { DriveEntry } from "./state/driveStore"

// ⭐ ADD THIS
import { MapProvider } from "./components/map/MapProvider"

export type Screen =
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

  const setScreenCompat = (s: Screen | ((prev: Screen) => Screen)) => {
    const next = typeof s === "function" ? s(screen) : s
    setScreen(next)
  }

  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const prevStackLengthRef = useRef(stack.length)

  // Initialize reminders only if onboarding exists
  useEffect(() => {
    const data = loadOnboardingData()
    if (!data?.teenName) return

    const prefs = loadReminderPreferences()
    initializeReminders(prefs)
  }, [])

  // ⭐ FIXED STARTUP LOGIC ⭐
  useEffect(() => {
    const checkShareUrl = () => {
      const path = window.location.pathname
      const hash = window.location.hash

      if (path === "/share" && hash.startsWith("#ey")) {
        setScreen("share")
        return true
      }

      return false
    }

    if (checkShareUrl()) return

    const data = loadOnboardingData()

    // CASE 1: No onboarding data → allow Intro and Onboarding
    if (!data?.teenName) {
      if (screen !== "intro" && screen !== "onboarding") {
        setScreen("intro")
      }
      return
    }

    // CASE 2: Onboarding complete → go Home
    if (screen === "intro" || screen === "onboarding") {
      setScreen("home")
    }

  }, [screen, setScreen])

  useEffect(() => {
    const wasGoBack = stack.length < prevStackLengthRef.current
    prevStackLengthRef.current = stack.length

    if (!wasGoBack) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" })
      })
    }
  }, [screen, stack.length])

  const renderScreen = () => {
    switch (screen) {
      case "intro":
        return <HomeIntro setScreen={setScreenCompat} />

      case "onboarding":
        return <Onboarding setScreen={setScreenCompat} />

      case "home":
        return <HomeDashboard setScreen={setScreenCompat} />

      case "active":
        return (
          <ActiveDrive
            setScreen={setScreenCompat}
            setCurrentDrive={setCurrentDrive}
          />
        )

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

      case "todaysDrive":
        return <TodaysDrive drive={currentDrive} />

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

      default: {
        if (import.meta.env.DEV) {
          return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-2xl font-bold text-red-600">
                Unknown screen: &quot;{screen}&quot;
              </p>
              <p className="text-sm text-gray-500">
                Add a case for this screen in App.tsx renderScreen().
              </p>
              <button
                className="px-4 py-2 bg-[#08194A] text-white rounded-xl"
                onClick={() => setScreen("home")}
              >
                Go Home
              </button>
            </div>
          )
        }

        setScreen("home")
        return null
      }
    }
  }

  return (
    <AppShell setScreen={setScreenCompat} active={screen}>
      {/* ⭐ FIX: MapProvider must wrap ALL screens */}
      <MapProvider>
        <ErrorBoundary key={screen} onReset={() => setScreen("home")}>
          <Suspense fallback={<ScreenLoader />}>
            {renderScreen()}
          </Suspense>
        </ErrorBoundary>
      </MapProvider>
    </AppShell>
  )
}
