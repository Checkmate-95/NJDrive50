import { Suspense, lazy, useEffect, useRef, useState, useCallback } from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"

// ─── Layout & Core Components ─────────────────────────────────────────────────
import AppShell from "./layout/AppShell"
import ErrorBoundary from "./components/ErrorBoundary"

// ─── Eager Screens ────────────────────────────────────────────────────────────
import HomeDashboardContent from "./screens/HomeDashboardContent"
import ActiveDrive from "./screens/ActiveDriveContent"
import Onboarding from "./screens/OnboardingContent"
import HomeIntro from "./screens/HomeIntroContent"

// ─── Auth Screens ─────────────────────────────────────────────────────────────
import Login from "./Login"
import Register from "./Register"
import ForgotPassword from "./ForgotPassword"

// ─── App Landing Page (NEW) ───────────────────────────────────────────────────
import LandingPageApp from "./LandingPageApp"

// ─── Legal ────────────────────────────────────────────────────────────────────
import PrivacyPolicy from "./legal/PrivacyPolicy"
import TermsOfUse from "./legal/TermsOfUse"

// ─── Capacitor ────────────────────────────────────────────────────────────────
import { Capacitor } from "@capacitor/core"
import { Preferences } from "@capacitor/preferences"

// ─── Lazy Screens ─────────────────────────────────────────────────────────────
const LandingPage            = lazy(() => import("./landing/LandingPage"))
const DriveSummary           = lazy(() => import("./screens/DriveSummaryContent"))
const DriveHistoryContent    = lazy(() => import("./screens/DriveHistoryContent"))
const MilestonesContent      = lazy(() => import("./screens/MilestonesContent"))
const ExportLog              = lazy(() => import("./screens/ExportLog"))
const Settings               = lazy(() => import("./screens/Settings"))
const TeenDriverRules        = lazy(() => import("./screens/TeenDriverRules"))
const ReminderSettings       = lazy(() => import("./screens/ReminderSettings"))
const ReminderLog            = lazy(() => import("./screens/ReminderLog"))
const DMVBundle              = lazy(() => import("./screens/DMVBundle"))
const DMVAppointmentPrep     = lazy(() => import("./screens/DMVAppointmentPrep"))
const ShareLogView           = lazy(() => import("./screens/ShareLogView"))
const TodaysDrive            = lazy(() => import("./screens/TodaysDrive"))
const HelpFaq                = lazy(() => import("./screens/HelpFAQ"))
const AIHelperScreen         = lazy(() => import("./screens/AIHelperScreen"))
const PublicPracticeTestPage = lazy(() => import("./screens/PublicPracticeTestPage"))
const RestartOnboarding      = lazy(() => import("./screens/RestartOnboarding"))
const DataCleared            = lazy(() => import("./screens/DataCleared"))
const PricingPage            = lazy(() => import("./screens/PricingPage"))

// ─── State, Types & Utilities ─────────────────────────────────────────────────
import { useNav } from "./state/navStore"
import { MapProvider } from "./components/map/MapProvider"
import type { DriveEntry } from "./state/driveStore"
import {
  loadReminderPreferences,
  initializeReminders,
  loadOnboardingData,
} from "../core/ReminderEngine"

export type Screen =
  | "landing"
  | "landingApp"
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
  | "deleteAccount"
  | "deleteData"
  | "login"
  | "register"
  | "forgotPassword"

const VALID_SCREENS: readonly Screen[] = [
  "landing", "landingApp", "intro", "onboarding", "home", "active", "activeDrive",
  "todaysDrive", "summary", "milestones", "driveHistory", "export",
  "exportLogs", "settings", "reminderSettings", "reminderLog", "dmv",
  "dmvPrep", "paperwork", "share", "helpFaq", "aiHelper", "aiFaq",
  "teenDriverRules", "teenInfo", "parentInfo", "manageProfile",
  "restartOnboarding", "dataCleared", "practiceTest", "pricing",
  "privacy", "terms", "about", "login", "register", "forgotPassword",
] as const


function isBrowser() {
  return typeof window !== "undefined"
}

function isNativePlatform() {
  return Capacitor.isNativePlatform()
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

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-[#08194A]">
      <div className="rounded-2xl bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm">
        Loading…
      </div>
    </div>
  )
}

