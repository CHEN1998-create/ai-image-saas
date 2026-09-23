// 用户存储层 — PostgreSQL lumen.users 表（server-only, Node runtime）
// 接口契约保持：findUserByEmail / getUserById / createUser / updateUser / applyPointsDelta

import type { AuthUser, StoredUser } from "./types";
import { query } from "@/lib/pg";

interface UserRow {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: "user" | "admin";
  plan: string;
  points: number;
  total_generated: number;
  joined_at: string;
  bio: string;
  links: unknown;
  password_hash: string;
}

function rowToAuthUser(r: UserRow): AuthUser {
  return {
    id: r.id,
    email: r.email,
    name: r.name,
    avatar: r.avatar,
    role: r.role,
    plan: r.plan,
    points: r.points,
    totalGenerated: r.total_generated,
    joinedAt: r.joined_at,
    bio: r.bio,
    links: Array.isArray(r.links) ? (r.links as string[]) : []
  };
}

function rowToStoredUser(r: UserRow): StoredUser {
  return {
    ...rowToAuthUser(r),
    passwordHash: r.password_hash
  };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const res = await query<UserRow>(
    "select * from lumen.users where email = $1 limit 1",
    [email.toLowerCase()]
  );
  return res.rows[0] ? rowToStoredUser(res.rows[0]) : null;
}

export async function getUserById(id: string): Promise<AuthUser | null> {
  const res = await query<UserRow>(
    "select * from lumen.users where id = $1 limit 1",
    [id]
  );
  return res.rows[0] ? rowToAuthUser(res.rows[0]) : null;
}

export async function getStoredUserById(id: string): Promise<StoredUser | null> {
  const res = await query<UserRow>(
    "select * from lumen.users where id = $1 limit 1",
    [id]
  );
  return res.rows[0] ? rowToStoredUser(res.rows[0]) : null;
}

export async function createUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const id = `u_${Math.random().toString(36).slice(2, 10)}`;
  const avatar = `https://picsum.photos/seed/lumen-${id}/200/200`;
  const res = await query<UserRow>(
    `insert into lumen.users
       (id, email, name, avatar, role, plan, points, total_generated, joined_at, bio, links, password_hash)
     values ($1,$2,$3,$4,'user','free',2000,0,$5,'','[]'::jsonb,$6)
     returning *`,
    [id, input.email, input.name, avatar, new Date().toISOString(), input.passwordHash]
  );
  return rowToStoredUser(res.rows[0]);
}

export async function updateUser(
  id: string,
  patch: Partial<StoredUser>
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  const map: Record<string, keyof StoredUser> = {
    name: "name", avatar: "avatar", role: "role", plan: "plan",
    points: "points", total_generated: "totalGenerated", joined_at: "joinedAt",
    bio: "bio", links: "links"
  };
  // 手动映射，不直接把 StoredUser 的字段塞进去避免 passwordHash 泄漏
  if (patch.name !== undefined) { sets.push(`name = $${idx++}`); params.push(patch.name); }
  if (patch.avatar !== undefined) { sets.push(`avatar = $${idx++}`); params.push(patch.avatar); }
  if (patch.role !== undefined) { sets.push(`role = $${idx++}`); params.push(patch.role); }
  if (patch.plan !== undefined) { sets.push(`plan = $${idx++}`); params.push(patch.plan); }
  if (patch.points !== undefined) { sets.push(`points = $${idx++}`); params.push(patch.points); }
  if (patch.totalGenerated !== undefined) { sets.push(`total_generated = $${idx++}`); params.push(patch.totalGenerated); }
  if (patch.joinedAt !== undefined) { sets.push(`joined_at = $${idx++}`); params.push(patch.joinedAt); }
  if (patch.bio !== undefined) { sets.push(`bio = $${idx++}`); params.push(patch.bio); }
  if (patch.links !== undefined) { sets.push(`links = $${idx++}::jsonb`); params.push(JSON.stringify(patch.links)); }
  if (!sets.length) return;
  params.push(id);
  await query(
    `update lumen.users set ${sets.join(", ")} where id = $${idx}`,
    params
  );
}

// 供 lib/db 在扣减积分时调用
export async function applyPointsDelta(
  userId: string,
  delta: number
): Promise<void> {
  await query(
    "update lumen.users set points = GREATEST(0, points + $1) where id = $2",
    [delta, userId]
  );
}
