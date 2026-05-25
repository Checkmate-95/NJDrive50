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

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

function getSafeLocalStorage() {
  if (typeof window === "undefined") return noopStorage

  try {
    const testKey = "__njdrive50_settings_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return window.localStorage
  } catch {
    return noopStorage
  }
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
      storage: createJSONStorage(getSafeLocalStorage),
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