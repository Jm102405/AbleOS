import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { HeroMarquee } from './HeroMarquee';
import { ArrowButton } from './ArrowButton';
import { rotatingAssets } from '../data/heroShowcase';

const stats = [
{ n: 'Same-Day', l: 'Response on every deal' },
{ n: '24 Hours', l: 'To underwrite your numbers' },
{ n: 'Up to 50%', l: 'Down to close' }];


const ease = [0.23, 1, 0.32, 1] as const;

export function Hero() {
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start']
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['14%', '-16%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1.06, 1]);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % rotatingAssets.length),
      2600
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <section id="top" ref={sectionRef} className="relative">
      <div className="sky-panel relative overflow-hidden rounded-b-[40px] pt-36 sm:rounded-b-[64px] sm:pt-40">
        {/* soft cloud light */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[620px] w-[1100px] -translate-x-1/2 animate-drift rounded-full bg-white/45 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/4 -left-40 h-[420px] w-[520px] animate-drift rounded-full bg-white/30 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />

        <motion.div
          style={{ y: copyY, opacity: copyOpacity }}
          className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2.5 rounded-full border border-white/70 bg-white/60 px-4 py-2 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-brand-deep backdrop-blur-md sm:text-[0.7rem]">
            
            <span className="relative flex h-[7px] w-[7px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-70" />
              <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-brand-blue" />
            </span>
            Creative Financing Specialists · Active in AR · FL · TX
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease }}
            className="mt-7 text-[2.85rem] font-extrabold leading-[0.98] tracking-[-0.03em] text-brand-ink sm:text-[4.2rem] lg:text-[5.4rem]">
            
            We Close Deals <span className="text-brand-deep">Others Can't.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.16, ease }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-display text-lg font-semibold sm:text-xl">
            
            <span className="text-brand-ink/55">Now buying</span>
            <span className="relative inline-flex h-[1.6em] min-w-[13ch] items-center justify-center overflow-hidden sm:min-w-[16ch]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingAssets[index]}
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: '0%', opacity: 1 }}
                  exit={{ y: '-100%', opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="absolute whitespace-nowrap text-brand-deep">
                  
                  {rotatingAssets[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease }}
            className="mx-auto mt-7 max-w-[62ch] text-base leading-relaxed text-brand-ink/70 sm:text-lg">
            
            Able Buys Homes is a direct buyer of mobile home parks, RV parks, multifamily,
            single-family portfolios, and care facilities. Seller financing, subject-to, and hybrid
            structures are our specialty — we don't rely on traditional bank timelines.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.26, ease }}
            className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            
            <ArrowButton href="#buybox" variant="dark">
              See What We Buy
            </ArrowButton>
            <ArrowButton href="#submit" variant="light">
              Submit a Deal
            </ArrowButton>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.34 } } }}
            className="mt-14 flex flex-wrap items-start justify-center gap-x-14 gap-y-6">
            
            {stats.map((s) =>
            <motion.div
              key={s.n}
              variants={{
                hidden: { opacity: 0, y: 12 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease } }
              }}>
              
                <dt className="font-display text-2xl font-extrabold text-brand-deep">{s.n}</dt>
                <dd className="text-sm text-brand-ink/60">{s.l}</dd>
              </motion.div>
            )}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="relative z-0 -mt-8 overflow-hidden sm:-mt-4">
          
          <motion.div style={{ y: imageY, scale: imageScale }} className="origin-bottom will-change-transform">
            <img
              src="/hero_section.png"
              alt="Modern luxury hillside residence above the clouds at dusk"
              className="h-[48vw] max-h-[660px] min-h-[300px] w-full object-cover object-center" />
            
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease }}
        className="relative z-10 -mt-14 pb-24 sm:-mt-20">
        
        <HeroMarquee />
      </motion.div>
    </section>);

}