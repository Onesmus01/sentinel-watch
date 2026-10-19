import { Link } from "@tanstack/react-router";
import { FileDown, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  county: string;
  lastRun: Date | null;
  onOpenControls?: () => void;
}

export function AppHeader({ county, lastRun, onOpenControls }: Props) {
  return (
    <header
      className="sticky top-0 z-30 border-b border-white/10 text-white shadow-md"
      style={{ backgroundColor: "#0a1f44" }}
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        {onOpenControls && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenControls}
            aria-label="Open controls"
            className="text-white hover:bg-white/10 hover:text-white lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
        )}

        <div className="flex items-center gap-3">
          <img
            src="/image.png"
            alt="Kenya Space Agency logo"
            className="size-15 brightness-90 shrink-0 rounded-md object-contain"
          />

          <div className="leading-tight">
            <h1 className="font-display text-base font-semibold tracking-tight text-white sm:text-lg">
              Sentinel Hazard Monitor
            </h1>
            <p className="text-xs text-white/65">
              Regional early-warning console · {county} County
            </p>
          </div>
        </div>

        <nav className="ml-auto flex items-center gap-1">
          <HeaderLink
            to="/"
            icon={<LayoutDashboard className="size-4" />}
            label="Dashboard"
          />
          <HeaderLink
            to="/reports"
            icon={<FileDown className="size-4" />}
            label="Reports"
          />
        </nav>

        <div className="hidden items-center gap-4 border-l border-white/15 pl-4 text-xs text-white/65 xl:flex">
          <span>
            Last run:{" "}
            <span className="text-white">
              {lastRun ? lastRun.toLocaleTimeString() : "—"}
            </span>
          </span>

          <span>
            Source: <span className="text-white">Demo dataset v1</span>
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
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
      activeProps={{
        className: "bg-white/15 !text-white",
      }}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
