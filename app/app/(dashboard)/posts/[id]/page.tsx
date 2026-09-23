import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Share2,
  Copy,
  Wand2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getCurrentUser } from "@/lib/auth";
import { getPost, getPosts, getComments } from "@/lib/db";
import { formatNumber, timeAgo } from "@/lib/utils";

export default async function PostDetailPage({
  params
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  const post = (await getPost(params.id)) ?? (await getPosts())[0];
  const sampleComments = post ? await getComments(post.id) : [];

  if (!post || !user) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link
        href="/app/explore"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> 返回社区
      </Link>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 大图 */}
        <Card className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.prompt}
            className="w-full object-cover"
          />
        </Card>

        {/* 详情 */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={post.author.avatar} className="h-10 w-10" />
            <div>
              <p className="font-medium">{post.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {timeAgo(post.createdAt)}
              </p>
            </div>
            <Button size="sm" variant="outline" className="ml-auto">
              关注
            </Button>
          </div>

          <p className="text-sm mb-4">{post.caption}</p>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.map((t) => (
              <Badge key={t} variant="secondary">
                #{t}
              </Badge>
            ))}
          </div>

          {/* Prompt */}
          <Card className="p-4 mb-4 bg-card/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                PROMPT
              </span>
              <Button size="iconSm" variant="ghost">
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-sm font-mono leading-relaxed">{post.prompt}</p>
            <Separator className="my-3" />
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span>
                模型: <span className="text-foreground">{post.model}</span>
              </span>
              <span>
                比例: <span className="text-foreground">{post.ratio}</span>
              </span>
            </div>
          </Card>

          <div className="flex gap-2 mb-6">
            <Button variant="gradient" size="sm">
              <Wand2 className="h-4 w-4" /> 再次生成
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4" /> 点赞
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" /> 分享
            </Button>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4 text-accent fill-accent" />{" "}
              {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {post.comments}
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="h-4 w-4" /> {post.reposts}
            </span>
          </div>

          <Separator className="mb-4" />

          <h3 className="font-medium mb-3">评论</h3>
          <div className="flex gap-2 mb-4">
            <Avatar src={user.avatar} className="h-8 w-8" />
            <div className="flex-1 flex gap-2">
              <Textarea
                placeholder="写下你的评论..."
                className="min-h-[40px] text-sm"
              />
              <Button size="sm">发送</Button>
            </div>
          </div>
          <div className="space-y-4">
            {sampleComments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <Avatar src={c.avatar} className="h-8 w-8" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{c.author}</span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-0.5">{c.content}</p>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground mt-1 hover:text-foreground">
                    <Heart className="h-3 w-3" /> {c.likes}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
