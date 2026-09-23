"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Github, Mail, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const benefits = ["注册即送 2000 积分", "无需信用卡", "免费体验基础生图"];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agree) {
      setError("请先同意服务条款");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "注册失败");
      return;
    }
    router.push("/app/generate");
    router.refresh();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">创建账号</h1>
        <p className="text-sm text-muted-foreground mt-1">
          3 分钟生成你的第一张图
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
          type="text"
          placeholder="昵称"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="email"
          placeholder="邮箱地址"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="设置密码"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="rounded border-border mt-0.5"
            required
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <span>
            我已阅读并同意
            <Link href="/www/faq" className="text-primary mx-1">
              服务条款
            </Link>
            与隐私政策
          </span>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button
          type="submit"
          variant="gradient"
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? "注册中..." : "注册并开始"}
        </Button>
      </form>

      <ul className="mt-6 space-y-1.5">
        {benefits.map((b) => (
          <li
            key={b}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Check className="h-3.5 w-3.5 text-success" />
            {b}
          </li>
        ))}
      </ul>

      <p className="text-center text-sm text-muted-foreground mt-6">
        已有账号？
        <Link href="/app/login" className="text-primary ml-1">
          登录
        </Link>
      </p>
    </div>
  );
}
