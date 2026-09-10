import { NextRequest } from "next/server";
import { createTaskService } from "@/lib/tasks/task-service";
import { updateTaskSchema } from "@/lib/tasks/task-validation";
import { handleRouteError, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const service = createTaskService();

type RouteContext = { params: { id: string } };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const task = await service.getTask(context.params.id);
    return jsonOk({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const body = await request.json().catch(() => null);
    const input = updateTaskSchema.parse(body);
    const task = await service.updateTask(context.params.id, input, "USER");
    return jsonOk({ task });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await service.deleteTask(context.params.id, "USER");
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
