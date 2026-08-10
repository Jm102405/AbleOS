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
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
          {icon}
        </span>
        <ExternalLinkIcon
          aria-hidden="true"
          className="shrink-0 text-[#B7C7DC]"
          size={16}
          strokeWidth={2.25}
        />
      </div>

      <p className="mt-4 text-[18px] font-medium leading-[1.4] tracking-[-0.01em] text-[#1A1A2E]">
        {title}
      </p>
      <p className="mt-0.5 text-[16px] font-normal leading-[1.5] text-[#8291A5]">
        {subtitle}
      </p>
    </>
  );
}

const TILE_CLASS =
  "block rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5";

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
          icon={<FolderIcon aria-hidden="true" size={20} strokeWidth={2.25} />}
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
          icon={
            <CalendarIcon aria-hidden="true" size={20} strokeWidth={2.25} />
          }
          subtitle={calendarSubtitle}
          title="Google Calendar"
        />
      </a>
    </div>
  );
}
