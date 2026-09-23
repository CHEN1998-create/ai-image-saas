// lib/db 读取层 — PostgreSQL 直查
// Server Component 直查（RSC 无 HTTP 跳），Route Handler 也可调用
// 函数签名保持与原 mock 层一致，内部实现换 SQL

import { query } from "@/lib/pg";
import { toIso } from "./store";
import { applyPointsDelta } from "@/lib/auth";
import {
  adminOverview as mockOverview,
  analytics as mockAnalytics,
  observability as mockObservability
} from "@/lib/mock-data";
import type {
  AdminOrder,
  AdminPost,
  AdminTask,
  AdminUser,
  Analytics,
  BillingRecord,
  Comment,
  GalleryImage,
  GenerationTask,
  Observability,
  Plan,
  PointRecord,
  Post,
  AdminOverview
} from "./types";

// ---------- 用户侧 ----------

export async function getGallery(userId: string): Promise<GalleryImage[]> {
  const res = await query(`
    select gi.id, gi.user_id, gi.image_url as url, gi.prompt, gi.model,
           gi.aspect_ratio as ratio, gi.is_favorite as favorite, gi.created_at
    from lumen.generated_images gi
    where gi.user_id = $1
    order by gi.created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, url: r.url, prompt: r.prompt ?? "",
    model: r.model ?? "", ratio: r.ratio ?? "1:1", favorite: r.favorite,
    createdAt: toIso(r.created_at)
  }));
}

export async function getGenerationTasks(userId: string): Promise<GenerationTask[]> {
  const res = await query(`
    select id, user_id, prompt, negative_prompt, model, aspect_ratio,
           image_count, status, progress, points_cost, error_message, created_at
    from lumen.generation_tasks where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, prompt: r.prompt,
    negativePrompt: r.negative_prompt ?? "", model: r.model,
    ratio: r.aspect_ratio, count: r.image_count, status: r.status,
    progress: r.progress ?? 0, pointsCost: r.points_cost,
    createdAt: toIso(r.created_at), error: r.error_message ?? undefined
  }));
}

// 查单个任务（含已生成图片），轮询用。校验归属，非本人返回 null。
export async function getTaskById(
  taskId: string,
  userId?: string
): Promise<{ task: GenerationTask; images: GalleryImage[] } | null> {
  const res = await query(`
    select id, user_id, prompt, negative_prompt, model, aspect_ratio,
           image_count, status, progress, points_cost, error_message, created_at
    from lumen.generation_tasks where id = $1
  `, [taskId]);
  const r = res.rows[0];
  if (!r) return null;
  if (userId && r.user_id !== userId) return null;

  const task: GenerationTask = {
    id: r.id, userId: r.user_id, prompt: r.prompt,
    negativePrompt: r.negative_prompt ?? "", model: r.model,
    ratio: r.aspect_ratio, count: r.image_count, status: r.status,
    progress: r.progress ?? 0, pointsCost: r.points_cost,
    createdAt: toIso(r.created_at), error: r.error_message ?? undefined
  };

  const imgRes = await query(`
    select id, user_id, image_url as url, prompt, model,
           aspect_ratio as ratio, is_favorite as favorite, created_at
    from lumen.generated_images
    where task_id = $1 order by created_at asc
  `, [taskId]);
  const images: GalleryImage[] = imgRes.rows.map((g) => ({
    id: g.id, userId: g.user_id, url: g.url, prompt: g.prompt ?? "",
    model: g.model ?? "", ratio: g.ratio ?? "1:1",
    favorite: g.favorite, createdAt: toIso(g.created_at)
  }));
  return { task, images };
}

export async function getPointRecords(userId: string): Promise<PointRecord[]> {
  const res = await query(`
    select id, user_id, type, delta, source, created_at
    from lumen.point_records where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, type: r.type as "earn" | "spend",
    delta: r.delta, source: r.source ?? "", createdAt: toIso(r.created_at)
  }));
}

export async function getPosts(): Promise<Post[]> {
  const res = await query(`
    select sp.id, sp.image_id, sp.user_id, sp.caption, sp.created_at,
           gi.image_url, gi.prompt, gi.model, gi.aspect_ratio,
           u.name as author_name, u.avatar as author_avatar,
           (select count(*) from lumen.post_likes pl where pl.post_id = sp.id) as likes_count,
           (select count(*) from lumen.post_comments pc where pc.post_id = sp.id) as comments_count
    from lumen.shared_posts sp
    left join lumen.generated_images gi on gi.id = sp.image_id
    left join lumen.users u on u.id = sp.user_id
    where sp.visibility = 'public'
    order by sp.created_at desc
  `);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id,
    imageUrl: r.image_url ?? `https://picsum.photos/seed/${r.id}/600/600`,
    prompt: r.prompt ?? "", model: r.model ?? "", ratio: r.aspect_ratio ?? "1:1",
    author: { name: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "" },
    caption: r.caption ?? "", likes: Number(r.likes_count),
    comments: Number(r.comments_count), reposts: 0, liked: false,
    createdAt: toIso(r.created_at), tags: []
  }));
}

