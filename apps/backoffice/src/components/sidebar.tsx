import { Link } from "@tanstack/react-router";

const linkBase =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
const linkActive = "rounded-md px-3 py-2 text-sm bg-muted text-foreground";

export function Sidebar() {
  return (
    <aside className="border-border bg-card flex w-60 shrink-0 flex-col border-r">
      <div className="px-6 py-5">
        <span className="text-xl font-semibold tracking-tight">Backoffice</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        <Link
          to="/items"
          className={linkBase}
          activeProps={{ className: linkActive }}
        >
          Items
        </Link>
      </nav>
    </aside>
  );
}
