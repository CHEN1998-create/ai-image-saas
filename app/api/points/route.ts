// GET /api/points — 当前用户积分余额 + 明细
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPointRecords } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const records = await getPointRecords(user.id);
  const earn = records.filter((r) => r.type === "earn").reduce((s, r) => s + r.delta, 0);
  const spend = records.filter((r) => r.type === "spend").reduce((s, r) => s + Math.abs(r.delta), 0);
  return NextResponse.json({
    balance: user.points,
    monthEarn: earn,
    monthSpend: spend,
    records
  });
}
