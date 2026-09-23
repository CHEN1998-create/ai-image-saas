// Edge-safe session 工具 — 不依赖 node:crypto 或 next/headers
// 仅供 middleware 做粗粒度 cookie 检查；权威校验在 server 侧 lib/auth/session.ts

export const SESSION_COOKIE = "lumen_session";

import type { SessionPayload } from "./types";

function fromB64url(input: string): string {
  // Edge runtime 无 Buffer，用 atob（Web API）
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

// 不做 HMAC 验签（Edge 无 node:crypto）；仅解码 + 过期检查
export function decodeSessionTokenEdge(
  token: string | undefined
): SessionPayload | null {
  if (!token) return null;
  const [payloadB64] = token.split(".");
  if (!payloadB64) return null;
  try {
    const payload = JSON.parse(fromB64url(payloadB64)) as SessionPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
