/**
 * Formats a due date for display and says whether it has passed.
 * Dates are plain YYYY-MM-DD in the business timezone, so we compare
 * strings rather than Date objects to avoid timezone drift.
 */
export function describeDue(dueOn: string | null, todayYmd: string) {
  if (!dueOn) return null;
  const [y, m, d] = dueOn.split("-").map(Number);
  if (!y || !m || !d) return null;
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  if (dueOn < todayYmd) return { label: `Overdue · ${label}`, overdue: true };
  if (dueOn === todayYmd) return { label: "Due today", overdue: false };
  return { label: `Due ${label}`, overdue: false };
}
