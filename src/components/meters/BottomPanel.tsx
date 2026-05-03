// src/components/BottomPanel.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  Content area is scrollable with max height — tall children no longer
//          overflow off screen and the Close button is always reachable
// [FIX-2]  Backdrop tap closes the panel — matches standard iOS/Android sheet
//          behavior. stopPropagation on inner panel prevents bubbling.
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
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
      {/* [FIX-1] max-h-[90vh] + flex-col keeps Close button on screen
          [FIX-2] stopPropagation prevents backdrop click bubbling */}
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-xl animate-slideUp flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* [FIX-1] Scrollable content area */}
        <div className="overflow-y-auto flex-1 p-6">
          {children}
        </div>

        {/* Close button always anchored at bottom */}
        <div className="p-6 pt-0">
          <button
            className="w-full py-3 rounded-lg bg-[#0A1E5E] text-white font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}