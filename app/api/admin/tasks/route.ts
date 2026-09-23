// Admin: 任务管理 — 列表/状态筛选 + 取消任务 + 失败重试
import { NextResponse, type NextRequest } from "next/server";
import { waitUntil } from "@vercel/functions";
import { requireAdmin } from "@/lib/auth";
import { getAdminTasks } from "@/lib/db";
import { cancelTask, retryTask } from "@/lib/db/writes";
import { executeTask } from "@/lib/tasks/executor";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const tasks = await getAdminTasks(status);
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);

  // 取消任务
  if (body?.action === "cancel") {
    if (typeof body.taskId !== "string") {
      return NextResponse.json({ error: "缺少 taskId" }, { status: 400 });
    }
    const result = await cancelTask(body.taskId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }
    return NextResponse.json(result);
  }

  // 失败重试
  if (body?.action === "retry") {
    if (typeof body.taskId !== "string") {
      return NextResponse.json({ error: "缺少 taskId" }, { status: 400 });
    }
    const result = await retryTask(body.taskId);
    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }
    // fire-and-forget 执行新任务
    waitUntil(executeTask(result.newTaskId!));
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
