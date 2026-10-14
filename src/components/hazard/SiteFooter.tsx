import { Activity, ShieldAlert } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div
        className="h-0.5 w-full"
        style={{ backgroundColor: "#0a1f44" }}
      />

      <div className="flex flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-8 shrink-0 place-items-center rounded-md text-white"
            style={{ backgroundColor: "#0a1f44" }}
          >
            <Activity className="size-4" />
          </span>

          <div className="leading-tight">
            <p className="text-xs font-semibold tracking-tight text-slate-900">
              Sentinel Hazard Monitor
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Regional Disaster Risk Unit
            </p>
          </div>
        </div>

        {/* Safety notice */}
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 lg:max-w-lg">
          <ShieldAlert className="size-4 shrink-0 text-amber-700" />

          <p className="text-[10px] leading-relaxed text-amber-900 sm:text-xs">
            <span className="font-semibold">Demo notice:</span>{" "}
            Figures are illustrative and must not be used for operational
            decisions.
          </p>
        </div>

        {/* Footer labels */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500 sm:text-xs">
          <span className="transition-colors hover:text-slate-900">
            Methodology
          </span>
          <span className="transition-colors hover:text-slate-900">
            Data policy
          </span>
          <span className="transition-colors hover:text-slate-900">
            Contact
          </span>
        </div>
      </div>

      {/* Compact bottom bar */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-1.5 sm:px-6">
        <p className="text-center text-[10px] text-slate-400">
          Sentinel Hazard Monitor · For demonstration and assessment purposes
        </p>
      </div>
    </footer>
  );
}
