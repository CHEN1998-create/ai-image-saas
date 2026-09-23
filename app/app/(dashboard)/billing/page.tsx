"use client";

import { useEffect, useState } from "react";
import { Crown, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import { TOPUP_PACKAGES } from "@/lib/stripe-config";

type Plan = {
  code: string; name: string;
  monthlyPriceCents: number; monthlyPoints: number; highlight?: boolean;
};
type Me = {
  user: { name: string; plan: string; points: number; totalGenerated: number };
};
type Order = {
  id: string; type: string; amountCents: number;
  pointsDelta: number; status: string; createdAt: string;
};

export default function BillingPage() {
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => setMe(d.user));
    fetch("/api/billing/plans").then((r) => r.json()).then((d) => setPlans(d.plans));
    fetch("/api/billing/records").then((r) => r.json()).then((d) => setOrders(d.records));
  }, []);

  async function checkout(payload: Record<string, unknown>, key: string) {
    setPending(key);
    try {
      const r = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const d = await r.json();
      if (d.url) {
        window.location.href = d.url; // 跳到 Stripe 托管收银台
      } else {
        setPending(null);
      }
    } catch {
      setPending(null);
    }
  }

  if (!me) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">套餐与积分</h1>
        <p className="text-xs text-muted-foreground">管理你的订阅档位与积分包</p>
      </header>

      {/* 当前套餐 */}
      <Card className="p-5 mb-8 bg-brand-gradient-soft border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient">
              <Crown className="h-6 w-6 text-white" />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">当前套餐</p>
              <p className="text-xl font-semibold capitalize">{me.plan}</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-muted-foreground">剩余积分</p>
              <p className="text-xl font-semibold">{formatNumber(me.points)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">累计生成</p>
              <p className="text-xl font-semibold">{formatNumber(me.totalGenerated)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 套餐 */}
      <h2 className="font-semibold mb-4">升级套餐（按月订阅）</h2>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {plans.map((p) => {
          const current = p.code === me.plan;
          const key = `sub_${p.code}`;
          const loading = pending === key;
          return (
            <Card key={p.code} className={cn("p-5 flex flex-col", p.highlight && "border-primary")}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                {current && <Badge variant="success">当前</Badge>}
                {!current && p.highlight && <Badge>推荐</Badge>}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold">${p.monthlyPriceCents / 100}</span>
                <span className="text-sm text-muted-foreground">/月</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatNumber(p.monthlyPoints)} 积分/月
              </p>
              <Button
                variant={current ? "secondary" : p.highlight ? "gradient" : "outline"}
                className="w-full mt-auto"
                disabled={current || loading}
                onClick={() =>
                  checkout({ kind: "subscription", plan_code: p.code }, key)
                }
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : current ? "当前套餐" : "升级"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* 积分包 */}
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5" /> 积分包 top-up（一次性）
      </h2>
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {TOPUP_PACKAGES.map((t) => {
          const key = `top_${t.id}`;
          const loading = pending === key;
          return (
            <Card key={t.id} className="p-5 flex flex-col">
              <p className="text-2xl font-bold">{formatNumber(t.points)}</p>
              <p className="text-sm text-muted-foreground mb-4">积分</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-semibold">${t.priceCents / 100}</span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => checkout({ kind: "topup", topup_id: t.id }, key)}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "购买"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 最近订单 */}
      <h2 className="font-semibold mb-4">最近订单</h2>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">还没有订单记录</p>
      ) : (
        <Card className="divide-y divide-border">
          {orders.slice(0, 6).map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-medium">{o.type === "topup" ? "积分包" : "套餐订阅"}</span>
                {o.pointsDelta > 0 && (
                  <span className="text-muted-foreground ml-2">+{formatNumber(o.pointsDelta)} 积分</span>
                )}
                <span className="text-xs text-muted-foreground ml-2">{timeAgo(o.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">${o.amountCents / 100}</span>
                <Badge variant={o.status === "paid" ? "success" : "secondary"}>{o.status}</Badge>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
