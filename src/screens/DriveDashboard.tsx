// src/screens/DriveDashboard.tsx
import { useEffect, useState } from "react";

interface DriveDashboardProps {
  formattedTimer: string;
  isNightMode: boolean;
  onMinimize: () => void;
  currentSpeed?: number;
  isRunning?: boolean;
  hasActiveDrive?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
}

function getCardinalDirection(deg: number): string {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

function useCompassHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      return;
    }

    const handler = (event: DeviceOrientationEvent) => {
      const iosHeading = (event as any).webkitCompassHeading;
      if (typeof iosHeading === "number") {
        setHeading(iosHeading);
        return;
      }
      if (typeof event.alpha === "number") {
        setHeading(360 - event.alpha);
      }
    };

    const requestFn = (DeviceOrientationEvent as any).requestPermission;

    if (typeof requestFn === "function") {
      setNeedsPermission(true);
      return;
    }

    window.addEventListener("deviceorientationabsolute", handler, true);
    window.addEventListener("deviceorientation", handler, true);

    return () => {
      window.removeEventListener("deviceorientationabsolute", handler, true);
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, []);

  const requestPermission = async () => {
    const requestFn = (DeviceOrientationEvent as any).requestPermission;
    if (typeof requestFn !== "function") return;

    try {
      const result = await requestFn();
      if (result === "granted") {
        setNeedsPermission(false);
        const handler = (event: DeviceOrientationEvent) => {
          const iosHeading = (event as any).webkitCompassHeading;
          if (typeof iosHeading === "number") {
            setHeading(iosHeading);
            return;
          }
          if (typeof event.alpha === "number") {
            setHeading(360 - event.alpha);
          }
        };
        window.addEventListener("deviceorientation", handler, true);
      }
    } catch {
      // orientation unsupported, silently ignore
    }
  };

  return { heading, needsPermission, requestPermission };
}

