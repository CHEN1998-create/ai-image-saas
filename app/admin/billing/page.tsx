"use client";

import { useState } from "react";
import { DollarSign, CheckCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminOrders } from "@/lib/mock-data";
import { cn, formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";

const statusFilters = ["全部", "paid", "failed", "refunded"] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusBadge = {
  paid: { label: "已支付", variant: "success" as const },
  failed: { label: "失败", variant: "destructive" as const },
  refunded: { label: "已退款", variant: "warning" as const }
};

export default function AdminBillingPage() {
  const [filter, setFilter] = useState<StatusFilter>("全部");

  const filtered =
    filter === "全部"
      ? adminOrders
      : adminOrders.filter((o) => o.status === filter);

  const totalRevenue = adminOrders
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + o.amountCents, 0);
  const paidCount = adminOrders.filter((o) => o.status === "paid").length;
  const refundedCount = adminOrders.filter(
    (o) => o.status === "refunded"
  ).length;

  const stats = [
    {
      label: "总收入",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      accent: "text-success"
    },
    {
      label: "已支付",
      value: paidCount,
      icon: CheckCircle,
      accent: "text-primary"
    },
    {
      label: "退款",
      value: refundedCount,
      icon: RotateCcw,
      accent: "text-warning"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">支付订单</h1>
        <p className="text-xs text-muted-foreground">
          查看订阅与积分包订单，处理退款
        </p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <p className="text-xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "secondary" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "paid"
              ? "已支付"
              : f === "failed"
              ? "失败"
              : f === "refunded"
              ? "已退款"
              : f}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">订单 ID</th>
                <th className="text-left font-medium px-5 py-3">用户</th>
                <th className="text-left font-medium px-5 py-3">类型</th>
                <th className="text-left font-medium px-5 py-3">套餐</th>
                <th className="text-right font-medium px-5 py-3">金额</th>
                <th className="text-right font-medium px-5 py-3">积分</th>
                <th className="text-left font-medium px-5 py-3">状态</th>
                <th className="text-left font-medium px-5 py-3">时间</th>
                <th className="text-right font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => {
                const badge = statusBadge[o.status];
                return (
                  <tr key={o.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {o.id}
                    </td>
                    <td className="px-5 py-3">{o.user}</td>
                    <td className="px-5 py-3">
                      <Badge variant={o.type === "topup" ? "secondary" : "default"}>
                        {o.type === "topup" ? "积分包" : "订阅"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {o.plan}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {formatCurrency(o.amountCents)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {formatNumber(o.points)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                        >
                          查看
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-warning"
                          disabled={o.status !== "paid"}
                        >
                          退款
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
