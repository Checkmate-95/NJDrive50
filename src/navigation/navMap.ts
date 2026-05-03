import type { Screen } from "../App"

export const NAV: Record<Screen, Record<string, Screen>> = {
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

  // ⚠ back is dynamic — components should call goBack() from navStore
  driveHistory: {
    back: "home",
  },

  export: {
    history: "driveHistory",
    back: "home",
  },

  settings: {
    summary: "summary",
    history: "driveHistory",
    reminderSettings: "reminderSettings",
    home: "home",
    back: "home",
    helpFaq: "helpFaq",
    aiHelper: "aiHelper",
    manageProfile: "manageProfile",
    teenDriverRules: "teenDriverRules",
    reminderLog: "reminderLog",
    close: "home",
  },

  reminderSettings: {
    back: "settings",
  },

  reminderLog: {
    back: "settings",
  },

  manageProfile: {
    close: "settings",
    saved: "settings",
  },

  restartOnboarding: {
    back: "settings",
  },

  dataCleared: {
    back: "home",
  },

  dmv: {
    next: "dmvPrep",
    back: "home",
  },

  dmvPrep: {
    back: "dmv",
  },

  share: {
    back: "summary",
  },

  // ⚠ back is dynamic — component should call goBack() from navStore
  helpFaq: {
    back: "home",
  },

  // ⚠ back is dynamic — component should call goBack() from navStore
  aiHelper: {
    back: "home",
  },

  teenDriverRules: {
    back: "settings",
  },

  practiceTest: {
    back: "home",
  },
}

export function navigate(
  current: Screen,
  action: string,
  setScreen: (s: Screen) => void
) {
  const next = NAV[current]?.[action]
  if (next) setScreen(next)
  else console.warn(`No route for action "${action}" from screen "${current}"`)
}