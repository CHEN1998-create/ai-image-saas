// lib/db 写入层 — PostgreSQL 直写
// 写操作级联更新 points 记录与 users.points（调 lib/auth 的 applyPointsDelta）

import { query } from "@/lib/pg";
import { applyPointsDelta } from "@/lib/auth";
import { nextId, toIso } from "./store";
import type { AuthUser } from "@/lib/auth";
import type {
  Comment, GalleryImage, GenerationTask, PointRecord, Post, TaskStatus
} from "./types";

const img = (seed: string, w = 600, h = 600) =>
  `https://picsum.photos/seed/lumen-${seed}/${w}/${h}`;

// ---------- 生图任务 ----------
export async function createGenerationTask(
  user: AuthUser,
  input: {
    prompt: string;
    negativePrompt?: string;
    model: string;
    ratio: string;
    count: number;
    pointsCost: number;
  }
): Promise<{ task: GenerationTask; images: GalleryImage[] }> {
  const taskId = nextId("t");
  const now = new Date();
  const iso = now.toISOString();

  await query(`
    insert into lumen.generation_tasks
      (id, user_id, prompt, negative_prompt, model, aspect_ratio,
       image_count, status, points_cost, created_at)
    values ($1,$2,$3,$4,$5,$6,$7,'success',$8,$9)
  `, [taskId, user.id, input.prompt, input.negativePrompt ?? "",
      input.model, input.ratio, input.count, input.pointsCost, now]);

  const images: GalleryImage[] = [];
  for (let i = 0; i < input.count; i++) {
    const id = nextId("g");
    images.push({
      id, userId: user.id, url: img(`${taskId}-${i}`),
      prompt: input.prompt, model: input.model, ratio: input.ratio,
      favorite: false, createdAt: iso
    });
    await query(`
      insert into lumen.generated_images
        (id, task_id, user_id, image_url, prompt, model, aspect_ratio, is_favorite, created_at)
      values ($1,$2,$3,$4,$5,$6,$7,false,$8)
    `, [id, taskId, user.id, img(`${taskId}-${i}`), input.prompt, input.model, input.ratio, now]);
  }

  await addPointRecord(user.id, -input.pointsCost, `生成任务 ${taskId}`);

  const task: GenerationTask = {
    id: taskId, userId: user.id, prompt: input.prompt,
    negativePrompt: input.negativePrompt ?? "", model: input.model,
    ratio: input.ratio, count: input.count, status: "success",
    pointsCost: input.pointsCost, createdAt: iso
  };
  return { task, images };
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
  return {
    id, userId, type, delta, source, createdAt: now.toISOString()
  };
}

// ---------- 图库 ----------
export async function deleteGalleryImage(id: string): Promise<boolean> {
  const res = await query("delete from lumen.generated_images where id = $1", [id]);
  return (res.rowCount ?? 0) > 0;
}

export async function toggleFavorite(
  id: string
): Promise<GalleryImage | null> {
  // 先查当前值，再翻转
  const cur = await query<{ is_favorite: boolean }>(
    "select is_favorite from lumen.generated_images where id = $1", [id]
  );
  const row = cur.rows[0];
  if (!row) return null;
  const newVal = !row.is_favorite;
  await query("update lumen.generated_images set is_favorite = $1 where id = $2", [newVal, id]);
  // 返回完整对象
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
    imageUrl: imageRow.image_url ?? img(`post-${postId}`),
    prompt: imageRow.prompt ?? "", model: imageRow.model ?? "", ratio: imageRow.aspect_ratio ?? "1:1",
    author: { name: user.name, avatar: user.avatar },
    caption: input.caption, likes: 0, comments: 0, reposts: 0,
    createdAt: now.toISOString(), tags: input.tags ?? []
  };
}

export async function togglePostLike(
  postId: string,
  userId: string
): Promise<Post | null> {
  // 查是否已点赞
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
  return null; // Post 计数通过 reads.getPost 查询
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
