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

import type { Screen } from "../App"
import { saveDrive } from "../state/driveStore"
import type { DriveEntry, NightCalcMode } from "../state/driveStore"
import {
  useActiveDriveStore,
  type RouteCoord,
} from "../state/activeDriveStore"

type ActiveDriveContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
  setCurrentDrive: Dispatch<SetStateAction<DriveEntry | null>>
}

type DriveSnapshot = DriveEntry & {
  isPreview?: boolean
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
  } catch {
    // A channel can already exist. Notification setup is non-critical.
  }
}

async function startForegroundService(body: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
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
  } catch {
    // Failure to refresh a notification must not interrupt drive tracking.
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
  } catch {
    // Cleanup failure is non-critical.
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
  const [isPreviewing, setIsPreviewing] = useState(false)

  const mountedRef = useRef(true)
  const watchIdRef = useRef<string | null>(null)
  const frozenSnapshotRef = useRef<Promise<DriveSnapshot | null> | null>(null)
  const snapshotAbortRef = useRef<AbortController | null>(null)
  const wasRunningBeforeStopRef = useRef(false)
  const locationRequestRef = useRef<Promise<RouteCoord | null> | null>(null)
  const notificationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  )
  const stopConfirmRef = useRef<HTMLDivElement | null>(null)

  const {
    session,
    startDrive,
    pauseDrive,
    resumeDrive,
    hardReset,
    tick,
    setWeather,
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

          const needsPermission =
            permission.location !== "granted" &&
            permission.coarseLocation !== "granted"

          if (needsPermission) {
            const requested = await Geolocation.requestPermissions()

            const granted =
              requested.location === "granted" ||
              requested.coarseLocation === "granted"

            if (!granted) return null
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

          return { lat, lng }
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

              resolve({ lat, lng })
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
      isPreview?: boolean
      signal?: AbortSignal
    }): Promise<DriveSnapshot | null> => {
      const snapshotTime = Date.now()
      const stateBeforeSnapshot = useActiveDriveStore.getState()

      if (!stateBeforeSnapshot.session.startTime) return null

      /*
       * If the timer is running, the store classifies the final active interval
       * using its last known GPS location. It never classifies paused time.
       */
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

      const hasUnverifiedTime = fresh.unverifiedMs > 0

      /*
       * This is intentionally based only on accumulated active solar intervals.
       * No wall-clock start-to-end recalculation occurs here, so pause time
       * cannot be saved as daylight or darkness.
       */
      const nightCalcMode = (
        hasUnverifiedTime ? "unverified" : "solar"
      ) as NightCalcMode

      return {
        id: makeDriveId(),
        startTime: new Date(savedStartTime).toISOString(),
        endTime: new Date(snapshotTime).toISOString(),

        totalDurationHours: totalActiveMs / 3_600_000,
        dayDurationHours: fresh.dayMs / 3_600_000,
        nightDurationHours: fresh.nightMs / 3_600_000,
        unverifiedDurationHours: fresh.unverifiedMs / 3_600_000,

        /*
         * nightMs only ever accumulates solar-verified segments (see
         * splitIntervalBySolar in activeDriveStore.ts) — unverified time is
         * tracked separately in unverifiedMs. So nightMs is already pure
         * verified-night time and should not be zeroed out just because some
         * other, unrelated segment of the drive was unverified.
         */
        verifiedNightDurationHours: fresh.nightMs / 3_600_000,

        nightCalcMode,
        isVerifiedDay:
          !hasUnverifiedTime &&
          fresh.dayMs > 0 &&
          fresh.nightMs === 0,

        source: "timer",
        miles: safeNumber(miles),
        milesSource,
        weather: fresh.weather,
        routeCoords,
        startLatitude: fresh.startCoord?.lat ?? null,
        startLongitude: fresh.startCoord?.lng ?? null,
        isPreview: options?.isPreview ?? false,
      }
    },
    [getCurrentLocation]
  )

  const createFrozenSnapshot = useCallback(
    (options?: { isPreview?: boolean }) => {
      snapshotAbortRef.current?.abort()

      const controller = new AbortController()
      snapshotAbortRef.current = controller

      const snapshotPromise = buildDriveSnapshot({
        isPreview: options?.isPreview,
        signal: controller.signal,
      })

      frozenSnapshotRef.current = snapshotPromise

      return snapshotPromise
    },
    [buildDriveSnapshot]
  )

  const [displayedMs, setDisplayedMs] = useState(() => getTotalActiveMs())

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      snapshotAbortRef.current?.abort()
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

          const needsPermission =
            permission.location !== "granted" &&
            permission.coarseLocation !== "granted"

          if (needsPermission) {
            const requested = await Geolocation.requestPermissions()

            const granted =
              requested.location === "granted" ||
              requested.coarseLocation === "granted"

            if (!granted) {
              setLocationError(
                "Location access is needed to verify sunlight and darkness hours."
              )
              return
            }
          }
        }

        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: 5_000,
          },
          (position) => {
            if (!mountedRef.current || !active) return

            if (!position) {
              setLocationError(
                "Location updates are unavailable. Time will remain unverified until location returns."
              )
              return
            }

            const { latitude: lat, longitude: lng } = position.coords

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
            tick({ lat, lng }, Date.now())
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
    return () => {
      clearRuntimeLoops()
      void stopForegroundService()
    }
  }, [clearRuntimeLoops])

  // Scroll the stop-confirmation panel into view when it opens, so it isn't
  // hidden below the fold on smaller Android screens.
  useEffect(() => {
    if (showStopConfirm) {
      stopConfirmRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }
  }, [showStopConfirm])

  const isRunning = session.isRunning
  const hasActiveDrive = session.isActive
  const isNight = session.currentMode === "night"
  const isSolarUnverified = session.currentMode === "unverified"
  const formattedElapsed = formatTime(displayedMs)

  const lightingLabel = isSolarUnverified
    ? "Lighting unverified"
    : isNight
      ? "Night driving"
      : "Day driving"

  const saveDisabled =
    !hasActiveDrive ||
    displayedMs < 10_000 ||
    isSaving ||
    isPreparingStop

  const previewDisabled =
    !hasActiveDrive ||
    displayedMs < 10_000 ||
    isSaving ||
    isPreparingStop ||
    isPreviewing

  const startNewDrive = async () => {
    const now = Date.now()

    startDrive(now, null)
    setLocationError(null)
    setShowStopConfirm(false)

    void startForegroundService("Drive started — tracking time and location")

    const coord = await getCurrentLocation()

    if (!mountedRef.current) return

    if (!coord) {
      setLocationError(
        "Location access is needed to verify sunlight and darkness hours."
      )
      return
    }

    setLocationError(null)
    tick(coord, Date.now())
  }

  const resumeCurrentDrive = async () => {
    resumeDrive(Date.now())
    setLocationError(null)
    setShowStopConfirm(false)

    void startForegroundService("Drive resumed — tracking active")

    const coord = await getCurrentLocation()

    if (!mountedRef.current || !coord) return

    tick(coord, Date.now())
  }

  const pauseCurrentDrive = () => {
    const now = Date.now()

    /*
     * Force the final active interval into the solar counters before pause.
     * `pauseDrive()` then changes isRunning to false, so paused time is excluded.
     */
    tick(undefined, now)
    pauseDrive(now)

    void updateForegroundService("Drive paused — tap Resume to continue")
    setShowStopConfirm(false)
  }

  const handlePrimaryAction = () => {
    if (isSaving || isPreparingStop || isPreviewing) return

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
    if (saveDisabled) return

    wasRunningBeforeStopRef.current = session.isRunning

    if (session.isRunning) {
      pauseCurrentDrive()
    }

    setShowStopConfirm(true)
    setIsPreparingStop(true)

    createFrozenSnapshot({ isPreview: false }).finally(() => {
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
    if (isSaving || isPreparingStop) return

    setIsSaving(true)

    try {
      clearRuntimeLoops()

      const finalizedDrive = frozenSnapshotRef.current
        ? await frozenSnapshotRef.current
        : await createFrozenSnapshot({ isPreview: false })

      if (!finalizedDrive) {
        setLocationError(
          "This drive could not be saved because it has no recorded active time."
        )
        return
      }

      const { isPreview: _isPreview, ...driveToSave } = finalizedDrive

      saveDrive(driveToSave)
      setCurrentDrive(driveToSave)

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

  const handlePreviewSummary = async () => {
    if (previewDisabled) return

    try {
      setIsPreviewing(true)

      const previewDrive = await createFrozenSnapshot({
        isPreview: true,
      })

      if (!mountedRef.current || !previewDrive) return

      setCurrentDrive(previewDrive)
      setScreen("summary")
    } finally {
      frozenSnapshotRef.current = null
      snapshotAbortRef.current = null

      if (mountedRef.current) {
        setIsPreviewing(false)
      }
    }
  }

  const solarVerificationText =
    session.solarStatus === "verified"
      ? "Lighting calculated from local sunrise and sunset"
      : "Solar verification pending"

  return (
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[clamp(1.5rem,5vw,2.5rem)] font-extrabold leading-none tracking-tight break-words">
                    Live Tracking
                  </p>

                  <p className="mt-2 text-sm font-medium text-white/80 sm:text-base">
                    {isRunning
                      ? "Drive in progress"
                      : hasActiveDrive
                        ? "Drive paused"
                        : "Ready to start"}
                  </p>
                </div>

                <div
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] ${
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

          <div className="flex w-full items-center justify-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={isSaving || isPreparingStop || isPreviewing}
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
                  : hasActiveDrive
                    ? "bg-green-600 active:bg-green-700"
                    : "bg-red-600 active:bg-red-700"
              }`}
            >
              {isRunning ? (
                <span className="h-4 w-4 rounded-sm bg-white" />
              ) : (
                <span className="ml-1 h-0 w-0 border-b-[8px] border-l-[13px] border-t-[8px] border-b-transparent border-l-white border-t-transparent" />
              )}
            </button>

            <p className="text-[clamp(1.9rem,9vw,4.25rem)] font-black leading-none tracking-tight tabular-nums">
              {formattedElapsed}
            </p>
          </div>

          {hasActiveDrive && (
            <div className="rounded-lg border border-yellow-300/40 bg-yellow-100/10 px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-yellow-200">
                Keep NJDrive50 open for the most accurate location and solar timing.
              </p>
            </div>
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

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Duration
                </p>
                <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">
                  {formattedElapsed}
                </p>
              </div>

              <div className="rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] p-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Distance
                </p>
                <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">
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
                      onClick={() =>
                        setWeather(selected ? null : weather)
                      }
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
                disabled={isSaving || isPreparingStop || isPreviewing}
                className={`min-h-[48px] touch-manipulation select-none rounded-xl py-3.5 text-sm font-bold text-white shadow-md transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 ${
                  isRunning
                    ? "bg-red-600 active:bg-red-700"
                    : hasActiveDrive
                      ? "bg-green-600 active:bg-green-700"
                      : "bg-[#08194A] active:bg-[#0A1E5E]"
                }`}
              >
                {isRunning
                  ? "Pause Timer"
                  : hasActiveDrive
                    ? "Resume Timer"
                    : "Start Timer"}
              </button>

              <button
                type="button"
                onClick={handleStopRequest}
                disabled={saveDisabled}
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
                  Active time is split using local sunrise and sunset. Paused time
                  is excluded.
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
                    disabled={isSaving || isPreparingStop}
                    className="min-h-[48px] touch-manipulation select-none rounded-xl bg-[#08194A] py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.98] active:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    {isSaving ? "Saving..." : "Save and End"}
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handlePreviewSummary}
              disabled={previewDisabled}
              className="mt-3 min-h-[48px] w-full touch-manipulation select-none rounded-xl border-2 border-[#0A1E5E]/50 bg-white py-3.5 text-sm font-bold text-[#08194A] shadow-sm transition active:scale-[0.98] active:bg-[#f9c80e]/10 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
            >
              {isPreviewing ? "Opening Preview..." : "Preview Summary — Not Saved"}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ActiveDriveContent