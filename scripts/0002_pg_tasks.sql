-- ============================================================
-- 0002_pg_tasks.sql — 生图任务异步状态机字段
-- 在 0001 基础上给 lumen.generation_tasks 补字段
-- ============================================================

alter table lumen.generation_tasks add column if not exists progress integer not null default 0;
alter table lumen.generation_tasks add column if not exists provider_task_id text;
alter table lumen.generation_tasks add column if not exists updated_at timestamptz not null default now();
alter table lumen.generation_tasks add column if not exists completed_at timestamptz;

-- 状态索引（工作台轮询/后台查 pending 任务用）
create index if not exists idx_lumen_tasks_status
  on lumen.generation_tasks (status, created_at desc);
