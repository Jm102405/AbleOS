import React from "react";
import { motion } from "framer-motion";
import {
  CameraIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  KeyRoundIcon,
  LayersIcon,
  SearchCheckIcon,
} from "lucide-react";
import { UserMenu } from "../components/UserMenu";
import { NotificationBell } from "../components/NotificationBell";
import { NavCard } from "../components/NavCard";
import { GateQueueModal } from "../features/approvals/GateQueueModal";

/* ── Mock data. Replace each block when the real source exists. ────────── */

type Deal = {
  id: string;
  name: string;
  city: string;
  stage: string;
  days: number;
  stalled?: boolean;
};

const STAGES = [
  "Sourced",
  "Walkthrough",
  "In underwriting",
  "Offer out",
  "Under contract",
  "DD / COE",
];

const DEALS: Deal[] = [
  { id: "d1", name: "34th St SFH", city: "Lubbock", stage: "Sourced", days: 2 },
  { id: "d2", name: "Ave Q Duplex", city: "Lubbock", stage: "Sourced", days: 4 },
  { id: "d3", name: "Slaton 4-plex", city: "Slaton", stage: "Walkthrough", days: 1 },
  {
    id: "d4",
    name: "Infinity MHP",
    city: "Lubbock",
    stage: "In underwriting",
    days: 9,
    stalled: true,
  },
  { id: "d5", name: "Plainview SFH", city: "Plainview", stage: "Offer out", days: 3 },
  { id: "d6", name: "Topeka Ave", city: "Lubbock", stage: "Under contract", days: 6 },
  { id: "d7", name: "Hwy 70 Commercial", city: "Plainview", stage: "DD / COE", days: 2 },
];

const WALKTHROUGHS = [
  { id: "w1", name: "34th St SFH", note: "Seller available this week, prefers mornings" },
  { id: "w2", name: "Ave Q Duplex", note: "Awaiting lockbox access from listing agent" },
];

const MATCHES = [
  { id: "m1", name: "34th St SFH", note: "3/2, seller open to terms", state: "New" },
  { id: "m2", name: "Ave Q Duplex", note: "Value-add, below market", state: "Watch" },
  { id: "m3", name: "Idalou 6-pack", note: "SFH portfolio, needs $250/door check", state: "Sent" },
];

const DOCS = [
  { id: "s1", deal: "Plainview SFH", doc: "LOI", status: "Out for signature", age: "2d" },
  { id: "s2", deal: "Topeka Ave", doc: "PSA amendment", status: "Draft", age: "1d" },
  { id: "s3", deal: "Hwy 70 Commercial", doc: "Ch. 93 lease", status: "Executed", age: "—" },
];

const MARKET = [
  { label: "Lubbock rent index", value: 78, colour: "bg-[#418BFF]" },
  { label: "Days on market", value: 35, colour: "bg-[#1E3A8A]" },
  { label: "Buy-box deal flow", value: 62, colour: "bg-[#D97706]" },
];

const DOC_STYLES: Record<string, string> = {
  Draft: "bg-[#94A3B8] text-white",
  "Out for signature": "bg-[#D97706] text-white",
  Executed: "bg-[#16A34A] text-white",
};

