import { type ComponentPropsWithoutRef } from "react";

import { useReveal } from "../hooks/use-reveal.ts";

import { cn } from "@repo/ui/lib/utils";

export function Reveal({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-spring",
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
