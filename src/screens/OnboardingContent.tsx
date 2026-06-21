import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { Screen } from "../App"
import BottomPanel from "../components/meters/BottomPanel"
import PhotoCropModal from "../components/PhotoCropModal"
import {
  loadOnboardingData,
  saveOnboardingData,
  type OnboardingData,
} from "../../core/ReminderEngine"

import {
  useTeenPhoto,
  setTeenPhoto as setGlobalTeenPhoto,
  getProfile,
  setProfile,
} from "../state/profileStore"
import { useMapContext } from "../components/map/MapContext"
import AddressAutocomplete from "../components/AddressAutocomplete"

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

// ─── TeenPanelContent ────────────────────────────────────────────────────────
// Isolated component with local draft state. Keystrokes stay inside this
// component and never re-render the parent, which was causing focus to jump
// back to the first input on every character typed.

type TeenPanelContentProps = {
  initialName: string
  initialBirthday: string
  initialPhone: string
  stateValue: string
  onSave: (data: { name: string; birthday: string; phone: string }) => void
  onShowPhoneInfo: () => void
}

const TeenPanelContent = memo(function TeenPanelContent({
  initialName,
  initialBirthday,
  initialPhone,
  stateValue,
  onSave,
  onShowPhoneInfo,
}: TeenPanelContentProps) {
  const [name, setName] = useState(initialName)
  const [birthday, setBirthday] = useState(initialBirthday)
  const [phone, setPhone] = useState(initialPhone)

  return (
    <div
      className="max-h-[80vh] overflow-y-auto p-6"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
          Driver Profile
        </p>
        <h2 className="mt-1 text-xl font-bold">Teen Driver Info</h2>
        <p className="mt-1 text-sm text-white/72">
          Add the details used throughout the driving log and reminder flow.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
        <div>
          <label className={labelClass}>Teen Name</label>
          <input
            type="text"
            placeholder="Teen Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
          />
        </div>

        <div>
          <label className={labelClass}>Birthday</label>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="bday"
            placeholder="mm/dd/yyyy"
            value={birthday}
            onChange={(e) => setBirthday(formatDateInput(e.target.value))}
            className={inputBase}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass + " mb-0"}>Teen Phone Number</label>
            <button
              type="button"
              onClick={onShowPhoneInfo}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0A1E5E]/15 bg-white text-sm font-bold text-[#0A1E5E] transition duration-200 hover:shadow-[0_0_14px_rgba(249,200,14,0.24)]"
              aria-label="Why we ask for phone numbers"
            >
              i
            </button>
          </div>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-5555"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className={inputBase}
          />
          <p className={helperClass}>
            Used only for helpful reminders and progress-related notifications.
          </p>
        </div>

        <div>
          <label className={labelClass}>State</label>
          <input type="text" value={stateValue} disabled className={disabledInput} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
        <button
          type="button"
          className={`${actionButtonClass} bg-[#0A1E5E] text-white`}
          onClick={() => onSave({ name, birthday, phone })}
        >
          Save Teen Info
        </button>
      </div>
    </div>
  )
})

// ─── ParentPanelContent ──────────────────────────────────────────────────────

type ParentPanelContentProps = {
  initialName: string
  initialEmail: string
  initialPhone: string
  initialRelationship: string
  onSave: (data: {
    name: string
    email: string
    phone: string
    relationship: string
  }) => void
  onShowPhoneInfo: () => void
}

