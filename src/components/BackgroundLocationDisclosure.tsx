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

      <p className="mb-3 text-sm leading-6">
        NJDrive50 uses your precise location only while you have an active
        drive running, to record your route, calculate mileage, and verify
        day and night driving hours for your supervised driving log.
      </p>

      <p className="mb-3 text-sm leading-6">
        Once you tap <span className="font-semibold">Start Drive</span>,
        location continues recording even if you switch apps, lock your
        screen, or minimize NJDrive50 — this keeps your drive log accurate
        if your phone goes idle mid-trip. Recording stops automatically when
        you tap <span className="font-semibold">Stop Drive</span> or end the
        active drive from the app.
      </p>

      <p className="mb-4 text-sm leading-6">
        NJDrive50 does not collect your location at any other time. You can
        review, export, or delete your drive history anytime from{" "}
        <span className="font-semibold">Settings</span>.
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