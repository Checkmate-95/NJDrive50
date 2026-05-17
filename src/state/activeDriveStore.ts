// src/state/activeDriveStore.ts

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
// @ts-ignore: subscribeWithSelector is used inside create()
import { subscribeWithSelector } from "zustand/middleware"



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

type StartDriveOptions = {
  override?: NightOverride
  sunrise?: number | null
  sunset?: number | null
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

  // ✅ Add these new ones for global ticking
  _tickInterval: number | null
  startGlobalTick: () => void
  stopGlobalTick: () => void
}


const STORAGE_KEY = "njdrive50_active_drive"
const MAX_ROUTE_POINTS = 500
const EARTH_RADIUS_MILES = 3958.7613

function createInitialSession(): ActiveDriveSession {
  return {
    isActive: false,
    isRunning: false,

    startTime: null,
    stopTime: null,

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

function normalizeNumber(value: unknown): number | null {
  return Number.isFinite(value) ? (value as number) : null
}

function normalizeNonNegativeNumber(value: unknown, fallback = 0): number {
  return Number.isFinite(value) ? Math.max(0, value as number) : fallback
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
    .slice(-MAX_ROUTE_POINTS)
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

    startTime: normalizeNumber(raw.startTime),
    stopTime: normalizeNumber(raw.stopTime),

    dayMs: normalizeNonNegativeNumber(raw.dayMs),
    nightMs: normalizeNonNegativeNumber(raw.nightMs),

    currentMode,
    nightOverride,

    lastModeChangeAt: normalizeNumber(raw.lastModeChangeAt),
    lastUpdated: normalizeNumber(raw.lastUpdated),
    lastTickAt: normalizeNumber(raw.lastTickAt),

    solarSunrise: normalizeNumber(raw.solarSunrise),
    solarSunset: normalizeNumber(raw.solarSunset),

    weather: typeof raw.weather === "string" ? raw.weather : null,

    liveMiles: normalizeNonNegativeNumber(raw.liveMiles),

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
    solarSunrise !== null &&
    solarSunset !== null &&
    Number.isFinite(solarSunrise) &&
    Number.isFinite(solarSunset)
  ) {
    return now < solarSunrise || now >= solarSunset ? "night" : "day"
  }

  return "day"
}

function flushSessionToNow(
  session: ActiveDriveSession,
  now: number
): ActiveDriveSession {
  if (!session.isActive || !session.isRunning || session.startTime === null) {
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

  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)

  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h))
}

export const useActiveDriveStore = create<ActiveDriveStore>()(
  persist(
    (set, get) => ({
      session: createInitialSession(),

      hardReset: () => {
        set({ session: createInitialSession() })
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
          session: {
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
          },
        })

        // ✅ Start global tick when drive begins
        get().startGlobalTick()
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
              lastUpdated: now,
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

        // ✅ Resume ticking globally
        get().startGlobalTick()
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

        // ✅ Stop global tick when drive ends
        get().stopGlobalTick()
      },

      tick: (coord, nowOverride) => {
        const now = nowOverride ?? Date.now()

        set((state) => {
          const s = state.session
          let next = flushSessionToNow(s, now)

          if (!next.isActive || !next.isRunning || next.startTime === null) {
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
            } else if (!next.startCoord) {
              lastCoord = coord
            }

            lastCoord = coord
            routeTrail = [...routeTrail, coord].slice(-MAX_ROUTE_POINTS)
          }

          return {
            session: {
              ...next,
              liveMiles,
              lastCoord,
              routeTrail,
              lastUpdated: now,
            },
          }
        })
      },

      // ✅ Restored methods required by ActiveDriveStore type
setNightOverride: (mode) => {
  set((state) => ({
    session: {
      ...state.session,
      nightOverride: mode,
      lastUpdated: Date.now(),
    },
  }))
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
  set((state) => {
    const s = state.session
    const routeTrail = [...s.routeTrail, coord].slice(-MAX_ROUTE_POINTS)
    return {
      session: {
        ...s,
        routeTrail,
        lastCoord: coord,
        liveMiles:
          s.lastCoord ? s.liveMiles + haversineMiles(s.lastCoord, coord) : s.liveMiles,
        lastUpdated: Date.now(),
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
      lastUpdated: Date.now(),
    },
  }))
},

getElapsedSeconds: () => {
  const { session: s } = get()
  const now = Date.now()

  if (!s.isActive || s.startTime === null) return 0

  const accumulated = s.dayMs + s.nightMs

  // Use lastModeChangeAt as the stable baseline
  const baseline =
    s.lastModeChangeAt ??
    s.startTime

  if (s.isRunning) {
    return Math.floor((accumulated + (now - baseline)) / 1000)
  }

  return Math.floor(accumulated / 1000)
},

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

_tickInterval: null as number | null,



startGlobalTick: () => {
  if (get()._tickInterval) return
  const id = window.setInterval(() => {
    const s = get().session
    if (s.isActive && s.isRunning) {
      get().tick(undefined, Date.now())
    }
  }, 1000)
  set({ _tickInterval: id })
},

stopGlobalTick: () => {
  const id = get()._tickInterval
  if (id) {
    clearInterval(id)
    set({ _tickInterval: null })
  }
},

    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 4,
      migrate: (persisted: unknown) => {
        const raw = persisted as { session?: unknown } | null
        return { session: normalizeSession(raw?.session) }
      },
    }
  )
)
