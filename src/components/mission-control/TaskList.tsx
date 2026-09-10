"use client";

import { TaskCard } from "./TaskCard";
import { EmptyState } from "./EmptyState";
import type { Task, TaskListFilter } from "@/lib/tasks/task-types";

interface TaskListProps {
  tasks: Task[];
  filter: TaskListFilter;
  loading: boolean;
  searchMode: boolean;
  hasAnyTasks: boolean;
  onOpen: (task: Task) => void;
  onComplete: (task: Task) => void;
}

export function TaskList({
  tasks,
  filter,
  loading,
  searchMode,
  hasAnyTasks,
  onOpen,
  onComplete,
}: TaskListProps) {
  if (loading) {
    return (
      <div className="paper-surface p-6 md:p-8 text-center anim-fade" aria-busy="true">
        <p className="tech-label anim-pulse">
          {searchMode ? "SEARCHING WORK ORDERS..." : "SYNCHRONIZING WORK ORDERS..."}
        </p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState filter={filter} hasAnyTasks={hasAnyTasks} />;
  }

  return (
    <ul className="space-y-3 md:space-y-4" aria-label="Work orders">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onOpen={onOpen} onComplete={onComplete} />
      ))}
    </ul>
  );
}
