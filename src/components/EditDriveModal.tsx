import { useEffect, useId, useMemo, useRef, useState } from "react"
import {
  type DriveEntry,
  updateDriveInHistory,
} from "../state/driveStore"

type Props = {
  open: boolean
  entry: DriveEntry
  onClose: () => void
  onSaved: (entry: DriveEntry) => void
}

type ValidationErrors = {
  start?: string
  end?: string
  miles?: string
  form?: string
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(",")

function toLocalInputValue(iso: string) {
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function parseLocalDateTime(value: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseMilesInput(value: string) {
  if (value.trim() === "") return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function EditDriveModal({ open, entry, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const startInputRef = useRef<HTMLInputElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  const titleId = useId()
  const descriptionId = useId()
  const formErrorId = useId()
  const startErrorId = useId()
  const endErrorId = useId()
  const milesErrorId = useId()

  const [startInput, setStartInput] = useState(toLocalInputValue(entry.startTime))
  const [endInput, setEndInput] = useState(toLocalInputValue(entry.endTime))
  const [miles, setMiles] = useState(String(entry.miles ?? ""))
  const [errors, setErrors] = useState<ValidationErrors>({})

  useEffect(() => {
    setStartInput(toLocalInputValue(entry.startTime))
    setEndInput(toLocalInputValue(entry.endTime))
    setMiles(String(entry.miles ?? ""))
    setErrors({})
  }, [entry])

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusTimer = window.setTimeout(() => {
      startInputRef.current?.focus()
    }, 0)

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }

      if (e.key !== "Tab") return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (el) =>
          !el.hasAttribute("disabled") &&
          el.getAttribute("aria-hidden") !== "true" &&
          el.tabIndex !== -1
      )

      if (focusable.length === 0) {
        e.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (e.shiftKey) {
        if (active === first || active === dialog) {
          e.preventDefault()
          last.focus()
        }
        return
      }

      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, onClose])

  const computedDuration = useMemo(() => {
    const start = parseLocalDateTime(startInput)
    const end = parseLocalDateTime(endInput)

    if (!start || !end || end <= start) return null

    return (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  }, [startInput, endInput])

  if (!open) return null

  function validateForm(): { ok: true; start: Date; end: Date; milesValue: number } | { ok: false } {
    const nextErrors: ValidationErrors = {}

    const start = parseLocalDateTime(startInput)
    const end = parseLocalDateTime(endInput)
    const milesValue = parseMilesInput(miles)

    if (!start) {
      nextErrors.start = "Enter a valid start time."
    }

    if (!end) {
      nextErrors.end = "Enter a valid end time."
    }

    if (start && end && end <= start) {
      nextErrors.end = "End time must be after start time."
    }

    if (milesValue === null) {
      nextErrors.miles = "Enter a valid mileage."
    } else if (milesValue < 0) {
      nextErrors.miles = "Miles cannot be negative."
    }

    if (Object.keys(nextErrors).length > 0) {
      nextErrors.form = "Please fix the highlighted fields before saving."
      setErrors(nextErrors)
      return { ok: false }
    }

    setErrors({})
    return {
      ok: true,
      start: start!,
      end: end!,
      milesValue: milesValue!,
    }
  }

  function handleSave() {
    const result = validateForm()
    if (!result.ok) return

    const totalDurationHours =
      (result.end.getTime() - result.start.getTime()) / (1000 * 60 * 60)

    const updated: DriveEntry = {
      ...entry,
      startTime: result.start.toISOString(),
      endTime: result.end.toISOString(),
      totalDurationHours,
      miles: result.milesValue,
    }

    updateDriveInHistory(updated)
    onSaved(updated)
  }

  const startDescribedBy = errors.start ? startErrorId : undefined
  const endDescribedBy = errors.end ? endErrorId : undefined
  const milesDescribedBy = errors.miles ? milesErrorId : undefined

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#08194A]/40 px-4 py-4 backdrop-blur-[2px] sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId}${errors.form ? ` ${formErrorId}` : ""}`}
        tabIndex={-1}
        className="w-full max-w-lg rounded-3xl border border-[#08194A]/10 bg-white p-5 text-[#08194A] shadow-[0_12px_30px_rgba(0,0,0,0.06)] outline-none sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center rounded-full border border-[#f9c80e]/40 bg-[#FFF7DB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8A6500]">
              Edit Drive Entry
            </div>

            <h2
              id={titleId}
              className="mt-3 text-2xl font-extrabold tracking-tight text-[#08194A]"
            >
              Update Drive Log
            </h2>

            <p
              id={descriptionId}
              className="mt-2 max-w-md text-sm leading-6 text-[#08194A]/65"
            >
              Adjust the saved time range and mileage for this drive entry, then
              save your changes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close edit drive modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] text-lg font-semibold text-[#08194A]/70 transition hover:bg-[#EEF3FA] hover:text-[#08194A]"
          >
            ×
          </button>
        </div>

        {errors.form && (
          <div
            id={formErrorId}
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {errors.form}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label
              htmlFor="edit-drive-start"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              Start Time
            </label>
            <input
              ref={startInputRef}
              id="edit-drive-start"
              type="datetime-local"
              aria-invalid={errors.start ? "true" : undefined}
              aria-describedby={startDescribedBy}
              className={`min-h-[48px] w-full rounded-2xl bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:bg-white focus:ring-2 ${
                errors.start
                  ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border border-[#08194A]/10 focus:border-[#08194A]/20 focus:ring-[#08194A]/8"
              }`}
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
            />
            {errors.start && (
              <p id={startErrorId} className="mt-2 text-sm text-red-700">
                {errors.start}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-drive-end"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              End Time
            </label>
            <input
              id="edit-drive-end"
              type="datetime-local"
              aria-invalid={errors.end ? "true" : undefined}
              aria-describedby={endDescribedBy}
              className={`min-h-[48px] w-full rounded-2xl bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:bg-white focus:ring-2 ${
                errors.end
                  ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border border-[#08194A]/10 focus:border-[#08194A]/20 focus:ring-[#08194A]/8"
              }`}
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
            />
            {errors.end && (
              <p id={endErrorId} className="mt-2 text-sm text-red-700">
                {errors.end}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="edit-drive-miles"
              className="mb-2 block text-sm font-semibold text-[#08194A]/80"
            >
              Miles
            </label>
            <input
              id="edit-drive-miles"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              aria-invalid={errors.miles ? "true" : undefined}
              aria-describedby={milesDescribedBy}
              className={`min-h-[48px] w-full rounded-2xl bg-[#F8FAFD] px-4 py-3 text-sm text-[#08194A] outline-none transition placeholder:text-[#08194A]/35 focus:bg-white focus:ring-2 ${
                errors.miles
                  ? "border border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border border-[#08194A]/10 focus:border-[#08194A]/20 focus:ring-[#08194A]/8"
              }`}
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
            />
            {errors.miles && (
              <p id={milesErrorId} className="mt-2 text-sm text-red-700">
                {errors.miles}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[#08194A]/8 bg-[#F7F9FC] px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#08194A]/45">
            Calculated Duration
          </p>
          <p className="mt-1 text-sm font-semibold text-[#08194A]">
            {computedDuration !== null
              ? `${computedDuration.toFixed(2)} hrs`
              : "Invalid time range"}
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border border-[#08194A]/10 bg-white px-5 py-3 text-sm font-semibold text-[#08194A]/75 transition hover:bg-[#F7F9FC] hover:text-[#08194A]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="min-h-[48px] rounded-xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}