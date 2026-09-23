// lib/db 写入层 — PostgreSQL 直写
// 任务链路：createQueuedTask（预扣积分）→ 执行器 updateTaskProgress
//          → saveResultImage 逐张入库 → success；失败 failTask 并退还积分

import { query } from "@/lib/pg";
import { applyPointsDelta } from "@/lib/auth";
import { nextId, toIso } from "./store";
import type { AuthUser } from "@/lib/auth";
import type {
  Comment, GalleryImage, GenerationTask, PointRecord, Post, TaskStatus
} from "./types";

// ---------- 任务行映射 ----------
interface TaskRow {
  id: string; user_id: string; prompt: string; negative_prompt: string;
  model: string; aspect_ratio: string; image_count: number;
  status: TaskStatus; progress: number; error_message: string;
  points_cost: number; created_at: Date;
}

function rowToTask(r: TaskRow): GenerationTask {
  return {
    id: r.id, userId: r.user_id, prompt: r.prompt,
    negativePrompt: r.negative_prompt ?? "", model: r.model,
    ratio: r.aspect_ratio, count: r.image_count, status: r.status,
    progress: r.progress ?? 0, pointsCost: r.points_cost,
    createdAt: toIso(r.created_at), error: r.error_message ?? undefined
  };
}

// ---------- 建任务（queued，同步预扣积分）----------
export async function createQueuedTask(
  user: AuthUser,
  input: {
    prompt: string;
    negativePrompt?: string;
    model: string;
    ratio: string;
    count: number;
    pointsCost: number;
  }
): Promise<GenerationTask> {
  const taskId = nextId("t");
  const now = new Date();
  await query(`
    insert into lumen.generation_tasks
      (id, user_id, prompt, negative_prompt, model, aspect_ratio,
       image_count, status, progress, points_cost, created_at, updated_at)
    values ($1,$2,$3,$4,$5,$6,$7,'queued',0,$8,$9,$9)
  `, [taskId, user.id, input.prompt, input.negativePrompt ?? "",
      input.model, input.ratio, input.count, input.pointsCost, now]);

  // 预扣积分
  await addPointRecord(user.id, -input.pointsCost, `生成任务 ${taskId}`);

  return {
    id: taskId, userId: user.id, prompt: input.prompt,
    negativePrompt: input.negativePrompt ?? "", model: input.model,
    ratio: input.ratio, count: input.count, status: "queued",
    progress: 0, pointsCost: input.pointsCost, createdAt: now.toISOString()
  };
}

// ---------- 任务状态更新 ----------
export async function updateTaskProgress(
  taskId: string,
  patch: { status?: TaskStatus; progress?: number; error?: string }
): Promise<void> {
  const sets = ["updated_at = now()"];
  const params: unknown[] = [];
  let i = 1;
  if (patch.status !== undefined) { sets.push(`status = $${i++}`); params.push(patch.status); }
  if (patch.progress !== undefined) { sets.push(`progress = $${i++}`); params.push(patch.progress); }
  if (patch.error !== undefined) { sets.push(`error_message = $${i++}`); params.push(patch.error); }
  params.push(taskId);
  await query(
    `update lumen.generation_tasks set ${sets.join(", ")} where id = $${i}`,
    params
  );
}

export async function completeTask(taskId: string): Promise<void> {
  await query(
    `update lumen.generation_tasks
       set status='success', progress=100, updated_at=now(), completed_at=now()
     where id=$1`,
    [taskId]
  );
}

export async function failTask(taskId: string, error: string): Promise<void> {
  await query(
    `update lumen.generation_tasks
       set status='failed', updated_at=now(), completed_at=now(), error_message=$2
     where id=$1`,
    [taskId, error]
  );
}

// ---------- 结果图片入库 ----------
// 删除某任务已入库的图片行（任务失败回滚用）
export async function deleteTaskImages(taskId: string): Promise<void> {
  await query("delete from lumen.generated_images where task_id = $1", [taskId]);
}

export async function saveResultImage(input: {
  id: string;
  taskId: string;
  userId: string;
  url: string;
  prompt: string;
  model: string;
  ratio: string;
}): Promise<GalleryImage> {
  const now = new Date();
  await query(`
    insert into lumen.generated_images
      (id, task_id, user_id, image_url, prompt, model, aspect_ratio, is_favorite, created_at)
    values ($1,$2,$3,$4,$5,$6,$7,false,$8)
  `, [input.id, input.taskId, input.userId, input.url,
      input.prompt, input.model, input.ratio, now]);
  return {
    id: input.id, userId: input.userId, url: input.url,
    prompt: input.prompt, model: input.model, ratio: input.ratio,
    favorite: false, createdAt: now.toISOString()
  };
}

