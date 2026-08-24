// src/state/driveStore.ts
import { useSyncExternalStore } from "react"

const DRIVE_HISTORY_STORAGE_KEY_PREFIX = "njdrive50_history"
const DRIVE_HISTORY_EVENT = "njdrive50-history-change"
const DRIVE_BLOB_DB = "njdrive50-drive-blobs"
const DRIVE_BLOB_STORE = "payloads"

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof localStorage !== "undefined" &&
    typeof indexedDB !== "undefined"
  )
}

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

  unverifiedDurationHours?: number

  verifiedNightDurationHours?: number
  nightCalcMode?: NightCalcMode
  isVerifiedDay?: boolean
  needsReview?: boolean

  dayRangeStartMs?: number | null
  dayRangeEndMs?: number | null
  nightRangeStartMs?: number | null
  nightRangeEndMs?: number | null

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

export function isDriveVerified(drive: DriveEntry): boolean {
  if (drive.needsReview === true) return false

  return (
    (drive.nightCalcMode === "solar" &&
      safeNumber(drive.verifiedNightDurationHours) > 0) ||
    drive.isVerifiedDay === true
  )
}

let activeUserId: string | null = null
let driveHistory: DriveEntry[] = []
let cachedSnapshot: DriveEntry[] = []

function getHistoryStorageKey(userId: string | null): string | null {
  if (!userId) return null
  return `${DRIVE_HISTORY_STORAGE_KEY_PREFIX}:${userId}`
}

function getBlobPayloadKey(
  userId: string | null,
  driveId: string
): string | null {
  if (!userId) return null
  return `${userId}:${driveId}`
}

function emitDriveHistoryChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRIVE_HISTORY_EVENT))
  }
}

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
  const blobKey = getBlobPayloadKey(activeUserId, id)
  if (!blobKey) return

  const db = await openDriveBlobDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readwrite")
    tx.objectStore(DRIVE_BLOB_STORE).put(payload, blobKey)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadDriveBlobPayload(
  id: string
): Promise<DriveBlobPayload | undefined> {
  const blobKey = getBlobPayloadKey(activeUserId, id)
  if (!blobKey) return undefined

  const db = await openDriveBlobDb()

  return new Promise<DriveBlobPayload | undefined>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readonly")
    const request = tx.objectStore(DRIVE_BLOB_STORE).get(blobKey)

    request.onsuccess = () => resolve(request.result as DriveBlobPayload)
    request.onerror = () => reject(request.error)
  })
}

