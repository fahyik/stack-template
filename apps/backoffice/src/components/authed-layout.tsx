import { type ReactNode } from "react";

import { PageLayout } from "./page-layout";
import { Sidebar } from "./sidebar";

export function AuthedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh">
      <Sidebar />
      <PageLayout>{children}</PageLayout>
    </div>
  );
}
