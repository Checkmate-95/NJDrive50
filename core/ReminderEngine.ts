// src/core/ReminderEngine.ts
// TRUST-CORRECTED VERSION
// [FIX-1]  Weekly reminder uses < not <= so exact 7PM Sunday trigger is never skipped
// [FIX-2]  Permit expiry trigger guarded — past-date triggers are not scheduled
// [FIX-3]  Road test trigger guarded — past triggers not scheduled; blank
//          permitIssueDate no longer silently falls back to today
// [FIX-4]  homeLat/homeLng use Number.isFinite() — NaN no longer passes the guard
//          and corrupts the solar engine
// [FIX-5]  parseDateParts validates numeric ranges — out-of-range month/day
//          values are rejected before they can silently roll over into wrong dates
// [FIX-6]  console.log guarded by import.meta.env.DEV — no PII-adjacent data
//          logged in production builds
// [FIX-7]  loadReminderPreferences uses === true with per-field default fallback —
//          non-boolean stored values cannot masquerade as enabled preferences,
//          AND a fresh install no longer silently disables all reminders by
//          returning false for every missing field instead of the default true
// [FIX-8]  calculateMilestones respects NJ GDL rule: permit expires on the
//          2-year anniversary OR the teen's 21st birthday, whichever is earlier
// [FIX-9]  safeSetItem returns boolean — storage errors (QuotaExceededError on
//          Android) are no longer swallowed silently
// [FIX-10] saveOnboardingData, saveReminderPreferences, saveReminderSchedule all
//          return boolean — callers can detect and surface storage failures


// --- Reminder Types ---
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


// --- Storage Keys ---
const REMINDER_PREFS_KEY    = "njdrive50_reminder_prefs"
const ONBOARDING_DATA_KEY   = "njdrive50_onboarding_data"
const REMINDER_SCHEDULE_KEY = "njdrive50_reminder_schedule"


// --- Defaults ---
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


// --- Road Test Warning Message ---
export const ROAD_TEST_WARNING_MESSAGE = `
Road Test Reminder:

Your vehicle MUST have a hand-operated emergency brake located between the front seats.
Foot-pedal e-brakes and electronic parking brakes are NOT accepted.
The examiner must be able to reach and control the brake during the test.
If the e-brake is not accessible, the MVC will refuse the test immediately.

Make sure the vehicle you bring meets this requirement.
`


// --- Reminder Schedule Structure ---
type ReminderSchedule = {
  [K in ReminderType]?: {
    enabled: boolean
    message: string
    trigger: string
  }
}


// --- Safe localStorage wrappers ---
function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}


// [FIX-9] Returns true on success, false on any storage error
// (QuotaExceededError is the most common failure on Android Capacitor).
// All save functions above this level propagate this boolean to callers.
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}


// --- Date Parsing Helpers ---


