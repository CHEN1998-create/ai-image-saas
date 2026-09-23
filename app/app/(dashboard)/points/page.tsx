"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Coins,
  Check,
  TrendingUp,
  TrendingDown,
  Calendar,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PointRecord } from "@/lib/db";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export default function PointsPage() {
  const [data, setData] = useState<{
    balance: number;
    monthEarn: number;
    monthSpend: number;
    records: PointRecord[];
  } | null>(null);
  const [checked, setChecked] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [status, setStatus] = useState<"loading" | "error" | "ok">("loading");

  const load = useCallback(() => {
    setStatus("loading");
    fetch("/api/points")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        setData(d);
        setStatus("ok");
        setChecked(
          d.records?.some(
            (r: PointRecord) =>
              r.source === "每日签到" &&
              new Date(r.createdAt).toDateString() === new Date().toDateString()
          ) ?? false
        );
      })
      .catch(() => setStatus("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/points/check-in", { method: "POST" });
      if (res.ok) {
        setChecked(true);
        load();
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const balance = data?.balance ?? 0;
  const monthEarn = data?.monthEarn ?? 0;
  const monthSpend = data?.monthSpend ?? 0;
  const records = data?.records ?? [];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <p className="text-sm">积分数据加载失败，请检查网络后重试</p>
        <Button variant="outline" size="sm" onClick={load}>
          重新加载
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">积分中心</h1>
        <p className="text-xs text-muted-foreground">查看余额、签到与明细</p>
      </header>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Coins className="h-4 w-4" />
            <span className="text-xs">当前余额</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(balance)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">累计获得</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(monthEarn)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingDown className="h-4 w-4" />
            <span className="text-xs">累计消耗</span>
          </div>
          <p className="text-3xl font-bold">{formatNumber(monthSpend)}</p>
        </Card>
      </div>

      <Card className="p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/15 text-warning">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium">每日签到</p>
            <p className="text-xs text-muted-foreground">
              签到得 20 积分，连续 7 天加倍
            </p>
          </div>
        </div>
        <Button
          variant={checked ? "secondary" : "gradient"}
          disabled={checked || checkingIn}
          onClick={handleCheckIn}
        >
          {checked ? (
            <>
              <Check className="h-4 w-4" /> 已签到
            </>
          ) : (
            "签到 +20"
          )}
        </Button>
      </Card>

      <h2 className="font-semibold mb-3">积分明细</h2>
      <Card className="divide-y divide-border">
        {records.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            暂无积分记录
          </div>
        ) : (
          records.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    r.type === "earn"
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  )}
                >
                  {r.type === "earn" ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">{r.source}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "font-semibold",
                  r.type === "earn" ? "text-success" : "text-foreground"
                )}
              >
                {r.delta > 0 ? "+" : ""}
                {r.delta}
              </span>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
