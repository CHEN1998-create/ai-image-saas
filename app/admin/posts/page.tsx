"use client";

import { useState } from "react";
import { Flag, Heart, MessageCircle, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminPosts } from "@/lib/mock-data";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

const statusFilters = ["全部", "published", "pending", "flagged"] as const;
type StatusFilter = (typeof statusFilters)[number];

const statusBadge: Record<
  "published" | "pending" | "flagged",
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  published: { label: "已发布", variant: "success" },
  pending: { label: "待审核", variant: "warning" },
  flagged: { label: "已举报", variant: "destructive" }
};

export default function AdminPostsPage() {
  const [filter, setFilter] = useState<StatusFilter>("全部");

  const filtered =
    filter === "全部"
      ? adminPosts
      : adminPosts.filter((p) => p.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">内容管理</h1>
        <p className="text-xs text-muted-foreground">
          审核社区作品，处理举报与下架
        </p>
      </header>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "secondary" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "published"
              ? "已发布"
              : f === "pending"
              ? "待审核"
              : f === "flagged"
              ? "已举报"
              : f}
          </Button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => {
          const badge = statusBadge[p.status];
          return (
            <Card key={p.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-secondary/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                {p.reports > 0 && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive" className="gap-1">
                      <Flag className="h-3 w-3" />
                      {p.reports}
                    </Badge>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">
                    {p.author}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(p.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {formatNumber(p.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {p.comments}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8">
                    {p.status === "pending"
                      ? "审核"
                      : p.status === "flagged"
                      ? "复核"
                      : "查看"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 px-2",
                      p.status === "published"
                        ? "text-destructive"
                        : "text-muted-foreground"
                    )}
                    disabled={p.status !== "published"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    下架
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
