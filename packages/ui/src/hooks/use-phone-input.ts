import type { CountryCode, PhoneNumber } from "libphonenumber-js";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { useState } from "react";

import {
  type CountryData,
  DEFAULT_COUNTRY,
  countries,
  getCountryByLanguage,
  getCountryByNumber,
  parsePhoneInput,
} from "../lib/phone.js";

interface UsePhoneInputArgs {
  value: string;
  onChange: (value?: string) => void;
  // Region code or BCP-47 locale ("US", "en-US"). Used only when an incoming
  // value can't itself imply a country.
  defaultCountry?: string;
}

// Pick the country implied by a parsed number, falling back to its raw country
// code if the number is incomplete/invalid but still has a region hint.
function resolveCountry(
  parsed: PhoneNumber | undefined
): CountryData | undefined {
  if (!parsed) {
    return undefined;
  }
  if (parsed.isValid()) {
    const detected = getCountryByNumber(parsed);
    if (detected) {
      return detected;
    }
  }
  return parsed.country ? countries[parsed.country] : undefined;
}

// Format if the parse is valid, OR if the user typed a "+" prefix and a country
// was identified — both are explicit international-intent signals. We must NOT
// format plain national input that happens to be parseable, otherwise typing
// "11" with US selected gets reinterpreted as country-code 1 + national "11"
// and emitted as "+111".
function shouldFormat(args: {
  input: string;
  parsed: PhoneNumber | undefined;
}): boolean {
  const { input, parsed } = args;
  if (!parsed) {
    return false;
  }
  if (parsed.isValid()) {
    return true;
  }
  return input.startsWith("+") && parsed.country !== undefined;
}

function formatInitial(value: string): string {
  if (!value) {
    return "";
  }
  const parsed = parsePhoneNumberFromString(value);
  return parsed?.isValid() ? parsed.formatNational() : value;
}

function initialCountry(args: {
  value: string;
  defaultCountry: string | undefined;
}): CountryData {
  const { value, defaultCountry } = args;
  if (value) {
    const parsed = parsePhoneNumberFromString(value);
    const fromNumber = parsed?.isValid()
      ? getCountryByNumber(parsed)
      : undefined;
    if (fromNumber) {
      return fromNumber;
    }
  }
  return getCountryByLanguage(defaultCountry ?? DEFAULT_COUNTRY);
}

export function usePhoneInput(args: UsePhoneInputArgs) {
  const { value, onChange, defaultCountry } = args;

  const [isDirty, setIsDirty] = useState(false);
  const [internalValue, setInternalValue] = useState(() =>
    formatInitial(value)
  );
  const [country, setCountry] = useState<CountryData>(() =>
    initialCountry({ value, defaultCountry })
  );

  // React-recommended pattern: derive state from a changing prop *during render*
  // rather than in useEffect. Avoids the extra render cycle a sync effect causes.
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== internalValue) {
      const parsed = parsePhoneInput({
        input: value,
        fallbackCountry: country.code,
      });
      setInternalValue(
        shouldFormat({ input: value, parsed })
          ? parsed!.formatNational()
          : value
      );
      const nextCountry = resolveCountry(parsed);
      if (nextCountry && nextCountry.code !== country.code) {
        setCountry(nextCountry);
      }
    }
  }

  const handleInputChange = (next: string) => {
    const parsed = parsePhoneInput({
      input: next,
      fallbackCountry: country.code,
    });
    setIsDirty(true);
    if (shouldFormat({ input: next, parsed })) {
      setInternalValue(parsed!.formatNational());
      // Only emit E.164 when the number is actually valid; partial international
      // input goes through as the raw "+..." string.
      onChange(parsed!.isValid() ? parsed!.format("E.164") : next);
    } else {
      setInternalValue(next);
      onChange(next);
    }
    const nextCountry = resolveCountry(parsed);
    if (nextCountry && nextCountry.code !== country.code) {
      setCountry(nextCountry);
    }
  };

  const handleCountryChange = (code: CountryCode) => {
    const next = countries[code];
    setCountry(next);
    const parsed = parsePhoneInput({
      input: internalValue,
      fallbackCountry: next.code,
    });
    if (shouldFormat({ input: internalValue, parsed })) {
      setIsDirty(true);
      setInternalValue(parsed!.formatNational());
      onChange(parsed!.isValid() ? parsed!.format("E.164") : internalValue);
    }
  };

  const isValid =
    parsePhoneInput({
      input: internalValue,
      fallbackCountry: country.code,
    })?.isValid() ?? false;

  return {
    internalValue,
    country,
    isDirty,
    isValid,
    handleInputChange,
    handleCountryChange,
  };
}
