#!/usr/bin/env node
/**
 * MCTM MCP SERVER — AI operator interface for the task system.
 *
 * Runs the same TaskService used by the web UI, so the AI and the
 * human operate on identical business logic.
 *
 * Stdio transport. Start with: npm run mcp
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createTaskService } from "../lib/tasks/task-service";
import {
  formatWorkOrder,
  TaskServiceError,
  type Task,
  type TaskListFilter,
  type TaskStatus,
} from "../lib/tasks/task-types";

// ── Load .env.local (Next.js does this automatically; tsx does not) ──
try {
  const envPath = join(process.cwd(), ".env.local");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // .env.local missing — rely on real environment variables.
}

const service = createTaskService();

function taskFull(task: Task) {
  return {
    id: task.id,
    serial: task.serial,
    workOrder: formatWorkOrder(task.serial),
    title: task.title,
    branchName: task.branchName,
    details: task.details,
    status: task.status,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
  };
}

function toMcpError(error: unknown) {
  if (error instanceof TaskServiceError) {
    return { isError: true as const, content: [{ type: "text" as const, text: `${error.code}: ${error.message}` }] };
  }
  console.error("[mcp] unexpected error:", error);
  return {
    isError: true as const,
    content: [{ type: "text" as const, text: "TASK SERVICE DID NOT RESPOND." }],
  };
}

function toMcpResult(task: Task) {
  return { content: [{ type: "text" as const, text: JSON.stringify(taskFull(task), null, 2) }] };
}

async function main() {
  const server = new McpServer(
    { name: "mctm", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.tool(
    "create_task",
    `Creates a new work order (task) in the mission queue.

Use when the user asks to add, create, or start tracking a new task.
Only "title" is required. The server automatically sets status=TODO,
records the created timestamp, and leaves completedAt empty.`,
    {
      title: z.string().min(1).max(280).describe("Short, actionable task title."),
      branchName: z.string().max(280).optional().describe("Working branch, e.g. refactor/auth-middleware"),
      details: z.string().max(4000).optional().describe("Necessary context only."),
    },
    async ({ title, branchName, details }) => {
      try {
        const task = await service.createTask(
          { title, branchName: branchName ?? null, details: details ?? null },
          "MCP"
        );
        return toMcpResult(task);
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  server.tool(
    "list_tasks",
    `Lists work orders.

filter: ALL | TODO | IN_PROGRESS | COMPLETED (default ALL).
optionally search across title, branch, and details.`,
    {
      filter: z.enum(["ALL", "TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
      search: z.string().max(200).optional(),
    },
    async ({ filter, search }) => {
      try {
        const tasks = await service.listTasks(
          (filter ?? "ALL") as TaskListFilter,
          search ?? null
        );
        const lines = tasks.map(
          (t) =>
            `${formatWorkOrder(t.serial)} | ${t.status} | ${t.title}${t.branchName ? ` [${t.branchName}]` : ""}`
        );
        return {
          content: [
            {
              type: "text" as const,
              text: tasks.length === 0 ? "NO WORK ORDERS." : lines.join("\n"),
            },
          ],
        };
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  server.tool(
    "get_task",
    `Returns full details for one work order by its task id.`,
    { taskId: z.string().uuid() },
    async ({ taskId }) => {
      try {
        const task = await service.getTask(taskId);
        return toMcpResult(task);
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  server.tool(
    "update_task",
    `Modifies an existing work order's title, branchName, details, or status.

Never accepts id, createdAt, or completedAt — those are server-owned.
Setting status to COMPLETED routes through the same completion logic
as complete_task (server stamps completed_at). Reopening (setting a
COMPLETED task back to TODO/IN_PROGRESS) clears completed_at.`,
    {
      taskId: z.string().uuid(),
      title: z.string().min(1).max(280).optional(),
      branchName: z.string().max(280).nullable().optional(),
      details: z.string().max(4000).nullable().optional(),
      status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
    },
    async ({ taskId, title, branchName, details, status }) => {
      try {
        const task = await service.updateTask(
          taskId,
          {
            ...(title !== undefined ? { title } : {}),
            ...(branchName !== undefined ? { branchName } : {}),
            ...(details !== undefined ? { details } : {}),
            ...(status !== undefined ? { status: status as TaskStatus } : {}),
          },
          "MCP"
        );
        return toMcpResult(task);
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  server.tool(
    "complete_task",
    `Marks an existing work order as completed.

Use this only when the user explicitly confirms that the task
has been completed. The server automatically records the current
completion timestamp. The caller must not provide a timestamp.`,
    { taskId: z.string().uuid() },
    async ({ taskId }) => {
      try {
        const task = await service.completeTask(taskId, "MCP");
        return toMcpResult(task);
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  server.tool(
    "delete_task",
    `Permanently deletes a work order. Destructive and irreversible.

Use only with the user's explicit intent to delete. Requires the
exact taskId. Consider suggesting update_task with COMPLETED status
instead when the user merely finished the work.`,
    { taskId: z.string().uuid() },
    async ({ taskId }) => {
      try {
        const existing = await service.getTask(taskId);
        await service.deleteTask(taskId, "MCP");
        return {
          content: [
            { type: "text" as const, text: `DELETED ${formatWorkOrder(existing.serial)}: ${existing.title}` },
          ],
        };
      } catch (error) {
        return toMcpError(error);
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCTM MCP server running on stdio");
}

main().catch((error) => {
  console.error("[mcp] fatal:", error);
  process.exit(1);
});
