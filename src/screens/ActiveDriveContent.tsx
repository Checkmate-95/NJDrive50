// src/screens/ActiveDriveContent.tsx

import { useCallback, useEffect, useRef, useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  MoonIcon,
  SunIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/solid"
import { Capacitor } from "@capacitor/core"
import { Geolocation } from "@capacitor/geolocation"

import BackgroundLocationDisclosure from "../components/BackgroundLocationDisclosure"
import { fetchWeather } from "../services/weather"

import {
  useActiveDriveStore,
  type RouteCoord,
  UNVERIFIED_GRACE_MS,
} from "../state/activeDriveStore"

import {
  splitDriveBySolar,
  getSolarWindowForDate,
  computeDayNightSplit,
} from "../engine/solarEngine"

import type { Screen } from "../App"
import { saveDrive } from "../state/driveStore"
import type { DriveEntry, NightCalcMode } from "../state/driveStore"

import DriveDashboard from "./DriveDashboard"

type ActiveDriveContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
  setCurrentDrive: Dispatch<SetStateAction<DriveEntry | null>>
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const ROUTE_TIMEOUT_MS = 8_000
const FS_NOTIFICATION_ID = 1001
const FS_CHANNEL_ID = "njdrive50_drive"

let foregroundServiceStarted = false

function safeNumber(value: unknown): number {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatTime(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000))
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}

function formatHours(hours: number): string {
  return `${Math.max(0, hours).toFixed(2)} hr`
}

function sameCoord(
  a: RouteCoord | null | undefined,
  b: RouteCoord | null | undefined
): boolean {
  if (!a || !b) return false
  return a.lat === b.lat && a.lng === b.lng
}

function makeDriveId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `drive-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function composeAbortSignal(
  external?: AbortSignal,
  timeoutMs = ROUTE_TIMEOUT_MS
): { signal: AbortSignal; cleanup: () => void } {
  const AbortSignalCtor = globalThis.AbortSignal as
    | (typeof AbortSignal & {
        timeout?: (milliseconds: number) => AbortSignal
        any?: (signals: AbortSignal[]) => AbortSignal
      })
    | undefined

  if (
    AbortSignalCtor &&
    typeof AbortSignalCtor.timeout === "function" &&
    typeof AbortSignalCtor.any === "function"
  ) {
    const timeoutSignal = AbortSignalCtor.timeout(timeoutMs)

    return {
      signal: external
        ? AbortSignalCtor.any([external, timeoutSignal])
        : timeoutSignal,
      cleanup: () => {},
    }
  }

  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  const abortHandler = () => controller.abort()
  external?.addEventListener("abort", abortHandler, { once: true })

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId)
      external?.removeEventListener("abort", abortHandler)
    },
  }
}

async function getAccurateMileage(
  start: RouteCoord,
  end: RouteCoord,
  signal?: AbortSignal
): Promise<number | null> {
  if (!API_BASE_URL) return null

  try {
    const { signal: requestSignal, cleanup } = composeAbortSignal(signal)

    try {
      const response = await fetch(`${API_BASE_URL}/api/computeRoutes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: requestSignal,
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: start.lat,
                longitude: start.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: end.lat,
                longitude: end.lng,
              },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          units: "IMPERIAL",
        }),
      })

      if (!response.ok) return null

      const data = await response.json()
      const meters = data?.routes?.[0]?.distanceMeters

      if (typeof meters !== "number" || !Number.isFinite(meters)) {
        return null
      }

      return meters / 1609.34
    } finally {
      cleanup()
    }
  } catch {
    return null
  }
}

async function ensureForegroundServiceChannel(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )

    await ForegroundService.createNotificationChannel({
      id: FS_CHANNEL_ID,
      name: "NJDrive50 Active Drive",
      description: "Keeps your active drive timer and location tracking running.",
      importance: 2,
    })
  } catch (error) {
    console.warn("[ForegroundService] Channel setup failed:", error)
  }
}

async function ensureForegroundServicePermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false

  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )

    const status = await ForegroundService.checkPermissions()

    if (status.display === "granted") {
      return true
    }

    const requested = await ForegroundService.requestPermissions()
    return requested.display === "granted"
  } catch (error) {
    console.warn("[ForegroundService] Permission check failed:", error)
    return false
  }
}

async function startForegroundService(body: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const allowed = await ensureForegroundServicePermission()

    if (!allowed) {
      console.warn("[ForegroundService] Notification permission not granted")
      foregroundServiceStarted = false
      return
    }

    await ensureForegroundServiceChannel()

    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )

    await ForegroundService.startForegroundService({
      id: FS_NOTIFICATION_ID,
      title: "NJDrive50 — Drive Active",
      body,
      smallIcon: "ic_launcher_foreground",
      silent: true,
      notificationChannelId: FS_CHANNEL_ID,
      serviceType: 8,
    })

    foregroundServiceStarted = true
  } catch (error) {
    console.warn("[ForegroundService] Unable to start:", error)
    foregroundServiceStarted = false
  }
}

