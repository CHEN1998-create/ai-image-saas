import Link from "next/link";
import { Sparkles } from "lucide-react";

const columns = [
  {
    title: "产品",
    links: [
      { label: "生成工作台", href: "/app/generate" },
      { label: "图库", href: "/app/gallery" },
      { label: "社区", href: "/app/explore" },
      { label: "定价", href: "/www/pricing" }
    ]
  },
  {
    title: "资源",
    links: [
      { label: "FAQ", href: "/www/faq" },
      { label: "文档", href: "#" },
      { label: "系统状态", href: "/admin/observability" },
      { label: "更新日志", href: "#" }
    ]
  },
  {
    title: "公司",
    links: [
      { label: "关于", href: "#" },
      { label: "博客", href: "#" },
      { label: "联系我们", href: "#" },
      { label: "后台入口", href: "/admin" }
    ]
  }
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/www" className="flex items-center gap-2 mb-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-semibold">Lumen</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              面向创作者与独立开发者的现代 AI 生图平台。
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © 2026 Lumen. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            www.xxx.com · app.xxx.com · admin.xxx.com
          </p>
        </div>
      </div>
    </footer>
  );
}
