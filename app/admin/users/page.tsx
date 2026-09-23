"use client";

import { useState } from "react";
import { Users, UserCheck, Ban, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminUsers } from "@/lib/mock-data";
import { cn, formatNumber, formatDate } from "@/lib/utils";

const statusFilters = ["全部", "active", "banned"] as const;
type StatusFilter = (typeof statusFilters)[number];

const stats = [
  {
    label: "总用户",
    value: adminUsers.length,
    icon: Users,
    accent: "text-primary"
  },
  {
    label: "活跃用户",
    value: adminUsers.filter((u) => u.status === "active").length,
    icon: UserCheck,
    accent: "text-success"
  },
  {
    label: "封禁用户",
    value: adminUsers.filter((u) => u.status === "banned").length,
    icon: Ban,
    accent: "text-destructive"
  }
];

export default function AdminUsersPage() {
  const [filter, setFilter] = useState<StatusFilter>("全部");

  const filtered =
    filter === "全部"
      ? adminUsers
      : adminUsers.filter((u) => u.status === filter);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">用户管理</h1>
        <p className="text-xs text-muted-foreground">
          管理平台用户的套餐、积分与状态
        </p>
      </header>

      {/* 统计小卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">
                {s.label}
              </span>
              <s.icon className={cn("h-4 w-4", s.accent)} />
            </div>
            <p className="text-xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-2 mb-4">
        {statusFilters.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "secondary" : "ghost"}
            onClick={() => setFilter(f)}
          >
            {f === "active" ? "活跃" : f === "banned" ? "封禁" : f}
          </Button>
        ))}
      </div>

      {/* 表格 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-5 py-3">用户</th>
                <th className="text-left font-medium px-5 py-3">邮箱</th>
                <th className="text-left font-medium px-5 py-3">套餐</th>
                <th className="text-right font-medium px-5 py-3">积分</th>
                <th className="text-left font-medium px-5 py-3">状态</th>
                <th className="text-right font-medium px-5 py-3">生成数</th>
                <th className="text-left font-medium px-5 py-3">注册时间</th>
                <th className="text-right font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
                      />
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-5 py-3 capitalize text-muted-foreground">
                    {u.plan}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {formatNumber(u.points)}
                  </td>
                  <td className="px-5 py-3">
                    {u.status === "banned" ? (
                      <Badge variant="destructive">封禁</Badge>
                    ) : (
                      <Badge variant="success">活跃</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">{u.generated}</td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {formatDate(u.joinedAt)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <Coins className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        {u.status === "banned" ? "解封" : "封禁"}
                      </Button>
                    </div>
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
