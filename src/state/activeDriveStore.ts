// src/state/activeDriveStore.ts
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

export type DriveMode = "day" | "night"
export type NightOverride = "auto" | "day" | "night"

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

  elapsedBeforeStart: number
  dayMs: number
  nightMs: number

  currentMode: DriveMode
  nightOverride: NightOverride
  lastModeChangeAt: number | null

  lastUpdated: number | null
  lastTickAt: number | null

  solarSunrise: number | null
  solarSunset: number | null

  weather: string | null

  liveMiles: number
  startCoord: RouteCoord | null
  lastCoord: RouteCoord | null
  routeTrail: RouteCoord[]
}

type ActiveDriveStore = {
  session: ActiveDriveSession

  hardReset: () => void
  startDrive: (
    now?: number,
    coord?: RouteCoord | null,
    options?: {
      override?: NightOverride
      sunrise?: number | null
      sunset?: number | null
      weather?: string | null
    }
  ) => void
  pauseDrive: (now?: number) => void
  resumeDrive: (now?: number) => void
  stopDrive: (now?: number) => void

  tick: (coord?: RouteCoord | null, nowOverride?: number) => void
  setNightOverride: (mode: NightOverride) => void
  setWeather: (weather: string | null) => void
  appendRoutePoint: (coord: RouteCoord) => void
  clearRoute: () => void

  getElapsedSeconds: () => number
  getDayNightSeconds: () => {
    daySeconds: number
    nightSeconds: number
  }
  getCurrentMode: () => DriveMode
}

const STORAGE_KEY = "njdrive50_active_drive"

function createInitialSession(): ActiveDriveSession {
  return {
    isActive: false,
    isRunning: false,

    startTime: null,
    stopTime: null,

    elapsedBeforeStart: 0,
    dayMs: 0,
    nightMs: 0,

    currentMode: "day",
    nightOverride: "auto",
    lastModeChangeAt: null,

    lastUpdated: null,
    lastTickAt: null,

    solarSunrise: null,
    solarSunset: null,

    weather: null,

    liveMiles: 0,
    startCoord: null,
    lastCoord: null,
    routeTrail: [],
  }
}

function normalizeRouteCoord(value: unknown): RouteCoord | null {
  if (!value || typeof value !== "object") return null

  const raw = value as Partial<RouteCoord>

  if (!Number.isFinite(raw.lat) || !Number.isFinite(raw.lng)) return null

  return {
    lat: raw.lat as number,
    lng: raw.lng as number,
    at: Number.isFinite(raw.at) ? (raw.at as number) : undefined,
  }
}

function normalizeRouteTrail(value: unknown): RouteCoord[] {
  if (!Array.isArray(value)) return []

  return value
    .map(normalizeRouteCoord)
    .filter((coord): coord is RouteCoord => coord !== null)
    .slice(-500)
}

function normalizeSession(value: unknown): ActiveDriveSession {
  const initial = createInitialSession()

  if (!value || typeof value !== "object") {
    return initial
  }

  const raw = value as Partial<ActiveDriveSession>

  const currentMode: DriveMode =
    raw.currentMode === "night" ? "night" : "day"

  const nightOverride: NightOverride =
    raw.nightOverride === "day" || raw.nightOverride === "night"
      ? raw.nightOverride
      : "auto"

  return {
    isActive: raw.isActive === true,
    isRunning: raw.isRunning === true,

    startTime: Number.isFinite(raw.startTime) ? (raw.startTime as number) : null,
    stopTime: Number.isFinite(raw.stopTime) ? (raw.stopTime as number) : null,

    elapsedBeforeStart: Number.isFinite(raw.elapsedBeforeStart)
      ? Math.max(0, raw.elapsedBeforeStart as number)
      : 0,

    dayMs: Number.isFinite(raw.dayMs) ? Math.max(0, raw.dayMs as number) : 0,
    nightMs: Number.isFinite(raw.nightMs)
      ? Math.max(0, raw.nightMs as number)
      : 0,

    currentMode,
    nightOverride,

    lastModeChangeAt: Number.isFinite(raw.lastModeChangeAt)
      ? (raw.lastModeChangeAt as number)
      : null,

    lastUpdated: Number.isFinite(raw.lastUpdated)
      ? (raw.lastUpdated as number)
      : null,

    lastTickAt: Number.isFinite(raw.lastTickAt)
      ? (raw.lastTickAt as number)
      : null,

    solarSunrise: Number.isFinite(raw.solarSunrise)
      ? (raw.solarSunrise as number)
      : null,

    solarSunset: Number.isFinite(raw.solarSunset)
      ? (raw.solarSunset as number)
      : null,

    weather: typeof raw.weather === "string" ? raw.weather : null,

    liveMiles: Number.isFinite(raw.liveMiles)
      ? Math.max(0, raw.liveMiles as number)
      : 0,

    startCoord: normalizeRouteCoord(raw.startCoord),
    lastCoord: normalizeRouteCoord(raw.lastCoord),
    routeTrail: normalizeRouteTrail(raw.routeTrail),
  }
}

