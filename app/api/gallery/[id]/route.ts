// Delete a gallery image by id
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteGalleryImage } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const ok = await deleteGalleryImage(params.id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
