import React from "react";
import { CalendarIcon, ExternalLinkIcon, FolderIcon } from "lucide-react";

const CALENDAR_URL = "https://calendar.google.com/calendar/r";

type TileShellProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function TileContent({ icon, title, subtitle }: TileShellProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
          {icon}
        </span>
        <ExternalLinkIcon
          aria-hidden="true"
          className="shrink-0 text-[#B7C7DC]"
          size={14}
          strokeWidth={2.5}
        />
      </div>

      <p className="mt-4 text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
        {title}
      </p>
      <p className="mt-1 text-[9px] font-extrabold uppercase leading-tight tracking-[0.08em] text-[#8291A5] sm:text-[10px]">
        {subtitle}
      </p>
    </>
  );
}

const TILE_CLASS =
  "block rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)]";

type QuickTilesProps = {
  onOpenDrive: () => void;
  driveSubtitle?: string;
  calendarSubtitle?: string;
};

export function QuickTiles({
  onOpenDrive,
  driveSubtitle = "Deal documents",
  calendarSubtitle = "Open calendar",
}: QuickTilesProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5">
      <button className={TILE_CLASS} onClick={onOpenDrive} type="button">
        <TileContent
          icon={<FolderIcon aria-hidden="true" size={16} strokeWidth={2.5} />}
          subtitle={driveSubtitle}
          title="Google Drive"
        />
      </button>

      <a
        className={TILE_CLASS}
        href={CALENDAR_URL}
        rel="noopener noreferrer"
        target="_blank"
      >
        <TileContent
          icon={<CalendarIcon aria-hidden="true" size={16} strokeWidth={2.5} />}
          subtitle={calendarSubtitle}
          title="Google Calendar"
        />
      </a>
    </div>
  );
}
