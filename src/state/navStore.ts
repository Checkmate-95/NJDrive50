import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Screen } from "../App"


const MAX_STACK_SIZE = 20
const NAV_STORAGE_KEY = "njdrive50_nav"


type PersistedNavState = {
  screen?: unknown
  stack?: unknown
  previousScreen?: unknown
}


type NavState = {
  screen: Screen
  stack: Screen[]
  previousScreen: Screen | null


  setScreen: (s: Screen) => void
  goBack: (fallback?: Screen) => void
  resetTo: (s: Screen) => void
}


const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}


function getSafeSessionStorage() {
  if (typeof window === "undefined") return noopStorage


  try {
    const testKey = "__njdrive50_nav_test__"
    window.sessionStorage.setItem(testKey, testKey)
    window.sessionStorage.removeItem(testKey)
    return window.sessionStorage
  } catch {
    return noopStorage
  }
}


function isScreen(value: unknown): value is Screen {
  return (
    value === "landing" ||
    value === "intro" ||
    value === "onboarding" ||
    value === "home" ||
    value === "active" ||
    value === "activeDrive" ||
    value === "todaysDrive" ||
    value === "summary" ||
    value === "milestones" ||
    value === "driveHistory" ||
    value === "export" ||
    value === "exportLogs" ||
    value === "settings" ||
    value === "reminderSettings" ||
    value === "reminderLog" ||
    value === "dmv" ||
    value === "dmvPrep" ||
    value === "paperwork" ||
    value === "share" ||
    value === "helpFaq" ||
    value === "aiHelper" ||
    value === "aiFaq" ||
    value === "teenDriverRules" ||
    value === "teenInfo" ||
    value === "parentInfo" ||
    value === "manageProfile" ||
    value === "restartOnboarding" ||
    value === "dataCleared" ||
    value === "practiceTest" ||
    value === "pricing" ||
    value === "privacy" ||
    value === "terms" ||
    value === "about" ||
    value === "deleteAccount" ||
    value === "deleteData" ||
    value === "login" ||
    value === "register" ||
    value === "forgotPassword"
  )
}


function normalizeScreen(value: unknown, fallback: Screen = "landing"): Screen {
  return isScreen(value) ? value : fallback
}


function normalizeStack(value: unknown): Screen[] {
  if (!Array.isArray(value)) return []
  return value.filter(isScreen).slice(-MAX_STACK_SIZE)
}


function normalizePreviousScreen(value: unknown): Screen | null {
  return isScreen(value) ? value : null
}


function normalizePersistedNavState(
  value: unknown
): Pick<NavState, "screen" | "stack" | "previousScreen"> {
  const raw = (value ?? null) as PersistedNavState | null


  return {
    screen: normalizeScreen(raw?.screen, "landing"),
    stack: normalizeStack(raw?.stack),
    previousScreen: normalizePreviousScreen(raw?.previousScreen),
  }
}


export const useNav = create<NavState>()(
  persist(
    (set, get) => ({
      screen: "landing",
      stack: [],
      previousScreen: null,


      setScreen: (nextScreen: Screen) => {
        const { screen, stack } = get()


        if (nextScreen === screen) return


        const nextStack = [...stack, screen].slice(-MAX_STACK_SIZE)


        set({
          screen: nextScreen,
          stack: nextStack,
          previousScreen: screen,
        })
      },


      goBack: (fallback: Screen = "home") => {
        const { stack } = get()


        if (stack.length === 0) {
          set({
            screen: fallback,
            stack: [],
            previousScreen: null,
          })
          return
        }


        const nextStack = [...stack]
        const destination = nextStack.pop() ?? fallback
        const previousScreen =
          nextStack.length > 0 ? nextStack[nextStack.length - 1] : null


        set({
          screen: destination,
          stack: nextStack,
          previousScreen,
        })
      },


      resetTo: (screen: Screen) => {
        set({
          screen,
          stack: [],
          previousScreen: null,
        })
      },
    }),
    {
      name: NAV_STORAGE_KEY,
      storage: createJSONStorage(getSafeSessionStorage),
      version: 1,
      migrate: (persistedState: unknown) => {
        return normalizePersistedNavState(persistedState)
      },
      partialize: (state) => ({
        screen: state.screen,
        stack: state.stack,
        previousScreen: state.previousScreen,
      }),
    }
  )
)


export const useNavPreviousScreen = () => useNav((s) => s.previousScreen)