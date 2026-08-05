import { DEAL_STAGES, STAGE_LABELS, type Deal, type DealStage } from "./types";

/** The stage strip, in workflow order. */
export const stages: Array<{ key: DealStage; name: string }> = DEAL_STAGES.map(
  (key) => ({ key, name: STAGE_LABELS[key] }),
);

export type BirdDogOption = { label: string; value: string };

/**
 * The bird dog list is derived from the deals themselves rather than hardcoded,
 * so a new "Deal Source" option added in Notion appears here without a code
 * change. "All" is always first, the rest are alphabetical.
 */
export function buildBirdDogOptions(deals: Deal[]): BirdDogOption[] {
  const names = Array.from(
    new Set(deals.map((deal) => deal.source).filter(Boolean)),
  );

  names.sort((a, b) => a.localeCompare(b));

  return [
    { label: "All bird dogs", value: "All" },
    ...names.map((name) => ({ label: name, value: name })),
  ];
}