export async function getPost(id: string): Promise<Post | null> {
  const res = await query(`
    select sp.id, sp.image_id, sp.user_id, sp.caption, sp.created_at,
           gi.image_url, gi.prompt, gi.model, gi.aspect_ratio,
           u.name as author_name, u.avatar as author_avatar,
           (select count(*) from lumen.post_likes pl where pl.post_id = sp.id) as likes_count,
           (select count(*) from lumen.post_comments pc where pc.post_id = sp.id) as comments_count
    from lumen.shared_posts sp
    left join lumen.generated_images gi on gi.id = sp.image_id
    left join lumen.users u on u.id = sp.user_id
    where sp.id = $1
  `, [id]);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id, userId: r.user_id,
    imageUrl: r.image_url ?? `https://picsum.photos/seed/${r.id}/600/600`,
    prompt: r.prompt ?? "", model: r.model ?? "", ratio: r.aspect_ratio ?? "1:1",
    author: { name: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "" },
    caption: r.caption ?? "", likes: Number(r.likes_count),
    comments: Number(r.comments_count), reposts: 0, liked: false,
    createdAt: toIso(r.created_at), tags: []
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const res = await query(`
    select pc.id, pc.post_id, pc.content, pc.created_at,
           u.name as author_name, u.avatar as author_avatar
    from lumen.post_comments pc
    left join lumen.users u on u.id = pc.user_id
    where pc.post_id = $1
    order by pc.created_at asc
  `, [postId]);
  return res.rows.map((r) => ({
    id: r.id, postId: r.post_id,
    author: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "",
    content: r.content, likes: 0, createdAt: toIso(r.created_at)
  }));
}

export async function getPlans(): Promise<Plan[]> {
  const res = await query(`
    select id, code, name, tagline, monthly_price_cents, yearly_price_cents,
           monthly_points, image_concurrency, video_concurrency, supports_hd_video,
           supports_stealth, features, highlight
    from lumen.subscription_plans order by monthly_price_cents
  `);
  return res.rows.map((r) => ({
    id: r.id, code: r.code, name: r.name, tagline: r.tagline ?? "",
    monthlyPriceCents: r.monthly_price_cents, yearlyPriceCents: r.yearly_price_cents,
    monthlyPoints: r.monthly_points, imageConcurrency: r.image_concurrency,
    videoConcurrency: r.video_concurrency,
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    highlight: r.highlight ?? false
  }));
}

export async function getBillingRecords(userId: string): Promise<BillingRecord[]> {
  const res = await query(`
    select id, user_id, plan_code, billing_cycle, type, amount_cents,
           points_delta, status, created_at
    from lumen.billing_records where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, planCode: r.plan_code ?? "",
    billingCycle: r.billing_cycle ?? "", type: r.type,
    amountCents: r.amount_cents, pointsDelta: r.points_delta,
    status: r.status, createdAt: toIso(r.created_at)
  }));
}

// ---------- Admin 侧（仍从 mock-data 静态取，admin 列表页不查库） ----------
export async function getAdminOverview(): Promise<AdminOverview> {
  return { ...mockOverview, topUsers: mockOverview.topUsers.slice(0, 5) as AdminUser[] };
}
export async function getAdminUsers(): Promise<AdminUser[]> {
  return []; // 静态 mock-data 覆盖，不查库
}
export async function getAdminTasks(): Promise<AdminTask[]> { return []; }
export async function getAdminPosts(): Promise<AdminPost[]> { return []; }
export async function getAdminOrders(): Promise<AdminOrder[]> { return []; }

export function getAnalytics(): Analytics { return mockAnalytics; }
export function getObservability(): Observability { return mockObservability; }
