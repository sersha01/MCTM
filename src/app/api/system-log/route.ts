import { createTaskService } from "@/lib/tasks/task-service";
import { handleRouteError, jsonOk } from "@/lib/api/route-helpers";

export const dynamic = "force-dynamic";

const service = createTaskService();

export async function GET() {
  try {
    const events = await service.listEvents(12);
    return jsonOk({ events });
  } catch (error) {
    return handleRouteError(error);
  }
}
