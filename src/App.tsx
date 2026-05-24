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
  const prevStackLengthRef = useRef(stack.length)

  useEffect(() => {
    const nav = useNav.getState()
    if (nav.screen === "home" || !nav.screen) {
      nav.setScreen("landing")
    }
  }, [])

  useEffect(() => {
    const data = loadOnboardingData()
    if (!data?.teenName) return

    const prefs = loadReminderPreferences()
    initializeReminders(prefs)
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!useNav.persist.hasHydrated()) return

      const result = await Preferences.get({ key: "onboardingData" })
      if (cancelled) return

      const currentScreen = useNav.getState().screen
      let hasOnboardingData = false

      if (result.value) {
        try {
          const data = JSON.parse(result.value)
          hasOnboardingData = !!data?.teenName
        } catch {
          hasOnboardingData = false
        }
      }

      if (hasOnboardingData) {
        if (currentScreen === "intro" || currentScreen === "onboarding") {
          setScreen("home")
        }
        return
      }

      if (
        currentScreen !== "landing" &&
        currentScreen !== "pricing" &&
        currentScreen !== "intro" &&
        currentScreen !== "onboarding"
      ) {
        setScreen("intro")
      }
    }

    load()
    return () => {
      cancelled = true
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
  }, [screen, stack.length])

  const setScreenCompat = (s: Screen | ((prev: Screen) => Screen)) => {
    const next = typeof s === "function" ? s(screen) : s
    setScreen(next)
  }

  const renderScreen = () => {
    switch (screen) {
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
      case "pricing":
        return <PricingPage />
      default: {
        if (import.meta.env.DEV) {
          return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
              <p className="text-2xl font-bold text-red-600">
                Unknown screen: &quot;{screen}&quot;
              </p>
              <p className="text-sm text-gray-500">
                Add a case for this screen in App.tsx renderScreen().
              </p>
              <button
                className="rounded-xl bg-[#08194A] px-4 py-2 text-white"
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
      <MapProvider>
        <ErrorBoundary key={screen} onReset={() => setScreen("home")}>
          <Suspense fallback={<ScreenLoader />}>{renderScreen()}</Suspense>
        </ErrorBoundary>
      </MapProvider>
    </AppShell>
  )
}