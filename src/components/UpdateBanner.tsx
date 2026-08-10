import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCwIcon } from "lucide-react";
import { applyPendingUpdate, onUpdateReady } from "../lib/pwa";

/**
 * Appears when a newer build has downloaded and is waiting. Tapping applies it
 * immediately; ignoring it applies on the next foreground anyway.
 */
export function UpdateBanner() {
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => onUpdateReady(setReady), []);

  return (
    <AnimatePresence>
      {ready && (
        <motion.button
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-0 bottom-6 z-[80] mx-auto flex w-fit max-w-[92vw] items-center gap-2.5 rounded-2xl bg-[#1E3A8A] px-5 py-3 shadow-[0_16px_32px_rgba(30,58,138,0.32)]"
          exit={{ opacity: 0, y: 12 }}
          initial={{ opacity: 0, y: 12 }}
          onClick={applyPendingUpdate}
          transition={{ duration: 0.22, ease: "easeOut" }}
          type="button"
        >
          <RefreshCwIcon
            aria-hidden="true"
            className="text-white"
            size={14}
            strokeWidth={2.75}
          />
          <span className="text-[16px] font-semibold text-white">
            New version ready
          </span>
          <span className="text-[16px] font-medium tracking-wide text-white/70">
            Tap to update
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
