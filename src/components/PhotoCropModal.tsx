import { useEffect, useMemo, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"

type PhotoCropModalProps = {
  file: File
  onCancel: () => void
  onSave: (croppedDataUrl: string) => void
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.crossOrigin = "anonymous"
    image.src = url
  })
}

async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: Area,
  outputSize = 512
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
    outputSize
  )

  return canvas.toDataURL("image/jpeg", 0.9)
}

export default function PhotoCropModal({
  file,
  onCancel,
  onSave,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const imageUrl = useMemo(() => URL.createObjectURL(file), [file])

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl)
    }
  }, [imageUrl])

  const handleSave = async () => {
    if (!croppedAreaPixels || saving) return

    try {
      setSaving(true)
      const croppedDataUrl = await getCroppedImageDataUrl(
        imageUrl,
        croppedAreaPixels,
        512
      )
      onSave(croppedDataUrl)
    } catch (error) {
      console.error("Failed to crop teen photo:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-photo-title"
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.22)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

        <div className="p-5 pt-6 sm:p-6 sm:pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#8A6500]">
                Teen Photo
              </p>
              <h2
                id="crop-photo-title"
                className="mt-1 text-xl font-extrabold tracking-tight text-[#0A1E5E]"
              >
                Adjust profile photo
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#0A1E5E]/68">
                Drag to reposition and zoom to frame the photo the way you want.
              </p>
            </div>

            <button
              type="button"
              onClick={onCancel}
              aria-label="Close photo cropper"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0A1E5E]/10 bg-white text-lg font-semibold text-[#0A1E5E]/70 transition hover:bg-[#EEF3F9] hover:text-[#0A1E5E]"
            >
              ×
            </button>
          </div>

          <div className="relative mt-5 h-72 w-full overflow-hidden rounded-[24px] bg-[#08194A]">
            <Cropper
              image={imageUrl}
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
              <span>Zoom</span>
              <span>{zoom.toFixed(1)}x</span>
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-[#0A1E5E]"
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="w-full rounded-xl border border-[#0A1E5E]/15 bg-white px-4 py-3 text-sm font-semibold text-[#0A1E5E] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_0_16px_rgba(249,200,14,0.18)] sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`w-full rounded-xl px-4 py-3 text-sm font-bold transition duration-200 sm:w-auto ${
                saving
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