"use client";

import { useState } from "react";
import { Send, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareToCommunity({
  imageId,
  fallbackPrompt,
  iconOnly = false
}: {
  imageId: string;
  fallbackPrompt: string;
  iconOnly?: boolean;
}) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function share() {
    const caption = window.prompt(
      "分享到社区，写一句话介绍你的作品：",
      fallbackPrompt
    );
    if (caption === null) return; // 用户取消

    setState("busy");
    try {
      const r = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId,
          caption: caption.trim() || fallbackPrompt
        })
      });
      const d = await r.json();
      if (!r.ok || !d.post) throw new Error();
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
      alert("分享失败，请重试");
    }
  }

  return (
    <Button
      size={iconOnly ? "iconSm" : "sm"}
      variant="secondary"
      disabled={state !== "idle"}
      onClick={share}
    >
      {state === "busy" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4 text-emerald-400" />
      ) : (
        <Send className="h-4 w-4" />
      )}
      {!iconOnly && (state === "done" ? "已分享" : "分享到社区")}
    </Button>
  );
}
