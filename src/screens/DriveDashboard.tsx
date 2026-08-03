import { useEffect, useState } from "react";

interface DriveDashboardProps {
  formattedTimer: string;
  isNightMode: boolean;
  onMinimize: () => void;
  currentSpeed?: number;
}

export default function DriveDashboard({
  formattedTimer,
  isNightMode,
  onMinimize,
  currentSpeed = 0,
}: DriveDashboardProps) {
  const [isLandscape, setIsLandscape] = useState(
    typeof window !== "undefined" ? window.innerWidth > window.innerHeight : false
  );

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

  return (
    <div className="relative w-full max-w-[46rem] mx-auto text-white">
      <button
        onClick={onMinimize}
        className="absolute top-4 right-4 z-50 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white backdrop-blur-md"
      >
        Minimize
      </button>

      {isLandscape ? (
        <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
          <img
            src={isNightMode ? "/dashboard_night.png" : "/dashboard_day.png"}
            className="h-full w-full object-contain select-none"
            alt="Dashboard"
          />

          <p className="absolute top-[32%] left-1/2 -translate-x-1/2 text-5xl font-black text-white drop-shadow-lg">
            {currentSpeed}
          </p>

          <p className="absolute top-[46%] left-1/2 -translate-x-1/2 text-3xl font-bold text-[#ffd700] drop-shadow-lg">
            {formattedTimer}
          </p>

          <p className="absolute top-[58%] left-1/2 -translate-x-1/2 text-lg font-semibold text-white drop-shadow-md">
            {isNightMode ? "Night Driving" : "Day Driving"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-10">
          <p className="text-6xl font-black tracking-tight">{currentSpeed}</p>
          <p className="mt-3 text-3xl font-bold text-[#ffd700]">
            {formattedTimer}
          </p>
          <p className="mt-2 text-lg opacity-80">
            {isNightMode ? "Night Driving" : "Day Driving"}
          </p>

          <p className="mt-6 text-sm text-white/60">
            Rotate your device for full dashboard →
          </p>
        </div>
      )}
    </div>
  );
}