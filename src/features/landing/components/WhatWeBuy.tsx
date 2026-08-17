import React from 'react';
import { motion } from 'framer-motion';
import {
  CaravanIcon,
  TruckIcon,
  Building2Icon,
  HousePlusIcon,
  HomeIcon,
  HeartPulseIcon } from
'lucide-react';
import { buyBox } from '../data/buyBox';
import { ArrowButton } from './ArrowButton';

const icons = [TruckIcon, CaravanIcon, Building2Icon, HousePlusIcon, HomeIcon, HeartPulseIcon];

const ease = [0.23, 1, 0.32, 1] as const;

type WhatWeBuyProps = {
  onPick: (asset: string) => void;
};

export function WhatWeBuy({ onPick }: WhatWeBuyProps) {
  return (
    <section id="buybox" className="pb-24 pt-6">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.45, ease }}>
            
            <span className="mb-3 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-brand-blue">
              What We Buy
            </span>
            <h2 className="text-3xl font-extrabold leading-[1.05] tracking-[-0.02em] text-brand-ink md:text-[3.1rem]">
              The Buy Box
            </h2>
            <p className="mt-5 max-w-[58ch] text-base text-brand-ink/70 md:text-lg">
              Click any box to submit that deal type — it goes straight to our underwriting desk.
              Owners, brokers, and wholesalers all welcome. Brokers protected.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease }}
            className="group relative overflow-hidden rounded-[32px] border border-white shadow-[0_30px_70px_-40px_rgba(22,78,124,0.6)]">
            
            <img
              src="/9693f907-5783-49a3-9030-88a9c839496c.jpg"
              alt="Aerial view of a crystal lagoon resort community with homes, beach club, and event barn"
              loading="lazy"
              className="h-[240px] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] lg:h-[300px]" />
            
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deep/35 to-transparent" />
          </motion.div>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {buyBox.map((item, i) => {
            const Icon = icons[i];
            return (
              <motion.div
                key={item.asset}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: i % 3 * 0.06, ease }}
                className="group flex flex-col gap-4 rounded-[26px] bg-white p-7 shadow-[0_18px_44px_-30px_rgba(22,78,124,0.5)] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_26px_60px_-30px_rgba(22,78,124,0.55)]">
                
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-haze text-brand-deep transition-colors duration-200 ease-out group-hover:bg-brand-azure group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="text-lg font-bold text-brand-ink">{item.title}</h3>
                <ul className="flex flex-1 flex-col gap-2.5">
                  {item.points.map((p) =>
                  <li key={p} className="relative pl-5 text-sm text-brand-ink/65">
                      <span className="absolute left-0 top-[0.55em] h-1.5 w-1.5 rounded-full bg-brand-azure" />
                      {p}
                    </li>
                  )}
                </ul>
                <div className="mt-auto pt-2">
                  <ArrowButton size="sm" variant="dark" onClick={() => onPick(item.asset)}>
                    Submit This Deal
                  </ArrowButton>
                </div>
              </motion.div>);

          })}
        </div>
      </div>
    </section>);

}