export default function App() {
  const { screen, setScreen, stack } = useNav()
  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const prevStackLengthRef = useRef(stack.length)

  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  // ─── Firebase Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user)
      setAuthReady(true)

      if (user) {
  useNav.getState().resetTo("home")
} else {
  useNav.getState().resetTo("landingApp")
}
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!isNativePlatform()) {
      setLocationPermissionGranted(true)
    }
  }, [])

  const safeScreen: Screen = isValidScreen(screen) ? screen : "landingApp"


  const setScreenCompat = useCallback(
    (nextScreen: Screen | ((prev: Screen) => Screen)) => {
      const next =
        typeof nextScreen === "function" ? nextScreen(safeScreen) : nextScreen
      setScreen(next)
    },
    [safeScreen, setScreen]
  )

  useEffect(() => {
    const data = loadOnboardingData()
    if (!data?.teenName) return
    const prefs = loadReminderPreferences()
    initializeReminders(prefs)
  }, [])

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    const runBootstrap = async () => {
  try {
    const nav = useNav.getState()
    const current = isValidScreen(nav.screen) ? nav.screen : "landingApp"

    // Do not override Active Drive
    if (current === "activeDrive" || current === "active") {
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

    // Invalid screen fallback
    if (!isValidScreen(nav.screen)) {
      nav.setScreen("landingApp")
    }

    // User HAS onboarding data → skip landing and intro
    else if (hasOnboardingData) {
      if (
        current === "landing" ||
        current === "landingApp" ||
        current === "intro" ||
        current === "onboarding"
      ) {
        nav.setScreen("home")
      }
    }

    // User does NOT have onboarding data → force intro unless allowed
    else if (
      current !== "landing" &&
      current !== "landingApp" &&
      current !== "pricing" &&
      current !== "intro" &&
      current !== "onboarding" &&
      current !== "login" &&
      current !== "register" &&
      current !== "forgotPassword"
    ) {
      nav.setScreen("intro")
    }

  } catch (err) {
    console.warn("App bootstrap failed:", err)
    if (!cancelled) {
      setScreen("landingApp")
    }
  } finally {
    if (!cancelled) {
      setBootstrapped(true)
    }
  }
}


    void runBootstrap()

    return () => {
      cancelled = true
    }
  }, [])

  // ─── Scroll Reset ─────────────────────────────────────────────────────────
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

  // ─── Screen Renderer ──────────────────────────────────────────────────────
  const renderScreen = () => {
    switch (safeScreen) {
      case "landingApp":     return <LandingPageApp />
      case "landing":        return <LandingPage />
      case "intro":          return <HomeIntro setScreen={setScreenCompat} />
      case "login":          return <Login />
      case "register":       return <Register />
      case "forgotPassword": return <ForgotPassword />

      case "onboarding":        return <Onboarding setScreen={setScreenCompat} />
      case "restartOnboarding": return <RestartOnboarding />
      case "dataCleared":       return <DataCleared />

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

      case "todaysDrive":   return <TodaysDrive drive={currentDrive} />
      case "summary":       return <DriveSummary setScreen={setScreenCompat} />
      case "driveHistory":  return <DriveHistoryContent />

      case "export":
      case "exportLogs":    return <ExportLog setScreen={setScreenCompat} />

      case "settings":         return <Settings />
      case "teenDriverRules":  return <TeenDriverRules />
      case "reminderSettings": return <ReminderSettings />
      case "reminderLog":      return <ReminderLog />
      case "milestones":       return <MilestonesContent />

      case "deleteAccount":
      case "deleteData":    return <Settings />

      case "teenInfo":
      case "parentInfo":
      case "manageProfile": return <Onboarding setScreen={setScreenCompat} />

      case "dmv":           return <DMVBundle />
      case "dmvPrep":       return <DMVAppointmentPrep />
      case "paperwork":     return <DMVBundle />

      case "share":         return <ShareLogView />
      case "helpFaq":       return <HelpFaq />
      case "aiHelper":
      case "aiFaq":         return <AIHelperScreen />

      case "practiceTest":  return <PublicPracticeTestPage />

      case "pricing":       return <PricingPage />
      case "privacy":       return <PrivacyPolicy />
      case "terms":         return <TermsOfUse />
      case "about":         return <Settings />

      default:
        setScreen("landingApp")
        return null
    }
  }

  // ─── Block render until Firebase resolves ─────────────────────────────────
  if (!authReady) {
    return <LoadingScreen />
  }

  // ─── Loading State ────────────────────────────────────────────────────────
  if (!bootstrapped) {
    return (
      <AppShell
        user={authUser}
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

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <AppShell
      user={authUser}
      setScreen={setScreenCompat}
      active={safeScreen}
      locationPermissionGranted={locationPermissionGranted}
    >
      <MapProvider>
        <ErrorBoundary
          key={safeScreen}
          onReloadApp={() => {
  setScreen("landingApp")
  if (isBrowser()) window.location.reload()
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