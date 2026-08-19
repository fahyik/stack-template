import { type ReactNode } from "react";

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1200px]">{children}</div>
    </main>
  );
}
