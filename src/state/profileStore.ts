// src/state/profileStore.ts
import { useSyncExternalStore } from "react"

const PROFILE_KEY_PREFIX = "njdrive50_profile"
const PHOTO_KEY_PREFIX = "njdrive50_teenPhoto"

const PHOTO_EVENT = "njdrive50-teen-photo-change"
const PROFILE_EVENT = "njdrive50-profile-change"

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV

export type Profile = {
  teenName: string
  parentName: string
  teenAge: number | null
  carMake: string
  carModel: string
  carYear: number | null
  isOnboarded: boolean
  profileComplete: boolean
}

const defaultProfile: Profile = {
  teenName: "",
  parentName: "",
  teenAge: null,
  carMake: "",
  carModel: "",
  carYear: null,
  isOnboarded: false,
  profileComplete: false,
}

// ⭐ Always freeze — this object is shared across every "empty" read.
// Freezing only in dev left production callers able to silently mutate
// the shared default, corrupting the empty state app-wide.
function freezeProfile(profile: Profile): Profile {
  return Object.freeze(profile)
}

const EMPTY_PROFILE = freezeProfile({ ...defaultProfile })

let activeUserId: string | null = null
let cachedTeenPhoto: string | null = null
let cachedProfileSnapshot: Profile = EMPTY_PROFILE

function canUseLocalStorage() {
  if (typeof window === "undefined") return false

  try {
    const testKey = "__njdrive50_profile_test__"
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function normalizeTeenAge(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 14 && n <= 21 ? n : null
}

function normalizeCarYear(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  const maxYear = new Date().getFullYear() + 1
  return Number.isFinite(n) && n >= 1900 && n <= maxYear ? n : null
}

function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== "object") {
    return EMPTY_PROFILE
  }

  const raw = value as Record<string, unknown>

  return freezeProfile({
    teenName: normalizeString(raw.teenName),
    parentName: normalizeString(raw.parentName),
    teenAge: normalizeTeenAge(raw.teenAge),
    carMake: normalizeString(raw.carMake),
    carModel: normalizeString(raw.carModel),
    carYear: normalizeCarYear(raw.carYear),
    isOnboarded: Boolean(raw.isOnboarded),
    profileComplete: Boolean(raw.profileComplete),
  })
}

function emitPhotoChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PHOTO_EVENT))
  }
}

function emitProfileChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_EVENT))
  }
}

function getProfileStorageKey(userId: string | null): string | null {
  if (!userId) return null
  return `${PROFILE_KEY_PREFIX}:${userId}`
}

function getPhotoStorageKey(userId: string | null): string | null {
  if (!userId) return null
  return `${PHOTO_KEY_PREFIX}:${userId}`
}

function loadTeenPhotoFromStorage(): string | null {
  if (!canUseLocalStorage() || !activeUserId) {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }

  const key = getPhotoStorageKey(activeUserId)
  if (!key) {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }

  try {
    cachedTeenPhoto = window.localStorage.getItem(key)
    return cachedTeenPhoto
  } catch {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }
}

function loadProfileFromStorage(): Profile {
  if (!canUseLocalStorage() || !activeUserId) {
    cachedProfileSnapshot = EMPTY_PROFILE
    return cachedProfileSnapshot
  }

  const key = getProfileStorageKey(activeUserId)
  if (!key) {
    cachedProfileSnapshot = EMPTY_PROFILE
    return cachedProfileSnapshot
  }

  try {
    const raw = window.localStorage.getItem(key)

    if (!raw) {
      cachedProfileSnapshot = EMPTY_PROFILE
      return cachedProfileSnapshot
    }

    const parsed: unknown = JSON.parse(raw)
    cachedProfileSnapshot = normalizeProfile(parsed)
    return cachedProfileSnapshot
  } catch {
    cachedProfileSnapshot = EMPTY_PROFILE
    return cachedProfileSnapshot
  }
}

function migrateLegacyProfileIfNeeded(userId: string): void {
  if (!canUseLocalStorage()) return

  const scopedProfileKey = getProfileStorageKey(userId)
  const scopedPhotoKey = getPhotoStorageKey(userId)

  if (!scopedProfileKey || !scopedPhotoKey) return

  try {
    const hasScopedProfile = window.localStorage.getItem(scopedProfileKey)
    const legacyProfileRaw = window.localStorage.getItem(PROFILE_KEY_PREFIX)

    if (!hasScopedProfile && legacyProfileRaw) {
      const migratedProfile = normalizeProfile(JSON.parse(legacyProfileRaw))
      window.localStorage.setItem(scopedProfileKey, JSON.stringify(migratedProfile))

      // ⭐ Remove the legacy key so a different user signing in on the
      // same device doesn't also inherit this profile.
      window.localStorage.removeItem(PROFILE_KEY_PREFIX)

      if (isDev) {
        console.log("[profileStore] Migrated legacy global profile to scoped key")
      }
    }
  } catch {
    // silent fail
  }

  try {
    const hasScopedPhoto = window.localStorage.getItem(scopedPhotoKey)
    const legacyPhotoRaw = window.localStorage.getItem(PHOTO_KEY_PREFIX)

    if (!hasScopedPhoto && legacyPhotoRaw) {
      window.localStorage.setItem(scopedPhotoKey, legacyPhotoRaw)

      // ⭐ Same cleanup for the legacy photo key.
      window.localStorage.removeItem(PHOTO_KEY_PREFIX)

      if (isDev) {
        console.log("[profileStore] Migrated legacy global teen photo to scoped key")
      }
    }
  } catch {
    // silent fail
  }

  const profile = loadProfileFromStorage()
  if (profile.teenName.length > 0 && !profile.isOnboarded) {
    const migrated = freezeProfile({
      ...profile,
      isOnboarded: true,
      profileComplete: true,
    })

    try {
      window.localStorage.setItem(scopedProfileKey, JSON.stringify(migrated))
      cachedProfileSnapshot = migrated

      if (isDev) {
        console.log("[profileStore] Migrated existing scoped profile → isOnboarded: true")
      }
    } catch {
      // silent fail
    }
  }
}

