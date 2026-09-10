"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Task, TaskListFilter } from "@/lib/tasks/task-types";
import { Header } from "./mission-control/Header";
import { DesktopSidebar } from "./mission-control/DesktopSidebar";
import { MobileNavigation } from "./mission-control/MobileNavigation";
import { TaskList } from "./mission-control/TaskList";
import { TaskDetail } from "./mission-control/TaskDetail";
import { TaskForm } from "./mission-control/TaskForm";
import { ConfirmDeleteDialog } from "./mission-control/ConfirmDeleteDialog";
import { SearchBar } from "./mission-control/SearchBar";

/* ─── Minimal client data layer over the API routes ─── */

type Listener = () => void;

class TaskStore {
  tasks: Task[] = [];
  counts = { all: 0, active: 0, completed: 0 };
  loading = true;
  error: string | null = null;
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => ({
    tasks: this.tasks,
    counts: this.counts,
    loading: this.loading,
    error: this.error,
  });

  private emit() {
    this.listeners.forEach((l) => l());
  }

  private recomputeCounts() {
    this.counts = {
      all: this.tasks.length,
      active: this.tasks.filter((t) => t.status !== "COMPLETED").length,
      completed: this.tasks.filter((t) => t.status === "COMPLETED").length,
    };
  }

  async refresh(search?: string) {
    this.loading = true;
    this.error = null;
    this.emit();
    try {
      const url = search ? `/api/tasks?q=${encodeURIComponent(search)}` : "/api/tasks";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("SYNCHRONIZATION FAILED");
      const body = (await res.json()) as { tasks: Task[] };
      this.tasks = body.tasks;
      this.recomputeCounts();
      this.loading = false;
      this.emit();
    } catch {
      this.loading = false;
      this.error = "UNABLE TO SYNCHRONIZE WORK ORDERS.";
      this.emit();
    }
  }

  async create(input: { title: string; branchName?: string; details?: string }): Promise<void> {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      throw new Error(body?.error?.message ?? "UNABLE TO CREATE WORK ORDER.");
    }
    await this.refresh();
  }

  async update(
    id: string,
    patch: { title?: string; branchName?: string | null; details?: string | null; status?: Task["status"] }
  ): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("UNABLE TO UPDATE WORK ORDER.");
    await this.refresh();
  }

  async complete(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: "POST" });
    if (!res.ok) throw new Error("UNABLE TO COMPLETE WORK ORDER.");
    await this.refresh();
  }

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("UNABLE TO DELETE WORK ORDER.");
    await this.refresh();
  }
}

/* ─── Status ordering: IN_PROGRESS → TODO, newest first ─── */

const STATUS_ORDER: Record<Task["status"], number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  COMPLETED: 2,
};

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.status === "COMPLETED" && b.status === "COMPLETED") {
      // Newest completion first
      return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    }
    const so = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (so !== 0) return so;
    return (b.createdAt).localeCompare(a.createdAt);
  });
}

/* ─── Main console component ─── */

