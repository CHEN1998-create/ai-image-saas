// Admin: 立即运行一次系统健康检查（真实探测并落库）
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { query } from "@/lib/pg";
import { insertHealthCheck } from "@/lib/db/writes";

type Result = { service: string; status: string; detail: Record<string, unknown> };

export async function POST() {
  await requireAdmin();
  const results: Result[] = [];

  // 1) 数据库（真实查询 + 计时）
  try {
    const start = Date.now();
    await query("select 1 as ok");
    const latency = Date.now() - start;
    const r: Result = {
      service: "PostgreSQL 数据库",
      status: latency < 500 ? "healthy" : "degraded",
      detail: { detail: `连接正常 · 延迟 ${latency}ms`, latencyMs: latency }
    };
    results.push(r);
  } catch (e) {
    results.push({
      service: "PostgreSQL 数据库",
      status: "down",
      detail: { detail: "连接失败", error: e instanceof Error ? e.message : "" }
    });
  }

  // 2) 对象存储（通过配置的 Supabase URL 探测桶根）
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const url = `${base}/storage/v1/bucket/generated-images`;
    const start = Date.now();
    const resp = await fetch(url, {
      method: "GET",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`
      },
      signal: AbortSignal.timeout(8000)
    });
    const latency = Date.now() - start;
    const ok = resp.status < 500;
    results.push({
      service: "对象存储",
      status: ok ? "healthy" : "degraded",
      detail: {
        detail: ok ? `服务可达 · ${latency}ms` : `服务异常 HTTP ${resp.status}`,
        latencyMs: latency, httpStatus: resp.status
      }
    });
  } catch (e) {
    results.push({
      service: "对象存储",
      status: "degraded",
      detail: {
        detail: "探测超时/不可达（本地网络可能受限）",
        error: e instanceof Error ? e.message : ""
      }
    });
  }

  // 3) 任务队列（真实计数）
  try {
    const res = await query(`
      select
        count(*) filter (where status='queued')::int as pending,
        count(*) filter (where status='running')::int as processing,
        count(*) filter (where status in ('success','failed','cancelled'))::int as done
      from lumen.generation_tasks
    `);
    const row = res.rows[0] as {
      pending: number; processing: number; done: number;
    };
    const overloaded = row.pending > 50;
    results.push({
      service: "任务队列",
      status: overloaded ? "degraded" : "healthy",
      detail: {
        detail: `待处理 ${row.pending} · 进行 ${row.processing} · 已完成 ${row.done}`,
        ...row
      }
    });
  } catch (e) {
    results.push({
      service: "任务队列",
      status: "down",
      detail: { detail: "队列状态读取失败", error: e instanceof Error ? e.message : "" }
    });
  }

  // 全部落库
  await Promise.all(
    results.map((r) =>
      insertHealthCheck({
        serviceName: r.service,
        checkType: "manual",
        status: r.status,
        detail: r.detail
      })
    )
  );

  return NextResponse.json({ results, checkedAt: new Date().toISOString() });
}
