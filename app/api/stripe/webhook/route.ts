// POST /api/stripe/webhook — Stripe 事件回调
// 处理：checkout.session.completed（订阅首单 / 积分包）、
//       invoice.payment_succeeded（订阅每月续期发积分）
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { fulfillSession } from "@/lib/stripe-fulfill";
import { createBillingRecord, addPointRecord } from "@/lib/db";
import { META } from "@/lib/stripe-config";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "缺少 stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload, signature, getWebhookSecret()
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "验签失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await fulfillSession(session);
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      // 订阅续期：取订阅上的 metadata 发放当月积分
      const subscriptionId = (
        invoice as Stripe.Invoice & { subscription?: string | null }
      ).subscription;
      if (typeof subscriptionId === "string") {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const md = sub.metadata ?? {};
        const userId = md[META.USER_ID];
        const points = parseInt(md[META.POINTS] ?? "0", 10) || 0;
        const planCode = md[META.PLAN_CODE];
        if (userId && points) {
          const bill = await createBillingRecord({
            userId,
            type: "subscription",
            productType: "subscription",
            amountCents: invoice.amount_paid,
            pointsDelta: points,
            planCode,
            billingCycle: "monthly",
            stripeInvoiceId: invoice.id,
            status: "paid"
          });
          if (!bill.duplicated) {
            await addPointRecord(userId, points, `订阅续期发放 ${planCode ?? ""}`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // 让 Stripe 重试（5xx）
    console.error("Stripe webhook 处理失败:", err);
    return NextResponse.json({ error: "履约失败" }, { status: 500 });
  }
}
