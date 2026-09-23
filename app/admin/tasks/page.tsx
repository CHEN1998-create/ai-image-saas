"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCw, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminTask } from "@/lib/db/types";
import { cn, timeAgo } from "@/lib/utils";

type StatusFilter = "全部" | "queued" | "running" | "success" | "failed" | "cancelled";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "全部", value: "全部" },
  { label: "成功", value: "success" },
  { label: "运行中", value: "running" },
  { label: "失败", value: "failed" },
  { label: "排队中", value: "queued" },
  { label: "已取消", value: "cancelled" }
];

const statusBadge: Record<
  string,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary"; pulse?: boolean }
> = {
  success: { label: "成功", variant: "success" },
  running: { label: "运行中", variant: "warning", pulse: true },
  failed: { label: "失败", variant: "destructive" },
  queued: { label: "排队中", variant: "secondary" },
  cancelled: { label: "已取消", variant: "secondary" }
};

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("全部");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "全部") params.set("status", filter);
    const resp = await fetch(`/api/admin/tasks?${params}`);
    const data = await resp.json();
    if (resp.ok) setTasks(data.tasks);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  // 有运行中任务时 4 秒自动刷新
  useEffect(() => {
    if (!tasks.some((t) => t.status === "running" || t.status === "queued")) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [tasks, load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function act(taskId: string, action: "cancel" | "retry") {
    setBusyId(taskId);
    try {
      const resp = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "操作失败");
      showToast(
        action === "cancel"
          ? `任务已取消${data.refund ? `，退还 ${data.refund} 积分` : ""}`
          : "已重新发起任务"
      );
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">任务管理</h1>
        <p className="text-xs text-muted-foreground">
          查看所有生成任务的执行状态，可取消异常任务或重试失败任务
        </p>
      </header>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-secondary px-4 py-2 text-xs border border-border shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {statusFilters.map((f) => (
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">ID</th>
                <th className="text-left font-medium px-5 py-3">用户</th>
                <th className="text-left font-medium px-5 py-3 min-w-[200px]">
                  Prompt
                </th>
                <th className="text-left font-medium px-5 py-3">模型</th>
                <th className="text-left font-medium px-5 py-3">状态</th>
                <th className="text-right font-medium px-5 py-3">积分</th>
                <th className="text-right font-medium px-5 py-3">耗时</th>
                <th className="text-left font-medium px-5 py-3">时间</th>
                <th className="text-left font-medium px-5 py-3">错误</th>
                <th className="text-right font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-muted-foreground text-xs">
                    加载中…
                  </td>
                </tr>
              )}
              {!loading && tasks.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-10 text-center text-muted-foreground text-xs">
                    没有匹配的任务
                  </td>
                </tr>
              )}
              {tasks.map((t) => {
                const badge = statusBadge[t.status];
                return (
                  <tr key={t.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {t.id}
                    </td>
                    <td className="px-5 py-3">{t.user}</td>
                    <td className="px-5 py-3 max-w-[240px]">
                      <p className="line-clamp-1 text-muted-foreground">
                        {t.prompt}
                      </p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {t.model}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={badge.variant}
                        className={cn(badge.pulse && "animate-pulse")}
                      >
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">{t.pointsCost}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {t.durationMs > 0 ? `${t.durationMs}ms` : "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                      {timeAgo(t.createdAt)}
                    </td>
                    <td className="px-5 py-3 max-w-[160px]">
                      {t.status === "failed" && t.error ? (
                        <span className="text-destructive text-xs line-clamp-2">
                          {t.error}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          disabled={busyId === t.id || t.status !== "failed"}
                          title="重试（重新扣费）"
                          onClick={() => act(t.id, "retry")}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-destructive"
                          disabled={busyId === t.id || (t.status !== "queued" && t.status !== "running")}
                          title="取消任务并退还积分"
                          onClick={() => act(t.id, "cancel")}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="mt-3 text-[10px] text-muted-foreground">
        重试：失败任务积分已退还，重试会重新按原价扣费；取消：排队中/运行中任务可取消，预扣积分全额退还。
      </p>
    </div>
  );
}
