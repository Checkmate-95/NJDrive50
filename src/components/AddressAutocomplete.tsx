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
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null)
  const listenerRef = useRef<google.maps.MapsEventListener | null>(null)
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

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      fields: [
        "formatted_address",
        "address_components",
        "geometry",
        "name",
        "place_id",
      ],
      types: ["address"],
    })

    autoRef.current = autocomplete

    listenerRef.current = autocomplete.addListener("place_changed", () => {
      window.setTimeout(() => {
        const place = autoRef.current?.getPlace()
        if (!place) return

        if (place.formatted_address) {
          onChangeRef.current(place.formatted_address)
        }

        onPlaceSelectRef.current?.(place)
      }, 200)
    })

    return () => {
      listenerRef.current?.remove()
      listenerRef.current = null
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