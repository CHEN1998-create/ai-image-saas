// PostgreSQL 连接池 — CloudBase PG 模式直连（server-only, Node runtime）
// 复用全局 Pool，避免每次请求新建连接。
// 必需 env：PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD

import pg from "pg";

const { Pool } = pg;

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (_pool) return _pool;
  const host = process.env.PGHOST;
  const port = Number(process.env.PGPORT || 5432);
  const database = process.env.PGDATABASE;
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  if (!host || !database || !user || !password) {
    throw new Error(
      "PostgreSQL env 未配置：请在 .env.local 填 PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD"
    );
  }
  // SSL：通过 PGSSL 控制。CloudBase PG 默认不强制 SSL → false；
  // 若控制台开了「强制 SSL」→ .env.local 设 PGSSL=true
  const useSsl = process.env.PGSSL === "true";
  _pool = new Pool({
    host,
    port,
    database,
    user,
    password,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
    max: 3, // Supabase Session Pooler 上限 15 客户端，多进程共存时需保守
    idleTimeoutMillis: 30000
  });
  return _pool;
}

export async function query<T extends Record<string, any> = Record<string, any>>(sql: string, params: unknown[] = []): Promise<{ rows: T[]; rowCount: number | null }> {
  const res = await getPool().query<T>(sql, params);
  return { rows: res.rows, rowCount: res.rowCount };
}
