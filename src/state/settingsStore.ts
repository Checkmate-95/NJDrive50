// src/state/settingsStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

const SETTINGS_STORAGE_KEY = "njdrive50_settings"

type SettingsState = {
  notifications: boolean
  autoExport: boolean

  setNotifications: (value: boolean) => void
  setAutoExport: (value: boolean) => void
}

type PersistedSettingsState = {
  notifications: boolean
  autoExport: boolean
}

type RawPersistedSettingsState = {
  notifications?: unknown
  autoExport?: unknown
}

function normalizePersistedSettings(
  value: unknown
): PersistedSettingsState {
  const raw = (value ?? null) as RawPersistedSettingsState | null

  return {
    notifications:
      typeof raw?.notifications === "boolean" ? raw.notifications : false,
    autoExport:
      typeof raw?.autoExport === "boolean" ? raw.autoExport : false,
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: false,
      autoExport: false,

      setNotifications: (value: boolean) =>
        set({ notifications: value }),

      setAutoExport: (value: boolean) =>
        set({ autoExport: value }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState: unknown) => {
        return normalizePersistedSettings(persistedState)
      },
      partialize: (state): PersistedSettingsState => ({
        notifications: state.notifications,
        autoExport: state.autoExport,
      }),
    }
  )
)