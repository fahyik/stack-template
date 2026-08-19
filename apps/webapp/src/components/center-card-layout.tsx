import { type ReactNode } from "react";

export function CenterCardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <section className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card bg-[image:var(--brand-radial)] px-12 py-16 shadow-brand-lg max-[760px]:px-6 max-[760px]:py-10">
        {children}
      </section>
    </main>
  );
}
