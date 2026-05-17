// src/state/profileStore.ts
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

let cachedTeenPhoto: string | null = null
let cachedProfileSnapshot: Profile = freezeProfile({ ...defaultProfile })

function freezeProfile(profile: Profile): Profile {
  return isDev ? Object.freeze(profile) : profile
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
  if (!value || typeof value !== "object") return { ...defaultProfile }

  const raw = value as Record<string, unknown>

  return {
    teenName: typeof raw.teenName === "string" ? raw.teenName : "",
    parentName: typeof raw.parentName === "string" ? raw.parentName : "",
    teenAge: normalizeTeenAge(raw.teenAge),
    carMake: typeof raw.carMake === "string" ? raw.carMake : "",
    carModel: typeof raw.carModel === "string" ? raw.carModel : "",
    carYear: normalizeCarYear(raw.carYear),
  }
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
  try {
    cachedTeenPhoto = localStorage.getItem(PHOTO_KEY)
    return cachedTeenPhoto
  } catch {
    cachedTeenPhoto = null
    return cachedTeenPhoto
  }
}

function loadProfileFromStorage(): Profile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) {
      cachedProfileSnapshot = freezeProfile({ ...defaultProfile })
      return cachedProfileSnapshot
    }

    const parsed: unknown = JSON.parse(raw)
    const normalized = normalizeProfile(parsed)
    cachedProfileSnapshot = freezeProfile(normalized)
    return cachedProfileSnapshot
  } catch {
    cachedProfileSnapshot = freezeProfile({ ...defaultProfile })
    return cachedProfileSnapshot
  }
}

loadTeenPhotoFromStorage()
loadProfileFromStorage()

export function setTeenPhoto(url: string): boolean {
  try {
    localStorage.setItem(PHOTO_KEY, url)
    cachedTeenPhoto = url
    emitPhotoChange()
    return true
  } catch {
    return false
  }
}

export function clearTeenPhoto(): boolean {
  try {
    localStorage.removeItem(PHOTO_KEY)
    cachedTeenPhoto = null
    emitPhotoChange()
    return true
  } catch {
    return false
  }
}

export function getTeenPhoto(): string | null {
  return cachedTeenPhoto
}

const defaultPhoto = (): string | null => null

function subscribePhoto(listener: () => void) {
  if (typeof window === "undefined") return () => {}

  const onCustom = () => listener()
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
  return useSyncExternalStore(subscribePhoto, getTeenPhoto, defaultPhoto)
}

export function getProfile(): Profile {
  return cachedProfileSnapshot
}

export function setProfile(profile: Profile): boolean {
  try {
    const normalized = normalizeProfile(profile)
    localStorage.setItem(PROFILE_KEY, JSON.stringify(normalized))
    cachedProfileSnapshot = freezeProfile(normalized)
    emitProfileChange()
    return true
  } catch {
    return false
  }
}

export function clearProfile(): boolean {
  try {
    localStorage.removeItem(PROFILE_KEY)
    cachedProfileSnapshot = freezeProfile({ ...defaultProfile })
    emitProfileChange()
    return true
  } catch {
    return false
  }
}

export function isProfileComplete(profile: Profile): boolean {
  return profile.teenName.trim().length > 0
}

const defaultProfileSnapshot = (): Profile => freezeProfile({ ...defaultProfile })

function subscribeProfile(listener: () => void) {
  if (typeof window === "undefined") return () => {}

  const onCustom = () => listener()
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