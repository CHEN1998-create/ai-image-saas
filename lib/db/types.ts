// lib/db 类型 — 与 lib/mock-data 对齐，补充 userId / admin 字段
// server-only，供 lib/db 内部 + Route Handlers + Server Component 使用

export type TaskStatus = "queued" | "running" | "success" | "failed";

export type Plan = {
  id: string;
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

export type GalleryImage = {
  id: string;
  userId: string;
  url: string;
  prompt: string;
  model: string;
  ratio: string;
  favorite: boolean;
  createdAt: string;
};

export type GenerationTask = {
  id: string;
  userId: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  ratio: string;
  count: number;
  status: TaskStatus;
  pointsCost: number;
  createdAt: string;
  error?: string;
};

export type PointRecord = {
  id: string;
  userId: string;
  type: "earn" | "spend";
  delta: number;
  source: string;
  createdAt: string;
};

export type Post = {
  id: string;
  userId: string;
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

export type Comment = {
  id: string;
  postId: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  createdAt: string;
};

export type BillingRecord = {
  id: string;
  userId: string;
  planCode: string;
  billingCycle: string;
  type: string;
  amountCents: number;
  pointsDelta: number;
  status: string;
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: string;
  points: number;
  status: "active" | "banned";
  generated: number;
  joinedAt: string;
};

export type AdminTask = {
  id: string;
  user: string;
  prompt: string;
  model: string;
  status: TaskStatus;
  pointsCost: number;
  durationMs: number;
  createdAt: string;
  error?: string;
};

export type AdminPost = {
  id: string;
  imageUrl: string;
  author: string;
  status: "published" | "pending" | "flagged";
  likes: number;
  comments: number;
  reports: number;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  user: string;
  type: "subscription" | "topup";
  plan: string;
  amountCents: number;
  points: number;
  status: "paid" | "failed" | "refunded";
  createdAt: string;
};

// 静态聚合数据（mock 层只读快照，不持久化）
export type Analytics = {
  overview: {
    newUsers: number;
    dau: number;
    wau: number;
    mau: number;
    paidConversion: number;
    mrr: number;
    pointsIssued: number;
    pointsConsumed: number;
  };
  retention: { d1: number; d7: number; d30: number };
  planDistribution: { plan: string; count: number; color: string }[];
  social: {
    sharedPosts: number;
    likeRate: number;
    commentRate: number;
    repostRate: number;
  };
  trend: number[];
};

export type Observability = {
  api: { calls24h: number; successRate: number; errorRate: number; avgLatencyMs: number };
  providers: { name: string; calls: number; successRate: number; avgLatencyMs: number; status: string }[];
  database: { connections: number; maxConnections: number; slowQueries: number; failedRate: number };
  queue: { pending: number; processing: number; failedToday: number; retrying: number };
  health: { service: string; status: string; detail: string }[];
  alerts: { level: string; title: string; time: string }[];
};

export type AdminOverview = {
  totalUsers: number;
  totalTasks: number;
  revenue30d: number;
  sharedPosts: number;
  failedTasks24h: number;
  topUsers: AdminUser[];
};
