// 硅基流动（SiliconFlow）真实生图 Provider
// API: POST https://api.siliconflow.cn/v1/images/generations
// 默认模型 FLUX.1-schnell（免费档）。返回的图片是 24h 有效的临时 CDN URL，
// 本 provider 立即下载字节，由任务执行器统一转存 Supabase Storage 持久化。

import {
  type ImageProvider,
  type ProviderGenerateRequest,
  type ProviderImage
} from "./types";

const API_BASE =
  process.env.SILICONFLOW_BASE_URL ?? "https://api.siliconflow.cn/v1";

// 产品模型 code → 硅基流动真实模型（按档位差异化：速度/质量递进）
const MODEL_MAP: Record<string, string> = {
  "flux-dev": "Kwai-Kolors/Kolors",                 // 最快（约 5s）
  "sd35": "baidu/ERNIE-Image-Turbo",                // 快（约 9s）
  "flux-pro": "Tongyi-MAI/Z-Image-Turbo",           // 质量更高（约 10-17s）
  "lumina-xl": "Qwen/Qwen-Image"                    // 最高质量（约 20s+）
};

// 仅 Kolors 确认支持 negative_prompt，其余模型传入可能被拒
const SUPPORTS_NEGATIVE = /Kolors/;

// 硅基流动支持的预设尺寸（非预设值会被拒绝）
const RATIO_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "4:3": { width: 1024, height: 768 },
  "3:4": { width: 768, height: 1024 },
  "16:9": { width: 1280, height: 720 },
  "9:16": { width: 720, height: 1280 }
};

interface SFResponse {
  images?: { url?: string }[];
  message?: string;
}

export const siliconflowProvider: ImageProvider = {
  code: "siliconflow",
  async generate(req: ProviderGenerateRequest): Promise<ProviderImage> {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) throw new Error("缺少 SILICONFLOW_API_KEY 环境变量");

    const realModel = MODEL_MAP[req.model] ?? "Kwai-Kolors/Kolors";
    const { width, height } = RATIO_SIZES[req.ratio] ?? RATIO_SIZES["1:1"];

    const body: Record<string, unknown> = {
      model: realModel,
      prompt: req.prompt,
      image_size: `${width}x${height}`,
      batch_size: 1,
      seed: req.seed
    };
    if (req.negativePrompt && SUPPORTS_NEGATIVE.test(realModel)) {
      body.negative_prompt = req.negativePrompt;
    }

    const res = await fetch(`${API_BASE}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000)
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`硅基流动 ${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as SFResponse;
    const url = json.images?.[0]?.url;
    if (!url) {
      throw new Error(`硅基流动未返回图片 URL: ${json.message ?? "unknown"}`);
    }

    // 立即下载临时 URL 的字节，交给执行器转存
    const imgRes = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!imgRes.ok) throw new Error(`下载生成图失败 ${imgRes.status}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 1000) throw new Error("生成图字节数异常");
    const contentType = imgRes.headers.get("content-type")?.split(";")[0] ?? "image/png";
    return { buffer, contentType, width, height };
  }
};
