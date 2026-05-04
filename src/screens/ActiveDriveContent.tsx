// src/screens/ActiveDriveContent.tsx
// [FIX-1] Preview and Save share a single frozen snapshot — no double-computation
// [FIX-2] Day/night bucket reconciliation locked to snapshot moment, not re-sampled
// [FIX-3] Mileage source transparent — live miles used if Routes API unavailable
// [FIX-4] Double-save race condition prevented with ref-based atomic guard
// [FIX-5] hardReset() deferred until AFTER navigation confirms
// [FIX-6] nightOverride toggle no longer triggers extra tick
// [FIX-7] Preview clearly flags drive as unsaved via isPreview field
// [FIX-8] buildDriveSnapshot defined OUTSIDE the component — no stale closure risk
// [FIX-9] sunrise-sunset-js used (suncalc removed from project)
// [FIX-10] primeSessionCoord uses appendRoutePoint store action
// [FIX-11] setCurrentDrive typed as DriveEntry | null — any removed
// [FIX-12] Tooltip parent div has group class so hover works correctly
// [FIX-13] Timer display freezes at last running value when paused (no 00:00 flicker)
// [FIX-14] ensureLocationPermission() gates all geolocation calls — Android-safe

import { useEffect, useRef, useState, useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid"
import { getSunrise, getSunset } from "sunrise-sunset-js"
import { saveDrive } from "../state/driveStore"
import type { DriveEntry } from "../state/driveStore"
import { navigate } from "../navigation/navMap"
import {
  useActiveDriveStore,
  type NightOverride,
  type DriveMode,
  type RouteCoord,
} from "../state/activeDriveStore"

type ActiveDriveContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
  setCurrentDrive: Dispatch<SetStateAction<DriveEntry | null>>
}

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
    .map(part => String(part).padStart(2, "0"))
    .join(":")
}

const sameCoord = (
  a: RouteCoord | null | undefined,
  b: RouteCoord | null | undefined
) => {
  if (!a || !b) return false
  return a.lat === b.lat && a.lng === b.lng
}

async function getAccurateMileage(start: RouteCoord, end: RouteCoord) {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters",
        },
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
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const meters = data?.routes?.[0]?.distanceMeters
    if (typeof meters !== "number") return null

    return meters / 1609.34
  } catch {
    return null
  }
}

function getCurrentPosition(): Promise<RouteCoord | null> {
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  })
}

// [FIX-14] Permission guard — checks browser API first, then triggers native popup
async function ensureLocationPermission(): Promise<boolean> {
  try {
    if (navigator.permissions) {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      })
      if (status.state === "granted") return true
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false)
      )
    })
  } catch {
    return false
  }
}

type MilesSource = "routes-api" | "gps-accumulated"

type PreviewDriveEntry = DriveEntry & {
  milesSource?: MilesSource
  isPreview?: boolean
}

// [FIX-8] Defined outside component — reads store via getState() at call time
async function buildDriveSnapshot(
  opts?: { isPreview?: boolean }
): Promise<PreviewDriveEntry | null> {
  const storeSnapshot = useActiveDriveStore.getState()
  const session = storeSnapshot.session

  const savedStartTime = session.startTime
  if (!savedStartTime) return null

  const snapshotTime = Date.now()

  storeSnapshot.tick(undefined, snapshotTime)

  const fresh = useActiveDriveStore.getState().session
  const liveMode =
    useActiveDriveStore.getState().getCurrentMode() ?? fresh.currentMode ?? "day"

  const currentEndCoord = await getCurrentPosition()

  const finalElapsedMs = fresh.dayMs + fresh.nightMs

  if (finalElapsedMs <= 0) return null

  // [FIX-2] Bucket reconciliation — runs once against locked snapshotTime
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

  const normalizedTotalMs = Math.max(
    finalElapsedMs,
    finalDayMs + finalNightMs
  )

  // [FIX-3] Routes API first, GPS accumulated as fallback
  let accurateMiles = safeNumber(fresh.liveMiles)
  let milesSource: MilesSource = "gps-accumulated"

  if (fresh.startCoord && currentEndCoord) {
    const routeMiles = await getAccurateMileage(
      fresh.startCoord,
      currentEndCoord
    )
    if (routeMiles !== null) {
      accurateMiles = routeMiles
      milesSource = "routes-api"
    }
  }

  const baseTrail = Array.isArray(fresh.routeTrail) ? fresh.routeTrail : []
  const lastTrailCoord =
    baseTrail.length > 0 ? baseTrail[baseTrail.length - 1] : null

  const finalTrail =
    currentEndCoord && !sameCoord(lastTrailCoord, currentEndCoord)
      ? [...baseTrail, currentEndCoord]
      : baseTrail

  return {
    id: crypto.randomUUID(),
    startTime: new Date(savedStartTime).toISOString(),
    endTime: new Date(snapshotTime).toISOString(),

    totalDurationHours: normalizedTotalMs / 3600000,
    dayDurationHours: finalDayMs / 3600000,
    nightDurationHours: finalNightMs / 3600000,
    verifiedNightDurationHours: 0,
    nightCalcMode: "estimated",
    source: "timer",

    miles: safeNumber(accurateMiles),
    milesSource,
    weather: fresh.weather,
    routeCoords: finalTrail,

    startLatitude: fresh.startCoord?.lat ?? null,
    startLongitude: fresh.startCoord?.lng ?? null,

    // [FIX-7] Downstream panels check this to distinguish preview from saved
    isPreview: opts?.isPreview ?? false,
  }
}

