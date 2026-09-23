// POST /api/stripe/create-checkout — 创建 Stripe Checkout 会话
// body: { kind: "subscription", plan_code } 或 { kind: "topup", topup_id }
// 返回 { url }，前端重定向到 Stripe 托管收银台
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { query } from "@/lib/pg";
import { findTopup, META } from "@/lib/stripe-config";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const user = await requireUser();
  const body = await request.json().catch(() => ({}));
  const kind = body.kind as "subscription" | "topup";

  // 站点 origin：成功/取消回跳地址（从请求头推导，兼容本地/线上）
  const origin = new URL(request.url).origin;
  const stripe = getStripe();

  let params: Stripe.Checkout.SessionCreateParams;

  if (kind === "subscription") {
    const planCode = body.plan_code as string;
    const res = await query<{
      name: string; monthly_price_cents: number; monthly_points: number;
    }>(
      "select name, monthly_price_cents, monthly_points from lumen.subscription_plans where code = $1",
      [planCode]
    );
    const plan = res.rows[0];
    if (!plan) {
      return NextResponse.json({ error: "套餐不存在" }, { status: 404 });
    }

    params = {
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Lumen Art · ${plan.name}（月付）` },
            recurring: { interval: "month" },
            unit_amount: plan.monthly_price_cents
          },
          quantity: 1
        }
      ],
      client_reference_id: user.id,
      metadata: {
        [META.PRODUCT_TYPE]: "subscription",
        [META.PLAN_CODE]: planCode,
        [META.POINTS]: String(plan.monthly_points),
        [META.USER_ID]: user.id
      },
      subscription_data: {
        metadata: {
          [META.PRODUCT_TYPE]: "subscription",
          [META.PLAN_CODE]: planCode,
          [META.POINTS]: String(plan.monthly_points),
          [META.USER_ID]: user.id
        }
      },
      success_url: `${origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/billing/cancel`
    };
  } else if (kind === "topup") {
    const topup = findTopup(body.topup_id as string);
    if (!topup) {
      return NextResponse.json({ error: "积分包不存在" }, { status: 404 });
    }

    params = {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Lumen Art · ${topup.points} 积分包` },
            unit_amount: topup.priceCents
          },
          quantity: 1
        }
      ],
      client_reference_id: user.id,
      metadata: {
        [META.PRODUCT_TYPE]: "topup",
        [META.POINTS]: String(topup.points),
        [META.USER_ID]: user.id
      },
      success_url: `${origin}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/app/billing/cancel`
    };
  } else {
    return NextResponse.json({ error: "未知的购买类型" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create(params);
  return NextResponse.json({ url: session.url, id: session.id });
}
