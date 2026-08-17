import React from 'react';
import { motion } from 'framer-motion';
import { structures } from '../data/buyBox';

const markets = ['Florida — statewide', 'Arkansas', 'Texas'];

const ease = [0.23, 1, 0.32, 1] as const;

export function HowWeBuy() {
  return (
    <section id="how" className="px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-brand-deep px-6 py-20 sm:rounded-[48px] sm:px-12">
        <div className="pointer-events-none absolute -right-24 -top-32 h-[520px] w-[520px] animate-drift rounded-full bg-brand-azure/35 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />

        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease }}
            className="max-w-[62ch]">
            
            <span className="mb-3 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-brand-sky">
              How We Buy
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.08] tracking-[-0.02em] text-white md:text-[2.9rem]">
              Creative Structures Are the Specialty
            </h2>
            <p className="mt-5 max-w-[58ch] text-base text-white/75 md:text-lg">
              We bring capital, speed, and flexible deal structuring to the table to get deals across
              the finish line — including the ones traditional buyers walk away from.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {structures.map((s, i) =>
            <motion.div
              key={s.tag}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4, delay: i * 0.06, ease }}
              className="rounded-[24px] border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 ease-out hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.12]">
              
                <span className="mb-4 inline-block rounded-full bg-brand-sky px-3 py-1 font-display text-[0.68rem] font-bold uppercase tracking-[0.14em] text-brand-deep">
                  {s.tag}
                </span>
                <h3 className="mb-2 text-base font-bold text-white">{s.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{s.desc}</p>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, ease }}
            className="mt-14 flex flex-wrap items-center gap-3.5 border-t border-white/15 pt-10">
            
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/50">
              Where We Buy
            </span>
            {markets.map((m) =>
            <span
              key={m}
              className="rounded-full border border-white/25 bg-white/10 px-4 py-2 font-display text-sm font-bold text-white">
              
                {m}
              </span>
            )}
            <p className="mt-2 w-full text-sm text-white/50">
              California considered for NNN-leased assets with a nonprofit or long-term credit tenant
              in place.
            </p>
          </motion.div>
        </div>
      </div>
    </section>);

}