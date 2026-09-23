// 会话 cookie（server-only，Node runtime）
// HMAC-SHA256 签名的 base64url payload
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import type { AuthUser, SessionPayload } from "./types";
import { SESSION_COOKIE } from "./edge";
import { getUserById } from "./store";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 天
const SECRET =
  process.env.AUTH_SECRET || "lumen-mock-dev-secret-change-me";

type CookieAPI = {
  get: (name: string) => { value: string } | undefined;
  set: (
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
      secure?: boolean;
    }
  ) => void;
};

function cookieStore(): CookieAPI {
  return cookies() as unknown as CookieAPI;
}

function b64urlEncode(str: string): string {
  return Buffer.from(str, "utf8").toString("base64url");
}
function b64urlDecode(str: string): string {
  return Buffer.from(str, "base64url").toString("utf8");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", SECRET).update(payloadB64).digest("base64url");
}

export async function createSession(user: AuthUser): Promise<void> {
  const payload: SessionPayload = {
    uid: user.id,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  };
  const payloadB64 = b64urlEncode(JSON.stringify(payload));
  const token = `${payloadB64}.${sign(payloadB64)}`;
  cookieStore().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export async function destroySession(): Promise<void> {
  cookieStore().set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

// server 侧权威校验：读 cookie → HMAC 验签 → 返回 payload
export async function readSessionToken(): Promise<SessionPayload | null> {
  const token = cookieStore().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;
  if (sign(payloadB64) !== sig) return null;
  try {
    const payload = JSON.parse(b64urlDecode(payloadB64)) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const payload = await readSessionToken();
  if (!payload) return null;
  return getUserById(payload.uid);
}
