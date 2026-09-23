"use client";

import { useEffect, useRef, useState } from "react";
import {
  Wand2,
  Sparkles,
  RefreshCw,
  Heart,
  Share2,
  Download,
  Coins,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { models, aspectRatios } from "@/lib/mock-data";
import type { GalleryImage, TaskStatus } from "@/lib/db";
import { cn, formatNumber } from "@/lib/utils";

const suggestions = [
  "a cinematic futuristic city at sunset, ultra detailed",
  "soft portrait of a girl with neon hair, film grain",
  "abstract liquid metal shapes, octane render"
];

interface LiveTask {
  id: string;
  status: TaskStatus;
  progress: number;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [negative, setNegative] = useState("");
  const [model, setModel] = useState(models[0].code);
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState(4);
  const [task, setTask] = useState<LiveTask | null>(null);
  const [results, setResults] = useState<GalleryImage[]>([]);
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const taskIdRef = useRef<string | null>(null);

  const busy = task?.status === "queued" || task?.status === "running";
  const selectedModel = models.find((m) => m.code === model)!;
  const cost = selectedModel.pointsPerImage * count;

  useEffect(() => {
    refreshPoints();
    return () => stopPolling();
  }, []);

  function refreshPoints() {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user?.points != null && setPoints(d.user.points))
      .catch(() => {});
  }

  function stopPolling() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  // 轮询任务，直到 success/failed
  function pollTask(id: string) {
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/generations/${id}`);
        if (res.status === 404) {
          setError("任务不存在");
          setTask(null);
          return;
        }
        const data = await res.json();
        setTask({ id, status: data.task.status, progress: data.task.progress });
        if (Array.isArray(data.images)) setResults(data.images);

        if (data.task.status === "success") {
          refreshPoints();
          return; // 停止轮询
        }
        if (data.task.status === "failed") {
          setError(data.task.error || "生成失败");
          setResults([]);
          refreshPoints(); // 失败已退还积分
          return;
        }
      } catch {
        // 单次网络抖动：继续轮询，下一轮自愈
      }
      // 仍在 queued/running，安排下一次
      if (taskIdRef.current === id) pollTask(id);
    }, 1500);
  }

  const handleGenerate = async () => {
    if (!prompt || busy) return;
    setError("");
    setResults([]);
    setTask({ id: "", status: "queued", progress: 0 });
    try {
      const res = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt: negative,
          model,
          ratio,
          count
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "生成失败");
        setTask(null);
        return;
      }
      taskIdRef.current = data.task.id;
      setTask({ id: data.task.id, status: "queued", progress: 0 });
      pollTask(data.task.id);
    } catch {
      setError("网络错误，请重试");
      setTask(null);
    }
  };

  const resetWorkspace = () => {
    stopPolling();
    taskIdRef.current = null;
    setTask(null);
    setResults([]);
    setError("");
  };

  const statusText: Record<TaskStatus, string> = {
    queued: "排队中...",
    running: "正在生成",
    success: "生成完成",
    failed: "生成失败"
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">生成工作台</h1>
          <p className="text-xs text-muted-foreground">
            输入 Prompt，调整参数，开始创作
          </p>
        </div>
        <Badge variant="secondary">
          <Coins className="h-3 w-3 mr-1" />
          {formatNumber(points ?? 0)} 积分
        </Badge>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 参数面板 */}
        <div className="w-full lg:w-[360px] shrink-0 border-b lg:border-b-0 lg:border-r border-border p-5 overflow-auto scrollbar-thin space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Prompt</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="a cinematic futuristic city at sunset, ultra detailed..."
              className="min-h-[120px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Negative Prompt
            </label>
            <Textarea
              value={negative}
              onChange={(e) => setNegative(e.target.value)}
              placeholder="blurry, low quality..."
              className="min-h-[60px]"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">模型</label>
            <div className="space-y-2">
              {models.map((m) => (
                <button
                  key={m.code}
                  onClick={() => setModel(m.code)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-colors",
                    model === m.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-secondary"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {m.pointsPerImage} 积分/张
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">比例</label>
            <div className="grid grid-cols-5 gap-1.5">
              {aspectRatios.map((r) => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  className={cn(
                    "py-2 text-xs rounded-md border transition-colors",
                    ratio === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">数量</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={cn(
                    "py-2 text-sm rounded-md border transition-colors",
                    count === n
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <Button
              variant="gradient"
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={busy || !prompt}
            >
              {busy ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  {statusText[task!.status]}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" /> 生成 ({cost} 积分)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              本次将消耗 {cost} 积分
            </p>
            {error && (
              <p className="text-xs text-destructive text-center mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="h-3 w-3" /> {error}
              </p>
            )}
          </div>
        </div>

        {/* 结果区 */}
        <div className="flex-1 p-6 overflow-auto scrollbar-thin">
          {/* 进行中：进度条 + 槽位（图片逐张填充） */}
          {busy && (
            <div>
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {statusText[task!.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {task!.progress}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-500"
                    style={{ width: `${task!.progress}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: count }).map((_, i) =>
                  results[i] ? (
                    <ResultCard key={results[i].id} image={results[i]} ratio={ratio} />
                  ) : (
                    <div
                      key={i}
                      className="rounded-xl bg-secondary overflow-hidden relative"
                      style={{ aspectRatio: ratio.replace(":", "/") }}
                    >
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent animate-shimmer" />
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* 完成 */}
          {task?.status === "success" && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">
                  生成结果
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {results.length} 张 · 已存入图库
                  </span>
                </h2>
                <Button variant="outline" size="sm" onClick={resetWorkspace}>
                  <RefreshCw className="h-4 w-4" /> 新的生成
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {results.map((r) => (
                  <ResultCard key={r.id} image={r} ratio={ratio} />
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!task && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Sparkles className="h-8 w-8" />
              </span>
              <h2 className="text-lg font-semibold">开始你的第一次生成</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                在左侧输入 Prompt，选择模型与参数，点击生成
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                {suggestions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="px-3 py-1.5 text-xs rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 单张结果卡片：图片 + hover 操作（下载为真实链接）
function ResultCard({ image, ratio }: { image: GalleryImage; ratio: string }) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative" style={{ aspectRatio: ratio.replace(":", "/") }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.prompt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-2">
          <Button size="iconSm" variant="secondary">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="iconSm" variant="secondary">
            <Share2 className="h-4 w-4" />
          </Button>
          <a href={image.url} download target="_blank" rel="noreferrer">
            <Button size="iconSm" variant="secondary">
              <Download className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
      <div className="p-3">
        <p className="text-xs text-muted-foreground line-clamp-1">
          {image.prompt}
        </p>
      </div>
    </Card>
  );
}
