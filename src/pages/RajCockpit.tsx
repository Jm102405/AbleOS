import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRightIcon,
  LoaderIcon,
  MoreHorizontalIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { UserMenu } from "../components/UserMenu";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/apiFetch";
import { NotificationBell } from "../components/NotificationBell";
import { ApprovalQueue, type Stage } from "../features/approvals/ApprovalQueue";
import { GateQueueModal } from "../features/approvals/GateQueueModal";
import { ApprovedGatesModal } from "../features/approvals/ApprovedGatesModal";
import { DriveLinksCard } from "../components/DriveLinksCard";
import { AssignTaskModal } from "../components/AssignTaskModal";
import { AssignedTasksModal } from "../features/tasks/AssignedTasksModal";
import { useNotificationTarget } from "../lib/useNotificationTarget";
import type { Task } from "../features/tasks/TaskCard";
import { TaskChatModal } from "../features/tasks/TaskChatModal";

type Order = {
  id: string;
  order_name: string;
  description: string;
  date_needed: string;
  priority: "Low" | "Normal" | "Urgent";
  estimated_cost: string | number | null;
  requested_by: string;
  status: "Pending" | "Approved" | "Declined";
  created_at: string;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns null for empty or zero cost, so "no cost" renders as nothing. */
function formatCost(value: string | number | null) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount === 0) return null;
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