export function MissionControlTaskManager({ initialTasks }: { initialTasks: Task[] }) {
  const storeRef = useRef<TaskStore | null>(null);
  if (!storeRef.current) storeRef.current = new TaskStore();
  const store = storeRef.current;

  useEffect(() => {
    store.tasks = initialTasks;
    store.loading = false;
    store.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);

  const [filter, setFilter] = useState<TaskListFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formTask, setFormTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshDetail = useCallback(
    (id: string) => {
      const updated = state.tasks.find((t) => t.id === id);
      if (updated && detailTask?.id === id) setDetailTask(updated);
    },
    [state.tasks, detailTask]
  );

  /* Debounced search */
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      void store.refresh(q.trim() || undefined);
    }, 250);
  }, [store]);

  /* Keyboard shortcuts (desktop) */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (typing) return;

      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setFormTask(null);
        setFormOpen(true);
      } else if (e.key.toLowerCase() === "a") {
        setFilter("TODO");
      } else if (e.key.toLowerCase() === "c") {
        setFilter("COMPLETED");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Keep any open detail sheet in sync with store updates */
  useEffect(() => {
    if (detailTask) refreshDetail(detailTask.id);
  }, [state.tasks, detailTask, refreshDetail]);

  const filteredTasks = useMemo(() => {
    let list = state.tasks;
    if (filter === "TODO" || filter === "IN_PROGRESS") {
      list = list.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS");
    } else if (filter === "COMPLETED") {
      list = list.filter((t) => t.status === "COMPLETED");
    }
    return sortTasks(list);
  }, [state.tasks, filter]);

  const handleComplete = useCallback(
    async (task: Task) => {
      if (busyId) return;
      setBusyId(task.id);
      try {
        await store.complete(task.id);
        setNotice(`WORK ORDER COMPLETED.`);
        setTimeout(() => setNotice(null), 2400);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "UNABLE TO COMPLETE WORK ORDER.");
        setTimeout(() => setNotice(null), 3600);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, store]
  );

  const handleSetStatus = useCallback(
    async (task: Task, status: "TODO" | "IN_PROGRESS") => {
      if (busyId) return;
      setBusyId(task.id);
      try {
        await store.update(task.id, { status });
        setNotice(status === "IN_PROGRESS" ? "WORK ORDER REOPENED." : "WORK ORDER QUEUED.");
        setTimeout(() => setNotice(null), 2400);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "UNABLE TO UPDATE WORK ORDER.");
        setTimeout(() => setNotice(null), 3600);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, store]
  );

  const handleDeleteConfirm = useCallback(
    async (task: Task) => {
      if (busyId) return;
      setBusyId(task.id);
      try {
        await store.remove(task.id);
        setDeleteTask(null);
        setDetailTask(null);
        setNotice("WORK ORDER DELETED.");
        setTimeout(() => setNotice(null), 2400);
      } catch (err) {
        setNotice(err instanceof Error ? err.message : "UNABLE TO DELETE WORK ORDER.");
        setTimeout(() => setNotice(null), 3600);
      } finally {
        setBusyId(null);
      }
    },
    [busyId, store]
  );

  const handleFormSubmit = useCallback(
    async (input: { title: string; branchName?: string; details?: string }) => {
      if (formTask) {
        await store.update(formTask.id, input);
      } else {
        await store.create(input);
      }
    },
    [formTask, store]
  );

  const openCreate = useCallback(() => {
    setFormTask(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((task: Task) => {
    setFormTask(task);
    setFormOpen(true);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      <Header mcpConnected={false} />

      <div className="flex flex-1 min-h-0">
        <DesktopSidebar
          filter={filter}
          counts={state.counts}
          onSelectFilter={setFilter}
          onNewTask={openCreate}
        />

        <main className="flex-1 min-w-0 flex flex-col pb-[76px] md:pb-0">
          <div className="px-4 md:px-6 pt-4 md:pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mono text-xs md:text-sm tracking-[0.18em] uppercase font-semibold">
                {searchOpen ? "Search Results" : filter === "COMPLETED" ? "Archive" : "Active Work Orders"}
              </h2>
              <p className="tech-label hidden md:block">
                {filteredTasks.length} ORDER{filteredTasks.length === 1 ? "" : "S"}
              </p>
            </div>
          </div>

          {searchOpen ? (
            <SearchBar
              open={searchOpen}
              query={searchQuery}
              onChange={onSearchChange}
              onClose={() => {
                setSearchOpen(false);
                if (searchQuery) {
                  setSearchQuery("");
                  void store.refresh();
                }
              }}
            />
          ) : null}

          <div className="flex-1 px-4 md:px-6 py-4 md:py-5">
            {notice ? (
              <p
                role="status"
                className="mb-4 paper-surface px-3 py-2 font-mono text-[0.6875rem] tracking-widest uppercase anim-fade"
              >
                {notice}
              </p>
            ) : null}

            <TaskList
              tasks={filteredTasks}
              filter={filter}
              loading={state.loading}
              searchMode={Boolean(searchQuery)}
              hasAnyTasks={state.counts.all > 0}
              onOpen={(task) => setDetailTask(task)}
              onComplete={handleComplete}
            />
          </div>
        </main>
      </div>

      <MobileNavigation
        filter={filter}
        counts={state.counts}
        onSelectFilter={(f) => setFilter(f)}
        onNewTask={openCreate}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {detailTask ? (
        <TaskDetail
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onEdit={openEdit}
          onSetStatus={handleSetStatus}
          onComplete={handleComplete}
          onDelete={(t) => setDeleteTask(t)}
          busy={busyId === detailTask.id}
        />
      ) : null}

      <TaskForm
        open={formOpen}
        task={formTask}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {deleteTask ? (
        <ConfirmDeleteDialog
          task={deleteTask}
          onCancel={() => setDeleteTask(null)}
          onConfirm={handleDeleteConfirm}
          busy={busyId === deleteTask.id}
        />
      ) : null}
    </div>
  );
}
