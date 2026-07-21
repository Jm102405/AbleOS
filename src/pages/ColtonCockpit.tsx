import React from "react";
import { motion } from "framer-motion";
import { BellIcon, CheckIcon } from "lucide-react";

type ChecklistItem = {
  label: string;
  done: boolean;
};

const checklistItems: ChecklistItem[] = [
  { label: "Insulation photo uploaded", done: false },
  { label: "Drywall photo uploaded", done: false },
  { label: "Paint photo uploaded", done: false },
  { label: "Submit for Jeremiah's approval", done: false },
];

const phaseDots = [
  { color: "#16A34A" },
  { color: "#F59E0B" },
  { color: "#CBD5E1" },
  { color: "#CBD5E1" },
];

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function ColtonCockpit() {
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
                C
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            ABLE OS · Executive workspace
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Colton&apos;s Cockpit
          </h1>
          <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
            Phase progress and checklist for your current build.
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
                Colton · Sunflower Builders
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B] sm:text-[12px]">
                HTM Duplex — Side A
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          animate="visible"
          aria-labelledby="phase-heading"
          className="pt-8 text-center"
          initial="hidden"
          transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
          variants={reveal}
        >
          <span className="text-[68px] font-extrabold leading-[0.8] tracking-[-0.075em] text-[#FF7832] sm:text-[80px] lg:text-[92px]">
            2/4
          </span>
          <h2
            className="mt-2 text-[16px] font-extrabold tracking-[-0.02em] text-[#1A1A2E] sm:text-[18px]"
            id="phase-heading"
          >
            Ready to Lay Flooring
          </h2>

          <div className="mt-4 flex items-center justify-center gap-2">
            {phaseDots.map((dot, index) => (
              <span
                key={index}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dot.color }}
              />
            ))}
          </div>
        </motion.section>

        <motion.section
          animate="visible"
          className="pt-6"
          initial="hidden"
          transition={{ delay: 0.12, duration: 0.35, ease: "easeOut" }}
          variants={reveal}
        >
          <div className="rounded-2xl border border-[#FF7832] bg-[#1A1A2E] px-5 py-4 text-center">
            <p className="text-[12px] font-extrabold uppercase tracking-[0.04em] text-[#FF7832] sm:text-[13px]">
              No photo, no next stage, no draw.
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/85 sm:text-[12px]">
              Upload phase-complete photos before requesting advance.
            </p>
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.18, duration: 0.38, ease: "easeOut" }}
          variants={reveal}
        >
          <section aria-labelledby="checklist-heading" className="pt-9">
            <SectionHeading id="checklist-heading">
              This phase&apos;s checklist
            </SectionHeading>
            <div className="mt-4 space-y-3">
              {checklistItems.map((item) => (
                <ChecklistRow
                  key={item.label}
                  label={item.label}
                  done={item.done}
                />
              ))}
            </div>
          </section>

          <section aria-labelledby="escalate-heading" className="pt-9">
            <SectionHeading id="escalate-heading">
              Escalate only for
            </SectionHeading>
            <div className="mt-4 rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
              <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                Hidden damage · safety issue · budget overage — iMessage
                Jeremiah directly. Everything else stays in Notion.
              </p>
            </div>
          </section>
        </motion.div>

        <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
          Able OS · V1 Build
        </footer>
      </main>
    </div>
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
