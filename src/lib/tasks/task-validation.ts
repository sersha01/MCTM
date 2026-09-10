import { z } from "zod";

export const taskIdSchema = z.string().uuid("Invalid task ID format.");

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]);

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(280, "Title must be 280 characters or fewer."),
  branchName: z
    .string()
    .trim()
    .max(280, "Branch name must be 280 characters or fewer.")
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v ?? null)),
  details: z
    .string()
    .trim()
    .max(4000, "Details must be 4000 characters or fewer.")
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v ?? null)),
});

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required.")
      .max(280, "Title must be 280 characters or fewer.")
      .optional(),
    branchName: z
      .string()
      .trim()
      .max(280)
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    details: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .nullable()
      .transform((v) => (v === "" ? null : v)),
    status: taskStatusSchema.optional(),
  })
  .strict();

export const taskListFilterSchema = z.enum(["ALL", "TODO", "IN_PROGRESS", "COMPLETED"]);

export const searchSchema = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const actorSchema = z.enum(["USER", "MCP"]);

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
