import { NextResponse } from "next/server";
import { createTaskService } from "@/lib/tasks/task-service";

export const dynamic = "force-dynamic";

/**
 * Backend health probe used by the system status indicators.
 * Reports the real database state — never a faked status.
 */
export async function GET() {
  const service = createTaskService();
  const databaseOk = await service.pingDatabase();

  return NextResponse.json(
    {
      database: databaseOk ? "CONNECTED" : "DEGRADED",
      mcp: process.env.MCP_ENABLED === "false" ? "DISABLED" : "STANDALONE",
    },
    { status: databaseOk ? 200 : 503 }
  );
}
