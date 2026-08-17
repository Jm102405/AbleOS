import React from 'react';

const quickLinks = [
{ href: '#buybox', label: 'What We Buy' },
{ href: '#how', label: 'How We Buy' },
{ href: '#process', label: 'Process' },
{ href: '#submit', label: 'Submit a Deal' }];


export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-brand-ink pb-10 pt-20 text-white">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand-deep/50 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-16 grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <img
                src="https://res.cloudinary.com/cbtr8kq0/image/upload/f_auto,q_auto,w_96/v1786627436/Gradient_Icon_Map_Navigation_App_Logo.png"
                alt=""
                className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]" />
              
              <span className="font-display text-xl font-extrabold tracking-tight">
                ABLE <span className="text-brand-sky">BUYS HOMES</span>
              </span>
            </div>
            <p className="max-w-sm text-lg text-white/65">
              We close deals others can't. Creative financing specialists — direct buyer of mobile
              home parks, RV parks, multifamily, single-family portfolios, and care facilities.
            </p>
          </div>

          <div>
            <h4 className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/45">
              Quick Links
            </h4>
            <ul className="space-y-4 text-white/70">
              {quickLinks.map((l) =>
              <li key={l.href}>
                  <a
                  href={l.href}
                  className="transition-colors duration-200 ease-out hover:text-brand-sky">
                  
                    {l.label}
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-white/45">
              Contact
            </h4>
            <ul className="space-y-4 text-white/70">
              <li>
                <a
                  href="mailto:underwriting@ablebuyshomes.com"
                  className="break-all transition-colors duration-200 ease-out hover:text-brand-sky">
                  
                  underwriting@ablebuyshomes.com
                </a>
              </li>
              <li>Arkansas · Texas</li>
              <li>Same-day response on every deal</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/45 md:flex-row">
          <p>
            © 2026 Able Buys Homes. Creative financing specialists — direct buyer of mobile home
            parks, RV parks, multifamily, single-family portfolios, and care facilities in Arkansas
            and Texas.
          </p>
        </div>
      </div>
    </footer>);

}