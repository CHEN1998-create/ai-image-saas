// Repost a post
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { repostPost } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const post = await repostPost(params.id, user);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post });
}