async function updateForegroundService(body: string): Promise<void> {
  if (!Capacitor.isNativePlatform() || !foregroundServiceStarted) return

  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )

    await ForegroundService.updateForegroundService({
      id: FS_NOTIFICATION_ID,
      title: "NJDrive50 — Drive Active",
      body,
      smallIcon: "ic_launcher_foreground",
      notificationChannelId: FS_CHANNEL_ID,
    })
  } catch (error) {
    console.warn("[ForegroundService] Update failed:", error)
  }
}

async function stopForegroundService(): Promise<void> {
  foregroundServiceStarted = false

  if (!Capacitor.isNativePlatform()) return

  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )

    await ForegroundService.stopForegroundService()
  } catch (error) {
    console.warn("[ForegroundService] Stop failed:", error)
  }
}

function ActiveDriveContent({
  setScreen,
  setCurrentDrive,
}: ActiveDriveContentProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [isPreparingStop, setIsPreparingStop] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDisclosure, setShowDisclosure] = useState(false)
  const [isStartingDrive, setIsStartingDrive] = useState(false)

  const mountedRef = useRef(true)
  const watchIdRef = useRef<string | null>(null)
  const frozenSnapshotRef = useRef<Promise<DriveEntry | null> | null>(null)
  const snapshotAbortRef = useRef<AbortController | null>(null)
  const wasRunningBeforeStopRef = useRef(false)
  const locationRequestRef = useRef<Promise<RouteCoord | null> | null>(null)
  const notificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const stopConfirmRef = useRef<HTMLDivElement | null>(null)
  const driveActionTokenRef = useRef(0)

  const {
    session,
    startDrive,
    pauseDrive,
    resumeDrive,
    hardReset,
    tick,
    setWeather,
    setOutsideTemp,
  } = useActiveDriveStore()

  const clearGpsWatch = useCallback(async () => {
    const watchId = watchIdRef.current
    if (!watchId) return

    watchIdRef.current = null

    try {
      await Geolocation.clearWatch({ id: watchId })
    } catch {
      // Ignore watch cleanup errors.
    }
  }, [])

  const clearNotificationInterval = useCallback(() => {
    if (notificationIntervalRef.current !== null) {
      globalThis.clearInterval(notificationIntervalRef.current)
      notificationIntervalRef.current = null
    }
  }, [])

  const clearRuntimeLoops = useCallback(() => {
    driveActionTokenRef.current += 1
    void clearGpsWatch()
    clearNotificationInterval()
  }, [clearGpsWatch, clearNotificationInterval])

  const getCurrentLocation = useCallback(async (): Promise<RouteCoord | null> => {
    if (locationRequestRef.current) {
      return locationRequestRef.current
    }

    const locationPromise = (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions()

          const granted =
            permission.location === "granted" ||
            permission.coarseLocation === "granted"

          if (!granted) {
            console.warn("Location permission missing; returning null.")
            return null
          }

          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 5_000,
          })

          const { latitude: lat, longitude: lng } = position.coords

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
          ) {
            return null
          }

          return {
            lat,
            lng,
            at:
              typeof position.timestamp === "number" &&
              Number.isFinite(position.timestamp)
                ? position.timestamp
                : Date.now(),
            accuracy:
              typeof position.coords.accuracy === "number" &&
              Number.isFinite(position.coords.accuracy)
                ? position.coords.accuracy
                : null,
            heading:
              typeof position.coords.heading === "number" &&
              Number.isFinite(position.coords.heading)
                ? position.coords.heading
                : null,
            gpsSpeedMps:
              typeof position.coords.speed === "number" &&
              Number.isFinite(position.coords.speed)
                ? position.coords.speed
                : null,
          }
        }

        if (!navigator.geolocation) return null

        return await new Promise<RouteCoord | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude: lat, longitude: lng } = position.coords

              if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng) ||
                lat < -90 ||
                lat > 90 ||
                lng < -180 ||
                lng > 180
              ) {
                resolve(null)
                return
              }

              resolve({
                lat,
                lng,
                at:
                  typeof position.timestamp === "number" &&
                  Number.isFinite(position.timestamp)
                    ? position.timestamp
                    : Date.now(),
                accuracy:
                  typeof position.coords.accuracy === "number" &&
                  Number.isFinite(position.coords.accuracy)
                    ? position.coords.accuracy
                    : null,
                heading:
                  typeof position.coords.heading === "number" &&
                  Number.isFinite(position.coords.heading)
                    ? position.coords.heading
                    : null,
                gpsSpeedMps:
                  typeof position.coords.speed === "number" &&
                  Number.isFinite(position.coords.speed)
                    ? position.coords.speed
                    : null,
              })
            },
            () => resolve(null),
            {
              enableHighAccuracy: true,
              timeout: 15_000,
              maximumAge: 5_000,
            }
          )
        })
      } catch {
        return null
      } finally {
        locationRequestRef.current = null
      }
    })()

    locationRequestRef.current = locationPromise
    return locationPromise
  }, [])

  const getTotalActiveMs = useCallback(() => {
    const activeSession = useActiveDriveStore.getState().session
    const accumulatedMs =
      activeSession.dayMs +
      activeSession.nightMs +
      activeSession.unverifiedMs

    if (
      activeSession.isActive &&
      activeSession.isRunning &&
      activeSession.lastTickAt !== null
    ) {
      return accumulatedMs + Math.max(0, Date.now() - activeSession.lastTickAt)
    }

    return accumulatedMs
  }, [])

  const buildDriveSnapshot = useCallback(
    async (options?: {
      signal?: AbortSignal
    }): Promise<DriveEntry | null> => {
      const snapshotTime = Date.now()
      const stateBeforeSnapshot = useActiveDriveStore.getState()

      if (!stateBeforeSnapshot.session.startTime) return null

      if (stateBeforeSnapshot.session.isRunning) {
        stateBeforeSnapshot.tick(undefined, snapshotTime)
      }

      const freshState = useActiveDriveStore.getState()
      const fresh = freshState.session
      const savedStartTime = fresh.startTime

      if (!savedStartTime) return null

      const currentEndCoord = await getCurrentLocation()

      if (options?.signal?.aborted) return null

      const totalActiveMs =
        fresh.dayMs + fresh.nightMs + fresh.unverifiedMs

      if (totalActiveMs <= 0) return null

      let miles = safeNumber(fresh.liveMiles)
      let milesSource: DriveEntry["milesSource"] = "gps-accumulated"

      if (fresh.startCoord && currentEndCoord) {
        const routeMiles = await getAccurateMileage(
          fresh.startCoord,
          currentEndCoord,
          options?.signal
        )

        if (options?.signal?.aborted) return null

        if (routeMiles !== null) {
          miles = routeMiles
          milesSource = "routes-api"
        }
      }

      const routeCoords = Array.isArray(fresh.routeTrail)
        ? [...fresh.routeTrail]
        : []

      const lastRouteCoord = routeCoords.at(-1) ?? null

      if (currentEndCoord && !sameCoord(lastRouteCoord, currentEndCoord)) {
        routeCoords.push(currentEndCoord)
      }

      const effectiveUnverifiedMs =
        fresh.unverifiedMs > UNVERIFIED_GRACE_MS
          ? fresh.unverifiedMs
          : 0

      const hasUnverifiedTime = effectiveUnverifiedMs > 0
      const hasSolarData = fresh.dayMs + fresh.nightMs > 0

      const nightCalcMode: NightCalcMode =
        hasSolarData && !hasUnverifiedTime ? "solar" : "unverified"

      let dayRangeStartMs: number | null = null
      let dayRangeEndMs: number | null = null
      let nightRangeStartMs: number | null = null
      let nightRangeEndMs: number | null = null

      const rangeCoord = fresh.startCoord ?? currentEndCoord

      if (rangeCoord) {
        const segments = splitDriveBySolar(
          new Date(savedStartTime),
          new Date(snapshotTime),
          (d: Date) => getSolarWindowForDate(rangeCoord.lat, rangeCoord.lng, d)
        )

        dayRangeStartMs = segments.dayStartMs
        dayRangeEndMs = segments.dayEndMs
        nightRangeStartMs = segments.nightStartMs
        nightRangeEndMs = segments.nightEndMs
      }

      const locationEstimated = !fresh.startCoord

      const fullyVerified = fresh.unverifiedMs <= UNVERIFIED_GRACE_MS
      let finalNightHours = fresh.nightMs / 3_600_000

      if (fullyVerified && rangeCoord) {
        const split = computeDayNightSplit(
          new Date(savedStartTime),
          new Date(snapshotTime),
          (d: Date) => getSolarWindowForDate(rangeCoord.lat, rangeCoord.lng, d)
        )

        if (split.mode === "solar") {
          finalNightHours = split.nightHours
        }
      }

      return {
        id: makeDriveId(),
        startTime: new Date(savedStartTime).toISOString(),
        endTime: new Date(snapshotTime).toISOString(),

        totalDurationHours: totalActiveMs / 3_600_000,
        dayDurationHours: fresh.dayMs / 3_600_000,
        nightDurationHours: finalNightHours,
        unverifiedDurationHours: effectiveUnverifiedMs / 3_600_000,

        verifiedNightDurationHours: fresh.nightMs / 3_600_000,

        nightCalcMode,

        isVerifiedDay:
          !hasUnverifiedTime &&
          fresh.dayMs > 0 &&
          fresh.nightMs === 0,

        dayRangeStartMs,
        dayRangeEndMs,
        nightRangeStartMs,
        nightRangeEndMs,
        locationEstimated,

        source: "timer",
        miles: safeNumber(miles),
        milesSource,
        weather: fresh.weather,
        routeCoords,
        startLatitude: fresh.startCoord?.lat ?? null,
        startLongitude: fresh.startCoord?.lng ?? null,
      }
    },
    [getCurrentLocation]
  )

  const createFrozenSnapshot = useCallback(() => {
    snapshotAbortRef.current?.abort()
    const controller = new AbortController()
    snapshotAbortRef.current = controller
    const snapshotPromise = buildDriveSnapshot({ signal: controller.signal })
    frozenSnapshotRef.current = snapshotPromise
    return snapshotPromise
  }, [buildDriveSnapshot])

  const [displayedMs, setDisplayedMs] = useState(() => getTotalActiveMs())

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      snapshotAbortRef.current?.abort()
      driveActionTokenRef.current += 1
    }
  }, [])

  useEffect(() => {
    const intervalId = globalThis.setInterval(() => {
      setDisplayedMs(getTotalActiveMs())
    }, 500)

    return () => globalThis.clearInterval(intervalId)
  }, [getTotalActiveMs])

  useEffect(() => {
    if (!session.isRunning) {
      clearNotificationInterval()
      return
    }

    const syncNotification = () => {
      const activeSession = useActiveDriveStore.getState().session
      const elapsed = formatTime(
        activeSession.dayMs +
          activeSession.nightMs +
          activeSession.unverifiedMs +
          (activeSession.lastTickAt
            ? Math.max(0, Date.now() - activeSession.lastTickAt)
            : 0)
      )

      void updateForegroundService(
        `${elapsed} elapsed · ${safeNumber(activeSession.liveMiles).toFixed(1)} mi`
      )
    }

    const startupTimeout = globalThis.setTimeout(() => {
      if (!mountedRef.current) return

      syncNotification()
      notificationIntervalRef.current = globalThis.setInterval(
        syncNotification,
        30_000
      )
    }, 2_000)

    return () => {
      globalThis.clearTimeout(startupTimeout)
      clearNotificationInterval()
    }
  }, [clearNotificationInterval, session.isRunning])

  useEffect(() => {
    void clearGpsWatch()

    if (!session.isRunning) return

    let active = true

    const startWatch = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions()

          const granted =
            permission.location === "granted" ||
            permission.coarseLocation === "granted"

          if (!granted) {
            setLocationError(
              "Location access is needed to verify sunlight and darkness hours."
            )
            return
          }
        }

        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
            interval: 1000,
            minimumUpdateInterval: 1000,
          },
          (position) => {
            if (!mountedRef.current || !active) return

            if (!position) {
              setLocationError(
                "Location updates are unavailable. Time will remain unverified until location returns."
              )
              return
            }

            const { latitude: lat, longitude: lng, accuracy, heading, speed } =
              position.coords

            if (
              !Number.isFinite(lat) ||
              !Number.isFinite(lng) ||
              lat < -90 ||
              lat > 90 ||
              lng < -180 ||
              lng > 180
            ) {
              return
            }

            setLocationError(null)

            tick(
              {
                lat,
                lng,
                at:
                  typeof position.timestamp === "number" &&
                  Number.isFinite(position.timestamp)
                    ? position.timestamp
                    : Date.now(),
                accuracy:
                  typeof accuracy === "number" && Number.isFinite(accuracy)
                    ? accuracy
                    : null,
                heading:
                  typeof heading === "number" && Number.isFinite(heading)
                    ? heading
                    : null,
                gpsSpeedMps:
                  typeof speed === "number" && Number.isFinite(speed)
                    ? speed
                    : null,
              },
              Date.now()
            )
          }
        )

        if (active) {
          watchIdRef.current = id
        } else {
          await Geolocation.clearWatch({ id })
        }
      } catch {
        setLocationError(
          "Location access is needed to verify sunlight and darkness hours."
        )
      }
    }

    void startWatch()

    return () => {
      active = false
      void clearGpsWatch()
    }
  }, [clearGpsWatch, session.isRunning, tick])

  useEffect(() => {
    if (!session.isRunning) return

    const HEARTBEAT_MS = 60_000

    const heartbeatId = setInterval(() => {
      Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15_000,
        maximumAge: 5_000,
      })
        .then((position) => {
          const coord: RouteCoord = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            at:
              typeof position.timestamp === "number" &&
              Number.isFinite(position.timestamp)
                ? position.timestamp
                : Date.now(),
            accuracy:
              typeof position.coords.accuracy === "number" &&
              Number.isFinite(position.coords.accuracy)
                ? position.coords.accuracy
                : null,
            heading:
              typeof position.coords.heading === "number" &&
              Number.isFinite(position.coords.heading)
                ? position.coords.heading
                : null,
            gpsSpeedMps:
              typeof position.coords.speed === "number" &&
              Number.isFinite(position.coords.speed)
                ? position.coords.speed
                : null,
          }

          useActiveDriveStore.getState().tick(coord, Date.now())
        })
        .catch(() => {})
    }, HEARTBEAT_MS)

    return () => clearInterval(heartbeatId)
  }, [session.isRunning])

  useEffect(() => {
    if (!session.isRunning) return

    let cancelled = false

    const refreshOutsideTemp = async () => {
      const coord = await getCurrentLocation()

      if (!coord || cancelled) return

      const weather = await fetchWeather(coord.lat, coord.lng)

      if (cancelled || weather.tempF === null) return

      setOutsideTemp(weather.tempF, weather.updatedAt)
    }

    void refreshOutsideTemp()

    const weatherId = globalThis.setInterval(() => {
      void refreshOutsideTemp()
    }, 5 * 60_000)

    return () => {
      cancelled = true
      globalThis.clearInterval(weatherId)
    }
  }, [getCurrentLocation, session.isRunning, setOutsideTemp])

  useEffect(() => {
    return () => {
      clearRuntimeLoops()
      void stopForegroundService()
    }
  }, [clearRuntimeLoops])

  useEffect(() => {
    if (showStopConfirm) {
      stopConfirmRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [showStopConfirm])

  const [isMaximized, setIsMaximized] = useState(false)

  const isRunning = session.isRunning
  const hasActiveDrive = session.isActive
  const isNight = session.currentMode === "night"
  const isSolarUnverified = session.currentMode === "unverified"
  const formattedElapsed = formatTime(displayedMs)

  const currentSpeed = session.currentSpeed

  const onMaximize = () => setIsMaximized(true)
  const onMinimize = () => setIsMaximized(false)

  const lightingLabel = isSolarUnverified
    ? "Lighting unverified"
    : isNight
      ? "Night driving"
      : "Day driving"

  const cappedAndUnresumable =
    hasActiveDrive && !isRunning && session.exceededMaxDuration

  const saveDisabled =
    !hasActiveDrive ||
    displayedMs < 10_000 ||
    isSaving ||
    isPreparingStop

  const beginDriveSession = useCallback(async () => {
    if (isStartingDrive) return

    const actionToken = driveActionTokenRef.current + 1
    driveActionTokenRef.current = actionToken
    setIsStartingDrive(true)

    try {
      const now = Date.now()

      startDrive(now, null)
      setLocationError(null)
      setShowStopConfirm(false)

      void startForegroundService("Drive started — tracking time and location")

      const coord = await getCurrentLocation()

      if (
        !mountedRef.current ||
        driveActionTokenRef.current !== actionToken
      ) {
        return
      }

      if (!coord) {
        setLocationError(
          "Location access is needed to verify sunlight and darkness hours."
        )
        return
      }

      setLocationError(null)
      tick(coord, Date.now())
    } finally {
      if (
        mountedRef.current &&
        driveActionTokenRef.current === actionToken
      ) {
        setIsStartingDrive(false)
      }
    }
  }, [getCurrentLocation, isStartingDrive, startDrive, tick])

  const startNewDrive = async () => {
    if (isStartingDrive) return

    if (Capacitor.isNativePlatform()) {
      const permission = await Geolocation.checkPermissions()

      const needsPermission =
        permission.location !== "granted" &&
        permission.coarseLocation !== "granted"

      if (needsPermission) {
        setShowDisclosure(true)
        return
      }
    }

    await beginDriveSession()
  }

  const resumeCurrentDrive = async () => {
    if (isStartingDrive) return

    const actionToken = driveActionTokenRef.current + 1
    driveActionTokenRef.current = actionToken
    setIsStartingDrive(true)

    try {
      resumeDrive(Date.now())
      setLocationError(null)
      setShowStopConfirm(false)

      void startForegroundService("Drive resumed — tracking active")

      const coord = await getCurrentLocation()

      if (
        !mountedRef.current ||
        driveActionTokenRef.current !== actionToken ||
        !coord
      ) {
        return
      }

      tick(coord, Date.now())
    } finally {
      if (
        mountedRef.current &&
        driveActionTokenRef.current === actionToken
      ) {
        setIsStartingDrive(false)
      }
    }
  }

  const pauseCurrentDrive = () => {
    driveActionTokenRef.current += 1
    setIsStartingDrive(false)

    const now = Date.now()

    tick(undefined, now)
    pauseDrive(now)

    void updateForegroundService("Drive paused — tap Resume to continue")
    setShowStopConfirm(false)
  }

  const handlePrimaryAction = () => {
    if (isSaving || isPreparingStop || isStartingDrive) return

    if (isRunning) {
      pauseCurrentDrive()
      return
    }

    if (hasActiveDrive) {
      void resumeCurrentDrive()
      return
    }

    void startNewDrive()
  }

  const handleStopRequest = () => {
    if (saveDisabled || isPreparingStop || isStartingDrive) return

    driveActionTokenRef.current += 1
    setIsStartingDrive(false)
    setIsMaximized(false)

    wasRunningBeforeStopRef.current = session.isRunning
    setShowStopConfirm(true)
    setIsPreparingStop(true)

    const stopRequestedAt = Date.now()
    const activeSession = useActiveDriveStore.getState().session

    if (activeSession.isRunning) {
      tick(undefined, stopRequestedAt)
      pauseDrive(stopRequestedAt)

      void updateForegroundService(
        "Drive paused — confirm Save and End to finish"
      )
    }

    void createFrozenSnapshot().finally(() => {
      if (mountedRef.current) {
        setIsPreparingStop(false)
      }
    })
  }

  const handleCancelStop = () => {
    snapshotAbortRef.current?.abort()
    snapshotAbortRef.current = null
    frozenSnapshotRef.current = null

    setShowStopConfirm(false)
    setIsPreparingStop(false)

    if (wasRunningBeforeStopRef.current) {
      void resumeCurrentDrive()
    }

    wasRunningBeforeStopRef.current = false
  }

  const handleSaveDrive = async () => {
    if (isSaving || isPreparingStop || isStartingDrive) return

    driveActionTokenRef.current += 1
    setIsStartingDrive(false)
    setIsSaving(true)

    try {
      clearRuntimeLoops()

      const finalizedDrive = frozenSnapshotRef.current
        ? await frozenSnapshotRef.current
        : await createFrozenSnapshot()

      if (!finalizedDrive) {
        setLocationError(
          "This drive could not be saved because it has no recorded active time."
        )
        return
      }

      saveDrive(finalizedDrive)
      setCurrentDrive(finalizedDrive)

      void stopForegroundService()

      hardReset()
      setShowStopConfirm(false)
      setScreen("todaysDrive")
    } catch (error) {
      console.error("[ActiveDrive] Save failed:", error)
      setLocationError(
        "Drive save failed. Please try again before closing the app."
      )
    } finally {
      if (mountedRef.current) {
        setIsSaving(false)
        setIsPreparingStop(false)
      }

      frozenSnapshotRef.current = null
      snapshotAbortRef.current = null
      wasRunningBeforeStopRef.current = false
    }
  }

  const solarVerificationText =
    session.solarStatus === "verified"
      ? "Lighting calculated from local sunrise and sunset"
      : "Solar verification pending"

  return isMaximized ? (
    <DriveDashboard
      currentSpeed={currentSpeed}
      liveMiles={session.liveMiles}
      outsideTempF={session.outsideTempF}
      formattedTimer={formattedElapsed}
      isNightMode={isNight}
      onMinimize={onMinimize}
      isRunning={isRunning}
      hasActiveDrive={hasActiveDrive}
      onStart={handlePrimaryAction}
      onPause={handlePrimaryAction}
      onResume={handlePrimaryAction}
      onEnd={handleStopRequest}
    />
  ) : (
    <div
      className="flex w-full justify-center px-3 pt-3 text-white sm:px-4"
      style={{
        paddingBottom: "max(2rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <div className="w-full max-w-[46rem]">
        <section className="mx-auto w-full max-w-[42rem] overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/70 to-[#0A1E5E]" />

          <div className="p-4 sm:p-5">
            <div className="rounded-[24px] border border-white/10 bg-[#08194A]/80 px-4 py-5 shadow-inner sm:px-5">
              <div className="flex flex-col items-start gap-2">
                <p className="text-[clamp(1.5rem,4vw,2.3rem)] font-extrabold leading-none tracking-tight break-words">
                  Live Tracking
                </p>

                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#35ff69] opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-[#35ff69]" />
                    </span>
                  ) : hasActiveDrive ? (
                    <span className="relative flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                  ) : null}

                  <p className="text-sm font-medium text-white/80 sm:text-base">
                    {isRunning
                      ? "Drive in progress"
                      : hasActiveDrive
                        ? "Drive paused"
                        : "Ready to start"}
                  </p>
                </div>

                <div
                  className={`mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] ${
                    isSolarUnverified
                      ? "bg-amber-300 text-[#08194A]"
                      : isNight
                        ? "bg-[#112869] text-white ring-1 ring-[#f9c80e]/40"
                        : "bg-white text-[#08194A]"
                  }`}
                >
                  {isSolarUnverified ? "VERIFYING" : isNight ? "NIGHT" : "DAY"}
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-[#06153E]/95 px-3 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  {isSolarUnverified ? (
                    <QuestionMarkCircleIcon className="h-5 w-5 shrink-0 text-[#f9c80e]" />
                  ) : isNight ? (
                    <MoonIcon className="h-5 w-5 shrink-0 text-[#f9c80e]" />
                  ) : (
                    <SunIcon className="h-5 w-5 shrink-0 text-[#f9c80e]" />
                  )}

                  <p className="text-sm font-bold">{lightingLabel}</p>
                </div>

                <p className="mt-1 text-xs text-white/70">
                  {solarVerificationText}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-6 flex max-w-[42rem] flex-col items-center space-y-3">
          <p
            className={`text-sm uppercase tracking-[0.18em] ${
              isRunning ? "text-[#35ff69]" : "text-red-300"
            }`}
          >
            {isRunning
              ? "Drive Active"
              : hasActiveDrive
                ? "Drive Paused"
                : "Ready to Start"}
          </p>

          {session.exceededMaxDuration && (
            <div className="mt-2 rounded-lg border border-red-300/40 bg-red-100/10 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-red-200">
                Drive exceeded maximum duration — please stop and save.
              </p>
            </div>
          )}

          <div className="flex w-full items-center justify-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={
                isSaving ||
                isPreparingStop ||
                isStartingDrive ||
                cappedAndUnresumable
              }
              aria-label={
                isRunning
                  ? "Pause drive timer"
                  : hasActiveDrive
                    ? "Resume drive timer"
                    : "Start drive timer"
              }
              className={`flex h-16 w-16 shrink-0 touch-manipulation select-none items-center justify-center rounded-full border-4 border-white shadow-xl transition active:scale-90 disabled:cursor-not-allowed disabled:bg-gray-500 ${
                isRunning
                  ? "bg-[#00A651] active:bg-[#008a43]"
                  : "bg-red-600 active:bg-red-700"
              }`}
            >
              {isRunning ? (
                <span className="h-4 w-4 rounded-sm bg-white" />
              ) : (
                <span className="ml-1 h-0 w-0 border-b-[8px] border-l-[13px] border-t-[8px] border-b-transparent border-l-white border-t-transparent" />
              )}
            </button>

            <div className="flex min-w-0 items-center">
              <p className="text-[clamp(1.9rem,8vw,3.5rem)] sm:text-[4rem] font-black leading-none tracking-tight tabular-nums">
                {formattedElapsed}
              </p>
            </div>
          </div>

          {hasActiveDrive && (
            <button
              type="button"
              onClick={onMaximize}
              className="mt-1 flex items-center gap-2 rounded-full border border-[#f9c80e]/40 bg-[#f9c80e]/10 px-3 py-1.5 transition active:scale-95"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f9c80e] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f9c80e]" />
              </span>
              <span className="text-[11px] font-semibold tracking-wide text-[#f9c80e]">
                View full dashboard
              </span>
              <span className="text-[11px] text-[#f9c80e]">→</span>
            </button>
          )}
        </section>

        <section className="mx-auto mt-5 w-full max-w-[42rem] overflow-hidden rounded-[28px] border-2 border-[#0A1E5E]/50 bg-white text-[#08194A] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#0A1E5E]" />

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#0A1E5E]/50">
                  Active Drive
                </p>
                <h2 className="mt-0.5 text-lg font-extrabold">Drive Summary</h2>
              </div>

              <span className="shrink-0 whitespace-nowrap rounded-full bg-[#F4F6FA] px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#08194A] ring-1 ring-[#0A1E5E]/10">
                {lightingLabel}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] px-4 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Duration
                </p>
                <p className="whitespace-nowrap text-xl font-black tabular-nums leading-tight">
                  {formattedElapsed}
                </p>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] px-4 py-2.5 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Distance
                </p>
                <p className="whitespace-nowrap text-xl font-black tabular-nums leading-tight">
                  {safeNumber(session.liveMiles).toFixed(1)}
                  <span className="ml-1 text-xs font-bold text-[#0A1E5E]/55">
                    mi
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-[#0A1E5E]/12 bg-[#F4F6FA] p-3 text-center">
              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#0A1E5E]/50">
                  Day
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatHours(session.dayMs / 3_600_000)}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#0A1E5E]/50">
                  Darkness
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatHours(session.nightMs / 3_600_000)}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-[0.12em] text-[#0A1E5E]/50">
                  Unverified
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatHours(session.unverifiedMs / 3_600_000)}
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-[#0A1E5E]/12 bg-[#F4F6FA] p-3 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Start Time
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {session.startTime
                    ? new Date(session.startTime).toLocaleTimeString()
                    : "--"}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Weather
                </p>
                <p className="mt-1 truncate text-sm font-semibold">
                  {session.weather ?? "Not selected"}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="mb-2 text-center text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                Weather Conditions
              </p>

              <div className="grid grid-cols-4 gap-1.5">
                {["Clear", "Rain", "Snow", "Fog"].map((weather) => {
                  const selected = session.weather === weather

                  return (
                    <button
                      key={weather}
                      type="button"
                      onClick={() => setWeather(selected ? null : weather)}
                      className={`min-h-[44px] touch-manipulation select-none rounded-full border px-1 py-2 text-xs font-semibold transition active:scale-95 ${
                        selected
                          ? "border-transparent bg-[#f9c80e] text-[#08194A] shadow-[0_0_10px_rgba(249,200,14,0.25)]"
                          : "border-[#0A1E5E]/12 bg-white text-[#0A1E5E]/65 active:bg-[#f9c80e]/10"
                      }`}
                    >
                      {weather}
                    </button>
                  )
                })}
              </div>
            </div>

            {locationError && (
              <div className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                  Location Issue
                </p>
                <p className="mt-0.5 text-xs font-medium text-red-700">
                  {locationError}
                </p>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrimaryAction}
                disabled={
                  isSaving ||
                  isPreparingStop ||
                  isStartingDrive ||
                  cappedAndUnresumable
                }
                className={`min-h-[48px] touch-manipulation select-none rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 ${
                  isRunning
                    ? "bg-red-600 active:bg-red-700"
                    : hasActiveDrive
                      ? "bg-green-600 active:bg-green-700"
                      : "bg-[#08194A] active:bg-[#0A1E5E]"
                }`}
              >
                {isStartingDrive
                  ? "Starting..."
                  : isRunning
                    ? "Pause Timer"
                    : hasActiveDrive
                      ? "Resume Timer"
                      : "Start Timer"}
              </button>

              <button
                type="button"
                onClick={handleStopRequest}
                disabled={saveDisabled || isStartingDrive}
                className="min-h-[48px] touch-manipulation select-none rounded-xl bg-[#08194A] py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] active:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isPreparingStop ? "Preparing..." : "Stop Drive"}
              </button>
            </div>

            {showStopConfirm && (
              <div
                ref={stopConfirmRef}
                className="mt-3 rounded-xl border-2 border-[#f9c80e]/45 bg-[#FFF9E8] p-4 shadow-sm"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                  Confirm Stop
                </p>
                <h3 className="mt-1 text-base font-extrabold">
                  End and save this drive?
                </h3>
                <p className="mt-1 text-xs text-[#0A1E5E]/70">
                  Active time is split using local sunrise and sunset. Paused
                  time is excluded.
                </p>

                {isPreparingStop && (
                  <p className="mt-2 text-xs font-semibold text-[#0A1E5E]">
                    Preparing final snapshot...
                  </p>
                )}

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCancelStop}
                    disabled={isSaving}
                    className="min-h-[48px] touch-manipulation select-none rounded-xl border border-[#0A1E5E]/15 bg-white py-3 text-sm font-bold text-[#08194A] transition active:scale-[0.98] active:bg-[#F7F9FC] disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDrive}
                    disabled={isSaving || isPreparingStop || isStartingDrive}
                    className="min-h-[48px] touch-manipulation select-none rounded-xl bg-[#08194A] py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.98] active:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {isSaving ? "Saving..." : "Save and End"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {showDisclosure && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <BackgroundLocationDisclosure
              onContinue={async () => {
                if (isStartingDrive) return

                setShowDisclosure(false)

                const requested = await Geolocation.requestPermissions()

                const granted =
                  requested.location === "granted" ||
                  requested.coarseLocation === "granted"

                if (!granted) {
                  setLocationError(
                    "Location access is needed to start and verify a drive."
                  )
                  return
                }

                await beginDriveSession()
              }}
              onCancel={() => {
                setShowDisclosure(false)
                setLocationError(
                  "Location access is needed to start and verify a drive."
                )
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default ActiveDriveContent