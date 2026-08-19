import { useMemo } from "react";

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox.js";

const GENDER_OPTIONS: { code: string; label: string }[] = [
  { code: "", label: "Unknown" },
  { code: "male", label: "Male" },
  { code: "female", label: "Female" },
];

const GENDER_LABELS: string[] = GENDER_OPTIONS.map((g) => g.label);
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.code, g.label])
);
const CODE_BY_LABEL: Record<string, string> = Object.fromEntries(
  GENDER_OPTIONS.map((g) => [g.label, g.code])
);

export function GenderComboboxField({
  label,
  value,
  onChange,
}: {
  label: string;
  // "" means "Unknown" (persisted as null); non-empty stored as-is.
  value: string;
  onChange: (v: string) => void;
}) {
  // Show the canonical label if we know the code; otherwise show the raw
  // value (legacy/unmapped) and prepend it as a selectable item.
  const currentLabel = LABEL_BY_CODE[value] ?? value;

  const items = useMemo(() => {
    if (value && !(value in LABEL_BY_CODE)) {
      return [value, ...GENDER_LABELS];
    }
    return GENDER_LABELS;
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Combobox
        items={items}
        value={currentLabel}
        onValueChange={(v: string | null) => {
          if (!v) {
            onChange("");
            return;
          }
          onChange(CODE_BY_LABEL[v] ?? v);
        }}
      >
        <ComboboxInput placeholder="Select gender" />
        <ComboboxContent>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList className="max-h-48">
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
