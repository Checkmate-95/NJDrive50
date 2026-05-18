import { useEffect, useRef, useState, useCallback } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid"
import { saveDrive } from "../state/driveStore"
import type { DriveEntry, NightCalcMode } from "../state/driveStore"
import { navigate } from "../navigation/navMap"
import {
  useActiveDriveStore,
  type NightOverride,
  type DriveMode,
  type RouteCoord,
} from "../state/activeDriveStore"
import {
  getSolarWindowForDate,
  computeDayNightSplit,
} from "../engine/solarEngine"
import { loadOnboardingData } from "../../core/ReminderEngine"
import { Geolocation } from "@capacitor/geolocation"
import { Capacitor } from "@capacitor/core"

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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")

async function getAccurateMileage(start: RouteCoord, end: RouteCoord) {
  try {
    if (!API_BASE_URL) return null

    const res = await fetch(`${API_BASE_URL}/api/computeRoutes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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
    })

    if (!res.ok) return null

    const data = await res.json()
    const meters = data?.routes?.[0]?.distanceMeters
    if (typeof meters !== "number") return null

    return meters / 1609.34
  } catch {
    return null
  }
}

async function requestAndGetLocation(): Promise<RouteCoord | null> {
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
  }
}

type MilesSource = "routes-api" | "gps-accumulated"

type PreviewDriveEntry = DriveEntry & {
  milesSource?: MilesSource
  isPreview?: boolean
}

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

  const currentEndCoord = await requestAndGetLocation()

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
  let milesSource: MilesSource = "gps-accumulated"

  if (fresh.startCoord && currentEndCoord) {
    const routeMiles = await getAccurateMileage(fresh.startCoord, currentEndCoord)
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

  const startDate = new Date(savedStartTime)
  const endDate = new Date(snapshotTime)

  let verifiedNightDurationHours = 0
  let nightCalcMode: NightCalcMode | undefined = "estimated"

  const onboarding = loadOnboardingData()
  const { homeLat, homeLng } = onboarding

  if (
    typeof homeLat === "number" &&
    Number.isFinite(homeLat) &&
    typeof homeLng === "number" &&
    Number.isFinite(homeLng)
  ) {
    const solarWindow = getSolarWindowForDate(homeLat, homeLng, startDate)
    const { nightHours } = computeDayNightSplit(startDate, endDate, solarWindow)

    verifiedNightDurationHours = nightHours
    nightCalcMode = "verified" as NightCalcMode
  }

  return {
    id: crypto.randomUUID(),
    startTime: new Date(savedStartTime).toISOString(),
    endTime: new Date(snapshotTime).toISOString(),

    totalDurationHours: normalizedTotalMs / 3600000,
    dayDurationHours: finalDayMs / 3600000,
    nightDurationHours: finalNightMs / 3600000,
    verifiedNightDurationHours,
    nightCalcMode,
    source: "timer",

    miles: safeNumber(accurateMiles),
    milesSource,
    weather: fresh.weather,
    routeCoords: finalTrail,

    startLatitude: fresh.startCoord?.lat ?? null,
    startLongitude: fresh.startCoord?.lng ?? null,

    isPreview: opts?.isPreview ?? false,
  }
}

function ActiveDriveContent({
  setScreen,
  setCurrentDrive,
}: ActiveDriveContentProps) {
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [isStopping, setIsStopping] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [showWeatherHelp, setShowWeatherHelp] = useState(false)

  const gpsRef = useRef<number | null>(null)
  const frozenSnapshotRef =
    useRef<Promise<PreviewDriveEntry | null> | null>(null)
  const isSavingRef = useRef(false)
  const weatherHelpRef = useRef<HTMLDivElement | null>(null)
  const wasRunningBeforeStopRef = useRef(false)

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

  const clearGpsLoop = useCallback(() => {
    if (gpsRef.current !== null) {
      window.clearInterval(gpsRef.current)
      gpsRef.current = null
    }
  }, [])

  const clearAllLoops = useCallback(() => {
    clearGpsLoop()
  }, [clearGpsLoop])

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

 // ✅ subscribe to the live value instead of the function
const elapsedSeconds = useActiveDriveStore((s) => s.getElapsedSeconds());
const [displayedMs, setDisplayedMs] = useState(elapsedSeconds * 1000);

useEffect(() => {
  if (!session.isRunning) {
    setDisplayedMs(session.dayMs + session.nightMs);
    return;
  }

  const id = window.setInterval(() => {
  console.log("Timer tick:", useActiveDriveStore.getState().getElapsedSeconds());
  setDisplayedMs(useActiveDriveStore.getState().getElapsedSeconds() * 1000);
}, 500);


  return () => window.clearInterval(id);
}, [session.isRunning, session.dayMs, session.nightMs]);

const formattedElapsed = formatTime(displayedMs);



  const isRunning = session.isRunning
  const hasActiveDrive = session.isActive
  const saveDisabled = !hasActiveDrive || displayedMs < 10000 || isStopping
  const previewDisabled =
  !hasActiveDrive || displayedMs < 10000 || isStopping || isPreviewing;


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

  useEffect(() => {
    if (!session.isActive) return

    let cancelled = false

    ;(async () => {
      const coord = await requestAndGetLocation()
      if (cancelled) return
      if (coord) {
        primeSessionCoord(coord)
        setLocationError(null)
      }
      tick(undefined, Date.now())
    })()

    return () => {
      cancelled = true
    }
  }, [session.isActive, primeSessionCoord, tick])

  useEffect(() => {
    clearGpsLoop()

    if (!session.isRunning) return

    gpsRef.current = window.setInterval(() => {
      requestAndGetLocation().then((coord) => {
        if (!coord) {
          setLocationError("Location access is required for accurate mileage.")
          return
        }

        setLocationError(null)
        tick(coord, Date.now())
      })
    }, 10000)

    return clearGpsLoop
  }, [session.isRunning, tick, clearGpsLoop])

  useEffect(() => {
    return () => {
      clearAllLoops()
    }
  }, [clearAllLoops])

  useEffect(() => {
    if (!showWeatherHelp) return

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      if (weatherHelpRef.current && !weatherHelpRef.current.contains(target)) {
        setShowWeatherHelp(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowWeatherHelp(false)
      }
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

  const handlePress = async () => {
    if (isStopping || isPreviewing) return

    if (session.isRunning) {
      pauseDrive()
      setShowStopConfirm(false)
      return
    }

    const coord = await requestAndGetLocation()

    if (!coord) {
      setLocationError("Location access is required to start drive tracking.")
      return
    }

    try {
      if (!session.isActive) {
        const today = new Date()
        const solarWindow = getSolarWindowForDate(coord.lat, coord.lng, today);


        startDrive(Date.now(), coord, {
  sunrise: solarWindow.sunrise ? solarWindow.sunrise.getTime() : 0,
  sunset: solarWindow.sunset ? solarWindow.sunset.getTime() : 0,
});

      } else {
        primeSessionCoord(coord)
        resumeDrive()
      }

      setShowStopConfirm(false)
      setLocationError(null)
    } catch (error) {
      console.error("Location error:", error)
      setLocationError("Location access is required to start drive tracking.")
    }
  }

  const handleStopRequest = () => {
    if (saveDisabled) return

    wasRunningBeforeStopRef.current = session.isRunning

    if (session.isRunning) pauseDrive()

    frozenSnapshotRef.current = buildDriveSnapshot({ isPreview: false })
    setShowStopConfirm(true)
  }

  const handleCancelStop = () => {
    frozenSnapshotRef.current = null
    setShowStopConfirm(false)

    if (wasRunningBeforeStopRef.current) {
      resumeDrive()
    }
  }

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

      const {
        isPreview: _stripped,
        milesSource: _src,
        ...driveToSave
      } = finalizedDrive

      saveDrive(driveToSave)
      setCurrentDrive(driveToSave as DriveEntry)
      setShowStopConfirm(false)

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
      wasRunningBeforeStopRef.current = false
    }
  }

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
    <div className="flex w-full justify-center px-3 pb-8 pt-3 text-white sm:px-4">
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
                  {(["auto", "day", "night"] as NightOverride[]).map((mode) => (
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
                <div className="ml-1 h-0 w-0 border-b-[7px] border-l-[12px] border-t-[7px] border-b-transparent border-l-white border-t-transparent" />
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

            <div className="mt-5 flex flex-col gap-3">
              <div className="w-full rounded-2xl border-2 border-[#0A1E5E]/50 bg-[#F7F9FC] p-4 text-center shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                  Duration
                </p>
                <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[clamp(1.35rem,5vw,2.25rem)] font-black leading-none tracking-tight tabular-nums text-[#08194A]">
                  {formattedElapsed}
                </p>
              </div>

              <div className="w-full rounded-2xl border-2 border-[#0A1E5E]/50 bg-[#F7F9FC] p-4 text-center shadow-sm">
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
              <div className="grid grid-cols-1 items-center gap-4 text-center sm:grid-cols-2">
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

                <div className="flex flex-col items-center sm:col-span-2">
                  <div
                    ref={weatherHelpRef}
                    className="relative flex items-center justify-center gap-1"
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#0A1E5E]/55">
                      Weather Conditions
                    </p>

                    <button
                      type="button"
                      aria-label="Weather conditions help"
                      aria-expanded={showWeatherHelp}
                      onClick={() => setShowWeatherHelp((prev) => !prev)}
                      className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold text-[#0A1E5E]/50 transition hover:bg-[#0A1E5E]/5 hover:text-[#0A1E5E]/80"
                    >
                      ⓘ
                    </button>

                    {showWeatherHelp && (
                      <div
                        role="dialog"
                        aria-label="Weather help"
                        className="absolute left-1/2 top-full z-20 mt-2 w-64 max-w-[80vw] -translate-x-1/2 rounded-lg bg-white p-3 text-left text-xs text-[#08194A] shadow-lg ring-1 ring-black/10"
                      >
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
                          If you don’t select anything, weather will simply be
                          left blank.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {["Clear", "Rain", "Snow", "Fog"].map((w) => {
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
              <div className="grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
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

                  <div className="mt-4 grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
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

            @media (prefers-reduced-motion: reduce) {
              .animate-pulse-slow {
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