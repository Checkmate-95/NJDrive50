// src/navigation/navMap.ts
import type { Screen } from "../App"

// Each screen maps to a set of named actions → target screens
type NavDefinition = {
  [K in Screen]: Partial<Record<string, Screen>>
}

// Explicit annotation prevents TS inference bugs
export const NAV: NavDefinition = {
  intro: {
    continue: "onboarding",
  },

  onboarding: {
    continue: "home",
  },

  home: {
    startDrive: "active",
    history: "driveHistory",
    milestones: "milestones",
    export: "export",
    settings: "settings",
    dmv: "dmv",
    share: "share",
    helpFaq: "helpFaq",
    aiHelper: "aiHelper",
    practiceTest: "practiceTest",
  },

  active: {
    confirm: "todaysDrive",
    summary: "summary",
    startNew: "active",
  },

  todaysDrive: {
    startNew: "active",
    confirm: "summary",
    summary: "summary",
  },

  summary: {
    continue: "active",
    startNew: "active",
    history: "driveHistory",
    milestones: "milestones",
    export: "export",
    settings: "settings",
    dmv: "dmv",
    share: "share",
    home: "home",
    helpFaq: "helpFaq",
    aiHelper: "aiHelper",
  },

  milestones: {
    summary: "summary",
    home: "home",
  },

  driveHistory: {},

  export: {
    history: "driveHistory",
  },

  settings: {
    summary: "summary",
    history: "driveHistory",
    reminderSettings: "reminderSettings",
    home: "home",
    helpFaq: "helpFaq",
    aiHelper: "aiHelper",
    manageProfile: "manageProfile",
    teenDriverRules: "teenDriverRules",
    reminderLog: "reminderLog",
    close: "home",
  },

  reminderSettings: {},

  reminderLog: {},

  manageProfile: {
    close: "settings",
    saved: "settings",
  },

  restartOnboarding: {},

  dataCleared: {},

  dmv: {
    next: "dmvPrep",
  },

  dmvPrep: {},

  share: {},

  helpFaq: {},

  aiHelper: {},

  teenDriverRules: {},

  practiceTest: {},
}

export type NavMap = typeof NAV
export type NavScreen = keyof NavMap

// Action keys are always strings
export type NavAction<S extends NavScreen> = Extract<keyof NavMap[S], string>

// Type guard: checks if an action is valid for a given screen
export function canNavigate<S extends NavScreen>(
  current: S,
  action: string
): action is NavAction<S> {
  return action in NAV[current]
}

// Get the next screen for a given action
export function getNextScreen(
  current: Screen,
  action: string
): Screen | undefined {
  const routes = NAV[current]
  if (action in routes) {
    return routes[action as keyof typeof routes]
  }
  return undefined
}

// Navigate with full type safety
export function navigate(
  current: Screen,
  action: string,
  setScreen: (screen: Screen) => void
): Screen | undefined {
  const next = getNextScreen(current, action)

  if (next) {
    setScreen(next)
    return next
  }

  console.warn(`No route for action "${action}" from screen "${current}"`)
  return undefined
}
