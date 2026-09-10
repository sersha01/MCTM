"use client";

import type { TaskListFilter } from "@/lib/tasks/task-types";

interface MobileNavigationProps {
  filter: TaskListFilter;
  counts: { all: number; active: number; completed: number };
  onSelectFilter: (filter: TaskListFilter) => void;
  onNewTask: () => void;
  onOpenSearch: () => void;
}

const filters: Array<{ value: TaskListFilter; short: string; long: string; countKey: keyof MobileNavigationProps["counts"] }> = [
  { value: "ALL", short: "ALL", long: "ALL", countKey: "all" },
  { value: "TODO", short: "ACTIVE", long: "ACTIVE", countKey: "active" },
  { value: "COMPLETED", short: "DONE", long: "COMPLETED", countKey: "completed" },
];

/**
 * Mobile bottom navigation: filters + new + search.
 * Hidden on md+ where the sidebar takes over.
 */
export function MobileNavigation({
  filter,
  counts,
  onSelectFilter,
  onNewTask,
  onOpenSearch,
}: MobileNavigationProps) {
  return (
    <nav
      aria-label="Task navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-paper border-t border-line-strong safe-bottom"
    >
      <div className="grid grid-cols-[1fr_1fr_1fr_auto_auto] items-stretch">
        {filters.map((f) => {
          const selected = filter === f.value || (f.value === "TODO" && filter === "IN_PROGRESS");
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={selected}
              aria-current={selected ? "page" : undefined}
              onClick={() => {
                if (f.value === "TODO") {
                  // ACTIVE shows both TODO and IN_PROGRESS
                  onSelectFilter(filter === "TODO" ? "ALL" : "TODO");
                } else {
                  onSelectFilter(f.value);
                }
              }}
              className={`min-h-[52px] font-mono text-[0.6875rem] tracking-widest font-semibold uppercase border-r border-line flex flex-col items-center justify-center gap-0.5 ${
                selected ? "bg-paper-deep text-ink" : "text-ink-muted"
              }`}
            >
              <span>{f.short}</span>
              <span className="text-[0.625rem] opacity-70">{counts[f.countKey]}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Search work orders"
          onClick={onOpenSearch}
          className="min-h-[52px] px-4 border-r border-line flex items-center justify-center text-ink-muted"
        >
          <span aria-hidden="true" className="font-mono text-sm">
            /
          </span>
          <span className="sr-only">Search</span>
        </button>
        <button
          type="button"
          aria-label="New work order"
          onClick={onNewTask}
          className="min-h-[52px] px-5 bg-olive text-[#f4efe2] dark:text-[#1b1a17] font-mono text-lg font-semibold flex items-center justify-center"
        >
          +
        </button>
      </div>
    </nav>
  );
}
