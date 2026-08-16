export default function BackgroundLocationDisclosure({
  onContinue,
  onCancel,
}: {
  onContinue: () => void
  onCancel: () => void
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-6 text-[#08194A] shadow-lg">
      <h2 className="mb-3 text-xl font-semibold">
        Allow Location for Active Drive Tracking
      </h2>
      <p className="mb-4 text-sm leading-6">
        NJDrive50 collects location data to record active drives, calculate
        mileage, save route history, and verify day and night driving. During
        an active drive, location may continue to be collected even when the
        app is minimized or not in use so your driving log stays accurate.
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="rounded border border-[#08194A]/30 px-4 py-2 text-[#08194A] hover:bg-[#EEF3FA]"
          onClick={onCancel}
        >
          Not now
        </button>
        <button
          type="button"
          className="rounded bg-[#08194A] px-4 py-2 text-white hover:bg-[#0A1E5E]"
          onClick={onContinue}
        >
          Continue
        </button>
      </div>
    </div>
  )
}