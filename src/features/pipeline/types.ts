export type DocumentStatus = "Complete" | "Missing" | "Generated";

export type BirdDog = "Rex" | "Thomas" | "Chirag" | "Victor" | "Anthony";

export type DealStage =
  | "Intake"
  | "Docs complete"
  | "Docs generated"
  | "Proof of funds"
  | "Awaiting signatures"
  | "Contract"
  | "Ops handoff";

export type DealDocument = {
  name: string;
  status: DocumentStatus;
};

export type DealEvent = {
  date: string;
  title: string;
  detail: string;
};

export type Deal = {
  id: string;
  property: string;
  market: string;
  value: string;
  birdDog: BirdDog;
  stage: DealStage;
  daysInStage: number;
  missingDocs: string[];
  documents: DealDocument[];
  history: DealEvent[];
};
