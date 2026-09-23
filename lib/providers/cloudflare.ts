// Cloudflare Workers AI 真实生图 Provider（免费额度）
// REST: POST /accounts/{account_id}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0
// 返回二进制 PNG 字节；支持 width/height（64 倍数）与 negative_prompt

import { socksDispatcher } from "fetch-socks";
import { fetch as undiciFetch } from "undici";
import {
  type ImageProvider,
  type ProviderGenerateRequest,
  type ProviderImage
} from "./types";

const API_BASE = "https://api.cloudflare.com/client/v4";

// api.cloudflare.com 国内直连被墙：本地开发走 SOCKS5 代理；
// 生产（Vercel 海外）直连，不启用 dispatcher
let proxyDispatcher: unknown;
if (
  process.env.NODE_ENV === "development" &&
  process.env.HTTPS_PROXY?.startsWith("socks5://")
) {
  const u = new URL(process.env.HTTPS_PROXY);
  proxyDispatcher = socksDispatcher({
    type: 5,
    host: u.hostname,
    port: Number(u.port)
  });
}

// 比例 → SDXL 支持的尺寸（64 倍数）
const RATIO_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1280, height: 704 },
  "9:16": { width: 704, height: 1280 }
};

// 产品档位 → 推理步数（步数越多细节越多，消耗免费 neurons 越多）
const MODEL_STEPS: Record<string, number> = {
  "flux-dev": 8,
  "sd35": 12,
  "flux-pro": 16,
  "lumina-xl": 20
};

interface CFError {
  errors?: { message?: string }[];
}

export const cloudflareAIProvider: ImageProvider = {
  code: "cloudflare-ai",
  async generate(req: ProviderGenerateRequest): Promise<ProviderImage> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_AI_API_KEY;
    if (!accountId || !apiToken) {
      throw new Error("缺少 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_AI_API_KEY 环境变量");
    }

    const { width, height } = RATIO_SIZES[req.ratio] ?? RATIO_SIZES["1:1"];
    const steps = MODEL_STEPS[req.model] ?? 8;

    // Workers AI SDXL 偶发返回全黑图（特定 seed 触发，黑图 PNG 仅几 KB），换 seed 重试
    let buffer: Buffer | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      buffer = await runModel(
        req.prompt,
        req.negativePrompt,
        width,
        height,
        steps,
        (req.seed + attempt * 7919) >>> 0,
        apiToken,
        accountId
      );
      if (buffer && buffer.length > 50_000) break; // 正常图远大于黑图
    }
    if (!buffer) throw new Error("生成失败");
    return { buffer, contentType: "image/png", width, height };
  }
};

async function runModel(
    prompt: string,
    negativePrompt: string | undefined,
    width: number,
    height: number,
    steps: number,
    seed: number,
    apiToken: string,
    accountId: string
  ): Promise<Buffer> {

    // undici fetch 原生支持 dispatcher（socks 代理），行为与全局 fetch 一致
    const res = await undiciFetch(
      `${API_BASE}/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
          Accept: "image/png"
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt || undefined,
          width,
          height,
          num_steps: steps,
          seed
        }),
        signal: AbortSignal.timeout(90_000),
        dispatcher: proxyDispatcher
      } as Parameters<typeof undiciFetch>[1]
    );

    // Workers AI 失败时返回 JSON 错误；成功时直接返回图片字节
    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok || !contentType.startsWith("image/")) {
      const json = (await res.json().catch(() => null)) as CFError | null;
      const msg = json?.errors?.[0]?.message ?? res.statusText;
      throw new Error(`Workers AI ${res.status}: ${msg}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) throw new Error("生成图字节数异常");
    return buffer;
}

