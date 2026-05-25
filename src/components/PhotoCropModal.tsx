import { useEffect, useId, useRef, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"

type PhotoCropModalProps = {
  imageSrc: string
  onCancel: () => void
  onSave: (croppedDataUrl: string) => void
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image"))
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to read cropped image"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read cropped image"))
    reader.readAsDataURL(blob)
  })
}

async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: Area,
  outputSize = 512,
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")

  if (!ctx) {
    throw new Error("Canvas context not available")
  }

  canvas.width = outputSize
  canvas.height = outputSize

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        } else {
          reject(new Error("Failed to create cropped image"))
        }
      },
      "image/jpeg",
      0.9,
    )
  })

  return blobToDataUrl(blob)
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",")

  return Array.from(container.querySelectorAll<HTMLElement>(selectors)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true",
  )
}

export default function PhotoCropModal({
  imageSrc,
  onCancel,
  onSave,
}: PhotoCropModalProps) {
  const titleId = useId()
  const zoomId = useId()
  const errorId = useId()

  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastActiveElementRef = useRef<HTMLElement | null>(null)

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    lastActiveElementRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        if (!saving) onCancel()
        return
      }

      if (event.key !== "Tab") return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusable = getFocusableElements(dialog)
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          event.preventDefault()
          last.focus()
        }
      } else if (active === last || !dialog.contains(active)) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      lastActiveElementRef.current?.focus?.()
    }
  }, [onCancel, saving])

  const handleSave = async () => {
    if (!croppedAreaPixels || saving) return

    try {
      setSaving(true)
      setSaveError("")

      const croppedDataUrl = await getCroppedImageDataUrl(
        imageSrc,
        croppedAreaPixels,
        512,
      )

      onSave(croppedDataUrl)
    } catch (error) {
      console.error("Failed to crop teen photo:", error)
      setSaveError("We couldn't save that photo. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onCancel()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={saveError ? errorId : undefined}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.22)] outline-none"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

        <div className="p-5 pt-6 sm:p-6 sm:pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A6500]">
                Teen Photo
              </p>
              <h2
                id={titleId}
                className="mt-1 text-xl font-extrabold tracking-tight text-[#0A1E5E]"
              >
                Adjust profile photo
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#0A1E5E]/68">
                Drag to reposition and zoom to frame the photo the way you want.
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onCancel}
              disabled={saving}
              aria-label="Close photo cropper"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white text-lg font-semibold text-[#0A1E5E]/70 transition hover:bg-[#EEF3F9] hover:text-[#0A1E5E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E5E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5 h-72 w-full overflow-hidden rounded-[24px] bg-[#08194A]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A1E5E]/55">
              <label htmlFor={zoomId}>Zoom</label>
              <span aria-live="polite">{zoom.toFixed(1)}x</span>
            </div>

            <input
              id={zoomId}
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#0A1E5E]"
            />
          </div>

          {saveError && (
            <p
              id={errorId}
              role="alert"
              className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {saveError}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="w-full rounded-xl border border-[#0A1E5E]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0A1E5E] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E5E] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !croppedAreaPixels}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E5E] focus-visible:ring-offset-2 sm:w-auto ${
                saving || !croppedAreaPixels
                  ? "cursor-not-allowed bg-[#08194A]/25 text-white/70"
                  : "bg-[#08194A] text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
              }`}
            >
              {saving ? "Saving..." : "Save Photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}