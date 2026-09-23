// 图片生成 Provider 抽象 — 真实模型与 mock 实现同一接口
// 以后接入 Replicate / 硅基流动等只需新增一个 provider 并注册

export interface ProviderGenerateRequest {
  prompt: string;
  negativePrompt?: string;
  model: string;
  ratio: string; // 1:1 / 3:4 / 16:9 ...
  seed: number;
}

export interface ProviderImage {
  buffer: Buffer;
  contentType: string;
  width: number;
  height: number;
}

export interface ImageProvider {
  code: string;
  // 生成单张图片（多图由任务执行器多次调用，允许不同 seed）
  generate(req: ProviderGenerateRequest): Promise<ProviderImage>;
}

// 比例 → 像素尺寸（对齐主流模型常见档位）
const RATIO_SIZES: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1024, height: 1024 },
  "3:4": { width: 896, height: 1152 },
  "4:3": { width: 1152, height: 896 },
  "2:3": { width: 832, height: 1248 },
  "3:2": { width: 1248, height: 832 },
  "9:16": { width: 720, height: 1280 },
  "16:9": { width: 1280, height: 720 }
};

export function sizeForRatio(ratio: string): { width: number; height: number } {
  return RATIO_SIZES[ratio] ?? RATIO_SIZES["1:1"];
}
