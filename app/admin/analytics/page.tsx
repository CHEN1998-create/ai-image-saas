import { UserPlus, Activity, CreditCard, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getAnalytics } from "@/lib/db";
import { cn, formatNumber } from "@/lib/utils";

export default async function AdminAnalyticsPage() {
  const analytics = getAnalytics();
  const overview = [
  {
    label: "新增用户",
    value: formatNumber(analytics.overview.newUsers),
    icon: UserPlus,
    accent: "text-primary"
  },
  {
    label: "DAU",
    value: formatNumber(analytics.overview.dau),
    icon: Activity,
    accent: "text-accent"
  },
  {
    label: "付费转化",
    value: `${analytics.overview.paidConversion}%`,
    icon: CreditCard,
    accent: "text-success"
  },
  {
    label: "MRR",
    value: `$${formatNumber(analytics.overview.mrr)}`,
    icon: DollarSign,
    accent: "text-warning"
  }
];

const maxTrend = Math.max(...analytics.trend);
const maxPlan = Math.max(...analytics.planDistribution.map((p) => p.count));
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">SaaS 指标</h1>
        <p className="text-xs text-muted-foreground">
          平台增长、留存与商业化关键指标
        </p>
      </header>

      {/* 概览 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overview.map((s) => (
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
        {/* 留存 */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4">留存率</h3>
          <div className="space-y-4">
            {[
              { label: "次日留存", value: analytics.retention.d1 },
              { label: "7 日留存", value: analytics.retention.d7 },
              { label: "30 日留存", value: analytics.retention.d30 }
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {r.label}
                  </span>
                  <span className="text-sm font-semibold">{r.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-brand-gradient"
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 套餐分布 */}
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4">套餐分布</h3>
          <div className="space-y-3">
            {analytics.planDistribution.map((p) => (
              <div key={p.plan} className="flex items-center gap-3">
                <span className="text-xs w-20 text-muted-foreground">
                  {p.plan}
                </span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-2 rounded-full", p.color)}
                    style={{ width: `${(p.count / maxPlan) * 100}%` }}
                  />
                </div>
                <span className="text-xs w-16 text-right">
                  {formatNumber(p.count)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* 社区互动 */}
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-4">社区互动</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">分享作品</span>
              <span className="text-sm font-semibold">
                {formatNumber(analytics.social.sharedPosts)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">点赞率</span>
              <span className="text-sm font-semibold text-success">
                {analytics.social.likeRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">评论率</span>
              <span className="text-sm font-semibold text-primary">
                {analytics.social.commentRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">转发率</span>
              <span className="text-sm font-semibold text-warning">
                {analytics.social.repostRate}%
              </span>
            </div>
          </div>
        </Card>

        {/* 趋势 */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">7 天趋势</h3>
            <span className="text-xs text-muted-foreground">新增用户</span>
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
    </div>
  );
}