const priorityStyles: Record<Order["priority"], string> = {
  Low: "bg-[#EEF2F6] text-[#526176]",
  Normal: "bg-[#EEF5FF] text-[#418BFF]",
  Urgent: "bg-[#FFF1E9] text-[#D95717]",
};

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function RajCockpit() {
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [gateCount, setGateCount] = React.useState<number | null>(null);
  const [gatesOpen, setGatesOpen] = React.useState(false);
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [stagesLoaded, setStagesLoaded] = React.useState(false);
  const [approvedOpen, setApprovedOpen] = React.useState(false);

  const handleStagesLoaded = React.useCallback((loaded: Stage[]) => {
    setStages(loaded);
    setStagesLoaded(true);
  }, []);

  const approvedCount = stagesLoaded
    ? stages.filter((stage) => stage.rajApproved).length
    : null;
  const [taskToast, setTaskToast] = React.useState("");

  React.useEffect(() => {
    if (!taskToast) return;
    const timer = setTimeout(() => setTaskToast(""), 4000);
    return () => clearTimeout(timer);
  }, [taskToast]);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState("");
  const loadOrders = React.useCallback(async () => {
    setOrdersError("");
    try {
      const res = await apiFetch("/api/orders?status=Pending");
      // Signed out mid-poll - not an error, just stop.
      if (res.status === 401) {
        setOrders([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load orders (${res.status})`);
      const data = await res.json();
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrdersError(
        err instanceof Error ? err.message : "Could not load approval requests",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksLoaded, setTasksLoaded] = React.useState(false);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [savingTask, setSavingTask] = React.useState<string | null>(null);
  const [chatTask, setChatTask] = React.useState<Task | null>(null);

  /* Notifications deep-link into here, e.g. /raj?task=<id>&chat=1 */
  const { clear, target } = useNotificationTarget();

  React.useEffect(() => {
    if (target.order) {
      // Wait for the list before deciding the id is missing.
      if (ordersLoading) return;
      const found = orders.find((order) => order.id === target.order);
      if (found) setSelectedOrder(found);
      clear();
      return;
    }

    if (target.task) {
      if (!tasksLoaded) return;
      const found = tasks.find((task) => task.id === target.task);
      if (found && target.chat) {
        setChatTask(found);
      } else {
        setTasksOpen(true);
      }
      clear();
      return;
    }

    // Raj's gate queue is already on the page, so there is nothing to open.
    if (target.stage) clear();
  }, [clear, orders, ordersLoading, target, tasks, tasksLoaded]);
  const [commentCounts, setCommentCounts] = React.useState<
    Record<string, number>
  >({});

  const loadCommentCounts = React.useCallback(async () => {
    try {
      const res = await apiFetch("/api/task-comments?counts=1");
      if (!res.ok) return;
      const data = await res.json();
      setCommentCounts(data.counts ?? {});
    } catch (err) {
      console.error("Failed to load comment counts:", err);
    }
  }, []);

  const loadTaskCount = React.useCallback(async () => {
    try {
      const res = await apiFetch("/api/tasks");
      if (!res.ok) return;
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setTasksLoaded(true);
    }
  }, []);

  const openTaskCount = tasksLoaded
    ? tasks.filter((task) => task.status !== "Done").length
    : null;

  async function deleteTask(id: string) {
    try {
      const res = await apiFetch("/api/tasks", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(await res.text());

      // Drop it locally straight away so the list doesn't flicker.
      setTasks((prev) => prev.filter((task) => task.id !== id));
      setTaskToast("Task deleted");
    } catch (err) {
      console.error("Failed to delete task:", err);
      setTaskToast("Could not delete that task");
      loadTaskCount();
    }
  }

  async function updateTaskStatus(id: string, status: Task["status"]) {
    setSavingTask(id);
    try {
      const res = await apiFetch("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(await res.text());
      await loadTaskCount();
    } catch (err) {
      console.error("Failed to update task:", err);
    } finally {
      setSavingTask(null);
    }
  }

  React.useEffect(() => {
    loadOrders();
    loadTaskCount();
    loadCommentCounts();
  }, [loadOrders, loadTaskCount, loadCommentCounts]);

  // Poll every 30s, but only while the tab is visible. Also refresh on focus
  // so switching back to this tab shows current data immediately.
  React.useEffect(() => {
    const REFRESH_MS = 30_000;

    const timer = setInterval(() => {
      if (!document.hidden) loadOrders();
    }, REFRESH_MS);

    function handleVisibility() {
      if (!document.hidden) loadOrders();
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadOrders, loadTaskCount]);

  return (
    <>
      <div className="min-h-screen w-full bg-[#EEF2F6] text-[#1A1A2E]">
        <header className="bg-gradient-to-r from-[#5EC5E8] to-[#3B82C4] text-white shadow-sm">
          <div className="mx-auto max-w-[428px] px-5 pb-8 pt-5 sm:max-w-2xl sm:px-8 sm:pb-10 sm:pt-6 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
            <div className="flex items-center justify-between">
              <img
                src="/able-logo.png"
                alt="Able Buys Homes"
                className="h-12 w-12 rounded-xl bg-[#191919] p-0.5 object-contain shadow-sm"
              />
              <div className="flex items-center gap-3">
                <nav
                  aria-label="Workspace pages"
                  className="flex items-center gap-1 rounded-full bg-white/15 p-1"
                >
                  <span
                    aria-current="page"
                    className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#1E3A8A]"
                  >
                    Cockpit
                  </span>
                  <Link
                    className="rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white/80 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    to="/raj/pipeline"
                  >
                    Pipeline
                  </Link>
                </nav>
                <NotificationBell />
                <UserMenu />
              </div>
            </div>

            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
              ABLE OS · Executive workspace
            </p>
            <h1 className="mt-1 text-[32px] font-extrabold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
              Raj&apos;s Cockpit
            </h1>
            <p className="mt-2 max-w-md text-[13px] font-medium text-white/85 sm:text-[14px]">
              A clear view of today&apos;s decisions and operating load.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-[428px] px-5 pb-10 sm:max-w-2xl sm:px-8 sm:pb-14 lg:max-w-5xl lg:px-10 xl:max-w-6xl">
          <motion.section
            animate="visible"
            aria-labelledby="profile-heading"
            className="relative -mt-4 overflow-hidden rounded-2xl border border-[#DCE4EE] bg-white shadow-[0_8px_20px_rgba(30,58,138,0.08)]"
            initial="hidden"
            transition={{ duration: 0.35, ease: "easeOut" }}
            variants={reveal}
          >
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#1E3A8A]" />
            <div className="flex items-center justify-between gap-4 px-5 py-4 pl-6 sm:px-7 sm:py-5 sm:pl-8">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                  Personal dashboard
                </p>
                <h2
                  className="mt-1 text-[16px] font-extrabold tracking-[-0.025em] sm:text-[18px]"
                  id="profile-heading"
                >
                  Raj · CEO
                </h2>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#64748B] sm:text-[12px]">
                  Vision · Acquisitions · Capital · Partnerships
                </p>
              </div>
              <button
                className="flex shrink-0 items-center gap-2 rounded-xl bg-[#418BFF] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#2F6FD8] focus:outline-none focus:ring-2 focus:ring-[#418BFF] focus:ring-offset-2 sm:text-[12px]"
                onClick={() => setAssignOpen(true)}
                type="button"
              >
                <PlusIcon aria-hidden="true" size={15} strokeWidth={3} />
                Assign Task
              </button>
              <button
                aria-label="Open profile options"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#F1F5F9] text-[#3B82C4] transition-colors hover:bg-[#E3EDF8] focus:outline-none focus:ring-2 focus:ring-[#3B82C4] focus:ring-offset-2"
                type="button"
              >
                <MoreHorizontalIcon aria-hidden="true" size={18} />
              </button>
            </div>
          </motion.section>
          <motion.section
            animate="visible"
            aria-labelledby="queue-heading"
            className="pt-8"
            initial="hidden"
            transition={{ delay: 0.08, duration: 0.35, ease: "easeOut" }}
            variants={reveal}
          >
            <div className="mt-1 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
              <StatCard
                label="Gates awaiting you"
                tone={gateCount ? "urgent" : "primary"}
                value={gateCount !== null ? String(gateCount) : "..."}
              />
              <StatCard
                label="Approval requests"
                tone={orders.length ? "urgent" : "primary"}
                value={ordersLoading ? "..." : String(orders.length)}
              />
              <StatCard
                label="Tasks assigned"
                onClick={() => setTasksOpen(true)}
                tone="primary"
                value={openTaskCount !== null ? String(openTaskCount) : "..."}
              />
              <StatCard
                label="Gates approved"
                onClick={() => setApprovedOpen(true)}
                tone="primary"
                value={approvedCount !== null ? String(approvedCount) : "..."}
              />
            </div>
          </motion.section>
          <motion.div
            animate="visible"
            initial="hidden"
            transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
            variants={reveal}
          >
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 xl:gap-x-14">
              <div>
                {/* Gates on the left */}
                <section aria-labelledby="gates-heading" className="pt-9">
                  <SectionHeading id="gates-heading">
                    Gates awaiting you
                  </SectionHeading>
                  <button
                    className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_8px_18px_rgba(30,58,138,0.1)] sm:px-5"
                    onClick={() => setGatesOpen(true)}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                        {gateCount === null
                          ? "Loading gates..."
                          : gateCount === 0
                            ? "Nothing waiting on you"
                            : `Review ${gateCount} gate${gateCount === 1 ? "" : "s"}`}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                        Photos submitted for your sign-off
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${
                        gateCount
                          ? "bg-[#FFF1E9] text-[#FF7832]"
                          : "bg-[#EAF8EF] text-[#16A34A]"
                      }`}
                    >
                      {gateCount === null ? "..." : gateCount}
                    </span>
                  </button>
                </section>

                <GateQueueModal
                  count={gateCount}
                  onClose={() => setGatesOpen(false)}
                  open={gatesOpen}
                >
                  <ApprovalQueue
                    onCountChange={setGateCount}
                    onStagesLoaded={handleStagesLoaded}
                    role="raj"
                  />
                </GateQueueModal>

                <section aria-labelledby="approval-heading" className="pt-9">
                  <SectionHeading id="approval-heading">
                    Approval requests
                  </SectionHeading>
                  <div className="mt-4 space-y-3">
                    {ordersLoading && (
                      <p className="text-[12px] font-medium text-[#8A99AC]">
                        Loading requests…
                      </p>
                    )}

                    {!ordersLoading && ordersError && (
                      <div className="rounded-2xl border border-dashed border-[#FFC9AE] bg-[#FFF6F1] px-5 py-4">
                        <p className="text-[12px] font-bold leading-snug text-[#D95717]">
                          {ordersError}
                        </p>
                        <button
                          className="mt-2 text-[11px] font-extrabold uppercase tracking-wide text-[#418BFF] hover:underline"
                          onClick={loadOrders}
                          type="button"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {!ordersLoading && !ordersError && orders.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
                        <p className="text-[12px] font-medium leading-snug text-[#8A99AC]">
                          Nothing awaiting your approval
                        </p>
                      </div>
                    )}

                    {orders.map((order) => {
                      const cost = formatCost(order.estimated_cost);
                      return (
                        <button
                          className="group flex w-full items-center gap-3 rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 text-left shadow-[0_5px_14px_rgba(30,58,138,0.055)] transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)] sm:px-5"
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          type="button"
                        >
                          <div className="h-9 w-1 shrink-0 rounded-full bg-[#1E3A8A]" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2">
                              <h3 className="min-w-0 flex-1 text-[13px] font-extrabold leading-snug tracking-[-0.015em] text-[#1A1A2E] sm:text-[14px]">
                                {order.order_name}
                              </h3>
                              <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${priorityStyles[order.priority]}`}
                              >
                                {order.priority}
                              </span>
                            </div>
                            <p className="mt-1 text-[11px] font-medium leading-snug text-[#6B7A90] sm:text-[12px]">
                              {order.requested_by} · needed{" "}
                              {formatDate(order.date_needed)}
                              {cost ? ` · ${cost}` : ""}
                            </p>
                          </div>
                          <ChevronRightIcon
                            aria-hidden="true"
                            className="shrink-0 text-[#93A3B8] transition-transform group-hover:translate-x-0.5"
                            size={18}
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
          <section aria-labelledby="drive-heading" className="pt-9">
            <h2
              className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
              id="drive-heading"
            >
              Drive library
            </h2>
            <DriveLinksCard />
          </section>
          <footer className="pt-10 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[#8291A5]">
            Able OS · V1 Build
          </footer>
        </main>
      </div>

      <ApprovalModal
        onClose={() => setSelectedOrder(null)}
        onDecided={loadOrders}
        order={selectedOrder}
      />

      <ApprovedGatesModal
        loading={!stagesLoaded}
        onClose={() => setApprovedOpen(false)}
        open={approvedOpen}
        role="raj"
        stages={stages}
      />

      <TaskChatModal
        onChanged={loadCommentCounts}
        onClose={() => setChatTask(null)}
        task={chatTask}
      />

      <AssignedTasksModal
        commentCounts={commentCounts}
        loading={!tasksLoaded}
        onClose={() => setTasksOpen(false)}
        onDelete={deleteTask}
        onOpenChat={setChatTask}
        onStatusChange={updateTaskStatus}
        open={tasksOpen}
        savingTask={savingTask}
        tasks={tasks}
      />

      <AssignTaskModal
        onClose={() => setAssignOpen(false)}
        onCreated={() => {
          setTaskToast("Task assigned");
          loadTaskCount();
        }}
        open={assignOpen}
      />

      <AnimatePresence>
        {taskToast && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-2xl bg-[#1A1A2E] px-5 py-3.5 shadow-[0_16px_32px_rgba(26,26,46,0.28)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            role="status"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <p className="text-[12px] font-bold text-white sm:text-[13px]">
              {taskToast}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Subcomponents ──────────────────────────────────────── */

type StatCardProps = {
  value: string;
  label: string;
  tone: "primary" | "urgent";
  href?: string;
  onClick?: () => void;
};

function StatCard({ value, label, tone, href, onClick }: StatCardProps) {
  const tones = {
    primary: "text-[#418BFF] bg-[#EEF5FF]",
    urgent: "text-[#FF7832] bg-[#FFF1E9]",
  };

  const content = (
    <>
      <p
        className={`inline-flex rounded-lg px-2 py-1 text-[24px] font-extrabold leading-none tracking-[-0.06em] sm:text-[27px] ${tones[tone]}`}
      >
        {value}
      </p>
      <p className="mt-3 text-[9px] font-extrabold uppercase leading-tight tracking-[0.06em] text-[#718096] sm:text-[10px]">
        {label}
      </p>
    </>
  );

  const baseClasses =
    "min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5";

  if (onClick) {
    return (
      <button
        className={`${baseClasses} block w-full cursor-pointer text-left transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
        onClick={onClick}
        type="button"
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} block cursor-pointer transition-shadow hover:shadow-[0_6px_16px_rgba(30,58,138,0.09)]`}
      >
        {content}
      </a>
    );
  }

  return <article className={baseClasses}>{content}</article>;
}

type SectionHeadingProps = {
  id: string;
  children: React.ReactNode;
};

function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      className="text-[19px] font-extrabold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
      id={id}
    >
      {children}
    </h2>
  );
}

type ApprovalModalProps = {
  order: Order | null;
  onClose: () => void;
  /** Called after a decision succeeds, so the parent can refresh. */
  onDecided: () => void;
};

function ApprovalModal({ order, onClose, onDecided }: ApprovalModalProps) {
  const [busy, setBusy] = React.useState<"Approved" | "Declined" | null>(null);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (order) {
      setBusy(null);
      setError("");
    }
  }, [order]);

  async function decide(status: "Approved" | "Declined") {
    if (!order) return;

    setBusy(status);
    setError("");

    try {
      const res = await apiFetch("/api/orders", {
        method: "PATCH",
        body: JSON.stringify({ id: order.id, status }),
      });

      const raw = await res.text();
      if (!res.ok) {
        let msg = `Failed to save decision (${res.status})`;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.error) msg = parsed.error;
        } catch {
          /* keep default message */
        }
        throw new Error(msg);
      }

      onDecided();
      onClose();
    } catch (err) {
      console.error("Decision failed:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(null);
    }
  }

  const cost = order ? formatCost(order.estimated_cost) : null;

  return (
    <AnimatePresence>
      {order && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/50 px-5 py-6"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_40px_rgba(30,58,138,0.18)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header — pinned */}
            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-6">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#5B6B82]">
                Approval request
              </p>
              <button
                aria-label="Close"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[#93A3B8] transition-colors hover:bg-[#F1F5F9]"
                onClick={onClose}
                type="button"
              >
                <XIcon aria-hidden="true" size={16} />
              </button>
            </div>

            {/* Body — scrolls when the description is long */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5">
              <div className="mt-2 flex items-start gap-2">
                <h3 className="min-w-0 flex-1 text-[16px] font-extrabold leading-snug tracking-[-0.02em] text-[#1A1A2E]">
                  {order.order_name}
                </h3>
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${priorityStyles[order.priority]}`}
                >
                  {order.priority}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-line text-[12px] font-medium leading-relaxed text-[#526176]">
                {order.description}
              </p>

              <dl className="mt-4 space-y-2 rounded-xl bg-[#F8FAFC] px-4 py-3">
                <Row label="Requested by" value={order.requested_by} />
                <Row
                  label="Date needed"
                  value={formatDate(order.date_needed)}
                />
                <Row label="Submitted" value={formatDate(order.created_at)} />
                {cost && <Row label="Estimated cost" value={cost} />}
              </dl>
            </div>

            {/* Footer — pinned, so Approve/Decline are always reachable */}
            <div className="shrink-0 border-t border-[#E6ECF2] px-6 pb-6 pt-4">
              {error && (
                <p className="mb-3 text-[11px] font-bold text-red-500">
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#DCE4EE] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-[#526176] transition-colors hover:bg-[#F1F5F9] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={busy !== null}
                  onClick={() => decide("Declined")}
                  type="button"
                >
                  {busy === "Declined" ? (
                    <LoaderIcon
                      className="animate-spin"
                      size={14}
                      strokeWidth={2.5}
                    />
                  ) : null}
                  Decline
                </button>
                <button
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-wide text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:bg-[#CBD5E1] disabled:text-[#8A99AC]"
                  disabled={busy !== null}
                  onClick={() => decide("Approved")}
                  type="button"
                >
                  {busy === "Approved" ? (
                    <LoaderIcon
                      className="animate-spin"
                      size={14}
                      strokeWidth={2.5}
                    />
                  ) : null}
                  Approve
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#8A99AC]">
        {label}
      </dt>
      <dd className="text-[12px] font-bold text-[#1A1A2E]">{value}</dd>
    </div>
  );
}