// [FIX-5] Validates numeric ranges after parsing to prevent silent JS date
// rollover. "13/45/2023" previously produced month:13/day:45 which JS
// silently rolled into a completely wrong date — now rejected at source.
function parseDateParts(
  input: string
): { year: number; month: number; day: number } | null {
  if (!input) return null

  let year: number, month: number, day: number

  if (input.includes("/")) {
    const parts = input.split("/")
    if (parts.length !== 3) return null
    month = Number(parts[0])
    day   = Number(parts[1])
    year  = Number(parts[2])
  } else if (input.includes("-")) {
    const parts = input.split("-")
    if (parts.length !== 3) return null
    year  = Number(parts[0])
    month = Number(parts[1])
    day   = Number(parts[2])
  } else {
    return null
  }

  if (
    !Number.isFinite(year)  || year  < 1900 || year  > 2100 ||
    !Number.isFinite(month) || month < 1    || month > 12   ||
    !Number.isFinite(day)   || day   < 1    || day   > 31
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

  // [FIX-5] Secondary rollover check — JS silently advances Feb 31 into March.
  // If the constructed date doesn't exactly match the input, reject it.
  if (
    d.getFullYear() !== year  ||
    d.getMonth()    !== month - 1 ||
    d.getDate()     !== day
  ) {
    return null
  }

  return d
}


// --- Milestone Calculation ---


// [FIX-8] NJ GDL: permit expires on 2-year anniversary OR teen's 21st birthday,
// whichever comes FIRST. Previously flat +2 years could show a permit as valid
// past age 21 — a compliance trust risk for parents relying on this date.
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


// --- Preferences ---


// [FIX-10] Returns boolean — callers in ReminderSettings can detect and
// surface a storage failure instead of silently losing the user's preference.
export function saveReminderPreferences(prefs: ReminderPreferences): boolean {
  return safeSetItem(REMINDER_PREFS_KEY, JSON.stringify(prefs))
}


export function loadReminderPreferences(): ReminderPreferences {
  const raw = safeGetItem(REMINDER_PREFS_KEY)
  if (!raw) return { ...defaultReminderPreferences }

  try {
    const parsed = JSON.parse(raw) as Partial<ReminderPreferences>

    // [FIX-7] === true rejects non-boolean truthy values (e.g. "yes", 1).
    // Ternary fallback to default ensures a fresh install (missing fields)
    // returns true for all reminders instead of silently returning false.
    return {
      weeklyHoursReminder:  parsed.weeklyHoursReminder  === true ? true
        : parsed.weeklyHoursReminder  === false ? false
        : defaultReminderPreferences.weeklyHoursReminder,

      permitExpiryReminder: parsed.permitExpiryReminder === true ? true
        : parsed.permitExpiryReminder === false ? false
        : defaultReminderPreferences.permitExpiryReminder,

      roadTestReminder:     parsed.roadTestReminder     === true ? true
        : parsed.roadTestReminder     === false ? false
        : defaultReminderPreferences.roadTestReminder,
    }
  } catch {
    return { ...defaultReminderPreferences }
  }
}


// --- Onboarding Data ---


// [FIX-10] Returns boolean — ManageProfile.tsx sync check now has a signal.
export function saveOnboardingData(data: OnboardingData): boolean {
  return safeSetItem(ONBOARDING_DATA_KEY, JSON.stringify(data))
}


export function loadOnboardingData(): OnboardingData {
  const raw = safeGetItem(ONBOARDING_DATA_KEY)
  if (!raw) return { ...defaultOnboardingData }

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingData>

    return {
      teenName:        typeof parsed.teenName        === "string" ? parsed.teenName        : "",
      teenBirthday:    typeof parsed.teenBirthday    === "string" ? parsed.teenBirthday    : "",
      teenPhone:       typeof parsed.teenPhone       === "string" ? parsed.teenPhone       : "",
      permitIssueDate: typeof parsed.permitIssueDate === "string" ? parsed.permitIssueDate : "",
      state:           typeof parsed.state           === "string" ? parsed.state           : "New Jersey",
      parentName:      typeof parsed.parentName      === "string" ? parsed.parentName      : "",
      parentEmail:     typeof parsed.parentEmail     === "string" ? parsed.parentEmail     : "",
      parentPhone:     typeof parsed.parentPhone     === "string" ? parsed.parentPhone     : "",
      relationship:    typeof parsed.relationship    === "string" ? parsed.relationship    : "",
      teenPhoto:       typeof parsed.teenPhoto       === "string" ? parsed.teenPhoto       : null,
      address:         typeof parsed.address         === "string" ? parsed.address         : "",
      permitNumber:    typeof parsed.permitNumber    === "string" ? parsed.permitNumber    : "",
      homeTown:        typeof parsed.homeTown        === "string" ? parsed.homeTown        : "",
      homeZip:         typeof parsed.homeZip         === "string" ? parsed.homeZip         : "",
      homeCounty:      typeof parsed.homeCounty      === "string" ? parsed.homeCounty      : "",

      // [FIX-4] Number.isFinite() rejects NaN — typeof NaN === "number" is true
      // so the old typeof guard silently passed NaN coordinates into solarEngine,
      // producing broken sunrise/sunset and misclassified night drives
      homeLat: Number.isFinite(parsed.homeLat) ? (parsed.homeLat as number) : null,
      homeLng: Number.isFinite(parsed.homeLng) ? (parsed.homeLng as number) : null,
    }
  } catch {
    return { ...defaultOnboardingData }
  }
}


