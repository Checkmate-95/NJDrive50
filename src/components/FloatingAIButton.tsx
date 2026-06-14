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
        "flex h-12 w-12 items-center justify-center rounded-full select-none",
        "border-[1.5px] border-[#f9c80e] bg-[#08194A]",
        "shadow-[0_8px_20px_rgba(8,25,74,0.3),0_0_12px_rgba(249,200,14,0.25)]",
        "transition-[transform,box-shadow,background-color] duration-200 ease-out",
        "hover:bg-[#0A1E5E] hover:shadow-[0_12px_24px_rgba(8,25,74,0.35),0_0_16px_rgba(249,200,14,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f9c80e]",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-[#08194A]",
        "active:scale-95",
        className,
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-[22px] leading-none">
        ✨
      </span>
    </button>
  )
}