export default function DriveDashboard({
  formattedTimer,
  isNightMode,
  onMinimize,
  currentSpeed = 0,
  isRunning = false,
  hasActiveDrive = false,
  onStart,
  onPause,
  onResume,
  onEnd,
}: DriveDashboardProps) {
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false
  );

  const { heading, needsPermission, requestPermission } = useCompassHeading();

  useEffect(() => {
    const handleResize = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const bgGradient = isNightMode
    ? "radial-gradient(ellipse at 50% 0%, #0d1b3d 0%, #050914 70%)"
    : "linear-gradient(180deg, #4ea8ff 0%, #8fd3ff 60%, #cbeaff 100%)";

  const screenBg = isNightMode
    ? "linear-gradient(180deg, #101d45 0%, #0a1330 100%)"
    : "linear-gradient(180deg, #3a7bd5 0%, #1c4f9c 100%)";

  const modeLabel = isNightMode ? "Night Driving" : "Day Driving";
  const roundedHeading = heading !== null ? Math.round(heading) : null;
  const directionLetter =
    roundedHeading !== null ? getCardinalDirection(roundedHeading) : "--";
  const degreesLabel = roundedHeading !== null ? `${roundedHeading}°` : "--°";

  const TopBar = (
    <div className="flex w-full items-center justify-between text-sm font-bold sm:text-base">
      <span className="text-white/90">{directionLetter}</span>
      <span className="uppercase tracking-[0.15em] text-white/90">
        Vehicle Speed
      </span>
      <span className="text-[#f9c80e]">{degreesLabel}</span>
    </div>
  );

  const ActionButtons = (
    <div className="grid w-full grid-cols-4 gap-2 sm:gap-2.5">
      <button
        type="button"
        onClick={onStart}
        disabled={hasActiveDrive}
        className="rounded-lg border-2 border-green-400/60 bg-green-600 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40 sm:text-sm"
      >
        Start
      </button>
      <button
        type="button"
        onClick={onPause}
        disabled={!hasActiveDrive || !isRunning}
        className="rounded-lg border-2 border-yellow-300/60 bg-yellow-500 py-2 text-xs font-bold text-[#08194A] shadow-md transition active:scale-95 disabled:opacity-40 sm:text-sm"
      >
        Pause
      </button>
      <button
        type="button"
        onClick={onResume}
        disabled={!hasActiveDrive || isRunning}
        className="rounded-lg border-2 border-blue-300/60 bg-blue-500 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40 sm:text-sm"
      >
        Resume
      </button>
      <button
        type="button"
        onClick={onEnd}
        disabled={!hasActiveDrive}
        className="rounded-lg border-2 border-red-400/60 bg-red-600 py-2 text-xs font-bold text-white shadow-md transition active:scale-95 disabled:opacity-40 sm:text-sm"
      >
        End
      </button>
    </div>
  );

  return (
    <div
      className="relative flex min-h-[100dvh] w-full items-center justify-center overflow-hidden px-3 py-6"
      style={{ background: bgGradient }}
    >
      <button
        type="button"
        onClick={onMinimize}
        className="absolute top-4 right-4 z-50 rounded-full bg-black/25 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-md transition active:scale-95"
      >
        Minimize
      </button>

      {needsPermission && (
        <button
          type="button"
          onClick={requestPermission}
          className="absolute top-4 left-4 z-50 rounded-full bg-black/25 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition active:scale-95"
        >
          Enable Compass
        </button>
      )}

      {isNightMode && (
        <div className="pointer-events-none absolute inset-0 opacity-70">
          {Array.from({ length: 60 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-[2px] w-[2px] rounded-full bg-white"
              style={{
                top: `${Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
              }}
            />
          ))}
        </div>
      )}

      {isLandscape ? (
        <div
          className="relative z-10 w-full max-w-[46rem] rounded-[2.5rem] border-[6px] border-[#12131a] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div
            className="relative h-full w-full overflow-hidden rounded-[2rem] px-6 py-4 sm:px-10 sm:py-6"
            style={{ background: screenBg }}
          >
            <div className="flex h-full flex-col items-center justify-between text-white">
              {TopBar}
              <div className="h-px w-full bg-white/15" />

              <p className="text-[clamp(3rem,10vw,5.5rem)] font-black leading-none tracking-tight tabular-nums drop-shadow-lg">
                {Math.round(currentSpeed)}
                <span className="ml-2 text-lg font-bold align-super opacity-70">
                  MPH
                </span>
              </p>

              <div className="h-px w-full bg-white/15" />
              <p className="text-[clamp(1.5rem,5vw,2.25rem)] font-extrabold tracking-wide text-[#ffd700] tabular-nums drop-shadow-md">
                {formattedTimer}
              </p>
              <div className="h-px w-full bg-white/15" />

              <div className="flex items-center gap-2 text-sm font-semibold sm:text-base">
                <span>{isNightMode ? "🌙" : "☀️"}</span>
                <span>{modeLabel}</span>
              </div>

              {ActionButtons}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="relative z-10 flex w-full max-w-sm flex-col items-center rounded-[2rem] border-[6px] border-[#12131a] px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          style={{ background: screenBg }}
        >
          {TopBar}

          <div className="my-3 h-px w-full bg-white/15" />

          <p className="text-6xl font-black tracking-tight tabular-nums text-white drop-shadow-lg">
            {Math.round(currentSpeed)}
            <span className="ml-1 text-base font-bold opacity-70">MPH</span>
          </p>

          <div className="my-3 h-px w-full bg-white/15" />

          <p className="text-3xl font-extrabold tracking-wide text-[#ffd700] tabular-nums drop-shadow-md">
            {formattedTimer}
          </p>

          <div className="my-3 h-px w-full bg-white/15" />

          <div className="flex items-center gap-2 text-base font-semibold text-white/90">
            <span>{isNightMode ? "🌙" : "☀️"}</span>
            <span>{modeLabel}</span>
          </div>

          <div className="mt-6 w-full">{ActionButtons}</div>
        </div>
      )}
    </div>
  );
}