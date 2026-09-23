// Provider 注册表 — 按 model code 路由到对应执行器
// 真实模型接入时在此注册（如 replicateProvider），model → provider 映射

import { mockProvider } from "./mock";
import type { ImageProvider } from "./types";

export * from "./types";
export { mockProvider, hashString } from "./mock";

// 目前所有模型都走 mock provider；
// 接入真实 API 后改为：getProvider(model.providerCode)
export function getProvider(_modelCode: string): ImageProvider {
  return mockProvider;
}
