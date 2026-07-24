// src/state/driveStore.ts

import { useSyncExternalStore } from "react"
import {
  getSolarWindowForDate,
  isNightDrive,
} from "../engine/solarEngine"

import type { SolarWindow } from "../engine/solarEngine"

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

let driveState: DriveState = {
  latitude: null,
  longitude: null,
  currentDriveStart: null,
  solar: {
    solarWindow: null,
    isNightEligible: null,
  },
}

const DRIVE_STATE_EVENT = "njdrive50-drive-state-change"

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof localStorage !== "undefined" &&
    typeof indexedDB !== "undefined"
  )
}

export function getDriveState(): DriveState {
  return driveState
}

export function updateSolarForDrive(
  latitude: number,
  longitude: number,
  startTime: Date
): void {
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

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_STATE_EVENT))
  }
}

function subscribeDriveState(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const onChange = () => listener()

  window.addEventListener(DRIVE_STATE_EVENT, onChange)

  return () => {
    window.removeEventListener(DRIVE_STATE_EVENT, onChange)
  }
}

export function useDriveState(): DriveState {
  return useSyncExternalStore(
    subscribeDriveState,
    getDriveState,
    getDriveState
  )
}

const DRIVE_HISTORY_STORAGE_KEY = "njdrive50_history"
const DRIVE_HISTORY_EVENT = "njdrive50-history-change"
const DRIVE_BLOB_DB = "njdrive50-drive-blobs"
const DRIVE_BLOB_STORE = "payloads"

export type RouteCoord = {
  lat: number
  lng: number
}

export type MilesSource = "routes-api" | "gps-accumulated"

export type NightCalcMode =
  | "estimated"
  | "solar"
  | "unverified"
  | "manual"
  | "verified"
  | "dmv-fixed"

export type DriveSource = "timer" | "manual"

