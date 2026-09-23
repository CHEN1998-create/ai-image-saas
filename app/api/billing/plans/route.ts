// List available billing plans
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlans } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  const plans = await getPlans();
  return NextResponse.json({ plans });
}
