export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="flex flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="font-medium text-foreground">Sentinel Hazard Monitor</span> · Regional
          Disaster Risk Unit
        </p>
        <p className="max-w-md">
          Figures shown are illustrative demo values and must not be used for operational decisions.
        </p>
        <div className="flex gap-4">
          <span className="transition-colors hover:text-foreground">Methodology</span>
          <span className="transition-colors hover:text-foreground">Data policy</span>
          <span className="transition-colors hover:text-foreground">Contact</span>
        </div>
      </div>
    </footer>
  );
}
