// src/features/pof/usePof.ts
// The proof of funds queue. Small on purpose - this endpoint returns a
// hand-picked set of fields, and this mirrors exactly that shape.

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch";

export type PofDeal = {
  id: string;
  name: string;
  address: string | null;
  purchasePrice: string | number | null;
  pofAmount: string | number | null;
  buyerEntity: string | null;
  targetCloseDate: string | null;
  pofLetterUrl: string | null;
  pofIssuedAt: string | null;
  pofIssuedBy: string | null;
  pofNotes: string | null;
  stageChangedAt: string | null;
};

async function readError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
}

export function usePof() {
  const [deals, setDeals] = useState<PofDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/pof");

      if (!res.ok) {
        setError(await readError(res, "Could not load the queue"));
        setDeals([]);
        return;
      }

      const body = await res.json();
      setDeals(Array.isArray(body.deals) ? body.deals : []);
    } catch {
      setError("Could not reach the server");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Raj states the amount, entity and close date Cornelius writes to. */
  const setDetails = useCallback(
    async (
      id: string,
      input: {
        pofAmount?: string;
        buyerEntity?: string;
        targetCloseDate?: string;
      },
    ) => {
      const res = await apiFetch("/api/pof", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "details", ...input }),
      });

      if (!res.ok) throw new Error(await readError(res, "Could not save"));

      const { deal } = await res.json();
      setDeals((prev) => prev.map((d) => (d.id === id ? deal : d)));
      return deal as PofDeal;
    },
    [],
  );

  /** The letter is written. Records it; does not advance the deal. */
  const recordIssued = useCallback(
    async (id: string, input: { letterUrl?: string; notes?: string }) => {
      const res = await apiFetch("/api/pof", {
        method: "PATCH",
        body: JSON.stringify({ id, action: "issued", ...input }),
      });

      if (!res.ok) throw new Error(await readError(res, "Could not save"));

      const { deal } = await res.json();
      setDeals((prev) => prev.map((d) => (d.id === id ? deal : d)));
      return deal as PofDeal;
    },
    [],
  );

  return { deals, loading, error, load, setDetails, recordIssued };
}

/** Postgres numerics arrive as strings. */
export function money(value: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return `$${Math.round(parsed).toLocaleString()}`;
}