const ParentPanelContent = memo(function ParentPanelContent({
  initialName,
  initialEmail,
  initialPhone,
  initialRelationship,
  onSave,
  onShowPhoneInfo,
}: ParentPanelContentProps) {
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [phone, setPhone] = useState(initialPhone)
  const [rel, setRel] = useState(initialRelationship)

  return (
    <div
      className="max-h-[80vh] overflow-y-auto p-6"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
          Contact Setup
        </p>
        <h2 className="mt-1 text-xl font-bold">Parent / Guardian Info</h2>
        <p className="mt-1 text-sm text-white/72">
          Add the adult contact who helps monitor permit progress.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
        <div>
          <label className={labelClass}>Parent Name</label>
          <input
            type="text"
            placeholder="Parent Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
          />
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputBase}
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className={labelClass + " mb-0"}>Parent Phone Number</label>
            <button
              type="button"
              onClick={onShowPhoneInfo}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[#0A1E5E]/15 bg-white text-sm font-bold text-[#0A1E5E] transition duration-200 hover:shadow-[0_0_14px_rgba(249,200,14,0.24)]"
              aria-label="Why we ask for phone numbers"
            >
              i
            </button>
          </div>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-5555"
            value={phone}
            onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
            className={inputBase}
          />
        </div>

        <div>
          <label className={labelClass}>Relationship</label>
          <input
            type="text"
            placeholder="Mother, Father, Guardian"
            value={rel}
            onChange={(e) => setRel(e.target.value)}
            className={inputBase}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
        <button
          type="button"
          className={`${actionButtonClass} bg-[#0A1E5E] text-white`}
          onClick={() => onSave({ name, email, phone, relationship: rel })}
        >
          Save Parent Info
        </button>
      </div>
    </div>
  )
})

// ─── OnboardingContent ───────────────────────────────────────────────────────

