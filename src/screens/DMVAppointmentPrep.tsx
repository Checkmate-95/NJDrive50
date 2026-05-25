// src/screens/DMVAppointmentPrep.tsx
import type { ReactNode } from "react"
import { loadOnboardingData } from "../../core/ReminderEngine"
import { useNav } from "../state/navStore"

type PrepCardProps = {
  title: string
  children: ReactNode
}

function PrepCard({ title, children }: PrepCardProps) {
  return (
    <section className="rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)] sm:p-6">
      <h2 className="text-lg font-extrabold tracking-tight text-[#08194A] sm:text-xl">
        {title}
      </h2>
      <div className="mt-3 text-sm leading-6 text-[#08194A]/72 sm:text-[15px]">
        {children}
      </div>
    </section>
  )
}

function PrepList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li
          key={index}
          className="rounded-xl border border-[#08194A]/8 bg-[#F7F9FC] px-4 py-3"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function DMVAppointmentPrep() {
  const { goBack } = useNav()
  const onboarding = loadOnboardingData()
  const teenName = onboarding?.teenName || "Teen Driver"

  return (
    <main className="min-h-dvh bg-[#F7F9FC] px-4 py-6 text-[#08194A] sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="rounded-3xl border border-[#08194A]/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6">
          <button
            type="button"
            onClick={() => goBack()}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-[#08194A] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
          >
            ← Back to DMV Paperwork
          </button>

          <div className="mt-5 inline-flex rounded-full border border-[#D4AF37]/30 bg-[#FFF8DB] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6B5600]">
            DMV Prep
          </div>

          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#08194A] sm:text-4xl">
            DMV Driving Test Appointment Prep
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#08194A]/70 sm:text-base">
            Review what to bring, what to practice, and what to expect before
            the New Jersey MVC road test appointment.
          </p>

          <div className="mt-5 rounded-2xl border border-[#08194A]/10 bg-[#08194A] p-4 text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f9c80e]/85">
              Preparing for
            </p>
            <p className="mt-2 text-xl font-extrabold sm:text-2xl">
              {teenName}
            </p>
          </div>
        </header>

        <PrepCard title="Arrival Time">
          <p>
            Arrive about <strong>15 minutes early</strong> so you have time to
            check in, organize documents, and avoid last-minute stress.
          </p>
        </PrepCard>

        <PrepCard title="Required Documents">
          <PrepList
            items={[
              <>
                <strong>Valid examination permit</strong>
              </>,
              <>
                <strong>Identification used for the permit</strong> or any
                documents required by MVC for the transaction
              </>,
              <>Vehicle registration</>,
              <>Insurance card</>,
              <>
                <strong>Completed BA-CSD form</strong>, when required for the
                licensing step
              </>,
              <>
                <strong>Accompanying New Jersey licensed driver</strong>, such
                as a parent or guardian when applicable
              </>,
            ]}
          />
          <p className="mt-4 rounded-xl border border-[#f9c80e]/35 bg-[#FFF8DB] px-4 py-3 text-xs leading-snug text-[#6B5600] sm:text-sm">
            NJ MVC road-test guidance refers to bringing the same identification
            used to obtain the permit. For document questions, confirm your
            exact transaction on the official MVC pages before the appointment.
          </p>
        </PrepCard>

        <PrepCard title="Vehicle Requirements">
          <PrepList
            items={[
              <>Valid inspection sticker</>,
              <>Current registration and insurance</>,
              <>Working brake lights, turn signals, horn, and basic safety equipment</>,
              <>
                Vehicle in safe operating condition and suitable for the road
                test
              </>,
              <>
                Parking brake and controls should be accessible for proper test
                administration
              </>,
            ]}
          />
          <p className="mt-4 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-xs leading-snug text-[#08194A]/65 sm:text-sm">
            If anything about the vehicle is questionable, verify current NJ MVC
            road-test vehicle rules before the appointment instead of relying on
            assumptions.
          </p>
        </PrepCard>

        <PrepCard title="Skills to Review">
          <PrepList
            items={[
              <>Parallel parking</>,
              <>K-turn / 3-point turn</>,
              <>Smooth braking and stopping</>,
              <>Lane changes with signaling</>,
              <>Reverse driving control</>,
            ]}
          />
        </PrepCard>

        <PrepCard title="What to Expect at MVC">
          <PrepList
            items={[
              <>Check in with your teen and present the required documents.</>,
              <>
                MVC staff will review the permit and confirm required
                identification or related paperwork.
              </>,
              <>
                The vehicle may be checked for basic safety readiness before the
                road test.
              </>,
              <>
                Your teen will be called when the examiner is ready to begin the
                test.
              </>,
              <>
                After the road test, the examiner will explain the result and
                next steps.
              </>,
              <>
                If your teen passes, MVC will provide instructions for the
                probationary-license step, which may be completed at the test
                location if available or at a Licensing Center.
              </>,
            ]}
          />
          <p className="mt-4 rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-4 py-3 text-xs leading-snug text-[#08194A]/65 sm:text-sm">
            MVC visits can feel unpredictable, but the process is usually
            straightforward when your documents are organized and the vehicle is
            ready.
          </p>
        </PrepCard>

        <PrepCard title="Final Ready Check">
          <p>
            Make sure your teen is rested, calm, familiar with the vehicle, and
            comfortable with the local driving area before arriving.
          </p>
        </PrepCard>

        <div className="rounded-3xl border border-[#08194A]/10 bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-5">
          <button
            type="button"
            onClick={() => goBack()}
            className="min-h-[44px] w-full rounded-xl bg-[#E9EDF5] px-6 py-3.5 font-semibold text-[#08194A] transition hover:bg-[#DCE4F2]"
          >
            Back to DMV Paperwork
          </button>
        </div>
      </div>
    </main>
  )
}