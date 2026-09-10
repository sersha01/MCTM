import type { Task } from "@/lib/tasks/task-types";
import { formatWorkOrder } from "@/lib/tasks/task-types";
import { TaskStatusChip } from "./TaskStatusChip";

interface TaskCardProps {
  task: Task;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => void;
  busy?: boolean;
}

export function TaskCard({ task, onOpen, onComplete, busy = false }: TaskCardProps) {
  const completed = task.status === "COMPLETED";

  return (
    <li className="paper-card p-4 md:p-5 anim-fade-up">
      <article
        className="cursor-pointer"
        onClick={() => onOpen(task)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(task);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={`Open ${formatWorkOrder(task.serial)}: ${task.title}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="tech-label">{formatWorkOrder(task.serial)}</p>
          <TaskStatusChip status={task.status} />
        </div>

        <h3 className="mt-2 text-base md:text-lg font-semibold leading-snug wrap-anywhere">
          {task.title}
        </h3>

        {task.branchName ? (
          <p className="mt-2 font-mono text-xs md:text-sm text-teal wrap-anywhere break-all">
            {task.branchName}
          </p>
        ) : null}

        {completed && task.completedAt ? (
          <p className="mt-2 font-mono text-[0.6875rem] text-ink-muted">
            COMPLETED · {new Date(task.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}
          </p>
        ) : null}
      </article>

      {!completed ? (
        <div className="mt-3 pt-3 border-t border-dashed border-line">
          <button
            type="button"
            className="btn-eng is-primary w-full md:w-auto"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(task);
            }}
          >
            Mark Complete
          </button>
        </div>
      ) : null}
    </li>
  );
}
