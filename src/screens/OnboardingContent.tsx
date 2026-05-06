// src/screens/OnboardingContent.tsx
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { Screen } from "../App"
import BottomPanel from "../components/meters/BottomPanel"
import {
  loadOnboardingData,
  saveOnboardingData,
  type OnboardingData,
} from "../../core/ReminderEngine"

import {
  useTeenPhoto,
  setTeenPhoto as setGlobalTeenPhoto,
} from "../state/profileStore"
import { useMapContext } from "../components/map/MapContext"

type OnboardingContentProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

type ParsedPlaceAddress = {
  street: string
  town: string
  zip: string
  county: string
  state: string
  lat: number | null
  lng: number | null
}

const inputBase =
  "w-full rounded-xl border border-[#0A1E5E]/15 bg-[#F7F9FC] px-4 py-3 text-[#0A1E5E] placeholder:text-[#0A1E5E]/45 shadow-sm outline-none transition focus:border-[#f9c80e] focus:ring-2 focus:ring-[#f9c80e]/40"

const panelInput =
  "w-full rounded-xl border border-[#0A1E5E]/15 bg-[#EEF3F9] px-4 py-3 text-[#0A1E5E] placeholder:text-[#0A1E5E]/45 shadow-sm outline-none transition focus:border-[#f9c80e] focus:ring-2 focus:ring-[#f9c80e]/40"

const disabledInput =
  "w-full rounded-xl border border-[#0A1E5E]/10 bg-[#E6ECF4] px-4 py-3 text-[#0A1E5E]/70 shadow-sm outline-none"

const labelClass = "mb-2 block text-sm font-semibold text-[#0A1E5E]"
const helperClass = "mt-2 text-xs leading-relaxed text-[#0A1E5E]/60"

const actionButtonClass =
  "w-full rounded-xl py-3.5 font-semibold transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_0_18px_rgba(249,200,14,0.28)]"

const editPanelScrollClass =
  "max-h-[78dvh] space-y-4 overflow-y-auto overscroll-contain pb-24 pr-1"

const digitsOnly = (value: string, max: number) =>
  value.replace(/\D/g, "").slice(0, max)

