// Toggle like on a post (POST to like, DELETE to unlike)
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { togglePostLike } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const post = await togglePostLike(params.id, user.id);
  return NextResponse.json({ post });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const post = await togglePostLike(params.id, user.id);
  return NextResponse.json({ post });
}
