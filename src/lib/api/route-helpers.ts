import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { TaskServiceError } from "@/lib/tasks/task-types";

/**
 * Thin helpers for API routes: no business logic here,
 * just HTTP mapping around the task service.
 */

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data as object, { status: 200, ...init });
}

interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof TaskServiceError) {
    // Log detailed error server-side; the client gets a clean notice.
    console.error(`[task-service] ${error.code}: ${error.message}`, error.details ?? "");
    const status =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "VALIDATION" || error.code === "INVALID_STATE"
          ? 400
          : error.code === "CONFLICT"
            ? 409
            : 503;
    return NextResponse.json<ApiErrorBody>(
      { error: { code: error.code, message: error.message } },
      { status }
    );
  }

  if (error instanceof ZodError) {
    console.error("[api] validation error:", error.flatten());
    return NextResponse.json<ApiErrorBody>(
      {
        error: {
          code: "VALIDATION",
          message: error.issues[0]?.message ?? "Invalid request.",
        },
      },
      { status: 400 }
    );
  }

  console.error("[api] unexpected error:", error);
  return NextResponse.json<ApiErrorBody>(
    { error: { code: "UNAVAILABLE", message: "TASK SERVICE DID NOT RESPOND." } },
    { status: 503 }
  );
}
