import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderIcon, SendIcon, XIcon } from "lucide-react";
import { apiFetch } from "../../lib/apiFetch";
import { useAuth } from "../../lib/AuthProvider";
import type { Task } from "./TaskCard";

type Comment = {
  id: string;
  task_id: string;
  author_cockpit: string;
  author_name: string;
  body: string;
  created_at: string;
};

const POLL_MS = 10_000;

function timeLabel(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function dayLabel(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";

  const today = new Date();
  const isToday = parsed.toDateString() === today.toDateString();
  if (isToday) return "Today";

  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type TaskChatModalProps = {
  task: Task | null;
  onClose: () => void;
  /** So the parent can refresh its comment counts on close. */
  onChanged?: () => void;
};

export function TaskChatModal({
  task,
  onClose,
  onChanged,
}: TaskChatModalProps) {
  const { profile } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState("");

  const bottomRef = React.useRef<HTMLDivElement>(null);
  const taskId = task?.id ?? null;

  const load = React.useCallback(
    async (showSpinner = false) => {
      if (!taskId) return;
      if (showSpinner) setLoading(true);

      try {
        const res = await apiFetch(`/api/task-comments?taskId=${taskId}`);
        if (res.status === 401) return;
        if (!res.ok) throw new Error(`Could not load messages (${res.status})`);

        const data = await res.json();
        setComments(Array.isArray(data.comments) ? data.comments : []);
        setError("");
      } catch (err) {
        console.error("Load comments failed:", err);
        setError(
          err instanceof Error ? err.message : "Could not load messages",
        );
      } finally {
        setLoading(false);
      }
    },
    [taskId],
  );

  React.useEffect(() => {
    if (!taskId) return;
    setComments([]);
    setDraft("");
    setError("");
    load(true);
  }, [taskId, load]);

  // Only polls while the thread is open, which keeps egress sane.
  React.useEffect(() => {
    if (!taskId) return;

    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [taskId, load]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [comments.length]);

  React.useEffect(() => {
    if (!taskId) return;
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [taskId, onClose]);

  async function send() {
    const text = draft.trim();
    if (!text || !taskId || sending) return;

    setSending(true);
    setError("");

    try {
      const res = await apiFetch("/api/task-comments", {
        method: "POST",
        body: JSON.stringify({ taskId, body: text }),
      });

      if (!res.ok) {
        const raw = await res.text();
        let msg = `Could not send (${res.status})`;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) msg = parsed.error;
        } catch {
          /* keep default */
        }
        throw new Error(msg);
      }

      setDraft("");
      await load();
      onChanged?.();
    } catch (err) {
      console.error("Send failed:", err);
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, Shift+Enter makes a new line.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  return (
    <AnimatePresence>
      {task && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[65] flex items-end justify-center bg-[#1A1A2E]/50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:px-4 sm:py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#EEF2F6] shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#DCE4EE] bg-white px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                  Discussion
                </p>
                <h2 className="mt-1 truncate text-[15px] font-extrabold tracking-[-0.02em] text-[#1A1A2E]">
                  {task.title}
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

            {/* Messages */}
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {loading && (
                <p className="text-center text-[12px] font-medium text-[#8A99AC]">
                  Loading…
                </p>
              )}

              {!loading && comments.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                  <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                    No messages yet. Ask anything you need clarified.
                  </p>
                </div>
              )}

              {comments.map((comment, index) => {
                const mine = comment.author_cockpit === profile?.cockpit;
                const previous = comments[index - 1];
                const showDay =
                  !previous ||
                  dayLabel(previous.created_at) !==
                    dayLabel(comment.created_at);

                return (
                  <React.Fragment key={comment.id}>
                    {showDay && (
                      <p className="pt-1 text-center text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#A3B0C0]">
                        {dayLabel(comment.created_at)}
                      </p>
                    )}

                    <div
                      className={
                        mine ? "flex justify-end" : "flex justify-start"
                      }
                    >
                      <div className="max-w-[78%]">
                        {!mine && (
                          <p className="mb-1 pl-1 text-[10px] font-extrabold uppercase tracking-wide text-[#8A99AC]">
                            {comment.author_name}
                          </p>
                        )}

                        <div
                          className={`rounded-2xl px-3.5 py-2.5 ${
                            mine
                              ? "rounded-br-md bg-[#418BFF] text-white"
                              : "rounded-bl-md border border-[#DCE4EE] bg-white text-[#1A1A2E]"
                          }`}
                        >
                          <p className="whitespace-pre-line text-[12.5px] font-medium leading-relaxed">
                            {comment.body}
                          </p>
                        </div>

                        <p
                          className={`mt-1 text-[10px] font-bold text-[#A3B0C0] ${
                            mine ? "pr-1 text-right" : "pl-1"
                          }`}
                        >
                          {timeLabel(comment.created_at)}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="shrink-0 border-t border-[#DCE4EE] bg-white px-4 pb-4 pt-3">
              {error && (
                <p className="mb-2 text-[11px] font-bold text-red-500">
                  {error}
                </p>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  className="max-h-[120px] min-h-[42px] flex-1 resize-none rounded-xl border border-[#DCE4EE] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1A1A2E] outline-none transition-colors placeholder:text-[#A3B0C0] focus:border-[#418BFF]"
                  maxLength={2000}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message…"
                  rows={1}
                  value={draft}
                />
                <button
                  aria-label="Send"
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-[#418BFF] text-white transition-colors hover:bg-[#2F6FD8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
                  disabled={!draft.trim() || sending}
                  onClick={send}
                  type="button"
                >
                  {sending ? (
                    <LoaderIcon
                      className="animate-spin"
                      size={16}
                      strokeWidth={2.5}
                    />
                  ) : (
                    <SendIcon size={16} strokeWidth={2.5} />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
