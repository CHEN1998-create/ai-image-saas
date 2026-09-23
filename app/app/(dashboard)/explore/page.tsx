"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Repeat2, Flame, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { posts } from "@/lib/mock-data";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

const tags = [
  "全部",
  "portrait",
  "landscape",
  "cyberpunk",
  "anime",
  "3d",
  "macro",
  "product",
  "fantasy",
  "retro",
  "concept",
  "lofi"
];

export default function ExplorePage() {
  const [sort, setSort] = useState<"hot" | "new">("hot");
  const [tag, setTag] = useState("全部");

  const list = posts
    .filter((p) => tag === "全部" || p.tags.includes(tag))
    .sort((a, b) =>
      sort === "hot"
        ? b.likes - a.likes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="p-6">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">社区广场</h1>
        <p className="text-xs text-muted-foreground">探索创作者的公开作品</p>
      </header>

      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex p-1 rounded-lg border border-border bg-card">
          <button
            onClick={() => setSort("hot")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors",
              sort === "hot" && "bg-primary text-primary-foreground"
            )}
          >
            <Flame className="h-3.5 w-3.5" /> 热门
          </button>
          <button
            onClick={() => setSort("new")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors",
              sort === "new" && "bg-primary text-primary-foreground"
            )}
          >
            <Clock className="h-3.5 w-3.5" /> 最新
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((t) => (
          <button
            key={t}
            onClick={() => setTag(t)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              tag === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          暂无作品，快去生成并分享第一幅作品吧
        </div>
      ) : (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
        {list.map((p) => (
          <Link
            key={p.id}
            href={`/app/posts/${p.id}`}
            className="block mb-4 break-inside-avoid"
          >
            <Card className="overflow-hidden group">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.prompt}
                  className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                  <p className="text-xs text-white/90 line-clamp-2">
                    {p.prompt}
                  </p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar src={p.author.avatar} className="h-6 w-6" />
                  <span className="text-xs text-muted-foreground">
                    {p.author.name}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {timeAgo(p.createdAt)}
                  </span>
                </div>
                <p className="text-xs line-clamp-1 mb-2">{p.caption}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart
                      className={cn(
                        "h-3.5 w-3.5",
                        p.liked && "text-accent fill-accent"
                      )}
                    />
                    {formatNumber(p.likes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {p.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3.5 w-3.5" />
                    {p.reposts}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      )}
    </div>
  );
}
