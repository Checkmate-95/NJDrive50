// src/screens/DMVAppointmentPrep.tsx
import { loadOnboardingData } from "../../core/ReminderEngine"
import { useNav } from "../state/navStore"

export default function DMVAppointmentPrep() {
  const { goBack } = useNav()
  const onboarding = loadOnboardingData()
  const teenName = onboarding?.teenName || "Teen Driver"

  return (
    <main className="min-h-screen bg-white text-[#08194A] p-6 space-y-8">

      {/* Heading */}
      <h1 className="text-3xl font-bold text-center tracking-tight">
        DMV Driving Test Appointment Prep
      </h1>

      {/* Preparing For Panel */}
      <div className="rounded-xl bg-[#08194A] p-4 text-center text-white">
        <p className="text-sm font-semibold">Preparing for:</p>
        <p className="text-lg font-bold mt-1">{teenName}</p>
      </div>

      {/* Arrival */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">Arrival Time</h3>
        <p className="text-sm text-gray-600 mt-1">
          Arrive <strong>15 minutes early</strong> to avoid delays and allow time for check-in.
        </p>
      </div>

      {/* Required Documents */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">Required Documents</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          <li><strong>Teen's 6 Points of ID</strong> (the teen is the applicant)</li>
          <li>Teen's permit</li>
          <li>Vehicle registration</li>
          <li>Insurance card</li>
          <li><strong>Completed BA-CSD Form</strong> (parent-signed)</li>
          <li>Parent/guardian's driver's license</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3 leading-snug">
          Only the teen needs a full 6-Point ID set. The parent does{" "}
          <strong>not</strong> need 6 Points — just their driver's license and
          signature on the BA-CSD.
        </p>
      </div>

      {/* Vehicle Requirements */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">Vehicle Requirements</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          <li>Valid inspection sticker</li>
          <li>Working brake lights &amp; turn signals</li>
          <li>No dashboard warning lights</li>
          <li>Accessible parking brake (examiner must reach it)</li>
        </ul>
      </div>

      {/* Skills to Review */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">Skills to Review</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          <li>Parallel parking</li>
          <li>K-turn / 3-point turn</li>
          <li>Smooth braking</li>
          <li>Lane changes with signaling</li>
          <li>Reverse driving control</li>
        </ul>
      </div>

      {/* What to Expect at MVC */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">What to Expect at MVC</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-2">
          <li>Check in at the counter with your teen.</li>
          <li>The clerk will verify the teen's 6 Points of ID.</li>
          <li>Parent/guardian signs the BA-CSD if not already signed.</li>
          <li>The examiner will confirm the vehicle's safety basics.</li>
          <li>Your teen will be called for the road test when ready.</li>
          <li>After the test, the examiner will give immediate results.</li>
          <li>If passed, the teen receives their permit validation.</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3 leading-snug">
          MVC visits can feel unpredictable, but the process is usually quick
          and straightforward. Staying calm and organized helps your teen feel
          confident.
        </p>
      </div>

      {/* Final Ready Check */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
        <h3 className="font-semibold text-lg">Final Ready Check</h3>
        <p className="text-sm text-gray-600 mt-2">
          Make sure your teen is calm, confident, and familiar with the
          test-route area.
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={() => goBack()}
        className="w-full bg-gray-200 text-[#08194A] px-6 py-3 rounded-lg font-semibold
                   hover:bg-[#f9c80e] hover:text-[#08194A] transition-colors"
      >
        Back to DMV Paperwork
      </button>

    </main>
  )
}