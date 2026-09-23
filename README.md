# Lumen · 现代 AI 生图 SaaS

一个完整可演示的 AI 生图 SaaS 全栈项目：官网展示 → 注册登录 → 积分生成图片 → 社区分享互动 → Stripe 订阅/充值 → 管理后台与数据监控。

- **线上演示**：<https://ai-image-saas-one.vercel.app>
- **源码仓库**：<https://github.com/CHEN1998-create/ai-image-saas>
- **PRD 文档**：[docs/PRD.md](docs/PRD.md)

## 演示账号

| 角色 | 邮箱 | 密码 |
|---|---|---|
| 普通用户 | `aria@lumen.art` | `password` |
| 管理员 | `admin@lumen.art` | `admin123` |

## 核心页面说明

三入口结构：`/` 官网、`/app` 用户端、`/admin` 管理端（共 24 个页面）。

| 入口 | 页面 | 说明 |
|---|---|---|
| `/` | 官网首页 · 定价 · FAQ | 产品展示，套餐卡片直连 Stripe 结账 |
| `/app` | 登录 · 注册 | HMAC httpOnly cookie 会话 |
| `/app` | 生成工作台 | 异步生图任务：积分预扣 → 队列执行 → 进度条轮询 → 结果入库 |
| `/app` | 我的图库 | 生成历史、收藏、删除 |
| `/app` | 探索社区 | 公开作品流、点赞/评论/转载（仅展示审核通过内容） |
| `/app` | 积分中心 | 余额、每日签到、积分明细流水 |
| `/app` | 套餐与积分 | Stripe 订阅（三档）+ 积分包（三档），webhook 自动到账 |
| `/app` | 作品详情 | 大图、作者、互动数据；已下架内容仅作者可见 |
| `/app` | 支付回调页 | success 验单兜底履约 / cancel 提示 |
| `/admin` | 数据概览 | 用户/任务/收入/作品总览 + Top 用户 |
| `/admin` | 用户管理 | 搜索、封禁/解封、积分调整（含审计记录） |
| `/admin` | 任务管理 | 状态筛选、取消（自动退积分）、失败重试 |
| `/admin` | 内容审核 | 通过/下架作品，下架即时从公开流消失 |
| `/admin` | 套餐 · 订单 | 套餐维护与支付订单流水 |
| `/admin` | 运营 · 指标 | 留存（D1/D7/D30）、积分发行/消耗、7 日趋势 |
| `/admin` | 系统监控 | 数据库/存储/队列实时健康检查 + API 与模型调用日志 |

## 技术栈

- **框架**：Next.js 14（App Router）+ TypeScript（strict）+ Tailwind CSS，无 UI 框架依赖
- **数据库**：Supabase PostgreSQL（`pg` 连接池直连，业务表隔离在 `lumen` schema）
- **对象存储**：Supabase Storage（开发环境经 Cloudflare Worker 中继，上传失败自动回退本地 `public/uploads`）
- **支付**：Stripe Checkout（订阅 + 一次性积分包），webhook 驱动积分到账，success 页验单兜底
- **鉴权**：自实现 HMAC-SHA256 签名 httpOnly cookie，middleware 粗粒度守卫 + server 侧权威校验
- **部署**：Vercel（生图后台任务使用 `@vercel/functions` 的 `waitUntil` 保持执行）

## 本地启动步骤

1. 克隆仓库并安装依赖

```bash
git clone https://github.com/CHEN1998-create/ai-image-saas.git
cd ai-image-saas
npm install
```

2. 复制 `.env.example` 为 `.env.local`，按下方清单填写真实值

3. 初始化数据库（建表 + 演示数据，幂等可重复执行）

```bash
npm run seed
```

4. 启动开发服务器（自动带代理访问 Supabase）

```bash
npm run dev        # http://localhost:3000
npm run dev:direct # 直连备用（网络通畅时）
```

5. （可选）联调支付回调：另开终端启动 Stripe CLI 转发

```bash
stripe listen --api-key <STRIPE_SECRET_KEY> \
  --events checkout.session.completed,invoice.payment_succeeded \
  --forward-to localhost:3000/api/stripe/webhook
```

## 环境变量清单

| 变量 | 说明 |
|---|---|
| `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` | Supabase PostgreSQL 连接（Dashboard → Connect → Session Pooler） |
| `PGSSL` | Supabase 强制 SSL，设 `true` |
| `AUTH_SECRET` | 会话 cookie 的 HMAC 签名密钥（随机长字符串） |
| `NEXT_PUBLIC_SUPABASE_URL` | 本地开发填 Cloudflare Worker 中继地址；生产填 Supabase 直连地址 |
| `SUPABASE_SERVICE_ROLE_KEY` | 对象存储服务端上传用（Dashboard → API） |
| `STRIPE_SECRET_KEY` | Stripe 测试密钥 `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | webhook 签名密钥 `whsec_...`（`stripe listen` 输出或 Dashboard webhook endpoint） |
