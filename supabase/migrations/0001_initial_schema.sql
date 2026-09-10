-- MCTM — Mission Control Task Manager
-- Initial schema. Minimal task model + audit log.
-- Apply with: psql $DATABASE_URL -f supabase/migrations/0001_initial_schema.sql

begin;

create extension if not exists pgcrypto;

-- ── ENUM ────────────────────────────────────────────────────────────────

create type task_status as enum ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- ── TASKS ───────────────────────────────────────────────────────────────

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  branch_name  text,
  details      text,
  status       task_status not null default 'TODO',
  serial       integer unique,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- Persistent sequential work-order number, assigned safely at the DB level.
create or replace function public.set_task_serial() returns trigger
language plpgsql as $$
declare
  next_serial int;
begin
  if new.serial is not null then
    return new;
  end if;
  lock table public.tasks in exclusive mode;
  select coalesce(max(serial), 0) + 1 into next_serial from public.tasks;
  new.serial := next_serial;
  return new;
end;
$$;

create trigger set_task_serial_trigger
  before insert on public.tasks
  for each row execute function public.set_task_serial();

create index tasks_status_idx      on public.tasks (status);
create index tasks_created_at_idx  on public.tasks (created_at desc);
create index tasks_completed_at_idx on public.tasks (completed_at desc);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────────────
-- Local single-operator deployment: anon/authenticated may read and write
-- tasks; service role bypasses RLS. Tighten policies before exposing the
-- API publicly.

alter table public.tasks enable row level security;

create policy "public_full_access_tasks"
  on public.tasks for all
  to anon, authenticated
  using (true)
  with check (true);

-- ── TASK EVENTS (system log) ────────────────────────────────────────────

create table public.task_events (
  id         bigint generated always as identity primary key,
  task_id    uuid references public.tasks(id) on delete set null,
  actor      text not null check (actor in ('USER','MCP')),
  action     text not null check (action in ('CREATED','UPDATED','COMPLETED','REOPENED','DELETED')),
  created_at timestamptz not null default now()
);

create index task_events_created_at_idx on public.task_events (created_at desc);

alter table public.task_events enable row level security;

create policy "public_read_task_events"
  on public.task_events for select
  to anon, authenticated
  using (true);

commit;