export type DriveEntry = {
  id: string
  startTime: string
  endTime: string

  totalDurationHours: number
  dayDurationHours: number
  nightDurationHours: number

  // Time that was actively tracked but could not be verified from a valid
  // location and solar calculation. It never receives day/night credit.
  unverifiedDurationHours?: number

  verifiedNightDurationHours?: number
  nightCalcMode?: NightCalcMode
  isVerifiedDay?: boolean

  // Frozen at save time by ActiveDriveContent.tsx. These ranges are computed
  // ONCE using splitDriveBySolar and must never be recalculated on display.
  dayRangeStartMs?: number | null
  dayRangeEndMs?: number | null
  nightRangeStartMs?: number | null
  nightRangeEndMs?: number | null

  // True when no valid GPS coordinate was ever captured during the drive,
  // meaning solar classification (if any) used a fallback location.
  locationEstimated?: boolean

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

export type DriveBlobPayload = {
  teenPhoto?: string
  routeCoords?: RouteCoord[]
}

export type PersistedDriveEntry = Omit<
  DriveEntry,
  "teenPhoto" | "routeCoords"
> & {
  hasTeenPhoto?: boolean
  hasRouteCoords?: boolean
}

function safeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

/**
 * A drive is verified only when its solar classification supports verified
 * darkness, or when solar classification verified that all credited time was
 * daylight. Unverified time must never qualify a drive as verified.
 */
export function isDriveVerified(drive: DriveEntry): boolean {
  return (
    (drive.nightCalcMode === "solar" &&
      safeNumber(drive.verifiedNightDurationHours) > 0) ||
    drive.isVerifiedDay === true
  )
}

let driveHistory: DriveEntry[] = []
let cachedSnapshot: DriveEntry[] = []

function openDriveBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error("IndexedDB is not available in this environment."))
      return
    }

    const request = indexedDB.open(DRIVE_BLOB_DB, 1)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(DRIVE_BLOB_STORE)) {
        db.createObjectStore(DRIVE_BLOB_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveDriveBlobPayload(
  id: string,
  payload: DriveBlobPayload
): Promise<void> {
  const db = await openDriveBlobDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readwrite")

    tx.objectStore(DRIVE_BLOB_STORE).put(payload, id)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadDriveBlobPayload(
  id: string
): Promise<DriveBlobPayload | undefined> {
  const db = await openDriveBlobDb()

  return await new Promise<DriveBlobPayload | undefined>(
    (resolve, reject) => {
      const tx = db.transaction(DRIVE_BLOB_STORE, "readonly")
      const request = tx.objectStore(DRIVE_BLOB_STORE).get(id)

      request.onsuccess = () => {
        resolve(request.result as DriveBlobPayload | undefined)
      }

      request.onerror = () => reject(request.error)
    }
  )
}

async function deleteDriveBlobPayload(id: string): Promise<void> {
  const db = await openDriveBlobDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readwrite")

    tx.objectStore(DRIVE_BLOB_STORE).delete(id)

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
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
        Number.isFinite((item as RouteCoord).lng) &&
        (item as RouteCoord).lat >= -90 &&
        (item as RouteCoord).lat <= 90 &&
        (item as RouteCoord).lng >= -180 &&
        (item as RouteCoord).lng <= 180
    )
    .map((coord) => ({
      lat: coord.lat,
      lng: coord.lng,
    }))

  return coords.length > 0 ? coords : undefined
}

function normalizeOptionalMs(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeDriveEntry(value: unknown): DriveEntry | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Partial<DriveEntry>

  const totalRaw = raw.totalDurationHours
  const dayRaw = raw.dayDurationHours
  const nightRaw = raw.nightDurationHours
  const milesRaw = raw.miles

  if (
    typeof raw.id !== "string" ||
    typeof raw.startTime !== "string" ||
    typeof raw.endTime !== "string" ||
    typeof totalRaw !== "number" ||
    !Number.isFinite(totalRaw) ||
    typeof dayRaw !== "number" ||
    !Number.isFinite(dayRaw) ||
    typeof nightRaw !== "number" ||
    !Number.isFinite(nightRaw) ||
    typeof milesRaw !== "number" ||
    !Number.isFinite(milesRaw)
  ) {
    return null
  }

  const totalDurationHours = Math.max(0, totalRaw)

  let dayDurationHours = Math.max(0, dayRaw)
  let nightDurationHours = Math.max(0, nightRaw)

  let unverifiedDurationHours =
    typeof raw.unverifiedDurationHours === "number" &&
    Number.isFinite(raw.unverifiedDurationHours)
      ? Math.max(0, raw.unverifiedDurationHours)
      : 0

  /*
   * Never allow the classified buckets to exceed total elapsed duration.
   * Old records without unverifiedDurationHours remain valid with a zero
   * unverified bucket.
   */
  const bucketSum =
    dayDurationHours +
    nightDurationHours +
    unverifiedDurationHours

  if (bucketSum > totalDurationHours && bucketSum > 0) {
    const scale = totalDurationHours / bucketSum

    dayDurationHours *= scale
    nightDurationHours *= scale
    unverifiedDurationHours *= scale
  }

  const milesSource: MilesSource | undefined =
    raw.milesSource === "routes-api" ||
    raw.milesSource === "gps-accumulated"
      ? raw.milesSource
      : undefined

  const nightCalcMode: NightCalcMode | undefined =
    raw.nightCalcMode === "estimated" ||
    raw.nightCalcMode === "solar" ||
    raw.nightCalcMode === "unverified" ||
    raw.nightCalcMode === "manual" ||
    raw.nightCalcMode === "verified" ||
    raw.nightCalcMode === "dmv-fixed"
      ? raw.nightCalcMode
      : undefined

  const source: DriveSource | undefined =
    raw.source === "timer" || raw.source === "manual"
      ? raw.source
      : undefined

  const verifiedNightDurationHours =
    typeof raw.verifiedNightDurationHours === "number" &&
    Number.isFinite(raw.verifiedNightDurationHours)
      ? Math.max(0, raw.verifiedNightDurationHours)
      : undefined

  const isVerifiedDay =
    typeof raw.isVerifiedDay === "boolean"
      ? raw.isVerifiedDay
      : undefined

  const startLatitude =
    typeof raw.startLatitude === "number" &&
    Number.isFinite(raw.startLatitude)
      ? raw.startLatitude
      : null

  const startLongitude =
    typeof raw.startLongitude === "number" &&
    Number.isFinite(raw.startLongitude)
      ? raw.startLongitude
      : null

  // NEW: solar ranges, frozen at save time. Missing/invalid values fall
  // back to null rather than throwing away the whole entry, since older
  // saved drives will not have these fields at all.
  const dayRangeStartMs = normalizeOptionalMs(raw.dayRangeStartMs)
  const dayRangeEndMs = normalizeOptionalMs(raw.dayRangeEndMs)
  const nightRangeStartMs = normalizeOptionalMs(raw.nightRangeStartMs)
  const nightRangeEndMs = normalizeOptionalMs(raw.nightRangeEndMs)

  // NEW: defaults to false for older entries saved before this field existed.
  const locationEstimated =
    typeof raw.locationEstimated === "boolean"
      ? raw.locationEstimated
      : false

  return {
    id: raw.id,
    startTime: raw.startTime,
    endTime: raw.endTime,

    totalDurationHours,
    dayDurationHours,
    nightDurationHours,
    unverifiedDurationHours,

    verifiedNightDurationHours,
    nightCalcMode,
    isVerifiedDay,

    dayRangeStartMs,
    dayRangeEndMs,
    nightRangeStartMs,
    nightRangeEndMs,
    locationEstimated,

    source,

    miles: Math.max(0, milesRaw),
    milesSource,

    startLatitude,
    startLongitude,

    weather: typeof raw.weather === "string" ? raw.weather : null,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,

    teenPhoto:
      typeof raw.teenPhoto === "string"
        ? raw.teenPhoto
        : undefined,

    routeCoords: normalizeRouteCoords(raw.routeCoords),
  }
}

function toPersistedDriveEntry(entry: DriveEntry): PersistedDriveEntry {
  return {
    id: entry.id,
    startTime: entry.startTime,
    endTime: entry.endTime,

    totalDurationHours: entry.totalDurationHours,
    dayDurationHours: entry.dayDurationHours,
    nightDurationHours: entry.nightDurationHours,
    unverifiedDurationHours: entry.unverifiedDurationHours,

    verifiedNightDurationHours: entry.verifiedNightDurationHours,
    nightCalcMode: entry.nightCalcMode,
    isVerifiedDay: entry.isVerifiedDay,

    dayRangeStartMs: entry.dayRangeStartMs,
    dayRangeEndMs: entry.dayRangeEndMs,
    nightRangeStartMs: entry.nightRangeStartMs,
    nightRangeEndMs: entry.nightRangeEndMs,
    locationEstimated: entry.locationEstimated,

    source: entry.source,

    miles: entry.miles,
    milesSource: entry.milesSource,

    startLatitude: entry.startLatitude,
    startLongitude: entry.startLongitude,

    weather: entry.weather,
    notes: entry.notes,

    hasTeenPhoto: !!entry.teenPhoto,
    hasRouteCoords: !!entry.routeCoords?.length,
  }
}

async function hydrateBlobFields(
  entries: PersistedDriveEntry[]
): Promise<DriveEntry[]> {
  const hydrated = await Promise.all(
    entries.map(async (entry) => {
      if (!entry.hasTeenPhoto && !entry.hasRouteCoords) {
        return entry as DriveEntry
      }

      const payload = await loadDriveBlobPayload(entry.id)

      return {
        ...entry,
        teenPhoto: payload?.teenPhoto,
        routeCoords: payload?.routeCoords,
      }
    })
  )

  return hydrated
}

async function loadHistoryFromStorage(): Promise<void> {
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

    const lightweight = parsed
      .map(normalizeDriveEntry)
      .filter((entry): entry is DriveEntry => entry !== null)
      .map(toPersistedDriveEntry)

    driveHistory = await hydrateBlobFields(lightweight)
    cachedSnapshot = [...driveHistory]
  } catch {
    driveHistory = []
    cachedSnapshot = []
  }
}

async function saveHistoryToStorage(): Promise<void> {
  if (!isBrowser()) {
    cachedSnapshot = [...driveHistory]
    return
  }

  try {
    await Promise.all(
      driveHistory.map(async (entry) => {
        await saveDriveBlobPayload(entry.id, {
          teenPhoto: entry.teenPhoto,
          routeCoords: entry.routeCoords,
        })
      })
    )

    const persisted = driveHistory.map(toPersistedDriveEntry)

    localStorage.setItem(
      DRIVE_HISTORY_STORAGE_KEY,
      JSON.stringify(persisted)
    )

    cachedSnapshot = [...driveHistory]

    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  } catch {
    cachedSnapshot = [...driveHistory]
  }
}

if (isBrowser()) {
  void loadHistoryFromStorage()
}

export function addDriveToHistory(entry: DriveEntry): void {
  const normalized = normalizeDriveEntry(entry)

  if (!normalized) return

  const existingIds = new Set(driveHistory.map((drive) => drive.id))

  if (existingIds.has(normalized.id)) return

  driveHistory = [...driveHistory, normalized]
  cachedSnapshot = [...driveHistory]

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  }

  void saveHistoryToStorage()
}

