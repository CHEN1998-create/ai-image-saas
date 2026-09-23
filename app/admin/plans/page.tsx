import { Plus, Pencil, Crown, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlans } from "@/lib/db";
import { cn, formatNumber } from "@/lib/utils";

export default async function AdminPlansPage() {
  const plans = await getPlans();
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">套餐管理</h1>
          <p className="text-xs text-muted-foreground">
            管理订阅档位、积分配额与定价
          </p>
        </div>
        <Button variant="gradient" size="sm">
          <Plus className="h-4 w-4" />
          新增套餐包
        </Button>
      </header>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p) => (
          <Card
            key={p.code}
            className={cn(
              "p-5 flex flex-col",
              p.highlight && "border-primary"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                {p.highlight && <Crown className="h-4 w-4 text-primary" />}
              </div>
              {p.highlight && <Badge>推荐</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-[10px] text-muted-foreground">月付</p>
                <p className="text-lg font-semibold">
                  ${p.monthlyPriceCents / 100}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">年付</p>
                <p className="text-lg font-semibold">
                  ${p.yearlyPriceCents / 100}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="rounded-md bg-secondary/40 p-2">
                <p className="text-muted-foreground">月积分</p>
                <p className="font-medium">{formatNumber(p.monthlyPoints)}</p>
              </div>
              <div className="rounded-md bg-secondary/40 p-2">
                <p className="text-muted-foreground">图片并发</p>
                <p className="font-medium">{p.imageConcurrency}</p>
              </div>
            </div>

            <ul className="space-y-1.5 mb-4 text-xs text-muted-foreground">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              size="sm"
              variant="outline"
              className="mt-auto"
            >
              <Pencil className="h-3.5 w-3.5" />
              编辑
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
