"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Heart, MessageCircle, RotateCcw, Check, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminPost } from "@/lib/db/types";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

// 页面筛选项 → moderation_status
const filters = [
  { label: "全部", value: "全部" },
  { label: "已发布", value: "approved" },
  { label: "待审核", value: "pending" },
  { label: "已下架", value: "rejected" }
] as const;

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [filter, setFilter] = useState<string>("全部");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "全部") params.set("moderation", filter);
    const resp = await fetch(`/api/admin/posts?${params}`);
    const data = await resp.json();
    if (resp.ok) setPosts(data.posts);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function moderate(postId: string, action: "approve" | "reject") {
    setBusyId(postId);
    try {
      const resp = await fetch("/api/admin/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, action })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "操作失败");
      showToast(action === "approve" ? "已通过，作品恢复公开" : "已下架，作品不再公开展示");
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusyId(null);
    }
  }

  const badgeFor = (s: AdminPost["status"]) =>
    s === "published"
      ? { label: "已发布", variant: "success" as const }
      : s === "pending"
      ? { label: "待审核", variant: "warning" as const }
      : { label: "已下架", variant: "destructive" as const };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">内容管理</h1>
        <p className="text-xs text-muted-foreground">
          审核社区作品，处理举报与下架
        </p>
      </header>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-secondary px-4 py-2 text-xs border border-border shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "secondary" : "ghost"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading && (
        <p className="py-10 text-center text-muted-foreground text-xs">加载中…</p>
      )}
      {!loading && posts.length === 0 && (
        <p className="py-10 text-center text-muted-foreground text-xs">
          没有匹配的作品
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {posts.map((p) => {
          const badge = badgeFor(p.status);
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
                  {p.status !== "published" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8"
                      disabled={busyId === p.id}
                      onClick={() => moderate(p.id, "approve")}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      {p.status === "pending" ? "审核通过" : "恢复上架"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1 h-8" asChild>
                      <a href={`/app/posts/${p.id}`} target="_blank" rel="noreferrer">
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        查看
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className={cn(
                      "h-8 px-2",
                      p.status === "published" ? "text-destructive" : "text-muted-foreground"
                    )}
                    disabled={busyId === p.id || p.status !== "published"}
                    title="下架"
                    onClick={() => moderate(p.id, "reject")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
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
