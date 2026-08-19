import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { type CountryCode } from "libphonenumber-js";
import { useMemo } from "react";

import {
  type CountryData,
  DEFAULT_COUNTRY as DEFAULT_COUNTRY_FROM_LIB,
  countries,
} from "../lib/phone.js";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "./ui/combobox.js";

export const DEFAULT_COUNTRY: CountryCode = DEFAULT_COUNTRY_FROM_LIB;

// Convert ISO 3166-1 alpha-2 code (e.g. "US") to a flag emoji ("🇺🇸") by mapping
// each letter to its regional-indicator code point (U+1F1E6 + offset from "A").
function flagFromCode(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}

export function CountryCodeSelect({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
}) {
  const sorted = useMemo<CountryData[]>(
    () => Object.values(countries).sort((a, b) => a.name.localeCompare(b.name)),
    []
  );
  const selected = sorted.find((c) => c.code === value) ?? null;

  return (
    <Combobox
      items={sorted}
      itemToStringLabel={(c: CountryData) => c.name}
      itemToStringValue={(c: CountryData) => c.code}
      value={selected}
      onValueChange={(c: CountryData | null) => {
        if (c) {
          onChange(c.code);
        }
      }}
    >
      <ComboboxTrigger
        aria-label="Country dial code"
        className="flex cursor-pointer items-center gap-1 border-none bg-transparent py-3 pr-2 pl-3 text-sm whitespace-nowrap outline-none"
      >
        {selected ? (
          <div className="flex items-center gap-1">
            <span className="-mb-0.5">{flagFromCode(selected.code)}</span>
            <span>{selected.callingCode}</span>
          </div>
        ) : null}
      </ComboboxTrigger>
      <ComboboxContent className="min-w-[18rem]">
        <ComboboxPrimitive.Input
          placeholder="Search countries"
          className="m-1 mb-0 block w-[calc(100%-0.5rem)] rounded-md border border-input/30 bg-input/30 px-2 py-1.5 text-sm outline-none focus:border-ring"
        />
        <ComboboxEmpty>No matches.</ComboboxEmpty>
        <ComboboxList className="max-h-72">
          <ComboboxCollection>
            {(c: CountryData) => (
              <ComboboxItem key={c.code} value={c}>
                <span className="mr-2">{flagFromCode(c.code)}</span>
                <span className="line-clamp-1">{c.name}</span>
                <span className="text-muted-foreground">{c.callingCode}</span>
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
