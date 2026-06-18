import { create } from "zustand"
import type { Screen } from "../App"

const MAX_STACK_SIZE = 20

type NavState = {
  screen: Screen
  stack: Screen[]
  previousScreen: Screen | null

  setScreen: (s: Screen) => void
  goBack: (fallback?: Screen) => void
  resetTo: (s: Screen) => void
}

export const useNav = create<NavState>()((set, get) => ({
  // ⭐ App now starts on the new app landing page
  screen: "landingApp",
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
}))

export const useNavPreviousScreen = () => useNav((s) => s.previousScreen)
