// GET /api/generations/[id] — 查询任务状态与已生成图片（前端轮询）
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTaskById } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const detail = await getTaskById(params.id, user.id);
  if (!detail) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
