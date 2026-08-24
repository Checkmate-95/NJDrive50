// src/state/activeDriveStore.ts

import { App as CapacitorApp } from "@capacitor/app"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  computeDayNightSplit,
  getCurrentSolarMode,
  getSolarWindowForDate,
  MAX_DRIVE_DURATION_MS,
} from "../engine/solarEngine"

export type DriveMode = "day" | "night" | "unverified"

export type RouteCoord = {
  lat: number
  lng: number
  at?: number
  accuracy?: number | null
  heading?: number | null
  gpsSpeedMps?: number | null
}

export type ActiveDriveSession = {
  isActive: boolean
  isRunning: boolean
  exceededMaxDuration: boolean

  startTime: number | null
  stopTime: number | null

  dayMs: number
  nightMs: number
  unverifiedMs: number
  pausedMs: number

  currentMode: DriveMode
  solarStatus: "verified" | "unverified"

  lastUpdated: number | null
  lastTickAt: number | null

  weather: string | null
  outsideTempF: number | null
  outsideTempUpdatedAt: number | null

  location: { latitude: number; longitude: number } | null

  liveMiles: number
  currentSpeed: number
  startCoord: RouteCoord | null
  lastCoord: RouteCoord | null
  routeTrail: RouteCoord[]
}

type StartDriveOptions = {
  weather?: string | null
}

type ActiveDriveStore = {
  session: ActiveDriveSession

  hardReset: () => void

  startDrive: (
    now?: number,
    coord?: RouteCoord | null,
    options?: StartDriveOptions
  ) => void

  pauseDrive: (now?: number) => void
  resumeDrive: (now?: number) => void

  stopDrive: (
    now?: number,
    finalCoord?: RouteCoord | null
  ) => void

  tick: (coord?: RouteCoord | null, nowOverride?: number) => void

  setWeather: (weather: string | null) => void
  setOutsideTemp: (temperatureF: number | null, updatedAt?: number) => void
  appendRoutePoint: (coord: RouteCoord) => void
  clearRoute: () => void

  getElapsedSeconds: () => number

  getDayNightSeconds: () => {
    daySeconds: number
    nightSeconds: number
    unverifiedSeconds: number
  }

  getCurrentMode: () => DriveMode

  _tickInterval: number | null
  _appStateListener: (() => void) | null

  startGlobalTick: () => void
  stopGlobalTick: () => void
}

const STORAGE_KEY = "njdrive50_active_drive"
const MAX_ROUTE_POINTS = 500
const EARTH_RADIUS_MILES = 3958.7613
const GLOBAL_TICK_MS = 1_000
const MIN_MOVEMENT_MILES = 0.01
const MAX_SINGLE_POINT_JUMP_MILES = 2

const MAX_GPS_ACCURACY_METERS = 65
const MIN_SPEED_SAMPLE_MS = 1_000
const MAX_SPEED_SAMPLE_MS = 15_000
const MAX_REASONABLE_SPEED_MPH = 120
const SPEED_STALE_AFTER_MS = 8_000
const PARKED_SPEED_THRESHOLD_MPH = 4
const TINY_MOVEMENT_MILES = 0.001


const METERS_PER_SECOND_TO_MPH = 2.236936

export const UNVERIFIED_GRACE_MS = 45_000

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

function createInitialSession(): ActiveDriveSession {
  return {
    isActive: false,
    isRunning: false,
    exceededMaxDuration: false,

    startTime: null,
    stopTime: null,

    dayMs: 0,
    nightMs: 0,
    unverifiedMs: 0,
    pausedMs: 0,

    currentMode: "unverified",
    solarStatus: "unverified",

    lastUpdated: null,
    lastTickAt: null,

    weather: null,
    outsideTempF: null,
    outsideTempUpdatedAt: null,

    location: null,

    liveMiles: 0,
    currentSpeed: 0,
    startCoord: null,
    lastCoord: null,
    routeTrail: [],
  }
}

function normalizeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function normalizeNonNegativeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback
}

function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360
}

function isValidCoord(
  coord: RouteCoord | null | undefined
): coord is RouteCoord {
  return Boolean(
    coord &&
      Number.isFinite(coord.lat) &&
      Number.isFinite(coord.lng) &&
      coord.lat >= -90 &&
      coord.lat <= 90 &&
      coord.lng >= -180 &&
      coord.lng <= 180
  )
}

