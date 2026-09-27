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
import AppShell from "./layout/AppShell"
import ErrorBoundary from "./components/ErrorBoundary"
import HomeDashboardContent from "./screens/HomeDashboardContent"
import ActiveDrive from "./screens/ActiveDriveContent"
import Onboarding from "./screens/OnboardingContent"
import HomeIntro from "./screens/HomeIntroContent"
import Login from "./Login"
import Register from "./Register"
import VerifyEmail from "./screens/VerifyEmail"
import ForgotPassword from "./ForgotPassword"
import PrivacyPolicy from "./legal/PrivacyPolicy"
import TermsOfUse from "./legal/TermsOfUse"
import DeleteAccount from "./screens/DeleteAccount"
import DeleteData from "./screens/DeleteData"
import PracticeTestPanel from "./screens/PracticeTestPanel"
import { useNav } from "./state/navStore"
import { MapProvider } from "./components/map/MapProvider"
import type { DriveEntry } from "./state/driveStore"
import { setActiveDriveUser, resetDriveStore } from "./state/driveStore"
import { resetActiveDriveStore, useActiveDriveStore } from "./state/activeDriveStore"
import {
  setActiveProfileUser,
  resetProfileStore,
} from "./state/profileStore"
import { usePremium, usePremiumStore } from "./billing/premiumStore"
import { isBillingSupported } from "./billing/revenuecat"

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
const RestartOnboarding = lazy(() => import("./screens/RestartOnboarding"))
const DataCleared = lazy(() => import("./screens/DataCleared"))
const DataClearedFull = lazy(() => import("./screens/DataClearedFull"))
const DataClearedPartial = lazy(() => import("./screens/DataClearedPartial"))
const Paywall = lazy(() => import("./screens/Paywall"))

const authCallIdRef = { current: 0 }

export type Screen =
  | "loading"
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
  | "dataClearedFull"
  | "dataClearedPartial"
  | "practiceTest"
  | "privacy"
  | "terms"
  | "about"
  | "deleteAccount"
  | "deleteData"
  | "login"
  | "register"
  | "verifyEmail"
  | "forgotPassword"
  | "forgotIdentifier"
  | "paywall"

// Model A: every screen NOT listed here requires an active "premium"
// entitlement (the 7-day yearly trial counts). Account, onboarding, legal,
// deletion (required by Google Play), settings, and help always stay free.
const FREE_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  "loading",
  "intro",
  "onboarding",
  "teenInfo",
  "parentInfo",
  "manageProfile",
  "restartOnboarding",
  "login",
  "register",
  "verifyEmail",
  "forgotPassword",
  "forgotIdentifier",
  "privacy",
  "terms",
  "about",
  "settings",
  "helpFaq",
  "deleteAccount",
  "deleteData",
  "dataCleared",
  "dataClearedFull",
  "dataClearedPartial",
  "paywall",
])

// A drive already in progress is never interrupted by the paywall.
const ACTIVE_DRIVE_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  "active",
  "activeDrive",
  "summary",
])

// Where "Not now" on the paywall sends a signed-in, non-premium user.
const PAYWALL_EXIT_SCREEN: Screen = "settings"

