// Stripe 履约：支付成功后发放积分/升级套餐
// webhook 与「成功页验单」共用，靠 billing_records.stripe_session_id 唯一键幂等。
import type Stripe from "stripe";
import { createBillingRecord, addPointRecord } from "@/lib/db";
import { updateUser } from "@/lib/auth";
import { META } from "./stripe-config";

export type FulfillResult = {
  alreadyFulfilled: boolean;
  productType: string | null;
  pointsGranted: number;
};

export async function fulfillSession(
  session: Stripe.Checkout.Session
): Promise<FulfillResult> {
  // 仅对已支付的会话履约（订阅首单 / 一次性支付）
  const paid =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!paid) {
    return { alreadyFulfilled: false, productType: null, pointsGranted: 0 };
  }

  const md = session.metadata ?? {};
  const productType = md[META.PRODUCT_TYPE] ?? null;
  const userId =
    md[META.USER_ID] || session.client_reference_id || "";
  const points = parseInt(md[META.POINTS] ?? "0", 10) || 0;

  if (!userId || !productType) {
    return { alreadyFulfilled: false, productType, pointsGranted: 0 };
  }

  // 先落账单记录占位（唯一键冲突 = 已履约，直接返回，不重复发）
  const bill = await createBillingRecord({
    userId,
    type: productType,
    productType,
    amountCents: session.amount_total ?? 0,
    pointsDelta: points,
    planCode: md[META.PLAN_CODE],
    billingCycle: productType === "subscription" ? "monthly" : undefined,
    stripeSessionId: session.id,
    stripeInvoiceId:
      typeof session.invoice === "string" ? session.invoice : undefined,
    status: "paid"
  });

  if (bill.duplicated) {
    return { alreadyFulfilled: true, productType, pointsGranted: 0 };
  }

  if (productType === "subscription") {
    // 升级套餐 + 发放当月积分
    const planCode = md[META.PLAN_CODE];
    if (planCode) await updateUser(userId, { plan: planCode });
    await addPointRecord(userId, points, `订阅套餐发放 ${planCode ?? ""}`);
  } else {
    // 积分包：充值
    await addPointRecord(userId, points, `购买积分包 ${session.id}`);
  }

  return { alreadyFulfilled: false, productType, pointsGranted: points };
}
