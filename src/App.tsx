import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import type { User } from "firebase/auth"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./firebase"
import { startupController } from "../core/startupController"

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

// ─── Lazy Screens ─────────────────────────────────────────────────────────────
const LandingPage = lazy(() => import("./landing/LandingPage"))
const DriveSummary = lazy(() => import("./screens/DriveSummaryContent"))
const DriveHistoryContent = lazy(() => import("./screens/DriveHistoryContent"))
const MilestonesContent = lazy(() => import("./screens/MilestonesContent"))
const ExportLog = lazy(() => import("./screens/ExportLog"))
const Settings = lazy(() => import("./screens/Settings"))
const TeenDriverRules = lazy(() => import("./screens/TeenDriverRules"))
const ReminderSettings = lazy(() => import("./screens/ReminderSettings"))
const ReminderLog = lazy(() => import("./screens/ReminderLog"))
const DMVBundle = lazy(() => import("./screens/DMVBundle"))
const DMVAppointmentPrep = lazy(() => import("./screens/DMVAppointmentPrep"))
const ShareLogView = lazy(() => import("./screens/ShareLogView"))
const TodaysDrive = lazy(() => import("./screens/TodaysDrive"))
const HelpFaq = lazy(() => import("./screens/HelpFAQ"))
const AIHelperScreen = lazy(() => import("./screens/AIHelperScreen"))
const PublicPracticeTestPage = lazy(() => import("./screens/PublicPracticeTestPage"))
const RestartOnboarding = lazy(() => import("./screens/RestartOnboarding"))
const DataCleared = lazy(() => import("./screens/DataCleared"))
const PricingPage = lazy(() => import("./screens/PricingPage"))

// ─── State ─────────────────────────────────────────────────────────────────────
import { useNav } from "./state/navStore"
import { MapProvider } from "./components/map/MapProvider"
import type { DriveEntry } from "./state/driveStore"

export type Screen =
  | "loading"
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

export default function App() {
  const { screen, setScreen, stack } = useNav()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const prevStackLengthRef = useRef(stack.length)

  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false)

  // ─── Firebase Auth + Startup Controller ─────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user)
      setAuthReady(true)

      // ⭐ NEW: Run the startup controller
      await startupController(user)
    })

    return () => unsubscribe()
  }, [])

  // ─── Location Permission ───────────────────────────────────────────────────
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setLocationPermissionGranted(true)
    }
  }, [])

  // ─── Safe Screen Fallback ───────────────────────────────────────────────────
  const safeScreen: Screen = screen ?? "landingApp"

  // ─── setScreen Compat Wrapper ───────────────────────────────────────────────
  const setScreenCompat = useCallback(
    (nextScreen: Screen | ((prev: Screen) => Screen)) => {
      const next =
        typeof nextScreen === "function" ? nextScreen(safeScreen) : nextScreen
      setScreen(next)
    },
    [safeScreen, setScreen]
  )

  // ─── Scroll Reset ─────────────────────────────────────────────────────────
  useEffect(() => {
    const wasGoBack = stack.length < prevStackLengthRef.current
    prevStackLengthRef.current = stack.length

    if (!wasGoBack) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" })
      })
    }
  }, [safeScreen, stack.length])

  // ─── Loading Screen ────────────────────────────────────────────────────────
  if (!authReady || safeScreen === "loading") {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#08194A]">
        <div className="rounded-2xl bg-white/10 px-6 py-4 text-sm font-semibold text-white backdrop-blur-sm">
          Loading…
        </div>
      </div>
    )
  }

  const renderScreen = () => {
  switch (safeScreen) {
    case "landingApp":     
      return <LandingPageApp />

    case "landing":        
      return <LandingPage />

    case "intro":          
      return <HomeIntro setScreen={setScreenCompat} />

    case "login":          
      return <Login />

    case "register":       
      return <Register />

    case "forgotPassword": 
      return <ForgotPassword />

    case "pricing":        
      return <PricingPage />

    case "onboarding":        
      return <Onboarding setScreen={setScreenCompat} />

    case "restartOnboarding": 
      return <RestartOnboarding />

    case "dataCleared":       
      return <DataCleared />

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

    case "reminderSettings": 
      return <ReminderSettings />

    case "reminderLog":      
      return <ReminderLog />

    case "milestones":       
      return <MilestonesContent />

    case "deleteAccount":
    case "deleteData":    
      return <Settings />

    case "teenInfo":
    case "parentInfo":
    case "manageProfile": 
      return <Onboarding setScreen={setScreenCompat} />

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

    case "practiceTest":  
      return <PublicPracticeTestPage />

    case "privacy":       
      return <PrivacyPolicy />

    case "terms":         
      return <TermsOfUse />

    case "about":         
      return <Settings />

    default:
      setScreen("landingApp")
      return null
  }
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
        <ErrorBoundary key={safeScreen}>
          <Suspense fallback={<div>Loading…</div>}>
            {renderScreen()}
          </Suspense>
        </ErrorBoundary>
      </MapProvider>
    </AppShell>
  )
}
