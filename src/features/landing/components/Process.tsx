import React from 'react';
import { motion } from 'framer-motion';
import { processSteps } from '../data/buyBox';

const ease = [0.23, 1, 0.32, 1] as const;

export function Process() {
  return (
    <section id="process" className="py-24">
      <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-[0.85fr_1fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5, ease }}
          className="group relative overflow-hidden rounded-[36px] border border-white shadow-[0_36px_80px_-46px_rgba(22,78,124,0.7)] lg:sticky lg:top-28">
          
          <img
            src="/98410476-4612-47e1-b41f-85ffa91a760a.jpg"
            alt="Luxury living room overlooking the ocean"
            loading="lazy"
            className="h-[320px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] lg:h-[560px]" />
          
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-ink/25 to-transparent" />
        </motion.div>

        <div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease }}>
            
            <span className="mb-3 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-brand-blue">
              Process
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-brand-ink md:text-[3.1rem]">
              Submission to LOI, Fast
            </h2>
          </motion.div>

          <ol className="relative mt-12">
            <span
              aria-hidden="true"
              className="absolute left-[19px] top-2 bottom-2 w-px bg-brand-ink/10" />
            
            {processSteps.map((step, i) =>
            <motion.li
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease }}
              className="relative flex gap-6 pb-10 last:pb-0">
              
                <span className="relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-ink font-display text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <div className="pt-1">
                  <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-[0.16em] text-brand-blue">
                    Step {i + 1}
                  </span>
                  <h3 className="mb-1.5 text-lg font-bold text-brand-ink">{step.title}</h3>
                  <p className="max-w-[46ch] text-sm leading-relaxed text-brand-ink/65">
                    {step.desc}
                  </p>
                </div>
              </motion.li>
            )}
          </ol>
        </div>
      </div>
    </section>);

}