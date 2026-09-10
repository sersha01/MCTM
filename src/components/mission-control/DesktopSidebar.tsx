"use client";

import type { TaskListFilter } from "@/lib/tasks/task-types";

interface DesktopSidebarProps {
  filter: TaskListFilter;
  counts: { all: number; active: number; completed: number };
  onSelectFilter: (filter: TaskListFilter) => void;
  onNewTask: () => void;
}

const items: Array<{
  value: TaskListFilter;
  label: string;
  countKey: "all" | "active" | "completed";
}> = [
  { value: "ALL", label: "ALL", countKey: "all" },
  { value: "TODO", label: "ACTIVE", countKey: "active" },
  { value: "COMPLETED", label: "COMPLETED", countKey: "completed" },
];

/**
 * Desktop sidebar. Hidden below md; MobileNavigation takes over.
 */
export function DesktopSidebar({ filter, counts, onSelectFilter, onNewTask }: DesktopSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 border-r border-line bg-paper-deep min-h-0">
      <div className="p-4 lg:p-5 border-b border-line">
        <button type="button" onClick={onNewTask} className="btn-eng is-primary w-full">
          + New Work Order
        </button>
      </div>

      <nav aria-label="Task navigation" className="p-3 lg:p-4 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const selected =
            filter === item.value || (item.value === "TODO" && filter === "IN_PROGRESS");
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={selected}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelectFilter(item.value)}
              className={`w-full flex items-center justify-between px-3 py-2.5 font-mono text-xs tracking-widest uppercase border transition-colors ${
                selected
                  ? "bg-paper border-ink font-semibold text-ink shadow-[2px_2px_0_0_rgba(0,0,0,0.08)]"
                  : "border-transparent text-ink-muted hover:text-ink hover:border-line"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[0.625rem] tabular-nums opacity-70">
                {counts[item.countKey]}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 lg:p-5 border-t border-line space-y-2">
        <p className="tech-label">System Log</p>
        <p className="text-[0.6875rem] text-ink-muted leading-relaxed font-mono">
          AI operates this console via MCP tools. See README for setup.
        </p>
      </div>
    </aside>
  );
}
