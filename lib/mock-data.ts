// ============================================================
// 共享假数据 — 仅供前端骨架展示使用，不接真实接口
// 图片用 picsum.photos 占位，稳定可复现
// ============================================================

const img = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/lumen-${seed}/${w}/${h}`;

// ---------- 套餐 ----------
export type Plan = {
  code: string;
  name: string;
  tagline: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  monthlyPoints: number;
  imageConcurrency: number;
  videoConcurrency: number;
  features: string[];
  highlight?: boolean;
};

export const plans: Plan[] = [
  {
    code: "basic",
    name: "Basic",
    tagline: "入门体验，适合尝鲜",
    monthlyPriceCents: 1000,
    yearlyPriceCents: 9600,
    monthlyPoints: 2000,
    imageConcurrency: 3,
    videoConcurrency: 1,
    features: ["基础生图", "可补充购买积分", "社区浏览与互动", "标准速度队列"]
  },
  {
    code: "standard",
    name: "Standard",
    tagline: "创作者的主力档位",
    monthlyPriceCents: 3000,
    yearlyPriceCents: 28800,
    monthlyPoints: 8000,
    imageConcurrency: 3,
    videoConcurrency: 3,
    features: ["支持高清视频", "无限慢速图像生成", "优先队列", "商用授权"],
    highlight: true
  },
  {
    code: "pro",
    name: "Pro",
    tagline: "高频创作者之选",
    monthlyPriceCents: 6000,
    yearlyPriceCents: 57600,
    monthlyPoints: 18000,
    imageConcurrency: 12,
    videoConcurrency: 6,
    features: ["隐身生成", "更高并发", "作品私密分享", "高级模型优先"]
  },
  {
    code: "mega",
    name: "Mega",
    tagline: "工作室级吞吐",
    monthlyPriceCents: 12000,
    yearlyPriceCents: 115200,
    monthlyPoints: 40000,
    imageConcurrency: 12,
    videoConcurrency: 12,
    features: ["更高上限", "批量生成 API", "团队协作预留", "专属模型通道"]
  }
];

// ---------- FAQ ----------
export const faqs: { q: string; a: string }[] = [
  {
    q: "我买了套餐但没生效怎么办？",
    a: "支付成功后积分会在数秒内到账。若长时间未到账，可在「积分页」刷新，或联系支持附带订单号。"
  },
  {
    q: "月付和年付有什么差别？",
    a: "年付相比月付默认优惠 20%，一次性付费后按月发放积分，到期后自动续费（可随时取消）。"
  },
  {
    q: "积分用完了怎么办？",
    a: "可在套餐页购买积分包 top-up，或升级到更高档位套餐。套餐内积分每月续发。"
  },
  {
    q: "积分会不会过期？",
    a: "套餐内每月发放的积分在当月周期内有效；额外购买的积分包自购买起 12 个月有效。"
  },
  {
    q: "账号能不能绑定多个登录方式？",
    a: "可以。在「个人中心 → 关联账号」中绑定邮箱、Google、GitHub 等多种登录方式。"
  },
  {
    q: "哪些内容支持公开分享？",
    a: "你在工作台生成的图片可发布到社区广场，发布时支持附上 Prompt、参数与文案。"
  }
];

// ---------- 当前用户 ----------
export const currentUser = {
  id: "u_8f3a",
  name: "Aria Chen",
  email: "aria@lumen.art",
  avatar: img("avatar", 200, 200),
  plan: "standard",
  points: 6420,
  totalGenerated: 128,
  joinedAt: "2026-04-12",
  bio: "Visual explorer · neon & soft light",
  links: ["aria.art", "@aria_lumen"]
};

// ---------- 图库 ----------
export const galleryImages = Array.from({ length: 12 }).map((_, i) => ({
  id: `g_${i + 1}`,
  url: img(`gal-${i + 1}`, 600, 600),
  prompt:
    [
      "a cinematic futuristic city at sunset, ultra detailed",
      "soft portrait of a girl with neon hair, film grain",
      "abstract liquid metal shapes, octane render",
      "misty mountain temple at dawn, studio ghibli style",
      "cyberpunk alley with rain reflections, 8k",
      "minimal product shot of a glass perfume bottle",
      "dreamy cloudscape with floating islands",
      "retro anime poster, bold typography, 80s",
      "macro shot of a dewdrop on a leaf, hyperreal",
      "futuristic vehicle concept, side view, clean bg",
      "fantasy castle on a cliff, dramatic lighting",
      "cozy reading nook by the window, warm light"
    ][i],
  model: ["flux-dev", "flux-pro", "sd3.5", "lumina-xl"][i % 4],
  ratio: ["1:1", "16:9", "3:4", "4:3"][i % 4],
  favorite: i % 5 === 0,
  createdAt: new Date(Date.now() - i * 86400000 * 1.5).toISOString()
}));

// ---------- 生图任务历史 ----------
export type TaskStatus = "queued" | "running" | "success" | "failed";
export const generationTasks: {
  id: string;
  prompt: string;
  model: string;
  ratio: string;
  count: number;
  status: TaskStatus;
  pointsCost: number;
  createdAt: string;
  error?: string;
}[] = [
  {
    id: "t_201",
    prompt: "a cinematic futuristic city at sunset, ultra detailed",
    model: "flux-dev",
    ratio: "16:9",
    count: 4,
    status: "success",
    pointsCost: 80,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "t_200",
    prompt: "soft portrait of a girl with neon hair, film grain",
    model: "flux-pro",
    ratio: "3:4",
    count: 2,
    status: "success",
    pointsCost: 60,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "t_199",
    prompt: "abstract liquid metal shapes, octane render",
    model: "sd3.5",
    ratio: "1:1",
    count: 4,
    status: "running",
    pointsCost: 80,
    createdAt: new Date(Date.now() - 180000).toISOString()
  },
  {
    id: "t_198",
    prompt: "cyberpunk alley with rain reflections, 8k",
    model: "flux-dev",
    ratio: "16:9",
    count: 4,
    status: "failed",
    pointsCost: 0,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    error: "provider timeout after 60s"
  },
  {
    id: "t_197",
    prompt: "minimal product shot of a glass perfume bottle",
    model: "lumina-xl",
    ratio: "1:1",
    count: 2,
    status: "success",
    pointsCost: 40,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "t_196",
    prompt: "dreamy cloudscape with floating islands",
    model: "flux-pro",
    ratio: "16:9",
    count: 4,
    status: "success",
    pointsCost: 80,
    createdAt: new Date(Date.now() - 259200000).toISOString()
  }
];

// ---------- 积分记录 ----------
export const pointRecords: {
  id: string;
  type: "earn" | "spend";
  delta: number;
  source: string;
  createdAt: string;
}[] = [
  { id: "p_01", type: "spend", delta: -80, source: "生成任务 t_201", createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: "p_02", type: "earn", delta: 20, source: "每日签到", createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: "p_03", type: "spend", delta: -60, source: "生成任务 t_200", createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: "p_04", type: "earn", delta: 50, source: "作品被点赞奖励", createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: "p_05", type: "earn", delta: 8000, source: "Standard 套餐月发", createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: "p_06", type: "spend", delta: -40, source: "生成任务 t_197", createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: "p_07", type: "earn", delta: 30, source: "分享作品奖励", createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: "p_08", type: "spend", delta: -80, source: "生成任务 t_196", createdAt: new Date(Date.now() - 518400000).toISOString() }
];

// ---------- 社区作品 ----------
export type Post = {
  id: string;
  imageUrl: string;
  prompt: string;
  model: string;
  ratio: string;
  author: { name: string; avatar: string };
  caption: string;
  likes: number;
  comments: number;
  reposts: number;
  liked?: boolean;
  createdAt: string;
  tags: string[];
};

export const posts: Post[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `post_${i + 1}`,
  imageUrl: img(`exp-${i + 1}`, 800, 800),
  prompt:
    [
      "a cinematic futuristic city at sunset, ultra detailed, volumetric light",
      "soft portrait of a girl with neon hair, film grain, 50mm",
      "abstract liquid metal shapes, octane render, iridescent",
      "misty mountain temple at dawn, studio ghibli style",
      "cyberpunk alley with rain reflections, 8k, moody",
      "minimal product shot of a glass perfume bottle, soft shadow",
      "dreamy cloudscape with floating islands, pastel sky",
      "retro anime poster, bold typography, 80s sunset",
      "macro shot of a dewdrop on a leaf, hyperreal",
      "futuristic vehicle concept, side view, clean bg",
      "fantasy castle on a cliff, dramatic lighting, matte painting",
      "cozy reading nook by the window, warm light, lofi"
    ][i],
  model: ["flux-dev", "flux-pro", "sd3.5", "lumina-xl"][i % 4],
  ratio: ["1:1", "16:9", "3:4", "4:3"][i % 4],
  author: {
    name: ["Aria Chen", "Kaito", "Luna", "Mira", "Noah", "Ivy"][i % 6],
    avatar: img(`av-${i}`, 100, 100)
  },
  caption: [
    "试了新参数，光影终于对了 ✨",
    "霓虹感拿捏了",
    "金属流体的质感太上头",
    "清晨的氛围",
    "雨夜赛博",
    "极简产品图",
    "漂浮岛屿系列 03",
    "复古海报练习",
    "微距世界",
    "概念载具 Day 12",
    "悬崖城堡",
    "阅读角的小确幸"
  ][i],
  likes: 120 + i * 37,
  comments: 8 + i * 3,
  reposts: 5 + i * 2,
  liked: i % 3 === 0,
  createdAt: new Date(Date.now() - i * 3600000 * 5).toISOString(),
  tags: [["cinematic"], ["portrait", "neon"], ["3d", "abstract"], ["anime"], ["cyberpunk"], ["product"], ["landscape"], ["retro"], ["macro"], ["concept"], ["fantasy"], ["lofi"]][i]
}));

// 社区评论
export const sampleComments = [
  { id: "c1", author: "Kaito", avatar: img("c1", 80, 80), content: "光影太绝了，求参数 👏", createdAt: new Date(Date.now() - 1800000).toISOString(), likes: 12 },
  { id: "c2", author: "Luna", avatar: img("c2", 80, 80), content: "这个构图可以直接当海报了", createdAt: new Date(Date.now() - 3600000).toISOString(), likes: 5 },
  { id: "c3", author: "Mira", avatar: img("c3", 80, 80), content: "prompt 友情求一下 🙏", createdAt: new Date(Date.now() - 7200000).toISOString(), likes: 3 }
];

// ---------- 生图模型选项 ----------
export const models = [
  { code: "flux-dev", name: "Flux Dev", desc: "速度快，性价比高", pointsPerImage: 10 },
  { code: "flux-pro", name: "Flux Pro", desc: "细节与构图更稳", pointsPerImage: 15 },
  { code: "sd3.5", name: "SD 3.5", desc: "风格化强，适合艺术", pointsPerImage: 12 },
  { code: "lumina-xl", name: "Lumina XL", desc: "高分辨率海报级", pointsPerImage: 20 }
];

export const aspectRatios = ["1:1", "3:4", "4:3", "16:9", "9:16"];

// ---------- 后台：用户 ----------
export const adminUsers = Array.from({ length: 10 }).map((_, i) => ({
  id: `u_${1000 + i}`,
  name: ["Aria Chen", "Kaito Mori", "Luna Park", "Mira Sun", "Noah Lee", "Ivy Zhou", "Ren Tanaka", "Sora Kim", "Finn Wei", "Zoe Han"][i],
  email: `user${i + 1}@lumen.art`,
  avatar: img(`au-${i}`, 80, 80),
  plan: ["basic", "standard", "pro", "mega", "standard", "basic", "pro", "standard", "free", "mega"][i],
  points: [6420, 4800, 12300, 38500, 900, 2200, 9800, 5600, 0, 41000][i],
  status: i % 7 === 6 ? "banned" : "active",
  generated: [128, 64, 312, 540, 12, 88, 240, 156, 0, 612][i],
  joinedAt: new Date(Date.now() - i * 86400000 * 4).toISOString()
}));

// ---------- 后台：任务 ----------
export const adminTasks = Array.from({ length: 10 }).map((_, i) => ({
  id: `t_${300 + i}`,
  user: adminUsers[i % adminUsers.length].name,
  prompt: generationTasks[i % generationTasks.length].prompt,
  model: generationTasks[i % generationTasks.length].model,
  status: (["success", "success", "running", "failed", "queued", "success", "running", "failed", "success", "queued"] as TaskStatus[])[i],
  pointsCost: generationTasks[i % generationTasks.length].pointsCost,
  durationMs: [4200, 3800, 0, 60000, 0, 5100, 0, 60000, 4700, 0][i],
  createdAt: new Date(Date.now() - i * 3600000 * 2).toISOString(),
  error: i === 3 || i === 7 ? "provider timeout after 60s" : undefined
}));

// ---------- 后台：内容（作品审核）----------
export const adminPosts = Array.from({ length: 8 }).map((_, i) => ({
  id: `ap_${i + 1}`,
  imageUrl: img(`ap-${i}`, 400, 400),
  author: ["Aria Chen", "Kaito", "Luna", "Mira", "Noah", "Ivy", "Ren", "Sora"][i],
  status: (["published", "pending", "published", "flagged", "published", "pending", "flagged", "published"] as ("published" | "pending" | "flagged")[])[i],
  likes: posts[i].likes,
  comments: posts[i].comments,
  reports: i % 4 === 3 ? 3 : 0,
  createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString()
}));

// ---------- 后台：订单 ----------
export const adminOrders = Array.from({ length: 8 }).map((_, i) => ({
  id: `ord_${5000 + i}`,
  user: adminUsers[i].name,
  type: i % 3 === 2 ? "topup" : "subscription",
  plan: ["standard", "pro", "—", "mega", "basic", "standard", "pro", "mega"][i],
  amountCents: [3000, 6000, 1500, 12000, 1000, 3000, 6000, 12000][i],
  points: [8000, 18000, 2000, 40000, 2000, 8000, 18000, 40000][i],
  status: (["paid", "paid", "paid", "refunded", "paid", "failed", "paid", "paid"] as ("paid" | "failed" | "refunded")[])[i],
  createdAt: new Date(Date.now() - i * 86400000).toISOString()
}));

// ---------- 后台：SaaS 指标 ----------
export const analytics = {
  overview: {
    newUsers: 1280,
    dau: 3420,
    wau: 11200,
    mau: 28400,
    paidConversion: 4.8,
    mrr: 28600,
    pointsIssued: 1840000,
    pointsConsumed: 1520000
  },
  retention: {
    d1: 48,
    d7: 32,
    d30: 21
  },
  planDistribution: [
    { plan: "Basic", count: 18200, color: "bg-zinc-500" },
    { plan: "Standard", count: 7400, color: "bg-primary" },
    { plan: "Pro", count: 2100, color: "bg-accent" },
    { plan: "Mega", count: 700, color: "bg-warning" }
  ],
  social: {
    sharedPosts: 9400,
    likeRate: 38,
    commentRate: 12,
    repostRate: 7
  },
  // 简单趋势：最近 7 天数值
  trend: [220, 280, 260, 340, 380, 360, 420]
};

// ---------- 后台：系统监控 ----------
export const observability = {
  api: {
    calls24h: 1840000,
    successRate: 99.2,
    errorRate: 0.8,
    avgLatencyMs: 320
  },
  providers: [
    { name: "Flux", calls: 42000, successRate: 98.6, avgLatencyMs: 4100, status: "healthy" },
    { name: "SD 3.5", calls: 18000, successRate: 97.2, avgLatencyMs: 5200, status: "degraded" },
    { name: "Lumina", calls: 8400, successRate: 99.1, avgLatencyMs: 6800, status: "healthy" }
  ],
  database: {
    connections: 42,
    maxConnections: 200,
    slowQueries: 3,
    failedRate: 0.2
  },
  queue: {
    pending: 24,
    processing: 8,
    failedToday: 2,
    retrying: 1
  },
  health: [
    { service: "API Gateway", status: "healthy", detail: "p99 320ms" },
    { service: "Auth Service", status: "healthy", detail: "uptime 99.98%" },
    { service: "Model Adapter", status: "degraded", detail: "SD 3.5 超时率上升" },
    { service: "Postgres", status: "healthy", detail: "42/200 conn" },
    { service: "Object Storage", status: "healthy", detail: "上传成功率 100%" },
    { service: "Stripe Webhook", status: "healthy", detail: "近 1h 0 失败" }
  ],
  alerts: [
    { level: "warning", title: "SD 3.5 超时率上升", time: "12 分钟前" },
    { level: "info", title: "Standard 套餐月发积分任务完成", time: "1 小时前" }
  ]
};

// ---------- 后台首页概览 ----------
export const adminOverview = {
  totalUsers: 28400,
  totalTasks: 94200,
  revenue30d: 28600,
  sharedPosts: 9400,
  failedTasks24h: 12,
  topUsers: adminUsers.slice(0, 5)
};
