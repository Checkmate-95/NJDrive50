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
      title="Open AI Helper"
      className={className}
      style={{
        minHeight: 56,
        minWidth: 56,
        borderRadius: 999,
        background: "#08194A",
        border: "2px solid #f9c80e",
        color: "#FFFFFF",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "10px 14px",
        zIndex: 9999,
        boxShadow: "0 10px 24px rgba(8, 25, 74, 0.28), 0 0 14px rgba(249, 200, 14, 0.28)",
        transition: "transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
        WebkitTapHighlightColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px) scale(1.03)"
        e.currentTarget.style.boxShadow =
          "0 14px 28px rgba(8, 25, 74, 0.32), 0 0 18px rgba(249, 200, 14, 0.42)"
        e.currentTarget.style.background = "#0A1E5E"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)"
        e.currentTarget.style.boxShadow =
          "0 10px 24px rgba(8, 25, 74, 0.28), 0 0 14px rgba(249, 200, 14, 0.28)"
        e.currentTarget.style.background = "#08194A"
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = "translateY(-1px) scale(1.02)"
        e.currentTarget.style.boxShadow =
          "0 0 0 3px rgba(249, 200, 14, 0.22), 0 14px 28px rgba(8, 25, 74, 0.32)"
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)"
        e.currentTarget.style.boxShadow =
          "0 10px 24px rgba(8, 25, 74, 0.28), 0 0 14px rgba(249, 200, 14, 0.28)"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: 20,
          lineHeight: 1,
          color: "#f9c80e",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        ✨
      </span>

      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: 0.3,
          color: "#f9c80e",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        AI FAQ
      </span>
    </button>
  )
}