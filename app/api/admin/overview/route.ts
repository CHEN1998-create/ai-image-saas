// Admin overview metrics
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const overview = await getAdminOverview();
  return NextResponse.json({ overview });
}
