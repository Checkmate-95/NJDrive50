import { useSyncExternalStore } from "react"
import {
  getSolarWindowForDate,
  isNightDrive,
} from "../engine/solarEngine"

import type { SolarWindow } from "../engine/solarEngine"

/* -------------------------------------------------------
   SOLAR + ACTIVE DRIVE STATE
------------------------------------------------------- */

export type SolarState = {
  solarWindow: SolarWindow | null
  isNightEligible: boolean | null
}

export type DriveState = {
  latitude: number | null
  longitude: number | null
  currentDriveStart: Date | null
  solar: SolarState
}

const EMPTY_DRIVE_STATE: DriveState = {
  latitude: null,
  longitude: null,
  currentDriveStart: null,
  solar: {
    solarWindow: null,
    isNightEligible: null,
  },
}

let driveState: DriveState = EMPTY_DRIVE_STATE

const DRIVE_STATE_EVENT = "njdrive50-drive-state-change"

function isBrowser() {
  return typeof window !== "undefined"
}

export function getDriveState(): DriveState {
  return driveState
}

function getDriveStateServerSnapshot(): DriveState {
  return EMPTY_DRIVE_STATE
}

export function updateSolarForDrive(
  latitude: number,
  longitude: number,
  startTime: Date
): void {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !(startTime instanceof Date) ||
    Number.isNaN(startTime.getTime())
  ) {
    return
  }

  const solarWindow = getSolarWindowForDate(latitude, longitude, startTime)
  const isNightEligible = isNightDrive(startTime, solarWindow)

  driveState = {
    ...driveState,
    latitude,
    longitude,
    currentDriveStart: startTime,
    solar: {
      solarWindow,
      isNightEligible,
    },
  }

  if (isBrowser()) {
    window.dispatchEvent(new Event(DRIVE_STATE_EVENT))
  }
}

function subscribeDriveState(listener: () => void) {
  if (!isBrowser()) {
    return () => {}
  }

  const onChange = () => listener()
  window.addEventListener(DRIVE_STATE_EVENT, onChange)

  return () => {
    window.removeEventListener(DRIVE_STATE_EVENT, onChange)
  }
}

export function useDriveState() {
  return useSyncExternalStore(
    subscribeDriveState,
    getDriveState,
    getDriveStateServerSnapshot
  )
}

/* -------------------------------------------------------
   DRIVE HISTORY (PERSISTENT + REACTIVE)
------------------------------------------------------- */

const DRIVE_HISTORY_STORAGE_KEY = "njdrive50_history"
const DRIVE_HISTORY_EVENT = "njdrive50-history-change"

export type RouteCoord = {
  lat: number
  lng: number
}

export type MilesSource = "routes-api" | "gps-accumulated"
export type NightCalcMode = "estimated" | "solar" | "manual" | "verified"
export type DriveSource = "timer" | "manual"

export type DriveEntry = {
  id: string
  startTime: string
  endTime: string

  totalDurationHours: number
  dayDurationHours: number
  nightDurationHours: number
  verifiedNightDurationHours?: number
  nightCalcMode?: NightCalcMode
  source?: DriveSource

  miles: number
  milesSource?: MilesSource

  startLatitude?: number | null
  startLongitude?: number | null

  weather?: string | null
  notes?: string
  teenPhoto?: string
  routeCoords?: RouteCoord[]
}

let driveHistory: DriveEntry[] = []
let cachedSnapshot: DriveEntry[] = []

function trimString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseValidDateString(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const timestamp = Date.parse(trimmed)
  return Number.isFinite(timestamp) ? trimmed : null
}

function normalizeRouteCoords(value: unknown): RouteCoord[] | undefined {
  if (!Array.isArray(value)) return undefined

  const coords = value
    .filter(
      (item): item is RouteCoord =>
        !!item &&
        typeof item === "object" &&
        typeof (item as RouteCoord).lat === "number" &&
        typeof (item as RouteCoord).lng === "number" &&
        Number.isFinite((item as RouteCoord).lat) &&
        Number.isFinite((item as RouteCoord).lng)
    )
    .map((coord) => ({ lat: coord.lat, lng: coord.lng }))

  return coords.length > 0 ? coords : undefined
}

