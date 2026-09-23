"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { faqs } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="container py-20 max-w-3xl">
      <div className="text-center mb-10">
        <Badge className="mb-4">FAQ</Badge>
        <h1 className="text-4xl font-bold tracking-tight">常见问题</h1>
        <p className="text-muted-foreground mt-2">关于套餐、积分与账号的说明</p>
      </div>

      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <span className="font-medium">{f.q}</span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-muted-foreground transition-transform shrink-0 ml-3",
                  open === i && "rotate-180"
                )}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                {f.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center rounded-2xl bg-brand-gradient-soft border border-border p-8">
        <h2 className="text-xl font-semibold">还有其他问题？</h2>
        <p className="text-sm text-muted-foreground mt-1">
          注册后在个人中心联系支持
        </p>
        <Link href="/app/register" className="inline-block mt-4">
          <Button variant="gradient">
            免费开始 <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