function resolveDriveMode(
  now: number,
  override: NightOverride,
  solarSunrise: number | null,
  solarSunset: number | null
): DriveMode {
  if (override === "day") return "day"
  if (override === "night") return "night"

  if (
    Number.isFinite(solarSunrise) &&
    Number.isFinite(solarSunset) &&
    solarSunrise !== null &&
    solarSunset !== null
  ) {
    return now < solarSunrise || now >= solarSunset ? "night" : "day"
  }

  return "day"
}

function flushSessionToNow(
  session: ActiveDriveSession,
  now: number
): ActiveDriveSession {
  if (!session.isActive || !session.isRunning || !session.startTime) {
    return session
  }

  const baseline =
    session.lastTickAt ??
    session.lastModeChangeAt ??
    session.startTime

  if (!Number.isFinite(baseline) || now <= baseline) {
    return {
      ...session,
      lastUpdated: now,
    }
  }

  const delta = Math.max(0, now - baseline)

  let dayMs = session.dayMs
  let nightMs = session.nightMs

  if (session.currentMode === "night") {
    nightMs += delta
  } else {
    dayMs += delta
  }

  return {
    ...session,
    dayMs,
    nightMs,
    lastUpdated: now,
    lastTickAt: now,
  }
}

function haversineMiles(a: RouteCoord, b: RouteCoord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 3958.7613

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

  return 2 * R * Math.asin(Math.sqrt(h))
}