function normalizeDriveEntry(value: unknown): DriveEntry | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Partial<DriveEntry>

  const id = trimString(raw.id)
  const startTime = parseValidDateString(raw.startTime)
  const endTime = parseValidDateString(raw.endTime)

  if (
    !id ||
    !startTime ||
    !endTime ||
    !Number.isFinite(raw.totalDurationHours) ||
    !Number.isFinite(raw.dayDurationHours) ||
    !Number.isFinite(raw.nightDurationHours) ||
    !Number.isFinite(raw.miles)
  ) {
    return null
  }

  const totalDurationHours = Math.max(0, raw.totalDurationHours as number)
  let dayDurationHours = Math.max(0, raw.dayDurationHours as number)
  let nightDurationHours = Math.max(0, raw.nightDurationHours as number)

  const bucketSum = dayDurationHours + nightDurationHours
  if (bucketSum > totalDurationHours && bucketSum > 0) {
    const scale = totalDurationHours / bucketSum
    dayDurationHours = dayDurationHours * scale
    nightDurationHours = nightDurationHours * scale
  }

  const milesSource: MilesSource | undefined =
    raw.milesSource === "routes-api" || raw.milesSource === "gps-accumulated"
      ? raw.milesSource
      : undefined

  const nightCalcMode: NightCalcMode | undefined =
    raw.nightCalcMode === "estimated" ||
    raw.nightCalcMode === "solar" ||
    raw.nightCalcMode === "manual" ||
    raw.nightCalcMode === "verified"
      ? raw.nightCalcMode
      : undefined

  const source: DriveSource | undefined =
    raw.source === "timer" || raw.source === "manual"
      ? raw.source
      : undefined

  const verifiedNightDurationHours =
    Number.isFinite(raw.verifiedNightDurationHours)
      ? Math.max(0, raw.verifiedNightDurationHours as number)
      : undefined

  const startLatitude =
    Number.isFinite(raw.startLatitude) ? (raw.startLatitude as number) : null
  const startLongitude =
    Number.isFinite(raw.startLongitude) ? (raw.startLongitude as number) : null

  return {
    id,
    startTime,
    endTime,

    totalDurationHours,
    dayDurationHours,
    nightDurationHours,
    verifiedNightDurationHours,
    nightCalcMode,
    source,

    miles: Math.max(0, raw.miles as number),
    milesSource,

    startLatitude,
    startLongitude,

    weather: raw.weather == null ? null : trimString(raw.weather) ?? null,
    notes: trimString(raw.notes),
    teenPhoto: trimString(raw.teenPhoto),
    routeCoords: normalizeRouteCoords(raw.routeCoords),
  }
}

function loadHistoryFromStorage(): void {
  if (!isBrowser()) {
    driveHistory = []
    cachedSnapshot = []
    return
  }

  try {
    const raw = localStorage.getItem(DRIVE_HISTORY_STORAGE_KEY)

    if (!raw) {
      driveHistory = []
      cachedSnapshot = []
      return
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      driveHistory = []
      cachedSnapshot = []
      return
    }

    driveHistory = parsed
      .map(normalizeDriveEntry)
      .filter((entry): entry is DriveEntry => entry !== null)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

    cachedSnapshot = [...driveHistory]
  } catch {
    driveHistory = []
    cachedSnapshot = []
  }
}

function saveHistoryToStorage(): void {
  if (!isBrowser()) return

  try {
    localStorage.setItem(DRIVE_HISTORY_STORAGE_KEY, JSON.stringify(driveHistory))
    cachedSnapshot = [...driveHistory]
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  } catch {
    // storage may be unavailable
  }
}

loadHistoryFromStorage()

/* -------------------------------------------------------
   PUBLIC API
------------------------------------------------------- */

export function addDriveToHistory(entry: DriveEntry): void {
  const normalized = normalizeDriveEntry(entry)
  if (!normalized) return

  const existingIds = new Set(driveHistory.map((e) => e.id))
  if (existingIds.has(normalized.id)) return

  driveHistory = [...driveHistory, normalized].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  )
  saveHistoryToStorage()
}

export const saveDrive = addDriveToHistory

export function getDriveHistory(): DriveEntry[] {
  return cachedSnapshot
}

function getDriveHistoryServerSnapshot(): DriveEntry[] {
  return []
}

/* -------------------------------------------------------
   EDIT SUPPORT
------------------------------------------------------- */

export function updateDriveInHistory(updated: DriveEntry): void {
  const normalized = normalizeDriveEntry(updated)
  if (!normalized) return

  const existingIndex = driveHistory.findIndex((entry) => entry.id === normalized.id)
  if (existingIndex === -1) return

  driveHistory = driveHistory
    .map((entry) => (entry.id === normalized.id ? normalized : entry))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  saveHistoryToStorage()
}

export function replaceDriveHistory(next: DriveEntry[]): void {
  driveHistory = next
    .map(normalizeDriveEntry)
    .filter((entry): entry is DriveEntry => entry !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  saveHistoryToStorage()
}

/* -------------------------------------------------------
   DELETE SUPPORT
------------------------------------------------------- */

export function deleteDriveEntry(id: string): void {
  const nextHistory = driveHistory.filter((entry) => entry.id !== id)
  if (nextHistory.length === driveHistory.length) return

  driveHistory = nextHistory
  saveHistoryToStorage()
}

/* -------------------------------------------------------
   REACTIVE HISTORY HOOK
------------------------------------------------------- */

function subscribeHistory(listener: () => void) {
  if (!isBrowser()) {
    return () => {}
  }

  const onCustomEvent = () => listener()

  const onStorageEvent = (e: StorageEvent) => {
    if (e.key === DRIVE_HISTORY_STORAGE_KEY) {
      loadHistoryFromStorage()
      listener()
    }
  }

  window.addEventListener(DRIVE_HISTORY_EVENT, onCustomEvent)
  window.addEventListener("storage", onStorageEvent)

  return () => {
    window.removeEventListener(DRIVE_HISTORY_EVENT, onCustomEvent)
    window.removeEventListener("storage", onStorageEvent)
  }
}

export function useDriveHistory() {
  return useSyncExternalStore(
    subscribeHistory,
    getDriveHistory,
    getDriveHistoryServerSnapshot
  )
}