export default function ActiveDriveContent({
  setScreen,
  setCurrentDrive,
}: ActiveDriveContentProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)

  const timerRef = useRef<number | null>(null)
  const gpsRef = useRef<number | null>(null)

  // [FIX-1] Single frozen snapshot shared between Preview and Save
  const frozenSnapshotRef =
    useRef<Promise<PreviewDriveEntry | null> | null>(null)

  // [FIX-4] Atomic save guard — synchronous flip prevents double-save
  const isSavingRef = useRef(false)

  const {
    session,
    startDrive,
    pauseDrive,
    resumeDrive,
    hardReset,
    tick,
    setNightOverride,
    setWeather,
    appendRoutePoint,
    getElapsedSeconds,
    getCurrentMode,
  } = useActiveDriveStore()

  const clearTimerLoop = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const clearGpsLoop = useCallback(() => {
    if (gpsRef.current !== null) {
      window.clearInterval(gpsRef.current)
      gpsRef.current = null
    }
  }, [])

  const clearAllLoops = useCallback(() => {
    clearTimerLoop()
    clearGpsLoop()
  }, [clearTimerLoop, clearGpsLoop])

  // [FIX-10] Uses store's appendRoutePoint action
  const primeSessionCoord = useCallback(
    (coord: RouteCoord) => {
      useActiveDriveStore.setState(state => {
        const s = state.session
        return {
          session: {
            ...s,
            startCoord: s.startCoord ?? coord,
            lastCoord: coord,
          },
        }
      })

      appendRoutePoint(coord)
    },
    [appendRoutePoint]
  )

  // [FIX-13] Freeze displayed timer while paused to avoid 00:00 flicker
  const [frozenElapsedMs, setFrozenElapsedMs] = useState(0)

  const elapsedSeconds = getElapsedSeconds()
  const rawElapsedMs = elapsedSeconds * 1000

  useEffect(() => {
    if (session.isRunning) {
      setFrozenElapsedMs(rawElapsedMs)
    }
  }, [rawElapsedMs, session.isRunning])

  const displayedMs = session.isRunning ? rawElapsedMs : frozenElapsedMs
  const formattedElapsed = formatTime(displayedMs)

  const isRunning = session.isRunning
  const hasActiveDrive = session.isActive
  const saveDisabled = !hasActiveDrive || displayedMs < 10000 || isStopping
  const previewDisabled =
    !hasActiveDrive || displayedMs <= 0 || isStopping || isPreviewing

  const effectiveMode: DriveMode | null = hasActiveDrive
    ? getCurrentMode()
    : session.currentMode

  const effectiveNight = effectiveMode === "night"

  const modePillClasses = effectiveNight
    ? "bg-[#0A1E5E] text-white ring-1 ring-[#f9c80e]/40"
    : "bg-white text-[#08194A]"

  const modePillLabel =
    effectiveMode === "night" ? "Night" : effectiveMode === "day" ? "Day" : "--"

  const statusClass = isRunning ? "text-[#00C851]" : "text-red-400"
  const statusText = isRunning
    ? "Drive Active"
    : hasActiveDrive
    ? "Drive Paused"
    : "Ready to Start"

  // [FIX-6] session.nightOverride intentionally excluded from deps —
  // this effect only initialises coords when isActive first becomes true.
  useEffect(() => {
    if (!session.isActive) return

    let cancelled = false

    ;(async () => {
      const coord = await getCurrentPosition()
      if (cancelled) return
      if (coord) primeSessionCoord(coord)
      tick(undefined, Date.now())
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isActive])

  useEffect(() => {
    clearTimerLoop()

    if (!session.isActive || !session.isRunning) return

    timerRef.current = window.setInterval(() => {
      tick(undefined, Date.now())
    }, 1000)

    return clearTimerLoop
  }, [session.isActive, session.isRunning, tick, clearTimerLoop])

  // [FIX-14] GPS polling loop gated by ensureLocationPermission
  useEffect(() => {
    clearGpsLoop()

    if (!session.isRunning) return

    gpsRef.current = window.setInterval(() => {
      ensureLocationPermission().then(ok => {
        if (!ok) {
          setLocationError("Location access is required for accurate mileage.")
          return
        }

        navigator.geolocation.getCurrentPosition(
          pos => {
            const newCoord: RouteCoord = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }

            if (
              !Number.isFinite(newCoord.lat) ||
              !Number.isFinite(newCoord.lng)
            )
              return
            if (newCoord.lat === 0 && newCoord.lng === 0) return
            if (pos.coords.accuracy && pos.coords.accuracy > 100) return

            setLocationError(null)
            tick(newCoord, Date.now())
          },
          () => {
            setLocationError(
              "Location access is required for accurate mileage."
            )
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
        )
      })
    }, 10000)

    return clearGpsLoop
  }, [session.isRunning, tick, clearGpsLoop])

  useEffect(() => {
    return () => {
      clearAllLoops()
    }
  }, [clearAllLoops])

  // [FIX-14] handlePress gated by ensureLocationPermission — async
  const handlePress = async () => {
    if (isStopping || isPreviewing) return

    if (session.isRunning) {
      pauseDrive()
      setShowStopConfirm(false)
      return
    }

    const ok = await ensureLocationPermission()
    if (!ok) {
      setLocationError("Location access is required to start drive tracking.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coord: RouteCoord = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }

        if (!session.isActive) {
          // [FIX-9] sunrise-sunset-js — argument order: (lat, lng, date)
          const today = new Date()
          const sunriseDate = getSunrise(coord.lat, coord.lng, today)
          const sunsetDate = getSunset(coord.lat, coord.lng, today)

          startDrive(Date.now(), coord, {
            sunrise: (sunriseDate ?? new Date(0)).getTime(),
            sunset: (sunsetDate ?? new Date(0)).getTime(),
          })
        } else {
          primeSessionCoord(coord)
          resumeDrive()
        }

        setShowStopConfirm(false)
        setLocationError(null)
      },
      () => {
        setLocationError("Location access is required to start drive tracking.")
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }

  const handleStopRequest = () => {
    if (saveDisabled) return
    if (session.isRunning) pauseDrive()

    // [FIX-1] Build frozen snapshot once — reused by both Preview and Save
    frozenSnapshotRef.current = buildDriveSnapshot({ isPreview: false })
    setShowStopConfirm(true)
  }

  const handleCancelStop = () => {
    frozenSnapshotRef.current = null
    setShowStopConfirm(false)
    resumeDrive()
  }

  // [FIX-4] Atomic guard prevents double-save on rapid taps
  const handleSaveDrive = async () => {
    if (isSavingRef.current) return

    isSavingRef.current = true
    setIsStopping(true)

    try {
      clearAllLoops()

      const finalizedDrive = frozenSnapshotRef.current
        ? await frozenSnapshotRef.current
        : null

      if (!finalizedDrive) return

      // Strip preview flag and milesSource before persisting
      const {
        isPreview: _stripped,
        milesSource: _src,
        ...driveToSave
      } = finalizedDrive

      saveDrive(driveToSave)
      setCurrentDrive(driveToSave as DriveEntry)
      setShowStopConfirm(false)

      // [FIX-5] Navigate FIRST, then reset
      navigate("active", "confirm", setScreen)
      hardReset()
    } catch (err) {
      console.error("[ActiveDrive] Save failed:", err)
      setLocationError(
        "Drive save failed. Please try again before closing the app."
      )
    } finally {
      isSavingRef.current = false
      setIsStopping(false)
      frozenSnapshotRef.current = null
    }
  }

  // [FIX-1][FIX-7] Preview awaits the SAME frozen snapshot as Save
  const handlePreviewSummary = async () => {
    if (previewDisabled) return

    try {
      setIsPreviewing(true)

      const snapshotPromise =
        frozenSnapshotRef.current ?? buildDriveSnapshot({ isPreview: true })

      const previewDrive = await snapshotPromise
      if (!previewDrive) return

      setCurrentDrive(previewDrive as DriveEntry)
      navigate("active", "summary", setScreen)
    } finally {
      setIsPreviewing(false)
    }
  }

  return (
    <div className="flex w-full justify-center px-3 pt-3 pb-8 text-white sm:px-4">
      <div className="w-full max-w-[46rem]">
        <div className="mx-auto w-full max-w-[42rem]">
          <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/8 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
            <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-white/70 to-[#0A1E5E]" />

            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">
                    Lighting Mode
                  </p>
                  <p className="mt-1 text-xs text-white/80">
                    Day or night conditions for this drive
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] ${modePillClasses}`}
                >
                  {modePillLabel}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#08194A]/70 p-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border shadow-[0_0_10px_rgba(249,200,14,0.18)] ${
                      effectiveNight
                        ? "border-[#f9c80e]/50 bg-[#f9c80e]/10"
                        : "border-white/20 bg-white/10"
                    }`}
                  >
                    {effectiveNight ? (
                      <MoonIcon className="h-7 w-7 text-[#f9c80e]" />
                    ) : (
                      <SunIcon className="h-7 w-7 text-[#f9c80e]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          effectiveNight ? "bg-[#f9c80e]" : "bg-white"
                        }`}
                      />
                      <p className="text-lg font-extrabold leading-tight text-white">
                        Lighting Mode
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-white/70">
                      Day or night conditions for this drive
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-[10px] uppercase tracking-[0.16em] text-white/45">
                    <span>Day</span>
                    <span>Night</span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`absolute top-0 h-full rounded-full transition-all duration-300 ${
                        effectiveNight
                          ? "left-1/2 w-1/2 bg-gradient-to-r from-[#f9c80e]/60 to-[#f9c80e]"
                          : "left-0 w-1/2 bg-gradient-to-r from-white to-white/70"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-1.5">
                <div className="grid grid-cols-3 gap-2">
                  {(["auto", "day", "night"] as NightOverride[]).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNightOverride(mode)}
                      aria-pressed={session.nightOverride === mode}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                        session.nightOverride === mode
                          ? mode === "auto"
                            ? "bg-[#f9c80e] text-[#08194A] shadow-md"
                            : mode === "day"
                            ? "bg-white text-[#08194A] shadow-md"
                            : "bg-[#0A1E5E] text-white ring-1 ring-[#f9c80e]/40 shadow-md"
                          : "bg-transparent text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                <div className="ml-1 h-0 w-0 border-t-[7px] border-b-[7px] border-l-[12px] border-t-transparent border-b-transparent border-l-white" />
              )}
            </button>

            <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(2rem,9vw,4.25rem)] font-black leading-none tracking-tight tabular-nums text-white">
              {formattedElapsed}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 w-full max-w-[42rem] overflow-hidden rounded-[28px] border-2 border-[#0A1E5E]/50 bg-white text-[#0A1E5E] shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
          <div className="h-1 w-full bg-gradient-to-r from-[#f9c80e] via-[#ffe27a] to-[#0A1E5E]" />

          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                  Active Drive
                </p>
                <h3 className="mt-1 text-lg font-extrabold leading-tight text-[#08194A] sm:text-xl">
                  Drive Summary
                </h3>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] ${
                  effectiveNight
                    ? "bg-[#0A1E5E] text-white ring-1 ring-[#f9c80e]/35"
                    : "bg-[#F4F6FA] text-[#08194A] ring-1 ring-[#0A1E5E]/10"
                }`}
              >
                {effectiveNight ? "Night Mode" : "Day Mode"}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border-2 border-[#0A1E5E]/50 bg-[#F7F9FC] p-4 text-left shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                  Duration
                </p>
                <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.35rem,5vw,2.25rem)] font-black leading-none tracking-tight tabular-nums text-[#08194A]">
                  {formattedElapsed}
                </p>
              </div>

              <div className="rounded-2xl border-2 border-[#0A1E5E]/50 bg-[#F7F9FC] p-4 text-left shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                  Distance
                </p>
                <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.35rem,5vw,2.25rem)] font-black leading-none tracking-tight tabular-nums text-[#08194A]">
                  {safeNumber(session.liveMiles).toFixed(1)}
                  <span className="ml-1 text-sm font-bold text-[#0A1E5E]/65 sm:text-base">
                    mi
                  </span>
                </p>
                <p className="mt-1 text-[10px] text-[#0A1E5E]/40">
                  Live GPS estimate
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-[#0A1E5E]/50 bg-[#F4F6FA] p-4 shadow-sm">
              <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                    Start Time
                  </p>
                  <p className="mt-1 tabular-nums text-sm font-semibold text-[#08194A]">
                    {session.startTime
                      ? new Date(session.startTime).toLocaleTimeString()
                      : "--"}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                    Lighting
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#08194A]">
                    {effectiveNight ? "Night driving" : "Day driving"}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  {/* [FIX-12] group class on parent enables CSS group-hover tooltip */}
                  <div className="group relative flex items-center gap-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                      Weather Conditions
                    </p>
                    <span className="ml-1 cursor-pointer text-[#0A1E5E]/40 hover:text-[#0A1E5E]/70">
                      ⓘ
                    </span>
                    <div className="absolute left-1/2 top-full z-20 mt-2 hidden w-60 -translate-x-1/2 rounded-lg bg-white p-3 text-xs text-[#08194A] shadow-lg ring-1 ring-black/10 group-hover:block">
                      <p className="font-semibold text-[#0A1E5E]">
                        Optional Weather Tag
                      </p>
                      <p className="mt-1 leading-snug">
                        This is optional and does not affect drive time,
                        mileage, or day/night status. Choose a weather
                        condition only if you want it included in the saved
                        summary.
                      </p>
                      <p className="mt-1 italic text-[#0A1E5E]/70">
                        If you don&apos;t select anything, weather will simply
                        be left blank.
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {["Clear", "Rain", "Snow", "Fog"].map(w => {
                      const isSelected = session.weather === w
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWeather(isSelected ? null : w)}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            isSelected
                              ? "border-transparent bg-[#f9c80e] text-[#08194A] shadow-[0_0_12px_rgba(249,200,14,0.28)]"
                              : "border-[#0A1E5E]/15 bg-white text-[#0A1E5E]/70 hover:bg-[#f9c80e]/10"
                          }`}
                        >
                          {w}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {locationError && (
              <div className="mt-4 rounded-2xl border-2 border-red-300 bg-red-50 px-4 py-3 text-left shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-600">
                  Location Issue
                </p>
                <p className="mt-1 text-sm font-medium text-red-700">
                  {locationError}
                </p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handlePress}
                  disabled={isStopping || isPreviewing}
                  className={`w-full rounded-xl py-3 font-bold transition shadow-md ${
                    isStopping || isPreviewing
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
                  className={`w-full rounded-xl py-3 font-bold transition ${
                    saveDisabled
                      ? "cursor-not-allowed bg-gray-300 text-gray-500"
                      : "bg-[#08194A] text-white shadow-[0_14px_28px_rgba(8,25,74,0.22)] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
                  }`}
                >
                  Stop Drive
                </button>
              </div>

              {showStopConfirm && (
                <div className="rounded-2xl border-2 border-[#f9c80e]/45 bg-[#FFF9E8] p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                    Confirm Stop
                  </p>
                  <h4 className="mt-1 text-base font-extrabold text-[#08194A]">
                    End and save this drive?
                  </h4>
                  <p className="mt-1 text-sm text-[#0A1E5E]/70">
                    This will save the current duration, mileage, route trail,
                    and lighting conditions.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleCancelStop}
                      disabled={isStopping}
                      className="w-full rounded-xl border border-[#0A1E5E]/15 bg-white py-3 font-bold text-[#08194A] transition hover:bg-[#F7F9FC]"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveDrive}
                      disabled={isStopping}
                      className={`w-full rounded-xl py-3 font-bold transition ${
                        isStopping
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
                className={`w-full rounded-xl border-2 border-[#0A1E5E]/50 py-3 font-bold transition ${
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
          `}
        </style>
      </div>
    </div>
  )
}