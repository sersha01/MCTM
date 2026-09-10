import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database-types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  actorSchema,
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "./task-validation";
import {
  TaskServiceError,
  type Task,
  type TaskActor,
  type TaskEvent,
  type TaskListFilter,
} from "./task-types";
import type { TaskRow, TaskEventRow } from "@/lib/supabase/database-types";

/**
 * TASK SERVICE — single source of business logic.
 *
 * Used by:
 *   - Next.js Server Components (data fetching)
 *   - Next.js API routes (mutations)
 *   - MCP server (AI operator)
 *
 * The database owns all timestamps. Callers never supply
 * created_at or completed_at.
 */

type ServiceClient = SupabaseClient<Database>;

function mapRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    serial: row.serial,
    title: row.title,
    branchName: row.branch_name,
    details: row.details,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function mapEventRow(row: TaskEventRow): TaskEvent {
  return {
    id: row.id,
    taskId: row.task_id,
    actor: row.actor,
    action: row.action,
    createdAt: row.created_at,
  };
}

function unavailableError(message: string, details: unknown): TaskServiceError {
  return new TaskServiceError(
    "UNAVAILABLE",
    message,
    details instanceof Error ? details.message : details
  );
}

export class TaskService {
  private client: ServiceClient | null;

  constructor(client?: ServiceClient | null) {
    this.client = client !== undefined ? client : createServerSupabaseClient();
  }

  private requireClient(): ServiceClient {
    if (!this.client) {
      throw new TaskServiceError(
        "UNAVAILABLE",
        "Database connection is not configured. Supabase credentials are missing."
      );
    }
    return this.client;
  }

  async createTask(input: CreateTaskInput, actor: TaskActor = "USER"): Promise<Task> {
    const client = this.requireClient();
    actorSchema.parse(actor);
    const data = createTaskSchema.parse(input);

    const { data: row, error } = await client
      .from("tasks")
      .insert({
        title: data.title,
        branch_name: data.branchName,
        details: data.details,
        // status defaults to TODO, created_at to now(), completed_at to null.
      })
      .select()
      .single();

    if (error || !row) {
      throw unavailableError("Unable to create work order. The task service did not respond.", error);
    }

    await this.logEvent(row.id, actor, "CREATED");
    return mapRowToTask(row);
  }