// Dev-only: a desktop browser (npm run dev) cannot run Google Play Billing.
// Release builds are never bypassed.
const DEV_BILLING_BYPASS = import.meta.env.DEV && !isBillingSupported()

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
  const viteMode = import.meta.env?.MODE
  if (viteMode !== "production") {
    console.log("🔥 NJDrive50 app loaded")
  }

  const { screen, setScreen, stack, goBack, resetTo } = useNav()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const prevStackLengthRef = useRef(stack.length)

  const isPremium = usePremium()
  const billingStatus = usePremiumStore((state) => state.status)
  const driveInProgress = useActiveDriveStore((state) => Boolean(state.session?.isActive))

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const myCallId = ++authCallIdRef.current
      setAuthUser(user)

      if (myCallId !== authCallIdRef.current) return

      if (!user) {
        void usePremiumStore.getState().signOut()
        resetProfileStore()
        resetDriveStore()
        resetActiveDriveStore()
        useNav.getState().resetTo("login")
        setAuthReady(true)
        return
      }

      setActiveProfileUser(user.uid)

      // Link RevenueCat to this Firebase account (non-blocking).
      void usePremiumStore.getState().signIn(user.uid)

      if (myCallId !== authCallIdRef.current) return

      await setActiveDriveUser(user.uid)

      if (myCallId !== authCallIdRef.current) return

      startupController(user)
      setAuthReady(true)
    })

    return () => unsubscribe()
  }, [setScreen])

  const safeScreen: Screen = screen ?? (authUser ? "home" : "login")

  const setScreenCompat = useCallback(
    (nextScreen: Screen | ((prev: Screen) => Screen)) => {
      const next =
        typeof nextScreen === "function" ? nextScreen(safeScreen) : nextScreen
      setScreen(next)
    },
    [safeScreen, setScreen]
  )

  useEffect(() => {
    const wasGoBack = stack.length < prevStackLengthRef.current
    prevStackLengthRef.current = stack.length

    if (!wasGoBack) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "auto" })
      })
    }
  }, [safeScreen, stack.length])

  if (!authReady || safeScreen === "loading") {
    return <LoadingScreen />
  }

  // Closing a paywall that replaced a locked screen: if the user just
  // subscribed, stay put (the locked screen now renders); otherwise leave
  // to a free screen instead of bouncing back into another locked one.
  const closeGatedPaywall = () => {
    if (usePremiumStore.getState().isPremium) return
    resetTo(PAYWALL_EXIT_SCREEN)
  }

  // Closing the standalone "paywall" screen (opened from an Upgrade button).
  const closePaywallScreen = () => {
    if (usePremiumStore.getState().isPremium) {
      resetTo("home")
      return
    }
    goBack(PAYWALL_EXIT_SCREEN)
  }

  const requiresPremium =
    Boolean(authUser) &&
    !DEV_BILLING_BYPASS &&
    !FREE_SCREENS.has(safeScreen) &&
    !(driveInProgress && ACTIVE_DRIVE_SCREENS.has(safeScreen))

  const renderScreen = () => {
    if (requiresPremium && !isPremium) {
      if (billingStatus === "idle" || billingStatus === "loading") {
        return <LoadingScreen />
      }
      return <Paywall onClose={closeGatedPaywall} />
    }

    switch (safeScreen) {
      case "intro":
        return <HomeIntro setScreen={setScreenCompat} />
      case "login":
        return <Login />
      case "register":
        return <Register />
      case "verifyEmail":
        return <VerifyEmail />
      case "forgotPassword":
        return <ForgotPassword />
      case "onboarding":
        return <Onboarding setScreen={setScreenCompat} />
      case "restartOnboarding":
        return <RestartOnboarding />
      case "dataCleared":
        return <DataCleared />
      case "dataClearedFull":
        return <DataClearedFull />
      case "dataClearedPartial":
        return <DataClearedPartial />
      case "paywall":
        return <Paywall onClose={closePaywallScreen} />
      case "home":
        return <HomeDashboardContent setScreen={setScreenCompat} />

      case "active":
      case "activeDrive":
        return (
          <ActiveDrive
            setScreen={setScreenCompat}
            setCurrentDrive={setCurrentDrive}
          />
        )
      case "todaysDrive":
        return currentDrive ? (
          <TodaysDrive drive={currentDrive} />
        ) : (
          <HomeDashboardContent setScreen={setScreenCompat} />
        )
      case "summary": {
        const activeSession = useActiveDriveStore.getState().session
        return activeSession?.isActive ? (
          <ActiveDrive
            setScreen={setScreenCompat}
            setCurrentDrive={setCurrentDrive}
          />
        ) : (
          <DriveSummary setScreen={setScreenCompat} />
        )
      }
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
      case "practiceTest":
        return <PracticeTestPanel />
      case "deleteAccount":
        return <DeleteAccount />
      case "deleteData":
        return <DeleteData />
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
      case "privacy":
        return <PrivacyPolicy />
      case "terms":
        return <TermsOfUse />
      case "about":
        return <Settings />
      default:
        return authUser ? (
          <HomeDashboardContent setScreen={setScreenCompat} />
        ) : (
          <Login />
        )
    }
  }

  return (
    <AppShell
      user={authUser}
      setScreen={setScreenCompat}
      active={safeScreen}
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