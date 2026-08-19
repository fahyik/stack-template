import type { ReactNode } from "react";

import { usePhoneInput } from "../hooks/use-phone-input.js";
import { CountryCodeSelect } from "./country-code-select.js";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./ui/input-group.js";

export function PhoneInputGroup({
  id,
  value,
  onChange,
  invalid,
  placeholder,
  ariaLabel,
  className,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  // Optional trailing addon — e.g. a submit button rendered inside the group.
  children?: ReactNode;
}) {
  const phone = usePhoneInput({
    value,
    onChange: (v) => onChange(v ?? ""),
  });

  return (
    <InputGroup className={className}>
      <InputGroupAddon align="inline-start">
        <CountryCodeSelect
          value={phone.country.code}
          onChange={phone.handleCountryChange}
        />
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        type="tel"
        inputMode="numeric"
        placeholder={placeholder ?? "555 123 4567"}
        aria-label={ariaLabel}
        value={phone.internalValue}
        onChange={(e) => phone.handleInputChange(e.target.value)}
        aria-invalid={invalid ? true : undefined}
      />
      {children ? (
        <InputGroupAddon align="inline-end">{children}</InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
