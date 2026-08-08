import React from "react";
import { ChevronRightIcon } from "lucide-react";

export type NavCardTone = "blue" | "green" | "orange";

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
};

type NavCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** Null while loading. */
  count: number | null;
  tone: NavCardTone;
  onClick: () => void;
};

export function NavCard({
  icon,
  title,
  subtitle,
  count,
  tone,
  onClick,
}: NavCardProps) {
  const styles = TONES[tone];

  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5"
      onClick={onClick}
      type="button"
    >
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
    </button>
  );
}
