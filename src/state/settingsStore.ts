// src/state/settingsStore.ts
import { create } from "zustand"
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware"
import { Preferences } from "@capacitor/preferences"

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

// ⭐ Capacitor Preferences-backed storage (native SharedPreferences/UserDefaults),
// with a safe localStorage fallback for browser/desktop testing.
function getSafeLocalStorage(): StateStorage {
  const noopStorage: StateStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }

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

const preferencesStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key: name })
      return value ?? null
    } catch {
      return getSafeLocalStorage().getItem(name)
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key: name, value })
    } catch {
      getSafeLocalStorage().setItem(name, value)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await Preferences.remove({ key: name })
    } catch {
      getSafeLocalStorage().removeItem(name)
    }
  },
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
      storage: createJSONStorage(() => preferencesStorage),
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