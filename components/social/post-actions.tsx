"use client";

import { useState } from "react";
import { Heart, Repeat2, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

export function PostActions({
  postId,
  initialLikes,
  initialLiked
}: {
  postId: string;
  initialLikes: number;
  initialLiked: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [busy, setBusy] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [copied, setCopied] = useState(false);

  async function toggleLike() {
    // 乐观更新
    setBusy(true);
    setLiked((v) => !v);
    setLikes((v) => v + (liked ? -1 : 1));
    try {
      const r = await fetch(`/api/posts/${postId}/likes`, { method: "POST" });
      if (!r.ok) throw new Error();
    } catch {
      // 回滚
      setLiked(liked);
      setLikes(likes);
    } finally {
      setBusy(false);
    }
  }

  async function repost() {
    if (reposted) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${postId}/repost`, { method: "POST" });
      if (!r.ok) throw new Error();
      setReposted(true);
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}/app/posts/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("复制作品链接", url);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={liked ? "gradient" : "outline"}
        size="sm"
        disabled={busy}
        onClick={toggleLike}
        className="gap-1.5"
      >
        <Heart className={cn("h-4 w-4", liked && "fill-white")} />
        {formatNumber(likes)}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={busy || reposted}
        onClick={repost}
        className="gap-1.5"
      >
        <Repeat2 className="h-4 w-4" />
        {reposted ? "已转发" : "转发"}
      </Button>
      <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
        {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
        {copied ? "已复制" : "分享"}
      </Button>
    </div>
  );
}
