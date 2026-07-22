// src/engine/driveEngine.ts
import { getSolarWindowForDate, computeDayNightSplit } from "./solarEngine"

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

export type DriveSource = "timer" | "manual"
export type NightCalcMode = "solar" | "estimated" | "unverified"

export type DriveLocation = {
  latitude: number
  longitude: number
}

export type DriveEntry = {
  id: string
  start: number
  end: number
  duration: number
  nightDuration: number
  dayDuration: number
  hasNightPortion: boolean
  isVerifiedDay: boolean
  notes?: string
  source: DriveSource
  location?: DriveLocation
  nightCalcMode: NightCalcMode
}

export type DriveSummary = {
  totalDuration: number
  nightDuration: number
  dayDuration: number
  solarNightDuration: number
  estimatedNightDuration: number
  unverifiedNightDuration: number
  entriesWithEstimatedNight: number
  entriesWithUnverifiedNight: number
}

export type DriveCompliance = DriveSummary & {
  meetsTotal: boolean
  meetsNight: boolean
  meetsNightVerified: boolean
  meetsRequirement: boolean
  meetsRequirementIncludingEstimated: boolean
  requiresReview: boolean
  remainingTotal: number
  remainingNight: number
  remainingNightVerified: number
  curfewViolations: number
}

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */

const REQUIRED_TOTAL = 50 * 60 * 60 * 1000
const REQUIRED_NIGHT = 10 * 60 * 60 * 1000

const ESTIMATED_NIGHT_START_HOUR = 19
const ESTIMATED_NIGHT_END_HOUR = 6

const CURFEW_START_HOUR = 23
const CURFEW_START_MINUTE = 1
const CURFEW_END_HOUR = 5

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

const generateId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const isValidTimestamp = (value: number) => Number.isFinite(value)

const isValidLocation = (loc?: DriveLocation): loc is DriveLocation =>
  !!loc &&
  Number.isFinite(loc.latitude) &&
  Number.isFinite(loc.longitude) &&
  loc.latitude >= -90 &&
  loc.latitude <= 90 &&
  loc.longitude >= -180 &&
  loc.longitude <= 180

const sanitizeLocation = (loc?: DriveLocation): DriveLocation | undefined =>
  isValidLocation(loc)
    ? { latitude: loc.latitude, longitude: loc.longitude }
    : undefined

const startOfLocalDay = (ts: number) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d
}

const getStartOfNextLocalDay = (ts: number): Date => {
  const d = new Date(ts)
  d.setHours(24, 0, 0, 0)
  return d
}

const getOverlapDuration = (
  rangeStart: number,
  rangeEnd: number,
  windowStart: number,
  windowEnd: number
) => Math.max(0, Math.min(rangeEnd, windowEnd) - Math.max(rangeStart, windowStart))

/* -------------------------------------------------------
   CURFEW CHECK
------------------------------------------------------- */

