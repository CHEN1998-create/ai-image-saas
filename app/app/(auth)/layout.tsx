import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative w-full max-w-md">
          <Link
            href="/www"
            className="flex items-center justify-center gap-2 mb-8"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-gradient">
              <Sparkles className="h-5 w-5 text-white" />
            </span>
            <span className="text-xl font-semibold">Lumen</span>
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8">
            {children}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
            登录即表示同意服务条款与隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
