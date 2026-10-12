
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "@/components/hazard/AppHeader";
import { ControlSidebar } from "@/components/hazard/ControlSidebar";
import { MapFrame } from "@/components/hazard/MapFrame";
import { MapLegend } from "@/components/hazard/MapLegend";
import { SiteFooter } from "@/components/hazard/SiteFooter";
import { WardTable } from "@/components/hazard/WardTable";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useHazardModel } from "@/hooks/use-hazard-model";

// The home route inherits its metadata from __root.tsx.
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const model = useHazardModel();
  const [controlsOpen, setControlsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background xl:h-screen xl:min-h-0">
      <AppHeader
        county={model.county}
        lastRun={model.lastRun}
        onOpenControls={() => setControlsOpen(true)}
      />

      <div className="flex flex-1 items-stretch xl:min-h-0">
        {/* Desktop analysis controls */}
        <aside className="hidden w-80 shrink-0 border-r border-chrome-muted lg:block">
          <div className="sticky top-[61px] h-[calc(100vh-61px)] xl:static xl:h-full">
            <ControlSidebar model={model} />
          </div>
        </aside>

        {/* Mobile and tablet analysis controls */}
        <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
          <SheetContent
            side="left"
            className="w-80 border-chrome-muted p-0 lg:hidden"
          >
            <SheetTitle className="sr-only">
              Analysis controls
            </SheetTitle>

            {controlsOpen && <ControlSidebar model={model} />}
          </SheetContent>
        </Sheet>

        {/* Main dashboard */}
        <main className="flex min-w-0 flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 xl:pb-0">
          <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Map follows the selected administrative area */}
            <MapFrame
              county={model.county}
              subCounty={model.subCounty}
              ward={model.ward}
              status={model.status}
              hazard={model.hazard}
              className="xl:h-full"
            />

            {/* Map legend and ward results */}
            <div className="space-y-4 xl:h-full xl:overflow-y-auto xl:pb-5">
              <MapLegend
                hazard={model.hazard}
                active={model.results.length > 0}
              />

              <WardTable results={model.results} />
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
