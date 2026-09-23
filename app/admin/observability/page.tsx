import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Timer,
  Database,
  Layers,
  Bell,
  Server
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getObservability } from "@/lib/db";
import { cn, formatNumber } from "@/lib/utils";

export default async function AdminObservabilityPage() {
  const observability = getObservability();
  const apiStats = [
  {
    label: "24h 调用数",
    value: formatNumber(observability.api.calls24h),
    icon: Activity,
    accent: "text-primary"
  },
  {
    label: "成功率",
    value: `${observability.api.successRate}%`,
    icon: CheckCircle2,
    accent: "text-success"
  },
  {
    label: "错误率",
    value: `${observability.api.errorRate}%`,
    icon: AlertCircle,
    accent: "text-destructive"
  },
  {
    label: "平均延迟",
    value: `${observability.api.avgLatencyMs}ms`,
    icon: Timer,
    accent: "text-warning"
  }
];

  const connPct =
    (observability.database.connections /
      observability.database.maxConnections) *
    100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">系统监控</h1>
        <p className="text-xs text-muted-foreground">
          平台 API、模型、数据库与队列的实时健康度
        </p>
      </header>

      {/* API 概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {apiStats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* 模型调用 */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-border">
            <h3 className="font-semibold text-sm">模型调用</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">模型</th>
                  <th className="text-right font-medium px-5 py-3">调用数</th>
                  <th className="text-right font-medium px-5 py-3">成功率</th>
                  <th className="text-right font-medium px-5 py-3">
                    平均延迟
                  </th>
                  <th className="text-left font-medium px-5 py-3">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {observability.providers.map((p) => (
                  <tr key={p.name} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 font-medium">{p.name}</td>
                    <td className="px-5 py-3 text-right">
                      {formatNumber(p.calls)}
                    </td>
                    <td className="px-5 py-3 text-right">{p.successRate}%</td>
                    <td className="px-5 py-3 text-right">
                      {p.avgLatencyMs}ms
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          p.status === "healthy" ? "success" : "warning"
                        }
                      >
                        {p.status === "healthy" ? "正常" : "降级"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 数据库 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">数据库</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">连接数</span>
                <span className="text-xs">
                  {observability.database.connections}/
                  {observability.database.maxConnections}
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-2 rounded-full bg-brand-gradient"
                  style={{ width: `${connPct}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">慢查询</span>
              <span className="text-sm font-semibold text-warning">
                {observability.database.slowQueries}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">失败率</span>
              <span className="text-sm font-semibold text-destructive">
                {observability.database.failedRate}%
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* 队列 */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">任务队列</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "待处理", value: observability.queue.pending, accent: "text-muted-foreground" },
              { label: "处理中", value: observability.queue.processing, accent: "text-primary" },
              { label: "今日失败", value: observability.queue.failedToday, accent: "text-destructive" },
              { label: "重试中", value: observability.queue.retrying, accent: "text-warning" }
            ].map((q) => (
              <div
                key={q.label}
                className="rounded-md bg-secondary/40 p-3 text-center"
              >
                <p className="text-xs text-muted-foreground mb-1">
                  {q.label}
                </p>
                <p className={cn("text-xl font-semibold", q.accent)}>
                  {q.value}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* 告警 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">告警</h3>
          </div>
          <div className="space-y-3">
            {observability.alerts.map((a, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge
                  variant={a.level === "warning" ? "warning" : "secondary"}
                  className="mt-0.5"
                >
                  {a.level === "warning" ? "告警" : "通知"}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{a.title}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 健康检查 */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">健康检查</h3>
        </div>
        <div className="divide-y divide-border">
          {observability.health.map((h) => (
            <div
              key={h.service}
              className="flex items-center justify-between px-5 py-3"
            >
              <span className="text-sm font-medium">{h.service}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {h.detail}
                </span>
                <Badge
                  variant={h.status === "healthy" ? "success" : "warning"}
                >
                  {h.status === "healthy" ? "正常" : "降级"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