export const useActiveDriveStore = create<ActiveDriveStore>()(
  persist(
    (set, get) => ({
      session: createInitialSession(),

      hardReset: () => {
        set({ session: normalizeSession(createInitialSession()) })
      },

      startDrive: (nowArg, coord, options) => {
        const now = nowArg ?? Date.now()
        const initialCoord = coord ?? null

        const override = options?.override ?? "auto"
        const sunrise = options?.sunrise ?? null
        const sunset = options?.sunset ?? null
        const weather = options?.weather ?? null

        const currentMode = resolveDriveMode(now, override, sunrise, sunset)

        set({
          session: normalizeSession({
            ...createInitialSession(),
            isActive: true,
            isRunning: true,
            startTime: now,
            stopTime: null,
            currentMode,
            nightOverride: override,
            lastModeChangeAt: now,
            lastUpdated: now,
            lastTickAt: now,
            solarSunrise: sunrise,
            solarSunset: sunset,
            weather,
            startCoord: initialCoord,
            lastCoord: initialCoord,
            routeTrail: initialCoord ? [initialCoord] : [],
          }),
        })
      },

      pauseDrive: (nowArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const s = state.session
          if (!s.isActive || !s.isRunning) return { session: s }

          const flushed = flushSessionToNow(s, now)

          return {
            session: {
              ...flushed,
              isRunning: false,
              stopTime: now,
            },
          }
        })
      },

      resumeDrive: (nowArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const s = state.session
          if (!s.isActive || s.isRunning) return { session: s }

          const currentMode = resolveDriveMode(
            now,
            s.nightOverride,
            s.solarSunrise,
            s.solarSunset
          )

          return {
            session: {
              ...s,
              isRunning: true,
              stopTime: null,
              currentMode,
              lastModeChangeAt: now,
              lastUpdated: now,
              lastTickAt: now,
            },
          }
        })
      },

      stopDrive: (nowArg) => {
        const now = nowArg ?? Date.now()

        set((state) => {
          const s = state.session
          const next = flushSessionToNow(s, now)

          return {
            session: {
              ...next,
              isRunning: false,
              isActive: false,
              stopTime: now,
              lastUpdated: now,
            },
          }
        })
      },

      tick: (coord, nowOverride) => {
        const now = nowOverride ?? Date.now()

        set((state) => {
          const s = state.session
          let next = flushSessionToNow(s, now)

          if (!next.isActive || !next.isRunning || !next.startTime) {
            return { session: next }
          }

          const resolvedMode = resolveDriveMode(
            now,
            next.nightOverride,
            next.solarSunrise,
            next.solarSunset
          )

          if (resolvedMode !== next.currentMode) {
            next = {
              ...next,
              currentMode: resolvedMode,
              lastModeChangeAt: now,
            }
          }

          let liveMiles = next.liveMiles
          let lastCoord = next.lastCoord
          let routeTrail = next.routeTrail

          if (coord) {
            if (lastCoord) {
              liveMiles += haversineMiles(lastCoord, coord)
            }

            lastCoord = coord
            routeTrail = [...routeTrail, coord].slice(-500)
          }

          return {
            session: {
              ...next,
              liveMiles,
              lastCoord,
              routeTrail,
            },
          }
        })
      },

      setNightOverride: (mode) => {
        const now = Date.now()

        set((state) => {
          const s = state.session
          let next = flushSessionToNow(s, now)

          const resolved = resolveDriveMode(
            now,
            mode,
            s.solarSunrise,
            s.solarSunset
          )

          next = {
            ...next,
            nightOverride: mode,
            currentMode: resolved,
            lastModeChangeAt: now,
            lastUpdated: now,
          }

          return { session: next }
        })
      },

      setWeather: (weather) => {
        set((state) => ({
          session: {
            ...state.session,
            weather,
          },
        }))
      },

      appendRoutePoint: (coord) => {
        set((state) => {
          const s = state.session

          return {
            session: {
              ...s,
              lastCoord: coord,
              routeTrail: [...s.routeTrail, coord].slice(-500),
            },
          }
        })
      },

      clearRoute: () => {
        set((state) => ({
          session: {
            ...state.session,
            routeTrail: [],
            liveMiles: 0,
            startCoord: null,
            lastCoord: null,
          },
        }))
      },

      // Non-mutating projection: flushes to current time for calculation only,
      // does not commit the flushed state to the store.
      getElapsedSeconds: () => {
        const { session: s } = get()
        const now = Date.now()
        const flushed = flushSessionToNow(s, now)

        const base = flushed.elapsedBeforeStart

        if (flushed.isRunning && flushed.startTime) {
          return Math.floor((base + (now - flushed.startTime)) / 1000)
        }

        return Math.floor(base / 1000)
      },

      // Non-mutating projection: flushes to current time for calculation only,
      // does not commit the flushed state to the store.
      getDayNightSeconds: () => {
        const { session: s } = get()
        const now = Date.now()
        const flushed = flushSessionToNow(s, now)

        return {
          daySeconds: Math.floor(flushed.dayMs / 1000),
          nightSeconds: Math.floor(flushed.nightMs / 1000),
        }
      },

      getCurrentMode: () => {
        const { session: s } = get()

        if (!s.isActive) return s.currentMode

        return resolveDriveMode(
          Date.now(),
          s.nightOverride,
          s.solarSunrise,
          s.solarSunset
        )
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted: unknown) => {
        const raw = persisted as { session?: unknown } | null
        return { session: normalizeSession(raw?.session) }
      },
    }
  )
)