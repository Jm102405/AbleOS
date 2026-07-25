import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export type CockpitKey =
  | "raj"
  | "dane"
  | "karen"
  | "jeremiah"
  | "colton"
  | "zo";

type Account = {
  key: CockpitKey;
  name: string;
  role: string;
  path: string;
  initial: string;
};

const ACCOUNTS: Account[] = [
  { key: "raj", name: "Rishi", role: "CEO", path: "/raj", initial: "R" },
  {
    key: "dane",
    name: "Dane",
    role: "Integration lead",
    path: "/dane",
    initial: "D",
  },
  {
    key: "karen",
    name: "Karen",
    role: "Operations",
    path: "/karen",
    initial: "K",
  },
  {
    key: "jeremiah",
    name: "Jeremiah",
    role: "Field ops · VP Able Builds",
    path: "/jeremiah",
    initial: "J",
  },
  {
    key: "colton",
    name: "Colton",
    role: "Crew lead · Side A",
    path: "/colton",
    initial: "C",
  },
  {
    key: "zo",
    name: "Zo",
    role: "Crew lead · Side B",
    path: "/zo",
    initial: "Z",
  },
];

type AccountSwitcherProps = {
  /** Which cockpit is currently open — it's excluded from the list. */
  current: CockpitKey;
};

/**
 * Temporary account switcher shown in each cockpit header.
 * Replace with real Supabase-backed auth once that's in place.
 */
export function AccountSwitcher({ current }: AccountSwitcherProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const me = ACCOUNTS.find((account) => account.key === current) ?? ACCOUNTS[0];
  const others = ACCOUNTS.filter((account) => account.key !== current);

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

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Switch account"
        className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/70 bg-[#1E3A8A] text-xs font-extrabold transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#3B82C4]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {me.initial}
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
            <p className="border-b border-[#E6ECF2] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
              Switch account
            </p>
            {others.map((account) => (
              <button
                className="flex w-full items-center gap-3 border-b border-[#F1F5F9] px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-[#F8FAFC]"
                key={account.key}
                onClick={() => {
                  setOpen(false);
                  navigate(account.path);
                }}
                role="menuitem"
                type="button"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#1E3A8A] text-[11px] font-extrabold text-white">
                  {account.initial}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold tracking-[-0.015em] text-[#1A1A2E]">
                    {account.name}
                  </span>
                  <span className="block text-[11px] font-medium text-[#6B7A90]">
                    {account.role}
                  </span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
