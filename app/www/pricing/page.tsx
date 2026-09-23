"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { plans } from "@/lib/mock-data";
import { cn, formatNumber } from "@/lib/utils";

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <section className="container py-20 text-center">
        <Badge className="mb-4">定价</Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          选择你的档位
        </h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
          积分随套餐按月发放，年付默认 8 折，支持额外购买积分包
        </p>
        <div className="inline-flex items-center gap-1 mt-6 p-1 rounded-full border border-border bg-card">
          <button
            onClick={() => setYearly(false)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full transition-colors",
              !yearly && "bg-primary text-primary-foreground"
            )}
          >
            月付
          </button>
          <button
            onClick={() => setYearly(true)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full transition-colors",
              yearly && "bg-primary text-primary-foreground"
            )}
          >
            年付 <span className="text-xs opacity-80">省 20%</span>
          </button>
        </div>
      </section>

      <section className="container pb-12">
        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((p) => {
            const price = yearly
              ? p.yearlyPriceCents / 100 / 12
              : p.monthlyPriceCents / 100;
            return (
              <Card
                key={p.code}
                className={cn(
                  "p-6 flex flex-col",
                  p.highlight && "border-primary ring-1 ring-primary/40"
                )}
              >
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {p.tagline}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${price.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">/月</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {yearly ? "按年付费" : "按月付费"}
                </p>
                <div className="my-5 h-px bg-border" />
                <ul className="space-y-2 mb-6 flex-1">
                  <li className="text-sm flex gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    {formatNumber(p.monthlyPoints)} 积分/月
                  </li>
                  <li className="text-sm flex gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    图片并发 {p.imageConcurrency}
                  </li>
                  <li className="text-sm flex gap-2">
                    <Check className="h-4 w-4 text-success shrink-0" />
                    视频并发 {p.videoConcurrency}
                  </li>
                  {p.features.map((f) => (
                    <li key={f} className="text-sm flex gap-2">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/app/register">
                  <Button
                    variant={p.highlight ? "gradient" : "outline"}
                    className="w-full"
                  >
                    {p.highlight ? "开始使用" : "选择 " + p.name}
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* 积分包 */}
        <Card className="mt-8 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">积分不够？购买积分包</h3>
            <p className="text-sm text-muted-foreground mt-1">
              随时 top-up，积分包自购买起 12 个月有效
            </p>
          </div>
          <Link href="/app/billing">
            <Button variant="outline">
              前往积分包 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      {/* 套餐对比表 */}
      <section className="container pb-20">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-center">
          套餐对比
        </h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card">
              <tr>
                <th className="text-left p-4 font-medium">权益</th>
                {plans.map((p) => (
                  <th key={p.code} className="p-4 font-medium text-center">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: "每月积分",
                  values: plans.map((p) => formatNumber(p.monthlyPoints))
                },
                {
                  label: "月付价格",
                  values: plans.map((p) => `$${p.monthlyPriceCents / 100}`)
                },
                {
                  label: "图片并发",
                  values: plans.map((p) => String(p.imageConcurrency))
                },
                {
                  label: "视频并发",
                  values: plans.map((p) => String(p.videoConcurrency))
                },
                {
                  label: "高清视频",
                  values: ["—", "✓", "✓", "✓"]
                },
                {
                  label: "隐身生成",
                  values: ["—", "—", "✓", "✓"]
                },
                {
                  label: "购买积分包",
                  values: ["✓", "✓", "✓", "✓"]
                }
              ].map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-4 text-muted-foreground">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="p-4 text-center">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
