// src/state/profileStore.ts
import { useSyncExternalStore } from "react"

const PHOTO_KEY = "njdrive50_teenPhoto"
const PROFILE_KEY = "njdrive50_profile"

const PHOTO_EVENT = "njdrive50-teen-photo-change"
const PROFILE_EVENT = "njdrive50-profile-change"

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

export function setTeenPhoto(url: string): boolean {
  try {
    localStorage.setItem(PHOTO_KEY, url)
    window.dispatchEvent(new Event(PHOTO_EVENT))
    return true
  } catch {
    return false
  }
}

export function getTeenPhoto(): string | null {
  try {
    return localStorage.getItem(PHOTO_KEY)
  } catch {
    return null
  }
}

const defaultPhoto = (): string | null => null

function subscribePhoto(listener: () => void) {
  if (typeof window === "undefined") return () => {}

  const onCustom = () => listener()
  const onStorage = (e: StorageEvent) => {
    if (e.key === PHOTO_KEY) listener()
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
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return { ...defaultProfile }

    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return { ...defaultProfile }

    const teenAge: number | null = (() => {
      const v = (parsed as Record<string, unknown>).teenAge
      if (v === null || v === undefined || v === "") return null
      const n = Number(v)
      return Number.isFinite(n) && n >= 14 && n <= 21 ? n : null
    })()

    const carYear: number | null = (() => {
      const v = (parsed as Record<string, unknown>).carYear
      if (v === null || v === undefined || v === "") return null
      const n = Number(v)
      const maxYear = new Date().getFullYear() + 1
      return Number.isFinite(n) && n >= 1900 && n <= maxYear ? n : null
    })()

    const p = parsed as Partial<Profile>

    return {
      teenName: typeof p.teenName === "string" ? p.teenName : "",
      parentName: typeof p.parentName === "string" ? p.parentName : "",
      teenAge,
      carMake: typeof p.carMake === "string" ? p.carMake : "",
      carModel: typeof p.carModel === "string" ? p.carModel : "",
      carYear,
    }
  } catch {
    return { ...defaultProfile }
  }
}

export function setProfile(profile: Profile): boolean {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new Event(PROFILE_EVENT))
    return true
  } catch {
    return false
  }
}

export function isProfileComplete(profile: Profile): boolean {
  return profile.teenName.trim().length > 0
}

const defaultProfileSnapshot = (): Profile => ({ ...defaultProfile })

function subscribeProfile(listener: () => void) {
  if (typeof window === "undefined") return () => {}

  const onCustom = () => listener()
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROFILE_KEY) listener()
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