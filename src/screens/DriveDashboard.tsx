import { useEffect, useState } from "react"
import { useCompass } from "../hooks/useCompass"
import { Speedometer } from "../components/speedometer/Speedometer"



interface DriveDashboardProps {
  formattedTimer: string
  isNightMode: boolean
  onMinimize: () => void
  currentSpeed?: number | null
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

function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null)
  const [needsPermission, setNeedsPermission] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return
    }

    const onOrientation = (event: DeviceOrientationEvent) => {
      const iosHeading = (
        event as DeviceOrientationEvent & {
          webkitCompassHeading?: number
        }
      ).webkitCompassHeading

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

    if (typeof requestFn === "function" && !permissionGranted) {
      setNeedsPermission(true)
      return
    }

    window.addEventListener("deviceorientationabsolute", onOrientation, true)
    window.addEventListener("deviceorientation", onOrientation, true)

    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrientation, true)
      window.removeEventListener("deviceorientation", onOrientation, true)
    }
  }, [permissionGranted])

  const requestPermission = async () => {
    const requestFn = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<"granted" | "denied">
      }
    ).requestPermission

    if (typeof requestFn !== "function") return

    try {
      const result = await requestFn()

      if (result === "granted") {
        setNeedsPermission(false)
        setPermissionGranted(true)
      }
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
  currentSpeed = null,
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

  const roundedHeading =
    heading === null ? null : Math.round(normalizeHeading(heading))

  const directionLetter = useCompass()

  const temperatureLabel =
    typeof outsideTempF === "number" && Number.isFinite(outsideTempF)
      ? `${Math.round(outsideTempF)}°F`
      : "--°F"

  const modeLabel = isNightMode ? "Night Driving" : "Day Driving"

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

      <span className="justify-self-end text-[#f9c80e]">
        {temperatureLabel}
      </span>
    </div>
  )

  const portraitActionButtons = (
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

  const landscapeActionButtons = (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-4 gap-2">
      <button
        type="button"
        onClick={onStart}
        disabled={hasActiveDrive}
        className="min-h-7 touch-manipulation rounded-lg border-2 border-green-300/60 bg-green-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Start
      </button>

      <button
        type="button"
        onClick={onPause}
        disabled={!hasActiveDrive || !isRunning}
        className="min-h-7 touch-manipulation rounded-lg border-2 border-yellow-200/60 bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-[#08194A] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Pause
      </button>

      <button
        type="button"
        onClick={onResume}
        disabled={!hasActiveDrive || isRunning}
        className="min-h-7 touch-manipulation rounded-lg border-2 border-blue-200/60 bg-blue-500 px-1.5 py-0.5 text-[10px] font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Resume
      </button>

      <button
        type="button"
        onClick={onEnd}
        disabled={!hasActiveDrive}
        className="min-h-7 touch-manipulation rounded-lg border-2 border-red-300/60 bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
      >
        End Drive
      </button>
    </div>
  )

  const dashboardContent = isLandscape ? (
    <div
      className="
        grid h-full w-full
        grid-cols-[minmax(4rem,1fr)_minmax(8rem,1.3fr)_minmax(5rem,1fr)]
        grid-rows-[auto_1fr_auto]
        gap-x-[clamp(0.25rem,0.75vw,0.75rem)]
        pl-[max(0.5rem,env(safe-area-inset-left))]
        pr-[max(0.5rem,env(safe-area-inset-right))]
        pt-[max(0.25rem,env(safe-area-inset-top))]
        pb-[max(0.25rem,env(safe-area-inset-bottom))]
        text-white
      "
    >
      <div className="col-span-3 flex items-center justify-between border-b border-white/15 pb-[clamp(0.2rem,0.8dvh,0.4rem)]">
        <div className="text-[clamp(0.7rem,2dvh,1rem)] font-black">
          {directionLetter}
        </div>

        <div className="text-center">
          <p className="text-[clamp(0.5rem,1.6dvh,0.7rem)] font-bold uppercase tracking-[0.12em] text-white/70">
            Vehicle Speed
          </p>
        </div>

        <div className="text-[clamp(0.7rem,2dvh,1rem)] font-black text-[#f9c80e]">
          {temperatureLabel}
        </div>
      </div>

      {/* Left panel — compass */}
      <div className="row-start-2 flex min-w-0 flex-col items-center justify-center border-r border-white/15 pr-[clamp(0.25rem,0.75vw,0.75rem)] text-center">
        <p className="text-[clamp(0.5rem,1.6dvh,0.7rem)] font-bold uppercase tracking-[0.12em] text-white/60">
          Direction
        </p>

        <p className="mt-0.5 text-[clamp(1.6rem,8dvh,3.5rem)] font-black leading-none">
          {directionLetter}
        </p>

        <p className="mt-1 text-[clamp(0.6rem,1.8dvh,0.85rem)] font-semibold leading-tight text-white/80">
          {roundedHeading === null
            ? "Compass unavailable"
            : `${roundedHeading}° heading`}
        </p>

        {needsPermission && (
          <button
            type="button"
            onClick={requestPermission}
            className="mt-2 min-h-7 touch-manipulation rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur transition active:scale-95"
          >
            Enable Compass
          </button>
        )}
      </div>

      {/* Center panel — speed and timer */}
      <div className="row-start-2 flex min-w-0 flex-col items-center justify-center text-center">
        <Speedometer speedMph={currentSpeed} variant="landscape" />



        <p className="mt-1 whitespace-nowrap text-[clamp(1.1rem,5dvh,2.4rem)] font-extrabold tracking-wide text-[#ffd700] tabular-nums drop-shadow-md">
          {formattedTimer}
        </p>

        <div className="mt-1 flex items-center gap-1 text-center text-[clamp(0.75rem,2.2dvh,1.1rem)] font-semibold text-white/90">
          <span aria-hidden="true">{isNightMode ? "🌙" : "☀️"}</span>
          <span>{modeLabel}</span>
        </div>
      </div>

      {/* Right panel — temperature */}
      <div className="row-start-2 flex min-w-0 flex-col items-center justify-center border-l border-white/15 pl-[clamp(0.25rem,0.75vw,0.75rem)] text-center">
        <p className="text-[clamp(0.5rem,1.6dvh,0.7rem)] font-bold uppercase tracking-[0.12em] text-white/60">
          Outside Temp
        </p>

        <p className="mt-0.5 whitespace-nowrap text-[clamp(1.6rem,8dvh,3.5rem)] font-black leading-none text-[#f9c80e]">
          {temperatureLabel}
        </p>

        <p className="mt-1 text-[clamp(0.6rem,1.8dvh,0.85rem)] font-semibold leading-tight text-white/80">
          Local conditions
        </p>
      </div>

      <div className="col-span-3 row-start-3 border-t border-white/15 pt-[clamp(0.2rem,0.8dvh,0.4rem)]">
        {landscapeActionButtons}
      </div>
    </div>
  ) : (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-between text-white">
      {topBar}

      <div className="h-px w-full shrink-0 bg-white/15" />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-1">
        <Speedometer speedMph={currentSpeed} variant="portrait" />



        <p className="mt-1 text-[clamp(1.25rem,5vw,2.25rem)] font-extrabold tracking-wide text-[#ffd700] tabular-nums drop-shadow-md">
          {formattedTimer}
        </p>

        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-white/90 sm:text-base">
          <span aria-hidden="true">{isNightMode ? "🌙" : "☀️"}</span>
          <span>{modeLabel}</span>
        </div>
      </div>

      <div className="h-px w-full shrink-0 bg-white/15" />

      <div className="w-full pt-2">{portraitActionButtons}</div>
    </div>
  )

  return (
    <div
      className={`fixed inset-0 z-[100] flex h-[100dvh] w-screen items-center justify-center overflow-hidden ${
        isLandscape ? "p-0" : "px-3 py-3"
      }`}
      style={{
        background: pageBg,
        paddingTop: isLandscape
          ? 0
          : "max(0.75rem, env(safe-area-inset-top))",
        paddingRight: isLandscape
          ? 0
          : "max(0.75rem, env(safe-area-inset-right))",
        paddingBottom: isLandscape
          ? 0
          : "max(0.75rem, env(safe-area-inset-bottom))",
        paddingLeft: isLandscape
          ? 0
          : "max(0.75rem, env(safe-area-inset-left))",
      }}
    >
      <button
        type="button"
        onClick={onMinimize}
        className="absolute right-[max(0.5rem,env(safe-area-inset-right))] top-[max(0.25rem,env(safe-area-inset-top))] z-[110] min-h-8 touch-manipulation rounded-full bg-black/30 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md transition active:scale-95 sm:min-h-10 sm:px-4 sm:py-1.5 sm:text-sm"
      >
        Minimize
      </button>

      {!isLandscape && needsPermission && (
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
          className="relative z-10 h-full w-full overflow-hidden"
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