import { ChevronLeftIcon } from "@heroicons/react/24/solid"

export function ScreenHeader({
  title,
  onBack,
}: {
  title: string
  onBack?: () => void
}) {
  return (
    <header className="flex items-center gap-2 px-4 py-3 bg-white shadow-sm border-b border-[#08194A]/10">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back"
          className="flex items-center justify-center h-9 w-9 rounded-xl text-[#08194A] hover:bg-[#08194A]/8 transition active:scale-95"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      <h1 className="text-lg font-bold text-[#08194A] leading-tight">
        {title}
      </h1>
    </header>
  )
}