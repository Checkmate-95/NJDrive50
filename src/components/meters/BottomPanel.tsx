// C:\Dev\NJDRIVE50\src\components\meters\BottomPanel.tsx
import { useEffect, useId, useRef } from "react"
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react"

type BottomPanelProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  titleId?: string
  initialFocusRef?: React.RefObject<HTMLElement | null>
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

export default function BottomPanel({
  open,
  onClose,
  children,
  title = "Bottom panel",
  titleId,
  initialFocusRef,
}: BottomPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  const fallbackTitleId = useId()
  const resolvedTitleId = titleId ?? fallbackTitleId
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const panel = panelRef.current
    const focusTarget =
      initialFocusRef?.current ??
      (panel?.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null) ??
      panel

    window.setTimeout(() => {
      focusTarget?.focus()
    }, 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener("keydown", onKey)

    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = originalOverflow
      previouslyFocusedRef.current?.focus?.()
    }
  }, [open, onClose, initialFocusRef])

  if (!open) return null

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab") return

    const panel = panelRef.current
    if (!panel) return

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-hidden") !== "true" &&
        el.tabIndex !== -1
    )

    if (focusable.length === 0) {
      e.preventDefault()
      panel.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement as HTMLElement | null

    if (e.shiftKey) {
      if (active === first || active === panel) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-xl animate-slideUp outline-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        tabIndex={-1}
      >
        <div className="px-4 pt-4 pb-2">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" />
          <h2 id={resolvedTitleId} className="text-base font-semibold text-[#08194A]">
            {title}
          </h2>
        </div>

        <div className="min-h-0 overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}