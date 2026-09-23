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
import { getObservabilityData, getApiLogs, getProviderLogs } from "@/lib/db/reads";
import { RunHealthCheck } from "@/components/admin/run-health-check";
import { cn, formatNumber, formatDate } from "@/lib/utils";

export default async function AdminObservabilityPage() {
  const [observability, apiLogs, providerLogs] = await Promise.all([
    getObservabilityData(),
    getApiLogs(8),
    getProviderLogs(8)
  ]);
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">系统监控</h1>
        <p className="text-xs text-muted-foreground">
          平台 API、模型、数据库与队列的实时健康度
        </p>
      </header>

      <RunHealthCheck />

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
            <h3 className="font-semibold text-sm">数据库 / 存储</h3>
          </div>
          <div className="space-y-3">
            {observability.health.filter((h) => h.service.includes("数据库") || h.service.includes("存储")).map((h) => (
              <div key={h.service} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">{h.service}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {h.detail}
                  </p>
                </div>
                <Badge variant={h.status === "healthy" ? "success" : "warning"}>
                  {h.status === "healthy" ? "正常" : "降级"}
                </Badge>
              </div>
            ))}
            {observability.health.filter((h) => h.service.includes("数据库") || h.service.includes("存储")).length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                暂无检测记录，点上方「运行实时检测」
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* API 调用日志 */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">API 调用日志（最近）</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">路由</th>
                  <th className="text-left font-medium px-3 py-2">方法</th>
                  <th className="text-right font-medium px-3 py-2">状态</th>
                  <th className="text-right font-medium px-3 py-2">耗时</th>
                  <th className="text-left font-medium px-4 py-2">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apiLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">暂无日志</td></tr>
                )}
                {apiLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2 font-mono max-w-[160px] truncate">{l.route}</td>
                    <td className="px-3 py-2 text-muted-foreground">{l.method}</td>
                    <td className={cn("px-3 py-2 text-right", l.statusCode < 400 ? "text-success" : "text-destructive")}>
                      {l.statusCode}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{l.durationMs}ms</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* 模型调用日志 */}
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">模型调用日志（最近）</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-secondary/40 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">模型</th>
                  <th className="text-left font-medium px-4 py-2">任务</th>
                  <th className="text-right font-medium px-3 py-2">结果</th>
                  <th className="text-right font-medium px-3 py-2">耗时</th>
                  <th className="text-left font-medium px-4 py-2">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {providerLogs.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">暂无日志</td></tr>
                )}
                {providerLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-secondary/30">
                    <td className="px-4 py-2 font-medium">{l.providerName}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground max-w-[120px] truncate">{l.taskId ?? "—"}</td>
                    <td className={cn("px-3 py-2 text-right", l.status === "success" ? "text-success" : "text-destructive")}>
                      {l.status === "success" ? "成功" : l.status === "timeout" ? "超时" : "失败"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{l.durationMs}ms</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{formatDate(l.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              { label: "已取消", value: observability.queue.retrying, accent: "text-warning" }
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

        {/* 告警（从真实状态派生） */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">告警</h3>
          </div>
          <div className="space-y-3">
            {observability.providers.filter((p) => p.status !== "healthy").map((p) => (
              <div key={p.name} className="flex items-start gap-2">
                <Badge variant="warning" className="mt-0.5">告警</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">模型 {p.name} 处于降级状态</p>
                  <p className="text-[10px] text-muted-foreground">近 24h 成功率 {p.successRate}%</p>
                </div>
              </div>
            ))}
            {observability.queue.failedToday > 0 && (
              <div className="flex items-start gap-2">
                <Badge variant="warning" className="mt-0.5">告警</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">今日有 {observability.queue.failedToday} 个失败/取消任务</p>
                  <p className="text-[10px] text-muted-foreground">建议查看任务管理页</p>
                </div>
              </div>
            )}
            {observability.providers.every((p) => p.status === "healthy") &&
              observability.queue.failedToday === 0 && (
              <div className="flex items-start gap-2">
                <Badge variant="secondary" className="mt-0.5">通知</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">暂无活跃告警，系统运行正常</p>
                </div>
              </div>
            )}
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
