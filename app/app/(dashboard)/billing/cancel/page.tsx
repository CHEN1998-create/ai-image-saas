import Link from "next/link";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CancelPage() {
  return (
    <div className="p-6 max-w-md mx-auto mt-10">
      <Card className="p-8 text-center">
        <XCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-semibold">支付已取消</p>
        <p className="text-sm text-muted-foreground mt-1">
          你没有完成支付，可随时重新选择套餐或积分包
        </p>
        <Link href="/app/billing" className="inline-block mt-6">
          <Button variant="outline">返回套餐</Button>
        </Link>
      </Card>
    </div>
  );
}
