import { Link } from "@tanstack/react-router";
import { Activity, FileDown, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  county: string;
  lastRun: Date | null;
  onOpenControls?: () => void;
}

export function AppHeader({ county, lastRun, onOpenControls }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-chrome text-chrome-foreground">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        {onOpenControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenControls}
            aria-label="Open controls"
            className="lg:hidden text-chrome-foreground hover:bg-chrome-muted"
          >
            <Menu className="size-5" />
          </Button>
        )}

        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-accent/15 text-accent">
            <Activity className="size-5" />
          </span>
          <div className="leading-tight">
            <h1 className="font-display text-base font-semibold tracking-tight sm:text-lg">
              Sentinel Hazard Monitor
            </h1>
            <p className="text-xs text-chrome-foreground/60">
              Regional early-warning console · {county} County
            </p>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <HeaderLink to="/" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
          <HeaderLink to="/reports" icon={<FileDown className="size-4" />} label="Reports" />
        </nav>

        <div className="hidden items-center gap-4 border-l border-chrome-muted pl-4 text-xs text-chrome-foreground/60 xl:flex">
          <span>
            Last run:{" "}
            <span className="text-chrome-foreground">
              {lastRun ? lastRun.toLocaleTimeString() : "—"}
            </span>
          </span>
          <span>
            Source: <span className="text-chrome-foreground">Demo dataset v1</span>
          </span>
        </div>
      </div>
    </header>
  );
}

function HeaderLink({
  to,
  icon,
  label,
}: {
  to: "/" | "/reports";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact: to === "/" }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-chrome-foreground/70 transition-colors hover:bg-chrome-muted hover:text-chrome-foreground"
      activeProps={{ className: "bg-chrome-muted !text-chrome-foreground" }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