export const saveDrive = addDriveToHistory

export function getDriveHistory(): DriveEntry[] {
  return cachedSnapshot
}

export function updateDriveInHistory(updated: DriveEntry): void {
  const normalized = normalizeDriveEntry(updated)

  if (!normalized) return

  driveHistory = driveHistory.map((entry) =>
    entry.id === normalized.id ? normalized : entry
  )

  cachedSnapshot = [...driveHistory]

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  }

  void saveHistoryToStorage()
}

export function replaceDriveHistory(next: DriveEntry[]): void {
  driveHistory = next
    .map(normalizeDriveEntry)
    .filter((entry): entry is DriveEntry => entry !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  cachedSnapshot = [...driveHistory]

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  }

  void saveHistoryToStorage()
}

export function deleteDriveEntry(id: string): void {
  driveHistory = driveHistory.filter((entry) => entry.id !== id)
  cachedSnapshot = [...driveHistory]

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  }

  void deleteDriveBlobPayload(id)
  void saveHistoryToStorage()
}

function subscribeHistory(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const onCustomEvent = () => listener()

  const onStorageEvent = (event: StorageEvent) => {
    if (event.key === DRIVE_HISTORY_STORAGE_KEY) {
      void loadHistoryFromStorage().then(listener)
    }
  }

  window.addEventListener(DRIVE_HISTORY_EVENT, onCustomEvent)
  window.addEventListener("storage", onStorageEvent)

  return () => {
    window.removeEventListener(DRIVE_HISTORY_EVENT, onCustomEvent)
    window.removeEventListener("storage", onStorageEvent)
  }
}

export function useDriveHistory(): DriveEntry[] {
  return useSyncExternalStore(
    subscribeHistory,
    getDriveHistory,
    getDriveHistory
  )
}