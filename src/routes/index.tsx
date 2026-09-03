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

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const model = useHazardModel();
  const [controlsOpen, setControlsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        county={model.county}
        lastRun={model.lastRun}
        onOpenControls={() => setControlsOpen(true)}
      />

      <div className="flex flex-1 items-stretch">
        {/* Vertical control rail. Its own scroll container so a long parameter
            list never pushes the map out of view. */}
        <aside className="hidden w-80 shrink-0 border-r border-chrome-muted lg:block">
          <div className="sticky top-[61px] h-[calc(100vh-61px)]">
            <ControlSidebar model={model} />
          </div>
        </aside>

        {/* Same sidebar, drawer-mounted below lg. Rendering it only when open
            keeps one live copy of the controls, so the two never disagree. */}
        <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
          <SheetContent side="left" className="w-80 border-chrome-muted p-0 lg:hidden">
            <SheetTitle className="sr-only">Analysis controls</SheetTitle>
            {controlsOpen && <ControlSidebar model={model} />}
          </SheetContent>
        </Sheet>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6">
          {/* Map on the left taking whatever width is left over, key and ward
              results stacked in a fixed rail on the right. The rail is 24rem
              rather than 20rem because the ward table carries four columns; the
              map gives up 4rem of width and gets the table's whole former
              height back, which is the better trade on a landscape screen.

              items-start, not the default stretch: the rail should size to its
              content instead of both columns inheriting the taller one. The map
              is told to fill the row separately. */}
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <MapFrame county={model.county} status={model.status} className="xl:h-full" />

            <div className="space-y-4">
              <MapLegend hazard={model.hazard} active={model.results.length > 0} />
              <WardTable results={model.results} />
            </div>
          </div>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
