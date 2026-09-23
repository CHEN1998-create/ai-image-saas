// POST /api/stripe/verify-session — 支付成功回跳后验单（webhook 兜底）
// body: { session_id }；检索 Stripe 会话并幂等履约
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { fulfillSession } from "@/lib/stripe-fulfill";

export async function POST(request: Request) {
  const user = await requireUser();
  const { session_id: sessionId } = await request.json().catch(() => ({}));
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json({ error: "缺少 session_id" }, { status: 400 });
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // 安全：只允许处理本人的支付会话
  const owner =
    session.client_reference_id === user.id ||
    session.metadata?.user_id === user.id;
  if (!owner) {
    return NextResponse.json({ error: "无权操作该订单" }, { status: 403 });
  }

  const result = await fulfillSession(session);
  return NextResponse.json({ result });
}
