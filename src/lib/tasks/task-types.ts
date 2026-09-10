export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface Task {
  id: string;
  serial: number | null;
  title: string;
  branchName: string | null;
  details: string | null;
  status: TaskStatus;
  createdAt: string;
  completedAt: string | null;
}

export type TaskListFilter = TaskStatus | "ALL";

export type TaskActor = "USER" | "MCP";

export type TaskEventAction =
  | "CREATED"
  | "UPDATED"
  | "COMPLETED"
  | "REOPENED"
  | "DELETED";

export interface TaskEvent {
  id: number;
  taskId: string | null;
  actor: TaskActor;
  action: TaskEventAction;
  createdAt: string;
}

export type TaskErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "INVALID_STATE"
  | "CONFLICT"
  | "UNAVAILABLE";

export class TaskServiceError extends Error {
  readonly code: TaskErrorCode;
  readonly details?: unknown;

  constructor(code: TaskErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "TaskServiceError";
    this.code = code;
    this.details = details;
  }
}

export const TASK_STATUSES: readonly TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export function isActive(status: TaskStatus): boolean {
  return status !== "COMPLETED";
}

export function formatWorkOrder(serial: number | null): string {
  return serial === null ? "WORK ORDER" : `WORK ORDER #${String(serial).padStart(4, "0")}`;
}

export function formatSerialCode(serial: number | null): string {
  const year = new Date().getFullYear();
  return serial === null ? "MC-????-????" : `MC-${year}-${String(serial).padStart(4, "0")}`;
}
