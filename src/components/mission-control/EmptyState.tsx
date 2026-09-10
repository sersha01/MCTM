import type { TaskListFilter } from "@/lib/tasks/task-types";

interface EmptyStateProps {
  filter: TaskListFilter;
  hasAnyTasks: boolean;
}

export function EmptyState({ filter, hasAnyTasks }: EmptyStateProps) {
  let title = "NO WORK ORDERS";
  let body = "The system is ready.";

  if (filter === "TODO" || filter === "IN_PROGRESS") {
    title = "MISSION QUEUE CLEAR";
    body = "No active work orders. Create a new work order or let your AI operator create one.";
  } else if (filter === "COMPLETED") {
    title = "ARCHIVE EMPTY";
    body = "No completed work orders yet.";
  } else if (hasAnyTasks) {
    title = "NO MATCHING WORK ORDERS";
    body = "Adjust the search parameters.";
  }

  return (
    <div className="paper-surface p-6 md:p-8 text-center anim-fade">
      <p className="tech-label">{title}</p>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
    </div>
  );
}
