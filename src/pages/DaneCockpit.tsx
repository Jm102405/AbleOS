import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ClipboardListIcon,
  FileTextIcon,
  ListChecksIcon,
  PlusIcon,
  CheckIcon,
} from "lucide-react";
import { NavCard } from "../components/NavCard";
import { UserMenu } from "../components/UserMenu";
import { AddOrderModal } from "../components/AddOrderModal";
import { apiFetch } from "../lib/apiFetch";
import { TaskCard, type Task } from "../features/tasks/TaskCard";
import { TaskChatModal } from "../features/tasks/TaskChatModal";
import { GateQueueModal } from "../features/approvals/GateQueueModal";
import { CompleteDailyTaskModal } from "../features/dailytasks/CompleteDailyTaskModal";
import { CreateDailyTaskModal } from "../features/dailytasks/CreateDailyTaskModal";
import { DailyTaskCard } from "../features/dailytasks/DailyTaskCard";
import {
  useDailyTasks,
  type DailyTask,
} from "../features/dailytasks/useDailyTasks";
import {
  scrollToSection,
  useNotificationTarget,
} from "../lib/useNotificationTarget";
import { ResetRehabButton } from "../components/ResetRehabButton";
import { NotificationBell } from "../components/NotificationBell";

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
  decided_at: string | null;
  decided_by: string | null;
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

const statusStyles: Record<Order["status"], string> = {
  Pending: "bg-[#FEF3C7] text-[#B45309]",
  Approved: "bg-[#EAF8EF] text-[#16A34A]",
  Declined: "bg-[#FFF1E9] text-[#D95717]",
};

const priorityStyles: Record<Order["priority"], string> = {
  Low: "bg-[#EEF2F6] text-[#526176]",
  Normal: "bg-[#EEF5FF] text-[#418BFF]",
  Urgent: "bg-[#FFF1E9] text-[#D95717]",
};

