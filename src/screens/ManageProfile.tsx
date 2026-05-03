// src/screens/ManageProfile.tsx
// TRUST-CORRECTED VERSION
// [FIX-1]  Navigation uses useNav().goBack() and useNav().setScreen()
// [FIX-2]  handleSave writes to BOTH profileStore AND OnboardingData via saveOnboardingData()
// [FIX-3]  teenAge and carYear stored as numbers per the corrected Profile type
// [FIX-4]  Validation guard before save — blank teenName is rejected with inline error
// [FIX-5]  useEffect sync removed — local form state initializes once from storedProfile
// [FIX-6]  carYear input constrained with min/max
// [FIX-7]  All labels linked to inputs via htmlFor/id
// [FIX-8]  setProfile() return value checked — QuotaExceededError surfaces as user-visible error
// [FIX-9]  React import removed — project uses React 17+ JSX transform

import { useState } from "react"
import { useNav } from "../state/navStore"
import { useProfile, setProfile, type Profile } from "../state/profileStore"
import {
  loadOnboardingData,
  saveOnboardingData,
} from "../../core/ReminderEngine"

export default function ManageProfile() {
  const { goBack, setScreen } = useNav()
  const storedProfile = useProfile()

  // [FIX-5] Initialize once on mount — no useEffect sync wipe risk
  const [teenName,   setTeenName]   = useState(storedProfile.teenName   ?? "")
  const [parentName, setParentName] = useState(storedProfile.parentName ?? "")

  // [FIX-3] Numeric fields kept as strings during editing, parsed at save time
  const [teenAge,  setTeenAge]  = useState<string>(
    storedProfile.teenAge  != null ? String(storedProfile.teenAge)  : ""
  )
  const [carMake,  setCarMake]  = useState(storedProfile.carMake  ?? "")
  const [carModel, setCarModel] = useState(storedProfile.carModel ?? "")
  const [carYear,  setCarYear]  = useState<string>(
    storedProfile.carYear  != null ? String(storedProfile.carYear)  : ""
  )

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saved,  setSaved]  = useState(false)

  // [FIX-4] Validate before save
  const validate = (): boolean => {
    const next: Record<string, string> = {}

    if (!teenName.trim()) {
      next.teenName = "Teen name is required. Reminders depend on this field."
    }

    const ageNum = Number(teenAge)
    if (teenAge !== "" && (!Number.isFinite(ageNum) || ageNum < 14 || ageNum > 21)) {
      next.teenAge = "Teen age must be between 14 and 21."
    }

    const yearNum = Number(carYear)
    const maxYear = new Date().getFullYear() + 1
    if (carYear !== "" && (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > maxYear)) {
      next.carYear = `Car year must be between 1900 and ${maxYear}.`
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    // [FIX-3] Empty string → null, never NaN
    const ageNum  = teenAge  !== "" ? Number(teenAge)  : null
    const yearNum = carYear  !== "" ? Number(carYear)  : null

    const profile: Profile = {
      teenName:   teenName.trim(),
      parentName: parentName.trim(),
      teenAge:    ageNum,
      carMake:    carMake.trim(),
      carModel:   carModel.trim(),
      carYear:    yearNum,
    }

    // [FIX-8] setProfile returns false on QuotaExceededError
    const profileSaved = setProfile(profile)
    if (!profileSaved) {
      setErrors({
        form: "Profile could not be saved — device storage may be full. Try clearing app data and retrying.",
      })
      return
    }

    // [FIX-2] Sync to OnboardingData — saveOnboardingData() returns void,
    // so no return value check. Dev warning uses try/catch instead.
    try {
      const onboarding = loadOnboardingData()
      saveOnboardingData({
        ...onboarding,
        teenName:   profile.teenName,
        parentName: profile.parentName.length > 0
          ? profile.parentName
          : (onboarding?.parentName ?? ""),
      })
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          "[ManageProfile] OnboardingData sync failed — " +
          "ReminderEngine may use stale data until next app launch.",
          err
        )
      }
    }

    setSaved(true)

    // [FIX-1] Navigate to settings after brief confirmation flash
    setTimeout(() => setScreen("settings"), 800)
  }

  const currentYear = new Date().getFullYear()

  return (
    <main className="min-h-screen bg-white text-[#08194A] flex flex-col items-center p-6 relative">

      {/* [FIX-1] Close — pops history stack back to wherever the user came from */}
      <button
        type="button"
        onClick={() => goBack("settings")}
        className="absolute top-4 right-4 text-[#08194A] text-3xl font-bold hover:text-[#f9c80e] transition"
        aria-label="Close Profile Editor"
      >
        ×
      </button>

      <h1 className="text-3xl font-extrabold mt-10 tracking-tight">
        Manage Profile
      </h1>
      <p className="text-sm text-[#08194A]/70 mt-1 mb-6">
        Update your NJDrive50 profile information
      </p>

      {/* Success banner */}
      {saved && (
        <div className="w-full max-w-md mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-semibold text-green-800">
          ✓ Profile saved successfully
        </div>
      )}

      {/* [FIX-8] Storage error banner */}
      {errors.form && (
        <div className="w-full max-w-md mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
          {errors.form}
        </div>
      )}

      <div className="w-full max-w-md space-y-6">

        {/* Teen Info */}
        <section className="rounded-2xl border border-[#08194A]/15 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-5">
          <h2 className="text-lg font-bold mb-4">Teen Information</h2>
          <div className="space-y-4">

            {/* [FIX-7] htmlFor + id on every label/input */}
            <div>
              <label htmlFor="teenName" className="text-sm font-semibold">
                Teen Name <span className="text-red-500">*</span>
              </label>
              <input
                id="teenName"
                type="text"
                value={teenName}
                onChange={(e) => {
                  setTeenName(e.target.value)
                  if (errors.teenName) setErrors((p) => ({ ...p, teenName: "" }))
                }}
                className={`mt-1 w-full rounded-xl border p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e] ${
                  errors.teenName ? "border-red-400" : "border-[#08194A]/20"
                }`}
              />
              {errors.teenName && (
                <p className="mt-1 text-xs text-red-600">{errors.teenName}</p>
              )}
            </div>

            <div>
              <label htmlFor="teenAge" className="text-sm font-semibold">
                Teen Age
              </label>
              {/* [FIX-6] min/max constrain input */}
              <input
                id="teenAge"
                type="number"
                min={14}
                max={21}
                value={teenAge}
                onChange={(e) => {
                  setTeenAge(e.target.value)
                  if (errors.teenAge) setErrors((p) => ({ ...p, teenAge: "" }))
                }}
                className={`mt-1 w-full rounded-xl border p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e] ${
                  errors.teenAge ? "border-red-400" : "border-[#08194A]/20"
                }`}
              />
              {errors.teenAge && (
                <p className="mt-1 text-xs text-red-600">{errors.teenAge}</p>
              )}
            </div>

            <div>
              <label htmlFor="parentName" className="text-sm font-semibold">
                Parent Name
              </label>
              <input
                id="parentName"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#08194A]/20 p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e]"
              />
            </div>

          </div>
        </section>

        {/* Vehicle Info */}
        <section className="rounded-2xl border border-[#08194A]/15 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] p-5">
          <h2 className="text-lg font-bold mb-4">Vehicle Information</h2>
          <div className="space-y-4">

            <div>
              <label htmlFor="carMake" className="text-sm font-semibold">
                Car Make
              </label>
              <input
                id="carMake"
                type="text"
                value={carMake}
                onChange={(e) => setCarMake(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#08194A]/20 p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e]"
              />
            </div>

            <div>
              <label htmlFor="carModel" className="text-sm font-semibold">
                Car Model
              </label>
              <input
                id="carModel"
                type="text"
                value={carModel}
                onChange={(e) => setCarModel(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#08194A]/20 p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e]"
              />
            </div>

            <div>
              <label htmlFor="carYear" className="text-sm font-semibold">
                Car Year
              </label>
              {/* [FIX-6] max is currentYear + 1 — next model year is valid */}
              <input
                id="carYear"
                type="number"
                min={1900}
                max={currentYear + 1}
                value={carYear}
                onChange={(e) => {
                  setCarYear(e.target.value)
                  if (errors.carYear) setErrors((p) => ({ ...p, carYear: "" }))
                }}
                className={`mt-1 w-full rounded-xl border p-3 bg-[#F7F9FC] focus:outline-none focus:ring-2 focus:ring-[#f9c80e] ${
                  errors.carYear ? "border-red-400" : "border-[#08194A]/20"
                }`}
              />
              {errors.carYear && (
                <p className="mt-1 text-xs text-red-600">{errors.carYear}</p>
              )}
            </div>

          </div>
        </section>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saved}
          className="w-full bg-[#08194A] text-white py-3 rounded-xl font-semibold shadow-[0_14px_28px_rgba(8,25,74,0.22)] hover:bg-[#0A1E5E] transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saved ? "Saved ✓" : "Save Profile"}
        </button>

      </div>
    </main>
  )
}