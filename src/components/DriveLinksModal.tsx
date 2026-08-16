import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon, FolderIcon, XIcon } from "lucide-react";

type DriveFolder = {
  id: string;
  label: string;
  group: string;
  url: string;
  /** Shown but not yet linked anywhere. */
  comingSoon?: boolean;
};

/**
 * These links are readable in the bundle, which is fine - access is controlled
 * by Drive sharing, not by hiding the URL.
 */
const DRIVE_FOLDERS: DriveFolder[] = [
  {
    id: "able-main-brain",
    label: "Able Main Brain",
    group: "Rehab",
    comingSoon: true,
    url: "PASTE_THE_URL_HERE",
  },
  {
    id: "htm-duplex-1920-27th",
    label: "HTM Duplex - 1920 27th St.",
    group: "Operations",
    url: "https://drive.google.com/drive/folders/1kCv-jjfoMz4A0VUFikvbb6CTnyAE7WRG",
  },
];

export const DRIVE_FOLDER_COUNT = DRIVE_FOLDERS.length;

type DriveLinksModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DriveLinksModal({ open, onClose }: DriveLinksModalProps) {
  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

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
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-40 flex items-end justify-center overflow-hidden bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="shrink-0 border-b border-[#DCE4EE] bg-white px-5 pb-4 pt-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                    Deal documents
                  </p>
                  <h2 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#1A1A2E]">
                    Google Drive
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  onClick={onClose}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={16} />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
              {groups.map(([group, folders]) => (
                <div key={group}>
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#8291A5]">
                    {group}
                  </p>
                  <div className="mt-2 space-y-2">
                    {folders.map((folder) => (
                      <a
                        className={`flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow ${
                          folder.comingSoon
                            ? "cursor-default opacity-70"
                            : "hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)]"
                        }`}
                        href={folder.comingSoon ? undefined : folder.url}
                        key={folder.id}
                        onClick={
                          folder.comingSoon
                            ? (event) => event.preventDefault()
                            : undefined
                        }
                        rel="noopener noreferrer"
                        target={folder.comingSoon ? undefined : "_blank"}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
                          <FolderIcon
                            aria-hidden="true"
                            size={16}
                            strokeWidth={2.5}
                          />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[18px] font-semibold tracking-[-0.015em] text-[#1A1A2E]">
                          {folder.label}
                        </span>

                        {folder.comingSoon && (
                          <span className="shrink-0 rounded-full bg-[#F1F5F9] px-2.5 py-1 text-[14px] font-semibold text-[#5B6B82]">
                            Coming soon
                          </span>
                        )}
                        <ExternalLinkIcon
                          aria-hidden="true"
                          className="shrink-0 text-[#93A3B8]"
                          size={15}
                          strokeWidth={2.5}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
