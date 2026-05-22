import { useNavigate } from "react-router-dom"
import { useState } from "react"

type FloatingAIButtonProps = {
  className?: string
}

export default function FloatingAIButton({ className = "" }: FloatingAIButtonProps) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={() => navigate("/ask")}  // ✅ takes user to the AI Q&A screen
      className={className}
      aria-label="Open AI Helper"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
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
  )
}
