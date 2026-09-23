import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "./password";
import {
  findUserByEmail,
  getUserById,
  createUser,
  updateUser,
  applyPointsDelta
} from "./store";
import { createSession, destroySession, readSessionToken } from "./session";
import type { AuthUser } from "./types";

export type { AuthUser, Role, StoredUser, SessionPayload } from "./types";
export { SESSION_COOKIE } from "./edge";
export { getCurrentUser } from "./session";

export async function register(
  email: string,
  password: string,
  name: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: "邮箱格式不正确" };
  }
  const existing = await findUserByEmail(cleanEmail);
  if (existing) return { ok: false, error: "该邮箱已注册" };
  if (password.length < 6) return { ok: false, error: "密码至少 6 位" };
  const passwordHash = await hashPassword(password);
  const stored = await createUser({
    email: cleanEmail,
    name: name.trim() || cleanEmail.split("@")[0],
    passwordHash
  });
  const user = await getUserById(stored.id);
  if (!user) return { ok: false, error: "注册失败" };
  await createSession(user);
  return { ok: true, user };
}

export async function login(
  email: string,
  password: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  const stored = await findUserByEmail(email.trim());
  if (!stored) return { ok: false, error: "邮箱或密码错误" };
  const valid = await verifyPassword(password, stored.passwordHash);
  if (!valid) return { ok: false, error: "邮箱或密码错误" };
  const user = await getUserById(stored.id);
  if (!user) return { ok: false, error: "登录失败" };
  await createSession(user);
  return { ok: true, user };
}

export async function logout(): Promise<void> {
  await destroySession();
}

export async function requireUser(): Promise<AuthUser> {
  const payload = await readSessionToken();
  if (!payload) redirect("/app/login");
  const user = await getUserById(payload.uid);
  if (!user) redirect("/app/login");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const payload = await readSessionToken();
  if (!payload) redirect("/app/login");
  const user = await getUserById(payload.uid);
  if (!user) redirect("/app/login");
  if (user.role !== "admin") redirect("/app/generate");
  return user;
}

// 供 lib/db 扣减积分用
export { updateUser, applyPointsDelta };
