import { Save, CalendarClock, Share2, Megaphone, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function Toggle({
  defaultChecked = false,
  label,
  desc
}: {
  defaultChecked?: boolean;
  label: string;
  desc?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
    </label>
  );
}

export default function AdminOperationsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-lg font-semibold">运营配置</h1>
        <p className="text-xs text-muted-foreground">
          调整积分规则、奖励策略与风控开关
        </p>
      </header>

      <form action="#" className="space-y-4">
        {/* 签到积分规则 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">签到积分规则</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground">
                每日签到积分
              </label>
              <Input
                type="number"
                defaultValue={20}
                min={0}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                连续签到 7 天额外奖励
              </label>
              <Input
                type="number"
                defaultValue={100}
                min={0}
                className="mt-1"
              />
            </div>
          </div>
          <div className="mb-4">
            <Toggle
              defaultChecked
              label="连续 7 天翻倍"
              desc="连续签到满 7 天后，当日积分翻倍发放"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="gradient">
              <Save className="h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </Card>

        {/* 分享/互动奖励 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">分享与互动奖励</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs text-muted-foreground">分享作品</label>
              <Input type="number" defaultValue={30} min={0} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">被点赞</label>
              <Input type="number" defaultValue={5} min={0} className="mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">被评论</label>
              <Input type="number" defaultValue={8} min={0} className="mt-1" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="gradient">
              <Save className="h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </Card>

        {/* 活动公告 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Megaphone className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">活动公告</h3>
          </div>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs text-muted-foreground">标题</label>
              <Input
                defaultValue="夏日创作大赛开启"
                className="mt-1"
                placeholder="公告标题"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">正文</label>
              <Textarea
                rows={4}
                defaultValue="分享你的夏日主题作品，赢取 5000 积分奖励。"
                className="mt-1"
                placeholder="公告正文"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="gradient">
              <Save className="h-3.5 w-3.5" />
              发布
            </Button>
          </div>
        </Card>

        {/* 风控开关 */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">风控开关</h3>
          </div>
          <div className="space-y-3 mb-4">
            <Toggle
              defaultChecked
              label="公开作品自动审核"
              desc="发布到社区的作品需先经过自动审核"
            />
            <Toggle
              defaultChecked
              label="评论限流"
              desc="同一用户 60 秒内最多发表 3 条评论"
            />
            <Toggle
              defaultChecked={false}
              label="邀请奖励启用"
              desc="开启后新用户通过邀请码注册可获积分奖励"
            />
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="gradient">
              <Save className="h-3.5 w-3.5" />
              保存
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
