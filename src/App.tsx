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
import ForgotPassword from "./ForgotPassword"
import { Preferences } from "@capacitor/preferences"
import PrivacyPolicy from "./legal/PrivacyPolicy"
import TermsOfUse from "./legal/TermsOfUse"
import DeleteAccount from "./screens/DeleteAccount"
import DeleteData from "./screens/DeleteData"
import { Capacitor } from "@capacitor/core"
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
  | "forgotPassword"
  | "forgotIdentifier"


export default function App() {
  const viteMode = import.meta.env?.MODE
  if (viteMode !== "production") {
    console.log("🔥 NJDrive50 app loaded")
  }

  const { screen, setScreen, stack } = useNav()
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [currentDrive, setCurrentDrive] = useState<DriveEntry | null>(null)
  const prevStackLengthRef = useRef(stack.length)
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(
    () => !Capacitor.isNativePlatform()
  )

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    const myCallId = ++authCallIdRef.current
    setAuthUser(user)

    if (myCallId !== authCallIdRef.current) return

    if (!user) {
      resetProfileStore()
      resetDriveStore()
      resetActiveDriveStore()
      useNav.getState().resetTo("login")
      setAuthReady(true)
      return
    }

    setActiveProfileUser(user.uid)

    if (myCallId !== authCallIdRef.current) return

    await setActiveDriveUser(user.uid)

    if (myCallId !== authCallIdRef.current) return

    const { value: testMode } = await Preferences.get({ key: "testMode" })

    if (myCallId !== authCallIdRef.current) return

    if (testMode === "true") {
      setAuthReady(true)
      setScreen("home")
      return
    }

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
      case "intro":
        return <HomeIntro setScreen={setScreenCompat} />
      case "login":
        return <Login />
      case "register":
        return <Register />
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
        return currentDrive ? (
          <TodaysDrive drive={currentDrive} />
        ) : (
          <HomeDashboardContent
            setScreen={setScreenCompat}
            setLocationPermissionGranted={setLocationPermissionGranted}
          />
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
          <HomeDashboardContent
            setScreen={setScreenCompat}
            setLocationPermissionGranted={setLocationPermissionGranted}
          />
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