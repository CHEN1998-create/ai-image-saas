"use client";

import { useEffect, useState } from "react";
import { Heart, Trash2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { GalleryImage } from "@/lib/db";
import { ShareToCommunity } from "@/components/social/share-to-community";
import { cn, timeAgo } from "@/lib/utils";

const filters = ["全部", "收藏", "flux-dev", "flux-pro", "sd3.5"];

export default function GalleryPage() {
  const [filter, setFilter] = useState("全部");
  const [q, setQ] = useState("");
  const [images, setImages] = useState<GalleryImage[] | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((d) => setImages(d.images ?? []))
      .catch(() => setImages([]));
  }, []);

  const list = (images ?? []).filter((g) => {
    if (filter === "收藏") return g.favorite;
    if (filter !== "全部" && g.model !== filter) return false;
    if (q && !g.prompt.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold">历史图库</h1>
          <p className="text-xs text-muted-foreground">
            {images ? `${list.length} 张作品` : "加载中..."}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索 Prompt"
            className="pl-8 w-56"
          />
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs rounded-full border transition-colors",
              filter === f
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {images === null ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-secondary animate-pulse"
            />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          没有匹配的作品
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((g) => (
            <Card key={g.id} className="overflow-hidden group">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.url}
                  alt={g.prompt}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="bg-black/50 text-white border-0">
                    {g.model}
                  </Badge>
                </div>
                {g.favorite && (
                  <div className="absolute top-2 right-2">
                    <Heart className="h-4 w-4 text-accent fill-accent" />
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 flex items-center justify-center gap-2">
                  <Button size="iconSm" variant="secondary">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button size="iconSm" variant="secondary">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <ShareToCommunity
                    imageId={g.id}
                    fallbackPrompt={g.prompt}
                    iconOnly
                  />
                  <Button size="iconSm" variant="secondary">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {g.prompt}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {timeAgo(g.createdAt)} · {g.ratio}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
