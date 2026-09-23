// Mock 图片生成 Provider
// 优先从 picsum 下载真实照片字节（上传后是真图）；
// 网络受限时用 jpeg-js 本地生成柔和渐变图兜底，保证任务不失败。

import jpeg from "jpeg-js";
import {
  sizeForRatio,
  type ImageProvider,
  type ProviderGenerateRequest,
  type ProviderImage
} from "./types";

// 字符串 → 稳定整数 hash（决定占位图 seed 与本地图色相）
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function downloadPlaceholder(
  seed: number,
  width: number,
  height: number
): Promise<Buffer | null> {
  // picsum 按 seed 出固定图；用独立短域名减少重定向耗时
  const url = `https://picsum.photos/seed/lumen${seed}/${width}/${height}`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // 简单校验是图片字节
    if (buf.length < 1000) return null;
    return buf;
  } catch {
    return null;
  }
}

// 本地生成：柔和双色渐变 + 两个径向光斑，hue 随 seed 变
function generateLocal(
  seed: number,
  width: number,
  height: number
): ProviderImage {
  const h1 = (seed % 360) / 360;
  const h2 = ((seed + 40 + (seed % 80)) % 360) / 360;
  const cx1 = width * (0.3 + ((seed >> 3) % 40) / 100);
  const cy1 = height * (0.25 + ((seed >> 5) % 40) / 100);
  const cx2 = width * (0.7 - ((seed >> 7) % 30) / 100);
  const cy2 = height * (0.75 - ((seed >> 9) % 30) / 100);
  const r1 = Math.min(width, height) * 0.45;
  const r2 = Math.min(width, height) * 0.4;

  const data = Buffer.alloc(width * height * 4);
  const c1 = hslToRgb(h1, 0.5, 0.78);
  const c2 = hslToRgb(h2, 0.5, 0.82);
  for (let y = 0; y < height; y++) {
    const t = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const k = Math.max(0, Math.min(1, u + t * 0.3));
      // 两色在 RGB 空间近似混合（柔和低饱和、高亮度）
      let rr = c1[0] * (1 - k) + c2[0] * k;
      let gg = c1[1] * (1 - k) + c2[1] * k;
      let bb = c1[2] * (1 - k) + c2[2] * k;
      // 光斑加亮
      const d1 = Math.hypot(x - cx1, y - cy1) / r1;
      const d2 = Math.hypot(x - cx2, y - cy2) / r2;
      const glow = Math.max(0, 1 - d1) * 0.3 + Math.max(0, 1 - d2) * 0.2;
      rr = Math.min(255, rr + 255 * glow);
      gg = Math.min(255, gg + 255 * glow);
      bb = Math.min(255, bb + 255 * glow);
      const i = (y * width + x) * 4;
      data[i] = rr; data[i + 1] = gg; data[i + 2] = bb; data[i + 3] = 255;
    }
  }
  const encoded = jpeg.encode({ data, width, height }, 82);
  return { buffer: encoded.data, contentType: "image/jpeg", width, height };
}

// 标准 HSL→RGB（返回 0-255 三分量）
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hueToChannel(p, q, h + 1 / 3) * 255,
    hueToChannel(p, q, h) * 255,
    hueToChannel(p, q, h - 1 / 3) * 255
  ];
}

function hueToChannel(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

export const mockProvider: ImageProvider = {
  code: "mock",
  async generate(req: ProviderGenerateRequest): Promise<ProviderImage> {
    const { width, height } = sizeForRatio(req.ratio);
    const downloaded = await downloadPlaceholder(req.seed, width, height);
    if (downloaded) {
      return { buffer: downloaded, contentType: "image/jpeg", width, height };
    }
    return generateLocal(req.seed, width, height);
  }
};
