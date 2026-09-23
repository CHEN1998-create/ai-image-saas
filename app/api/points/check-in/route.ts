// POST /api/points/check-in — 每日签到
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkIn, getPointRecords } from "@/lib/db";

export async function POST() {
  const user = await requireUser();
  // 检查今日是否已签到
  const records = await getPointRecords(user.id);
  const today = new Date().toDateString();
  const already = records.some(
    (r) => r.source === "每日签到" && new Date(r.createdAt).toDateString() === today
  );
  if (already) {
    return NextResponse.json({ error: "今日已签到", balance: user.points }, { status: 400 });
  }
  const record = await checkIn(user);
  return NextResponse.json({ record, balance: user.points + 20 });
}
