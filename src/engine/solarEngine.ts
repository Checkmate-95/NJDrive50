// src/engine/solarEngine.ts
import { getSunrise, getSunset } from "sunrise-sunset-js"

export type SolarWindow = {
  sunrise: Date | null
  sunset: Date | null
}

export type SolarSplitMode = "solar" | "unverified"

export type DayNightSplit = {
  dayHours: number
  nightHours: number
  mode: SolarSplitMode
}

export type SolarMode = "day" | "night" | "unverified"

export type DriveSegments = {
  type: "Day Only" | "Night Only" | "Mixed Drive" | "Unknown"
  nightStartMs: number | null
  nightEndMs: number | null
  dayStartMs: number | null
  dayEndMs: number | null
}

const THIRTY_MIN_MS = 30 * 60 * 1000

/**
 * Guard against multi-day drives. splitDriveBySolar and computeDayNightSplit
 * can only represent ONE contiguous night range and ONE contiguous day
 * range per drive. A drive spanning more than 24 hours can cross multiple
 * day/night boundaries, which would silently collapse distinct night
 * periods into one incorrect range. Rather than support multi-range data
 * (unnecessary complexity for real teen driving patterns), sessions that
 * exceed this duration are treated as unverified/invalid so the app never
 * displays corrupted solar data. See activeDriveStore.ts for the runtime
 * auto-pause guard that prevents sessions from ever reaching this length.
 */
export const MAX_DRIVE_DURATION_MS = 24 * 60 * 60 * 1000

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && Number.isFinite(value.getTime())
}