function normalizeRouteCoord(value: unknown): RouteCoord | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Partial<RouteCoord>

  if (
    typeof raw.lat !== "number" ||
    !Number.isFinite(raw.lat) ||
    raw.lat < -90 ||
    raw.lat > 90 ||
    typeof raw.lng !== "number" ||
    !Number.isFinite(raw.lng) ||
    raw.lng < -180 ||
    raw.lng > 180
  ) {
    return null
  }

  return {
    lat: raw.lat,
    lng: raw.lng,
    at:
      typeof raw.at === "number" && Number.isFinite(raw.at)
        ? raw.at
        : undefined,
    accuracy:
      typeof raw.accuracy === "number" && Number.isFinite(raw.accuracy)
        ? Math.max(0, raw.accuracy)
        : null,
    heading:
      typeof raw.heading === "number" && Number.isFinite(raw.heading)
        ? normalizeHeading(raw.heading)
        : null,
    gpsSpeedMps:
      typeof raw.gpsSpeedMps === "number" && Number.isFinite(raw.gpsSpeedMps)
        ? Math.max(0, raw.gpsSpeedMps)
        : null,
  }
}

function normalizeRouteTrail(value: unknown): RouteCoord[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeRouteCoord)
    .filter((coord): coord is RouteCoord => coord !== null)
    .slice(-MAX_ROUTE_POINTS)
}

function normalizeSession(value: unknown): ActiveDriveSession {
  const initial = createInitialSession()

  if (!value || typeof value !== "object") return initial

  const raw = value as Partial<ActiveDriveSession>

  const currentMode: DriveMode =
    raw.currentMode === "day" || raw.currentMode === "night"
      ? raw.currentMode
      : "unverified"

  return {
    isActive: raw.isActive === true,
    isRunning: raw.isRunning === true,
    exceededMaxDuration: raw.exceededMaxDuration === true,

    startTime: normalizeNumber(raw.startTime),
    stopTime: normalizeNumber(raw.stopTime),

    dayMs: normalizeNonNegativeNumber(raw.dayMs),
    nightMs: normalizeNonNegativeNumber(raw.nightMs),
    unverifiedMs: normalizeNonNegativeNumber(raw.unverifiedMs),
    pausedMs: normalizeNonNegativeNumber(raw.pausedMs),

    currentMode,
    solarStatus: raw.solarStatus === "verified" ? "verified" : "unverified",

    lastUpdated: normalizeNumber(raw.lastUpdated),
    lastTickAt: normalizeNumber(raw.lastTickAt),

    weather: typeof raw.weather === "string" ? raw.weather : null,
    outsideTempF:
      typeof raw.outsideTempF === "number" &&
      Number.isFinite(raw.outsideTempF)
        ? raw.outsideTempF
        : null,
    outsideTempUpdatedAt: normalizeNumber(raw.outsideTempUpdatedAt),

    location:
      raw.location &&
      typeof (raw.location as { latitude?: unknown }).latitude === "number" &&
      typeof (raw.location as { longitude?: unknown }).longitude === "number"
        ? {
            latitude: (raw.location as { latitude: number }).latitude,
            longitude: (raw.location as { longitude: number }).longitude,
          }
        : null,

    liveMiles: normalizeNonNegativeNumber(raw.liveMiles),
    currentSpeed: normalizeNonNegativeNumber(raw.currentSpeed),

    startCoord: normalizeRouteCoord(raw.startCoord),
    lastCoord: normalizeRouteCoord(raw.lastCoord),
    routeTrail: normalizeRouteTrail(raw.routeTrail),
  }
}

function normalizeIncomingCoord(coord: RouteCoord, now: number): RouteCoord {
  return {
    lat: coord.lat,
    lng: coord.lng,
    at:
      typeof coord.at === "number" && Number.isFinite(coord.at)
        ? coord.at
        : now,
    accuracy:
      typeof coord.accuracy === "number" && Number.isFinite(coord.accuracy)
        ? Math.max(0, coord.accuracy)
        : null,
    heading:
      typeof coord.heading === "number" && Number.isFinite(coord.heading)
        ? normalizeHeading(coord.heading)
        : null,
    gpsSpeedMps:
      typeof coord.gpsSpeedMps === "number" &&
      Number.isFinite(coord.gpsSpeedMps)
        ? Math.max(0, coord.gpsSpeedMps)
        : null,
  }
}

