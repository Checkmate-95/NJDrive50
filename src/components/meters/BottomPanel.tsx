// src/components/BottomPanel.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  Simplified layout — removed outer scroll and Close section.
// [FIX-2]  Backdrop tap closes the panel — matches standard iOS/Android sheet behavior.
// [FIX-3]  Escape key closes the panel — keyboard accessibility added.
//          role="dialog" and aria-modal="true" added for screen readers.

import { useEffect } from "react"
import type { ReactNode } from "react"

type BottomPanelProps = {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function BottomPanel({ open, onClose, children }: BottomPanelProps) {
  // [FIX-3] Escape key support
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    // [FIX-2] Backdrop tap closes the panel
    // [FIX-3] role/aria attrs for screen readers
    <div
      className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* [FIX-1] Simplified inner container — no outer scroll or Close section */}
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-xl animate-slideUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
