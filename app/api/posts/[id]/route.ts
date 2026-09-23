// Get a single post with its comments
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPost, getComments } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const post = await getPost(params.id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const comments = await getComments(params.id);
  return NextResponse.json({ post, comments });
}
