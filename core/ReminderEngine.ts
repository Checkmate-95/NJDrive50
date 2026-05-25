// src/core/ReminderEngine.ts
// PRODUCTION-SAFE VERSION
// All fixes applied + optional hardening completed

export type ReminderPreferences = {
  weeklyHoursReminder: boolean
  permitExpiryReminder: boolean
  roadTestReminder: boolean
}

export type OnboardingData = {
  teenName: string
  teenBirthday: string
  teenPhone: string
  permitIssueDate: string
  state: string
  parentName: string
  parentEmail: string
  parentPhone: string
  relationship: string
  teenPhoto: string | null

  address: string
  permitNumber: string

  homeTown: string
  homeZip: string
  homeCounty: string
  homeLat: number | null
  homeLng: number | null
}

export type CalculatedMilestones = {
  permitExpiryDate: Date | null
}

export type ReminderType = keyof ReminderPreferences

const REMINDER_PREFS_KEY = "njdrive50_reminder_prefs"
const ONBOARDING_DATA_KEY = "njdrive50_onboarding_data"
const REMINDER_SCHEDULE_KEY = "njdrive50_reminder_schedule"
const REMINDER_SCHEDULE_EVENT = "njdrive50-reminder-schedule-change"

const defaultReminderPreferences: ReminderPreferences = {
  weeklyHoursReminder: true,
  permitExpiryReminder: true,
  roadTestReminder: true,
}

const defaultOnboardingData: OnboardingData = {
  teenName: "",
  teenBirthday: "",
  teenPhone: "",
  permitIssueDate: "",
  state: "New Jersey",
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  relationship: "",
  teenPhoto: null,
  address: "",
  permitNumber: "",
  homeTown: "",
  homeZip: "",
  homeCounty: "",
  homeLat: null,
  homeLng: null,
}

export const ROAD_TEST_WARNING_MESSAGE = `
Road Test Reminder:

Your vehicle MUST have a hand-operated emergency brake located between the front seats.
Foot-pedal e-brakes and electronic parking brakes are NOT accepted.
The examiner must be able to reach and control the brake during the test.
If the e-brake is not accessible, the MVC will refuse the test immediately.

Make sure the vehicle you bring meets this requirement.
`

type ReminderSchedule = {
  [K in ReminderType]?: {
    enabled: boolean
    message: string
    trigger: string
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function emitReminderScheduleChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(REMINDER_SCHEDULE_EVENT))
  }
}

function parseDateParts(
  input: string
): { year: number; month: number; day: number } | null {
  if (!input) return null

  let year: number
  let month: number
  let day: number

  if (input.includes("/")) {
    const parts = input.split("/")
    if (parts.length !== 3) return null
    month = Number(parts[0])
    day = Number(parts[1])
    year = Number(parts[2])
  } else if (input.includes("-")) {
    const parts = input.split("-")
    if (parts.length !== 3) return null
    year = Number(parts[0])
    month = Number(parts[1])
    day = Number(parts[2])
  } else {
    return null
  }

  if (
    !Number.isFinite(year) || year < 1900 || year > 2100 ||
    !Number.isFinite(month) || month < 1 || month > 12 ||
    !Number.isFinite(day) || day < 1 || day > 31
  ) {
    return null
  }

  return { year, month, day }
}

function parseDate(input: string): Date | null {
  const parts = parseDateParts(input)
  if (!parts) return null

  const { year, month, day } = parts
  const d = new Date(year, month - 1, day)

  if (Number.isNaN(d.getTime())) return null

  if (
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null
  }

  return d
}

function addMonthsClamped(date: Date, months: number): Date {
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()

  const targetMonthIndex = month + months
  const targetYear = year + Math.floor(targetMonthIndex / 12)
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12

  const lastDayOfTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate()
  const clampedDay = Math.min(day, lastDayOfTargetMonth)

  return new Date(
    targetYear,
    normalizedMonth,
    clampedDay,
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  )
}

