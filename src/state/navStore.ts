import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Screen } from "../App"

const MAX_STACK_SIZE = 20
const STORAGE_KEY = "njdrive50_nav"

type NavState = {
  screen: Screen
  stack: Screen[]
  previousScreen: Screen | null

  setScreen: (s: Screen) => void
  goBack: (fallback?: Screen) => void
  resetTo: (s: Screen) => void
  resetAll: () => void
}

const initialNavState = {
  screen: "loading" as Screen,
  stack: [] as Screen[],
  previousScreen: null as Screen | null,
}

export const useNav = create<NavState>()(
  persist(
    (set, get) => ({
      ...initialNavState,

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

      resetAll: () => {
        set({
          screen: "loading",
          stack: [],
          previousScreen: null,
        })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        screen: state.screen,
        stack: state.stack,
        previousScreen: state.previousScreen,
      }),
    }
  )
)

export const useNavPreviousScreen = () => useNav((s) => s.previousScreen)