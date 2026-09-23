import Link from "next/link";
import { ArrowRight, Wand2, Images, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { plans, posts } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export default function WwwHome() {
  const showcase = posts.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-brand-gradient-soft" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[600px] rounded-full bg-primary/20 blur-3xl" />
        <div className="container relative py-24 md:py-32 text-center">
          <Badge variant="default" className="mb-5">
            <Sparkles className="h-3 w-3 mr-1" /> v0.2 · 现代 AI 生图 SaaS
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            把想法变成<span className="text-gradient">画面</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            一句话生成专业级图像。面向创作者与独立开发者，从 Prompt
            到作品分享，一套闭环。
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/app/register">
              <Button variant="gradient" size="lg">
                免费开始 <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/app/generate">
              <Button variant="outline" size="lg">
                进入工作台
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            注册即送 2000 积分，无需信用卡
          </p>
        </div>
      </section>

      {/* 作品展示 */}
      <section className="container py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">社区作品</h2>
            <p className="text-muted-foreground mt-1">来自全球创作者的灵感</p>
          </div>
          <Link href="/app/explore">
            <Button variant="ghost" size="sm">
              查看全部 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {showcase.map((p) => (
            <Link
              key={p.id}
              href={`/app/posts/${p.id}`}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.imageUrl}
                alt={p.prompt}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <p className="text-xs text-white/90 line-clamp-2">{p.prompt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 能力介绍 */}
      <section className="border-y border-border bg-card/30">
        <div className="container py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">为创作者而生</h2>
            <p className="text-muted-foreground mt-1">从生成到分享，每一步都顺滑</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Wand2,
                title: "极速生成",
                desc: "多模型适配层，Prompt 即出图，支持参数、比例、批量"
              },
              {
                icon: Images,
                title: "历史与图库",
                desc: "所有作品自动归档，按模型/状态筛选，一键复用 Prompt"
              },
              {
                icon: Share2,
                title: "社区互动",
                desc: "发布作品、点赞、评论、转发，获得积分与反馈"
              }
            ].map((f) => (
              <Card key={f.title} className="p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary mb-4">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 套餐预览 */}
      <section className="container py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight">简单透明的定价</h2>
          <p className="text-muted-foreground mt-1">按月或按年，积分随套餐发放</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          {plans.map((p) => (
            <Card key={p.code} className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{p.name}</h3>
                {p.highlight && <Badge>推荐</Badge>}
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold">
                  ${p.monthlyPriceCents / 100}
                </span>
                <span className="text-sm text-muted-foreground">/月</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {formatNumber(p.monthlyPoints)} 积分/月
              </p>
              <Link href="/www/pricing" className="mt-auto">
                <Button
                  variant={p.highlight ? "gradient" : "outline"}
                  size="sm"
                  className="w-full"
                >
                  查看
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-card/30">
        <div className="container py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            现在就开始创作
          </h2>
          <p className="text-muted-foreground mt-2">
            3 分钟完成注册，生成你的第一张图
          </p>
          <Link href="/app/register" className="inline-block mt-6">
            <Button variant="gradient" size="lg">
              免费开始 <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
