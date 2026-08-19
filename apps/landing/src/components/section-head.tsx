import { type ReactNode } from "react";

import { Reveal } from "./reveal.tsx";

export function SectionHead({
  num,
  title,
  lead,
}: {
  num: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <Reveal className="mx-auto max-w-180 text-center">
      <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {num}
      </div>
      <h2 className="mt-4 font-display text-[clamp(40px,4.6vw,72px)] font-normal leading-[1.02] tracking-tight text-foreground">
        {title}
      </h2>
      {lead ? (
        <p className="mx-auto mt-6 max-w-160 font-display text-[clamp(18px,1.7vw,22px)] italic leading-[1.42] text-secondary-foreground">
          {lead}
        </p>
      ) : null}
    </Reveal>
  );
}
