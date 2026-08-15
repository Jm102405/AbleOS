import { DEAL_STAGES, STAGE_LABELS, type DealStage } from "./types";

/** The stage strip, in workflow order. */
export const stages: Array<{ key: DealStage; name: string }> = DEAL_STAGES.map(
  (key) => ({ key, name: STAGE_LABELS[key] }),
);
