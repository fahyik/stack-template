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

// BCP-47 codes. Mirrors PREFERRED_LANGUAGE_CODES in @repo/interfaces —
// keep these in lockstep when adding/removing a language. The validation
// schema in the api enforces enum membership.
const SUPPORTED_LANGUAGES: { code: string; label: string }[] = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "fr-FR", label: "French (France)" },
  { code: "fr-CA", label: "French (Canada)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "es-MX", label: "Spanish (Mexico)" },
  { code: "es-419", label: "Spanish (Latin America)" },
  { code: "zh-CN", label: "Mandarin Chinese" },
  { code: "bn-BD", label: "Bengali" },
];

const LANGUAGE_LABELS: string[] = SUPPORTED_LANGUAGES.map((l) => l.label);
const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.label])
);
const CODE_BY_LABEL: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.label, l.code])
);

export function LanguageComboboxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Show the canonical label if we know the code; otherwise show the raw
  // value (legacy "english", "en-us", etc.) and prepend it as a selectable
  // item so the combobox isn't empty.
  const currentLabel = LABEL_BY_CODE[value] ?? value;

  const items = useMemo(() => {
    if (value && !(value in LABEL_BY_CODE)) {
      return [value, ...LANGUAGE_LABELS];
    }
    return LANGUAGE_LABELS;
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Combobox
        items={items}
        value={currentLabel || null}
        onValueChange={(v: string | null) => {
          if (!v) {
            onChange("");
            return;
          }
          onChange(CODE_BY_LABEL[v] ?? v);
        }}
      >
        <ComboboxInput placeholder="Search language…" />
        <ComboboxContent>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList className="max-h-72">
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