const formatDateInput = (value: string) => {
  const digits = digitsOnly(value, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const formatPhoneInput = (value: string) => {
  const digits = digitsOnly(value, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

const getAddressComponent = (
  components: Array<{
    long_name?: string
    short_name?: string
    types?: string[]
  }> = [],
  type: string,
  format: "long" | "short" = "long"
) => {
  const match = components.find((c) => c.types?.includes(type))
  if (!match) return ""
  return format === "short" ? match.short_name ?? "" : match.long_name ?? ""
}

const parsePlaceResult = (place: any): ParsedPlaceAddress => {
  const components = place?.address_components ?? []

  const streetNumber = getAddressComponent(components, "street_number")
  const route = getAddressComponent(components, "route")
  const locality = getAddressComponent(components, "locality")
  const postalTown = getAddressComponent(components, "postal_town")
  const sublocality = getAddressComponent(components, "sublocality_level_1")
  const adminLevel3 = getAddressComponent(components, "administrative_area_level_3")
  const postalCode = getAddressComponent(components, "postal_code")
  const postalCodeSuffix = getAddressComponent(components, "postal_code_suffix")
  const county = getAddressComponent(components, "administrative_area_level_2")
  const state = getAddressComponent(components, "administrative_area_level_1", "long")

  const street =
    [streetNumber, route].filter(Boolean).join(" ").trim() ||
    place?.formatted_address?.split(",")?.[0]?.trim() ||
    ""

  const town = locality || postalTown || sublocality || adminLevel3 || ""
  const zip = postalCodeSuffix ? `${postalCode}-${postalCodeSuffix}` : postalCode

  const lat =
    typeof place?.geometry?.location?.lat === "function"
      ? place.geometry.location.lat()
      : null

  const lng =
    typeof place?.geometry?.location?.lng === "function"
      ? place.geometry.location.lng()
      : null

  return { street, town, zip, county, state, lat, lng }
}

const emptyResolvedAddress = {
  homeTown: "",
  homeZip: "",
  homeCounty: "",
  homeLat: null as number | null,
  homeLng: null as number | null,
}

export default function OnboardingContent({ setScreen }: OnboardingContentProps) {
  const initialDataRef = useRef<OnboardingData>(loadOnboardingData())
  const saved = initialDataRef.current

  // ── Shared Google Maps loader (MapProvider owns the single load) ──────────
  const { isLoaded } = useMapContext()

  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const addressInputRef = useRef<HTMLInputElement | null>(null)
  const autocompleteRef = useRef<any>(null)
  const autocompleteListenerRef = useRef<any>(null)
  const addressSelectedFromAutocompleteRef = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null) // ← debounce timer



  const globalTeenPhoto = useTeenPhoto()
  const teenPhoto = globalTeenPhoto ?? saved.teenPhoto ?? null

  const [address, setAddress] = useState(saved.address ?? "")
  const [permitNumber, setPermitNumber] = useState(saved.permitNumber ?? "")

  const [homeTown, setHomeTown] = useState(saved.homeTown ?? "")
  const [homeZip, setHomeZip] = useState(saved.homeZip ?? "")
  const [homeCounty, setHomeCounty] = useState(saved.homeCounty ?? "")
  const [homeLat, setHomeLat] = useState<number | null>(saved.homeLat ?? null)
  const [homeLng, setHomeLng] = useState<number | null>(saved.homeLng ?? null)

  const [showTeenPanel, setShowTeenPanel] = useState(false)
  const [showParentPanel, setShowParentPanel] = useState(false)
  const [showPhoneInfo, setShowPhoneInfo] = useState(false)

  const [teenName, setTeenName] = useState(saved.teenName ?? "")
  const [permitIssueDate, setPermitIssueDate] = useState(saved.permitIssueDate ?? "")
  const [stateValue, setStateValue] = useState(saved.state || "New Jersey")

  const [teenBirthday, setTeenBirthday] = useState(saved.teenBirthday ?? "")
  const [teenPhone, setTeenPhone] = useState(saved.teenPhone ?? "")

  const [parentName, setParentName] = useState(saved.parentName ?? "")
  const [parentEmail, setParentEmail] = useState(saved.parentEmail ?? "")
  const [parentPhone, setParentPhone] = useState(saved.parentPhone ?? "")
  const [relationship, setRelationship] = useState(saved.relationship ?? "")

  const latestDataRef = useRef<OnboardingData>(saved)

  useEffect(() => {
    if (!globalTeenPhoto && saved.teenPhoto) {
      setGlobalTeenPhoto(saved.teenPhoto)
    }
  }, [globalTeenPhoto, saved.teenPhoto])

  useEffect(() => {
    latestDataRef.current = {
      teenName, teenBirthday, teenPhone, permitIssueDate,
      state: stateValue, parentName, parentEmail, parentPhone,
      relationship, teenPhoto, address, permitNumber,
      homeTown, homeZip, homeCounty, homeLat, homeLng,
    }
  }, [
    teenName, teenBirthday, teenPhone, permitIssueDate, stateValue,
    parentName, parentEmail, parentPhone, relationship, teenPhoto,
    address, permitNumber, homeTown, homeZip, homeCounty, homeLat, homeLng,
  ])

  const persistOnboarding = (overrides: Partial<OnboardingData> = {}) => {
    const updated: OnboardingData = { ...latestDataRef.current, ...overrides }
    latestDataRef.current = updated
    saveOnboardingData(updated)
  }

  const clearResolvedAddressState = () => {
    setHomeTown("")
    setHomeZip("")
    setHomeCounty("")
    setHomeLat(null)
    setHomeLng(null)
  }

  // ── Attach Autocomplete once isLoaded is true ─────────────────────────────
  useEffect(() => {
    if (!isLoaded || !addressInputRef.current || autocompleteRef.current) return

    const input = addressInputRef.current
    const googleMaps = (window as any)?.google?.maps

    // [GUARD] Prevent silent geolocation errors on Android
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {}, // success ignored
          () => console.warn("[Onboarding] Geolocation permission denied or unavailable.")
        )
      }
    } catch {
      console.warn("[Onboarding] Geolocation API not available.")
    }

    if (!googleMaps?.places?.Autocomplete) return

    const autocomplete = new googleMaps.places.Autocomplete(input, {
      componentRestrictions: { country: "us" },
      types: ["address"],
      fields: ["address_components", "formatted_address", "geometry"],
    })

    autocompleteRef.current = autocomplete

    autocompleteListenerRef.current = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (!place) return

      const parsed = parsePlaceResult(place)
      const nextAddress = parsed.street || place.formatted_address || ""
      const nextState = parsed.state || latestDataRef.current.state || "New Jersey"

      addressSelectedFromAutocompleteRef.current = true

      setAddress(nextAddress)
      setHomeTown(parsed.town)
      setHomeZip(parsed.zip)
      setHomeCounty(parsed.county)
      setHomeLat(parsed.lat)
      setHomeLng(parsed.lng)
      setStateValue(nextState)

      persistOnboarding({
        address: nextAddress,
        homeTown: parsed.town,
        homeZip: parsed.zip,
        homeCounty: parsed.county,
        homeLat: parsed.lat,
        homeLng: parsed.lng,
        state: nextState,
      })
    })

    return () => {
      if (autocompleteListenerRef.current?.remove) {
        autocompleteListenerRef.current.remove()
      }
      if (googleMaps?.event && autocompleteRef.current) {
        googleMaps.event.clearInstanceListeners(autocompleteRef.current)
      }
      autocompleteListenerRef.current = null
      autocompleteRef.current = null
    }
  }, [isLoaded])

  

  const handleTeenPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result === "string") {
        setGlobalTeenPhoto(result)
        persistOnboarding({ teenPhoto: result })
      }
    }
    reader.readAsDataURL(file)
  }

  const teenComplete = Boolean(teenName.trim() && teenBirthday.trim())
  const parentComplete = Boolean(parentName.trim() && relationship.trim())

  const canContinue = Boolean(
    teenName.trim() &&
    teenBirthday.trim() &&
    teenPhone.trim() &&
    parentName.trim() &&
    parentPhone.trim() &&
    relationship.trim() &&
    permitIssueDate.trim() &&
    permitNumber.trim() &&
    address.trim() &&
    homeTown.trim() &&
    homeZip.trim() &&
    homeCounty.trim() &&
    homeLat !== null &&
    homeLng !== null
  )

  const hasAddressResolution = Boolean(
    homeTown || homeZip || homeCounty || homeLat !== null || homeLng !== null
  )

  const handleContinue = () => {
    if (!canContinue) return
    persistOnboarding()
    setScreen("home")
  }

  const handleTeenPanelSave = () => {
    persistOnboarding()
    setShowTeenPanel(false)
  }

  const handleParentPanelSave = () => {
    persistOnboarding()
    setShowParentPanel(false)
  }

  const openPhotoPicker = () => photoInputRef.current?.click()

  const handleAddressManualChange = (value: string) => {
  setAddress(value)
  addressSelectedFromAutocompleteRef.current = false

  // ── Debounced manual typing fix ────────────────────────────────
  if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  typingTimeoutRef.current = setTimeout(() => {
    clearResolvedAddressState()
    persistOnboarding({ address: value, ...emptyResolvedAddress })
  }, 600)
}


  return (
    <div
      className="min-h-[100dvh] w-full overflow-y-auto px-3 pt-4 pb-40 text-white sm:px-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <section className="relative mx-auto w-full min-w-0 max-w-[42rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

        <div className="p-5 pt-6 pb-10 sm:p-6 sm:pt-7 sm:pb-12">
          {/* ── Header Card ── */}
          <div className="rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-inner">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#f9c80e]/90">Driver Setup</p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight">
                  Let&apos;s set up your driving profile
                </h2>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/75">
                  Add the teen driver, parent contact, and permit details so
                  progress tracking and reminders are ready from the start.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">TEEN PROFILE</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">PARENT CONTACT</span>
                  <span className="rounded-full border border-[#f9c80e]/35 bg-[#f9c80e]/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#f9c80e]">NJ PERMIT</span>
                </div>
              </div>

              <div className="shrink-0">
                <input ref={photoInputRef} id="teenPhotoInput" type="file" accept="image/*" className="hidden" onChange={handleTeenPhotoChange} />
                <button type="button" onClick={openPhotoPicker} aria-label="Upload teen photo"
                  className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#f9c80e]/70 bg-white/10 shadow-[0_0_18px_rgba(249,200,14,0.18)] transition duration-200 hover:-translate-y-[1px] hover:bg-white/15 hover:shadow-[0_0_22px_rgba(249,200,14,0.32)]">
                  {teenPhoto ? (
                    <img src={teenPhoto} alt="Teen profile preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="px-2 text-center">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#f9c80e]">Add</span>
                      <span className="block text-[11px] text-white/80">Photo</span>
                    </div>
                  )}
                </button>
                <button type="button" onClick={openPhotoPicker}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-white/85 transition duration-200 hover:-translate-y-[1px] hover:bg-white/15 hover:shadow-[0_0_16px_rgba(249,200,14,0.22)]">
                  Edit
                </button>
              </div>
            </div>
          </div>

          {/* ── Profile Buttons ── */}
          <div className="mt-5 grid gap-3">
            <button type="button" onClick={() => setShowTeenPanel(true)}
              className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-[1px] hover:border-[#0A1E5E]/20 hover:shadow-[0_0_18px_rgba(249,200,14,0.14)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Driver Profile</p>
                  <h3 className="mt-1 text-base font-bold text-[#0A1E5E]">Teen Driver</h3>
                  <p className="mt-1 text-sm text-[#0A1E5E]/72">Add birthday, phone number, and profile details.</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] ${teenComplete ? "border border-green-600/20 bg-green-50 text-green-700" : "border border-[#0A1E5E]/10 bg-white text-[#0A1E5E]/65"}`}>
                  {teenComplete ? "SAVED" : "OPEN"}
                </span>
              </div>
            </button>

            <button type="button" onClick={() => setShowParentPanel(true)}
              className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-[1px] hover:border-[#0A1E5E]/20 hover:shadow-[0_0_18px_rgba(249,200,14,0.14)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">Contact Setup</p>
                  <h3 className="mt-1 text-base font-bold text-[#0A1E5E]">Parent / Guardian</h3>
                  <p className="mt-1 text-sm text-[#0A1E5E]/72">Add the adult contact who helps supervise and track progress.</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] ${parentComplete ? "border border-green-600/20 bg-green-50 text-green-700" : "border border-[#0A1E5E]/10 bg-white text-[#0A1E5E]/65"}`}>
                  {parentComplete ? "SAVED" : "OPEN"}
                </span>
              </div>
            </button>
          </div>

          {/* ── Permit Details ── */}
          <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4 shadow-inner">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#0A1E5E]/55">Permit Details</p>
              <h3 className="mt-1 text-lg font-bold text-[#0A1E5E]">Core setup</h3>
              <p className="mt-1 text-sm text-[#0A1E5E]/68">These details are used for reminders, countdowns, and milestone timing.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Teen&apos;s Name</label>
                <input type="text" placeholder="Enter teen driver name" value={teenName}
                  onChange={(e) => setTeenName(e.target.value)} className={inputBase} />
              </div>

              <div>
                <label className={labelClass}>Permit Issue Date</label>
                <input type="tel" inputMode="numeric" autoComplete="off" placeholder="mm/dd/yyyy"
                  value={permitIssueDate} onChange={(e) => setPermitIssueDate(formatDateInput(e.target.value))} className={panelInput} />
                <p className={helperClass}>Use the permit issue date so milestone timing stays accurate.</p>
              </div>

              <div>
                <label className={labelClass}>State</label>
                <input type="text" placeholder="New Jersey" value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)} className={panelInput} />
              </div>

              <div>
                <label className={labelClass}>Permit Number</label>
                <input type="text" placeholder="Ex: P123-456-789-000" value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)} className={panelInput} />
              </div>

              <div>
                <label className={labelClass}>Home Address</label>
                <input
                  ref={addressInputRef}
                  type="text"
                  autoComplete="off"
                  placeholder={isLoaded ? "123 Main St" : "Loading address search..."}
                  value={address}
                  onChange={(e) => handleAddressManualChange(e.target.value)}
                  className={panelInput}
                />
                <p className={helperClass}>
                  {isLoaded
                    ? "Start typing and select a suggested address to auto-fill town, ZIP, county, and coordinates."
                    : "Address search is loading…"}
                </p>
              </div>

              {hasAddressResolution && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Town</label>
                    <input type="text" value={homeTown} disabled className={disabledInput} />
                  </div>
                  <div>
                    <label className={labelClass}>ZIP</label>
                    <input type="text" value={homeZip} disabled className={disabledInput} />
                  </div>
                  <div>
                    <label className={labelClass}>County</label>
                    <input type="text" value={homeCounty} disabled className={disabledInput} />
                  </div>
                  <div>
                    <label className={labelClass}>Latitude / Longitude</label>
                    <input type="text"
                      value={homeLat !== null && homeLng !== null ? `${homeLat.toFixed(6)}, ${homeLng.toFixed(6)}` : ""}
                      disabled className={disabledInput} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Continue ── */}
          <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 pb-6 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">Ready Check</p>
                <h3 className="mt-1 text-lg font-bold">Finish onboarding</h3>
                <p className="mt-1 text-sm text-white/72">Save this setup and move into the dashboard.</p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                {canContinue ? "READY" : "INCOMPLETE"}
              </div>
            </div>
            <button type="button" onClick={handleContinue} disabled={!canContinue}
              className={`mt-4 w-full rounded-xl py-3.5 font-bold transition duration-200 ${canContinue
                ? "bg-[#f9c80e] text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] hover:-translate-y-[1px] hover:brightness-105 hover:shadow-[0_0_22px_rgba(249,200,14,0.38)]"
                : "cursor-not-allowed bg-white/15 text-white/45"}`}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* ── Teen Panel ── */}
      <BottomPanel open={showTeenPanel} onClose={() => setShowTeenPanel(false)}>
        <div className={editPanelScrollClass} style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">Driver Profile</p>
            <h2 className="mt-1 text-xl font-bold">Teen Driver Info</h2>
            <p className="mt-1 text-sm text-white/72">Add the details used throughout the driving log and reminder flow.</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
            <div>
              <label className={labelClass}>Teen Name</label>
              <input type="text" placeholder="Teen Name" value={teenName} onChange={(e) => setTeenName(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Birthday</label>
              <input type="tel" inputMode="numeric" autoComplete="bday" placeholder="mm/dd/yyyy" value={teenBirthday}
                onChange={(e) => setTeenBirthday(formatDateInput(e.target.value))} className={inputBase} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass + " mb-0"}>Teen Phone Number</label>
                <button type="button" onClick={() => setShowPhoneInfo(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0A1E5E]/15 bg-white text-sm font-bold text-[#0A1E5E] transition duration-200 hover:shadow-[0_0_14px_rgba(249,200,14,0.24)]"
                  aria-label="Why we ask for phone numbers">i</button>
              </div>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-5555" value={teenPhone}
                onChange={(e) => setTeenPhone(formatPhoneInput(e.target.value))} className={inputBase} />
              <p className={helperClass}>Used only for helpful reminders and progress-related notifications.</p>
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input type="text" value={stateValue} disabled className={disabledInput} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
            <button type="button" className={`${actionButtonClass} bg-[#0A1E5E] text-white`} onClick={handleTeenPanelSave}>Save Teen Info</button>
          </div>
        </div>
      </BottomPanel>

      {/* ── Parent Panel ── */}
      <BottomPanel open={showParentPanel} onClose={() => setShowParentPanel(false)}>
        <div className={editPanelScrollClass} style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">Contact Setup</p>
            <h2 className="mt-1 text-xl font-bold">Parent / Guardian Info</h2>
            <p className="mt-1 text-sm text-white/72">Add the adult contact who helps monitor permit progress.</p>
          </div>
          <div className="space-y-4 rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
            <div>
              <label className={labelClass}>Parent Name</label>
              <input type="text" placeholder="Parent Name" value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" placeholder="Email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={inputBase} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className={labelClass + " mb-0"}>Parent Phone Number</label>
                <button type="button" onClick={() => setShowPhoneInfo(true)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0A1E5E]/15 bg-white text-sm font-bold text-[#0A1E5E] transition duration-200 hover:shadow-[0_0_14px_rgba(249,200,14,0.24)]"
                  aria-label="Why we ask for phone numbers">i</button>
              </div>
              <input type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-5555" value={parentPhone}
                onChange={(e) => setParentPhone(formatPhoneInput(e.target.value))} className={inputBase} />
            </div>
            <div>
              <label className={labelClass}>Relationship</label>
              <input type="text" placeholder="Mother, Father, Guardian" value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputBase} />
            </div>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
            <button type="button" className={`${actionButtonClass} bg-[#0A1E5E] text-white`} onClick={handleParentPanelSave}>Save Parent Info</button>
          </div>
        </div>
      </BottomPanel>

      {/* ── Phone Info Panel ── */}
      <BottomPanel open={showPhoneInfo} onClose={() => setShowPhoneInfo(false)}>
        <div className="space-y-4 pb-10">
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">Privacy Note</p>
            <h2 className="mt-1 text-xl font-bold">Why We Ask</h2>
            <p className="mt-1 text-sm text-white/72">We only use this information for helpful app reminders.</p>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
            <p className="leading-relaxed text-[#0A1E5E]/82">
              We use your phone number only for helpful reminders, such as permit deadlines,
              driving-hour progress, and road-test countdowns. Your number is never shared or sold.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
            <button type="button" className={`${actionButtonClass} bg-[#0A1E5E] text-white`} onClick={() => setShowPhoneInfo(false)}>Got it</button>
          </div>
        </div>
      </BottomPanel>
    </div>
  )
}