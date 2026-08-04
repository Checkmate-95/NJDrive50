import { useEffect, useState } from "react"

interface DriveDashboardProps {
  formattedTimer: string
  isNightMode: boolean
  onMinimize: () => void
  currentSpeed?: number
  outsideTempF?: number | null
  isRunning?: boolean
  hasActiveDrive?: boolean
  onStart?: () => void
  onPause?: () => void
  onResume?: () => void
  onEnd?: () => void
}

const STAR_POSITIONS = Array.from({ length: 52 }, (_, index) => ({
  id: index,
  top: `${(index * 37 + 11) % 62}%`,
  left: `${(index * 61 + 7) % 100}%`,
  opacity: 0.3 + ((index * 19) % 70) / 100,
  size: index % 5 === 0 ? 3 : 2,
}))

function normalizeHeading(value: number): number {
  return ((value % 360) + 360) % 360
}

function getCardinalDirection(degrees: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return directions[Math.round(normalizeHeading(degrees) / 45) % 8]
}

function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const iosHeading = (event as DeviceOrientationEvent & {
        webkitCompassHeading?: number
      }).webkitCompassHeading

      if (typeof iosHeading === "number" && Number.isFinite(iosHeading)) {
        setHeading(normalizeHeading(iosHeading))
        return
      }

      if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
        setHeading(normalizeHeading(360 - event.alpha))
      }
    }

    const requestFn = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">
      }
    ).requestPermission

    if (typeof requestFn === "function") {
      setNeedsPermission(true)
      return
    }

    window.addEventListener("deviceorientationabsolute", onOrientation, true)
    window.addEventListener("deviceorientation", onOrientation, true)

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation, true)
      window.removeEventListener("deviceorientation", onOrientation, true)
    }
  }, [])

  const requestPermission = async () => {
    const requestFn = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">
      }
    ).requestPermission

    if (typeof requestFn !== "function") return

    try {
      const result = await requestFn()
      if (result !== "granted") return

      setNeedsPermission(false)
      window.dispatchEvent(new Event("resize"))
    } catch {
      setNeedsPermission(false)
    }
  }

  return { heading, needsPermission, requestPermission }
}

