import type { TaskStatus } from "@/lib/tasks/task-types";

interface TaskStatusChipProps {
  status: TaskStatus;
  className?: string;
}

const statusConfig: Record<TaskStatus, { label: string; chipClass: string; mark: string }> = {
  TODO: { label: "TODO", chipClass: "chip-todo", mark: "○" },
  IN_PROGRESS: { label: "IN PROGRESS", chipClass: "chip-progress", mark: "●" },
  COMPLETED: { label: "COMPLETED", chipClass: "chip-completed", mark: "✓" },
};

/**
 * Status indicator with light + text. Never relies on color alone.
 */
export function TaskStatusChip({ status, className = "" }: TaskStatusChipProps) {
  const config = statusConfig[status];
  return (
    <span className={`chip ${config.chipClass} ${className}`}>
      <span aria-hidden="true">{config.mark}</span>
      <span>{config.label}</span>
      <span className="sr-only">Status: {config.label}</span>
    </span>
  );
}