// --- Reminder Schedule ---
function loadReminderSchedule(): ReminderSchedule {
  const raw = safeGetItem(REMINDER_SCHEDULE_KEY)
  if (!raw) return {}
  try { return JSON.parse(raw) as ReminderSchedule } catch { return {} }
}


// [FIX-10] Returns boolean — consistent with all other save functions
function saveReminderSchedule(schedule: ReminderSchedule): boolean {
  return safeSetItem(REMINDER_SCHEDULE_KEY, JSON.stringify(schedule))
}


// --- Schedule / Cancel ---
export function scheduleReminder(
  type: ReminderType,
  trigger: Date,
  message: string
): void {
  const schedule = loadReminderSchedule()
  schedule[type] = { enabled: true, message, trigger: trigger.toISOString() }
  saveReminderSchedule(schedule)

  // [FIX-6] Reminder triggers contain PII-adjacent dates — dev only
  if (import.meta.env.DEV) {
    console.log(`[ReminderEngine] Scheduled: ${type}`, trigger, message)
  }
}


export function cancelReminder(type: ReminderType): void {
  const schedule = loadReminderSchedule()
  delete schedule[type]
  saveReminderSchedule(schedule)

  if (import.meta.env.DEV) {
    console.log(`[ReminderEngine] Cancelled: ${type}`)
  }
}


// --- Compute Trigger Times ---
export function computeReminderTriggers(
  data: OnboardingData,
  prefs: ReminderPreferences
): Record<ReminderType, Date | undefined> {
  const milestones = calculateMilestones(data)
  const now = new Date()

  const triggers: Record<ReminderType, Date | undefined> = {
    weeklyHoursReminder:  undefined,
    permitExpiryReminder: undefined,
    roadTestReminder:     undefined,
  }

  // Weekly — next Sunday at 7 PM.
  // If today is Sunday and it's before 7 PM, trigger fires today at 7 PM.
  // If today is Sunday and it's at or after 7 PM, advance to next Sunday.
  if (prefs.weeklyHoursReminder) {
    const nextSunday = new Date(now)
    const daysUntilSunday = (7 - now.getDay()) % 7
    nextSunday.setDate(now.getDate() + daysUntilSunday)
    nextSunday.setHours(19, 0, 0, 0)

    // [FIX-1] < not <= — exact 7:00:00 PM trigger is no longer advanced +7 days
    if (nextSunday < now) {
      nextSunday.setDate(nextSunday.getDate() + 7)
    }

    triggers.weeklyHoursReminder = nextSunday
  }

  // Permit expiry — 30 days before expiry date
  // [FIX-2] Only schedule if trigger is in the future
  if (prefs.permitExpiryReminder && milestones.permitExpiryDate) {
    const expiryTrigger = new Date(milestones.permitExpiryDate)
    expiryTrigger.setDate(expiryTrigger.getDate() - 30)

    if (expiryTrigger > now) {
      triggers.permitExpiryReminder = expiryTrigger
    }
  }

  // Road test — 6 months after permit issue date
  // [FIX-3] Requires a valid permitIssueDate — no fallback to today.
  // Only scheduled if the computed trigger is still in the future.
  if (prefs.roadTestReminder) {
    const baseDate = parseDate(data.permitIssueDate)
    if (baseDate) {
      const roadTestTrigger = new Date(baseDate)
      roadTestTrigger.setMonth(roadTestTrigger.getMonth() + 6)

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


// --- Initialize Reminders ---
export function initializeReminders(prefs: ReminderPreferences): void {
  const onboarding = loadOnboardingData()
  const triggers = computeReminderTriggers(onboarding, prefs)

  ;(Object.entries(prefs) as [ReminderType, boolean][]).forEach(
    ([key, enabled]) => {
      if (!enabled) return

      const trigger = triggers[key]
      if (!trigger) return

      let message = ""

      if (key === "roadTestReminder")     message = ROAD_TEST_WARNING_MESSAGE
      if (key === "weeklyHoursReminder")  message = "Weekly reminder: Log your supervised driving hours in NJDrive50."
      if (key === "permitExpiryReminder") message = "Your permit expires in 30 days. Make sure all requirements are complete."

      scheduleReminder(key, trigger, message)
    }
  )
}


// --- UI-friendly schedule view ---
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