export default function DriveDashboard({
  formattedTimer,
  isNightMode,
  onMinimize,
  currentSpeed = 0,
  outsideTempF = null,
  isRunning = false,
  hasActiveDrive = false,
  onStart,
  onPause,
  onResume,
  onEnd,
}: DriveDashboardProps) {
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight
  )

  const { heading, needsPermission, requestPermission } = useCompassHeading()

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    window.addEventListener("resize", updateOrientation)
    window.addEventListener("orientationchange", updateOrientation)

    return () => {
      window.removeEventListener("resize", updateOrientation)
      window.removeEventListener("orientationchange", updateOrientation)
    }
  }, [])

  const roundedHeading = heading === null ? null : Math.round(normalizeHeading(heading))
  const directionLetter =
    roundedHeading === null ? "--" : getCardinalDirection(roundedHeading)
  const temperatureLabel =
    typeof outsideTempF === "number" && Number.isFinite(outsideTempF)
      ? `${Math.round(outsideTempF)}°F`
      : "--°F"

  const modeLabel = isNightMode ? "Night Driving" : "Day Driving"
  const speed = Math.max(0, Math.round(currentSpeed))
  const screenBg = isNightMode
    ? "linear-gradient(180deg, #101d45 0%, #0a1330 100%)"
    : "linear-gradient(180deg, #3a7bd5 0%, #1c4f9c 100%)"
  const pageBg = isNightMode
    ? "radial-gradient(ellipse at 50% 0%, #0d1b3d 0%, #050914 72%)"
    : "linear-gradient(180deg, #4ea8ff 0%, #8fd3ff 60%, #cbeaff 100%)"

  const topBar = (
    <div className="grid w-full grid-cols-3 items-center text-sm font-bold sm:text-base">
      <span className="justify-self-start text-white">{directionLetter}</span>
      <span className="justify-self-center text-[10px] font-bold uppercase tracking-[0.15em] text-white/75 sm:text-xs">
        Vehicle Speed
      </span>
      <span className="justify-self-end text-[#f9c80e]">{temperatureLabel}</span>
    </div>
  )

  const actionButtons = (
    <div className="w-full">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onStart}
          disabled={hasActiveDrive}
          className="min-h-11 touch-manipulation rounded-lg border-2 border-green-300/60 bg-green-600 px-1 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          Start
        </button>

        <button
          type="button"
          onClick={onPause}
          disabled={!hasActiveDrive || !isRunning}
          className="min-h-11 touch-manipulation rounded-lg border-2 border-yellow-200/60 bg-yellow-400 px-1 py-2 text-xs font-bold text-[#08194A] shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          Pause
        </button>

        <button
          type="button"
          onClick={onResume}
          disabled={!hasActiveDrive || isRunning}
          className="min-h-11 touch-manipulation rounded-lg border-2 border-blue-200/60 bg-blue-500 px-1 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
        >
          Resume
        </button>
      </div>

      <button
        type="button"
        onClick={onEnd}
        disabled={!hasActiveDrive}
        className="mx-auto mt-2 block min-h-11 w-[min(100%,18rem)] touch-manipulation rounded-lg border-2 border-red-300/60 bg-red-600 px-5 py-2 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        End Drive
      </button>
    </div>
  )

  const dashboardContent = (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-between text-white">
      {topBar}

      <div className="h-px w-full shrink-0 bg-white/15" />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
        <p className="text-[clamp(3.5rem,16vw,7rem)] font-black leading-none tracking-tight tabular-nums drop-shadow-lg landscape:text-[clamp(3rem,10vw,5.5rem)]">
          {speed}
          <span className="ml-1 text-base font-bold align-super opacity-70 sm:ml-2 sm:text-lg">
            MPH
          </span>
        </p>

        <p className="mt-1 text-[clamp(1.25rem,5vw,2.25rem)] font-extrabold tracking-wide text-[#ffd700] tabular-nums drop-shadow-md">
          {formattedTimer}
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/90 sm:text-base">
          <span aria-hidden="true">{isNightMode ? "🌙" : "☀️"}</span>
          <span>{modeLabel}</span>
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-white/15" />

      <div className="w-full pt-2">{actionButtons}</div>
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden px-3 py-3"
      style={{
        background: pageBg,
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingRight: "max(0.75rem, env(safe-area-inset-right))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
      }}
    >
      <button
        type="button"
        onClick={onMinimize}
        className="absolute right-[max(0.75rem,env(safe-area-inset-right))] top-[max(0.75rem,env(safe-area-inset-top))] z-[110] min-h-10 touch-manipulation rounded-full bg-black/30 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition active:scale-95"
      >
        Minimize
      </button>

      {needsPermission && (
        <button
          type="button"
          onClick={requestPermission}
          className="absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[max(0.75rem,env(safe-area-inset-top))] z-[110] min-h-10 touch-manipulation rounded-full bg-black/30 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition active:scale-95"
        >
          Enable Compass
        </button>
      )}

      {isNightMode && (
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {STAR_POSITIONS.map((star) => (
            <span
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                opacity: star.opacity,
              }}
            />
          ))}
        </div>
      )}

      {isLandscape ? (
        <div
          className="relative z-10 h-[min(88dvh,32rem)] w-[min(94vw,56rem)] overflow-hidden rounded-[clamp(1.5rem,4vw,2.5rem)] border-[clamp(4px,0.8vw,6px)] border-[#12131a] p-[clamp(1rem,2.4vw,2rem)] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ background: screenBg }}
        >
          {dashboardContent}
        </div>
      ) : (
        <div
          className="relative z-10 flex h-[min(88dvh,44rem)] w-full max-w-sm overflow-hidden rounded-[2rem] border-[6px] border-[#12131a] px-6 py-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ background: screenBg }}
        >
          {dashboardContent}
        </div>
      )}
    </div>
  )
}