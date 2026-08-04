import type { BirdDog, Deal, DealStage } from "./types";

export const stages: Array<{ name: DealStage }> = [
  { name: "Intake" },
  { name: "Docs complete" },
  { name: "Docs generated" },
  { name: "Proof of funds" },
  { name: "Awaiting signatures" },
  { name: "Contract" },
  { name: "Ops handoff" },
];

const BIRD_DOGS: BirdDog[] = ["Rex", "Thomas", "Chirag", "Victor", "Anthony"];

export const birdDogOptions: Array<{ label: string; value: "All" | BirdDog }> = [
  { label: "All bird dogs", value: "All" },
  // Sorted here rather than hand-ordered, so adding a name keeps it alphabetical.
  ...[...BIRD_DOGS]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, value: name })),
];

/**
 * Placeholder data. When the deal pipeline gets a real source (Notion or
 * Supabase), this is the only file that needs to change.
 */
export const deals: Deal[] = [
  {
    id: "deal-1042",
    property: "HTM Duplex - Side A",
    market: "Austin, TX - 2 units",
    value: "$810K",
    birdDog: "Rex",
    stage: "Intake",
    daysInStage: 2,
    missingDocs: ["Current rent roll", "Latest utility bills"],
    documents: [
      { name: "Deal intake", status: "Complete" },
      { name: "T12 operating statement", status: "Complete" },
      { name: "Rent roll", status: "Missing" },
    ],
    history: [
      {
        date: "Today - 9:14 AM",
        title: "Submitted by Rex",
        detail: "Initial deal intake and property notes received.",
      },
      {
        date: "Yesterday - 5:42 PM",
        title: "Bird dog assigned",
        detail: "Rex added as sourcing owner.",
      },
    ],
  },
  {
    id: "deal-1040",
    property: "Elm Street 4-plex",
    market: "Austin, TX - 4 units",
    value: "$1.2M",
    birdDog: "Rex",
    stage: "Intake",
    daysInStage: 1,
    missingDocs: [],
    documents: [
      { name: "Deal intake", status: "Complete" },
      { name: "Rent roll", status: "Complete" },
      { name: "T12 operating statement", status: "Complete" },
    ],
    history: [
      {
        date: "Today - 8:31 AM",
        title: "Submitted by Rex",
        detail: "Property packet and seller contact were added.",
      },
      {
        date: "Yesterday - 2:05 PM",
        title: "Bird dog assigned",
        detail: "Rex added as sourcing owner.",
      },
    ],
  },
  {
    id: "deal-1038",
    property: "North Loop Commons",
    market: "Austin, TX - 28 units",
    value: "$3.2M",
    birdDog: "Chirag",
    stage: "Docs complete",
    daysInStage: 2,
    missingDocs: [],
    documents: [
      { name: "Deal intake", status: "Complete" },
      { name: "Rent roll", status: "Complete" },
      { name: "T12 operating statement", status: "Complete" },
    ],
    history: [
      {
        date: "Jul 25 - 3:25 PM",
        title: "Documents verified",
        detail: "All required source documents have been reviewed.",
      },
      {
        date: "Jul 24 - 11:08 AM",
        title: "Submitted by Thomas",
        detail: "New off-market opportunity logged.",
      },
    ],
  },
  {
    id: "deal-1035",
    property: "Barton Ridge Townhomes",
    market: "San Marcos, TX - 42 units",
    value: "$5.6M",
    birdDog: "Rex",
    stage: "Docs generated",
    daysInStage: 1,
    missingDocs: [],
    documents: [
      { name: "LOI", status: "Generated" },
      { name: "Capital stack", status: "Generated" },
      { name: "Underwriting summary", status: "Generated" },
    ],
    history: [
      {
        date: "Today - 8:52 AM",
        title: "Document package generated",
        detail: "LOI and capital stack are ready for review.",
      },
      {
        date: "Jul 25 - 1:16 PM",
        title: "Documents verified",
        detail: "Deal moved forward from document review.",
      },
    ],
  },
  {
    id: "deal-1029",
    property: "South Congress Flats",
    market: "Austin, TX - 18 units",
    value: "$2.8M",
    birdDog: "Victor",
    stage: "Proof of funds",
    daysInStage: 5,
    missingDocs: ["Bank letter"],
    documents: [
      { name: "LOI", status: "Generated" },
      { name: "Capital stack", status: "Generated" },
      { name: "Bank letter", status: "Missing" },
    ],
    history: [
      {
        date: "Jul 22 - 4:06 PM",
        title: "Proof of funds requested",
        detail: "Capital partner has been asked for an updated bank letter.",
      },
      {
        date: "Jul 21 - 10:30 AM",
        title: "LOI approved internally",
        detail: "Acquisition team approved the LOI package.",
      },
    ],
  },
  {
    id: "deal-1021",
    property: "Eastside Courtyard",
    market: "Round Rock, TX - 36 units",
    value: "$4.1M",
    birdDog: "Anthony",
    stage: "Awaiting signatures",
    daysInStage: 4,
    missingDocs: [],
    documents: [
      { name: "LOI", status: "Generated" },
      { name: "Proof of funds", status: "Complete" },
      { name: "Purchase agreement", status: "Generated" },
    ],
    history: [
      {
        date: "Jul 23 - 2:18 PM",
        title: "Sent for signature",
        detail: "Seller and buyer signatures are pending.",
      },
      {
        date: "Jul 22 - 4:55 PM",
        title: "Proof of funds verified",
        detail: "Capital source has cleared review.",
      },
    ],
  },
  {
    id: "deal-1016",
    property: "Riverside Exchange",
    market: "Georgetown, TX - 54 units",
    value: "$7.9M",
    birdDog: "Rex",
    stage: "Contract",
    daysInStage: 2,
    missingDocs: [],
    documents: [
      { name: "Executed LOI", status: "Complete" },
      { name: "Purchase agreement", status: "Complete" },
      { name: "Capital stack", status: "Generated" },
    ],
    history: [
      {
        date: "Jul 24 - 12:02 PM",
        title: "Contract executed",
        detail: "All parties completed the purchase agreement.",
      },
      {
        date: "Jul 23 - 9:36 AM",
        title: "Legal review complete",
        detail: "Agreement marked ready for execution.",
      },
    ],
  },
  {
    id: "deal-1009",
    property: "Cedar Grove Residences",
    market: "Kyle, TX - 24 units",
    value: "$3.6M",
    birdDog: "Thomas",
    stage: "Ops handoff",
    daysInStage: 1,
    missingDocs: [],
    documents: [
      { name: "Executed contract", status: "Complete" },
      { name: "Ops brief", status: "Generated" },
      { name: "Due diligence tracker", status: "Generated" },
    ],
    history: [
      {
        date: "Today - 10:08 AM",
        title: "Handed to operations",
        detail: "Deal team and execution owner have been notified.",
      },
      {
        date: "Jul 25 - 4:19 PM",
        title: "Close checklist created",
        detail: "Initial operating checklist is ready.",
      },
    ],
  },
];
