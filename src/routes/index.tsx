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
    // min-h-screen below xl (normal document flow, the page scrolls); exactly
    // h-screen from xl, so header + content + footer share the viewport and the
    // map can meet the footer somewhere the reader can actually see it.
    <div className="flex min-h-screen flex-col bg-background xl:h-screen xl:min-h-0">
      <AppHeader
        county={model.county}
        lastRun={model.lastRun}
        onOpenControls={() => setControlsOpen(true)}
      />

      <div className="flex flex-1 items-stretch xl:min-h-0">
        {/* Vertical control rail. Its own scroll container so a long parameter
            list never pushes the map out of view. */}
        <aside className="hidden w-80 shrink-0 border-r border-chrome-muted lg:block">
          {/* At lg the page still scrolls, so the rail sticks and sizes
              itself against the viewport. From xl the shell is height-bounded
              and h-full is both simpler and correct — the old
              h-[calc(100vh-61px)] assumed nothing followed it, which is exactly
              what pushed the footer below the fold. */}
          <div className="sticky top-[61px] h-[calc(100vh-61px)] xl:static xl:h-full">
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

        {/* A flex column so the grid below can claim the height left over
            between the header and the footer. No bottom padding from xl: the
            map is meant to meet the footer rather than float above it. */}
        <main className="flex min-w-0 flex-1 flex-col px-4 pb-5 pt-5 sm:px-6 xl:pb-0">
          {/* Map on the left taking whatever width is left over, key and ward
              results stacked in a fixed rail on the right. The rail is 24rem
              rather than 20rem because the ward table carries four columns; the
              map gives up 4rem of width and gets the table's whole former
              height back, which is the better trade on a landscape screen.

              xl:flex-1 makes the row fill the space between header and footer,
              and the default items-stretch is what carries that height into the
              map. min-h-0 keeps a tall rail from forcing the grid past its
              track instead of scrolling the page. The rail takes self-start so
              only the map stretches; stretching the key would leave a gap under
              its text rather than filling anything useful. */}
          <div className="grid gap-5 xl:min-h-0 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_24rem]">
            <MapFrame county={model.county} status={model.status} className="xl:h-full" />

            {/* Scrolls within itself from xl rather than stretching the row.
                Its contents stay top-aligned inside the scroller, so the key
                does not gain a gap under its text the way a stretched column
                would. pb-5 keeps the last card off the footer. */}
            <div className="space-y-4 xl:h-full xl:overflow-y-auto xl:pb-5">
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
