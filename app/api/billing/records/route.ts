// List the current user's billing records
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBillingRecords } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const records = await getBillingRecords(user.id);
  return NextResponse.json({ records });
}
