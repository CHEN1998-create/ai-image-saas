// Admin: analytics overview
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAnalytics } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const a = getAnalytics();
  return NextResponse.json(a.overview);
}
