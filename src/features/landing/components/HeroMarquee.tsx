import React from 'react';
import { motion } from 'framer-motion';
import { showcase } from '../data/heroShowcase';

const loop = [...showcase, ...showcase];

const edgeMask =
'linear-gradient(to right, transparent 0%, #000 8%, #000 92%, transparent 100%)';

export function HeroMarquee() {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ maskImage: edgeMask, WebkitMaskImage: edgeMask }}>
      
      <motion.ul
        className="flex w-max gap-5 px-5"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 46, ease: 'linear', repeat: Infinity }}>
        
        {loop.map((item, i) =>
        <li
          key={`${item.label}-${i}`}
          className="group relative aspect-[3/4] w-[230px] shrink-0 overflow-hidden rounded-[28px] border border-white/70 bg-brand-mist shadow-[0_24px_60px_-30px_rgba(22,78,124,0.65)] transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1.5 sm:w-[280px] lg:w-[320px]">
          
            <img
            src={item.src}
            alt={item.label}
            loading={i < 3 ? 'eager' : 'lazy'}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]" />
          
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/90 via-brand-ink/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6">
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                Buying Now
              </span>
              <h3 className="font-display text-xl font-extrabold leading-tight text-white">
                {item.label}
              </h3>
              <p className="mt-1 text-[0.8rem] text-white/75">{item.meta}</p>
            </div>
          </li>
        )}
      </motion.ul>
    </div>);

}