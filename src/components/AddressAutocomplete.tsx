import { useEffect, useRef } from "react"

interface Props {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const autoRef = useRef<any>(null) // TS-safe wrapper
  const onChangeRef = useRef(onChange)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    if (!inputRef.current) return
    if (autoRef.current) return

    // ⭐ NEW API — wrapped in `any` because TS types are outdated
    const autocomplete = new (google.maps.places as any).PlaceAutocompleteElement({
      inputElement: inputRef.current,
      fields: [
        "formatted_address",
        "address_components",
        "geometry",
        "name",
        "place_id",
      ],
    })

    autoRef.current = autocomplete

    const handler = () => {
      const place = (autocomplete as any).getPlace()
      if (!place) return

      if (place.formatted_address) {
        onChangeRef.current(place.formatted_address)
      }

      onPlaceSelectRef.current?.(place)
    }

    autocomplete.addEventListener("place_changed", handler)

    return () => {
      autocomplete.removeEventListener("place_changed", handler)
      autoRef.current = null
    }
  }, [])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="street-address"
      autoCorrect="off"
      autoCapitalize="words"
      spellCheck={false}
      enterKeyHint="done"
      className={className}
    />
  )
}
