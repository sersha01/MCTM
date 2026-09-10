import { NextRequest } from "next/server";
import { createTaskService } from "@/lib/tasks/task-service";
import { handleRouteError, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const service = createTaskService();

type RouteContext = { params: { id: string } };

/**
 * Completion endpoint. Accepts no body — the server owns
 * the completion timestamp.
 */
export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const task = await service.completeTask(context.params.id, "USER");
    return jsonOk({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}
