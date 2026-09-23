// Admin: 内容审核 — 列表/审核状态筛选 + 通过/下架
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminPosts } from "@/lib/db";
import { moderatePost } from "@/lib/db/writes";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const moderation = req.nextUrl.searchParams.get("moderation") ?? undefined;
  const posts = await getAdminPosts(moderation);
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.postId !== "string" ||
    (body.action !== "approve" && body.action !== "reject")
  ) {
    return NextResponse.json(
      { error: "缺少 postId 或 action(approve/reject)" },
      { status: 400 }
    );
  }
  const ok = await moderatePost(body.postId, body.action);
  if (!ok) {
    return NextResponse.json({ error: "作品不存在" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, action: body.action });
}
