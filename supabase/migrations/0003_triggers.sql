-- ============================================================
-- 0003_triggers.sql — 自动建 profile 触发器
-- 参考工件：新 auth 用户注册时自动插入一条 profiles 行
-- （role 默认 'user'，plan 'free'，points 0）。
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
