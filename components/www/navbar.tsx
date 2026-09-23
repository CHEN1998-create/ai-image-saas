"use client";

import Link from "next/link";
import { useState } from "react";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/www", label: "首页" },
  { href: "/www/pricing", label: "定价" },
  { href: "/www/faq", label: "FAQ" },
  { href: "/app/explore", label: "社区" }
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/www" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Lumen</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/app/login">
            <Button variant="ghost" size="sm">
              登录
            </Button>
          </Link>
          <Link href="/app/register">
            <Button variant="gradient" size="sm">
              免费开始
            </Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-md"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 mt-2">
              <Link href="/app/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  登录
                </Button>
              </Link>
              <Link href="/app/register" className="flex-1">
                <Button variant="gradient" size="sm" className="w-full">
                  免费开始
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
