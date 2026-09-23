// Supabase 管理客户端（server-only, Node runtime）
// 用 service_role key：绕过 RLS，供服务端操作用。
// 绝不允许 import 进 client 组件。
// 注意：Storage 上传已在 lib/storage.ts 中用 Node https 直传实现，
//       本模块保留供将来其他 Supabase 服务端操作使用。

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service env 未配置：.env.local 需 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  _admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return _admin;
}