async function deleteDriveBlobPayload(id: string): Promise<void> {
  const blobKey = getBlobPayloadKey(activeUserId, id)
  if (!blobKey) return

  const db = await openDriveBlobDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readwrite")
    tx.objectStore(DRIVE_BLOB_STORE).delete(blobKey)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function deleteAllDriveBlobPayloadsForUser(userId: string): Promise<void> {
  if (!isBrowser()) return

  const db = await openDriveBlobDb()
  const prefix = `${userId}:`

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DRIVE_BLOB_STORE, "readwrite")
    const store = tx.objectStore(DRIVE_BLOB_STORE)
    const request = store.openCursor()

    request.onsuccess = () => {
      const cursor = request.result

      if (!cursor) return

      if (
        typeof cursor.key === "string" &&
        cursor.key.startsWith(prefix)
      ) {
        cursor.delete()
      }

      cursor.continue()
    }

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
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
    .map((coord) => ({ lat: coord.lat, lng: coord.lng }))

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

  let verifiedNightDurationHours =
    typeof raw.verifiedNightDurationHours === "number" &&
    Number.isFinite(raw.verifiedNightDurationHours)
      ? Math.max(0, raw.verifiedNightDurationHours)
      : undefined

  const bucketSum =
    dayDurationHours + nightDurationHours + unverifiedDurationHours

  if (bucketSum > totalDurationHours && bucketSum > 0) {
    const scale = totalDurationHours / bucketSum

    dayDurationHours *= scale
    nightDurationHours *= scale
    unverifiedDurationHours *= scale

    if (verifiedNightDurationHours !== undefined) {
      verifiedNightDurationHours *= scale
    }
  }

  const milesSource =
    raw.milesSource === "routes-api" ||
    raw.milesSource === "gps-accumulated"
      ? raw.milesSource
      : undefined

  const nightCalcMode =
    raw.nightCalcMode === "estimated" ||
    raw.nightCalcMode === "solar" ||
    raw.nightCalcMode === "unverified" ||
    raw.nightCalcMode === "manual" ||
    raw.nightCalcMode === "verified" ||
    raw.nightCalcMode === "dmv-fixed"
      ? raw.nightCalcMode
      : undefined

  const source =
    raw.source === "timer" || raw.source === "manual"
      ? raw.source
      : undefined

  const isVerifiedDay =
    typeof raw.isVerifiedDay === "boolean"
      ? raw.isVerifiedDay
      : undefined

  const needsReview =
    typeof raw.needsReview === "boolean" ? raw.needsReview : false

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

  const dayRangeStartMs = normalizeOptionalMs(raw.dayRangeStartMs)
  const dayRangeEndMs = normalizeOptionalMs(raw.dayRangeEndMs)
  const nightRangeStartMs = normalizeOptionalMs(raw.nightRangeStartMs)
  const nightRangeEndMs = normalizeOptionalMs(raw.nightRangeEndMs)

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
    needsReview,

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
      typeof raw.teenPhoto === "string" ? raw.teenPhoto : undefined,

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
    needsReview: entry.needsReview,

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
  return Promise.all(
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
}

async function loadHistoryFromStorage(): Promise<void> {
  if (!isBrowser() || !activeUserId) {
    driveHistory = []
    cachedSnapshot = []
    return
  }

  const key = getHistoryStorageKey(activeUserId)

  if (!key) {
    driveHistory = []
    cachedSnapshot = []
    return
  }

  try {
    const raw = localStorage.getItem(key)

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

async function saveHistoryToStorage(
  changedEntry?: DriveEntry
): Promise<void> {
  if (!isBrowser() || !activeUserId) {
    cachedSnapshot = [...driveHistory]
    return
  }

  const key = getHistoryStorageKey(activeUserId)

  if (!key) {
    cachedSnapshot = [...driveHistory]
    return
  }

  try {
    if (changedEntry) {
      await saveDriveBlobPayload(changedEntry.id, {
        teenPhoto: changedEntry.teenPhoto,
        routeCoords: changedEntry.routeCoords,
      })
    }

    const persisted = driveHistory.map(toPersistedDriveEntry)

    localStorage.setItem(key, JSON.stringify(persisted))
    cachedSnapshot = [...driveHistory]
    emitDriveHistoryChange()
  } catch {
    cachedSnapshot = [...driveHistory]
  }
}

export async function setActiveDriveUser(
  userId: string | null
): Promise<void> {
  activeUserId = userId

  if (!activeUserId) {
    driveHistory = []
    cachedSnapshot = []
    emitDriveHistoryChange()
    return
  }

  // Do not migrate old global `njdrive50_history` data into a user account.
  // Legacy global history is ambiguous on shared devices and could belong
  // to a different person who previously used the app.
  await loadHistoryFromStorage()
  emitDriveHistoryChange()
}

export function resetDriveStore(): void {
  activeUserId = null
  driveHistory = []
  cachedSnapshot = []
  emitDriveHistoryChange()
}

export function getActiveDriveUser(): string | null {
  return activeUserId
}

export function addDriveToHistory(entry: DriveEntry): void {
  if (!activeUserId) return

  const normalized = normalizeDriveEntry(entry)
  if (!normalized) return

  const existingIds = new Set(driveHistory.map((drive) => drive.id))
  if (existingIds.has(normalized.id)) return

  driveHistory = [...driveHistory, normalized]
  cachedSnapshot = [...driveHistory]
  emitDriveHistoryChange()

  void saveHistoryToStorage(normalized)
}

export const saveDrive = addDriveToHistory

export function getDriveHistory(): DriveEntry[] {
  return cachedSnapshot
}

export function updateDriveInHistory(updated: DriveEntry): void {
  if (!activeUserId) return

  const normalized = normalizeDriveEntry(updated)
  if (!normalized) return

  driveHistory = driveHistory.map((entry) =>
    entry.id === normalized.id ? normalized : entry
  )

  cachedSnapshot = [...driveHistory]
  emitDriveHistoryChange()

  void saveHistoryToStorage(normalized)
}

export function replaceDriveHistory(next: DriveEntry[]): void {
  if (!activeUserId) {
    driveHistory = []
    cachedSnapshot = []
    emitDriveHistoryChange()
    return
  }

  driveHistory = next
    .map(normalizeDriveEntry)
    .filter((entry): entry is DriveEntry => entry !== null)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  cachedSnapshot = [...driveHistory]
  emitDriveHistoryChange()

  void saveHistoryToStorage()
}

export function clearDriveHistory(options?: {
  removePersistedData?: boolean
}): void {
  const userId = activeUserId

  driveHistory = []
  cachedSnapshot = []
  emitDriveHistoryChange()

  if (!options?.removePersistedData || !userId || !isBrowser()) {
    void saveHistoryToStorage()
    return
  }

  const key = getHistoryStorageKey(userId)

  if (key) {
    try {
      localStorage.removeItem(key)
    } catch {
      // Keep in-memory state cleared even if storage removal fails.
    }
  }

  void deleteAllDriveBlobPayloadsForUser(userId)
}

export function deleteDriveEntry(id: string): void {
  if (!activeUserId) return

  driveHistory = driveHistory.filter((entry) => entry.id !== id)
  cachedSnapshot = [...driveHistory]
  emitDriveHistoryChange()

  void deleteDriveBlobPayload(id)
  void saveHistoryToStorage()
}

function subscribeHistory(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const onCustomEvent = () => listener()

  const onStorageEvent = (event: StorageEvent) => {
    const activeKey = getHistoryStorageKey(activeUserId)

    if (event.key && activeKey && event.key === activeKey) {
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