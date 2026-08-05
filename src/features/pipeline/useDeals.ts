import React from "react";
import { apiFetch } from "../../lib/apiFetch";
import { TERMINAL_STAGES, type Deal, type DealStage } from "./types";

export type DealKpis = {
  /** Deals still moving through the pipeline (excludes closed, dead, find a buyer). */
  active: number;
  awaitingDocs: number;
  /** Null until at least one deal has actually been moved. */
  avgDaysInStage: number | null;
  stalled: number;
};

export function useDeals() {
  const [deals, setDeals] = React.useState<Deal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const res = await apiFetch("/api/deals");
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body?.error || "Could not load deals");

      setDeals(Array.isArray(body.deals) ? body.deals : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const moveDeal = React.useCallback(async (id: string, stage: DealStage) => {
    setMovingId(id);

    try {
      const res = await apiFetch("/api/deals", {
        method: "PATCH",
        body: JSON.stringify({ id, stage }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body?.error || "Could not move the deal");

      // Update in place so the board reacts immediately, without a full refetch.
      setDeals((current) =>
        current.map((deal) =>
          deal.id === id
            ? {
                ...deal,
                stage,
                stageChangedAt: body.stageChangedAt ?? null,
                daysInStage: 0,
              }
            : deal,
        ),
      );

      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move the deal");
      return false;
    } finally {
      setMovingId(null);
    }
  }, []);

  const kpis: DealKpis = React.useMemo(() => {
    const active = deals.filter(
      (deal) => !TERMINAL_STAGES.includes(deal.stage),
    );

    // Only deals that have actually moved have a measurable time in stage.
    const timed = active.filter((deal) => typeof deal.daysInStage === "number");

    const avg = timed.length
      ? Math.round(
          (timed.reduce((sum, deal) => sum + (deal.daysInStage as number), 0) /
            timed.length) *
            10,
        ) / 10
      : null;

    return {
      active: active.length,
      awaitingDocs: deals.filter((deal) => deal.stage === "awaiting_docs")
        .length,
      avgDaysInStage: avg,
      stalled: timed.filter((deal) => (deal.daysInStage as number) >= 4).length,
    };
  }, [deals]);

  return { deals, error, kpis, loading, moveDeal, movingId, refresh: load };
}