// ---------- 积分记录 ----------
export async function addPointRecord(
  userId: string,
  delta: number,
  source: string
): Promise<PointRecord> {
  const now = new Date();
  const type: "earn" | "spend" = delta >= 0 ? "earn" : "spend";
  const id = nextId("p");
  await query(`
    insert into lumen.point_records
      (id, user_id, type, delta, source, created_at)
    values ($1,$2,$3,$4,$5,$6)
  `, [id, userId, type, delta, source, now]);
  await applyPointsDelta(userId, delta);
  return { id, userId, type, delta, source, createdAt: now.toISOString() };
}

// ---------- 图库 ----------
export async function deleteGalleryImage(id: string): Promise<boolean> {
  const res = await query("delete from lumen.generated_images where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function toggleFavorite(
  id: string
): Promise<GalleryImage | null> {
  const cur = await query<{ is_favorite: boolean }>(
    "select is_favorite from lumen.generated_images where id = $1", [id]
  );
  const row = cur.rows[0];
  if (!row) return null;
  const newVal = !row.is_favorite;
  await query("update lumen.generated_images set is_favorite = $1 where id = $2", [newVal, id]);
  const full = await query(`
    select id, user_id, image_url as url, prompt, model, aspect_ratio as ratio,
           is_favorite as favorite, created_at
    from lumen.generated_images where id = $1
  `, [id]);
  const r = full.rows[0];
  if (!r) return null;
  return {
    id: r.id, userId: r.user_id, url: r.url, prompt: r.prompt ?? "",
    model: r.model ?? "", ratio: r.ratio ?? "1:1", favorite: r.favorite,
    createdAt: toIso(r.created_at)
  };
}

// ---------- 社区作品 ----------
export async function publishPost(
  user: AuthUser,
  input: { imageId: string; caption: string; tags?: string[] }
): Promise<Post | null> {
  const imgRes = await query(
    "select * from lumen.generated_images where id = $1", [input.imageId]
  );
  const imageRow = imgRes.rows[0];
  if (!imageRow) return null;

  const postId = nextId("post");
  const now = new Date();
  await query(`
    insert into lumen.shared_posts
      (id, image_id, user_id, caption, visibility, created_at)
    values ($1,$2,$3,$4,'public',$5)
  `, [postId, input.imageId, user.id, input.caption, now]);

  await addPointRecord(user.id, 30, "分享作品奖励");

  return {
    id: postId, userId: user.id,
    imageUrl: imageRow.image_url,
    prompt: imageRow.prompt ?? "", model: imageRow.model ?? "",
    ratio: imageRow.aspect_ratio ?? "1:1",
    author: { name: user.name, avatar: user.avatar },
    caption: input.caption, likes: 0, comments: 0, reposts: 0,
    createdAt: now.toISOString(), tags: input.tags ?? []
  };
}

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<Post | null> {
  const cur = await query(
    "select * from lumen.post_likes where post_id = $1 and user_id = $2",
    [postId, userId]
  );
  const now = new Date();
  if (cur.rows.length > 0) {
    await query("delete from lumen.post_likes where id = $1", [cur.rows[0].id]);
  } else {
    await query(`
      insert into lumen.post_likes (id, post_id, user_id, created_at)
      values ($1,$2,$3,$4)
    `, [nextId("l"), postId, userId, now]);
  }
  return null;
}

export async function addComment(
  postId: string,
  user: AuthUser,
  content: string
): Promise<Comment | null> {
  const id = nextId("c");
  const now = new Date();
  await query(`
    insert into lumen.post_comments (id, post_id, user_id, content, created_at)
    values ($1,$2,$3,$4,$5)
  `, [id, postId, user.id, content, now]);
  return {
    id, postId, author: user.name, avatar: user.avatar,
    content, likes: 0, createdAt: now.toISOString()
  };
}

export async function repostPost(
  postId: string,
  user: AuthUser
): Promise<Post | null> {
  await addPointRecord(user.id, 10, `转发作品 ${postId}`);
  return null;
}

// ---------- 每日签到 ----------
export async function checkIn(user: AuthUser): Promise<PointRecord> {
  return addPointRecord(user.id, 20, "每日签到");
}