function getSolarStatus(
  dayMs: number,
  nightMs: number,
  unverifiedMs: number
): "verified" | "unverified" {
  const hasSolarClassification = dayMs + nightMs > 0

  return hasSolarClassification && unverifiedMs <= UNVERIFIED_GRACE_MS
    ? "verified"
    : "unverified"
}

function flushSessionToNow(
  session: ActiveDriveSession,
  now: number,
  coord?: RouteCoord | null
): ActiveDriveSession {
  if (!session.isActive || !session.isRunning || session.startTime === null) {
    return session
  }

  const totalElapsedMs = now - session.startTime - session.pausedMs

  if (totalElapsedMs > MAX_DRIVE_DURATION_MS) {
    return {
      ...session,
      isRunning: false,
      exceededMaxDuration: true,
      solarStatus: "unverified",
      stopTime: now,
      lastUpdated: now,
      lastTickAt: now,
      currentSpeed: 0,
    }
  }

  const baseline = session.lastTickAt ?? session.startTime

  if (!Number.isFinite(baseline) || now <= baseline) {
    return { ...session, lastUpdated: now }
  }

  const gapMs = now - baseline
  const smallGapMs = 60_000
  const effectiveCoord = coord ?? session.lastCoord ?? session.startCoord
  const validCoord = isValidCoord(effectiveCoord) ? effectiveCoord : null

  let addDay = 0
  let addNight = 0
  let addUnverified = 0

  if (gapMs <= smallGapMs || !validCoord) {
    const mode = validCoord
      ? getCurrentSolarMode(new Date(baseline), validCoord.lat, validCoord.lng)
      : "unverified"

    if (mode === "day") addDay = gapMs
    else if (mode === "night") addNight = gapMs
    else addUnverified = gapMs
  } else {
    const split = computeDayNightSplit(
      new Date(baseline),
      new Date(now),
      (date: Date) =>
        getSolarWindowForDate(validCoord!.lat, validCoord!.lng, date)
    )

    if (split.mode === "solar") {
      addDay = split.dayHours * 3_600_000
      addNight = split.nightHours * 3_600_000
    } else {
      addUnverified = gapMs
    }
  }

  const dayMs = session.dayMs + addDay
  const nightMs = session.nightMs + addNight
  const unverifiedMs = session.unverifiedMs + addUnverified

  return {
    ...session,
    dayMs,
    nightMs,
    unverifiedMs,
    currentMode: validCoord
      ? getCurrentSolarMode(new Date(now), validCoord.lat, validCoord.lng)
      : "unverified",
    solarStatus: getSolarStatus(dayMs, nightMs, unverifiedMs),
    lastUpdated: now,
    lastTickAt: now,
  }
}

function haversineMiles(a: RouteCoord, b: RouteCoord): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180

  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const lat1 = radians(a.lat)
  const lat2 = radians(b.lat)

  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

function shouldCountDistance(deltaMiles: number): boolean {
  return (
    Number.isFinite(deltaMiles) &&
    deltaMiles >= MIN_MOVEMENT_MILES &&
    deltaMiles <= MAX_SINGLE_POINT_JUMP_MILES
  )
}

function isUsableSpeedCoord(coord: RouteCoord): boolean {
  return (
    coord.accuracy === null ||
    coord.accuracy === undefined ||
    coord.accuracy <= MAX_GPS_ACCURACY_METERS
  )
}

function calculateManualSpeedMph(
  from: RouteCoord,
  to: RouteCoord
): number | null {
  if (!isUsableSpeedCoord(from) || !isUsableSpeedCoord(to)) return null

  if (
    typeof from.at !== "number" ||
    typeof to.at !== "number" ||
    to.at <= from.at
  ) {
    return null
  }

  const elapsedMs = to.at - from.at

  if (elapsedMs < MIN_SPEED_SAMPLE_MS || elapsedMs > MAX_SPEED_SAMPLE_MS) {
    return null
  }

  const deltaMiles = haversineMiles(from, to)
  const speedMph = deltaMiles / (elapsedMs / 3_600_000)

  if (
    !Number.isFinite(speedMph) ||
    speedMph < 0 ||
    speedMph > MAX_REASONABLE_SPEED_MPH
  ) {
    return null
  }

  return speedMph
}

