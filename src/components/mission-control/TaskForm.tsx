"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import type { Task } from "@/lib/tasks/task-types";

interface TaskFormProps {
  open: boolean;
  task?: Task | null;
  onClose: () => void;
  onSubmit: (input: { title: string; branchName?: string; details?: string }) => Promise<void>;
}

/**
 * Full-screen-on-mobile sheet for creating / editing a work order.
 * Only the title is required. Escape closes; submission is
 * double-tap guarded; entered data is preserved on failure.
 */
export function TaskForm({ open, task, onClose, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [branchName, setBranchName] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setBranchName(task?.branchName ?? "");
      setDetails(task?.details ?? "");
      setError(null);
      const t = setTimeout(() => titleRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open, task]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const editing = Boolean(task);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // prevent double submission

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("A task title is required.");
      titleRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: trimmedTitle,
        branchName: branchName.trim() || undefined,
        details: details.trim() || undefined,
      });
      // Parent closes on success.
    } catch (err) {
      // Preserve everything the user typed.
      setError(err instanceof Error ? err.message : "Unable to save work order.");
      setSubmitting(false);
    }
  };

  return (
    <div
      className="overlay-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit work order" : "New work order"}
        className="sheet-panel anim-sheet-in"
      >
        <header className="px-5 pt-4 pb-3 border-b border-line">
          <p className="tech-label">{editing ? "EDIT WORK ORDER" : "NEW WORK ORDER"}</p>
        </header>

        <form
          id={formId}
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          <Input
            ref={titleRef}
            name="title"
            label="Task Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={280}
            autoComplete="off"
            enterKeyHint="next"
            required
          />
          <Input
            name="branchName"
            label="Working Branch"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="fix/auth-middleware"
            maxLength={280}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="font-mono"
          />
          <Textarea
            name="details"
            label="Details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Necessary context only..."
            maxLength={4000}
          />

          {error ? (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </form>

        <footer className="px-5 py-4 border-t border-line flex gap-3 safe-bottom">
          <Button type="button" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="primary"
            loading={submitting}
            className="flex-1"
          >
            {editing ? "Save Changes" : "Create Order"}
          </Button>
        </footer>
      </div>
    </div>
  );
}