  async getTask(taskId: string): Promise<Task> {
    const client = this.requireClient();
    const id = taskIdSchema.parse(taskId);

    const { data: row, error } = await client
      .from("tasks")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw unavailableError("Unable to retrieve work order. The task service did not respond.", error);
    }
    if (!row) {
      throw new TaskServiceError("NOT_FOUND", `Work order ${id} not found.`);
    }
    return mapRowToTask(row);
  }

  async listTasks(filter: TaskListFilter = "ALL", search?: string | null): Promise<Task[]> {
    const client = this.requireClient();

    let query = client.from("tasks").select();

    if (filter !== "ALL") {
      query = query.eq("status", filter);
    }

    const term = search?.trim();
    if (term) {
      const pattern = `%${term.replace(/[%,_]/g, (m) => `\\${m}`)}%`;
      query = query.or(
        `title.ilike.${pattern},branch_name.ilike.${pattern},details.ilike.${pattern}`
      );
    }

    const { data: rows, error } = await query
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw unavailableError("Unable to load work orders. The task service did not respond.", error);
    }

    return (rows ?? []).map(mapRowToTask);
  }

  async countTasks(): Promise<{ all: number; active: number; completed: number }> {
    const client = this.requireClient();

    const { data: rows, error } = await client.from("tasks").select("status");
    if (error) {
      throw unavailableError("Unable to count work orders. The task service did not respond.", error);
    }

    const statuses = (rows ?? []).map((r) => r.status);
    return {
      all: statuses.length,
      active: statuses.filter((s) => s !== "COMPLETED").length,
      completed: statuses.filter((s) => s === "COMPLETED").length,
    };
  }

  /**
   * Statuses allowed for active-task ordering:
   *   IN_PROGRESS first, then TODO. Within a status, newest first.
   * Completed tasks: newest completion first.
   */
  async updateTask(taskId: string, input: UpdateTaskInput, actor: TaskActor = "USER"): Promise<Task> {
    const id = taskIdSchema.parse(taskId);
    actorSchema.parse(actor);
    const data = updateTaskSchema.parse(input);

    const existing = await this.getTask(id);

    const patch: Database["public"]["Tables"]["tasks"]["Update"] = {};

    if (data.title !== undefined && data.title !== existing.title) {
      patch.title = data.title;
    }
    if (data.branchName !== undefined && data.branchName !== existing.branchName) {
      patch.branch_name = data.branchName;
    }
    if (data.details !== undefined && data.details !== existing.details) {
      patch.details = data.details;
    }

    if (data.status !== undefined && data.status !== existing.status) {
      if (data.status === "COMPLETED") {
        // Route through the same completion logic as completeTask().
        return this.completeTask(id, actor);
      }
      // Reopening a completed task clears the completion stamp.
      patch.status = data.status;
      patch.completed_at = null;
      await this.logEvent(id, actor, "REOPENED");
    }

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    const client = this.requireClient();
    const { data: row, error } = await client
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (error || !row) {
      throw unavailableError("Unable to update work order. The task service did not respond.", error);
    }

    await this.logEvent(id, actor, "UPDATED");
    return mapRowToTask(row);
  }

  /**
   * Completion is server-owned:
   *   status = COMPLETED
   *   completed_at = server time at the moment of the request.
   * The caller (human or AI) never supplies a timestamp.
   * Completing an already-completed order is an idempotent no-op.
   */
  async completeTask(taskId: string, actor: TaskActor = "USER"): Promise<Task> {
    const id = taskIdSchema.parse(taskId);
    actorSchema.parse(actor);

    const existing = await this.getTask(id);
    if (existing.status === "COMPLETED") {
      return existing;
    }

    const client = this.requireClient();
    const { data: row, error } = await client
      .from("tasks")
      .update({ status: "COMPLETED", completed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !row) {
      throw unavailableError("Unable to complete work order. The task service did not respond.", error);
    }

    await this.logEvent(id, actor, "COMPLETED");
    return mapRowToTask(row);
  }

  async reopenTask(taskId: string, actor: TaskActor = "USER"): Promise<Task> {
    return this.updateTask(taskId, { status: "IN_PROGRESS" }, actor);
  }

  async deleteTask(taskId: string, actor: TaskActor = "USER"): Promise<void> {
    const client = this.requireClient();
    const id = taskIdSchema.parse(taskId);
    actorSchema.parse(actor);

    const existing = await this.getTask(id);

    const { error } = await client.from("tasks").delete().eq("id", id);
    if (error) {
      throw unavailableError("Unable to delete work order. The task service did not respond.", error);
    }

    await this.logEvent(existing.id, actor, "DELETED");
  }

  async listEvents(limit = 10): Promise<TaskEvent[]> {
    const client = this.requireClient();

    const { data: rows, error } = await client
      .from("task_events")
      .select()
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw unavailableError("Unable to load system log. The task service did not respond.", error);
    }
    return (rows ?? []).map(mapEventRow);
  }

  async pingDatabase(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const { error } = await this.client.from("tasks").select("id").limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Audit trail is best-effort; a logging failure must never
   * fail the underlying task operation.
   */
  private async logEvent(
    taskId: string,
    actor: TaskActor,
    action: "CREATED" | "UPDATED" | "COMPLETED" | "REOPENED" | "DELETED"
  ): Promise<void> {
    try {
      await this.requireClient().from("task_events").insert({
        task_id: taskId,
        actor,
        action,
      });
    } catch {
      // Intentionally swallowed — audit log is best-effort.
    }
  }
}

export function createTaskService(client?: ServiceClient | null): TaskService {
  return new TaskService(client);
}
