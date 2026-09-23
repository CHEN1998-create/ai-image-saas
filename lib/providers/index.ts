// Provider 注册表 — 按 model code 路由到对应执行器
// 真实模型接入时在此注册（如 replicateProvider），model → provider 映射

import { mockProvider } from "./mock";
import { cloudflareAIProvider } from "./cloudflare";
import { siliconflowProvider } from "./siliconflow";
import type { ImageProvider } from "./types";

export * from "./types";
export { mockProvider, hashString } from "./mock";
export { siliconflowProvider } from "./siliconflow";
export { cloudflareAIProvider } from "./cloudflare";

// Provider 优先级：Workers AI（免费）→ 硅基流动（付费）→ mock（兜底可演示）
export function getProvider(_modelCode: string): ImageProvider {
  if (process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_AI_API_KEY) {
    return cloudflareAIProvider;
  }
  if (process.env.SILICONFLOW_API_KEY) return siliconflowProvider;
  return mockProvider;
}
