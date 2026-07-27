import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { useAuth } from "../lib/AuthProvider";

export function UserMenu() {
  const { profile, session, signOut } = useAuth();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const initial = profile?.full_name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 bg-[#1E3A8A] text-xs font-extrabold transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3B82C4]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {initial}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 top-11 z-50 w-60 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_16px_32px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            role="menu"
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            <div className="border-b border-[#E6ECF2] px-4 py-3">
              <p className="text-[13px] font-extrabold tracking-[-0.015em] text-[#1A1A2E]">
                {profile?.full_name ?? "Signed in"}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[#6B7A90]">
                {session?.user?.email}
              </p>
            </div>

            <button
              className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[#F8FAFC]"
              onClick={signOut}
              role="menuitem"
              type="button"
            >
              <LogOutIcon
                aria-hidden="true"
                className="text-[#D95717]"
                size={15}
                strokeWidth={2.5}
              />
              <span className="text-[12px] font-extrabold uppercase tracking-wide text-[#D95717]">
                Sign out
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
