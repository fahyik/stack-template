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

const TIMEZONE_OPTIONS: string[] = Intl.supportedValuesOf("timeZone");

// Computed once at module load; the displayed offsets reflect the current
// DST state at load time. For a dropdown this is fine — users pick once and
// move on, and a reload corrects any stale labels around a DST transition.
const NOW = new Date();

function computeUtcOffsetLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(NOW);
    const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    if (!name || name === "GMT") {
      return "UTC";
    }
    return name.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}

const LABEL_BY_ZONE: Record<string, string> = Object.fromEntries(
  TIMEZONE_OPTIONS.map((tz) => [tz, `${tz} (${computeUtcOffsetLabel(tz)})`])
);
const ZONE_BY_LABEL: Record<string, string> = Object.fromEntries(
  TIMEZONE_OPTIONS.map((tz) => [LABEL_BY_ZONE[tz], tz])
);
const TIMEZONE_LABELS: string[] = TIMEZONE_OPTIONS.map(
  (tz) => LABEL_BY_ZONE[tz]
);

function matchesTimezoneQuery(value: string, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return value.toLowerCase().includes(q);
}

export function TimezoneComboboxField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Display label for the current value. Known IANA zones get
  // "Zone (UTC+X)"; unknown/legacy values pass through raw so the
  // combobox isn't empty.
  const currentLabel = LABEL_BY_ZONE[value] ?? value;

  const items = useMemo(() => {
    if (value && !LABEL_BY_ZONE[value]) {
      return [value, ...TIMEZONE_LABELS];
    }
    return TIMEZONE_LABELS;
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Combobox
        items={items}
        filter={matchesTimezoneQuery}
        value={currentLabel || null}
        onValueChange={(v: string | null) => {
          if (!v) {
            onChange("");
            return;
          }
          onChange(ZONE_BY_LABEL[v] ?? v);
        }}
      >
        <ComboboxInput placeholder="Search timezone…" />
        <ComboboxContent>
          <ComboboxEmpty>No matches.</ComboboxEmpty>
          <ComboboxList className="max-h-72">
            <ComboboxCollection>
              {(tz: string) => (
                <ComboboxItem key={tz} value={tz}>
                  {tz}
                </ComboboxItem>
              )}
            </ComboboxCollection>
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
