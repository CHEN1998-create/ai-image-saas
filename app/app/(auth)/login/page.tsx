"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "登录失败");
      return;
    }
    router.push("/app/generate");
    router.refresh();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">欢迎回来</h1>
        <p className="text-sm text-muted-foreground mt-1">
          登录你的 Lumen 账号
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button type="button" variant="outline" disabled title="暂未接入">
          <Github className="h-4 w-4" /> GitHub
        </Button>
        <Button type="button" variant="outline" disabled title="暂未接入">
          <Mail className="h-4 w-4" /> Google
        </Button>
      </div>

      <div className="relative mb-6 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-border" />
        </div>
        <span className="relative bg-card px-3 text-xs text-muted-foreground">
          或
        </span>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <Input
          type="email"
          placeholder="邮箱地址"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="密码"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? "登录中..." : "登录"}
        </Button>
      </form>

      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="rounded border-border" /> 记住我
        </label>
        <Link href="/app/login" className="hover:text-foreground">
          忘记密码？
        </Link>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        没有账号？
        <Link href="/app/register" className="text-primary ml-1">
          注册
        </Link>
      </p>

      <p className="text-center text-[11px] text-muted-foreground/70 mt-4">
        演示账号：aria@lumen.art / password · admin@lumen.art / admin123
      </p>
    </div>
  );
}
