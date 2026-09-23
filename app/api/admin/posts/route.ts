// Admin: list all posts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminPosts } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const posts = await getAdminPosts();
  return NextResponse.json({ posts });
}
