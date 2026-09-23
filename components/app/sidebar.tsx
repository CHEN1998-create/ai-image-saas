"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Wand2,
  Images,
  Compass,
  CreditCard,
  Coins,
  Settings,
  Shield
} from "lucide-react";
import type { AuthUser } from "@/lib/auth";
import { cn, formatNumber } from "@/lib/utils";

const nav = [
  { href: "/app/generate", label: "生成", icon: Wand2 },
  { href: "/app/gallery", label: "图库", icon: Images },
  { href: "/app/explore", label: "社区", icon: Compass },
  { href: "/app/billing", label: "套餐", icon: CreditCard },
  { href: "/app/points", label: "积分", icon: Coins },
  { href: "/app/settings", label: "个人中心", icon: Settings }
];

export function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card/30">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Link href="/www" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold">Lumen</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
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

      <div className="p-3 border-t border-border">
        {user.role === "admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-2 py-2 mb-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Shield className="h-4 w-4" />
            进入后台
          </Link>
        )}
        <Link
          href="/app/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-secondary transition-colors"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.avatar}
            alt=""
            className="h-8 w-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(user.points)} 积分
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
