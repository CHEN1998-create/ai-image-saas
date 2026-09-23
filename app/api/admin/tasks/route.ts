// Admin: list generation tasks
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminTasks } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const tasks = await getAdminTasks();
  return NextResponse.json({ tasks });
}
