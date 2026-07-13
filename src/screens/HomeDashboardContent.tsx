// src/screens/HomeDashboardContent.tsx
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { Geolocation } from "@capacitor/geolocation"
import type { Screen } from "../App"
import { useDriveHistory } from "../state/driveStore"
import { loadOnboardingData } from "../../core/ReminderEngine"
import { navigate } from "../navigation/navMap"
import { useActiveDriveStore } from "../state/activeDriveStore"
import { Capacitor } from '@capacitor/core'


type HomeDashboardContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

function safeNumber(val: unknown): number {
  const num = Number(val)
  return Number.isFinite(num) ? num : 0
}

function formatElapsed(ms: number = 0) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const isNonNullButton = (
  el: HTMLButtonElement | null
): el is HTMLButtonElement => el !== null

export default function HomeDashboardContent({
  setScreen,
  setLocationPermissionGranted,   // ⭐ NEW
}: HomeDashboardContentProps & {
  setLocationPermissionGranted: (v: boolean) => void
}) {

  const [startingDrive, setStartingDrive] = useState(false)
  const [showLocationDisclosure, setShowLocationDisclosure] = useState(false)

  const allowButtonRef = useRef<HTMLButtonElement | null>(null)
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)

  const drives = useDriveHistory() ?? []
  const activeSession = useActiveDriveStore((s) => s.session)
  const hasActiveDrive = Boolean(activeSession?.isActive)

  const [activeDurationSeconds, setActiveDurationSeconds] = useState(() =>
    useActiveDriveStore.getState().getElapsedSeconds()
  )

  useEffect(() => {
    setActiveDurationSeconds(useActiveDriveStore.getState().getElapsedSeconds())

    if (!hasActiveDrive) return

    const interval = window.setInterval(() => {
      setActiveDurationSeconds(useActiveDriveStore.getState().getElapsedSeconds())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [hasActiveDrive, activeSession?.isRunning])

  useEffect(() => {
  if (!showLocationDisclosure) return;

  // Save the element that had focus before the modal opened
  lastFocusedElementRef.current = document.activeElement as HTMLElement | null;

  // Focus the Allow button on next frame
  const frame = window.requestAnimationFrame(() => {
    allowButtonRef.current?.focus();
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    // ⭐ Do NOT close the modal here — only close it from button handlers
    if (event.key === "Escape") {
      event.preventDefault();
      return; // keep modal open so Android permission dialog doesn't break JS
    }

    if (event.key !== "Tab") return;

    const focusable = [
      cancelButtonRef.current,
      allowButtonRef.current,
    ].filter(isNonNullButton);

    const first = focusable.at(0);
    const last = focusable.at(-1);

    if (!first || !last) return;

    const active = document.activeElement;
    const activeIsTrackedElement =
      active instanceof HTMLButtonElement && focusable.includes(active);

    if (event.shiftKey) {
      if (active === first || !activeIsTrackedElement) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !activeIsTrackedElement) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  document.addEventListener("keydown", handleKeyDown);

  return () => {
    window.cancelAnimationFrame(frame);
    document.removeEventListener("keydown", handleKeyDown);
    lastFocusedElementRef.current?.focus?.();
  };
}, [showLocationDisclosure]);


  const onboarding = useMemo(() => loadOnboardingData(), [])

  const totalRequired = 50
  const nightRequired = 10

  const totalHours = useMemo(
    () => drives.reduce((sum, d) => sum + safeNumber(d.totalDurationHours), 0),
    [drives]
  )

  const nightHours = useMemo(
    () =>
      drives.reduce((sum, d) => {
        const verified = safeNumber(d.verifiedNightDurationHours)
        const estimated = safeNumber(d.nightDurationHours)
        return sum + (verified > 0 ? verified : estimated)
      }, 0),
    [drives]
  )

  const totalMiles = useMemo(
    () => drives.reduce((sum, d) => sum + safeNumber(d.miles), 0),
    [drives]
  )

  const totalPercent = Math.min((totalHours / totalRequired) * 100, 100)
  const nightPercent = Math.min((nightHours / nightRequired) * 100, 100)
  const totalRemaining = Math.max(totalRequired - totalHours, 0)
  const nightRemaining = Math.max(nightRequired - nightHours, 0)

  const lastDrive = useMemo(() => {
    if (!drives.length) return null
    return [...drives].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    )[0]
  }, [drives])

  const lastDriveDuration = useMemo(() => {
    if (!lastDrive) return ""
    const hours = safeNumber(lastDrive.totalDurationHours)
    const totalMins = Math.round(hours * 60)
    const h = Math.floor(totalMins / 60)
    const m = totalMins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }, [lastDrive])

  const lastDriveMode = useMemo(() => {
    if (!lastDrive) return ""
    const night =
      safeNumber(lastDrive.verifiedNightDurationHours) ||
      safeNumber(lastDrive.nightDurationHours)
    const total = safeNumber(lastDrive.totalDurationHours)
    if (total === 0) return "Day"
    const nightRatio = night / total
    if (nightRatio >= 0.5) return "Night"
    if (nightRatio > 0) return "Mixed"
    return "Day"
  }, [lastDrive])

  const lastDriveStart = useMemo(() => {
    if (!lastDrive) return ""
    return new Date(lastDrive.startTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [lastDrive])

  const lastDriveEnd = useMemo(() => {
    if (!lastDrive) return ""
    return new Date(lastDrive.endTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }, [lastDrive])

  const driveActionState = hasActiveDrive
    ? activeSession?.isRunning
      ? "ACTIVE"
      : "PAUSED"
    : "READY"

  const driveActionLabel = startingDrive
    ? "Starting..."
    : hasActiveDrive
      ? activeSession?.isRunning
        ? "Return to Active Drive"
        : "Resume Paused Drive"
      : "Start a New Drive"

  const hasLocationPermission = async () => {
  try {
    const result = await Geolocation.checkPermissions()

    return (
      result.location === "granted" ||
      result.coarseLocation === "granted"
    )
  } catch (err) {
    console.error("Location permission query failed:", err)
    return false
  }
}

  // --- BeginDrive: only resumes existing drives ---
const beginDrive = async () => {
  setStartingDrive(true);
  try {
    // ✅ No need to get activeDriveStore here anymore
    setScreen("activeDrive"); // navigate only
  } finally {
    setStartingDrive(false);
  }
};


  const handleStartDrive = async () => {
  if (startingDrive) return

  const permissionGranted = await hasLocationPermission()

  if (permissionGranted) {
    setLocationPermissionGranted(true)
    await beginDrive()
    return
  }

  // Not granted: show the disclosure first.
  setShowLocationDisclosure(true)
}



const handleAllowAndContinue = async () => {
  try {
    setShowLocationDisclosure(false)

    if (!Capacitor.isNativePlatform()) {
      // 🌐 Browser fallback
      navigator.geolocation.getCurrentPosition(
        position => {
          console.log("Web position:", position.coords)
          setLocationPermissionGranted(true)
          beginDrive()
        },
        error => {
          console.error("Web geolocation error:", error)
          setLocationPermissionGranted(false)
        }
      )
      return
    }

    // 📱 Native (Android/iOS)
const perm = await Geolocation.requestPermissions({
  permissions: ["location"],
})

const permissionGranted =
  perm.location === "granted" ||
  perm.coarseLocation === "granted"

if (permissionGranted) {
  setLocationPermissionGranted(true)
  await beginDrive()
} else {
  console.warn("Location permission denied")
  setLocationPermissionGranted(false)
}
} catch (err) {
  console.error("Location permission error:", err)
  setLocationPermissionGranted(false)
}
}

  return (
    <>
      {showLocationDisclosure && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 p-4 backdrop-blur-sm">
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-disclosure-title"
        aria-describedby="location-disclosure-description"
        className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl bg-white p-5 text-slate-800 shadow-xl sm:p-6"
      >
        <h2 id="location-disclosure-title" className="mb-3 text-xl font-bold">
          Why NJDrive50 Needs Your Location
        </h2>

        <p
          id="location-disclosure-description"
          className="mb-6 text-sm leading-6 text-slate-600"
        >
          NJDrive50 uses location while you record an active drive to capture the
          route, distance, start time, and end time for your supervised-driving log.
          <br />
          <br />
          Location is used only while an active drive is running, and you can stop
          recording at any time. For best accuracy, keep NJDrive50 open during your
          drive.
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className="min-h-[44px] w-full rounded-lg bg-slate-200 px-4 py-2 text-slate-700 sm:w-auto"
            onClick={() => setShowLocationDisclosure(false)}
          >
            Not Now
          </button>

          <button
            ref={allowButtonRef}
            type="button"
            className="min-h-[44px] w-full rounded-lg bg-blue-600 px-4 py-2 text-white sm:w-auto"
            onClick={handleAllowAndContinue}
          >
            Allow & Continue
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      <div className="flex w-full justify-center px-3 pb-28 pt-4 text-[#0A1E5E] sm:px-4">
        <section className="relative w-full max-w-[46rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

          <div className="mx-auto w-full max-w-[42rem] p-4 pt-6 sm:p-6 sm:pt-7">
            {hasActiveDrive && (
              <button
                type="button"
                onClick={() => setScreen("active")}
                className={`mb-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-semibold text-white shadow-md transition-all hover:brightness-110 ${
                  activeSession?.isRunning
                    ? "animate-[pulseGreen_2s_infinite] border border-[#00C851]/40 bg-[#00C851] shadow-[0_4px_12px_rgba(0,200,81,0.35)]"
                    : "animate-[pulseRed_2s_infinite] border border-[#D93025]/40 bg-[#D93025] shadow-[0_4px_12px_rgba(217,48,37,0.35)]"
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  🚗
                </span>
                <span>
                  {activeSession?.isRunning
                    ? `Drive Active — ${formatElapsed(activeDurationSeconds * 1000)}`
                    : `Drive Paused — ${formatElapsed(activeDurationSeconds * 1000)} (Tap to resume)`}
                </span>
              </button>
            )}

            <div className="mt-5 grid grid-cols-2 items-stretch gap-3 sm:gap-4">
              <div className="flex h-full min-h-[210px] flex-col justify-between rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-center shadow-sm sm:min-h-[240px]">
                <div className="flex h-[40px] flex-col items-center justify-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Total
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Hours
                  </p>
                </div>

                <p className="flex items-end justify-center text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
                  {totalHours.toFixed(1)}
                  <span className="text-lg font-semibold text-[#0A1E5E]/65">
                    {" "}
                    / {totalRequired}
                  </span>
                </p>

                <p className="text-sm leading-snug text-[#0A1E5E]/68">
                  {totalRemaining.toFixed(1)} Hours Remaining
                </p>

                <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
                  <div
                    className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
                    style={{ width: `${totalPercent}%` }}
                  />
                </div>

                <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
                  LOGGED
                </div>
              </div>

              <div className="flex h-full min-h-[210px] flex-col justify-between rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4 text-center shadow-sm sm:min-h-[240px]">
                <div className="flex h-[40px] flex-col items-center justify-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Night
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Hours
                  </p>
                </div>

                <p className="flex items-end justify-center text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
                  {nightHours.toFixed(1)}
                  <span className="text-lg font-semibold text-[#0A1E5E]/65">
                    {" "}
                    / {nightRequired}
                  </span>
                </p>

                <p className="text-sm leading-snug text-[#0A1E5E]/68">
                  {nightRemaining.toFixed(1)} Hours Remaining
                </p>

                <div className="h-3 w-full overflow-hidden rounded-full bg-[#0A1E5E]/10">
                  <div
                    className="h-full rounded-full bg-[#f9c80e] transition-all duration-300 ease-out"
                    style={{ width: `${nightPercent}%` }}
                  />
                </div>

                <div className="inline-flex h-[24px] min-w-[70px] items-center justify-center rounded-full border border-[#0A1E5E]/10 bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
                  NIGHT
                </div>
              </div>

              <div className="col-span-2 flex items-center justify-between rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] px-4 py-2 shadow-sm">
                <div className="flex flex-col leading-tight">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Total Miles
                  </p>
                  <p className="text-xs text-[#0A1E5E]/60">Across all drives</p>
                </div>

                <p className="flex items-end text-3xl font-extrabold leading-none tracking-tight text-[#0A1E5E]">
                  {totalMiles.toFixed(1)}
                  <span className="ml-1 text-lg font-semibold text-[#0A1E5E]/65">
                    mi
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#0A1E5E]/55">
                    Last Drive
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-[#0A1E5E] sm:text-xl">
                    {lastDrive
                      ? `${lastDriveDuration} • ${lastDriveMode}`
                      : "No drives logged yet"}
                  </h3>

                  <p className="mt-1 max-w-[36rem] text-sm leading-relaxed text-[#0A1E5E]/68">
                    {lastDrive
                      ? `Started: ${lastDriveStart} • Ended: ${lastDriveEnd}`
                      : "Start your first drive to begin tracking progress."}
                  </p>
                </div>

                <div className="w-fit rounded-full border border-[#0A1E5E]/10 bg-white px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-[#0A1E5E]/70">
                  {lastDrive ? "RECENT" : "NONE"}
                </div>
              </div>

              <div className="mt-4">
  <button
  type="button"
  onClick={() => navigate("home", "history", setScreen)}
  className="w-full rounded-xl border border-[#0A1E5E]/15 bg-[#0A1E5E] px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-[1px] hover:brightness-110 hover:shadow-[0_0_16px_rgba(249,200,14,0.25)]"
>
  View History
</button>

</div>

            </div>

            <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)] sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
                    Drive Control
                  </p>
                  <h3 className="mt-1 text-lg font-bold sm:text-xl">
                    {hasActiveDrive
                      ? `Continue ${onboarding.teenName?.trim() || "Teen"}'s current drive`
                      : "Start a new drive"}
                  </h3>
                  <p className="mt-1 max-w-[34rem] text-sm leading-relaxed text-white/72">
                    {hasActiveDrive
                      ? "A drive session is already in progress. Return to it instead of resetting progress."
                      : "Begin timing and detect day or night conditions for this session."}
                  </p>
                </div>

                <div className="w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                  {driveActionState}
                </div>
              </div>

              <div className="mx-auto mt-4 w-full max-w-[28rem]">
                <button
                  type="button"
                  onClick={handleStartDrive}
                  disabled={startingDrive}
                  className={`block w-full rounded-xl py-3.5 text-base font-bold transition duration-200 ${
                    startingDrive
                      ? "cursor-not-allowed bg-white/15 text-white/45"
                      : "bg-[#f9c80e] text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] hover:-translate-y-[1px] hover:brightness-105 hover:shadow-[0_0_22px_rgba(249,200,14,0.38)]"
                  }`}
                >
                  {driveActionLabel}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}