// src/state/navStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
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

export const useNav = create<NavState>()(
  persist(
    (set, get) => ({
      screen: "home",
      stack: [],
      previousScreen: null,

      setScreen: (s: Screen) => {
        const { screen, stack } = get()

        if (s === screen) return

        const nextStack = [...stack, screen].slice(-MAX_STACK_SIZE)

        set({
          screen: s,
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

        const next = [...stack]
        const destination = next.pop() as Screen
        const previous = next.length > 0 ? next[next.length - 1] : null

        set({
          screen: destination,
          stack: next,
          previousScreen: previous,
        })
      },

      resetTo: (s: Screen) => {
        set({
          screen: s,
          stack: [],
          previousScreen: null,
        })
      },
    }),
    {
      name: "njdrive50_nav",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        screen: state.screen,
        stack: state.stack,
        previousScreen: state.previousScreen,
      }),
    }
  )
)

export const useNavPreviousScreen = () => useNav((s) => s.previousScreen)