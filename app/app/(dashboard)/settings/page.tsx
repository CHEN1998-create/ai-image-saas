import { Shield, Link2, Crown, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // 由 (dashboard) layout 守卫保证不会到这
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">个人中心</h1>
        <p className="text-xs text-muted-foreground">管理资料、账号与安全</p>
      </header>

      {/* 资料 */}
      <Card className="p-5 mb-4">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary text-xs">
            01
          </span>
          个人资料
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <Avatar src={user.avatar} className="h-16 w-16 ring-2 ring-border" />
          <Button variant="outline" size="sm">
            更换头像
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">昵称</label>
            <Input defaultValue={user.name} className="mt-1" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">邮箱</label>
            <Input defaultValue={user.email} className="mt-1" />
          </div>
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground">简介</label>
          <Textarea
            defaultValue={user.bio}
            className="mt-1 min-h-[60px]"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button size="sm">保存</Button>
        </div>
      </Card>

      {/* 当前套餐 */}
      <Card className="p-5 mb-4">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          <Crown className="h-4 w-4 text-primary" /> 当前套餐
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold capitalize">{user.plan} Plan</p>
            <p className="text-xs text-muted-foreground">
              加入于 {user.joinedAt}
            </p>
          </div>
          <Button variant="outline" size="sm">
            管理套餐
          </Button>
        </div>
      </Card>

      {/* 关联账号 */}
      <Card className="p-5 mb-4">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-primary" /> 关联账号
        </h2>
        <div className="space-y-3">
          {[
            { name: "GitHub", icon: Github, linked: true },
            { name: "Google", icon: Mail, linked: true },
            { name: "Discord", icon: Mail, linked: false }
          ].map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-2">
                <a.icon className="h-4 w-4" />
                <span className="text-sm">{a.name}</span>
              </div>
              {a.linked ? (
                <Badge variant="success">已关联</Badge>
              ) : (
                <Button size="sm" variant="outline">
                  绑定
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 安全 */}
      <Card className="p-5">
        <h2 className="font-medium mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> 安全设置
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm">登录密码</p>
              <p className="text-xs text-muted-foreground">上次更新于 3 个月前</p>
            </div>
            <Button size="sm" variant="outline">
              修改
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="text-sm">两步验证</p>
              <p className="text-xs text-muted-foreground">未启用</p>
            </div>
            <Button size="sm" variant="gradient">
              开启
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
