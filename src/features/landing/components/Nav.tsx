import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowButton } from './ArrowButton';

const links = [
{ href: '#buybox', label: 'What We Buy' },
{ href: '#how', label: 'How We Buy' },
{ href: '#process', label: 'Process' }];


export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5">
      
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-full pl-3 pr-3 transition-[background-color,box-shadow,backdrop-filter,padding] duration-200 ease-out ${
        scrolled ?
        'bg-white/80 py-2 shadow-[0_14px_40px_-22px_rgba(22,78,124,0.55)] backdrop-blur-xl' :
        'bg-transparent py-3'}`
        }>
        
        <a href="#top" className="flex items-center gap-2.5" aria-label="Able Buys Homes home">
          <img
            src="https://res.cloudinary.com/cbtr8kq0/image/upload/f_auto,q_auto,w_96/v1786627436/Gradient_Icon_Map_Navigation_App_Logo.png"
            alt=""
            className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-[0_8px_20px_-10px_rgba(14,26,36,0.6)]" />
          
          <span className="font-display text-base font-extrabold leading-none tracking-tight text-brand-ink sm:text-lg">
            ABLE <span className="text-brand-blue">BUYS HOMES</span>
          </span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {links.map((l) =>
          <a
            key={l.href}
            href={l.href}
            className="group relative text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-brand-ink/70 transition-colors duration-200 ease-out hover:text-brand-ink">
            
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full bg-brand-blue transition-[width] duration-200 ease-out group-hover:w-full" />
            </a>
          )}
        </div>

        <ArrowButton href="#submit" size="sm" variant="dark">
          Submit a Deal
        </ArrowButton>
      </div>
    </motion.nav>);

}