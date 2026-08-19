import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@repo/ui/lib/utils";

export function Eyebrow({
  className,
  children,
  pulse = false,
  ping = false,
  ...props
}: ComponentPropsWithoutRef<"span"> & { pulse?: boolean; ping?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-border bg-white/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="relative flex size-2">
        {!pulse && ping && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full brand-bg opacity-75"></span>
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full brand-bg",
            pulse && !ping && "animate-pulse"
          )}
        ></span>
      </span>

      {children}
    </span>
  );
}
