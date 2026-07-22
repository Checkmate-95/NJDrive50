// src/state/activeDriveStore.ts

import { App as CapacitorApp } from "@capacitor/app"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  computeDayNightSplit,
  getCurrentSolarMode,
  getSolarWindowForDate,
} from "../engine/solarEngine"

export type DriveMode = "day" | "night" | "unverified"

export type RouteCoord = {
  lat: number
  lng: number
  at?: number
}

export type ActiveDriveSession = {
  isActive: boolean
  isRunning: boolean

  startTime: number | null
  stopTime: number | null

  dayMs: number
  nightMs: number
  unverifiedMs: number

  currentMode: DriveMode
  solarStatus: "verified" | "unverified"

  lastUpdated: number | null
  lastTickAt: number | null

  weather: string | null

  liveMiles: number
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

  // Updated: Stop can receive the newest GPS position from the screen.
  stopDrive: (
    now?: number,
    finalCoord?: RouteCoord | null
  ) => void

  tick: (coord?: RouteCoord | null, nowOverride?: number) => void

  setWeather: (weather: string | null) => void
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

type SolarIntervalSplit = {
  dayMs: number
  nightMs: number
  unverifiedMs: number
  mode: DriveMode
  solarStatus: "verified" | "unverified"
}

const STORAGE_KEY = "njdrive50_active_drive"
const MAX_ROUTE_POINTS = 500
const EARTH_RADIUS_MILES = 3958.7613
const GLOBAL_TICK_MS = 1_000
const MIN_MOVEMENT_MILES = 0.01
const MAX_SINGLE_POINT_JUMP_MILES = 2
const MAX_COORD_AGE_MS = 15 * 60 * 1000

// Allows a brief normal GPS startup delay without downgrading a full drive.
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

    startTime: null,
    stopTime: null,

    dayMs: 0,
    nightMs: 0,
    unverifiedMs: 0,

    currentMode: "unverified",
    solarStatus: "unverified",

    lastUpdated: null,
    lastTickAt: null,

    weather: null,

    liveMiles: 0,
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

function isCoordStale(
  coord: RouteCoord | null | undefined,
  now: number
): boolean {
  if (!coord || typeof coord.at !== "number") return false
  return now - coord.at > MAX_COORD_AGE_MS
}

function normalizeRouteCoord(value: unknown): RouteCoord | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Partial<RouteCoord>
  const lat = raw.lat
  const lng = raw.lng

  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    return null
  }

  return {
    lat,
    lng,
    at:
      typeof raw.at === "number" && Number.isFinite(raw.at)
        ? raw.at
        : undefined,
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

    startTime: normalizeNumber(raw.startTime),
    stopTime: normalizeNumber(raw.stopTime),

    dayMs: normalizeNonNegativeNumber(raw.dayMs),
    nightMs: normalizeNonNegativeNumber(raw.nightMs),
    unverifiedMs: normalizeNonNegativeNumber(raw.unverifiedMs),

    currentMode,
    solarStatus: raw.solarStatus === "verified" ? "verified" : "unverified",

    lastUpdated: normalizeNumber(raw.lastUpdated),
    lastTickAt: normalizeNumber(raw.lastTickAt),

    weather: typeof raw.weather === "string" ? raw.weather : null,

    liveMiles: normalizeNonNegativeNumber(raw.liveMiles),

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
  }
}

function getStartOfNextLocalDay(timestamp: number): number {
  const next = new Date(timestamp)
  next.setHours(24, 0, 0, 0)
  return next.getTime()
}

