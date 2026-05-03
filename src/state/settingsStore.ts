// src/state/settingsStore.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

type SettingsState = {
  notifications: boolean
  autoExport: boolean

  setNotifications: (value: boolean) => void
  setAutoExport: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: false,
      autoExport: false,

      setNotifications: (value) =>
        set({ notifications: value }),

      setAutoExport: (value) =>
        set({ autoExport: value }),
    }),
    {
      name: "njdrive50_settings",
      version: 1,
      partialize: (state) => ({
        notifications: state.notifications,
        autoExport: state.autoExport,
      }),
    }
  )
)