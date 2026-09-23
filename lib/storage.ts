// 对象存储封装 — server-only
// 优先 Supabase Storage（REST API 直传，支持 SOCKS5 代理）；
// 上传失败时回退到本地 public/uploads/ 目录（dev 兜底）。
// 部署到能直连 Supabase 的环境时自动使用真实 Storage。
//
// Bucket：generated-images（public 读，服务端用 service role 写）
// 路径：{userId}/{taskId}/{imageId}.jpg

import https from "node:https";
import { SocksProxyAgent } from "socks-proxy-agent";
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";

const PROJECT_URL = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const IMAGE_BUCKET = "generated-images";

let _agent: https.Agent | SocksProxyAgent | null | undefined;

function getAgent(): https.Agent | SocksProxyAgent | null {
  if (_agent !== undefined) return _agent;
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxy && proxy.startsWith("socks")) {
    _agent = new SocksProxyAgent(proxy);
  } else {
    _agent = null;
  }
  return _agent;
}

export interface UploadedImage {
  key: string;
  url: string;
  storage: "supabase" | "local";
}

function request(
  method: string,
  path: string,
  opts: { body?: Buffer; contentType?: string; headers?: Record<string, string> } = {}
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(PROJECT_URL() + path);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${SERVICE_KEY()}`,
      ...opts.headers
    };
    if (opts.contentType) headers["Content-Type"] = opts.contentType;
    if (opts.body) headers["Content-Length"] = String(opts.body.length);

    const req = https.request(
      {
        method,
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers,
        agent: getAgent() ?? undefined,
        timeout: 15000
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({ status: res.statusCode ?? 0, data: Buffer.concat(chunks).toString("utf8") })
        );
      }
    );
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(new Error("请求超时")); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

// 本地兜底：写入 public/uploads/
async function saveLocal(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<UploadedImage> {
  const localPath = resolve(process.cwd(), "public", "uploads", key);
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);
  return {
    key,
    url: `/uploads/${key}`,
    storage: "local"
  };
}

// 上传一张图片
export async function uploadGeneratedImage(input: {
  userId: string;
  taskId: string;
  imageId: string;
  buffer: Buffer;
  contentType?: string;
}): Promise<UploadedImage> {
  const { userId, taskId, imageId, buffer } = input;
  const key = `${userId}/${taskId}/${imageId}.jpg`;
  const ct = input.contentType ?? "image/jpeg";

  // 有 Supabase 配置时优先用真实 Storage
  if (PROJECT_URL() && SERVICE_KEY()) {
    try {
      const path = `/storage/v1/object/${IMAGE_BUCKET}/${key}`;
      const r = await request("POST", path, {
        body: buffer,
        contentType: ct,
        headers: { "x-upsert": "true" }
      });
      if (r.status >= 200 && r.status < 300) {
        return {
          key,
          url: `${PROJECT_URL()}/storage/v1/object/public/${IMAGE_BUCKET}/${key}`,
          storage: "supabase"
        };
      }
      throw new Error(`HTTP ${r.status}: ${r.data}`);
    } catch (e) {
      console.warn(`[storage] Supabase 上传失败，回退本地: ${e instanceof Error ? e.message : e}`);
    }
  }

  // 兜底：本地存储
  return saveLocal(key, buffer, ct);
}

// 列出某前缀下的对象（仅 Supabase 模式有效）
async function listPrefix(prefix: string): Promise<string[]> {
  if (!PROJECT_URL() || !SERVICE_KEY()) return [];
  const path = `/storage/v1/object/list/${IMAGE_BUCKET}`;
  const r = await request("POST", path, {
    body: Buffer.from(JSON.stringify({ prefix, limit: 100 })),
    contentType: "application/json"
  });
  if (r.status !== 200) return [];
  try {
    const arr = JSON.parse(r.data) as Array<{ name: string }>;
    return arr.map((f) => f.name);
  } catch {
    return [];
  }
}

// 删除某任务的全部图片
export async function deleteTaskObjects(
  userId: string,
  taskId: string
): Promise<void> {
  const prefix = `${userId}/${taskId}/`;
  // 尝试删除 Supabase 上的对象
  const names = await listPrefix(prefix);
  if (names.length) {
    await Promise.all(
      names.map((n) =>
        request("DELETE", `/storage/v1/object/${IMAGE_BUCKET}/${prefix}${n}`).catch(() => {})
      )
    );
  }
  // 本地文件清理（dev 环境）
  try {
    const { rm } = await import("node:fs/promises");
    const localDir = resolve(process.cwd(), "public", "uploads", prefix);
    await rm(localDir, { recursive: true, force: true });
  } catch {
    // 忽略
  }
}
