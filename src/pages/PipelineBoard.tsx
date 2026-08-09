import React from "react";
import { AnimatePresence } from "framer-motion";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LayersIcon,
  RefreshCwIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MobileScreenShell } from "../components/MobileScreenShell";
import { UserMenu } from "../components/UserMenu";
import { NotificationBell } from "../components/NotificationBell";
import { DealDetail } from "../features/pipeline/DealDetail";
import { KpiTile } from "../features/pipeline/KpiTile";
import { StageBrowserModal } from "../features/pipeline/StageBrowserModal";
import { buildBirdDogOptions, stages } from "../features/pipeline/data";
import { useDeals } from "../features/pipeline/useDeals";
import {
  STAGE_LABELS,
  TERMINAL_STAGES,
  type Deal,
  type DealStage,
} from "../features/pipeline/types";

export function PipelineBoard() {
  const { deals, error, loading, moveDeal, movingId, refresh } = useDeals();

  const [selectedBirdDog, setSelectedBirdDog] = React.useState("All");
  const [selectedStage, setSelectedStage] = React.useState<DealStage>("intake");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [browserOpen, setBrowserOpen] = React.useState(false);

  const birdDogOptions = React.useMemo(
    () => buildBirdDogOptions(deals),
    [deals],
  );

  const scopedDeals = React.useMemo(
    () =>
      deals.filter(
        (deal) => selectedBirdDog === "All" || deal.source === selectedBirdDog,
      ),
    [deals, selectedBirdDog],
  );

  const displayedDeals = React.useMemo(
    () => scopedDeals.filter((deal) => deal.stage === selectedStage),
    [scopedDeals, selectedStage],
  );

  const stageCounts = React.useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage.key,
          scopedDeals.filter((deal) => deal.stage === stage.key).length,
        ]),
      ),
    [scopedDeals],
  );

  /* KPIs follow the bird dog filter, so the numbers match what is on screen. */
  const metrics = React.useMemo(() => {
    const active = scopedDeals.filter(
      (deal) => !TERMINAL_STAGES.includes(deal.stage),
    );
    const timed = active.filter((deal) => typeof deal.daysInStage === "number");

    return {
      active: active.length,
      awaitingDocs: scopedDeals.filter((deal) => deal.stage === "awaiting_docs")
        .length,
      avgDays: timed.length
        ? (
            timed.reduce((sum, deal) => sum + (deal.daysInStage as number), 0) /
            timed.length
          ).toFixed(1)
        : "--",
      stalled: timed.filter((deal) => (deal.daysInStage as number) >= 4).length,
    };
  }, [scopedDeals]);

  // Read the open deal out of the live list so it updates after a move.
  const selectedDeal: Deal | null =
    deals.find((deal) => deal.id === selectedId) ?? null;

  const activeBirdDogLabel =
    birdDogOptions.find((option) => option.value === selectedBirdDog)?.label ??
    "All bird dogs";

  React.useEffect(() => {
    if (!selectedId) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId]);

  async function handleMove(id: string, stage: DealStage) {
    const ok = await moveDeal(id, stage);
    if (ok) {
      setSelectedId(null);
      setSelectedStage(stage);
    }
  }

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
        aria-label="Pipeline metrics"
        className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4"
      >
        <KpiTile
          label="Deals in pipe"
          tone="primary"
          value={loading ? "..." : String(metrics.active)}
        />
        <KpiTile
          label="Awaiting docs"
          tone={metrics.awaitingDocs > 0 ? "urgent" : "neutral"}
          value={loading ? "..." : String(metrics.awaitingDocs)}
        />
        <KpiTile
          label="Avg days in stage"
          tone="neutral"
          value={loading ? "..." : metrics.avgDays}
        />
        <KpiTile
          label="Stalled 4+ days"
          tone={metrics.stalled > 0 ? "urgent" : "neutral"}
          value={loading ? "..." : String(metrics.stalled)}
        />
      </section>

      <section aria-labelledby="bird-dog-filter-label" className="pt-7">
        <label
          className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3B82C4]"
          htmlFor="bird-dog-filter"
          id="bird-dog-filter-label"
        >
          Bird dog view
        </label>
        <div className="mt-2">
          <div className="relative">
            <select
              className="h-12 w-full appearance-none rounded-xl border border-[#DCE4EE] bg-white px-4 pr-10 text-[13px] font-extrabold text-[#1A1A2E] shadow-[0_4px_10px_rgba(30,58,138,0.04)] focus:outline-none focus:ring-2 focus:ring-[#3B82C4]"
              id="bird-dog-filter"
              onChange={(event) => setSelectedBirdDog(event.target.value)}
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
        </div>
      </section>

      {error ? (
        <p className="pt-3 text-[11px] font-bold text-[#DC2626]">{error}</p>
      ) : null}

      <section aria-labelledby="stage-browser-title" className="pt-8">
        <div className="flex items-center justify-between gap-3">
          <h2
            className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
            id="stage-browser-title"
          >
            Deals by stage
          </h2>
          <button
            aria-label="Refresh deals"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#E3EDF8] hover:text-[#526176]"
            onClick={refresh}
            type="button"
          >
            <RefreshCwIcon
              aria-hidden="true"
              className={loading ? "animate-spin" : ""}
              size={15}
              strokeWidth={2.5}
            />
          </button>
        </div>

        <button
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5"
          onClick={() => setBrowserOpen(true)}
          type="button"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EEF5FF] text-[#1E3A8A]">
            <LayersIcon aria-hidden="true" size={17} strokeWidth={2.5} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
              Browse all {stages.length} stages
            </span>
            <span className="mt-1 block text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
              {STAGE_LABELS[selectedStage]} · {displayedDeals.length} deal
              {displayedDeals.length === 1 ? "" : "s"} · {activeBirdDogLabel}
            </span>
          </span>
          <ChevronRightIcon
            aria-hidden="true"
            className="shrink-0 text-[#93A3B8]"
            size={16}
            strokeWidth={2.5}
          />
        </button>
      </section>

      <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
        Able OS · V1 Build
      </footer>

      <StageBrowserModal
        birdDogLabel={activeBirdDogLabel}
        counts={stageCounts}
        deals={displayedDeals}
        loading={loading}
        onClose={() => setBrowserOpen(false)}
        onSelectDeal={(deal) => setSelectedId(deal.id)}
        onSelectStage={setSelectedStage}
        open={browserOpen}
        selectedStage={selectedStage}
      />

      <AnimatePresence>
        {selectedDeal ? (
          <DealDetail
            deal={selectedDeal}
            moving={movingId === selectedDeal.id}
            onClose={() => setSelectedId(null)}
            onMove={handleMove}
          />
        ) : null}
      </AnimatePresence>
    </MobileScreenShell>
  );
}