function splitIntervalBySolar(
  startMs: number,
  endMs: number,
  coord: RouteCoord | null | undefined
): SolarIntervalSplit {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return {
      dayMs: 0,
      nightMs: 0,
      unverifiedMs: 0,
      mode: "unverified",
      solarStatus: "unverified",
    }
  }

  if (!isValidCoord(coord)) {
    return {
      dayMs: 0,
      nightMs: 0,
      unverifiedMs: endMs - startMs,
      mode: "unverified",
      solarStatus: "unverified",
    }
  }

  let cursor = startMs
  let dayMs = 0
  let nightMs = 0
  let unverifiedMs = 0

  while (cursor < endMs) {
    const nextMidnightMs = getStartOfNextLocalDay(cursor)
    const segmentEndMs =
      nextMidnightMs > cursor
        ? Math.min(endMs, nextMidnightMs)
        : endMs

    const segmentStart = new Date(cursor)
    const segmentEnd = new Date(segmentEndMs)

    const solarWindow = getSolarWindowForDate(
      coord.lat,
      coord.lng,
      segmentStart
    )

    const split = computeDayNightSplit(
      segmentStart,
      segmentEnd,
      solarWindow
    )

    if (split.mode === "solar") {
      dayMs += split.dayHours * 3_600_000
      nightMs += split.nightHours * 3_600_000
    } else {
      unverifiedMs += segmentEndMs - cursor
    }

    cursor = segmentEndMs
  }

  const mode = getCurrentSolarMode(new Date(endMs), coord.lat, coord.lng)

  return {
    dayMs,
    nightMs,
    unverifiedMs,
    mode,
    solarStatus: unverifiedMs === 0 ? "verified" : "unverified",
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

  const baseline = session.lastTickAt ?? session.startTime

  if (!Number.isFinite(baseline) || now <= baseline) {
    return {
      ...session,
      lastUpdated: now,
    }
  }

  const candidateCoord = coord ?? session.lastCoord ?? session.startCoord
  const solarCoord = isCoordStale(candidateCoord, now) ? null : candidateCoord

  const split = splitIntervalBySolar(baseline, now, solarCoord)

  const totalDayMs = session.dayMs + split.dayMs
  const totalNightMs = session.nightMs + split.nightMs
  const totalUnverifiedMs = session.unverifiedMs + split.unverifiedMs

  return {
    ...session,

    dayMs: totalDayMs,
    nightMs: totalNightMs,
    unverifiedMs: totalUnverifiedMs,

    currentMode: split.mode,
    solarStatus: getSolarStatus(
      totalDayMs,
      totalNightMs,
      totalUnverifiedMs
    ),

    lastUpdated: now,
    lastTickAt: now,
  }
}

function haversineMiles(a: RouteCoord, b: RouteCoord): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180

  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

function shouldCountDistance(deltaMiles: number): boolean {
  return (
    Number.isFinite(deltaMiles) &&
    deltaMiles >= MIN_MOVEMENT_MILES &&
    deltaMiles <= MAX_SINGLE_POINT_JUMP_MILES
  )
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

          if (!session.isActive || session.isRunning) {
            return { session }
          }

          const coord = session.lastCoord ?? session.startCoord

          const currentMode = coord
            ? getCurrentSolarMode(new Date(now), coord.lat, coord.lng)
            : "unverified"

          return {
            session: {
              ...session,

              isRunning: true,
              stopTime: null,

              currentMode,

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

      // Updated: accepts a final coordinate from ActiveDriveContent.
      stopDrive: (nowArg, finalCoordArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const finalCoord =
            finalCoordArg && isValidCoord(finalCoordArg)
              ? normalizeIncomingCoord(finalCoordArg, now)
              : null

          // The newest point is deliberately supplied to the final flush.
          const flushed = flushSessionToNow(
            state.session,
            now,
            finalCoord
          )

          let liveMiles = flushed.liveMiles
          let routeTrail = flushed.routeTrail

          // Include the supplied final position in the saved route/mileage
          // when it differs from the prior point.
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

              liveMiles,
              lastCoord: finalCoord ?? flushed.lastCoord,
              routeTrail,
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
          let lastCoord = next.lastCoord
          let routeTrail = next.routeTrail
          let startCoord = next.startCoord

          if (incomingCoord) {
            if (lastCoord) {
              const deltaMiles = haversineMiles(lastCoord, incomingCoord)

              if (shouldCountDistance(deltaMiles)) {
                liveMiles += deltaMiles
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
          }

          return {
            session: {
              ...next,
              liveMiles,
              startCoord,
              lastCoord,
              routeTrail,
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

      appendRoutePoint: (coord) => {
        get().tick(coord, Date.now())
      },

      clearRoute: () => {
        set((state) => ({
          session: {
            ...state.session,
            routeTrail: [],
            liveMiles: 0,
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

        const liveDelta = Math.max(0, Date.now() - session.lastTickAt)

        return Math.floor((accumulatedMs + liveDelta) / 1_000)
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
      version: 9,
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