const MATCH_STYLES: Record<string, string> = {
  New: "bg-[#418BFF] text-white",
  Watch: "bg-[#94A3B8] text-white",
  Sent: "bg-[#16A34A] text-white",
};

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function RexCockpit() {
  const [pipelineOpen, setPipelineOpen] = React.useState(false);
  const [walkOpen, setWalkOpen] = React.useState(false);
  const [matchOpen, setMatchOpen] = React.useState(false);
  const [docsOpen, setDocsOpen] = React.useState(false);
  const [stage, setStage] = React.useState(STAGES[0]);
  const [scheduled, setScheduled] = React.useState<string[]>([]);
  const [sent, setSent] = React.useState<string[]>(["m3"]);

  const stageDeals = DEALS.filter((deal) => deal.stage === stage);
  const stalled = DEALS.filter((deal) => deal.stalled).length;

  return (
    <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
      <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
        <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5 sm:max-w-2xl sm:px-8 sm:pb-10 sm:pt-6 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          <div className="flex items-center justify-between">
            <img
              alt="Able Buys Homes"
              className="h-12 w-12 rounded-xl bg-[#191919] p-0.5 object-contain shadow-sm"
              src="/able-logo.png"
            />
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          <p className="mt-6 text-[16px] font-medium tracking-[0.01em] text-white/85">
            Able OS · West Texas
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Rex&apos;s Cockpit
          </h1>
          <p className="mt-2 max-w-md text-[18px] font-normal leading-[1.5] text-white/90">
            What to walk, shoot or chase today.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[428px] px-5 pb-10 sm:max-w-2xl sm:px-8 sm:pb-14 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
        <motion.section
          animate="visible"
          aria-labelledby="profile-heading"
          className="relative -mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
          initial="hidden"
          transition={{ duration: 0.35, ease: "easeOut" }}
          variants={reveal}
        >
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3A8A]" />
          <div className="px-5 py-4 pl-6 sm:px-7 sm:py-5 sm:pl-8">
            <p className="text-[16px] font-medium text-[#5B6B82]">
              Personal dashboard
            </p>
            <h2
              className="mt-1 text-[22px] font-semibold tracking-[-0.02em]"
              id="profile-heading"
            >
              Rex · Field
            </h2>
            <p className="mt-1 text-[16px] font-normal leading-[1.5] text-[#64748B]">
              Sourcing · Walkthroughs · Local market
            </p>
          </div>
        </motion.section>

        <motion.section
          animate="visible"
          aria-labelledby="numbers-heading"
          className="pt-8"
          initial="hidden"
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
          variants={reveal}
        >
          <h2 className="sr-only" id="numbers-heading">
            Your numbers
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            <StatCard label="Active TX deals" tone="primary" value={String(DEALS.length)} />
            <StatCard
              label="Walkthroughs to schedule"
              tone={WALKTHROUGHS.length ? "urgent" : "success"}
              value={String(WALKTHROUGHS.length - scheduled.length)}
            />
            <StatCard label="Docs in progress" tone="primary" value={String(DOCS.length)} />
            <StatCard label="Stalled deals" tone={stalled ? "urgent" : "success"} value={String(stalled)} />
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
          variants={reveal}
        >
          <section aria-labelledby="pipeline-heading" className="pt-8">
            <h2 className="sr-only" id="pipeline-heading">
              Deal pipeline
            </h2>
            <NavCard
              count={DEALS.length}
              icon={<LayersIcon size={20} strokeWidth={2.25} />}
              onClick={() => setPipelineOpen(true)}
              subtitle="Everything you are sourcing or chasing"
              title="Deal pipeline"
              tone="blue"
            />
          </section>

          <section aria-labelledby="walk-heading" className="pt-3">
            <h2 className="sr-only" id="walk-heading">
              Walkthroughs
            </h2>
            <NavCard
              count={WALKTHROUGHS.length - scheduled.length}
              icon={<ClipboardCheckIcon size={20} strokeWidth={2.25} />}
              onClick={() => setWalkOpen(true)}
              subtitle="Sellers waiting on a date from you"
              title="Walkthroughs to schedule"
              tone="orange"
            />
          </section>

          <section aria-labelledby="match-heading" className="pt-3">
            <h2 className="sr-only" id="match-heading">
              Buy-box matches
            </h2>
            <NavCard
              count={MATCHES.length - sent.length}
              icon={<SearchCheckIcon size={20} strokeWidth={2.25} />}
              onClick={() => setMatchOpen(true)}
              subtitle="Send to underwriting when they fit"
              title="Buy-box matches"
              tone="yellow"
            />
          </section>

          <section aria-labelledby="docs-heading" className="pt-3">
            <h2 className="sr-only" id="docs-heading">
              Documents
            </h2>
            <NavCard
              count={DOCS.length}
              icon={<FileTextIcon size={20} strokeWidth={2.25} />}
              onClick={() => setDocsOpen(true)}
              subtitle="What Ellery has moving, read only"
              title="Documents"
              tone="green"
            />
          </section>

          <section aria-labelledby="capture-heading" className="pt-8">
            <h2 className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]" id="capture-heading">
              Field capture
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <CaptureTile icon={<CameraIcon size={20} strokeWidth={2.25} />} label="Property photos and video" />
              <CaptureTile icon={<SearchCheckIcon size={20} strokeWidth={2.25} />} label="Inspection photos" />
              <CaptureTile icon={<KeyRoundIcon size={20} strokeWidth={2.25} />} label="Lockbox and access notes" />
            </div>
          </section>

          <section aria-labelledby="market-heading" className="pt-8">
            <h2 className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]" id="market-heading">
              Local market
            </h2>
            <div className="mt-4 rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_4px_12px_rgba(30,58,138,0.045)]">
              {MARKET.map((row) => (
                <div className="mb-4 last:mb-0" key={row.label}>
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-normal text-[#526176]">{row.label}</span>
                    <span className="text-[16px] font-semibold text-[#1A1A2E]">{row.value}</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#EEF2F6]">
                    <div className={`h-full rounded-full ${row.colour}`} style={{ width: `${row.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>

        <footer className="pt-10 text-center text-[16px] font-normal text-[#8291A5]">
          Able OS · V1 Build
        </footer>
      </main>

      {/* ── Panels ─────────────────────────────────────────────── */}

      <GateQueueModal
        count={stageDeals.length}
        eyebrow="Deal flow"
        onClose={() => setPipelineOpen(false)}
        open={pipelineOpen}
        title="Deal pipeline"
        toolbar={
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {STAGES.map((option) => (
              <button
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[16px] font-medium transition-colors ${
                  stage === option
                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                    : "border-[#DCE4EE] bg-white text-[#526176] hover:border-[#B7C7DC]"
                }`}
                key={option}
                onClick={() => setStage(option)}
                type="button"
              >
                {option} ({DEALS.filter((deal) => deal.stage === option).length})
              </button>
            ))}
          </div>
        }
      >
        <div className="space-y-3">
          {stageDeals.length === 0 && (
            <p className="text-[16px] font-normal text-[#8A99AC]">
              Nothing in this stage.
            </p>
          )}

          {stageDeals.map((deal) => (
            <article
              className="flex items-stretch gap-3 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_4px_12px_rgba(30,58,138,0.045)]"
              key={deal.id}
            >
              <span className={`w-1.5 shrink-0 ${deal.stalled ? "bg-[#D97706]" : "bg-[#418BFF]"}`} />
              <div className="min-w-0 flex-1 py-4 pr-4">
                <p className="text-[18px] font-bold leading-[1.35] text-[#1A1A2E]">{deal.name}</p>
                <p className="mt-1 text-[16px] font-normal text-[#8291A5]">{deal.city}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[14px] font-medium text-[#64748B]">
                    {deal.days} {deal.days === 1 ? "day" : "days"} in stage
                  </span>
                  {deal.stalled && (
                    <span className="rounded-full bg-[#D97706] px-2.5 py-0.5 text-[14px] font-medium text-white">
                      Stalled
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </GateQueueModal>

      <GateQueueModal
        count={WALKTHROUGHS.length - scheduled.length}
        eyebrow="Sellers waiting"
        onClose={() => setWalkOpen(false)}
        open={walkOpen}
        title="Walkthroughs to schedule"
      >
        <div className="space-y-3">
          {WALKTHROUGHS.map((item) => {
            const done = scheduled.includes(item.id);
            return (
              <article
                className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-5"
                key={item.id}
              >
                <p className="text-[18px] font-bold leading-[1.35] text-[#1A1A2E]">{item.name}</p>
                <p className="mt-1 text-[16px] font-normal leading-[1.5] text-[#8291A5]">{item.note}</p>
                <button
                  className={`mt-3 rounded-xl px-4 py-2.5 text-[16px] font-medium text-white transition-colors ${
                    done ? "bg-[#16A34A]" : "bg-[#1E3A8A] hover:bg-[#172F6E]"
                  }`}
                  disabled={done}
                  onClick={() => setScheduled((current) => [...current, item.id])}
                  type="button"
                >
                  {done ? "Scheduled" : "Schedule"}
                </button>
              </article>
            );
          })}
        </div>
      </GateQueueModal>

      <GateQueueModal
        count={MATCHES.length - sent.length}
        eyebrow="Fits the buy box"
        onClose={() => setMatchOpen(false)}
        open={matchOpen}
        title="Buy-box matches"
      >
        <div className="space-y-3">
          {MATCHES.map((item) => {
            const done = sent.includes(item.id);
            return (
              <article
                className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-5"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[18px] font-bold leading-[1.35] text-[#1A1A2E]">{item.name}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[14px] font-medium ${MATCH_STYLES[item.state]}`}>
                    {item.state}
                  </span>
                </div>
                <p className="mt-1 text-[16px] font-normal leading-[1.5] text-[#8291A5]">{item.note}</p>
                <button
                  className={`mt-3 rounded-xl px-4 py-2.5 text-[16px] font-medium text-white transition-colors ${
                    done ? "bg-[#16A34A]" : "bg-[#1E3A8A] hover:bg-[#172F6E]"
                  }`}
                  disabled={done}
                  onClick={() => setSent((current) => [...current, item.id])}
                  type="button"
                >
                  {done ? "Sent to underwriting" : "Send to underwriting"}
                </button>
              </article>
            );
          })}
        </div>
      </GateQueueModal>

      <GateQueueModal
        count={DOCS.length}
        eyebrow="Ellery owns every move"
        onClose={() => setDocsOpen(false)}
        open={docsOpen}
        title="Documents"
      >
        <div className="space-y-3">
          {DOCS.map((row) => (
            <article
              className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-5"
              key={row.id}
            >
              <p className="text-[18px] font-bold leading-[1.35] text-[#1A1A2E]">{row.deal}</p>
              <p className="mt-1 text-[16px] font-normal text-[#8291A5]">{row.doc}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[14px] font-medium ${DOC_STYLES[row.status]}`}>
                  {row.status}
                </span>
                <span className="text-[14px] font-medium text-[#64748B]">{row.age}</span>
              </div>
            </article>
          ))}
        </div>
      </GateQueueModal>
    </div>
  );
}

/* ── Subcomponents ────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "urgent" | "success";
}) {
  const tones = {
    primary: "text-[#418BFF] bg-[#EEF5FF]",
    urgent: "text-[#FF7832] bg-[#FFF1E9]",
    success: "text-[#16A34A] bg-[#EAF8EF]",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5">
      <p
        className={`inline-flex rounded-lg px-2.5 py-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] ${tones[tone]}`}
      >
        {value}
      </p>
      <p className="mt-2.5 text-[16px] font-normal leading-[1.4] text-[#718096]">
        {label}
      </p>
    </article>
  );
}

function CaptureTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      className="flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)]"
      type="button"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
        {icon}
      </span>
      <span className="text-[18px] font-medium leading-[1.4] text-[#1A1A2E]">
        {label}
      </span>
    </button>
  );
}