import { MissionControlTaskManager } from "@/components/MissionControlTaskManager";
import { createTaskService } from "@/lib/tasks/task-service";
import type { Task } from "@/lib/tasks/task-types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const service = createTaskService();

  let initialTasks: Task[] = [];
  try {
    initialTasks = await service.listTasks("ALL");
  } catch (error) {
    // The client store will surface DATABASE ● DEGRADED on refresh;
    // server logs carry the detail.
    console.error("[page] initial load failed:", error);
  }

  return <MissionControlTaskManager initialTasks={initialTasks} />;
}
