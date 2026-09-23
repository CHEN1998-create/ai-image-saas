-- ============================================================
-- 0002_rls.sql — 行级安全（RLS）策略
-- 参考工件：切真实 Supabase 时启用。用户只能读写自己的行，
-- 管理员通过 is_admin() helper 全量访问。
-- ============================================================

-- admin 判定函数
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- profiles ----------
alter table public.profiles enable row level security;
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- generation_tasks ----------
alter table public.generation_tasks enable row level security;
create policy "tasks_owner_rw" on public.generation_tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "tasks_admin_all" on public.generation_tasks
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- generated_images ----------
alter table public.generated_images enable row level security;
create policy "images_owner_rw" on public.generated_images
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "images_admin_all" on public.generated_images
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- billing_records ----------
alter table public.billing_records enable row level security;
create policy "billing_owner_read" on public.billing_records
  for select using (user_id = auth.uid());
create policy "billing_admin_all" on public.billing_records
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- point_records ----------
alter table public.point_records enable row level security;
create policy "points_owner_read" on public.point_records
  for select using (user_id = auth.uid());
create policy "points_owner_insert" on public.point_records
  for insert with check (user_id = auth.uid());
create policy "points_admin_all" on public.point_records
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- shared_posts ----------
alter table public.shared_posts enable row level security;
create policy "posts_public_read" on public.shared_posts
  for select using (visibility = 'public' or user_id = auth.uid() or public.is_admin());
create policy "posts_owner_write" on public.shared_posts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "posts_admin_all" on public.shared_posts
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- post_likes ----------
alter table public.post_likes enable row level security;
create policy "likes_public_read" on public.post_likes
  for select using (true);
create policy "likes_owner_write" on public.post_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "likes_admin_all" on public.post_likes
  for all to public using (public.is_admin()) with check (public.is_admin());

-- ---------- post_comments ----------
alter table public.post_comments enable row level security;
create policy "comments_public_read" on public.post_comments
  for select using (true);
create policy "comments_owner_write" on public.post_comments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "comments_admin_all" on public.post_comments
  for all to public using (public.is_admin()) with check (public.is_admin());
