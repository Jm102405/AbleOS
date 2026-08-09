import React from "react";
import { ChevronRightIcon } from "lucide-react";

export type NavCardTone = "blue" | "green" | "orange" | "yellow";

const TONES: Record<NavCardTone, { icon: string; badge: string }> = {
  blue: {
    icon: "bg-[#EEF5FF] text-[#418BFF]",
    badge: "bg-[#EEF5FF] text-[#418BFF]",
  },
  green: {
    icon: "bg-[#EAF8EF] text-[#16A34A]",
    badge: "bg-[#EAF8EF] text-[#16A34A]",
  },
  orange: {
    icon: "bg-[#FFF1E9] text-[#FF7832]",
    badge: "bg-[#FFF1E9] text-[#FF7832]",
  },
  yellow: {
    icon: "bg-[#FEF9C3] text-[#CA8A04]",
    badge: "bg-[#FEF9C3] text-[#CA8A04]",
  },
};

/** Standalone card. */
const CARD_SHELL =
  "rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5";

/** A row inside a shared container - the container owns the border. */
const ROW_SHELL = "px-4 py-4 transition-colors hover:bg-[#F8FAFC] sm:px-5";

type NavCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Null while loading. */
  count: number | null;
  tone: NavCardTone;
  onClick: () => void;
  /**
   * Optional control sitting between the text and the count, e.g. a New
   * button. When set the card becomes a div wrapping separate buttons - a
   * button inside a button is invalid HTML and breaks keyboard navigation.
   */
  action?: React.ReactNode;
  variant?: "card" | "row";
  /** Hairline above the row. Skip it on the first row of a group. */
  divider?: boolean;
};

export function NavCard({
  icon,
  title,
  subtitle,
  count,
  tone,
  onClick,
  action,
  variant = "card",
  divider = false,
}: NavCardProps) {
  const styles = TONES[tone];

  const shell =
    variant === "row"
      ? `${ROW_SHELL}${divider ? " border-t border-[#F1F5F9]" : ""}`
      : CARD_SHELL;

  const leading = (
    <>
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${styles.icon}`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] font-medium leading-snug text-[#8291A5] sm:text-[12px]">
          {subtitle}
        </span>
      </span>
    </>
  );

  const trailing = (
    <>
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${styles.badge}`}
      >
        {count === null ? "..." : count}
      </span>

      <ChevronRightIcon
        aria-hidden="true"
        className="shrink-0 text-[#C3CEDC]"
        size={16}
        strokeWidth={2.5}
      />
    </>
  );

  if (action) {
    return (
      <div className={`${shell} flex items-center gap-3`}>
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={onClick}
          type="button"
        >
          {leading}
        </button>

        {action}

        {/* Mouse convenience only. The first button already covers keyboard
            and screen reader access, so this one stays out of the tab order. */}
        <button
          aria-hidden="true"
          className="flex shrink-0 items-center gap-2"
          onClick={onClick}
          tabIndex={-1}
          type="button"
        >
          {trailing}
        </button>
      </div>
    );
  }

  return (
    <button
      className={`${shell} flex w-full items-center gap-3 text-left`}
      onClick={onClick}
      type="button"
    >
      {leading}
      {trailing}
    </button>
  );
}
