// Cloudflare Worker — Supabase 中继
// 部署后获得 *.workers.dev URL，国内可直连，转发到 Supabase Storage。
//
// 部署方式（二选一）：
//
// 方式 A：网页部署（推荐，无需装工具）
//   1. 打开 https://dash.cloudflare.com → 注册/登录（免费）
//   2. 左侧 Workers & Pages → Create → Create Worker
//   3. 起名：supabase-relay → 部署
//   4. 编辑代码：删掉默认代码，粘贴本文件全部内容，保存并部署
//   5. 复制 Worker URL（形如 https://supabase-relay.xxx.workers.dev）
//   6. 把 URL 填到 .env.local 的 NEXT_PUBLIC_SUPABASE_URL
//
// 方式 B：命令行部署（已装 Node）
//   npx wrangler deploy supabase-relay.js --name supabase-relay --compatibility-date 2024-01-01

const SUPABASE_HOST = "https://nhilkwbhhoysicglcxyi.supabase.co";

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const target = SUPABASE_HOST + url.pathname + url.search;

    // 透传请求到 Supabase（保留 method/headers/body）
    const resp = await fetch(target, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "follow",
    });

    // 透传响应（含 CORS 头，让前端也能直接访问）
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD");
    headers.set("Access-Control-Allow-Headers", "*");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    return new Response(resp.body, { status: resp.status, headers });
  },
};
