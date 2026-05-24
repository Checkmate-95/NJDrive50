import { useState } from "react"
import { useNav } from "../state/navStore"

type FloatingAIButtonProps = {
  className?: string
}

export default function FloatingAIButton({ className = "" }: FloatingAIButtonProps) {
  const { screen, setScreen } = useNav()
  const [hovered, setHovered] = useState(false)

  if (screen === "aiHelper") return null

  return (
    <>
      {/* Floating AI Bubble */}
      <button
        type="button"
        onClick={() => setScreen("aiHelper")}
        className={className}
        aria-label="Open AI Helper"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "#08194A",
          border: "2px solid #f9c80e",
          color: "#f9c80e",
          fontSize: 28,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          transform: hovered ? "scale(1.08)" : "scale(1)",
          boxShadow: hovered
            ? "0 0 24px rgba(249, 200, 14, 0.55)"
            : "0 0 18px rgba(249, 200, 14, 0.35)",
        }}
      >
        ✨
      </button>

      {/* Label Under Bubble */}
      <div
        style={{
          marginTop: 6,
          color: "#f9c80e",
          fontSize: 12,
          fontWeight: 600,
          textShadow: "0 0 6px rgba(0,0,0,0.6)",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        AI FAQ
      </div>
    </>
  )
}