export function calculateMilestones(data: OnboardingData): CalculatedMilestones {
  const permitDate = parseDate(data.permitIssueDate)
  let permitExpiryDate: Date | null = null

  if (permitDate) {
    const twoYearExpiry = new Date(permitDate)
    twoYearExpiry.setFullYear(twoYearExpiry.getFullYear() + 2)

    const birthday = parseDate(data.teenBirthday)
    if (birthday) {
      const twentyFirst = new Date(birthday)
      twentyFirst.setFullYear(twentyFirst.getFullYear() + 21)
      permitExpiryDate = twoYearExpiry < twentyFirst ? twoYearExpiry : twentyFirst
    } else {
      permitExpiryDate = twoYearExpiry
    }
  }

  return { permitExpiryDate }
}

export function saveReminderPreferences(prefs: ReminderPreferences): boolean {
  return safeSetItem(REMINDER_PREFS_KEY, JSON.stringify(prefs))
}

export function loadReminderPreferences(): ReminderPreferences {
  const raw = safeGetItem(REMINDER_PREFS_KEY)
  if (!raw) return { ...defaultReminderPreferences }

  try {
    const parsed = JSON.parse(raw) as Partial<ReminderPreferences>

    return {
      weeklyHoursReminder:
        parsed.weeklyHoursReminder === true ? true
        : parsed.weeklyHoursReminder === false ? false
        : defaultReminderPreferences.weeklyHoursReminder,

      permitExpiryReminder:
        parsed.permitExpiryReminder === true ? true
        : parsed.permitExpiryReminder === false ? false
        : defaultReminderPreferences.permitExpiryReminder,

      roadTestReminder:
        parsed.roadTestReminder === true ? true
        : parsed.roadTestReminder === false ? false
        : defaultReminderPreferences.roadTestReminder,
    }
  } catch {
    return { ...defaultReminderPreferences }
  }
}

export function saveOnboardingData(data: OnboardingData): boolean {
  return safeSetItem(ONBOARDING_DATA_KEY, JSON.stringify(data))
}

export function loadOnboardingData(): OnboardingData {
  const raw = safeGetItem(ONBOARDING_DATA_KEY)
  if (!raw) return { ...defaultOnboardingData }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingData>

    return {
      teenName: typeof parsed.teenName === "string" ? parsed.teenName : "",
      teenBirthday: typeof parsed.teenBirthday === "string" ? parsed.teenBirthday : "",
      teenPhone: typeof parsed.teenPhone === "string" ? parsed.teenPhone : "",
      permitIssueDate: typeof parsed.permitIssueDate === "string" ? parsed.permitIssueDate : "",
      state: typeof parsed.state === "string" ? parsed.state : "New Jersey",
      parentName: typeof parsed.parentName === "string" ? parsed.parentName : "",
      parentEmail: typeof parsed.parentEmail === "string" ? parsed.parentEmail : "",
      parentPhone: typeof parsed.parentPhone === "string" ? parsed.parentPhone : "",
      relationship: typeof parsed.relationship === "string" ? parsed.relationship : "",
      teenPhoto: typeof parsed.teenPhoto === "string" ? parsed.teenPhoto : null,
      address: typeof parsed.address === "string" ? parsed.address : "",
      permitNumber: typeof parsed.permitNumber === "string" ? parsed.permitNumber : "",
      homeTown: typeof parsed.homeTown === "string" ? parsed.homeTown : "",
      homeZip: typeof parsed.homeZip === "string" ? parsed.homeZip : "",
      homeCounty: typeof parsed.homeCounty === "string" ? parsed.homeCounty : "",
      homeLat: Number.isFinite(parsed.homeLat) ? (parsed.homeLat as number) : null,
      homeLng: Number.isFinite(parsed.homeLng) ? (parsed.homeLng as number) : null,
    }
  } catch {
    return { ...defaultOnboardingData }
  }
}

function loadReminderSchedule(): ReminderSchedule {
  const raw = safeGetItem(REMINDER_SCHEDULE_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as ReminderSchedule
  } catch {
    return {}
  }
}

function saveReminderSchedule(schedule: ReminderSchedule): boolean {
  const saved = safeSetItem(REMINDER_SCHEDULE_KEY, JSON.stringify(schedule))
  if (saved) {
    emitReminderScheduleChange()
  }
  return saved
}

