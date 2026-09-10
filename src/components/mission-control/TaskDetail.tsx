"use client";

import { formatWorkOrder, type Task } from "@/lib/tasks/task-types";
import { Button } from "@/components/ui/Button";
import { TaskStatusChip } from "./TaskStatusChip";

interface TaskDetailProps {
  task: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
  onSetStatus: (task: Task, status: "TODO" | "IN_PROGRESS") => void;
  onComplete: (task: Task) => void;
  onDelete: (task: Task) => void;
  busy: boolean;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date.toUpperCase()} · ${time}`;
}

/**
 * Full-screen task detail. One-handed friendly: primary action
 * pinned to the bottom.
 */
export function TaskDetail({
  task,
  onClose,
  onEdit,
  onSetStatus,
  onComplete,
  onDelete,
  busy,
}: TaskDetailProps) {
  const completed = task.status === "COMPLETED";

  return (
    <div
      className="overlay-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${formatWorkOrder(task.serial)} detail`}
        className="sheet-panel anim-sheet-in"
      >
        <header className="px-5 pt-4 pb-3 border-b border-line flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="btn-eng !min-h-[38px] !py-1.5 !px-3">
            ← Back
          </button>
          <p className="tech-label wrap-anywhere">{formatWorkOrder(task.serial)}</p>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          <h2 className="text-xl md:text-2xl font-semibold leading-snug wrap-anywhere">
            {task.title}
          </h2>

          <section>
            <p className="tech-label mb-1.5">Status</p>
            <TaskStatusChip status={task.status} />
          </section>

          {task.branchName ? (
            <section>
              <p className="tech-label mb-1.5">Working Branch</p>
              <p className="font-mono text-sm text-teal wrap-anywhere break-all">{task.branchName}</p>
            </section>
          ) : null}

          {task.details ? (
            <section>
              <p className="tech-label mb-1.5">Details</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere">
                {task.details}
              </p>
            </section>
          ) : null}

          <section>
            <p className="tech-label mb-1.5">Created</p>
            <p className="font-mono text-xs">{formatDate(task.createdAt)}</p>
          </section>

          {completed && task.completedAt ? (
            <section>
              <p className="tech-label mb-1.5">Completed</p>
              <p className="font-mono text-xs">{formatDate(task.completedAt)}</p>
            </section>
          ) : null}

          <hr className="divider-eng dashed" />

          <div className="flex flex-wrap gap-2.5">
            <Button type="button" onClick={() => onEdit(task)} disabled={busy}>
              Edit
            </Button>
            {!completed ? (
              <>
                {task.status === "TODO" ? (
                  <Button type="button" onClick={() => onSetStatus(task, "IN_PROGRESS")} disabled={busy}>
                    Start Work
                  </Button>
                ) : null}
                <Button
                  type="button"
                  onClick={() => onDelete(task)}
                  variant="danger"
                  disabled={busy}
                >
                  Delete
                </Button>
              </>
            ) : null}
            {completed ? (
              <>
                <Button type="button" onClick={() => onSetStatus(task, "IN_PROGRESS")} disabled={busy}>
                  Reopen
                </Button>
                <Button type="button" onClick={() => onDelete(task)} variant="danger" disabled={busy}>
                  Delete
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <footer className="px-5 py-4 border-t border-line safe-bottom">
          {completed ? (
            <div className="flex items-center justify-between">
              <span className="stamp">Completed</span>
            </div>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              loading={busy}
              onClick={() => onComplete(task)}
            >
              Mark Complete
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}
