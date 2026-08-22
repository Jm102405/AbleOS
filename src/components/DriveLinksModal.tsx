// src/components/DriveLinksModal.tsx
// Deep links out to Drive, grouped by section. Deliberately not a file
// browser: one tap, the folder opens in Drive, done.
//
// The list lives in the drive_folders table, so new properties are a data
// entry job rather than a code change. A row with no url yet shows as
// "Coming soon" - never wire one to a legacy My Drive location.

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLinkIcon, FolderIcon, XIcon } from "lucide-react";
import { apiFetch } from "../lib/apiFetch";

type DriveFolder = {
  id: string;
  label: string;
  section: string;
  entity: string | null;
  path_hint: string | null;
  url: string | null;
};

type DriveLinksModalProps = {
  open: boolean;
  onClose: () => void;
};

export function DriveLinksModal({ open, onClose }: DriveLinksModalProps) {
  const [folders, setFolders] = React.useState<DriveFolder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    let live = true;
    setLoading(true);

    apiFetch("/api/drive-folders")
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!live) return;

        if (!res.ok) {
          setError(body?.error || "Could not load the folders");
          setFolders([]);
          return;
        }

        setError(null);
        setFolders(Array.isArray(body.folders) ? body.folders : []);
      })
      .catch(() => {
        if (live) setError("Could not reach the server");
      })
      .finally(() => {
        if (live) setLoading(false);
      });

    return () => {
      live = false;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  // Sections appear in the order their first folder does, so sort_order in the
  // database controls the whole layout.
  const groups = React.useMemo(() => {
    const map = new Map<string, DriveFolder[]>();
    for (const folder of folders) {
      const list = map.get(folder.section) ?? [];
      list.push(folder);
      map.set(folder.section, list);
    }
    return Array.from(map.entries());
  }, [folders]);

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
              {loading && (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[62px] animate-pulse rounded-2xl bg-white"
                    />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="rounded-xl bg-[#FEF2F2] px-4 py-3 text-[16px] text-[#B91C1C]">
                  {error}
                </div>
              )}

              {!loading && !error && folders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-5 py-10 text-center">
                  <p className="text-[18px] font-semibold text-[#526176]">
                    No folders yet
                  </p>
                  <p className="mt-1 text-[16px] text-[#8291A5]">
                    Properties show up here as they come online.
                  </p>
                </div>
              )}

              {!loading &&
                !error &&
                groups.map(([section, sectionFolders]) => (
                  <div key={section}>
                    <p className="text-[16px] font-semibold tracking-[0.13em] text-[#8291A5]">
                      {section}
                    </p>
                    <div className="mt-2 space-y-2">
                      {sectionFolders.map((folder) => {
                        const pending = !folder.url;

                        return (
                          <a
                            className={`flex items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-3.5 shadow-[0_4px_12px_rgba(30,58,138,0.045)] transition-shadow ${
                              pending
                                ? "cursor-default opacity-70"
                                : "hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)]"
                            }`}
                            href={pending ? undefined : (folder.url as string)}
                            key={folder.id}
                            onClick={
                              pending
                                ? (event) => event.preventDefault()
                                : undefined
                            }
                            rel="noopener noreferrer"
                            target={pending ? undefined : "_blank"}
                          >
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
                              <FolderIcon
                                aria-hidden="true"
                                size={16}
                                strokeWidth={2.5}
                              />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[18px] font-semibold tracking-[-0.015em] text-[#1A1A2E]">
                                {folder.label}
                              </span>
                              {/* Only shown while pending, so whoever adds the
                                  link knows which Shared Drive to look in. */}
                              {pending && folder.path_hint && (
                                <span className="mt-0.5 block truncate text-[14px] text-[#8291A5]">
                                  {folder.path_hint}
                                </span>
                              )}
                            </span>

                            {pending && (
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
                        );
                      })}
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
