// POST /api/generations — 创建生图任务（mock 同步成功）
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createGenerationTask } from "@/lib/db";
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

  // 模拟生成耗时，保留"生成中"过渡
  await new Promise((r) => setTimeout(r, 1500));

  const { task, images } = await createGenerationTask(user, {
    prompt: prompt.trim(),
    negativePrompt,
    model: model.code,
    ratio: ratio ?? "1:1",
    count: imageCount,
    pointsCost
  });

  return NextResponse.json({ task, images, points: user.points - pointsCost });
}
