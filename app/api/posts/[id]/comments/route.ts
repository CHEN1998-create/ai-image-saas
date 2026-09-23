// Add a comment to a post
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { addComment } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const { content } = await request.json().catch(() => ({}));
  if (!content)
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  const comment = await addComment(params.id, user, content);
  if (!comment)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ comment });
}
