// Stripe 商品配置 — 积分包（一次性购买）与套餐（订阅）
// 套餐价格/积分来自 lumen.subscription_plans（与定价页一致）；
// 积分包在此固定配置（也可后续迁入 DB，由 admin 运营配置）。

export interface TopupPackage {
  id: string;
  points: number;
  priceCents: number; // 美分
}

export const TOPUP_PACKAGES: TopupPackage[] = [
  { id: "topup_1000", points: 1000, priceCents: 800 },
  { id: "topup_5000", points: 5000, priceCents: 3600 },
  { id: "topup_15000", points: 15000, priceCents: 10000 }
];

export function findTopup(id: string): TopupPackage | undefined {
  return TOPUP_PACKAGES.find((t) => t.id === id);
}

// Checkout session metadata 的键名（webhook/成功页履约时读取）
export const META = {
  PRODUCT_TYPE: "product_type", // subscription / topup
  PLAN_CODE: "plan_code",
  POINTS: "points",
  USER_ID: "user_id"
} as const;
