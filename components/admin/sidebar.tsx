"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Users,
  ListChecks,
  Image,
  Package,
  CreditCard,
  SlidersHorizontal,
  BarChart3,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "后台首页", icon: LayoutDashboard },
  { href: "/admin/users", label: "用户管理", icon: Users },
  { href: "/admin/tasks", label: "任务管理", icon: ListChecks },
  { href: "/admin/posts", label: "内容管理", icon: Image },
  { href: "/admin/plans", label: "套餐管理", icon: Package },
  { href: "/admin/billing", label: "支付订单", icon: CreditCard },
  { href: "/admin/operations", label: "运营配置", icon: SlidersHorizontal },
  { href: "/admin/analytics", label: "SaaS 指标", icon: BarChart3 },
  { href: "/admin/observability", label: "系统监控", icon: Activity }
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card/30">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg font-semibold">Lumen</span>
            <span className="ml-1 inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 移动端固定顶栏 */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 flex items-center justify-between px-4 border-b border-border bg-card/80 backdrop-blur">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <span className="text-base font-semibold">Lumen</span>
          <span className="ml-1 inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Admin
          </span>
        </Link>
        <span className="text-xs text-muted-foreground">管理台</span>
      </div>
    </>
  );
}
