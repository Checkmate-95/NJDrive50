// src/screens/TeenDriverRules.tsx
import type { ReactNode } from "react"
import { ScreenHeader } from "../layout/ScreenHeader"
import { useNav } from "../state/navStore"

export default function TeenDriverRules() {
  const { goBack } = useNav()

  return (
    <div className="flex flex-col h-full bg-[#F7FAFF]">
      <ScreenHeader
        title="Teen Driver Rules"
        onBack={() => goBack()}
      />

      <div className="p-5 overflow-y-auto text-[#08194A] space-y-6">
        <RuleCard title="Curfew" icon="⏰">
          <Rule>No driving between <b>11:01 PM and 5:00 AM</b>.</Rule>
        </RuleCard>

        <RuleCard title="Supervision" icon="👤">
          <Rule>
            Must have a supervising adult who is <b>21+</b> and has held a
            license for <b>3+ years</b>.
          </Rule>
        </RuleCard>

        <RuleCard title="Passengers" icon="🚗">
          <Rule>
            Only <b>1 passenger</b> allowed besides the supervising adult.
          </Rule>
          <Rule>Siblings do <b>not</b> count toward the passenger limit.</Rule>
        </RuleCard>

        <RuleCard title="Seatbelts" icon="🛡️">
          <Rule>All occupants must wear seatbelts at all times.</Rule>
        </RuleCard>

        <RuleCard title="Night Hours Requirement" icon="🌙">
          <Rule>
            Night hours count <b>after sunset</b> and <b>before sunrise</b>.
          </Rule>
          <Rule>10 hours of night driving are required.</Rule>
        </RuleCard>

        <RuleCard title="Permit Requirements" icon="📄">
          <Rule>Must complete <b>50 total hours</b> of supervised driving.</Rule>
          <Rule>Must complete <b>10 night hours</b>.</Rule>
          <Rule>Must hold permit for <b>6 months</b>.</Rule>
        </RuleCard>

        <RuleCard title="Probationary License" icon="🔒">
          <Rule>Same curfew, passenger, and seatbelt rules apply.</Rule>
          <Rule>No handheld or hands‑free phone use while driving.</Rule>
        </RuleCard>

        <p className="text-xs text-[#08194A]/50 text-center pt-6 border-t border-[#08194A]/10">
          These rules reflect New Jersey MVC Graduated Driver License (GDL) requirements.
        </p>
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
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#08194A]/10">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed">{children}</div>
    </div>
  )
}

function Rule({ children }: { children: ReactNode }) {
  return <p className="text-[#08194A]/80">{children}</p>
}