const countCurfewViolations = (start: number, end: number): number => {
  if (end <= start) return 0

  const cursor = startOfLocalDay(start)
  cursor.setDate(cursor.getDate() - 1)

  const lastDay = startOfLocalDay(end)
  let count = 0

  while (cursor.getTime() <= lastDay.getTime()) {
    const curfewStart = new Date(cursor)
    curfewStart.setHours(CURFEW_START_HOUR, CURFEW_START_MINUTE, 0, 0)

    const curfewEnd = new Date(cursor)
    curfewEnd.setDate(curfewEnd.getDate() + 1)
    curfewEnd.setHours(CURFEW_END_HOUR, 0, 0, 0)

    const overlap = getOverlapDuration(
      start,
      end,
      curfewStart.getTime(),
      curfewEnd.getTime()
    )

    if (overlap > 0) {
      count += 1
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return count
}

/* -------------------------------------------------------
   ESTIMATED NIGHT
------------------------------------------------------- */

const calculateEstimatedNightDuration = (start: number, end: number) => {
  if (end <= start) return 0

  const cursor = startOfLocalDay(start)
  cursor.setDate(cursor.getDate() - 1)

  const lastDay = startOfLocalDay(end)
  let total = 0

  while (cursor.getTime() <= lastDay.getTime()) {
    const nightStart = new Date(cursor)
    nightStart.setHours(ESTIMATED_NIGHT_START_HOUR, 0, 0, 0)

    const nightEnd = new Date(cursor)
    nightEnd.setDate(nightEnd.getDate() + 1)
    nightEnd.setHours(ESTIMATED_NIGHT_END_HOUR, 0, 0, 0)

    total += getOverlapDuration(start, end, nightStart.getTime(), nightEnd.getTime())
    cursor.setDate(cursor.getDate() + 1)
  }

  return total
}

/* -------------------------------------------------------
   SOLAR NIGHT — MULTI-DAY WALK (Correct)
------------------------------------------------------- */

const calculateSolarNightDuration = (
  start: number,
  end: number,
  location: DriveLocation
): number => {
  if (end <= start) return 0

  let cursor = start
  let totalNightMs = 0

  while (cursor < end) {
    const nextMidnightMs = getStartOfNextLocalDay(cursor).getTime()
    const segmentEndMs = Math.min(end, nextMidnightMs)

    const segmentStart = new Date(cursor)
    const segmentEnd = new Date(segmentEndMs)

    const solarWindow = getSolarWindowForDate(
      location.latitude,
      location.longitude,
      segmentStart
    )

    const split = computeDayNightSplit(segmentStart, segmentEnd, solarWindow)

    if (split.mode === "solar") {
      totalNightMs += split.nightHours * 3_600_000
    }

    cursor = segmentEndMs
  }

  return totalNightMs
}

/* -------------------------------------------------------
   NIGHT BREAKDOWN
------------------------------------------------------- */

export const calculateNightBreakdown = (params: {
  start: number
  end: number
  location?: DriveLocation
}) => {
  const { start, end, location } = params
  const duration = end - start

  if (duration <= 0) {
    return {
      nightDuration: 0,
      dayDuration: 0,
      mode: "estimated" as const,
      isVerifiedDay: false,
    }
  }

  const validLocation = sanitizeLocation(location)

  if (validLocation) {
    const nightDuration = calculateSolarNightDuration(start, end, validLocation)
    const isVerifiedDay = nightDuration === 0
    return {
      nightDuration,
      dayDuration: Math.max(duration - nightDuration, 0),
      mode: "solar" as const,
      isVerifiedDay,
    }
  }

  const nightDuration = calculateEstimatedNightDuration(start, end)
  return {
    nightDuration,
    dayDuration: Math.max(duration - nightDuration, 0),
    mode: "estimated" as const,
    isVerifiedDay: false,
  }
}

/* -------------------------------------------------------
   CREATE ENTRY
------------------------------------------------------- */

export const createDriveEntry = (params: {
  start: number
  end: number
  source: DriveSource
  notes?: string
  location?: DriveLocation
}): DriveEntry => {
  const { start, end, source, notes, location } = params

  if (!isValidTimestamp(start) || !isValidTimestamp(end)) {
    throw new Error("Invalid drive timestamps")
  }

  if (end <= start) {
    throw new Error("Drive end must be greater than start")
  }

  const duration = end - start
  const cleanLocation = sanitizeLocation(location)

  const { nightDuration, dayDuration, mode, isVerifiedDay } =
    calculateNightBreakdown({
      start,
      end,
      location: cleanLocation,
    })

  return {
    id: generateId(),
    start,
    end,
    duration,
    nightDuration,
    dayDuration,
    hasNightPortion: nightDuration > 0,
    isVerifiedDay,
    notes: notes?.trim() || undefined,
    source,
    location: cleanLocation,
    nightCalcMode: mode,
  }
}

export const createDriveEntryFromTimer = (params: {
  start: number
  end: number
  notes?: string
  location?: DriveLocation
}) => createDriveEntry({ ...params, source: "timer" })

export const createDriveEntryFromManual = (params: {
  start: number
  end: number
  notes?: string
  location?: DriveLocation
}) => createDriveEntry({ ...params, source: "manual" })

/* -------------------------------------------------------
   SUMMARY
------------------------------------------------------- */

export const getSummary = (driveLog: DriveEntry[]): DriveSummary => {
  return driveLog.reduce(
    (acc, entry) => {
      acc.totalDuration += entry.duration
      acc.nightDuration += entry.nightDuration
      acc.dayDuration += entry.dayDuration

      if (entry.nightCalcMode === "solar") {
        acc.solarNightDuration += entry.nightDuration
      } else if (entry.nightCalcMode === "estimated") {
        acc.estimatedNightDuration += entry.nightDuration
        if (entry.nightDuration > 0) {
          acc.entriesWithEstimatedNight += 1
        }
      } else {
        acc.unverifiedNightDuration += entry.nightDuration
        if (entry.nightDuration > 0) {
          acc.entriesWithUnverifiedNight += 1
        }
      }

      return acc
    },
    {
      totalDuration: 0,
      nightDuration: 0,
      dayDuration: 0,
      solarNightDuration: 0,
      estimatedNightDuration: 0,
      unverifiedNightDuration: 0,
      entriesWithEstimatedNight: 0,
      entriesWithUnverifiedNight: 0,
    }
  )
}

/* -------------------------------------------------------
   COMPLIANCE
------------------------------------------------------- */

export const getCompliance = (driveLog: DriveEntry[]): DriveCompliance => {
  const summary = getSummary(driveLog)

  const curfewViolations = driveLog.reduce(
    (acc, entry) => acc + countCurfewViolations(entry.start, entry.end),
    0
  )

  const meetsTotal = summary.totalDuration >= REQUIRED_TOTAL
  const meetsNight = summary.nightDuration >= REQUIRED_NIGHT
  const meetsNightVerified = summary.solarNightDuration >= REQUIRED_NIGHT
  const requiresReview =
    summary.estimatedNightDuration > 0 || summary.unverifiedNightDuration > 0
  const meetsRequirementIncludingEstimated = meetsTotal && meetsNight
  const meetsRequirement = meetsTotal && meetsNightVerified

  return {
    ...summary,
    meetsTotal,
    meetsNight,
    meetsNightVerified,
    meetsRequirement,
    meetsRequirementIncludingEstimated,
    requiresReview,
    remainingTotal: Math.max(REQUIRED_TOTAL - summary.totalDuration, 0),
    remainingNight: Math.max(REQUIRED_NIGHT - summary.nightDuration, 0),
    remainingNightVerified: Math.max(
      REQUIRED_NIGHT - summary.solarNightDuration,
      0
    ),
    curfewViolations,
  }
}
