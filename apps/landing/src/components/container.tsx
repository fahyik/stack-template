import { type ComponentPropsWithoutRef } from "react";

import { cn } from "@repo/ui/lib/utils";

export function Container({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-330 px-10 max-[600px]:px-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
