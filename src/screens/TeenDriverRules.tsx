// src/screens/TeenDriverRules.tsx
import type { ReactNode } from "react"
import { ScreenHeader } from "../layout/ScreenHeader"
import { useNav } from "../state/navStore"

export default function TeenDriverRules() {
  const { goBack } = useNav()

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#08194A]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 pb-24 pt-4 sm:px-4 lg:px-6">
        <div className="rounded-[28px] border border-white/30 bg-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.08)] backdrop-blur-md">
          <ScreenHeader
            title="Teen Driver Rules"
            onBack={() => goBack()}
          />

          <div className="px-4 pb-6 pt-2 sm:px-6">
            <p className="max-w-3xl text-sm leading-6 text-[#08194A]/65 sm:text-base">
              A quick summary of common New Jersey teen driver restrictions.
            </p>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <RuleCard title="Curfew" icon="⏰">
                <Rule>No driving between <b>11:01 PM and 5:00 AM</b>.</Rule>
              </RuleCard>

              <RuleCard title="Supervision" icon="👤">
                <Rule>
                  The supervising driver must be <b>at least 21</b>, have a valid
                  <b> New Jersey license</b>, and have at least <b>3 years</b> of driving experience.
                </Rule>
              </RuleCard>

              <RuleCard title="Passengers" icon="🚗">
                <Rule>
                  <b>Parent(s), guardian(s), or dependent(s)</b> are allowed as passengers.
                </Rule>
                <Rule>
                  Only <b>1 additional passenger</b> is allowed unless accompanied by a <b>parent or guardian</b>.
                </Rule>
              </RuleCard>

              <RuleCard title="Seatbelts" icon="🛡️">
                <Rule>Seat belts must be worn at all times.</Rule>
              </RuleCard>

              <RuleCard title="Driving Hours" icon="🌙">
                <Rule>Must complete <b>50 hours</b> of supervised driving.</Rule>
                <Rule>Must complete <b>10 hours during darkness</b>.</Rule>
              </RuleCard>

              <RuleCard title="Permit Period" icon="📄">
                <Rule>Must hold the permit for <b>at least 6 months</b>.</Rule>
              </RuleCard>

              <RuleCard title="Wireless Devices" icon="📵">
                <Rule>
                  Cannot use a <b>cell phone</b>, whether <b>handheld or hands-free</b>, except in an emergency.
                </Rule>
              </RuleCard>

              <RuleCard title="Probationary License" icon="🔒">
                <Rule>Curfew, passenger, and seatbelt restrictions still apply.</Rule>
              </RuleCard>
            </div>

            <p className="mt-6 border-t border-[#08194A]/10 pt-6 text-center text-xs text-[#08194A]/50">
              This screen summarizes New Jersey Graduated Driver License requirements. Verify current details with NJ MVC.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RuleCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[#08194A]/10 bg-[#F7F9FC] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-[#08194A]">
        <span className="text-xl" aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-2 text-sm leading-6">{children}</div>
    </section>
  )
}

function Rule({ children }: { children: ReactNode }) {
  return <p className="text-[#08194A]/80">{children}</p>
}