const reveal = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function DaneCockpit() {
  const [addOrderOpen, setAddOrderOpen] = React.useState(false);
  const [toast, setToast] = React.useState("");
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(true);
  const [ordersError, setOrdersError] = React.useState("");

  const loadOrders = React.useCallback(async () => {
    setOrdersError("");
    try {
      const res = await apiFetch("/api/orders");
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
        err instanceof Error ? err.message : "Could not load your orders",
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = React.useState(true);
  const [tasksError, setTasksError] = React.useState("");
  const [savingTask, setSavingTask] = React.useState<string | null>(null);
  const [tasksOpen, setTasksOpen] = React.useState(false);
  const [ordersOpen, setOrdersOpen] = React.useState(false);

  /* Dane's own daily work, separate from what Raj assigns him. */
  const daily = useDailyTasks();
  const [dailyOpen, setDailyOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [completing, setCompleting] = React.useState<DailyTask | null>(null);

  const openTaskCount = tasks.filter((task) => task.status !== "Done").length;
  const [chatTask, setChatTask] = React.useState<Task | null>(null);

  /* Notifications deep-link into here, e.g. /dane?task=<id>&chat=1 */
  const { clear, target } = useNotificationTarget();

  React.useEffect(() => {
    if (target.task) {
      // Wait for the list before deciding the id is missing.
      if (tasksLoading) return;
      const found = tasks.find((task) => task.id === target.task);
      if (found && target.chat) {
        setChatTask(found);
      } else {
        scrollToSection("tasks-heading");
      }
      clear();
      return;
    }

    if (target.order) {
      scrollToSection("orders-heading");
      clear();
      return;
    }

    if (target.stage) clear();
  }, [clear, target, tasks, tasksLoading]);
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

  const loadTasks = React.useCallback(async () => {
    setTasksError("");
    try {
      const res = await apiFetch("/api/tasks");
      if (res.status === 401) {
        setTasks([]);
        return;
      }
      if (!res.ok) throw new Error(`Failed to load tasks (${res.status})`);

      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setTasksError(
        err instanceof Error ? err.message : "Could not load your tasks",
      );
    } finally {
      setTasksLoading(false);
    }
  }, []);

  async function updateTaskStatus(id: string, status: Task["status"]) {
    setSavingTask(id);
    try {
      const res = await apiFetch("/api/tasks", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(detail.slice(0, 160));
      }
      await loadTasks();
    } catch (err) {
      console.error("Failed to update task:", err);
      setTasksError("Could not save that status. Try again.");
    } finally {
      setSavingTask(null);
    }
  }

  React.useEffect(() => {
    loadOrders();
    loadTasks();
    loadCommentCounts();
  }, [loadOrders, loadTasks, loadCommentCounts]);

  // Poll every 30s, but only while the tab is actually visible — no point
  // burning requests on a phone in someone's pocket. Also refresh the moment
  // the tab regains focus, so switching back shows current data immediately.
  React.useEffect(() => {
    const REFRESH_MS = 30_000;

    const timer = setInterval(() => {
      if (!document.hidden) {
        loadOrders();
        loadTasks();
        loadCommentCounts();
      }
    }, REFRESH_MS);

    function handleVisibility() {
      if (!document.hidden) {
        loadOrders();
        loadTasks();
        loadCommentCounts();
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadOrders, loadTasks, loadCommentCounts]);

  React.useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
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
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          <p className="mt-6 text-[16px] font-medium tracking-[0.14em] text-white/80">
            ABLE OS · Executive workspace
          </p>
          <h1 className="mt-1 text-[32px] font-semibold leading-tight tracking-[-0.045em] sm:text-[38px] lg:text-[44px]">
            Dane&apos;s Cockpit
          </h1>
          <p className="mt-2 max-w-md text-[18px] font-medium text-white/85">
            Audit and integration status for Lane 2.
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
              <p className="text-[16px] font-semibold tracking-[0.13em] text-[#5B6B82]">
                Personal dashboard
              </p>
              <h2
                className="mt-1 text-[16px] font-semibold tracking-[-0.025em]"
                id="profile-heading"
              >
                Dane · Integration Lead
              </h2>
              <p className="mt-1 text-[16px] font-medium leading-relaxed text-[#64748B]">
                Audits · Access grants · Main Brain integration
              </p>
            </div>
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
          <h2 className="sr-only" id="queue-heading">
            Your numbers
          </h2>

          <div className="mt-1 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-5">
            <InsightCard
              label="Tasks from Raj"
              tone="queued"
              value={tasksLoading ? "..." : String(openTaskCount)}
            />
            <InsightCard
              label="My tasks"
              tone="yellow"
              value={daily.loading ? "..." : String(daily.inProgress.length)}
            />
            <InsightCard
              label="Orders to Raj"
              tone="critical"
              value={ordersLoading ? "..." : String(orders.length)}
            />
          </div>
        </motion.section>

        <motion.div
          animate="visible"
          initial="hidden"
          transition={{ delay: 0.16, duration: 0.38, ease: "easeOut" }}
          variants={reveal}
        >
          <div>
            <section aria-labelledby="tasks-heading" className="pt-8">
              <h2 className="sr-only" id="tasks-heading">
                Tasks from Raj
              </h2>
              <NavCard
                count={tasksLoading ? null : openTaskCount}
                icon={<ClipboardListIcon size={17} strokeWidth={2.5} />}
                onClick={() => setTasksOpen(true)}
                subtitle="Work Raj has assigned to you"
                title="Tasks from Raj"
                tone="blue"
              />
            </section>

            <GateQueueModal
              count={tasksLoading ? null : openTaskCount}
              eyebrow="From Raj"
              onClose={() => setTasksOpen(false)}
              open={tasksOpen}
              title="Tasks from Raj"
            >
              <div className="space-y-3">
                {tasksLoading && (
                  <p className="text-[16px] font-medium text-[#8A99AC]">
                    Loading tasks…
                  </p>
                )}

                {!tasksLoading && tasksError && (
                  <div className="rounded-2xl border border-dashed border-[#FFC9AE] bg-[#FFF6F1] px-5 py-4">
                    <p className="text-[16px] font-medium leading-snug text-[#D95717]">
                      {tasksError}
                    </p>
                    <button
                      className="mt-2 text-[16px] font-semibold tracking-wide text-[#418BFF] hover:underline"
                      onClick={loadTasks}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!tasksLoading && !tasksError && tasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
                    <p className="text-[16px] font-medium leading-snug text-[#8A99AC]">
                      Nothing assigned to you right now.
                    </p>
                  </div>
                )}

                {tasks.map((task) => (
                  <TaskCard
                    commentCount={commentCounts[task.id] ?? 0}
                    key={task.id}
                    onOpenChat={() => setChatTask(task)}
                    onStatusChange={(status) =>
                      updateTaskStatus(task.id, status)
                    }
                    saving={savingTask === task.id}
                    task={task}
                  />
                ))}
              </div>
            </GateQueueModal>

            <section aria-labelledby="daily-heading" className="pt-3">
              <h2 className="sr-only" id="daily-heading">
                My tasks
              </h2>
              <NavCard
                action={
                  <button
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#418BFF] px-2.5 py-1.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#2F6FD8]"
                    onClick={() => setCreateOpen(true)}
                    type="button"
                  >
                    <PlusIcon aria-hidden="true" size={12} strokeWidth={3} />
                    New
                  </button>
                }
                count={daily.loading ? null : daily.inProgress.length}
                icon={<ListChecksIcon size={17} strokeWidth={2.5} />}
                onClick={() => setDailyOpen(true)}
                subtitle={`${daily.drafts.length} drafts · ${daily.completed.length} completed`}
                title="My tasks"
                tone="yellow"
              />
            </section>

            <GateQueueModal
              count={daily.loading ? null : daily.inProgress.length}
              eyebrow="Daily work"
              onClose={() => setDailyOpen(false)}
              open={dailyOpen}
              title="My tasks"
            >
              <div className="space-y-3">
                {daily.error ? (
                  <p className="text-[16px] font-medium text-[#DC2626]">
                    {daily.error}
                  </p>
                ) : null}

                {!daily.loading && daily.tasks.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-white px-5 py-8 text-center">
                    <p className="text-[16px] font-medium leading-snug text-[#8A99AC]">
                      No tasks yet. Use New task to add one.
                    </p>
                  </div>
                )}

                {daily.drafts.length > 0 && (
                  <p className="text-[16px] font-semibold tracking-[0.13em] text-[#8291A5]">
                    Drafts
                  </p>
                )}

                {daily.drafts.map((task) => (
                  <DailyTaskCard
                    busy={daily.busyId === task.id}
                    key={task.id}
                    onStart={(item) => daily.publishTask(item.id)}
                    task={task}
                  />
                ))}

                {daily.drafts.length > 0 && daily.inProgress.length > 0 && (
                  <p className="pt-2 text-[16px] font-semibold tracking-[0.13em] text-[#8291A5]">
                    In progress
                  </p>
                )}

                {daily.inProgress.map((task) => (
                  <DailyTaskCard
                    busy={daily.busyId === task.id}
                    key={task.id}
                    onComplete={setCompleting}
                    task={task}
                  />
                ))}

                {daily.completed.length > 0 && (
                  <p className="pt-2 text-[16px] font-semibold tracking-[0.13em] text-[#8291A5]">
                    Completed
                  </p>
                )}

                {daily.completed.map((task) => (
                  <DailyTaskCard
                    busy={daily.busyId === task.id}
                    key={task.id}
                    onReopen={(item) => daily.reopenTask(item.id)}
                    task={task}
                  />
                ))}
              </div>
            </GateQueueModal>

            <section aria-labelledby="orders-heading" className="pt-3">
              <h2 className="sr-only" id="orders-heading">
                Orders to Raj
              </h2>
              <NavCard
                action={
                  <button
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#418BFF] px-2.5 py-1.5 text-[16px] font-semibold tracking-wide text-white transition-colors hover:bg-[#2F6FD8]"
                    onClick={() => setAddOrderOpen(true)}
                    type="button"
                  >
                    <PlusIcon aria-hidden="true" size={12} strokeWidth={3} />
                    Add
                  </button>
                }
                count={ordersLoading ? null : orders.length}
                icon={<FileTextIcon size={17} strokeWidth={2.5} />}
                onClick={() => setOrdersOpen(true)}
                subtitle="Requests you have sent to Raj"
                title="Orders to Raj"
                tone="orange"
              />
            </section>

            <GateQueueModal
              count={ordersLoading ? null : orders.length}
              eyebrow="Sent to Raj"
              onClose={() => setOrdersOpen(false)}
              open={ordersOpen}
              title="Your orders"
            >
              <div className="space-y-3">
                {ordersLoading && (
                  <p className="text-[16px] font-medium text-[#8A99AC]">
                    Loading orders…
                  </p>
                )}

                {!ordersLoading && ordersError && (
                  <div className="rounded-2xl border border-dashed border-[#FFC9AE] bg-[#FFF6F1] px-5 py-4">
                    <p className="text-[16px] font-medium leading-snug text-[#D95717]">
                      {ordersError}
                    </p>
                    <button
                      className="mt-2 text-[16px] font-semibold tracking-wide text-[#418BFF] hover:underline"
                      onClick={loadOrders}
                      type="button"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {!ordersLoading && !ordersError && orders.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[#DCE4EE] bg-[#F8FAFC] px-5 py-4">
                    <p className="text-[16px] font-medium leading-snug text-[#8A99AC]">
                      No orders yet — use Add Order to send one to Raj.
                    </p>
                  </div>
                )}

                {orders.map((order) => {
                  const cost = formatCost(order.estimated_cost);
                  return (
                    <article
                      className="rounded-2xl border border-[#DCE4EE] bg-white px-4 py-4 shadow-[0_5px_14px_rgba(30,58,138,0.055)] sm:px-5"
                      key={order.id}
                    >
                      <div className="flex items-start gap-2">
                        <h3 className="min-w-0 flex-1 text-[18px] font-semibold leading-snug tracking-[-0.015em] text-[#1A1A2E]">
                          {order.order_name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[14px] font-semibold tracking-wide ${statusStyles[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </div>

                      <p className="mt-1.5 line-clamp-2 text-[16px] font-medium leading-snug text-[#6B7A90]">
                        {order.description}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[16px] font-medium tracking-wide text-[#8A99AC]">
                        <span
                          className={`rounded-full px-2 py-0.5 ${priorityStyles[order.priority]}`}
                        >
                          {order.priority}
                        </span>
                        <span>Needed {formatDate(order.date_needed)}</span>
                        {cost && <span>· {cost}</span>}
                        {order.decided_at && (
                          <span>
                            · {order.status} {formatDate(order.decided_at)}
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </GateQueueModal>
          </div>
        </motion.div>

        <section aria-labelledby="danger-heading" className="pt-9">
          <SectionHeading id="danger-heading">Danger zone</SectionHeading>
          <div className="mt-4 rounded-2xl border border-[#FECACA] bg-[#FFF8F4] px-5 py-4">
            <p className="text-[16px] font-medium leading-relaxed text-[#733614]">
              Wipes every rehab photo and approval so the crew starts clean. Use
              this for testing, not once the build is live.
            </p>
            <div className="mt-3">
              <ResetRehabButton />
            </div>
          </div>
        </section>

        <footer className="pt-10 text-center text-[16px] font-medium tracking-[0.12em] text-[#8291A5]">
          Able OS · V1 Build
        </footer>
      </main>

      <CreateDailyTaskModal
        onClose={() => setCreateOpen(false)}
        onCreate={daily.createTask}
        open={createOpen}
      />

      <CompleteDailyTaskModal
        onClose={() => setCompleting(null)}
        onComplete={daily.completeTask}
        open={Boolean(completing)}
        task={completing}
      />

      <TaskChatModal
        onChanged={loadCommentCounts}
        onClose={() => setChatTask(null)}
        task={chatTask}
      />

      <AddOrderModal
        open={addOrderOpen}
        onClose={() => setAddOrderOpen(false)}
        onCreated={() => {
          setToast("Order sent to Raj for approval");
          loadOrders();
        }}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-2xl bg-[#1A1A2E] px-5 py-3.5 shadow-[0_16px_32px_rgba(26,26,46,0.28)]"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            role="status"
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#16A34A] text-white">
              <CheckIcon aria-hidden="true" size={14} strokeWidth={3} />
            </span>
            <p className="text-[16px] font-medium text-white">
              {toast}
            </p>
            <button
              aria-label="Dismiss"
              className="ml-1 shrink-0 text-[16px] font-semibold tracking-wide text-white/60 transition-colors hover:text-white"
              onClick={() => setToast("")}
              type="button"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type InsightCardProps = {
  label: string;
  value?: string;
  tone: "critical" | "queued" | "success";
};

function InsightCard({
  label,
  value,
  tone,
}: Omit<InsightCardProps, "tone"> & {
  tone: "critical" | "queued" | "success" | "yellow";
}) {
  const tones = {
    critical: "text-[#FF7832] bg-[#FFF1E9]",
    queued: "text-[#418BFF] bg-[#EEF5FF]",
    success: "text-[#16A34A] bg-[#EAF8EF]",
    yellow: "text-[#CA8A04] bg-[#FEF9C3]",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-[#DCE4EE] bg-white px-3.5 py-4 text-center shadow-[0_4px_12px_rgba(30,58,138,0.045)] sm:px-4 sm:py-5">
      <p
        className={`inline-flex items-center justify-center rounded-lg px-2 py-1 text-[24px] font-semibold leading-none tracking-[-0.06em] sm:text-[27px] ${tones[tone]}`}
      >
        {tone === "success" ? (
          <CheckIcon aria-hidden="true" size={24} strokeWidth={3} />
        ) : (
          value
        )}
      </p>
      <p className="mt-3 text-[14px] font-semibold leading-tight tracking-[0.06em] text-[#718096]">
        {label}
      </p>
    </article>
  );
}

type SectionHeadingProps = {
  id: string;
  children: React.ReactNode;
};

function SectionHeading({ id, children }: SectionHeadingProps) {
  return (
    <h2
      className="text-[19px] font-semibold leading-none tracking-[-0.035em] text-[#1A1A2E] sm:text-[21px]"
      id={id}
    >
      {children}
    </h2>
  );
}
