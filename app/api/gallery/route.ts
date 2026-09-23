// GET /api/gallery — 当前用户历史图片
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGallery } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const images = await getGallery(user.id);
  return NextResponse.json({ images });
}
