"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Result = {
  service: string;
  status: "healthy" | "degraded" | "down";
  detail: { detail?: string };
};

const iconFor = (status: Result["status"]) => {
  if (status === "healthy") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "degraded") return <AlertTriangle className="h-4 w-4 text-warning" />;
  return <XCircle className="h-4 w-4 text-destructive" />;
};

export function RunHealthCheck() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string>("");

  async function run() {
    setLoading(true);
    setResults(null);
    try {
      const resp = await fetch("/api/admin/health-check", { method: "POST" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "检测失败");
      setResults(data.results);
      setCheckedAt(data.checkedAt);
    } catch (e) {
      setResults([
        { service: "检测失败", status: "down", detail: { detail: e instanceof Error ? e.message : "" } }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4">
      <Button size="sm" onClick={run} disabled={loading}>
        <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
        {loading ? "检测中…" : "运行实时检测"}
      </Button>

      {results && (
        <div className="mt-3 grid sm:grid-cols-3 gap-3">
          {results.map((r) => (
            <div
              key={r.service}
              className="rounded-md border border-border bg-card p-3 flex items-start gap-2"
            >
              {iconFor(r.status)}
              <div className="min-w-0">
                <p className="text-xs font-medium">{r.service}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {r.detail?.detail ?? ""}
                </p>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground sm:col-span-3">
            检测时间 {new Date(checkedAt).toLocaleString("zh-CN")}（结果已存入健康检查记录）
          </p>
        </div>
      )}
    </div>
  );
}
