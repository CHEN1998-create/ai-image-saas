-- ============================================================
-- 0001_pg_init.sql — 生图 SaaS 建表（独立 schema：lumen）
-- 与旧考试系统（public schema）隔离，互不影响
-- 用法：seed 脚本自动执行；也可在 Supabase SQL 编辑器手动跑
-- ID 用 text（业务 id 如 u_8f3a, g_1）
-- ============================================================

-- 独立 schema
create schema if not exists lumen;

-- 清理上一轮误建在 public 里的空表（均为本项目刚建、无数据；旧考试表不碰）
drop table if exists public.post_comments;
drop table if exists public.post_likes;
drop table if exists public.shared_posts;
drop table if exists public.subscription_plans;
drop table if exists public.billing_records;
drop table if exists public.point_records;
drop table if exists public.generated_images;
drop table if exists public.generation_tasks;

-- ---------- 用户 ----------
create table if not exists lumen.users (
  id              text primary key,
  email           text not null,
  name            text not null,
  avatar          text,
  role            text not null default 'user',
  plan            text not null default 'free',
  points          integer not null default 0,
  total_generated integer not null default 0,
  joined_at       text,
  bio             text,
  links           jsonb default '[]',
  password_hash   text
);
create index if not exists idx_lumen_users_email on lumen.users(email);

-- ---------- 生图任务 ----------
create table if not exists lumen.generation_tasks (
  id               text primary key,
  user_id          text not null references lumen.users(id) on delete cascade,
  prompt           text not null,
  negative_prompt  text,
  model            text not null,
  aspect_ratio     text not null,
  image_count      integer not null default 1,
  status           text not null default 'queued',
  progress         integer not null default 0,
  provider_task_id text,
  error_message    text,
  points_cost      integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz
);
create index if not exists idx_lumen_tasks_user_created
  on lumen.generation_tasks (user_id, created_at desc);
create index if not exists idx_lumen_tasks_status
  on lumen.generation_tasks (status, created_at desc);

-- ---------- 生成图片 ----------
create table if not exists lumen.generated_images (
  id          text primary key,
  task_id     text references lumen.generation_tasks(id) on delete cascade,
  user_id     text not null references lumen.users(id) on delete cascade,
  image_url   text not null,
  prompt      text,
  model       text,
  aspect_ratio text,
  width       integer,
  height      integer,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_lumen_images_user_created
  on lumen.generated_images (user_id, created_at desc);

-- ---------- 积分记录 ----------
create table if not exists lumen.point_records (
  id           text primary key,
  user_id      text not null references lumen.users(id) on delete cascade,
  type         text not null,
  delta        integer not null,
  source       text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_lumen_points_user_created
  on lumen.point_records (user_id, created_at desc);

-- ---------- 账单记录 ----------
create table if not exists lumen.billing_records (
  id            text primary key,
  user_id       text not null references lumen.users(id) on delete cascade,
  plan_code     text,
  billing_cycle text,
  type          text not null,
  amount_cents  integer not null default 0,
  points_delta  integer not null default 0,
  status        text not null default 'pending',
  stripe_session_id text,
  stripe_invoice_id text,
  product_type  text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_lumen_billing_user_created
  on lumen.billing_records (user_id, created_at desc);
create unique index if not exists idx_lumen_billing_session
  on lumen.billing_records (stripe_session_id)
  where stripe_session_id is not null;
create index if not exists idx_lumen_billing_status_created
  on lumen.billing_records (status, created_at desc);

-- ---------- 订阅套餐 ----------
create table if not exists lumen.subscription_plans (
  id                      text primary key,
  code                    text unique not null,
  name                    text not null,
  tagline                 text,
  monthly_price_cents     integer not null default 0,
  yearly_price_cents      integer not null default 0,
  monthly_points          integer not null default 0,
  image_concurrency       integer not null default 1,
  video_concurrency       integer not null default 0,
  supports_hd_video       boolean not null default false,
  supports_stealth        boolean not null default false,
  features                jsonb default '[]',
  highlight               boolean default false
);

-- ---------- 公开分享作品 ----------
create table if not exists lumen.shared_posts (
  id                text primary key,
  image_id          text references lumen.generated_images(id) on delete set null,
  user_id           text not null references lumen.users(id) on delete cascade,
  caption           text,
  visibility        text not null default 'public',
  repost_from_post_id text references lumen.shared_posts(id) on delete set null,
  created_at        timestamptz not null default now()
);
create index if not exists idx_lumen_posts_created
  on lumen.shared_posts (created_at desc);

-- ---------- 作品点赞 ----------
create table if not exists lumen.post_likes (
  id         text primary key,
  post_id    text not null references lumen.shared_posts(id) on delete cascade,
  user_id    text not null references lumen.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ---------- 作品评论 ----------
create table if not exists lumen.post_comments (
  id         text primary key,
  post_id    text not null references lumen.shared_posts(id) on delete cascade,
  user_id    text not null references lumen.users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_lumen_comments_post_created
  on lumen.post_comments (post_id, created_at desc);
