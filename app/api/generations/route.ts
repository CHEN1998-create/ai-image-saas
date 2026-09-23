// POST /api/generations — 创建生图任务（异步执行）
// 立即返回 queued 任务，执行器后台跑，前端轮询 GET /api/generations/[id]
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { requireUser } from "@/lib/auth";
import { createQueuedTask } from "@/lib/db";
import { executeTask } from "@/lib/tasks/executor";
import { models } from "@/lib/mock-data";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const {
    prompt,
    negativePrompt,
    model: modelCode,
    ratio,
    count
  } = body as {
    prompt?: string;
    negativePrompt?: string;
    model?: string;
    ratio?: string;
    count?: number;
  };

  if (!prompt || !prompt.trim()) {
    return NextResponse.json({ error: "Prompt 不能为空" }, { status: 400 });
  }
  const model = models.find((m) => m.code === modelCode) ?? models[0];
  const imageCount = Math.max(1, Math.min(4, Number(count) || 1));
  const pointsCost = model.pointsPerImage * imageCount;

  if (user.points < pointsCost) {
    return NextResponse.json({ error: "积分不足" }, { status: 400 });
  }

  // 建 queued 任务（内部预扣积分）
  const task = await createQueuedTask(user, {
    prompt: prompt.trim(),
    negativePrompt,
    model: model.code,
    ratio: ratio ?? "1:1",
    count: imageCount,
    pointsCost
  });

  // fire-and-forget：执行器在响应返回后继续跑
  waitUntil(executeTask(task.id));

  return NextResponse.json({ task });
}
