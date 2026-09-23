// Admin: list all orders
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminOrders } from "@/lib/db";

export async function GET() {
  const admin = await requireAdmin();
  const orders = await getAdminOrders();
  return NextResponse.json({ orders });
}
