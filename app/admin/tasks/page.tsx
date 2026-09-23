"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminTasks } from "@/lib/mock-data";
import { cn, timeAgo } from "@/lib/utils";
import type { TaskStatus } from "@/lib/mock-data";

const statusFilters: { label: string; value: "全部" | TaskStatus }[] = [
  { label: "全部", value: "全部" },
  { label: "成功", value: "success" },
  { label: "运行中", value: "running" },
  { label: "失败", value: "failed" },
  { label: "排队中", value: "queued" }
];

const statusBadge: Record<
  TaskStatus,
  { label: string; variant: "success" | "warning" | "destructive" | "secondary"; pulse?: boolean }
> = {
  success: { label: "成功", variant: "success" },
  running: { label: "运行中", variant: "warning", pulse: true },
  failed: { label: "失败", variant: "destructive" },
  queued: { label: "排队中", variant: "secondary" }
};

export default function AdminTasksPage() {
  const [filter, setFilter] = useState<"全部" | TaskStatus>("全部");

  const filtered =
    filter === "全部" ? adminTasks : adminTasks.filter((t) => t.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">任务管理</h1>
        <p className="text-xs text-muted-foreground">
          查看所有生成任务的执行状态与错误
        </p>
      </header>

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
              {filtered.map((t) => {
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
                    <td className="px-5 py-3 text-muted-foreground">
                      {timeAgo(t.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      {t.status === "failed" && t.error ? (
                        <span className="text-destructive text-xs">
                          {t.error}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          disabled={t.status !== "failed"}
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                          重试
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
    </div>
  );
}