export default function OnboardingContent({ setScreen }: OnboardingContentProps) {
  const [saved, setSaved] = useState<OnboardingData>(() => loadOnboardingData())


  const { isLoaded } = useMapContext()

  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const addressSelectedFromAutocompleteRef = useRef(false)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const globalTeenPhoto = useTeenPhoto()
  const teenPhoto = globalTeenPhoto ?? saved.teenPhoto ?? null

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  const [address, setAddress] = useState(saved.address ?? "")
  const [permitNumber, setPermitNumber] = useState(saved.permitNumber ?? "")

  const [homeTown, setHomeTown] = useState(saved.homeTown ?? "")
  const [homeZip, setHomeZip] = useState(saved.homeZip ?? "")
  const [homeCounty, setHomeCounty] = useState(saved.homeCounty ?? "")
  const [homeLat, setHomeLat] = useState<number | null>(saved.homeLat ?? null)
  const [homeLng, setHomeLng] = useState<number | null>(saved.homeLng ?? null)
  const hasAddressResolution = Boolean(
    homeTown || homeZip || homeCounty || homeLat !== null || homeLng !== null
  )

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
      teenName,
      teenBirthday,
      teenPhone,
      permitIssueDate,
      state: stateValue,
      parentName,
      parentEmail,
      parentPhone,
      relationship,
      teenPhoto,
      address,
      permitNumber,
      homeTown,
      homeZip,
      homeCounty,
      homeLat,
      homeLng,
    }
  }, [
    teenName,
    teenBirthday,
    teenPhone,
    permitIssueDate,
    stateValue,
    parentName,
    parentEmail,
    parentPhone,
    relationship,
    teenPhoto,
    address,
    permitNumber,
    homeTown,
    homeZip,
    homeCounty,
    homeLat,
    homeLng,
  ])

  const persistOnboarding = (overrides: Partial<OnboardingData> = {}) => {
  const updated = { ...latestDataRef.current, ...overrides }
  latestDataRef.current = updated
  setSaved(updated) // <-- NEW
  saveOnboardingData(updated)
}


  const clearResolvedAddressState = () => {
    setHomeTown("")
    setHomeZip("")
    setHomeCounty("")
    setHomeLat(null)
    setHomeLng(null)
  }

  const handleAddressSelect = (place: google.maps.places.PlaceResult) => {
    if (!place) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

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
  }

  const handleAddressManualChange = (value: string) => {
    setAddress(value)

    if (addressSelectedFromAutocompleteRef.current) {
      addressSelectedFromAutocompleteRef.current = false
      persistOnboarding({ address: value })
      return
    }

    persistOnboarding({ address: value })

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      clearResolvedAddressState()
      persistOnboarding({ ...emptyResolvedAddress })
      typingTimeoutRef.current = null
    }, 600)
  }

   useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleTeenPhotoChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Capture ref before async FileReader so value clear happens after state set
      const inputEl = e.target

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result
        if (typeof result === "string") {
          setCropImageSrc(result)
        }
        // Clear AFTER setting state — avoids Android WebView race
        inputEl.value = ""
      }
      reader.onerror = () => {
        inputEl.value = ""
      }
      reader.readAsDataURL(file)
    },
    []
  )

  const handleTeenPhotoCropSave = useCallback(
    (croppedDataUrl: string) => {
      setGlobalTeenPhoto(croppedDataUrl)
      persistOnboarding({ teenPhoto: croppedDataUrl })
      setCropImageSrc(null)
    },
    // persistOnboarding always reads latestDataRef — no closure dep needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const handleRemoveTeenPhoto = useCallback(() => {
    setGlobalTeenPhoto("")
    persistOnboarding({ teenPhoto: "" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

const handleContinue = async () => {
  if (!canContinue) return
  persistOnboarding()

  // ⭐ Mark user as onboarded so startupController routes to Home on next launch
  setProfile({
    ...getProfile(),
    teenName: teenName.trim(),
    isOnboarded: true,
    profileComplete: true,
  })

  setScreen("home")
}

  const openPhotoPicker = () => {
    photoInputRef.current?.click()
  }

  // ── Stable panel callbacks ────────────────────────────────────────────────
  const handleClearCrop = useCallback(() => setCropImageSrc(null), [])
  const handleShowTeenPanel = useCallback(() => setShowTeenPanel(true), [])
  const handleShowParentPanel = useCallback(() => setShowParentPanel(true), [])
  const handleTeenPanelClose = useCallback(() => setShowTeenPanel(false), [])
  const handleParentPanelClose = useCallback(() => setShowParentPanel(false), [])
  const handlePhoneInfoClose = useCallback(() => setShowPhoneInfo(false), [])
  const handleShowPhoneInfo = useCallback(() => setShowPhoneInfo(true), [])

  // ── Flush local draft from TeenPanelContent into parent state + persist ───
  const handleTeenPanelSave = useCallback(
    (data: { name: string; birthday: string; phone: string }) => {
      setTeenName(data.name)
      setTeenBirthday(data.birthday)
      setTeenPhone(data.phone)
      persistOnboarding({
        teenName: data.name,
        teenBirthday: data.birthday,
        teenPhone: data.phone,
      })
      setShowTeenPanel(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // ── Flush local draft from ParentPanelContent into parent state + persist ─
  const handleParentPanelSave = useCallback(
    (data: { name: string; email: string; phone: string; relationship: string }) => {
      setParentName(data.name)
      setParentEmail(data.email)
      setParentPhone(data.phone)
      setRelationship(data.relationship)
      persistOnboarding({
        parentName: data.name,
        parentEmail: data.email,
        parentPhone: data.phone,
        relationship: data.relationship,
      })
      setShowParentPanel(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <div
      className="min-h-[100dvh] w-full overflow-hidden px-3 pb-40 pt-4 text-white sm:px-4"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {cropImageSrc && (
        <PhotoCropModal
          imageSrc={cropImageSrc}
          onCancel={handleClearCrop}
          onSave={handleTeenPhotoCropSave}
        />
      )}

      <section className="relative mx-auto w-full min-w-0 max-w-[42rem] overflow-hidden rounded-[28px] border border-white/15 bg-[#F8FAFD] shadow-[0_20px_55px_rgba(0,0,0,0.18)]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#f9c80e] via-white/80 to-[#0A1E5E]" />

        <div className="p-5 pb-10 pt-6 sm:p-6 sm:pb-12 sm:pt-7">
          <div className="rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white shadow-inner">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#f9c80e]/90">
                  Driver Setup
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight">
                  Let&apos;s set up your driving profile
                </h2>
                <p className="mt-2 max-w-[26ch] text-sm leading-relaxed text-white/75">
                  Add the teen driver, parent contact, and permit details so
                  progress tracking and reminders are ready from the start.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">
                    TEEN PROFILE
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-white/85">
                    PARENT CONTACT
                  </span>
                  <span className="rounded-full border border-[#f9c80e]/35 bg-[#f9c80e]/10 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-[#f9c80e]">
                    NJ PERMIT
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <input
                  ref={photoInputRef}
                  id="teenPhotoInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleTeenPhotoChange}
                />

                <button
                  type="button"
                  onClick={openPhotoPicker}
                  aria-label="Upload teen photo"
                  className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-[#f9c80e]/70 bg-white/10 shadow-[0_0_18px_rgba(249,200,14,0.18)] transition duration-200 hover:-translate-y-[1px] hover:bg-white/15 hover:shadow-[0_0_22px_rgba(249,200,14,0.32)]"
                >
                  {teenPhoto ? (
                    <img
                      src={teenPhoto}
                      alt="Teen profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="px-2 text-center">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-[#f9c80e]">
                        Add
                      </span>
                      <span className="block text-[11px] text-white/80">Photo</span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openPhotoPicker}
                  className="mt-2 w-full rounded-lg border border-white/15 bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-white/85 transition duration-200 hover:-translate-y-[1px] hover:bg-white/15 hover:shadow-[0_0_16px_rgba(249,200,14,0.22)]"
                >
                  {teenPhoto ? "Edit" : "Upload"}
                </button>

                {teenPhoto && (
                  <button
                    type="button"
                    onClick={handleRemoveTeenPhoto}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[11px] font-semibold text-white/70 transition duration-200 hover:bg-white/10 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={handleShowTeenPanel}
              className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-[1px] hover:border-[#0A1E5E]/20 hover:shadow-[0_0_18px_rgba(249,200,14,0.14)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Driver Profile
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#0A1E5E]">
                    Teen Driver
                  </h3>
                  <p className="mt-1 text-sm text-[#0A1E5E]/72">
                    Add birthday, phone number, and profile details.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] ${
                    teenComplete
                      ? "border border-green-600/20 bg-green-50 text-green-700"
                      : "border border-[#0A1E5E]/10 bg-white text-[#0A1E5E]/65"
                  }`}
                >
                  {teenComplete ? "SAVED" : "OPEN"}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleShowParentPanel}
              className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-4 text-left shadow-sm transition duration-200 hover:-translate-y-[1px] hover:border-[#0A1E5E]/20 hover:shadow-[0_0_18px_rgba(249,200,14,0.14)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#0A1E5E]/55">
                    Contact Setup
                  </p>
                  <h3 className="mt-1 text-base font-bold text-[#0A1E5E]">
                    Parent / Guardian
                  </h3>
                  <p className="mt-1 text-sm text-[#0A1E5E]/72">
                    Add the adult contact who helps supervise and track progress.
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] ${
                    parentComplete
                      ? "border border-green-600/20 bg-green-50 text-green-700"
                      : "border border-[#0A1E5E]/10 bg-white text-[#0A1E5E]/65"
                  }`}
                >
                  {parentComplete ? "SAVED" : "OPEN"}
                </span>
              </div>
            </button>
          </div>

          <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4 shadow-inner">
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#0A1E5E]/55">
                Permit Details
              </p>
              <h3 className="mt-1 text-lg font-bold text-[#0A1E5E]">Core setup</h3>
              <p className="mt-1 text-sm text-[#0A1E5E]/68">
                These details are used for reminders, countdowns, and milestone timing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>Teen&apos;s Name</label>
                <input
                  type="text"
                  placeholder="Enter teen driver name"
                  value={teenName}
                  onChange={(e) => setTeenName(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div>
                <label className={labelClass}>Permit Issue Date</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="mm/dd/yyyy"
                  value={permitIssueDate}
                  onChange={(e) => setPermitIssueDate(formatDateInput(e.target.value))}
                  className={panelInput}
                />
                <p className={helperClass}>
                  Use the permit issue date so milestone timing stays accurate.
                </p>
              </div>

              <div>
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  placeholder="New Jersey"
                  value={stateValue}
                  onChange={(e) => setStateValue(e.target.value)}
                  className={panelInput}
                />
              </div>

              <div>
  <label className={labelClass}>Permit Number</label>
  <input
    type="text"
    placeholder="Ex: P123-456-789-000"
    value={permitNumber}
    onChange={(e) => setPermitNumber(e.target.value)}
    className={panelInput}
  />
</div>

<div>
  <label className={labelClass} htmlFor="homeAddress">
    Home Address
  </label>

  <div className="rounded-xl border border-[#0A1E5E]/15 bg-white p-1 shadow-sm transition focus-within:border-[#f9c80e] focus-within:ring-2 focus-within:ring-[#f9c80e]/40">
    <div className="rounded-[14px] bg-white px-2 py-1">
      <AddressAutocomplete
        onChange={handleAddressManualChange}
        onPlaceSelect={handleAddressSelect}
        placeholder="Enter address"
      />
    </div>
  </div>

  <p id="homeAddressHelp" className={helperClass}>
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
                    <input
                      type="text"
                      value={
                        homeLat !== null && homeLng !== null
                          ? `${homeLat.toFixed(6)}, ${homeLng.toFixed(6)}`
                          : ""
                      }
                      disabled
                      className={disabledInput}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

                    <div className="mt-5 rounded-[24px] border border-[#0A1E5E]/10 bg-[#08194A] p-4 pb-6 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)]">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
                  Ready Check
                </p>
                <h3 className="mt-1 text-lg font-bold">Finish onboarding</h3>
                <p className="mt-1 text-sm text-white/72">
                  Save this setup and move into the dashboard.
                </p>
              </div>

              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white/85">
                {canContinue ? "READY" : "INCOMPLETE"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`mt-4 w-full rounded-xl py-3.5 font-bold transition duration-200 ${
                canContinue
                  ? "bg-[#f9c80e] text-[#08194A] shadow-[0_12px_26px_rgba(249,200,14,0.22)] hover:-translate-y-[1px] hover:brightness-105 hover:shadow-[0_0_22px_rgba(249,200,14,0.38)]"
                  : "cursor-not-allowed bg-white/15 text-white/45"
              }`}
            >
              Continue to Dashboard
            </button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4">
              <button
                type="button"
                onClick={() => setScreen("privacy")}
                className="flex w-full items-center justify-between py-3 text-sm text-white/70 transition hover:text-white"
              >
                <span>Privacy Policy</span>
                <span className="text-white/30">›</span>
              </button>

              <div className="h-px w-full bg-white/10" />

              <button
                type="button"
                onClick={() => setScreen("terms")}
                className="flex w-full items-center justify-between py-3 text-sm text-white/70 transition hover:text-white"
              >
                <span>Terms of Use</span>
                <span className="text-white/30">›</span>
              </button>
            </div>
          </div>
          </div>
      </section>

      {/* ── Teen Panel ──────────────────────────────────────────────────────── */}
      <BottomPanel
        open={showTeenPanel}
        onClose={handleTeenPanelClose}
        title="Teen Driver Info"
      >
        <TeenPanelContent
          initialName={teenName}
          initialBirthday={teenBirthday}
          initialPhone={teenPhone}
          stateValue={stateValue}
          onSave={handleTeenPanelSave}
          onShowPhoneInfo={handleShowPhoneInfo}
        />
      </BottomPanel>

      {/* ── Parent Panel ─────────────────────────────────────────────────────── */}
      <BottomPanel
        open={showParentPanel}
        onClose={handleParentPanelClose}
        title="Parent / Guardian Info"
      >
        <ParentPanelContent
          initialName={parentName}
          initialEmail={parentEmail}
          initialPhone={parentPhone}
          initialRelationship={relationship}
          onSave={handleParentPanelSave}
          onShowPhoneInfo={handleShowPhoneInfo}
        />
      </BottomPanel>

      {/* ── Phone Info Panel ─────────────────────────────────────────────────── */}
      <BottomPanel
        open={showPhoneInfo}
        onClose={handlePhoneInfoClose}
        title="Why We Ask"
      >
        <div className="space-y-4 pb-10">
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#08194A] p-4 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
              Privacy Note
            </p>
            <h2 className="mt-1 text-xl font-bold">Why We Ask</h2>
            <p className="mt-1 text-sm text-white/72">
              We only use this information for helpful app reminders.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#EEF2F8] p-4">
            <p className="leading-relaxed text-[#0A1E5E]/82">
              We use your phone number only for helpful reminders, such as permit
              deadlines, driving-hour progress, and road-test countdowns. Your number
              is never shared or sold.
            </p>
          </div>
          <div className="rounded-2xl border border-[#0A1E5E]/10 bg-[#F4F6FA] p-3">
            <button
              type="button"
              className={`${actionButtonClass} bg-[#0A1E5E] text-white`}
              onClick={handlePhoneInfoClose}
            >
              Got it
            </button>
          </div>
        </div>
      </BottomPanel>
    </div>
  )
}