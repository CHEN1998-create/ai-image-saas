"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, SendHorizontal } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({
  postId,
  avatar
}: {
  postId: string;
  avatar: string;
}) {
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit() {
    const text = content.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text })
      });
      if (!r.ok) throw new Error();
      setContent("");
      router.refresh(); // 服务端重新查询评论列表
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Avatar src={avatar} className="h-8 w-8 shrink-0" />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
        }}
        placeholder="写下你的评论…（Ctrl+Enter 发送）"
        className="min-h-[40px] text-sm flex-1"
      />
      <Button size="sm" onClick={submit} disabled={busy || !content.trim()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
      </Button>
    </div>
  );
}
