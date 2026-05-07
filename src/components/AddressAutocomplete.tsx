import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string; // <-- add this
}


export default function AddressAutocomplete({ value, onChange, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    if (autoRef.current) return;

    autoRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      fields: ["formatted_address", "address_components", "geometry"],
      types: ["address"],
    });

    autoRef.current.addListener("place_changed", () => {
      const place = autoRef.current?.getPlace();
      if (place?.formatted_address) {
        onChange(place.formatted_address);
      }
    });
  }, []);

  // ⭐ THIS is where your return goes — INSIDE the component
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
