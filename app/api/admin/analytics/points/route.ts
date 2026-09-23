// Admin: points issued/consumed analytics
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const a = getAnalytics();
  return NextResponse.json({
    pointsIssued: a.overview.pointsIssued,
    pointsConsumed: a.overview.pointsConsumed,
  });
}
