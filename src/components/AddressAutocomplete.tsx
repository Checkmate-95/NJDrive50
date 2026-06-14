import { useEffect, useRef } from "react"

interface Props {
  onChange: (value: string) => void
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  onChange,
  onPlaceSelect,
  placeholder,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetRef = useRef<any>(null)
  const onChangeRef = useRef(onChange)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    if (!containerRef.current) return
    if (widgetRef.current) return
    if (!google?.maps?.places?.PlaceAutocompleteElement) {
      if (import.meta.env.DEV) {
        console.error(
          "[AddressAutocomplete] PlaceAutocompleteElement is unavailable. Check that Maps JavaScript API and Places API (New) are enabled."
        )
      }
      return
    }

    const widget = new (google.maps.places as any).PlaceAutocompleteElement({
      includedRegionCodes: ["us"],
    })

    if (placeholder) {
      widget.setAttribute("placeholder", placeholder)
    }

    if (className) {
      widget.className = className
    }

    containerRef.current.innerHTML = ""
    containerRef.current.appendChild(widget)
    widgetRef.current = widget

    const handleSelect = async (event: any) => {
      try {
        const placePrediction = event?.placePrediction
        if (!placePrediction?.toPlace) return

        const place = placePrediction.toPlace()

        await place.fetchFields({
          fields: [
            "id",
            "displayName",
            "formattedAddress",
            "addressComponents",
            "location",
          ],
        })

        const formattedAddress = place.formattedAddress ?? ""

        if (formattedAddress) {
          onChangeRef.current(formattedAddress)
        }

        const mappedPlace: google.maps.places.PlaceResult = {
          place_id: place.id,
          name: place.displayName,
          formatted_address: place.formattedAddress,
          address_components: place.addressComponents as any,
          geometry: place.location
            ? {
                location: place.location,
              }
            : undefined,
        }

        onPlaceSelectRef.current?.(mappedPlace)
      } catch (error) {
        console.error(
          "[AddressAutocomplete] Failed to fetch place details:",
          error
        )
      }
    }

    widget.addEventListener("gmp-select", handleSelect)

    return () => {
      widget.removeEventListener("gmp-select", handleSelect)
      widgetRef.current = null

      if (containerRef.current) {
        containerRef.current.innerHTML = ""
      }
    }
  }, [className, placeholder])

  return <div ref={containerRef} />
}