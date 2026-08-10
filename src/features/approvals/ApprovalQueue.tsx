import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, ExternalLinkIcon, LoaderIcon, XIcon } from "lucide-react";
import { apiFetch } from "../../lib/apiFetch";

export type ApproverRole = "jeremiah" | "karen" | "raj";

/**
 * Stages that skip Jeremiah and Karen and go straight to Raj. Must match the
 * same set in api/approve-stage.js and api/rehab-stages.js.
 */
const DIRECT_TO_RAJ = new Set(["Before Teardown Photos"]);

export type Stage = {
  notionPageId: string;
  stageName: string;
  side: string;
  phase: string;
  status: string;
  photoUploaded: boolean;
  drivePhotoLink: string | null;
  jeremiahApproved: boolean;
  karenApproved: boolean;
  rajApproved: boolean;
  notes: string;
};

const POLL_MS = 30_000;

/** What each approver is waiting on, and who they're waiting behind. */
const WAITING_ON: Record<ApproverRole, string> = {
  jeremiah: "the crew",
  karen: "Jeremiah",
  raj: "Karen",
};

function isMyTurn(role: ApproverRole, stage: Stage) {
  if (!stage.photoUploaded) return false;
  if (DIRECT_TO_RAJ.has(stage.stageName)) {
    return role === "raj" && !stage.rajApproved;
  }

  if (role === "jeremiah") return !stage.jeremiahApproved;
  if (role === "karen") return stage.jeremiahApproved && !stage.karenApproved;
  return stage.karenApproved && !stage.rajApproved;
}

type ApprovalQueueProps = {
  role: ApproverRole;
  /** Lets the cockpit show the queue length in a KPI tile. */
  onCountChange?: (count: number) => void;
  /**
   * Hands up every stage so a cockpit can derive its own views - approved
   * history, blocked counts - without fetching the same endpoint twice.
   */
  onStagesLoaded?: (stages: Stage[]) => void;
};

export function ApprovalQueue({
  role,
  onCountChange,
  onStagesLoaded,
}: ApprovalQueueProps) {
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [declining, setDeclining] = React.useState<Stage | null>(null);
  const [note, setNote] = React.useState("");

  const load = React.useCallback(async () => {
    setError("");
    try {
      const res = await apiFetch("/api/rehab-stages");
      if (res.status === 401) {
        setStages([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load stages (${res.status})`);

      const data = await res.json();
      setStages(Array.isArray(data.stages) ? data.stages : []);
    } catch (err) {
      console.error("Failed to load approval queue:", err);
      setError(err instanceof Error ? err.message : "Could not load the queue");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);

    function handleVisibility() {
      if (!document.hidden) load();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [load]);

  const queue = React.useMemo(
    () => stages.filter((stage) => isMyTurn(role, stage)),
    [role, stages],
  );

  React.useEffect(() => {
    onCountChange?.(queue.length);
  }, [queue.length, onCountChange]);

  React.useEffect(() => {
    onStagesLoaded?.(stages);
  }, [stages, onStagesLoaded]);

  async function decide(
    stage: Stage,
    decision: "approve" | "decline",
    declineNote?: string,
  ) {
    setBusy(stage.notionPageId);
    try {
      const res = await apiFetch("/api/approve-stage", {
        method: "POST",
        body: JSON.stringify({
          notionPageId: stage.notionPageId,
          decision,
          note: declineNote,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let msg = `Could not save that (${res.status})`;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) msg = parsed.error;
        } catch {
          /* keep default */
        }
        throw new Error(msg);
      }

      setDeclining(null);
      setNote("");
      await load();
    } catch (err) {
      console.error("Decision failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="mt-4 space-y-3">
        {loading && (
          <p className="text-[16px] font-medium text-[#8A99AC]">
            Loading queue…
          </p>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-dashed border-[#FFC9AE] bg-[#FFF6F1] px-5 py-4">
            <p className="text-[16px] font-medium leading-snug text-[#D95717]">
              {error}
            </p>
            <button
              className="mt-2 text-[16px] font-semibold tracking-wide text-[#418BFF] hover:underline"
              onClick={load}
              type="button"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && queue.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
            <p className="text-[16px] font-medium leading-snug text-[#8A99AC]">
              Nothing waiting on you. Next up comes from {WAITING_ON[role]}.
            </p>
          </div>
        )}

        {queue.map((stage) => {
          const working = busy === stage.notionPageId;

          return (
            <article
              className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5"
              key={stage.notionPageId}
            >
              <div className="flex items-start gap-3">
                <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#1A1A2E]">
                    {stage.stageName}
                  </h3>
                  <p className="mt-1 text-[16px] font-medium leading-snug text-[#6B7A90]">
                    {stage.side} · {stage.phase}
                  </p>
                </div>

                {stage.drivePhotoLink && (
                  <a
                    className="flex shrink-0 items-center gap-1 text-[16px] font-medium text-[#418BFF] hover:underline"
                    href={stage.drivePhotoLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View photos
                    <ExternalLinkIcon size={12} strokeWidth={2.5} />
                  </a>
                )}
              </div>

              <div className="mt-3 flex gap-2.5 pl-4">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#DCE4EE] px-4 py-2.5 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:opacity-60"
                  disabled={working}
                  onClick={() => {
                    setNote("");
                    setDeclining(stage);
                  }}
                  type="button"
                >
                  Decline
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
                  disabled={working}
                  onClick={() => decide(stage, "approve")}
                  type="button"
                >
                  {working ? (
                    <LoaderIcon
                      className="animate-spin"
                      size={13}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <CheckIcon size={13} strokeWidth={3} />
                  )}
                  Approve
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Decline needs a reason - the crew has to know what to redo */}
      <AnimatePresence>
        {declining && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/50 px-5"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget && !busy) {
                setDeclining(null);
              }
            }}
          >
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
              exit={{ opacity: 0, y: 12 }}
              initial={{ opacity: 0, y: 12 }}
              onClick={(event) => event.stopPropagation()}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                    Send back
                  </p>
                  <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-[#1A1A2E]">
                    {declining.stageName}
                  </h3>
                </div>
                <button
                  aria-label="Close"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                  onClick={() => setDeclining(null)}
                  type="button"
                >
                  <XIcon aria-hidden="true" size={16} />
                </button>
              </div>

              <p className="mt-3 text-[16px] font-medium leading-relaxed text-[#6B7A90]">
                This clears the photo and sends the stage back to the crew lead.
                Tell them exactly what to redo.
              </p>

              <textarea
                autoFocus
                className="mt-3 min-h-[100px] w-full resize-y rounded-xl border border-[#DCE4EE] bg-white px-3 py-2.5 text-[18px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:text-[#A3B0C0] focus:border-[#418BFF]"
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Need a wide shot of the whole wall, not a close-up"
                value={note}
              />

              <div className="mt-5 flex gap-3">
                <button
                  className="flex-1 rounded-xl border border-[#DCE4EE] px-4 py-2.5 text-[16px] font-semibold tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9]"
                  disabled={busy !== null}
                  onClick={() => setDeclining(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-2.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
                  disabled={note.trim().length < 5 || busy !== null}
                  onClick={() => decide(declining, "decline", note)}
                  type="button"
                >
                  {busy && (
                    <LoaderIcon
                      className="animate-spin"
                      size={13}
                      strokeWidth={2.5}
                    />
                  )}
                  Send back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
  