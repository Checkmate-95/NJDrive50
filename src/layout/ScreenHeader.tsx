import { ChevronLeftIcon } from "@heroicons/react/24/solid"
import type { ElementType } from "react"

export function ScreenHeader({
  title,
  onBack,
  as: Heading = "h1",
}: {
  title: string
  onBack?: () => void
  as?: ElementType
}) {
  return (
    <header className="flex items-center gap-2 border-b border-[#08194A]/10 bg-white px-4 py-3 shadow-sm">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-[#08194A] transition hover:bg-[#08194A]/8 active:scale-95"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      <Heading className="text-lg font-bold leading-tight text-[#08194A]">
        {title}
      </Heading>
    </header>
  )
}