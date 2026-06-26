// src/screens/ActiveDriveContent.tsx
import { useEffect, useRef, useState, useCallback, useId } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid"
import { saveDrive } from "../state/driveStore"
import type { DriveEntry, NightCalcMode } from "../state/driveStore"
import {
  useActiveDriveStore,
  type NightOverride,
  type DriveMode,
  type RouteCoord,
} from "../state/activeDriveStore"
import { calculateNightBreakdown } from "../engine/driveEngine"
import { Geolocation } from "@capacitor/geolocation"
import { Capacitor } from "@capacitor/core"
// FIX 1: No top-level ForegroundService import — Android-only plugin crashes
// on web/iOS if imported statically. Each helper lazy-imports it instead.


type ActiveDriveContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
  setCurrentDrive: Dispatch<SetStateAction<DriveEntry | null>>
}


type DriveSnapshot = DriveEntry & {
  isPreview?: boolean
}


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const ROUTE_TIMEOUT_MS = 8000
const FS_NOTIFICATION_ID = 1001
const FS_CHANNEL_ID = "njdrive50_drive"


const safeNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}


const formatTime = (ms: number) => {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")
}


const sameCoord = (
  a: RouteCoord | null | undefined,
  b: RouteCoord | null | undefined
) => {
  if (!a || !b) return false
  return a.lat === b.lat && a.lng === b.lng
}


