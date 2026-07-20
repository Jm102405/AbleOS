import React from 'react';
import { motion } from 'framer-motion';
import { BellIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

type Decision = {
  title: string;
  detail: string;
};

const decisions: Decision[] = [
{
  title: 'DEC-63 · Madewell/Webber Tier split ruling',
  detail: '63 properties · Rex chasing payoff + lease status'
},
{
  title: 'DEC-64 · ABLE OS ↔ Main Brain integration',
  detail: "Open per Dane's audit"
},
{
  title: 'DEC-65 · GitHub org creation',
  detail: 'Lane 2 · Dane flagged, needs go-ahead'
}];


const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 }
};

export function RishiCockpit() {
  return (
    <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
      <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
        <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5">
          <div className="flex items-center justify-between">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1A1A1A] text-lg font-extrabold shadow-sm">
              A
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="View notifications"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/15 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3B82C4]"
                type="button">
                
                <BellIcon aria-hidden="true" size={17} strokeWidth={2.25} />
              </button>
              <div className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 bg-[#1E3A8A] text-xs font-extrabold">
                R
              </div>
            </div>
          </div>

          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            ABLE OS · Executive workspace
          </p>
          <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em]">
            Rishi&apos;s Cockpit
          </h1>
          <p className="mt-2 text-[13px] font-medium text-white/85">
            A clear view of today&apos;s decisions and operating load.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[428px] px-5 pb-10">
        <motion.section
          animate="visible"
          aria-labelledby="profile-heading"
          className="relative -mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
          initial="hidden"
          transition={{ duration: 0.35, ease: 'easeOut' }}
          variants={reveal}>
          
          <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3A8A]" />
          <div className="flex items-center justify-between gap-4 px-5 py-4 pl-6">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                Personal dashboard
              </p>
              <h2 className="mt-1 text-[16px] font-extrabold tracking-[-0.025em]" id="profile-heading">
                Rishi · CEO
              </h2>
              <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B]">
                Vision · Acquisitions · Capital · Partnerships
              </p>
            </div>
            <button
              aria-label="Open profile options"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[#3B82C4] transition-colors hover:bg-[#E3EDF8] focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2"
              type="button">
              
              <MoreHorizontalIcon aria-hidden="true" size={18} />
            </button>
          </div>
        </motion.section>

        <motion.section
          animate="visible"
          aria-labelledby="queue-heading"
          className="pt-8"
          initial="hidden"
          transition={{ delay: 0.08, duration: 0.35, ease: 'easeOut' }}
          variants={reveal}>
          
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#3B82C4]">
            Your priority queue
          </p>
          <div className="mt-2 flex items-end gap-4">
            <span className="text-[68px] font-extrabold leading-[0.8] tracking-[-0.075em] text-[#418BFF]">3</span>
            <h2 className="max-w-[245px] pb-1 text-[14px] font-medium leading-[1.45] text-[#526176]" id="queue-heading">
              Decisions are waiting for your call. Nothing moves until you rule.
            </h2>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <StatCard label="Deals in pipe" value="12" tone="primary" />
            <StatCard label="Gate stalled" value="1" tone="urgent" />
            <StatCard label="83(b) deadline" value="22d" tone="urgent" />
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.16, duration: 0.38, ease: 'easeOut' }}
          variants={reveal}>
          
          <section aria-labelledby="decisions-heading" className="pt-9">
            <SectionHeading id="decisions-heading" number="01">Decisions awaiting you</SectionHeading>
            <div className="mt-4 space-y-3">
              {decisions.map((decision) =>
              <article
                className="group flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)]"
                key={decision.title}>
                
                  <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E]">
                      {decision.title}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90]">{decision.detail}</p>
                  </div>
                  <ChevronRightIcon aria-hidden="true" className="shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5" size={18} />
                </article>
              )}
            </div>
          </section>

          <section aria-labelledby="karen-heading" className="pt-9">
            <SectionHeading id="karen-heading" number="02">Karen&apos;s load</SectionHeading>
            <article className="mt-4 rounded-2xl border border-[#DCE4EE] bg-white p-5 shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-[15px] font-extrabold tracking-[-0.02em]">Karen Grant</h3>
                  <p className="mt-1 text-[11px] font-medium text-[#6B7A90]">Current weekly allocation</p>
                </div>
                <p className="shrink-0 text-right">
                  <span className="text-[25px] font-extrabold tracking-[-0.05em] text-[#418BFF]">32</span>
                  <span className="ml-1 text-[11px] font-bold text-[#6B7A90]">/ 40 hrs</span>
                </p>
              </div>
              <div aria-label="Karen's capacity: 32 of 40 hours" aria-valuemax={40} aria-valuemin={0} aria-valuenow={32} className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#E8EDF3]" role="progressbar">
                <motion.div
                  animate={{ width: '80%' }}
                  className="h-full rounded-full bg-[#3B82C4]"
                  initial={{ width: 0 }}
                  transition={{ delay: 0.38, duration: 0.55, ease: 'easeOut' }} />
                
              </div>
              <div className="mt-3 flex justify-between text-[10px] font-bold uppercase tracking-[0.09em] text-[#8A99AC]">
                <span>Available</span><span>8 hours</span>
              </div>
            </article>
          </section>

          <section aria-labelledby="open-items-heading" className="pt-9">
            <SectionHeading id="open-items-heading" number="03">Open items</SectionHeading>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_5px_14px_rgba(30,58,138,0.055)]">
              <OpenItem label="83(b) elections" status="Jul 30" tone="urgent" />
              <OpenItem label="WF-DEAL-12 inactive" status="Dane E2E" tone="neutral" />
            </div>
          </section>
        </motion.div>

        <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
          Able OS · V1 Build
        </footer>
      </main>
    </div>);

}

type StatCardProps = {
  value: string;
  label: string;
  tone: 'primary' | 'urgent';
};

function StatCard({ value, label, tone }: StatCardProps) {
  const tones = {
    primary: 'text-[#418BFF] bg-[#EEF5FF]',
    urgent: 'text-[#FF7832] bg-[#FFF1E9]'
  };

  return (
    <article className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)]">
      <p className={`inline-flex rounded-lg px-2 py-1 text-[24px] font-extrabold leading-none tracking-[-0.06em] ${tones[tone]}`}>{value}</p>
      <p className="mt-3 text-[9px] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#718096]">{label}</p>
    </article>);

}

type SectionHeadingProps = {
  number: string;
  id: string;
  children: React.ReactNode;
};

function SectionHeading({ number, id, children }: SectionHeadingProps) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#1E3A8A] text-[10px] font-extrabold tracking-wide text-white">{number}</span>
      <h2 className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E]" id={id}>{children}</h2>
    </div>);

}

type OpenItemProps = {
  label: string;
  status: string;
  tone: 'urgent' | 'neutral';
};

function OpenItem({ label, status, tone }: OpenItemProps) {
  const statusStyle = tone === 'urgent' ? 'bg-[#FFF1E9] text-[#D95717]' : 'bg-[#EEF2F6] text-[#526176]';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#E6ECF2] px-5 py-4 last:border-b-0">
      <p className="text-[13px] font-bold text-[#1A1A2E]">{label}</p>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${statusStyle}`}>{status}</span>
    </div>);

}