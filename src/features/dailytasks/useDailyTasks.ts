import React from "react";
import { apiFetch } from "../../lib/apiFetch";

export type DailyTaskPriority = "Urgent" | "Not urgent";
export type DailyTaskState = "draft" | "in_progress" | "completed";

export type DailyTaskFile = {
  id: string;
  task_id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

export type DailyTask = {
  id: string;
  owner_cockpit: string;
  title: string;
  description: string | null;
  priority: DailyTaskPriority;
  state: DailyTaskState;
  completion_note: string | null;
  created_at: string;
  created_on: string;
  completed_at: string | null;
  /** Date in the business timezone, so everyone agrees which day it was. */
  completed_on: string | null;
  /** Date the task is due, in the business timezone. Null means no deadline. */
  due_on: string | null;
  files: DailyTaskFile[];
};

const POLL_MS = 30_000;

type Options = {
  /** Only Raj may pass someone else's cockpit. */
  owner?: string;
};

export function useDailyTasks({ owner }: Options = {}) {
  const [tasks, setTasks] = React.useState<DailyTask[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [today, setToday] = React.useState("");

  const load = React.useCallback(async () => {
    try {
      const url = owner
        ? `/api/daily-tasks?owner=${encodeURIComponent(owner)}`
        : "/api/daily-tasks";

      const res = await apiFetch(url);
      if (res.status === 401) return; // signed out mid-poll

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Could not load tasks");

      setTasks(Array.isArray(body.tasks) ? body.tasks : []);
      if (body.today) setToday(body.today);
      setError("");
    } catch (err) {
      console.error("Failed to load daily tasks:", err);
      setError(err instanceof Error ? err.message : "Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [owner]);

  React.useEffect(() => {
    load();
  }, [load]);

  // Poll while visible, and refresh the moment the tab regains focus.
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

  const createTask = React.useCallback(
    async (input: {
      title: string;
      description: string;
      priority: DailyTaskPriority;
      /** YYYY-MM-DD. Omit for no deadline. */
      due_on?: string;
      /** Omit to start it straight away. */
      state?: "draft";
    }) => {
      const res = await apiFetch("/api/daily-tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(body?.error || "Could not create the task");

      setTasks((current) => [body.task, ...current]);
      return body.task as DailyTask;
    },
    [],
  );

  const completeTask = React.useCallback(
    async (id: string, note: string) => {
      setBusyId(id);
      try {
        const res = await apiFetch("/api/daily-tasks", {
          method: "PATCH",
          body: JSON.stringify({ id, action: "complete", note }),
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(body?.error || "Could not complete it");

        // Refetch rather than patch in place, so evidence uploaded during
        // the same flow comes back attached.
        await load();
        return true;
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const reopenTask = React.useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const res = await apiFetch("/api/daily-tasks", {
          method: "PATCH",
          body: JSON.stringify({ id, action: "reopen" }),
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(body?.error || "Could not reopen it");

        await load();
        return true;
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const publishTask = React.useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        const res = await apiFetch("/api/daily-tasks", {
          method: "PATCH",
          body: JSON.stringify({ id, action: "publish" }),
        });
        const body = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(body?.error || "Could not start it");

        await load();
        return true;
      } finally {
        setBusyId(null);
      }
    },
    [load],
  );

  const drafts = React.useMemo(
    () => tasks.filter((task) => task.state === "draft"),
    [tasks],
  );

  const inProgress = React.useMemo(
    () => tasks.filter((task) => task.state === "in_progress"),
    [tasks],
  );

  const completed = React.useMemo(
    () => tasks.filter((task) => task.state === "completed"),
    [tasks],
  );

  return {
    busyId,
    completeTask,
    completed,
    createTask,
    drafts,
    error,
    inProgress,
    loading,
    publishTask,
    refresh: load,
    reopenTask,
    tasks,
    today,
  };
}