function makeDriveId() {
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
        timeout?: (ms: number) => AbortSignal
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
) {
  try {
    if (!API_BASE_URL) return null

    const { signal: requestSignal, cleanup } = composeAbortSignal(signal)

    try {
      const res = await fetch(`${API_BASE_URL}/api/computeRoutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: requestSignal,
        body: JSON.stringify({
          origin: {
            location: { latLng: { latitude: start.lat, longitude: start.lng } },
          },
          destination: {
            location: { latLng: { latitude: end.lat, longitude: end.lng } },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
          units: "IMPERIAL",
        }),
      })

      if (!res.ok) return null

      const data = await res.json()
      const meters = data?.routes?.[0]?.distanceMeters
      if (typeof meters !== "number") return null

      return meters / 1609.34
    } finally {
      cleanup()
    }
  } catch {
    return null
  }
}


// ─── Foreground Service helpers ────────────────────────────────────────────────
// All helpers dynamically import ForegroundService so the module is never
// evaluated on web/iOS where the plugin is not registered.

// Tracks whether startForegroundService has fully resolved so that
// updateForegroundService never fires before the service is running.
let fsStarted = false

async function ensureForegroundServiceChannel() {
  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )
    await ForegroundService.createNotificationChannel({
      id: FS_CHANNEL_ID,
      name: "NJDrive50 Active Drive",
      description: "Keeps your drive timer and GPS running in the background.",
      importance: 2, // IMPORTANCE_LOW — no sound, no heads-up banner
    })
  } catch {
    // Channel may already exist on subsequent launches; safe to ignore
  }
}

async function startForegroundService(body: string) {
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
      smallIcon: "ic_stat_directions_car",
      silent: true,
      notificationChannelId: FS_CHANNEL_ID,
      serviceType: 8, // Android Location foreground service type
    })
    // FIX: Only mark as started AFTER the native call resolves.
    // updateForegroundService checks this flag and no-ops if false,
    // preventing the crash where update fires before start completes.
    fsStarted = true
  } catch (err) {
    console.warn("[ForegroundService] start failed:", err)
    fsStarted = false
  }
}

async function updateForegroundService(body: string) {
  if (!Capacitor.isNativePlatform()) return
  // FIX: Guard — do not call update if the service has not started yet.
  // This is the primary crash fix: the notification sync interval was
  // calling update immediately on mount before startForegroundService
  // resolved, causing Android to throw a native exception.
  if (!fsStarted) return
  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )
    await ForegroundService.updateForegroundService({
      id: FS_NOTIFICATION_ID,
      title: "NJDrive50 — Drive Active",
      body,
      smallIcon: "ic_stat_directions_car",
      notificationChannelId: FS_CHANNEL_ID,
    })
  } catch {
    // Notification update failure is non-critical — ignore silently
  }
}

async function stopForegroundService() {
  if (!Capacitor.isNativePlatform()) return
  fsStarted = false
  try {
    const { ForegroundService } = await import(
      "@capawesome-team/capacitor-android-foreground-service"
    )
    await ForegroundService.stopForegroundService()
  } catch {
    // Ignore cleanup errors
  }
}
// ──────────────────────────────────────────────────────────────────────────────

function ActiveDriveContent({
  setScreen,
  setCurrentDrive,
}: ActiveDriveContentProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isPreparingStop, setIsPreparingStop] = useState(false)
  const [showWeatherHelp, setShowWeatherHelp] = useState(false)

  const watchIdRef = useRef<string | null>(null)
  const frozenSnapshotRef = useRef<Promise<DriveSnapshot | null> | null>(null)
  const isSavingRef = useRef(false)
  const weatherHelpRef = useRef<HTMLDivElement | null>(null)
  const wasRunningBeforeStopRef = useRef(false)
  const inflightLocationRef = useRef<Promise<RouteCoord | null> | null>(null)
  const activeSnapshotAbortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const fsUpdateIntervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)
  const weatherHelpButtonId = useId()
  const weatherHelpPanelId = useId()

  const {
    session,
    startDrive,
    pauseDrive,
    resumeDrive,
    hardReset,
    tick,
    setNightOverride,
    setWeather,
    getCurrentMode,
  } = useActiveDriveStore()

  const clearGpsWatch = useCallback(async () => {
    if (watchIdRef.current !== null) {
      try {
        await Geolocation.clearWatch({ id: watchIdRef.current })
      } catch {
        // ignore cleanup errors
      }
      watchIdRef.current = null
    }
  }, [])

  const clearAllLoops = useCallback(() => {
    void clearGpsWatch()
    if (fsUpdateIntervalRef.current !== null) {
      globalThis.clearInterval(fsUpdateIntervalRef.current)
      fsUpdateIntervalRef.current = null
    }
  }, [clearGpsWatch])

  const requestAndGetLocation = useCallback(async (): Promise<RouteCoord | null> => {
    if (inflightLocationRef.current) {
      return inflightLocationRef.current
    }

    const promise = (async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions()

          const needsLocation =
            permission.location !== "granted" &&
            permission.coarseLocation !== "granted"

          if (needsLocation) {
            const requested = await Geolocation.requestPermissions()
            const granted =
              requested.location === "granted" ||
              requested.coarseLocation === "granted"
            if (!granted) return null
          }

          const pos = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000,
          })

          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
          if (lat === 0 && lng === 0) return null

          return { lat, lng }
        }

        if (!navigator.geolocation) return null

        return await new Promise<RouteCoord | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude
              const lng = pos.coords.longitude
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                resolve(null)
                return
              }
              if (lat === 0 && lng === 0) {
                resolve(null)
                return
              }
              resolve({ lat, lng })
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          )
        })
      } catch (err) {
        console.error("Location error:", err)
        return null
      } finally {
        inflightLocationRef.current = null
      }
    })()

    inflightLocationRef.current = promise
    return promise
  }, [])

  const primeSessionCoord = useCallback((coord: RouteCoord) => {
    useActiveDriveStore.setState((state) => {
      const s = state.session
      const hasStart = !!s.startCoord
      const sameAsLast =
        !!s.lastCoord &&
        s.lastCoord.lat === coord.lat &&
        s.lastCoord.lng === coord.lng

      return {
        session: {
          ...s,
          startCoord: s.startCoord ?? coord,
          lastCoord: coord,
          routeTrail:
            hasStart && sameAsLast
              ? s.routeTrail
              : [...s.routeTrail, coord].slice(-500),
          lastUpdated: Date.now(),
        },
      }
    })
  }, [])

  const buildDriveSnapshot = useCallback(
    async (opts?: {
      isPreview?: boolean
      signal?: AbortSignal
    }): Promise<DriveSnapshot | null> => {
      const state = useActiveDriveStore.getState()
      const sessionSnapshot = state.session

      const savedStartTime = sessionSnapshot.startTime
      if (!savedStartTime) return null

      const snapshotTime = Date.now()

      useActiveDriveStore.getState().tick(undefined, snapshotTime)

      const freshState = useActiveDriveStore.getState()
      const fresh = freshState.session
      const liveMode = freshState.getCurrentMode() ?? fresh.currentMode ?? "day"

      const currentEndCoord = await requestAndGetLocation()
      if (opts?.signal?.aborted) return null

      const finalElapsedMs = fresh.dayMs + fresh.nightMs
      if (finalElapsedMs <= 0) return null

      let finalDayMs = Math.max(0, fresh.dayMs)
      let finalNightMs = Math.max(0, fresh.nightMs)
      const bucketTotal = finalDayMs + finalNightMs

      if (bucketTotal < finalElapsedMs) {
        const remainder = finalElapsedMs - bucketTotal
        if (liveMode === "night") {
          finalNightMs += remainder
        } else {
          finalDayMs += remainder
        }
      } else if (bucketTotal <= 0) {
        if (liveMode === "night") {
          finalNightMs = finalElapsedMs
        } else {
          finalDayMs = finalElapsedMs
        }
      }

      const normalizedTotalMs = Math.max(finalElapsedMs, finalDayMs + finalNightMs)

      let accurateMiles = safeNumber(fresh.liveMiles)
      let milesSource: DriveEntry["milesSource"] = "gps-accumulated"

      if (fresh.startCoord && currentEndCoord) {
        const routeMiles = await getAccurateMileage(
          fresh.startCoord,
          currentEndCoord,
          opts?.signal
        )
        if (opts?.signal?.aborted) return null
        if (routeMiles !== null) {
          accurateMiles = routeMiles
          milesSource = "routes-api"
        }
      }

      const baseTrail = Array.isArray(fresh.routeTrail) ? fresh.routeTrail : []
      const lastTrailCoord = baseTrail.length > 0 ? baseTrail[baseTrail.length - 1] : null

      const finalTrail =
        currentEndCoord && !sameCoord(lastTrailCoord, currentEndCoord)
          ? [...baseTrail, currentEndCoord]
          : baseTrail

      // ── SOLAR ENGINE FIX ───────────────────────────────────────────────────
      // Run the solar engine against the real start/end timestamps + GPS
      // coordinates so day and night drives are properly verified.
      // Previously this was hardcoded to "dmv-fixed" and never used solar data.
      const location = fresh.startCoord
        ? { latitude: fresh.startCoord.lat, longitude: fresh.startCoord.lng }
        : undefined

      const breakdown = calculateNightBreakdown({
        start: savedStartTime,
        end: snapshotTime,
        location,
      })

      const nightCalcMode: NightCalcMode = breakdown.mode
      const nightHours = breakdown.nightDuration / 3600000
      const dayHours = breakdown.dayDuration / 3600000
      const verifiedNightDurationHours = nightHours
      const isVerifiedDay = breakdown.isVerifiedDay
      // ──────────────────────────────────────────────────────────────────────

      return {
        id: makeDriveId(),
        startTime: new Date(savedStartTime).toISOString(),
        endTime: new Date(snapshotTime).toISOString(),
        totalDurationHours: normalizedTotalMs / 3600000,
        dayDurationHours: dayHours,
        nightDurationHours: nightHours,
        verifiedNightDurationHours,
        nightCalcMode,
        isVerifiedDay,
        source: "timer",
        miles: safeNumber(accurateMiles),
        milesSource,
        weather: fresh.weather,
        routeCoords: finalTrail,
        startLatitude: fresh.startCoord?.lat ?? null,
        startLongitude: fresh.startCoord?.lng ?? null,
        isPreview: opts?.isPreview ?? false,
      }
    },
    [requestAndGetLocation]
  )

  const startFrozenSnapshot = useCallback(
    (opts?: { isPreview?: boolean }) => {
      activeSnapshotAbortRef.current?.abort()
      const controller = new AbortController()
      activeSnapshotAbortRef.current = controller
      const promise = buildDriveSnapshot({
        isPreview: opts?.isPreview,
        signal: controller.signal,
      })
      frozenSnapshotRef.current = promise
      return promise
    },
    [buildDriveSnapshot]
  )

  const [displayedMs, setDisplayedMs] = useState(() => {
    const s = useActiveDriveStore.getState().session
    return s.dayMs + s.nightMs
  })

  // ── Mount / unmount ────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      activeSnapshotAbortRef.current?.abort()
    }
  }, [])

  // ── Display timer — ticks every 500ms ─────────────────────────────────────
  useEffect(() => {
    const id = globalThis.setInterval(() => {
      const s = useActiveDriveStore.getState().session
      if (!s.isActive) {
        setDisplayedMs(s.dayMs + s.nightMs)
        return
      }
      if (s.isRunning && s.lastTickAt !== null) {
        const accumulated = s.dayMs + s.nightMs
        const liveDelta = Math.max(0, Date.now() - s.lastTickAt)
        setDisplayedMs(accumulated + liveDelta)
      } else {
        setDisplayedMs(s.dayMs + s.nightMs)
      }
    }, 500)
    return () => globalThis.clearInterval(id)
  }, [])

  // ── Foreground service notification sync — updates every 30s ──────────────
  // FIX: Removed the immediate syncNotification() call that was here before.
  // Calling updateForegroundService() immediately when session.isRunning
  // becomes true caused a crash because startForegroundService() (called in
  // handlePress) had not yet resolved — Android threw a native exception
  // trying to update a service that hadn't started. The fsStarted flag in
  // updateForegroundService() is the primary guard, but we also delay the
  // first interval tick by 2 seconds to give the native start call time to
  // fully resolve before any update is attempted.
  useEffect(() => {
    if (!session.isRunning) {
      if (fsUpdateIntervalRef.current !== null) {
        globalThis.clearInterval(fsUpdateIntervalRef.current)
        fsUpdateIntervalRef.current = null
      }
      return
    }

    const syncNotification = () => {
      const s = useActiveDriveStore.getState().session
      const accumulated = s.dayMs + s.nightMs
      const liveDelta =
        s.lastTickAt !== null ? Math.max(0, Date.now() - s.lastTickAt) : 0
      const elapsed = formatTime(accumulated + liveDelta)
      const miles = safeNumber(s.liveMiles).toFixed(1)
      void updateForegroundService(`${elapsed} elapsed · ${miles} mi`)
    }

    // Delay first sync by 2s to ensure startForegroundService has resolved.
    // The fsStarted guard in updateForegroundService is the hard safety net;
    // this delay just avoids the unnecessary no-op on the first tick.
    const firstSyncTimeout = globalThis.setTimeout(() => {
      if (!mountedRef.current) return
      syncNotification()
      fsUpdateIntervalRef.current = globalThis.setInterval(syncNotification, 30000)
    }, 2000)

    return () => {
      globalThis.clearTimeout(firstSyncTimeout)
      if (fsUpdateIntervalRef.current !== null) {
        globalThis.clearInterval(fsUpdateIntervalRef.current)
        fsUpdateIntervalRef.current = null
      }
    }
  }, [session.isRunning])

  // ── GPS watch — only runs while drive is running ───────────────────────────
  useEffect(() => {
    void clearGpsWatch()
    if (!session.isRunning) return

    let active = true

    const startWatch = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          const permission = await Geolocation.checkPermissions()
          const needsLocation =
            permission.location !== "granted" &&
            permission.coarseLocation !== "granted"

          if (needsLocation) {
            const requested = await Geolocation.requestPermissions()
            const granted =
              requested.location === "granted" ||
              requested.coarseLocation === "granted"
            if (!granted) {
              setLocationError("Location access is required for accurate mileage.")
              return
            }
          }
        }

        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          (pos) => {
            if (!mountedRef.current || !active) return

            if (!pos) {
              setLocationError("Location access is required for accurate mileage.")
              return
            }

            const lat = pos.coords.latitude
            const lng = pos.coords.longitude

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
            if (lat === 0 && lng === 0) return

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
        setLocationError("Location access is required for accurate mileage.")
      }
    }

    void startWatch()

    return () => {
      active = false
      void clearGpsWatch()
    }
  }, [session.isRunning, tick, clearGpsWatch])

  // ── Prime initial coord when session becomes active ────────────────────────
  useEffect(() => {
    if (!session.isActive) return

    let cancelled = false

    ;(async () => {
      const coord = await requestAndGetLocation()
      if (cancelled || !mountedRef.current) return

      if (coord) {
        primeSessionCoord(coord)
        setLocationError(null)
      }

      tick(undefined, Date.now())
    })()

    return () => {
      cancelled = true
    }
  }, [session.isActive, primeSessionCoord, requestAndGetLocation, tick])

  // ── Cleanup all loops on unmount ───────────────────────────────────────────
  useEffect(() => {
    return () => {
      clearAllLoops()
      void stopForegroundService()
    }
  }, [clearAllLoops])

  // ── Weather help popover dismiss handlers ──────────────────────────────────
  useEffect(() => {
    if (!showWeatherHelp) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (weatherHelpRef.current && !weatherHelpRef.current.contains(target)) {
        setShowWeatherHelp(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowWeatherHelp(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showWeatherHelp])

  // ── Derived state ──────────────────────────────────────────────────────────
  const isRunning = session.isRunning
  const hasActiveDrive = session.isActive
  const saveDisabled =
    !hasActiveDrive || displayedMs < 10000 || isStopping || isPreparingStop
  const previewDisabled =
    !hasActiveDrive || displayedMs < 10000 || isStopping || isPreviewing || isPreparingStop

  // ── Button handlers ────────────────────────────────────────────────────────
  const handlePress = async () => {
    if (isStopping || isPreviewing || isPreparingStop) return

    if (session.isRunning) {
      pauseDrive()
      void updateForegroundService("Drive paused — tap to resume")
      setShowStopConfirm(false)
      return
    }

    if (session.isActive) {
      resumeDrive()
      setShowStopConfirm(false)
      setLocationError(null)
      // On resume, call start (not update) so service is guaranteed running
      void startForegroundService("Drive resumed — tracking active")
      requestAndGetLocation().then((coord) => {
        if (coord && mountedRef.current) primeSessionCoord(coord)
      })
      return
    }

    startDrive(Date.now(), null)
    setShowStopConfirm(false)
    setLocationError(null)

    void startForegroundService("Drive started — tracking time & location")

    requestAndGetLocation().then((coord) => {
      if (!mountedRef.current) return
      if (!coord) {
        setLocationError("Location access is required for accurate mileage.")
        return
      }
      setLocationError(null)
      primeSessionCoord(coord)
    })
  }

  const handleStopRequest = () => {
    if (saveDisabled) return

    wasRunningBeforeStopRef.current = session.isRunning

    if (session.isRunning) pauseDrive()

    setShowStopConfirm(true)
    setIsPreparingStop(true)

    startFrozenSnapshot({ isPreview: false }).finally(() => {
      if (mountedRef.current) setIsPreparingStop(false)
    })
  }

  const handleCancelStop = () => {
    activeSnapshotAbortRef.current?.abort()
    activeSnapshotAbortRef.current = null
    frozenSnapshotRef.current = null
    setShowStopConfirm(false)
    setIsPreparingStop(false)

    if (wasRunningBeforeStopRef.current) resumeDrive()
  }

  const handleSaveDrive = async () => {
    if (isSavingRef.current || isPreparingStop) return

    isSavingRef.current = true
    setIsStopping(true)

    try {
      clearAllLoops()

      const finalizedDrive = frozenSnapshotRef.current
        ? await frozenSnapshotRef.current
        : await startFrozenSnapshot({ isPreview: false })

      if (!finalizedDrive) return

      const { isPreview: _stripped, ...driveToSave } = finalizedDrive

      saveDrive(driveToSave)
      setCurrentDrive(driveToSave)
      setShowStopConfirm(false)

      void stopForegroundService()

      setScreen("todaysDrive")
      hardReset()
    } catch (err) {
      console.error("[ActiveDrive] Save failed:", err)
      setLocationError("Drive save failed. Please try again before closing the app.")
    } finally {
      isSavingRef.current = false
      setIsStopping(false)
      setIsPreparingStop(false)
      frozenSnapshotRef.current = null
      activeSnapshotAbortRef.current = null
      wasRunningBeforeStopRef.current = false
    }
  }

  const handlePreviewSummary = async () => {
    if (previewDisabled) return

    try {
      setIsPreviewing(true)
      const previewDrive = await startFrozenSnapshot({ isPreview: true })

      if (!mountedRef.current) return
      if (!previewDrive) return

      setCurrentDrive(previewDrive)
      setScreen("summary")
    } finally {
      if (mountedRef.current) setIsPreviewing(false)
    }
  }

  const formattedElapsed = formatTime(displayedMs)

  const effectiveMode: DriveMode | null = hasActiveDrive
    ? getCurrentMode()
    : session.currentMode

  const effectiveNight = effectiveMode === "night"

  const statusClass = isRunning ? "text-[#00C851]" : "text-red-400"
  const statusText = isRunning
    ? "Drive Active"
    : hasActiveDrive
      ? "Drive Paused"
      : "Ready to Start"

  return (
  <div className="flex w-full justify-center px-3 pb-8 pt-3 text-white sm:px-4">
    <div className="w-full max-w-[46rem]">

      {/* ── TOP PANEL: Live Tracking ───────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[42rem]">
        <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/8 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/70 to-[#0A1E5E]" />

          <div className="p-4 sm:p-5">
            <div className="rounded-[24px] border border-white/10 bg-[#08194A]/78 px-4 py-4 shadow-inner sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[clamp(1.6rem,5vw,2.5rem)] font-extrabold leading-none tracking-tight text-white">
                    Live Tracking
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-sm font-medium text-white/82 sm:text-base">
                      {isRunning
                        ? "Drive in Progress"
                        : hasActiveDrive
                          ? "Drive Paused"
                          : "Ready to Start"}
                    </p>

                    {/* ⭐ Pulsing Green Dot */}
                    <span className="relative flex h-3 w-3 items-center justify-center">
                      <span
                        className={`absolute h-3 w-3 rounded-full ${
                          isRunning
                            ? "bg-[#35ff69]/35 animate-live-ping"
                            : "bg-white/15"
                        }`}
                      />
                      <span
                        className={`relative h-2.5 w-2.5 rounded-full ${
                          isRunning
                            ? "bg-[#35ff69] shadow-[0_0_12px_rgba(53,255,105,0.95)]"
                            : "bg-white/35"
                        }`}
                      />
                    </span>
                  </div>
                </div>

                <div
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] ${
                    effectiveNight
                      ? "bg-[#0A1E5E] text-white ring-1 ring-[#f9c80e]/40"
                      : "bg-white text-[#08194A]"
                  }`}
                >
                  {effectiveNight ? "NIGHT" : "DAY"}
                </div>
              </div>

              <div className="mt-4 rounded-full bg-[#06153E]/95 p-1">
                <div className="grid grid-cols-3 gap-1">
                  {(["auto", "day", "night"] as NightOverride[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNightOverride(mode)}
                      aria-pressed={session.nightOverride === mode}
                      className={`rounded-full px-2 py-2.5 text-sm font-extrabold transition ${
                        session.nightOverride === mode
                          ? mode === "auto"
                            ? "bg-[#f9d65c] text-[#08194A] shadow-[0_8px_20px_rgba(249,214,92,0.26)]"
                            : mode === "day"
                              ? "bg-white text-[#08194A] shadow-md"
                              : "bg-[#112869] text-white ring-1 ring-[#f9c80e]/35 shadow-md"
                          : "bg-transparent text-white/88 hover:bg-white/8"
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-center">
                {effectiveNight ? (
                  <MoonIcon className="h-5 w-5 text-[#f9c80e]" />
                ) : (
                  <SunIcon className="h-5 w-5 text-[#f9c80e]" />
                )}
                <p className="text-sm font-semibold text-white/84">
                  {effectiveNight ? "Night Mode" : "Day Mode"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* ── TIMER + PLAY/PAUSE ─────────────────────────────────────────── */}
        <div className="mx-auto mt-6 flex max-w-[42rem] flex-col items-center space-y-3">
          <p className={`text-sm uppercase tracking-[0.18em] ${statusClass}`}>
            {statusText}
          </p>

          <div className="flex w-full items-center justify-center gap-4 sm:gap-5">
            <button
              onClick={handlePress}
              type="button"
              aria-label={
                isRunning
                  ? "Pause drive timer"
                  : hasActiveDrive
                    ? "Resume drive timer"
                    : "Start drive timer"
              }
              className={`flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border-4 border-white shadow-xl transition active:scale-95 ${
                isRunning
                  ? "animate-pulse-slow bg-[#00A651]"
                  : hasActiveDrive
                    ? "bg-green-600"
                    : "bg-red-600"
              }`}
            >
              {isRunning ? (
                <div className="h-3.5 w-3.5 rounded-sm bg-white" />
              ) : (
                <div className="ml-1 h-0 w-0 border-b-[7px] border-l-[12px] border-t-[7px] border-b-transparent border-l-white border-t-transparent" />
              )}
            </button>

            <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,9vw,4.25rem)] font-black leading-none tracking-tight tabular-nums text-white">
              {formattedElapsed}
            </div>
          </div>
        </div>

        {/* ── BOTTOM PANEL: Drive Summary (compact) ─────────────────────── */}
        <div className="mx-auto mt-4 w-full max-w-[42rem] overflow-hidden rounded-[28px] border-2 border-[#0A1E5E]/50 bg-white text-[#0A1E5E] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#0A1E5E]" />

          <div className="p-4 sm:p-5">

            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#0A1E5E]/50">
                  Active Drive
                </p>
                <h3 className="mt-0.5 text-base font-extrabold leading-tight text-[#08194A] sm:text-lg">
                  Drive Summary
                </h3>
              </div>
              <div
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${
                  effectiveNight
                    ? "bg-[#0A1E5E] text-white ring-1 ring-[#f9c80e]/35"
                    : "bg-[#F4F6FA] text-[#08194A] ring-1 ring-[#0A1E5E]/10"
                }`}
              >
                {effectiveNight ? "Night Mode" : "Day Mode"}
              </div>
            </div>

            {/* Duration + Distance stacked */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] px-3 py-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Duration
                </p>
                <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.1rem,4.5vw,1.75rem)] font-black leading-none tracking-tight tabular-nums text-[#08194A]">
                  {formattedElapsed}
                </p>
              </div>

              <div className="rounded-xl border border-[#0A1E5E]/12 bg-[#F7F9FC] px-3 py-3 text-center shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Distance
                </p>
                <p className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.1rem,4.5vw,1.75rem)] font-black leading-none tracking-tight tabular-nums text-[#08194A]">
                  {safeNumber(session.liveMiles).toFixed(1)}
                  <span className="ml-1 text-xs font-bold text-[#0A1E5E]/55">mi</span>
                </p>
                <p className="mt-0.5 text-[9px] text-[#0A1E5E]/35">Live GPS</p>
              </div>
            </div>

            {/* Start Time + Lighting */}
            <div className="mt-2 rounded-xl border border-[#0A1E5E]/12 bg-[#F4F6FA] px-3 py-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                    Start Time
                  </p>
                  <p className="mt-1 tabular-nums text-sm font-semibold text-[#08194A]">
                    {session.startTime
                      ? new Date(session.startTime).toLocaleTimeString()
                      : "--"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                    Lighting
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#08194A]">
                    {effectiveNight ? "Night driving" : "Day driving"}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather */}
            <div className="mt-2 rounded-xl border border-[#0A1E5E]/12 bg-[#F4F6FA] px-3 py-3 shadow-sm">
              <div
                ref={weatherHelpRef}
                className="relative flex items-center justify-center gap-1"
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-[#0A1E5E]/50">
                  Weather Conditions
                </p>
                <button
                  id={weatherHelpButtonId}
                  type="button"
                  aria-label="Weather conditions help"
                  aria-expanded={showWeatherHelp}
                  aria-controls={weatherHelpPanelId}
                  onClick={() => setShowWeatherHelp((prev) => !prev)}
                  className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-[#0A1E5E]/45 transition hover:bg-[#0A1E5E]/5 hover:text-[#0A1E5E]/70"
                >
                  ⓘ
                </button>

                {showWeatherHelp && (
                  <div
                    id={weatherHelpPanelId}
                    aria-labelledby={weatherHelpButtonId}
                    className="absolute left-1/2 top-full z-20 mt-2 w-64 max-w-[80vw] -translate-x-1/2 rounded-lg bg-white p-3 text-left text-xs text-[#08194A] shadow-lg ring-1 ring-black/10"
                  >
                    <p className="font-semibold text-[#0A1E5E]">Optional Weather Tag</p>
                    <p className="mt-1 leading-snug">
                      This is optional and does not affect drive time, mileage, or
                      day/night status. Choose a weather condition only if you want it
                      included in the saved summary.
                    </p>
                    <p className="mt-1 italic text-[#0A1E5E]/70">
                      If you don't select anything, weather will simply be left blank.
                    </p>
                  </div>
                )}
              </div>

              {/* 4-col weather buttons */}
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {["Clear", "Rain", "Snow", "Fog"].map((w) => {
                  const isSelected = session.weather === w
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeather(isSelected ? null : w)}
                      className={`rounded-full border px-1 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? "border-transparent bg-[#f9c80e] text-[#08194A] shadow-[0_0_10px_rgba(249,200,14,0.25)]"
                          : "border-[#0A1E5E]/12 bg-white text-[#0A1E5E]/65 hover:bg-[#f9c80e]/10"
                      }`}
                    >
                      {w}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Location error */}
            {locationError && (
              <div className="mt-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2.5 text-left shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">
                  Location Issue
                </p>
                <p className="mt-0.5 text-xs font-medium text-red-700">
                  {locationError}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 max-[380px]:grid-cols-1">
                <button
                  type="button"
                  onClick={handlePress}
                  disabled={isStopping || isPreviewing || isPreparingStop}
                  className={`w-full rounded-xl py-3.5 text-sm font-bold transition shadow-md ${
                    isStopping || isPreviewing || isPreparingStop
                      ? "cursor-not-allowed bg-gray-300 text-gray-600"
                      : isRunning
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : hasActiveDrive
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-[#08194A] text-white hover:bg-[#0A1E5E]"
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
                  className={`w-full rounded-xl py-3.5 text-sm font-bold transition ${
                    saveDisabled
                      ? "cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.22)] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
                  }`}
                >
                  {isPreparingStop ? "Preparing..." : "Stop Drive"}
                </button>
              </div>

              {/* Stop confirm dialog */}
              {showStopConfirm && (
                <div className="rounded-xl border-2 border-[#f9c80e]/45 bg-[#FFF9E8] p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                    Confirm Stop
                  </p>
                  <h4 className="mt-1 text-base font-extrabold text-[#08194A]">
                    End and save this drive?
                  </h4>
                  <p className="mt-1 text-xs text-[#0A1E5E]/70">
                    This will save the current duration, mileage, route trail,
                    and lighting conditions.
                  </p>

                  {isPreparingStop && (
                    <p className="mt-2 text-xs font-semibold text-[#0A1E5E]">
                      Preparing final snapshot...
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2 max-[380px]:grid-cols-1">
                    <button
                      type="button"
                      onClick={handleCancelStop}
                      disabled={isStopping}
                      className="w-full rounded-xl border border-[#0A1E5E]/15 bg-white py-3.5 text-sm font-bold text-[#08194A] transition hover:bg-[#F7F9FC]"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDrive}
                      disabled={isStopping || isPreparingStop}
                      className={`w-full rounded-xl py-3.5 text-sm font-bold transition ${
                        isStopping || isPreparingStop
                          ? "cursor-not-allowed bg-gray-300 text-gray-500"
                          : "bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.22)] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
                      }`}
                    >
                      {isStopping ? "Saving..." : "Save and End"}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handlePreviewSummary}
                disabled={previewDisabled}
                className={`w-full rounded-xl border-2 border-[#0A1E5E]/50 py-3.5 text-sm font-bold transition ${
                  previewDisabled
                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                    : "bg-white text-[#08194A] shadow-sm hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)]"
                }`}
              >
                {isPreviewing
                  ? "Opening Preview..."
                  : "Preview Summary (Not Saved)"}
              </button>
            </div>
          </div>
        </div>

        <style>
          {`
            @keyframes pulse-slow {
              0% { transform: scale(1); }
              50% { transform: scale(1.06); }
              100% { transform: scale(1); }
            }

            .animate-pulse-slow {
              animation: pulse-slow 2.5s ease-in-out infinite;
            }

            @keyframes live-ping {
              0% {
                transform: scale(0.9);
                opacity: 0.85;
              }
              70% {
                transform: scale(1.9);
                opacity: 0;
              }
              100% {
                transform: scale(1.9);
                opacity: 0;
              }
            }

            .animate-live-ping {
              animation: live-ping 1.6s ease-out infinite;
            }

            @media (prefers-reduced-motion: reduce) {
              .animate-pulse-slow,
              .animate-live-ping {
                animation: none;
              }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default ActiveDriveContent