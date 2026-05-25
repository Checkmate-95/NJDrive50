import { useSyncExternalStore } from "react"

const PHOTO_KEY = "njdrive50_teenPhoto"
const PROFILE_KEY = "njdrive50_profile"

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
}

const defaultProfile: Profile = {
  teenName: "",
  parentName: "",
  teenAge: null,
  carMake: "",
  carModel: "",
  carYear: null,
}

function freezeProfile(profile: Profile): Profile {
  return isDev ? Object.freeze(profile) : profile
}

const EMPTY_PROFILE = freezeProfile({ ...defaultProfile })

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

function loadTeenPhotoFromStorage(): string | null {
  if (!canUseLocalStorage()) {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }

  try {
    cachedTeenPhoto = window.localStorage.getItem(PHOTO_KEY)
    return cachedTeenPhoto
  } catch {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }
}

function loadProfileFromStorage(): Profile {
  if (!canUseLocalStorage()) {
    cachedProfileSnapshot = EMPTY_PROFILE
    return cachedProfileSnapshot
  }

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)

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

if (canUseLocalStorage()) {
  loadTeenPhotoFromStorage()
  loadProfileFromStorage()
}

export function setTeenPhoto(url: string): boolean {
  if (!canUseLocalStorage()) return false

  const normalized = url.trim()

  if (!normalized) return false

  const isDataUrl = normalized.startsWith("data:")
  const isBlobUrl = normalized.startsWith("blob:")
  const isHttpUrl = /^https?:\/\//i.test(normalized)
  const isAppRelative = normalized.startsWith("/")

  if (isDataUrl || isBlobUrl || (!isHttpUrl && !isAppRelative)) {
    if (isDev) {
      console.warn("setTeenPhoto rejected non-persistable image value")
    }
    return false
  }

  try {
    window.localStorage.setItem(PHOTO_KEY, normalized)
    cachedTeenPhoto = normalized
    emitPhotoChange()
    return true
  } catch {
    if (isDev) {
      console.warn("Failed to persist teen photo to localStorage")
    }
    return false
  }
}

export function clearTeenPhoto(): boolean {
  if (!canUseLocalStorage()) return false

  try {
    window.localStorage.removeItem(PHOTO_KEY)
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
    if (e.key === PHOTO_KEY) {
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

export function setProfile(profile: Profile): boolean {
  if (!canUseLocalStorage()) return false

  try {
    const normalized = normalizeProfile(profile)
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized))
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
  if (!canUseLocalStorage()) return false

  try {
    window.localStorage.removeItem(PROFILE_KEY)
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
    if (e.key === PROFILE_KEY) {
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