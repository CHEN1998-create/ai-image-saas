// Admin: 用户管理 — 列表/搜索 + 封禁解封 + 积分调整
import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/db";
import { setUserStatus, adminAdjustPoints } from "@/lib/db/writes";

export async function GET(req: NextRequest) {
  await requireAdmin();
  const search = req.nextUrl.searchParams.get("q") ?? undefined;
  const users = await getAdminUsers(search);
  return NextResponse.json({ users });
}

export async function PATCH(req: NextRequest) {
  await requireAdmin();
  const body = await req.json().catch(() => null);
  if (!body || typeof body.userId !== "string") {
    return NextResponse.json({ error: "缺少 userId" }, { status: 400 });
  }

  // 封禁 / 解封
  if (body.action === "ban" || body.action === "unban") {
    const status = body.action === "ban" ? "banned" : "active";
    const ok = await setUserStatus(body.userId, status);
    if (!ok) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, status });
  }

  // 积分调整
  if (body.action === "points") {
    const delta = Number(body.delta);
    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json(
        { error: "积分调整量必须是非零整数" },
        { status: 400 }
      );
    }
    const record = await adminAdjustPoints(
      body.userId,
      delta,
      typeof body.reason === "string" ? body.reason : ""
    );
    if (!record) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, record });
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}
