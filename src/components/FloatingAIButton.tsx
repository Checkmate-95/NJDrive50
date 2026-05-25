import { useNav } from "../state/navStore"

type FloatingAIButtonProps = {
  className?: string
}

export default function FloatingAIButton({
  className = "",
}: FloatingAIButtonProps) {
  const { screen, setScreen } = useNav()

  if (screen === "aiHelper") return null

  return (
    <button
      type="button"
      onClick={() => setScreen("aiHelper")}
      aria-label="Open AI Helper"
      className={[
        "inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full",
        "border-2 border-[#f9c80e] bg-[#08194A] px-4 py-3 text-white shadow-[0_10px_24px_rgba(8,25,74,0.28),0_0_14px_rgba(249,200,14,0.28)]",
        "transition-[transform,box-shadow,background-color] duration-200 ease-out motion-reduce:transform-none motion-reduce:transition-none",
        "hover:bg-[#0A1E5E] hover:shadow-[0_14px_28px_rgba(8,25,74,0.32),0_0_18px_rgba(249,200,14,0.42)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]",
        "active:scale-[0.98] motion-reduce:active:scale-100",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center text-[20px] leading-none text-[#f9c80e]"
      >
        ✨
      </span>

      <span className="whitespace-nowrap text-[13px] font-extrabold leading-none tracking-[0.02em] text-[#f9c80e]">
        AI FAQ
      </span>
    </button>
  )
}