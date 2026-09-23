"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wand2, Images, Compass, Coins, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/app/generate", label: "生成", icon: Wand2 },
  { href: "/app/gallery", label: "图库", icon: Images },
  { href: "/app/explore", label: "社区", icon: Compass },
  { href: "/app/points", label: "积分", icon: Coins },
  { href: "/app/settings", label: "我的", icon: Settings }
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-border">
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
