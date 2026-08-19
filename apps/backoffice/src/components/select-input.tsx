import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

// Label-less single-select control over the shared @repo/ui Select
// primitive. Parallels Input/Textarea — wrap it in a <label>/Field for the
// label. Radix reserves the empty string, so callers that model an "All"/
// "none" option must use a sentinel value (e.g. "__all__") rather than "".
export function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem
            key={o.value}
            value={o.value}
            disabled={o.disabled}
            className="py-2"
          >
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
