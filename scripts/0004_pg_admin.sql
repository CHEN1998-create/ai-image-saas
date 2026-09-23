-- ============================================================
-- 0004_pg_admin.sql — 后台管理 + 数据监控支撑
-- 1) 用户状态（封禁）、内容审核状态/举报数
-- 2) API 调用日志 / 模型调用日志 / 系统健康检查 三张监控表
-- ============================================================

-- ---------- 用户状态 ----------
alter table lumen.users add column if not exists status text not null default 'active';
-- active / banned

-- ---------- 内容审核 ----------
alter table lumen.shared_posts add column if not exists moderation_status text not null default 'approved';
-- approved（已通过/正常展示）/ pending（待审核）/ rejected（已下架）
alter table lumen.shared_posts add column if not exists report_count integer not null default 0;

create index if not exists idx_lumen_posts_moderation
  on lumen.shared_posts (moderation_status, created_at desc);

-- ---------- API 调用日志 ----------
create table if not exists lumen.api_call_logs (
  id           text primary key,
  route        text,
  method       text,
  user_id      text references lumen.users(id) on delete set null,
  status_code  integer,
  duration_ms  integer,
  request_id   text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_lumen_api_logs_created
  on lumen.api_call_logs (created_at desc);

-- ---------- 模型（Provider）调用日志 ----------
create table if not exists lumen.provider_call_logs (
  id            text primary key,
  provider_name text,
  task_id       text references lumen.generation_tasks(id) on delete cascade,
  status        text, -- success / failed / timeout
  duration_ms   integer,
  error_message text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_lumen_provider_logs_created
  on lumen.provider_call_logs (created_at desc);

-- ---------- 系统健康检查 ----------
create table if not exists lumen.system_health_checks (
  id           text primary key,
  service_name text,
  check_type   text,
  status       text, -- healthy / degraded / down
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_lumen_health_created
  on lumen.system_health_checks (created_at desc);
