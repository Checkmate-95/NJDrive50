// src/screens/HomeIntroContent.tsx
// src/screens/HomeIntroContent.tsx
import type { Dispatch, SetStateAction } from "react"
import type { Screen } from "../App"

type HomeIntroContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}


export default function HomeIntroContent({ setScreen }: HomeIntroContentProps) {
  return (
    <div className="w-full flex justify-center text-[#0A1E5E]">
      <section className="w-full max-w-md rounded-[24px] bg-white/95 backdrop-blur-md border border-white/30 px-6 py-7 shadow-[0_8px_24px_rgba(0,0,0,0.18)] text-left">
        <h2 className="text-xl font-semibold mb-4 tracking-tight">
          Why this app matters
        </h2>

        <p className="text-sm text-[#1b2755] mb-4 leading-relaxed">
          Beginning <strong>February 1, 2025</strong>, New Jersey law requires
          all drivers under 21 to complete <strong>50 hours of supervised practice</strong>
          {" "}— including 10 hours at night — before earning a probationary license.
          Parents must certify these hours using the official NJMVC form.
        </p>

        <p className="text-sm text-[#1b2755] mb-4 leading-relaxed">
          <strong>NJDrive50</strong> makes compliance simple. It automatically
          records each drive, separates day and night hours, and organizes
          everything into one accurate, ready-to-submit log. Families can
          confidently complete their certification when it's time for the road
          test — without confusion or paperwork stress.
        </p>

        <ul className="text-sm text-[#1b2755] space-y-2 mb-6 list-disc list-inside">
          <li>Automatically track day and night driving</li>
          <li>Stay compliant with New Jersey's 50-hour requirement</li>
          <li>Export a clean, ready-to-sign record</li>
        </ul>

        <button
          type="button"
         onClick={() => setScreen("onboarding")}

          className="w-full rounded-lg bg-[#0A1E5E] text-white py-3 text-base font-semibold hover:bg-[#f9c80e] hover:text-[#0A1E5E] transition-colors shadow-md"
        >
          Get Started
        </button>
      </section>
    </div>
  )
}