export function setActiveProfileUser(userId: string | null): void {
  activeUserId = userId

  if (!activeUserId) {
    cachedTeenPhoto = null
    cachedProfileSnapshot = EMPTY_PROFILE
    emitPhotoChange()
    emitProfileChange()
    return
  }

  migrateLegacyProfileIfNeeded(activeUserId)
  loadTeenPhotoFromStorage()
  loadProfileFromStorage()
  emitPhotoChange()
  emitProfileChange()
}

export function resetProfileStore(): void {
  activeUserId = null
  cachedTeenPhoto = null
  cachedProfileSnapshot = EMPTY_PROFILE
  emitPhotoChange()
  emitProfileChange()
}

export function getActiveProfileUser(): string | null {
  return activeUserId
}

export function setTeenPhoto(url: string): boolean {
  const normalized = url.trim()

  if (!activeUserId || !canUseLocalStorage()) return false

  const key = getPhotoStorageKey(activeUserId)
  if (!key) return false

  if (!normalized) {
    try {
      window.localStorage.removeItem(key)
      cachedTeenPhoto = null
      emitPhotoChange()
      return true
    } catch {
      if (isDev) console.warn("Failed to clear teen photo from localStorage")
      return false
    }
  }

  if (normalized.startsWith("blob:")) {
    if (isDev) console.warn("setTeenPhoto rejected blob: URL — not persistable across sessions")
    return false
  }

  const isDataUrl = normalized.startsWith("data:")
  const isHttpUrl = /^https?:\/\//i.test(normalized)
  const isAppRelative = normalized.startsWith("/")

  if (!isDataUrl && !isHttpUrl && !isAppRelative) {
    if (isDev) {
      console.warn(
        "setTeenPhoto rejected unrecognized URL format:",
        normalized.slice(0, 40)
      )
    }
    return false
  }

  try {
    window.localStorage.setItem(key, normalized)
    cachedTeenPhoto = normalized
    emitPhotoChange()
    return true
  } catch {
    if (isDev) console.warn("Failed to persist teen photo to localStorage")
    return false
  }
}

export function clearTeenPhoto(): boolean {
  if (!activeUserId || !canUseLocalStorage()) return false

  const key = getPhotoStorageKey(activeUserId)
  if (!key) return false

  try {
    window.localStorage.removeItem(key)
    cachedTeenPhoto = null
    emitPhotoChange()
    return true
  } catch {
    if (isDev) {
      console.warn("Failed to clear teen photo from localStorage")
    }
    return false
  }
}

export function getTeenPhoto(): string | null {
  return cachedTeenPhoto
}

function defaultPhotoSnapshot(): string | null {
  return null
}

function subscribePhoto(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const onCustom = () => {
    listener()
  }

  const onStorage = (e: StorageEvent) => {
    const activeKey = getPhotoStorageKey(activeUserId)
    if (e.key && activeKey && e.key === activeKey) {
      loadTeenPhotoFromStorage()
      listener()
    }
  }

  window.addEventListener(PHOTO_EVENT, onCustom)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(PHOTO_EVENT, onCustom)
    window.removeEventListener("storage", onStorage)
  }
}

export function useTeenPhoto() {
  return useSyncExternalStore(subscribePhoto, getTeenPhoto, defaultPhotoSnapshot)
}

export function getProfile(): Profile {
  return cachedProfileSnapshot
}

export function hasProfile(): boolean {
  const p = cachedProfileSnapshot
  return p.teenName.length > 0
}

export function setProfile(profile: Profile): boolean {
  if (!activeUserId || !canUseLocalStorage()) return false

  const key = getProfileStorageKey(activeUserId)
  if (!key) return false

  try {
    const normalized = normalizeProfile(profile)
    window.localStorage.setItem(key, JSON.stringify(normalized))
    cachedProfileSnapshot = normalized
    emitProfileChange()
    return true
  } catch {
    if (isDev) {
      console.warn("Failed to persist profile to localStorage")
    }
    return false
  }
}

export function clearProfile(): boolean {
  if (!activeUserId || !canUseLocalStorage()) return false

  const key = getProfileStorageKey(activeUserId)
  if (!key) return false

  try {
    window.localStorage.removeItem(key)
    cachedProfileSnapshot = EMPTY_PROFILE
    emitProfileChange()
    return true
  } catch {
    if (isDev) {
      console.warn("Failed to clear profile from localStorage")
    }
    return false
  }
}

export function isProfileComplete(profile: Profile): boolean {
  return profile.teenName.length > 0
}

function defaultProfileSnapshot(): Profile {
  return EMPTY_PROFILE
}

function subscribeProfile(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {}
  }

  const onCustom = () => {
    listener()
  }

  const onStorage = (e: StorageEvent) => {
    const activeKey = getProfileStorageKey(activeUserId)
    if (e.key && activeKey && e.key === activeKey) {
      loadProfileFromStorage()
      listener()
    }
  }

  window.addEventListener(PROFILE_EVENT, onCustom)
  window.addEventListener("storage", onStorage)

  return () => {
    window.removeEventListener(PROFILE_EVENT, onCustom)
    window.removeEventListener("storage", onStorage)
  }
}

export function useProfile() {
  return useSyncExternalStore(
    subscribeProfile,
    getProfile,
    defaultProfileSnapshot
  )
}