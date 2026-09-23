"use client";

import { Crown, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { plans, currentUser } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";

const topups = [
  { points: 1000, price: 8 },
  { points: 5000, price: 36 },
  { points: 15000, price: 100 }
];

export default function BillingPage() {
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
              <p className="text-xl font-semibold capitalize">
                {currentUser.plan}
              </p>
            </div>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-muted-foreground">剩余积分</p>
              <p className="text-xl font-semibold">
                {formatNumber(currentUser.points)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">累计生成</p>
              <p className="text-xl font-semibold">
                {currentUser.totalGenerated}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 套餐 */}
      <h2 className="font-semibold mb-4">升级套餐</h2>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {plans.map((p) => {
          const current = p.code === currentUser.plan;
          return (
            <Card
              key={p.code}
              className={cn(
                "p-5 flex flex-col",
                p.highlight && "border-primary"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                {current && <Badge variant="success">当前</Badge>}
                {!current && p.highlight && <Badge>推荐</Badge>}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold">
                  ${p.monthlyPriceCents / 100}
                </span>
                <span className="text-sm text-muted-foreground">/月</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatNumber(p.monthlyPoints)} 积分/月
              </p>
              <Button
                variant={
                  current ? "secondary" : p.highlight ? "gradient" : "outline"
                }
                className="w-full mt-auto"
                disabled={current}
              >
                {current ? "当前套餐" : "升级"}
              </Button>
            </Card>
          );
        })}
      </div>

      {/* 积分包 */}
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <Coins className="h-5 w-5" /> 积分包 top-up
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {topups.map((t) => (
          <Card key={t.points} className="p-5 flex flex-col">
            <p className="text-2xl font-bold">{formatNumber(t.points)}</p>
            <p className="text-sm text-muted-foreground mb-4">积分</p>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-lg font-semibold">${t.price}</span>
              <Button size="sm" variant="outline">
                购买
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
