import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDownIcon, FilterIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { MobileScreenShell } from "../components/MobileScreenShell";
import { UserMenu } from "../components/UserMenu";
import { DealCard } from "../features/pipeline/DealCard";
import { DealDetail } from "../features/pipeline/DealDetail";
import { KpiTile } from "../features/pipeline/KpiTile";
import { StageStrip } from "../features/pipeline/StageStrip";
import { birdDogOptions, deals, stages } from "../features/pipeline/data";
import type { BirdDog, Deal, DealStage } from "../features/pipeline/types";
import { NotificationBell } from "../components/NotificationBell";

export function PipelineBoard() {
  const [selectedBirdDog, setSelectedBirdDog] = React.useState<"All" | BirdDog>(
    "All",
  );
  const [selectedStage, setSelectedStage] = React.useState<DealStage>(
    stages[0].name,
  );
  const [selectedDeal, setSelectedDeal] = React.useState<Deal | null>(null);

  const scopedDeals = React.useMemo(
    () =>
      deals.filter(
        (deal) => selectedBirdDog === "All" || deal.birdDog === selectedBirdDog,
      ),
    [selectedBirdDog],
  );

  const displayedDeals = React.useMemo(
    () => scopedDeals.filter((deal) => deal.stage === selectedStage),
    [scopedDeals, selectedStage],
  );

  const stageCounts = React.useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage.name,
          scopedDeals.filter((deal) => deal.stage === stage.name).length,
        ]),
      ),
    [scopedDeals],
  );

  const missingDocsCount = scopedDeals.reduce(
    (total, deal) => total + deal.missingDocs.length,
    0,
  );
  const averageDays = scopedDeals.length
    ? scopedDeals.reduce((total, deal) => total + deal.daysInStage, 0) /
      scopedDeals.length
    : 0;
  const stalledDeals = scopedDeals.filter(
    (deal) => deal.daysInStage >= 4,
  ).length;
  const activeBirdDogLabel =
    birdDogOptions.find((option) => option.value === selectedBirdDog)?.label ??
    "All bird dogs";

  React.useEffect(() => {
    if (!selectedDeal) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedDeal(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDeal]);

  return (
    <MobileScreenShell
      headerContent={
        <>
          <div className="flex items-center justify-between">
            <Link aria-label="Return to Raj's Cockpit" to="/raj">
              <img
                alt="Able Buys Homes"
                className="h-12 w-12 rounded-xl bg-[#191919] p-0.5 object-contain shadow-sm"
                src="/able-logo.png"
              />
            </Link>
            <div className="flex items-center gap-3">
              <nav
                aria-label="Workspace pages"
                className="flex items-center gap-1 rounded-full bg-white/15 p-1"
              >
                <Link
                  className="rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                  to="/raj"
                >
                  Cockpit
                </Link>
                <span
                  aria-current="page"
                  className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1E3A8A]"
                >
                  Pipeline
                </span>
              </nav>
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            ABLE OS · Deal flow
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Pipeline
          </h1>
          <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
            Reliable sourcing, visible at every stage.
          </p>
        </>
      }
    >
      <section
        aria-labelledby="pipeline-overview"
        className="relative -mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
      >
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3A8A]"
        />
        <div className="px-5 py-4 pl-6 sm:px-7 sm:py-5 sm:pl-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
            Active deal flow
          </p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <h2
              className="text-[18px] font-extrabold tracking-[-0.03em]"
              id="pipeline-overview"
            >
              {scopedDeals.length} active deals
            </h2>
            <p className="text-[11px] font-bold text-[#64748B]">7 stages</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="bird-dog-filter-label" className="pt-7">
        <label
          className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3B82C4]"
          htmlFor="bird-dog-filter"
          id="bird-dog-filter-label"
        >
          Bird dog view
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <select
              className="h-12 w-full appearance-none rounded-xl border border-[#DCE4EE] bg-white px-4 pr-10 text-[13px] font-extrabold text-[#1A1A2E] shadow-[0_4px_10px_rgba(30,58,138,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3B82C4]"
              id="bird-dog-filter"
              onChange={(event) =>
                setSelectedBirdDog(event.target.value as "All" | BirdDog)
              }
              value={selectedBirdDog}
            >
              {birdDogOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]"
              size={18}
            />
          </div>
          <div
            aria-label={`Filtering deals for ${activeBirdDogLabel}`}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#DCE4EE] bg-white text-[#3B82C4] shadow-[0_4px_10px_rgba(30,58,138,0.04)]"
          >
            <FilterIcon aria-hidden="true" size={18} />
          </div>
        </div>
      </section>

      <section
        aria-label="Pipeline metrics"
        className="grid grid-cols-2 gap-3 pt-5 lg:grid-cols-4"
      >
        <KpiTile
          label="Deals in pipe"
          tone="primary"
          value={String(scopedDeals.length)}
        />
        <KpiTile
          label="Missing docs"
          tone={missingDocsCount > 0 ? "urgent" : "neutral"}
          value={String(missingDocsCount)}
        />
        <KpiTile
          label="Avg days in stage"
          tone="neutral"
          value={averageDays.toFixed(1)}
        />
        <KpiTile
          label="Stalled 4+ days"
          tone={stalledDeals > 0 ? "urgent" : "neutral"}
          value={String(stalledDeals)}
        />
      </section>

      <section aria-labelledby="stage-filter-title" className="pt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3B82C4]">
              7 stages
            </p>
            <h2
              className="mt-1 text-[19px] font-extrabold tracking-[-0.035em]"
              id="stage-filter-title"
            >
              {selectedStage}
            </h2>
          </div>
          <p className="rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#2465B5]">
            {displayedDeals.length} deal{displayedDeals.length === 1 ? "" : "s"}
          </p>
        </div>

        <StageStrip
          counts={stageCounts}
          onSelect={setSelectedStage}
          selectedStage={selectedStage}
        />
      </section>

      <section aria-labelledby="deal-list-title" className="pt-6">
        <h2 className="sr-only" id="deal-list-title">
          Deals in {selectedStage}
        </h2>
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0"
            initial={{ opacity: 0, y: 7 }}
            key={`${selectedBirdDog}-${selectedStage}`}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {displayedDeals.length > 0 ? (
              displayedDeals.map((deal) => (
                <DealCard
                  deal={deal}
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center lg:col-span-2">
                <p className="text-[13px] font-extrabold text-[#526176]">
                  No deals in this stage
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#8291A5]">
                  Choose another stage to review{" "}
                  {activeBirdDogLabel.toLowerCase()}.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
        Able OS · V1 Build
      </footer>

      <AnimatePresence>
        {selectedDeal ? (
          <DealDetail
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
          />
        ) : null}
      </AnimatePresence>
    </MobileScreenShell>
  );
}
