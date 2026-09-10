import { NextRequest } from "next/server";
import { createTaskService } from "@/lib/tasks/task-service";
import { createTaskSchema, taskListFilterSchema, searchSchema } from "@/lib/tasks/task-validation";
import { handleRouteError, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const service = createTaskService();

export async function GET(request: NextRequest) {
  try {
    const filter = taskListFilterSchema.parse(
      request.nextUrl.searchParams.get("filter") ?? "ALL"
    );
    const search = searchSchema.parse(request.nextUrl.searchParams.get("q") ?? null);

    const tasks = await service.listTasks(filter, search);
    return jsonOk({ tasks });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const input = createTaskSchema.parse(body);
    const task = await service.createTask(input, "USER");
    return jsonOk({ task }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
