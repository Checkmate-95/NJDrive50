import { useEffect, useRef } from "react"

interface Props {
  onChange: (value: string) => void
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void
  placeholder?: string
  className?: string
}

type DevImportMeta = ImportMeta & {
  env?: {
    DEV?: boolean
  }
}

type AddressComponentLike = {
  longText?: string
  shortText?: string
  long_name?: string
  short_name?: string
  types?: string[]
}

type PlaceLike = {
  id?: string
  displayName?: string | { text?: string }
  formattedAddress?: string
  addressComponents?: AddressComponentLike[]
  location?: {
    lat: () => number
    lng: () => number
  }
  fetchFields: (request: { fields: string[] }) => Promise<void>
}

type PlacePredictionLike = {
  toPlace?: () => PlaceLike
}

type GmpSelectEventLike = Event & {
  placePrediction?: PlacePredictionLike
}

type PlaceAutocompleteElementLike = HTMLElement & {
  className: string
  addEventListener: (
    type: "gmp-select",
    listener: (event: GmpSelectEventLike) => void
  ) => void
  removeEventListener: (
    type: "gmp-select",
    listener: (event: GmpSelectEventLike) => void
  ) => void
}

type PlaceAutocompleteElementConstructor = new (options?: {
  includedRegionCodes?: string[]
}) => PlaceAutocompleteElementLike

type GoogleMapsPlacesWithAutocomplete = typeof google.maps.places & {
  PlaceAutocompleteElement?: PlaceAutocompleteElementConstructor
}

function isPlaceAutocompleteAvailable(
  places: typeof google.maps.places
): places is GoogleMapsPlacesWithAutocomplete {
  return "PlaceAutocompleteElement" in places
}

export default function AddressAutocomplete({
  onChange,
  onPlaceSelect,
  placeholder,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetRef = useRef<PlaceAutocompleteElementLike | null>(null)
  const onChangeRef = useRef(onChange)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (widgetRef.current) return

    const places = google?.maps?.places

    if (!places || !isPlaceAutocompleteAvailable(places)) {
      if ((import.meta as DevImportMeta).env?.DEV) {
        console.error(
          "[AddressAutocomplete] PlaceAutocompleteElement is unavailable. Check that Maps JavaScript API and Places API (New) are enabled."
        )
      }
      return
    }

    const widget = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["us"],
    })

    if (placeholder) {
      widget.setAttribute("placeholder", placeholder)
    }

    if (className) {
      widget.className = className
    }

    container.innerHTML = ""
    container.appendChild(widget)
    widgetRef.current = widget

    const handleSelect = async (event: GmpSelectEventLike) => {
      try {
        const placePrediction = event.placePrediction
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
          place_id: place.id ?? "",
          formatted_address: formattedAddress,
          name:
            typeof place.displayName === "string"
              ? place.displayName
              : place.displayName?.text ?? "",
          address_components: Array.isArray(place.addressComponents)
            ? place.addressComponents.map((component) => ({
                long_name: component.longText ?? component.long_name ?? "",
                short_name: component.shortText ?? component.short_name ?? "",
                types: component.types ?? [],
              }))
            : [],
          geometry: place.location
            ? {
                location: new google.maps.LatLng(
                  place.location.lat(),
                  place.location.lng()
                ),
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
      container.innerHTML = ""
    }
  }, [className, placeholder])

  return <div ref={containerRef} />
}