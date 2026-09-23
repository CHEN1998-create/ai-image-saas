// Admin: subscription analytics (plan distribution + MRR)（真实聚合）
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/db/reads";

export async function GET() {
  await requireAdmin();
  const a = await getAnalyticsData();
  return NextResponse.json({
    planDistribution: a.planDistribution,
    mrr: a.overview.mrr,
  });
}
