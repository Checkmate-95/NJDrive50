import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder,
  className
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    if (autoRef.current) return; // prevents re-initializing

    autoRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "address_components", "geometry"],
      types: ["address"]
    });

    autoRef.current.addListener("place_changed", () => {
      const place = autoRef.current?.getPlace();

      // Update the text field
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }

      // Send full place object to parent — ONLY if it exists
      if (place && onPlaceSelect) {
        onPlaceSelect(place);
      }
    });
  }, []);

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
  );
}