function calculateGpsSpeedMph(coord: RouteCoord): number | null {
  if (
    typeof coord.gpsSpeedMps !== "number" ||
    !Number.isFinite(coord.gpsSpeedMps)
  ) {
    return null
  }

  const speedMph =
    Math.max(0, coord.gpsSpeedMps) * METERS_PER_SECOND_TO_MPH

  if (
    !Number.isFinite(speedMph) ||
    speedMph > MAX_REASONABLE_SPEED_MPH
  ) {
    return null
  }

  return speedMph
}


export const useActiveDriveStore = create<ActiveDriveStore>()(
  persist(
    (set, get) => ({
      session: createInitialSession(),

      hardReset: () => {
        get().stopGlobalTick()
        set({ session: createInitialSession() })
      },

      startDrive: (nowArg, coord, options) => {
        const now = nowArg ?? Date.now()

        const initialCoord =
          coord && isValidCoord(coord)
            ? normalizeIncomingCoord(coord, now)
            : null

        const currentMode = initialCoord
          ? getCurrentSolarMode(
              new Date(now),
              initialCoord.lat,
              initialCoord.lng
            )
          : "unverified"

        get().stopGlobalTick()

        set({
          session: {
            ...createInitialSession(),
            isActive: true,
            isRunning: true,
            exceededMaxDuration: false,
            startTime: now,
            stopTime: null,
            lastTickAt: now,
            lastUpdated: now,
            currentMode,
            solarStatus:
              initialCoord && currentMode !== "unverified"
                ? "verified"
                : "unverified",
            weather: options?.weather ?? null,
            outsideTempF: null,
            outsideTempUpdatedAt: null,
            location: initialCoord
              ? {
                  latitude: initialCoord.lat,
                  longitude: initialCoord.lng,
                }
              : null,
            startCoord: initialCoord,
            lastCoord: initialCoord,
            routeTrail: initialCoord ? [initialCoord] : [],
          },
        })

        get().startGlobalTick()
      },

      pauseDrive: (nowArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const session = state.session

          if (!session.isActive || !session.isRunning) {
            return { session }
          }

          const flushed = flushSessionToNow(session, now)

          return {
            session: {
              ...flushed,
              isRunning: false,
              stopTime: now,
              currentSpeed: 0,
              lastUpdated: now,
            },
          }
        })

        get().stopGlobalTick()
      },

      resumeDrive: (nowArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const session = state.session

          if (!session.isActive || session.isRunning || session.startTime === null) {
            return { session }
          }

          const totalElapsedMs = now - session.startTime - session.pausedMs

          if (totalElapsedMs > MAX_DRIVE_DURATION_MS) {
            return {
              session: {
                ...session,
                exceededMaxDuration: true,
                currentSpeed: 0,
              },
            }
          }

          const coord = session.lastCoord ?? session.startCoord
          const pauseDurationMs =
            session.stopTime === null
              ? 0
              : Math.max(0, now - session.stopTime)

          return {
            session: {
              ...session,
              isRunning: true,
              stopTime: null,
              pausedMs: session.pausedMs + pauseDurationMs,
              currentSpeed: 0,
              currentMode: coord
                ? getCurrentSolarMode(new Date(now), coord.lat, coord.lng)
                : "unverified",
              solarStatus: getSolarStatus(
                session.dayMs,
                session.nightMs,
                session.unverifiedMs
              ),
              lastUpdated: now,
              lastTickAt: now,
            },
          }
        })

        get().startGlobalTick()
      },

      stopDrive: (nowArg, finalCoordArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const finalCoord =
            finalCoordArg && isValidCoord(finalCoordArg)
              ? normalizeIncomingCoord(finalCoordArg, now)
              : null

          const coordForSolar = finalCoord
            ? { ...finalCoord, at: now }
            : state.session.lastCoord
              ? { ...state.session.lastCoord, at: now }
              : state.session.startCoord
                ? { ...state.session.startCoord, at: now }
                : null

          const flushed = flushSessionToNow(state.session, now, coordForSolar)

          let liveMiles = flushed.liveMiles
          let routeTrail = flushed.routeTrail

          if (finalCoord) {
            const priorCoord = flushed.lastCoord

            if (priorCoord) {
              const deltaMiles = haversineMiles(priorCoord, finalCoord)

              if (shouldCountDistance(deltaMiles)) {
                liveMiles += deltaMiles
              }
            }

            const lastTrailPoint = routeTrail.at(-1)

            const isDuplicate =
              lastTrailPoint?.lat === finalCoord.lat &&
              lastTrailPoint?.lng === finalCoord.lng

            routeTrail = isDuplicate
              ? routeTrail
              : [...routeTrail, finalCoord].slice(-MAX_ROUTE_POINTS)
          }

          return {
            session: {
              ...flushed,
              isActive: false,
              isRunning: false,
              stopTime: now,
              lastUpdated: now,
              currentSpeed: 0,
              liveMiles,
              lastCoord: finalCoord
                ? { ...finalCoord, at: now }
                : flushed.lastCoord
                  ? { ...flushed.lastCoord, at: now }
                  : null,
              routeTrail,
              location: finalCoord
                ? {
                    latitude: finalCoord.lat,
                    longitude: finalCoord.lng,
                  }
                : flushed.location,
            },
          }
        })

        get().stopGlobalTick()
      },

      tick: (coord, nowOverride) => {
        const now = nowOverride ?? Date.now()

        set((state) => {
          const session = state.session

          if (
            !session.isActive ||
            !session.isRunning ||
            session.startTime === null
          ) {
            return { session }
          }

          const incomingCoord =
            coord && isValidCoord(coord)
              ? normalizeIncomingCoord(coord, now)
              : null

          const next = flushSessionToNow(session, now, incomingCoord)

          let liveMiles = next.liveMiles
          let currentSpeed = next.currentSpeed
          let lastCoord = next.lastCoord
          let routeTrail = next.routeTrail
          let startCoord = next.startCoord
          let location = next.location

          if (incomingCoord) {
  if (lastCoord) {
    const deltaMiles = haversineMiles(lastCoord, incomingCoord)

    if (shouldCountDistance(deltaMiles)) {
      liveMiles += deltaMiles
    }

    const gpsSpeedMph = calculateGpsSpeedMph(incomingCoord)
    const manualSpeedMph = calculateManualSpeedMph(lastCoord, incomingCoord)
    const nextSpeedMph = gpsSpeedMph ?? manualSpeedMph

    const isPoorAccuracy =
      typeof incomingCoord.accuracy === "number" &&
      incomingCoord.accuracy > MAX_GPS_ACCURACY_METERS

    const isTinyMovement = deltaMiles < TINY_MOVEMENT_MILES
    const isLowSpeed =
      nextSpeedMph !== null && nextSpeedMph < PARKED_SPEED_THRESHOLD_MPH

    if (nextSpeedMph !== null) {
      currentSpeed =
        isPoorAccuracy || isTinyMovement || isLowSpeed
          ? 0
          : nextSpeedMph
    }
  } else {
    const gpsSpeedMph = calculateGpsSpeedMph(incomingCoord)

    const isPoorAccuracy =
      typeof incomingCoord.accuracy === "number" &&
      incomingCoord.accuracy > MAX_GPS_ACCURACY_METERS

    if (gpsSpeedMph !== null) {
      currentSpeed =
        isPoorAccuracy || gpsSpeedMph < PARKED_SPEED_THRESHOLD_MPH
          ? 0
          : gpsSpeedMph
    }
  }

  startCoord = startCoord ?? incomingCoord
  lastCoord = incomingCoord

  const lastTrailPoint = routeTrail.at(-1)

  const isDuplicate =
    lastTrailPoint?.lat === incomingCoord.lat &&
    lastTrailPoint?.lng === incomingCoord.lng

  routeTrail = isDuplicate
    ? routeTrail
    : [...routeTrail, incomingCoord].slice(-MAX_ROUTE_POINTS)

  location = {
    latitude: incomingCoord.lat,
    longitude: incomingCoord.lng,
  }
} else {
  const lastFixAt = lastCoord?.at ?? null

  if (
    typeof lastFixAt !== "number" ||
    now - lastFixAt > SPEED_STALE_AFTER_MS
  ) {
    currentSpeed = 0
  }
}


          return {
            session: {
              ...next,
              liveMiles,
              currentSpeed,
              startCoord,
              lastCoord,
              routeTrail,
              location,
              lastUpdated: now,
            },
          }
        })
      },

      setWeather: (weather) => {
        set((state) => ({
          session: {
            ...state.session,
            weather,
            lastUpdated: Date.now(),
          },
        }))
      },

      setOutsideTemp: (temperatureF, updatedAt = Date.now()) => {
        set((state) => ({
          session: {
            ...state.session,
            outsideTempF:
              typeof temperatureF === "number" && Number.isFinite(temperatureF)
                ? temperatureF
                : null,
            outsideTempUpdatedAt:
              typeof updatedAt === "number" && Number.isFinite(updatedAt)
                ? updatedAt
                : Date.now(),
            lastUpdated: Date.now(),
          },
        }))
      },

      appendRoutePoint: (coord) => {
        get().tick(coord, Date.now())
      },

      clearRoute: () => {
        set((state) => ({
          session: {
            ...state.session,
            routeTrail: [],
            liveMiles: 0,
            currentSpeed: 0,
            startCoord: null,
            lastCoord: null,
            currentMode: "unverified",
            solarStatus: "unverified",
            lastUpdated: Date.now(),
          },
        }))
      },

      getElapsedSeconds: () => {
        const session = get().session

        const accumulatedMs =
          session.dayMs + session.nightMs + session.unverifiedMs

        if (
          !session.isActive ||
          !session.isRunning ||
          session.lastTickAt === null
        ) {
          return Math.floor(accumulatedMs / 1_000)
        }

        return Math.floor(
          (accumulatedMs + Math.max(0, Date.now() - session.lastTickAt)) /
            1_000
        )
      },

      getDayNightSeconds: () => {
        const session = get().session

        const flushed =
          session.isActive && session.isRunning
            ? flushSessionToNow(session, Date.now())
            : session

        return {
          daySeconds: Math.floor(flushed.dayMs / 1_000),
          nightSeconds: Math.floor(flushed.nightMs / 1_000),
          unverifiedSeconds: Math.floor(flushed.unverifiedMs / 1_000),
        }
      },

      getCurrentMode: () => {
        const session = get().session
        const coord = session.lastCoord ?? session.startCoord

        if (!session.isActive || !session.isRunning || !coord) {
          return session.currentMode
        }

        return getCurrentSolarMode(new Date(), coord.lat, coord.lng)
      },

      _tickInterval: null,
      _appStateListener: null,

      startGlobalTick: () => {
        if (!isBrowser() || get()._tickInterval !== null) return

        const intervalId = window.setInterval(() => {
          const session = get().session

          if (!session.isActive || !session.isRunning) {
            get().stopGlobalTick()
            return
          }

          get().tick(undefined, Date.now())
        }, GLOBAL_TICK_MS)

        set({ _tickInterval: intervalId })

        CapacitorApp.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) return

          const session = get().session

          if (session.isActive && session.isRunning) {
            get().tick(undefined, Date.now())
          }
        }).then((handle) => {
          if (get()._tickInterval === null) {
            void handle.remove()
            return
          }

          set({
            _appStateListener: () => {
              void handle.remove()
            },
          })
        })
      },

      stopGlobalTick: () => {
        const intervalId = get()._tickInterval

        if (isBrowser() && intervalId !== null) {
          window.clearInterval(intervalId)
        }

        const removeListener = get()._appStateListener

        if (removeListener) {
          removeListener()
        }

        set({
          _tickInterval: null,
          _appStateListener: null,
        })
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        isBrowser() ? localStorage : noopStorage
      ),
      version: 13,
      partialize: (state) => ({
        session: state.session,
      }),
      migrate: (persisted: unknown) => {
        const raw = persisted as { session?: unknown } | null

        return {
          session: normalizeSession(raw?.session),
        }
      },
      onRehydrateStorage: () => (state) => {
        if (state?.session.isActive && state.session.isRunning) {
          state.tick(undefined, Date.now())
          state.startGlobalTick()
        }
      },
    }
  )
)

export function resetActiveDriveStore(): void {
  useActiveDriveStore.getState().hardReset()
  void useActiveDriveStore.persist.clearStorage()
}
