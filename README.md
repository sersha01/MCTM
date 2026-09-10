# MCTM — Mission Control Task Manager

A personal developer work-order console: a minimal task manager operated by
both you (web/mobile UI) and your AI assistant (MCP tools), sharing one task
service and one database.

```
CREATE → WORK → COMPLETE → ARCHIVE
```

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript (strict)
- Tailwind CSS + custom mission-control CSS theme (1960s aerospace console)
- Supabase PostgreSQL (single source of truth)
- Zod validation everywhere input enters the system
- MCP server (`@modelcontextprotocol/sdk`, stdio)

## Setup

1. **Database** — apply the migration to your Supabase project:

   ```sh
   psql "$DATABASE_URL" -f supabase/migrations/0001_initial_schema.sql
   ```

   (For local Supabase: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`)

2. **Environment** — copy `.env.example` to `.env.local` and fill in:

   ```sh
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server-only, never shipped to the browser
   ```

3. **Run**:

   ```sh
   npm install
   npm run dev
   ```

## MCP (AI operator)

Add to your AI client's MCP config (e.g. Claude Desktop / opencode):

```json
{
  "mcpServers": {
    "mctm": {
      "command": "npm",
      "args": ["run", "--prefix", "/absolute/path/to/MCTM SCRATHCH", "mcp"]
    }
  }
}
```

Tools: `create_task`, `list_tasks`, `get_task`, `update_task`,
`complete_task`, `delete_task`.

The server stamps all timestamps (created/completed) — the AI never supplies
them. Completion is idempotent; reopening clears `completed_at`.

## Architecture

```
        HUMAN                     AI
          │                       │
          ↓                       ↓
     NEXT.JS UI ←—— shared ——→ MCP SERVER
          │                       │
          ↓                       ↓
       TASK SERVICE (src/lib/tasks/task-service.ts)
                   │
                   ↓
                SUPABASE
```

The task service is the only place business logic lives. API routes
(`src/app/api/tasks/**`) and MCP tools are thin wrappers around it.

## Keyboard shortcuts (desktop)

- `N` new task · `/` search · `A` active · `C` completed · `Esc` close