export function scheduleReminder(
  type: ReminderType,
  trigger: Date,
  message: string
): boolean {
  const schedule = loadReminderSchedule()
  schedule[type] = { enabled: true, message, trigger: trigger.toISOString() }
  const saved = saveReminderSchedule(schedule)

  if (import.meta.env.DEV) {
    console.log(
      `[ReminderEngine] Scheduled: ${type}`,
      trigger,
      message,
      saved ? "✓" : "✗ FAILED"
    )
  }

  return saved
}

export function cancelReminder(type: ReminderType): boolean {
  const schedule = loadReminderSchedule()
  delete schedule[type]
  const saved = saveReminderSchedule(schedule)

  if (import.meta.env.DEV) {
    console.log(`[ReminderEngine] Cancelled: ${type}`, saved ? "✓" : "✗ FAILED")
  }

  return saved
}

export function computeReminderTriggers(
  data: OnboardingData,
  prefs: ReminderPreferences
): Record<ReminderType, Date | undefined> {
  const milestones = calculateMilestones(data)
  const now = new Date()

  const triggers: Record<ReminderType, Date | undefined> = {
    weeklyHoursReminder: undefined,
    permitExpiryReminder: undefined,
    roadTestReminder: undefined,
  }

  if (prefs.weeklyHoursReminder) {
    const nextSunday = new Date(now)
    const daysUntilSunday = (7 - now.getDay()) % 7
    nextSunday.setDate(now.getDate() + daysUntilSunday)
    nextSunday.setHours(19, 0, 0, 0)

    if (nextSunday < now) {
      nextSunday.setDate(nextSunday.getDate() + 7)
    }

    triggers.weeklyHoursReminder = nextSunday
  }

  if (prefs.permitExpiryReminder && milestones.permitExpiryDate) {
    const expiryTrigger = new Date(milestones.permitExpiryDate)
    expiryTrigger.setDate(expiryTrigger.getDate() - 30)

    if (expiryTrigger > now) {
      triggers.permitExpiryReminder = expiryTrigger
    }
  }

  if (prefs.roadTestReminder) {
    const baseDate = parseDate(data.permitIssueDate)
    if (baseDate) {
      const roadTestTrigger = addMonthsClamped(baseDate, 6)

      if (roadTestTrigger > now) {
        triggers.roadTestReminder = roadTestTrigger
      }
    }
  }

  if (import.meta.env.DEV) {
    console.log("[ReminderEngine] Computed triggers:", triggers)
  }

  return triggers
}

export function initializeReminders(prefs: ReminderPreferences): boolean {
  const onboarding = loadOnboardingData()
  const triggers = computeReminderTriggers(onboarding, prefs)

  let allSucceeded = true

  ;(Object.entries(prefs) as [ReminderType, boolean][]).forEach(
    ([key, enabled]) => {
      if (!enabled) return

      const trigger = triggers[key]
      if (!trigger) return

      let message = ""

      if (key === "roadTestReminder") message = ROAD_TEST_WARNING_MESSAGE
      if (key === "weeklyHoursReminder")
        message = "Weekly reminder: Log your supervised driving hours in NJDrive50."
      if (key === "permitExpiryReminder")
        message = "Your permit expires in 30 days. Make sure all requirements are complete."

      const success = scheduleReminder(key, trigger, message)
      if (!success) allSucceeded = false
    }
  )

  return allSucceeded
}

export type ReminderScheduleEntry = {
  type: ReminderType
  enabled: boolean
  message: string
  trigger: Date
}

export function loadReminderScheduleForUI(): ReminderScheduleEntry[] {
  const raw = loadReminderSchedule()

  const entries = Object.entries(raw)
    .map(([key, value]) => {
      if (!value) return null

      const trigger = new Date(value.trigger)
      if (Number.isNaN(trigger.getTime())) return null

      return {
        type: key as ReminderType,
        enabled: value.enabled,
        message: value.message,
        trigger,
      } as ReminderScheduleEntry
    })
    .filter((e): e is ReminderScheduleEntry => e !== null)

  entries.sort((a, b) => a.trigger.getTime() - b.trigger.getTime())

  return entries
}