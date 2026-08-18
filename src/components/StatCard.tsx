export type StatCardProps = {
  value: string;
  label: string;
  tone: "primary" | "urgent";
  href?: string;
  onClick?: () => void;
};

export function StatCard({
  value,
  label,
  tone,
  href,
  onClick,
}: Omit<StatCardProps, "tone"> & {
  tone: "primary" | "urgent" | "success";
}) {
  const tones = {
    primary: "text-[#418BFF] bg-[#EEF5FF]",
    urgent: "text-[#FF7832] bg-[#FFF1E9]",
    success: "text-[#16A34A] bg-[#EAF8EF]",
  };
  const content = (
    <>
      <p
        className={`inline-flex rounded-lg px-2.5 py-1.5 text-[28px] font-semibold leading-none tracking-[-0.03em] ${tones[tone]}`}
      >
        {value}
      </p>
      <p className="mt-2.5 text-[16px] font-normal leading-[1.4] text-[#718096]">
        {label}
      </p>
    </>
  );
  const baseClasses =
    "min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5";
  if (onClick) {
    return (
      <button
        className={`${baseClasses} block w-full cursor-pointer text-left transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
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
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} block cursor-pointer transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
      >
        {content}
      </a>
    );
  }
  return <article className={baseClasses}>{content}</article>;
}