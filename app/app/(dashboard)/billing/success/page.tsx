"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";

function SuccessInner() {
  const [state, setState] = useState<"loading" | "done" | "error">("loading");
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const sid = new URLSearchParams(window.location.search).get("session_id");
    if (!sid) {
      setState("error");
      return;
    }
    fetch("/api/stripe/verify-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sid })
    })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const d = await r.json();
        setPoints(d.result.pointsGranted ?? 0);
        setState("done");
      })
      .catch(() => setState("error"));
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto mt-10">
      <Card className="p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="font-medium">正在确认支付结果…</p>
            <p className="text-xs text-muted-foreground mt-1">请稍候</p>
          </>
        )}
        {state === "done" && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
            <p className="text-lg font-semibold">支付成功</p>
            {points > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                已发放 {formatNumber(points)} 积分
              </p>
            )}
            <div className="flex gap-2 justify-center mt-6">
              <Link href="/app/generate">
                <Button variant="gradient">去生成</Button>
              </Link>
              <Link href="/app/gallery">
                <Button variant="outline">看图库</Button>
              </Link>
            </div>
          </>
        )}
        {state === "error" && (
          <>
            <p className="text-lg font-semibold">支付结果确认中</p>
            <p className="text-sm text-muted-foreground mt-1">
              系统会在稍后自动到账，如长时间未到账请联系客服
            </p>
            <Link href="/app/billing" className="inline-block mt-6">
              <Button variant="outline">返回套餐</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
