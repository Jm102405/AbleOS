import React from 'react';
import { MailIcon, MapPinIcon, ShieldCheckIcon } from 'lucide-react';

const items = [
{
  Icon: MailIcon,
  label: 'Email Deals To',
  body:
  <a
    href="mailto:underwriting@ablebuyshomes.com"
    className="break-all text-base font-medium text-brand-ink transition-colors duration-200 ease-out hover:text-brand-blue">
    
        underwriting@ablebuyshomes.com
      </a>

},
{
  Icon: MapPinIcon,
  label: 'Where We Buy',
  body: <p className="text-base font-medium text-brand-ink">Arkansas · Texas</p>
},
{
  Icon: ShieldCheckIcon,
  label: 'Brokers',
  body: <p className="text-base font-medium text-brand-ink">Protected on every deal</p>
}];


export function ContactStrip() {
  return (
    <section className="bg-brand-cream">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid divide-y divide-brand-ink/10 md:grid-cols-3 md:divide-x md:divide-y-0">
          {items.map(({ Icon, label, body }) =>
          <div
            key={label}
            className="flex flex-col items-center gap-4 pt-8 text-center first:pt-0 md:px-6 md:pt-0">
            
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white text-brand-blue shadow-[0_10px_24px_-14px_rgba(22,78,124,0.8)]">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-brand-ink/45">
                  {label}
                </p>
                {body}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}