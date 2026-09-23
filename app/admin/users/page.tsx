"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserCheck, Ban, Coins, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminUser } from "@/lib/db/types";
import { cn, formatNumber, formatDate } from "@/lib/utils";

const statusFilters = ["全部", "active", "banned"] as const;
type StatusFilter = (typeof statusFilters)[number];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("全部");
  const [search, setSearch] = useState("");
  const [query_, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query_) params.set("q", query_);
    const resp = await fetch(`/api/admin/users?${params}`);
    const data = await resp.json();
    if (resp.ok) setUsers(data.users);
    setLoading(false);
  }, [query_]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function patch(userId: string, body: Record<string, unknown>) {
    setBusyId(userId);
    try {
      const resp = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...body })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "操作失败");
      await load();
      showToast("操作成功");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusyId(null);
    }
  }

  // 状态筛选在前端做（搜索走服务端）
  const filtered =
    filter === "全部" ? users : users.filter((u) => u.status === filter);

  const stats = [
    {
      label: "总用户",
      value: users.length,
      icon: Users,
      accent: "text-primary"
    },
    {
      label: "活跃用户",
      value: users.filter((u) => u.status === "active").length,
      icon: UserCheck,
      accent: "text-success"
    },
    {
      label: "封禁用户",
      value: users.filter((u) => u.status === "banned").length,
      icon: Ban,
      accent: "text-destructive"
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">用户管理</h1>
        <p className="text-xs text-muted-foreground">
          管理平台用户的套餐、积分与状态
        </p>
      </header>

      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-secondary px-4 py-2 text-xs border border-border shadow-lg">
          {toast}
        </div>
      )}

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

      {/* 搜索 + 筛选 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <form
          className="relative w-64"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名或邮箱"
            className="h-8 pl-8 text-xs"
          />
        </form>
        <div className="flex items-center gap-1">
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
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground text-xs">
                    加载中…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground text-xs">
                    没有匹配的用户
                  </td>
                </tr>
              )}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        disabled={busyId === u.id}
                        title="调整积分（点击 +50）"
                        onClick={() => patch(u.id, { action: "points", delta: 50, reason: "管理员手动赠送" })}
                      >
                        <Coins className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        disabled={busyId === u.id}
                        onClick={() =>
                          patch(u.id, {
                            action: u.status === "banned" ? "unban" : "ban"
                          })
                        }
                      >
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

      <p className="mt-3 text-[10px] text-muted-foreground">
        金币图标：为该用户 +50 积分（演示快捷操作）；后端支持任意整数增减，可按需扩展弹窗。
      </p>
    </div>
  );
}
