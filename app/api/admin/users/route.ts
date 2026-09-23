// Admin: list all users
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminUsers } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const users = await getAdminUsers();
  return NextResponse.json({ users });
}
