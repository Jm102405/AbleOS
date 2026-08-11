import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SendIcon, SparklesIcon, XIcon } from "lucide-react";

/** Live numbers the assistant is allowed to talk about. */
export type AskAbleContext = {
  dealsInPipe?: number | null;
  stalledDeals?: number | null;
  gatesAwaiting?: number | null;
  approvalRequests?: number | null;
  openTasks?: number | null;
  daneInProgress?: number | null;
};

type Message = { id: number; role: "user" | "able"; text: string };

const SUGGESTIONS = [
  "What needs my decision today?",
  "How many deals are in the pipe?",
  "What's waiting on my approval?",
];

/**
 * Local responder. Answers only from numbers already on screen, and says so
 * plainly when it cannot help - inventing an answer would be worse than
 * admitting the limit.
 */
function answer(question: string, context: AskAbleContext) {
  const q = question.toLowerCase();
  const n = (value: number | null | undefined) =>
    typeof value === "number" ? value : null;

  if (q.includes("decision") || q.includes("today") || q.includes("waiting")) {
    const gates = n(context.gatesAwaiting) ?? 0;
    const orders = n(context.approvalRequests) ?? 0;
    const total = gates + orders;

    if (total === 0) return "Nothing is waiting on you right now.";

    return `${total} ${total === 1 ? "thing needs" : "things need"} your call: ${gates} photo ${gates === 1 ? "gate" : "gates"} and ${orders} approval ${orders === 1 ? "request" : "requests"}.`;
  }

  if (q.includes("deal") || q.includes("pipe") || q.includes("pipeline")) {
    const deals = n(context.dealsInPipe);
    const stalled = n(context.stalledDeals) ?? 0;

    if (deals === null) {
      return "I can't see the pipeline from here. Open the Pipeline tab for deal numbers.";
    }

    return `${deals} active ${deals === 1 ? "deal" : "deals"} in the pipe${
      stalled > 0 ? `, ${stalled} stalled four days or more` : ", none stalled"
    }.`;
  }

  if (q.includes("gate") || q.includes("photo") || q.includes("rehab")) {
    const gates = n(context.gatesAwaiting) ?? 0;
    return gates === 0
      ? "No photo gates are waiting on you."
      : `${gates} photo ${gates === 1 ? "gate is" : "gates are"} waiting for your sign-off.`;
  }

  if (q.includes("task") || q.includes("dane")) {
    const open = n(context.openTasks) ?? 0;
    const progress = n(context.daneInProgress) ?? 0;
    return `${open} open ${open === 1 ? "task" : "tasks"} assigned out, and Dane has ${progress} in progress.`;
  }

  return "I can answer on deals, photo gates, approval requests and Dane's tasks. Anything beyond that isn't wired up yet.";
}

type AskAbleProps = {
  context: AskAbleContext;
};

export function AskAble({ context }: AskAbleProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  React.useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: "user", text: clean },
      { id: Date.now() + 1, role: "able", text: answer(clean, context) },
    ]);
    setDraft("");
  }

  return (
    <>
      <button
        aria-label="Ask Able"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#1E3A8A] px-5 py-3.5 text-[16px] font-medium text-white shadow-[0_10px_28px_rgba(30,58,138,0.35)] transition-transform hover:-translate-y-0.5"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SparklesIcon aria-hidden="true" size={18} strokeWidth={2.25} />
        Ask Able
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-3 bottom-3 top-3 z-50 flex flex-col overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_20px_50px_rgba(30,58,138,0.28)] sm:inset-auto sm:bottom-6 sm:right-6 sm:top-auto sm:h-[600px] sm:w-[400px]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-[#DCE4EE] px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#EEF5FF] text-[#418BFF]">
                <SparklesIcon aria-hidden="true" size={20} strokeWidth={2.25} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-semibold tracking-[-0.01em] text-[#1A1A2E]">
                  Able assistant
                </span>
                <span className="flex items-center gap-1.5 text-[14px] font-medium text-[#16A34A]">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-[#16A34A]"
                  />
                  Online · workspace aware
                </span>
              </span>

              <button
                aria-label="Close"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                onClick={() => setOpen(false)}
                type="button"
              >
                <XIcon aria-hidden="true" size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
              {messages.length === 0 && (
                <>
                  <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-[#DCE4EE] bg-white px-4 py-3 text-[18px] font-normal leading-[1.55] text-[#1A1A2E]">
                    I can pull from your pipeline, gates, approvals and Dane's
                    tasks. Ask me one of these, or type your own.
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map((suggestion) => (
                      <button
                        className="rounded-full border border-[#DCE4EE] bg-white px-3.5 py-2 text-left text-[15px] font-medium text-[#418BFF] transition-colors hover:bg-[#EEF5FF]"
                        key={suggestion}
                        onClick={() => send(suggestion)}
                        type="button"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {messages.map((message) => (
                <div
                  className={
                    message.role === "user" ? "flex justify-end" : "flex"
                  }
                  key={message.id}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 text-[18px] font-normal leading-[1.55] ${
                      message.role === "user"
                        ? "rounded-2xl rounded-br-md bg-[#1E3A8A] text-white"
                        : "rounded-2xl rounded-tl-md border border-[#DCE4EE] bg-white text-[#1A1A2E]"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}

              <div ref={endRef} />
            </div>

            <form
              className="flex shrink-0 items-end gap-2 border-t border-[#DCE4EE] p-3"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
            >
              <input
                aria-label="Ask Able a question"
                className="min-h-[46px] flex-1 rounded-xl border border-[#DCE4EE] bg-white px-3.5 text-[18px] font-normal text-[#1A1A2E] outline-none transition-colors placeholder:text-[#A3B0C0] focus:border-[#418BFF]"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about deals, gates or tasks..."
                value={draft}
              />

              <button
                aria-label="Send"
                className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-[#418BFF] text-white transition-colors hover:bg-[#2F6FD8] disabled:cursor-not-allowed disabled:bg-[#CBD5E1]"
                disabled={!draft.trim()}
                type="submit"
              >
                <SendIcon aria-hidden="true" size={18} strokeWidth={2.25} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
