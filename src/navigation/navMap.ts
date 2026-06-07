import type { Screen } from "../App"

type NavShape = {
  [K in Screen]: Partial<Record<string, Screen>>
}

export const NAV = {
  landing: {
    continue: "intro",
    pricing: "pricing",
  },

  pricing: {
    continue: "intro",
    landing: "landing",
  },

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
    privacy: "privacy",
    terms: "terms",
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
    privacy: "privacy",
    terms: "terms",
  },

  milestones: {
    summary: "summary",
    home: "home",
    privacy: "privacy",
    terms: "terms",
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
    privacy: "privacy",
    terms: "terms",
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

  privacy: {},
  terms: {},

  // ✅ NEW — added to satisfy NavShape
  activeDrive: {
    confirm: "todaysDrive",
    summary: "summary",
    startNew: "activeDrive",
  },
  exportLogs: {
    history: "driveHistory",
  },
  paperwork: {
    home: "home",
  },
  aiFaq: {},
  teenInfo: {
    home: "home",
  },
  parentInfo: {
    home: "home",
  },
  about: {
    home: "home",
  },
  deleteAccount: {
    home: "home",
  },
} as const satisfies NavShape

export type NavMap = typeof NAV
export type NavScreen = keyof NavMap
export type NavAction<S extends NavScreen> = Extract<keyof NavMap[S], string>
export type NextScreen<S extends NavScreen, A extends NavAction<S>> = NavMap[S][A]

export function canNavigate<S extends NavScreen>(
  current: S,
  action: string
): action is NavAction<S> {
  return action in NAV[current]
}

export function getNextScreen<
  S extends NavScreen,
  A extends NavAction<S>,
>(current: S, action: A): NextScreen<S, A> {
  return NAV[current][action]
}

export function navigate<
  S extends NavScreen,
  A extends NavAction<S>,
>(
  current: S,
  action: A,
  setScreen: (screen: Screen) => void
): NextScreen<S, A> {
  const next = getNextScreen(current, action)
  setScreen(next as Screen)
  return next
}

export function tryNavigate(
  current: Screen,
  action: string,
  setScreen: (screen: Screen) => void
): Screen | undefined {
  if (!canNavigate(current, action)) {
    console.warn(`No route for action "${action}" from screen "${current}"`)
    return undefined
  }

  const next = getNextScreen(current, action)
  setScreen(next as Screen)
  return next as Screen
}