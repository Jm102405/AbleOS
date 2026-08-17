import React from 'react';
import { ArrowRightIcon } from 'lucide-react';

type Variant = 'dark' | 'light' | 'ghost';

type ArrowButtonProps = {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

const shells: Record<Variant, string> = {
  dark: 'bg-brand-ink text-white hover:shadow-[0_14px_32px_-10px_rgba(14,26,36,0.55)]',
  light:
  'bg-white text-brand-ink border border-brand-ink/[0.08] hover:shadow-[0_14px_32px_-12px_rgba(22,78,124,0.35)]',
  ghost:
  'bg-transparent text-brand-ink border border-brand-ink/20 hover:border-brand-ink/45 hover:bg-white/50'
};

const dots: Record<Variant, string> = {
  dark: 'bg-white text-brand-ink',
  light: 'bg-brand-ink text-white',
  ghost: 'bg-brand-ink text-white'
};

export function ArrowButton({
  children,
  href,
  onClick,
  type = 'button',
  variant = 'dark',
  disabled,
  fullWidth,
  size = 'md',
  className = ''
}: ArrowButtonProps) {
  const pad = size === 'sm' ? 'pl-5 pr-1.5 py-1.5 text-[0.82rem]' : 'pl-7 pr-2 py-2 text-[0.95rem]';
  const dot = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';

  const classes = [
  'group inline-flex items-center justify-between gap-4 rounded-full font-display font-bold',
  'transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out',
  'hover:-translate-y-0.5 active:translate-y-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2',
  shells[variant],
  pad,
  fullWidth ? 'w-full' : '',
  disabled ? 'opacity-60 pointer-events-none' : '',
  className].
  join(' ');

  const inner =
  <>
      <span className="whitespace-nowrap">{children}</span>
      <span className={`grid shrink-0 place-items-center rounded-full ${dot} ${dots[variant]}`}>
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
      </span>
    </>;


  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {inner}
      </a>);

  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {inner}
    </button>);

}