function isValidCoordinates(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

function getOverlapMs(
  rangeStart: number,
  rangeEnd: number,
  windowStart: number,
  windowEnd: number
): number {
  return Math.max(
    0,
    Math.min(rangeEnd, windowEnd) - Math.max(rangeStart, windowStart)
  )
}

/**
 * Fix for sunrise-sunset-js UTC date-boundary bug:
 * Always anchor the lookup date to LOCAL NOON so the library
 * cannot accidentally resolve sunrise/sunset for the wrong day.
 */
function toSolarLookupDate(date: Date): Date {
  const local = new Date(date)
  local.setHours(12, 0, 0, 0)
  return local
}

/**
 * Civil night ends 30 minutes before sunrise (dawn boundary).
 */
function getCivilNightEndMs(sunriseMs: number): number {
  return sunriseMs - THIRTY_MIN_MS
}

/**
 * Civil night starts 30 minutes after sunset (dusk boundary).
 */
function getCivilNightStartMs(sunsetMs: number): number {
  return sunsetMs + THIRTY_MIN_MS
}

/**
 * Night = before civil dawn OR after civil dusk.
 */
function isBeforeDawnOrAfterDusk(
  timestampMs: number,
  civilNightEndMs: number,
  civilNightStartMs: number
): boolean {
  return timestampMs < civilNightEndMs || timestampMs >= civilNightStartMs
}

/**
 * Returns the sunrise and sunset for the supplied coordinates and local date.
 */
export function getSolarWindowForDate(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): SolarWindow {
  if (!isValidCoordinates(latitude, longitude) || !isValidDate(date)) {
    return { sunrise: null, sunset: null }
  }

  try {
    const lookupDate = toSolarLookupDate(date)

    const rawSunrise = getSunrise(latitude, longitude, lookupDate)
    const rawSunset = getSunset(latitude, longitude, lookupDate)

    const sunrise = isValidDate(rawSunrise) ? rawSunrise : null
    const sunset = isValidDate(rawSunset) ? rawSunset : null

    if (!sunrise || !sunset || sunset.getTime() <= sunrise.getTime()) {
      return { sunrise: null, sunset: null }
    }

    return { sunrise, sunset }
  } catch {
    return { sunrise: null, sunset: null }
  }
}

/**
 * Determines whether a specific timestamp falls during civil darkness.
 */
export function isNightDrive(
  timestamp: Date,
  solarWindow: SolarWindow
): boolean {
  if (!isValidDate(timestamp)) return false

  const { sunrise, sunset } = solarWindow
  if (!isValidDate(sunrise) || !isValidDate(sunset)) return false
  if (sunset.getTime() <= sunrise.getTime()) return false

  const civilNightEndMs = getCivilNightEndMs(sunrise.getTime())
  const civilNightStartMs = getCivilNightStartMs(sunset.getTime())

  return isBeforeDawnOrAfterDusk(
    timestamp.getTime(),
    civilNightEndMs,
    civilNightStartMs
  )
}

/**
 * Gets the current day/night state from solar times only.
 */
export function getCurrentSolarMode(
  date: Date,
  latitude: number,
  longitude: number
): SolarMode {
  if (!isValidDate(date)) return "unverified"

  const solarWindow = getSolarWindowForDate(latitude, longitude, date)
  const { sunrise, sunset } = solarWindow

  if (!sunrise || !sunset) return "unverified"

  return isNightDrive(date, solarWindow) ? "night" : "day"
}

/**
 * Splits one same-calendar-day drive into daylight and darkness hours.
 */
export function computeDayNightSplit(
  startTime: Date,
  endTime: Date,
  solarWindowForDate: (d: Date) => SolarWindow
): DayNightSplit {
  if (!isValidDate(startTime) || !isValidDate(endTime)) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  const startMs = startTime.getTime()
  const endMs = endTime.getTime()
  if (endMs <= startMs) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  // Guard: a drive exceeding 24 hours cannot be safely represented by this
  // single-pass accumulator without risking misclassification across
  // multiple day/night cycles. Treat as unverified rather than guess.
  if (endMs - startMs > MAX_DRIVE_DURATION_MS) {
    return { dayHours: 0, nightHours: 0, mode: "unverified" }
  }

  let cursor = new Date(startTime)
  let dayMs = 0
  let nightMs = 0
  let anyUnverified = false

  while (cursor.getTime() < endMs) {
    const segmentDate = new Date(cursor)
    segmentDate.setHours(12, 0, 0, 0) // anchor to local noon

    const solarWindow = solarWindowForDate(segmentDate)
    const { sunrise, sunset } = solarWindow

    const nextMidnight = new Date(segmentDate)
    nextMidnight.setHours(24, 0, 0, 0)
    const segmentEnd = Math.min(nextMidnight.getTime(), endMs)

    const segStart = cursor.getTime()
    const segEnd = segmentEnd

    if (!isValidDate(sunrise) || !isValidDate(sunset) || sunset.getTime() <= sunrise.getTime()) {
      // No reliable solar data: treat entire segment as night, but mark unverified
      nightMs += segEnd - segStart
      anyUnverified = true
      cursor = new Date(segmentEnd)
      continue
    }

    const sunriseMs = sunrise.getTime()
    const sunsetMs = sunset.getTime()
    const civilNightEndMs = getCivilNightEndMs(sunriseMs)
    const civilNightStartMs = getCivilNightStartMs(sunsetMs)

    const dayOverlap = getOverlapMs(segStart, segEnd, civilNightEndMs, civilNightStartMs)
    const nightOverlap = (segEnd - segStart) - dayOverlap

    dayMs += dayOverlap
    nightMs += nightOverlap

    cursor = new Date(segmentEnd)
  }

  return {
    dayHours: dayMs / 3_600_000,
    nightHours: nightMs / 3_600_000,
    mode: anyUnverified ? "unverified" : "solar",
  }
}

/**
 * Segment-level split for UI: returns actual timestamps for night/day portions.
 * Walks day-by-day so multi-day drives get correct sunrise/sunset per date,
 * instead of relying on one static solar window for the whole drive.
 *
 * NOTE: this function's data model only supports ONE contiguous night range
 * and ONE contiguous day range. It is only correct for drives that cross at
 * most one day/night boundary. The MAX_DRIVE_DURATION_MS guard below
 * prevents it from ever being called with a drive long enough to cross
 * multiple boundaries, which would otherwise silently collapse distinct
 * night periods into a single incorrect range.
 */
export function splitDriveBySolar(
  startTime: Date,
  endTime: Date,
  solarWindowForDate: (d: Date) => SolarWindow
): DriveSegments {
  const invalid: DriveSegments = {
    type: "Unknown",
    nightStartMs: null,
    nightEndMs: null,
    dayStartMs: null,
    dayEndMs: null,
  }

  if (!isValidDate(startTime) || !isValidDate(endTime)) return invalid

  const startMs = startTime.getTime()
  const endMs = endTime.getTime()
  if (endMs <= startMs) return invalid

  // Guard: refuse to compute a single night/day range for a drive long
  // enough to cross multiple solar boundaries. See note above.
  if (endMs - startMs > MAX_DRIVE_DURATION_MS) return invalid

  let cursor = new Date(startTime)
  let nightStartMs: number | null = null
  let nightEndMs: number | null = null
  let dayStartMs: number | null = null
  let dayEndMs: number | null = null
  let hasDay = false
  let hasNight = false

  while (cursor.getTime() < endMs) {
    const segmentDate = new Date(cursor)
    segmentDate.setHours(12, 0, 0, 0)

    const solarWindow = solarWindowForDate(segmentDate)
    const { sunrise, sunset } = solarWindow

    const nextMidnight = new Date(segmentDate)
    nextMidnight.setHours(24, 0, 0, 0)
    const segmentEnd = Math.min(nextMidnight.getTime(), endMs)

    const segStart = cursor.getTime()
    const segEnd = segmentEnd

    if (!isValidDate(sunrise) || !isValidDate(sunset) || sunset.getTime() <= sunrise.getTime()) {
      hasNight = true
      nightStartMs = nightStartMs === null ? segStart : nightStartMs
      nightEndMs = segEnd
      cursor = new Date(segmentEnd)
      continue
    }

    const civilNightEndMs = getCivilNightEndMs(sunrise.getTime())
    const civilNightStartMs = getCivilNightStartMs(sunset.getTime())

    if (segStart < civilNightEndMs) {
      const pieceEnd = Math.min(segEnd, civilNightEndMs)
      hasNight = true
      nightStartMs = nightStartMs === null ? segStart : nightStartMs
      nightEndMs = pieceEnd
    }

    const dayPieceStart = Math.max(segStart, civilNightEndMs)
    const dayPieceEnd = Math.min(segEnd, civilNightStartMs)
    if (dayPieceEnd > dayPieceStart) {
      hasDay = true
      dayStartMs = dayStartMs === null ? dayPieceStart : dayStartMs
      dayEndMs = dayPieceEnd
    }

    if (segEnd > civilNightStartMs) {
      const pieceStart = Math.max(segStart, civilNightStartMs)
      hasNight = true
      nightStartMs = nightStartMs === null ? pieceStart : nightStartMs
      nightEndMs = segEnd
    }

    cursor = new Date(segmentEnd)
  }

  if (hasNight && hasDay) {
    return {
      type: "Mixed Drive",
      nightStartMs,
      nightEndMs,
      dayStartMs,
      dayEndMs,
    }
  }

  if (hasNight) {
    return {
      type: "Night Only",
      nightStartMs,
      nightEndMs,
      dayStartMs: null,
      dayEndMs: null,
    }
  }

  if (hasDay) {
    return {
      type: "Day Only",
      nightStartMs: null,
      nightEndMs: null,
      dayStartMs,
      dayEndMs,
    }
  }

  return invalid
}

/**
 * Final safety net — ensures UI label always matches the computed hours.
 */
export function classifyDriveType(
  dayHours: number,
  nightHours: number
): "Day Only" | "Night Only" | "Mixed Drive" {
  const EPSILON = 0.01

  const hasDay = dayHours > EPSILON
  const hasNight = nightHours > EPSILON

  if (hasDay && hasNight) return "Mixed Drive"
  if (hasNight) return "Night Only"
  if (hasDay) return "Day Only"

  return "Day Only" // safe default — near-zero-duration drives shouldn't imply night
}