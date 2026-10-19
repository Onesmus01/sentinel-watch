import { ShieldAlert } from "lucide-react";

const HEADER_BG = "#0a1f44";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      {/* Navy accent line */}
      <div
        className="h-0.5 w-full"
        style={{ backgroundColor: HEADER_BG }}
      />

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand and Kenya Space Agency logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded"
            style={{ backgroundColor: HEADER_BG }}
          >
            <img
              src="/image.png"
              alt="Kenya Space Agency logo"
              className="size-15 object-contain"
            />
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-900">
              Sentinel Hazard Monitor
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Regional Disaster Risk Unit
            </p>
            <p className="mt-1 text-[10px] font-medium text-slate-400">
              Kenya Space Agency
            </p>
          </div>
        </div>

        {/* Safety notice */}
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 lg:max-w-lg">
          <ShieldAlert className="size-4 shrink-0 text-amber-700" />

          <p className="text-[10px] leading-relaxed text-emerald-900 sm:text-xs">
          <span className="font-semibold">Live monitoring:</span>{" "}
          Hazard data and risk assessments are provided by the system to support
          situational awareness and early-warning decisions.
        </p>
        </div>

        {/* Footer labels */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-medium text-slate-500 sm:text-xs">
          <span className="cursor-pointer transition-colors hover:text-slate-900">
            Methodology
          </span>
          <span className="cursor-pointer transition-colors hover:text-slate-900">
            Data policy
          </span>
          <span className="cursor-pointer transition-colors hover:text-slate-900">
            Contact
          </span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 sm:px-6">
        <p className="text-center text-[10px] text-slate-400">
          Sentinel Hazard Monitor · For demonstration and assessment purposes
        </p>
      </div>
    </footer>
  );
}
