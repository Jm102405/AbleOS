import React from "react";
import { motion } from "framer-motion";
import { BellIcon, CheckIcon } from "lucide-react";

type ChecklistItem = {
  label: string;
  done: boolean;
};

const leasingItems: ChecklistItem[] = [
  { label: "Unit 2 — listed Zillow + FB Marketplace", done: true },
  { label: "Unit 7 — listed", done: true },
  { label: "Unit 8 — photos pending", done: false },
  { label: "Unit 12 — Craigslist post pending", done: false },
];

const lockdownItems: ChecklistItem[] = [
  { label: "Notion — 2FA confirmed", done: true },
  { label: "Doppler — admin audit pending", done: false },
  { label: "Shared password rotation", done: false },
];

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function KarenCockpit() {
  return (
    <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
      <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
        <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5 sm:max-w-2xl sm:px-8 sm:pb-10 sm:pt-6 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1A1A1A] text-lg font-extrabold shadow-sm">
              A
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="View notifications"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3B82C4]"
                type="button"
              >
                <BellIcon aria-hidden="true" size={17} strokeWidth={2.25} />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 bg-[#1E3A8A] text-xs font-extrabold">
                K
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            ABLE OS · Executive workspace
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Karen&apos;s Cockpit
          </h1>
          <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
            Weekly load, leasing, and account security status.
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
          <div className="flex items-center justify-between gap-4 px-5 py-4 pl-6 sm:px-7 sm:py-5 sm:pl-8">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                Personal dashboard
              </p>
              <h2
                className="mt-1 text-[16px] font-extrabold tracking-[-0.025em] sm:text-[18px]"
                id="profile-heading"
              >
                Karen Grant
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B] sm:text-[12px]">
                Leasing · Account security · Operations
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          animate="visible"
          aria-labelledby="week-heading"
          className="pt-8"
          initial="hidden"
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
          variants={reveal}
        >
          <div className="mt-1 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
            <InsightCard label="Units rent-ready" value="4" tone="success" />
            <InsightCard label="Accounts to verify" value="3" tone="critical" />
            <InsightCard label="83(b) — you file" value="22d" tone="critical" />
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
          variants={reveal}
        >
          <section aria-labelledby="leasing-heading" className="pt-9">
            <SectionHeading id="leasing-heading">
              Hometown Meadows leasing
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {leasingItems.map((item) => (
                <ChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="lockdown-heading" className="pt-9">
            <SectionHeading id="lockdown-heading">
              Account lock-down
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {lockdownItems.map((item) => (
                <ChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="reminder-heading" className="pt-9">
            <SectionHeading id="reminder-heading">Reminder</SectionHeading>
            <article className="mt-4 flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5">
              <div className="h-9 w-1 shrink-0 rounded-full bg-[#FF7832]" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                  83(b) election — file by Jul 30
                </h3>
                <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                  Certified Mail w/ Return Receipt, copy Mooni within 5 days
                </p>
              </div>
            </article>
          </section>
        </motion.div>

        <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
          Able OS · V1 Build
        </footer>
      </main>
    </div>
  );
}

type InsightCardProps = {
  label: string;
  value: string;
  tone: "critical" | "success";
};

function InsightCard({ label, value, tone }: InsightCardProps) {
  const tones = {
    critical: "text-[#FF7832] bg-[#FFF1E9]",
    success: "text-[#16A34A] bg-[#EAF8EF]",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 text-center shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5">
      <p
        className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-[24px] font-extrabold leading-none tracking-[-0.06em] sm:text-[27px] ${tones[tone]}`}
      >
        {value}
      </p>
      <p className="mt-3 text-[9px] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#718096] sm:text-[10px]">
        {label}
      </p>
    </article>
  );
}

type SectionHeadingProps = {
  id: string;
  children: React.ReactNode;
};

function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
      id={id}
    >
      {children}
    </h2>
  );
}

type ChecklistRowProps = {
  label: string;
  done: boolean;
};

function ChecklistRow({ label, done }: ChecklistRowProps) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5">
      {done ? (
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#16A34A] text-white">
          <CheckIcon aria-hidden="true" size={14} strokeWidth={3} />
        </span>
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-md border-2 border-[#93A3B8]" />
      )}
      <p
        className={`text-[13px] font-bold leading-snug sm:text-[14px] ${
          done ? "text-[#93A3B8] line-through" : "text-[#1A1A2E]"
        }`}
      >
        {label}
      </p>
    </article>
  );
}
