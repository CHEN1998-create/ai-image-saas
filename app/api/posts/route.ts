// List and publish posts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPosts, publishPost } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const posts = await getPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const { imageId, caption, tags } = await request.json().catch(() => ({}));
  if (!imageId)
    return NextResponse.json({ error: "imageId is required" }, { status: 400 });
  const post = await publishPost(user, { imageId, caption, tags });
  return NextResponse.json({ post });
}
