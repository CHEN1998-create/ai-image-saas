import {
  Users,
  ListChecks,
  DollarSign,
  Image as ImageIcon,
  AlertTriangle,
  Crown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAdminOverview, getAnalyticsData } from "@/lib/db";
import { cn, formatNumber, formatDate } from "@/lib/utils";

export default async function AdminHomePage() {
  const adminOverview = await getAdminOverview();
  const analytics = await getAnalyticsData();

  const stats = [
  {
    label: "总用户",
    value: formatNumber(adminOverview.totalUsers),
    icon: Users,
    accent: "text-primary"
  },
  {
    label: "总任务",
    value: formatNumber(adminOverview.totalTasks),
    icon: ListChecks,
    accent: "text-accent"
  },
  {
    label: "30 天收入",
    value: `$${formatNumber(adminOverview.revenue30d)}`,
    icon: DollarSign,
    accent: "text-success"
  },
  {
    label: "社区作品",
    value: formatNumber(adminOverview.sharedPosts),
    icon: ImageIcon,
    accent: "text-warning"
  }
];

const maxTrend = Math.max(...analytics.trend, 1);
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">后台首页</h1>
        <p className="text-xs text-muted-foreground">
          平台核心指标与运营概览
        </p>
      </header>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* 异常任务提醒 */}
        <Card className="p-5 border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="font-semibold text-sm">异常任务提醒</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            近 24 小时失败任务数
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-destructive">
              {adminOverview.failedTasks24h}
            </span>
            <Badge variant="destructive">需关注</Badge>
          </div>
          <p className="text-xs text-warning mt-2">
            建议前往任务管理页处理重试
          </p>
        </Card>

        {/* 7 天趋势 */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">7 天趋势</h3>
            <span className="text-xs text-muted-foreground">日活</span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {analytics.trend.map((v, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="w-full flex items-end h-full">
                  <div
                    className="w-full bg-primary rounded-t-md"
                    style={{
                      height: `${(v / maxTrend) * 100}%`,
                      minHeight: "4px"
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  D{i + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 热门用户 */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold text-sm">热门用户</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">用户</th>
                <th className="text-left font-medium px-5 py-3">套餐</th>
                <th className="text-right font-medium px-5 py-3">积分</th>
                <th className="text-right font-medium px-5 py-3">生成数</th>
                <th className="text-left font-medium px-5 py-3">注册时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adminOverview.topUsers.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
                      />
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{u.name}</span>
                        {u.plan === "mega" || u.plan === "pro" ? (
                          <Crown className="h-3 w-3 text-warning" />
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">
                    {u.plan}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatNumber(u.points)}
                  </td>
                  <td className="px-5 py-3 text-right">{u.generated}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(u.joinedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
