type KpiTileProps = {
  label: string;
  value: string;
  tone: "primary" | "urgent" | "neutral";
  /** When set, the tile becomes a link that opens in a new tab. */
  href?: string;
  /** When set, the tile becomes a button that opens something in-app. */
  onClick?: () => void;
};

export function KpiTile({ label, value, tone, href, onClick }: KpiTileProps) {
  const valueStyle = {
    primary: "text-[#418BFF]",
    urgent: "text-[#D95717]",
    neutral: "text-[#1A1A2E]",
  }[tone];

  const baseClasses =
    "block rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)]";

  const interactiveClasses =
    "cursor-pointer transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)] focus:outline-none focus:ring-2 focus:ring-[#418BFF]";

  const content = (
    <>
      <p className="text-[16px] font-semibold tracking-[0.07em] text-[#718096]">
        {label}
      </p>
      <p
        className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.06em] ${valueStyle}`}
      >
        {value}
      </p>
    </>
  );

  // In-app taps win over external links, so a tile never does both.
  if (onClick) {
    return (
      <button
        className={`${baseClasses} ${interactiveClasses} w-full text-left`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <a
        className={`${baseClasses} ${interactiveClasses}`}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {content}
      </a>
    );
  }

  return <article className={baseClasses}>{content}</article>;
}