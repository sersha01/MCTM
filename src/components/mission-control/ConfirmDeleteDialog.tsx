"use client";

import { useEffect, useRef } from "react";
import type { Task } from "@/lib/tasks/task-types";
import { formatWorkOrder } from "@/lib/tasks/task-types";

interface ConfirmDeleteDialogProps {
  task: Task;
  onCancel: () => void;
  onConfirm: (task: Task) => void;
  busy: boolean;
}

/**
 * Destructive-action confirmation. Never deletes on a single tap.
 */
export function ConfirmDeleteDialog({ task, onCancel, onConfirm, busy }: ConfirmDeleteDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  return (
    <div
      className="overlay-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Delete work order"
        className="sheet-panel anim-sheet-in max-w-md"
      >
        <div className="px-5 pt-5 pb-3 border-b border-line">
          <p className="tech-label">Delete Work Order?</p>
          <p className="mt-2 text-sm font-semibold wrap-anywhere">
            {formatWorkOrder(task.serial)} — {task.title}
          </p>
          <p className="mt-1 text-xs text-ink-muted">This operation cannot be undone.</p>
        </div>
        <div className="px-5 py-4 flex gap-3 safe-bottom">
          <button
            ref={cancelRef}
            type="button"
            className="btn-eng flex-1"
            onClick={onCancel}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-eng is-danger flex-1"
            onClick={() => onConfirm(task)}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
