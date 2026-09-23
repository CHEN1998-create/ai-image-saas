// Stripe 服务端实例（server-only）
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe 未配置：.env.local 需 STRIPE_SECRET_KEY（sk_test_...）");
  }
  _stripe = new Stripe(key, {
    typescript: true
  });
  return _stripe;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Stripe webhook 未配置：.env.local 需 STRIPE_WEBHOOK_SECRET（whsec_...）");
  }
  return secret;
}
