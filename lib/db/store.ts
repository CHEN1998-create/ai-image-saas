// lib/db — PostgreSQL 数据层（server-only, Node runtime）
// 不再用 Collection 实例，直接 pg query。
// nextId 保留供 writes.ts 生成业务 ID（text 类型，如 g_1, t_201）。

let seq = Date.now();
export function nextId(prefix: string): string {
  return `${prefix}_${(seq++).toString(36)}`;
}

// 从 timestamp 转 ISO 字符串（pg 返回 Date 对象）
export function toIso(d: unknown): string {
  if (!d) return "";
  if (d instanceof Date) return d.toISOString();
  return String(d);
}

export * from "./types";
