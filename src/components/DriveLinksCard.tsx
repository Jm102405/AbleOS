import React from "react";
import { ExternalLinkIcon, FolderIcon } from "lucide-react";

type DriveFolder = {
  id: string;
  label: string;
  group: string;
  url: string;
};

/**
 * Replace each url with the real Google Drive folder link.
 * Anyone can read these links in the bundle, so access still
 * depends on Drive sharing permissions, not on hiding the URL.
 */
const DRIVE_FOLDERS: DriveFolder[] = [
  {
    id: "htm-duplex-1920-27th",
    label: "HTM Duplex - 1920 27th St.",
    group: "Rehab",
    url: "https://drive.google.com/drive/folders/1kCv-jjfoMz4A0VUFikvbb6CTnyAE7WRG",
  },
  {
    id: "president-htm",
    label: "President - Hometown Meadows",
    group: "Executive",
    url: "https://drive.google.com/drive/folders/1GntI2qxktCJEi2GAjyByBhYAJs6zf6tK",
  },
];

export function DriveLinksCard() {
  const [selectedId, setSelectedId] = React.useState("");

  const selected = DRIVE_FOLDERS.find((folder) => folder.id === selectedId);

  const groups = React.useMemo(() => {
    const map = new Map<string, DriveFolder[]>();
    for (const folder of DRIVE_FOLDERS) {
      const list = map.get(folder.group) ?? [];
      list.push(folder);
      map.set(folder.group, list);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <article className="mt-4 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5 sm:py-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#EEF5FF] text-[#1E3A8A]">
          <FolderIcon aria-hidden="true" size={17} strokeWidth={2.5} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
            Google Drive folders
          </h3>
          <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
            Pick a folder to open it in Google Drive.
          </p>
        </div>
      </div>

      <label className="mt-4 block" htmlFor="drive-folder-select">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
          Select a folder
        </span>
        <select
          className="mt-1.5 w-full rounded-xl border border-[#DCE4EE] bg-[#F8FAFC] px-3 py-2.5 text-[13px] font-bold text-[#1A1A2E] outline-none transition-colors focus:border-[#1E3A8A] focus:bg-white"
          id="drive-folder-select"
          onChange={(event) => setSelectedId(event.target.value)}
          value={selectedId}
        >
          <option value="">Choose a Drive folder...</option>
          {groups.map(([group, folders]) => (
            <optgroup key={group} label={group}>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      {selected ? (
        <a
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#1E3A8A] px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#172F6E]"
          href={selected.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          <ExternalLinkIcon aria-hidden="true" size={13} strokeWidth={2.5} />
          Open in Drive
        </a>
      ) : (
        <p className="mt-3 rounded-xl border border-dashed border-[#DCE4EE] px-3 py-2.5 text-center text-[11px] font-medium text-[#93A3B8]">
          No folder selected yet
        </p>
      )}
    </article>
  );
}
