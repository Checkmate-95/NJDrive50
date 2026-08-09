type SpeedometerProps = {
  speedMph: number | null
  variant: "portrait" | "landscape"
}

const MAX_REALISTIC_SPEED = 200
const HIGH_SPEED_THRESHOLD = 80

const sizeClasses: Record<SpeedometerProps["variant"], string> = {
  portrait: "text-[clamp(3.5rem,16vw,7rem)]",
  landscape: "text-[clamp(2.4rem,9dvh,4.8rem)]",
}

const unitSizeClasses: Record<SpeedometerProps["variant"], string> = {
  portrait: "ml-1 text-base sm:ml-2 sm:text-lg",
  landscape: "ml-1 text-[clamp(0.75rem,2.4dvh,1.2rem)]",
}

export function Speedometer({ speedMph, variant }: SpeedometerProps) {
  const displaySpeed =
    typeof speedMph !== "number" ||
    Number.isNaN(speedMph) ||
    speedMph < 0 ||
    speedMph > MAX_REALISTIC_SPEED
      ? "--"
      : Math.round(speedMph).toString()

  const isHighSpeed =
    typeof speedMph === "number" &&
    !Number.isNaN(speedMph) &&
    speedMph >= HIGH_SPEED_THRESHOLD &&
    speedMph <= MAX_REALISTIC_SPEED

  return (
    <p
      className={`whitespace-nowrap font-black leading-none tracking-tight tabular-nums drop-shadow-lg ${sizeClasses[variant]} ${
        isHighSpeed ? "text-red-500" : "text-white"
      }`}
      aria-label={
        displaySpeed === "--"
          ? "Speed unavailable"
          : `${displaySpeed} miles per hour`
      }
    >
      {displaySpeed}
      <span
        className={`font-bold align-super opacity-70 ${unitSizeClasses[variant]}`}
      >
        MPH
      </span>
    </p>
  )
}
