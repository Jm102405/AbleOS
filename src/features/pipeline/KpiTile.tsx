type KpiTileProps = {
  label: string;
  value: string;
  tone: "primary" | "urgent" | "neutral";
  /** When set, the tile becomes a link that opens in a new tab. */
  href?: string;
};

export function KpiTile({ label, value, tone, href }: KpiTileProps) {
  const valueStyle = {
    primary: "text-[#418BFF]",
    urgent: "text-[#D95717]",
    neutral: "text-[#1A1A2E]",
  }[tone];

  const baseClasses =
    "block rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)]";

  const content = (
    <>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.07em] text-[#718096]">
        {label}
      </p>
      <p
        className={`mt-2 text-[28px] font-extrabold leading-none tracking-[-0.06em] ${valueStyle}`}
      >
        {value}
      </p>
    </>
  );

  if (href) {
    return (
      <a
        className={`${baseClasses} cursor-pointer transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
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
