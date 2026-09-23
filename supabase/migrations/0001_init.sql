-- ============================================================
-- 0001_init.sql — 初始化表结构
-- 参考工件：当前 mock 运行时不 apply；切真实 Supabase 时
-- 执行 `supabase db reset` 即可生效。对应 PRD 第 6 节 12 张表。
-- ============================================================

-- 扩展：uuid 生成
create extension if not exists "pgcrypto";

-- ---------- 用户资料 ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  role         text not null default 'user',
  plan         text not null default 'free',
  points       integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------- 生成任务 ----------
create table if not exists public.generation_tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  prompt           text not null,
  negative_prompt  text,
  model            text not null,
  aspect_ratio     text not null,
  image_count      integer not null default 1,
  status           text not null default 'queued',
  error_message    text,
  provider_task_id text,
  points_cost      integer not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists idx_generation_tasks_user_created
  on public.generation_tasks (user_id, created_at desc);

-- ---------- 生成图片 ----------
create table if not exists public.generated_images (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid references public.generation_tasks(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  image_url   text not null,
  width       integer,
  height      integer,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_generated_images_user_created
  on public.generated_images (user_id, created_at desc);

-- ---------- 账单记录 ----------
create table if not exists public.billing_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan_code      text,
  billing_cycle  text,
  type           text not null,
  amount_cents   integer not null default 0,
  points_delta   integer not null default 0,
  status         text not null default 'pending',
  created_at     timestamptz not null default now()
);
create index if not exists idx_billing_records_user_created
  on public.billing_records (user_id, created_at desc);

-- ---------- 积分记录 ----------
create table if not exists public.point_records (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  points_delta integer not null,
  source     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_point_records_user_created
  on public.point_records (user_id, created_at desc);

-- ---------- API 调用日志 ----------
create table if not exists public.api_call_logs (
  id           uuid primary key default gen_random_uuid(),
  route        text,
  method       text,
  user_id      uuid references public.profiles(id) on delete set null,
  status_code  integer,
  duration_ms  integer,
  request_id   text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_api_call_logs_created
  on public.api_call_logs (created_at desc);

-- ---------- 第三方模型调用日志 ----------
create table if not exists public.provider_call_logs (
  id            uuid primary key default gen_random_uuid(),
  provider_name text,
  task_id       uuid references public.generation_tasks(id) on delete cascade,
  status        text,
  duration_ms   integer,
  error_message text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_provider_call_logs_created
  on public.provider_call_logs (created_at desc);

-- ---------- 系统健康检查 ----------
create table if not exists public.system_health_checks (
  id           uuid primary key default gen_random_uuid(),
  service_name text,
  check_type   text,
  status       text,
  detail       jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists idx_system_health_checks_created
  on public.system_health_checks (created_at desc);

-- ---------- 订阅套餐 ----------
create table if not exists public.subscription_plans (
  id                      uuid primary key default gen_random_uuid(),
  code                    text unique not null,
  name                    text not null,
  monthly_price_cents     integer not null default 0,
  yearly_price_cents      integer not null default 0,
  monthly_points          integer not null default 0,
  concurrent_image_jobs   integer not null default 1,
  concurrent_video_jobs   integer not null default 0,
  supports_hd_video       boolean not null default false,
  supports_stealth        boolean not null default false,
  created_at              timestamptz not null default now()
);

-- ---------- 公开分享作品 ----------
create table if not exists public.shared_posts (
  id                uuid primary key default gen_random_uuid(),
  image_id          uuid references public.generated_images(id) on delete set null,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  caption           text,
  visibility        text not null default 'public',
  repost_from_post_id uuid references public.shared_posts(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_shared_posts_created
  on public.shared_posts (created_at desc);

-- ---------- 作品点赞 ----------
create table if not exists public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.shared_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ---------- 作品评论 ----------
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.shared_posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_post_comments_post_created
  on public.post_comments (post_id, created_at desc);
