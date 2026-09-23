// Toggle favorite on a gallery image
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { toggleFavorite } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const image = await toggleFavorite(params.id);
  if (!image) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ image });
}
