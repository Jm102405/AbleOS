/**
 * Workflow stages. These keys must stay identical to the check constraint
 * on public.deal_stages in Supabase and the STAGES array in api/deals.js.
 */
export const DEAL_STAGES = [
  "intake",
  "underwriting",
  "awaiting_docs",
  "docs_complete",
  "final_review",
  "proof_of_funds",
  "awaiting_signatures",
  "under_contract",
  "post_contract",
  "closed",
  "dead",
  "find_a_buyer",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const STAGE_LABELS: Record<DealStage, string> = {
  intake: "Intake",
  underwriting: "Underwriting",
  awaiting_docs: "Awaiting docs",
  docs_complete: "Docs complete",
  final_review: "Final review",
  proof_of_funds: "Proof of funds",
  awaiting_signatures: "Awaiting signatures",
  under_contract: "Under contract",
  post_contract: "Post contract",
  closed: "Closed",
  dead: "Dead",
  find_a_buyer: "Find a buyer",
};

/** Stages where a deal has left the active pipeline. */
export const TERMINAL_STAGES: DealStage[] = ["closed", "dead", "find_a_buyer"];

/**
 * Who sourced the deal. Comes from the Notion "Deal Source" select, so it is
 * a plain string rather than a fixed union. Adding a source in Notion should
 * not require a code change.
 */
export type BirdDog = string;

export type Deal = {
  id: string;
  name: string;
  address: string;
  source: BirdDog;
  category: string;
  notes: string;
  stage: DealStage;
  stageChangedAt: string | null;
  movedBy: string | null;
  daysInStage: number | null;
};
