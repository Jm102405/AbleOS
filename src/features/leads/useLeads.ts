// src/features/leads/useLeads.ts
// One place that owns lead data: loading it, creating one, moving stages.
// Components stay presentational and just call these.

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch";

export const LEAD_STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Docs submitted",
  "Dead",
] as const;

export type LeadStage = (typeof LEAD_STAGES)[number];

export type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string | null;
  notes: string | null;
  stage: LeadStage;
  stage_changed_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type NewLead = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  source?: string;
  notes?: string;
};

async function readError(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return body?.error || fallback;
  } catch {
    return fallback;
  }
}

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await apiFetch("/api/leads");

      if (!res.ok) {
        setError(await readError(res, "Could not load leads"));
        setLeads([]);
        return;
      }

      const body = await res.json();
      setLeads(Array.isArray(body.leads) ? body.leads : []);
    } catch {
      setError("Could not reach the server");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Add a lead. Returns the saved row, or throws with a readable message. */
  const createLead = useCallback(async (input: NewLead) => {
    setSaving(true);

    try {
      const res = await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify(input),
      });

      if (!res.ok) throw new Error(await readError(res, "Could not save lead"));

      const { lead } = await res.json();
      setLeads((prev) => [lead, ...prev]);
      return lead as Lead;
    } finally {
      setSaving(false);
    }
  }, []);

  /** Move a lead to another stage. Rolls back if the server refuses. */
  const moveStage = useCallback(
    async (id: string, stage: LeadStage) => {
      const before = leads;

      // Move it on screen straight away so the board feels instant.
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? { ...l, stage, stage_changed_at: new Date().toISOString() }
            : l,
        ),
      );

      try {
        const res = await apiFetch("/api/leads", {
          method: "PATCH",
          body: JSON.stringify({ id, stage }),
        });

        if (!res.ok) throw new Error(await readError(res, "Could not move lead"));

        const { lead } = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)));
      } catch (err) {
        setLeads(before);
        throw err;
      }
    },
    [leads],
  );

  return { leads, loading, error, saving, load, createLead, moveStage };
}