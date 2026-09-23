// Admin: subscription analytics (plan distribution + MRR)
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const a = getAnalytics();
  return NextResponse.json({
    planDistribution: a.planDistribution,
    mrr: a.overview.mrr,
  });
}
