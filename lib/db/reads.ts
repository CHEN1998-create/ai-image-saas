// lib/db 读取层 — PostgreSQL 直查
// Server Component 直查（RSC 无 HTTP 跳），Route Handler 也可调用
// 函数签名保持与原 mock 层一致，内部实现换 SQL

import { query } from "@/lib/pg";
import { toIso } from "./store";
import type {
  AdminOrder,
  AdminPost,
  AdminTask,
  AdminUser,
  Analytics,
  BillingRecord,
  Comment,
  GalleryImage,
  GenerationTask,
  Observability,
  Plan,
  PointRecord,
  Post,
  AdminOverview
} from "./types";

// ---------- 用户侧 ----------

export async function getGallery(userId: string): Promise<GalleryImage[]> {
  const res = await query(`
    select gi.id, gi.user_id, gi.image_url as url, gi.prompt, gi.model,
           gi.aspect_ratio as ratio, gi.is_favorite as favorite, gi.created_at
    from lumen.generated_images gi
    where gi.user_id = $1
    order by gi.created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, url: r.url, prompt: r.prompt ?? "",
    model: r.model ?? "", ratio: r.ratio ?? "1:1", favorite: r.favorite,
    createdAt: toIso(r.created_at)
  }));
}

export async function getGenerationTasks(userId: string): Promise<GenerationTask[]> {
  const res = await query(`
    select id, user_id, prompt, negative_prompt, model, aspect_ratio,
           image_count, status, progress, points_cost, error_message, created_at
    from lumen.generation_tasks where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, prompt: r.prompt,
    negativePrompt: r.negative_prompt ?? "", model: r.model,
    ratio: r.aspect_ratio, count: r.image_count, status: r.status,
    progress: r.progress ?? 0, pointsCost: r.points_cost,
    createdAt: toIso(r.created_at), error: r.error_message ?? undefined
  }));
}

// 查单个任务（含已生成图片），轮询用。校验归属，非本人返回 null。
export async function getTaskById(
  taskId: string,
  userId?: string
): Promise<{ task: GenerationTask; images: GalleryImage[] } | null> {
  const res = await query(`
    select id, user_id, prompt, negative_prompt, model, aspect_ratio,
           image_count, status, progress, points_cost, error_message, created_at
    from lumen.generation_tasks where id = $1
  `, [taskId]);
  const r = res.rows[0];
  if (!r) return null;
  if (userId && r.user_id !== userId) return null;

  const task: GenerationTask = {
    id: r.id, userId: r.user_id, prompt: r.prompt,
    negativePrompt: r.negative_prompt ?? "", model: r.model,
    ratio: r.aspect_ratio, count: r.image_count, status: r.status,
    progress: r.progress ?? 0, pointsCost: r.points_cost,
    createdAt: toIso(r.created_at), error: r.error_message ?? undefined
  };

  const imgRes = await query(`
    select id, user_id, image_url as url, prompt, model,
           aspect_ratio as ratio, is_favorite as favorite, created_at
    from lumen.generated_images
    where task_id = $1 order by created_at asc
  `, [taskId]);
  const images: GalleryImage[] = imgRes.rows.map((g) => ({
    id: g.id, userId: g.user_id, url: g.url, prompt: g.prompt ?? "",
    model: g.model ?? "", ratio: g.ratio ?? "1:1",
    favorite: g.favorite, createdAt: toIso(g.created_at)
  }));
  return { task, images };
}

export async function getPointRecords(userId: string): Promise<PointRecord[]> {
  const res = await query(`
    select id, user_id, type, delta, source, created_at
    from lumen.point_records where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, type: r.type as "earn" | "spend",
    delta: r.delta, source: r.source ?? "", createdAt: toIso(r.created_at)
  }));
}

export async function getPosts(): Promise<Post[]> {
  const res = await query(`
    select sp.id, sp.image_id, sp.user_id, sp.caption, sp.created_at,
           gi.image_url, gi.prompt, gi.model, gi.aspect_ratio,
           u.name as author_name, u.avatar as author_avatar,
           (select count(*) from lumen.post_likes pl where pl.post_id = sp.id) as likes_count,
           (select count(*) from lumen.post_comments pc where pc.post_id = sp.id) as comments_count
    from lumen.shared_posts sp
    left join lumen.generated_images gi on gi.id = sp.image_id
    left join lumen.users u on u.id = sp.user_id
    where sp.visibility = 'public' and sp.moderation_status = 'approved'
    order by sp.created_at desc
  `);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id,
    imageUrl: r.image_url ?? `https://picsum.photos/seed/${r.id}/600/600`,
    prompt: r.prompt ?? "", model: r.model ?? "", ratio: r.aspect_ratio ?? "1:1",
    author: { name: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "" },
    caption: r.caption ?? "", likes: Number(r.likes_count),
    comments: Number(r.comments_count), reposts: 0, liked: false,
    createdAt: toIso(r.created_at), tags: []
  }));
}

export async function getPost(
  id: string,
  currentUserId?: string
): Promise<Post | null> {
  const res = await query(`
    select sp.id, sp.image_id, sp.user_id, sp.caption, sp.created_at,
           gi.image_url, gi.prompt, gi.model, gi.aspect_ratio,
           u.name as author_name, u.avatar as author_avatar,
           (select count(*) from lumen.post_likes pl where pl.post_id = sp.id) as likes_count,
           (select count(*) from lumen.post_comments pc where pc.post_id = sp.id) as comments_count,
           exists(select 1 from lumen.post_likes ml
                  where ml.post_id = sp.id and ml.user_id = $2) as liked_by_me
    from lumen.shared_posts sp
    left join lumen.generated_images gi on gi.id = sp.image_id
    left join lumen.users u on u.id = sp.user_id
    where sp.id = $1
      and (sp.moderation_status <> 'rejected' or sp.user_id = $2)
  `, [id, currentUserId ?? null]);
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: r.id, userId: r.user_id,
    imageUrl: r.image_url ?? `https://picsum.photos/seed/${r.id}/600/600`,
    prompt: r.prompt ?? "", model: r.model ?? "", ratio: r.aspect_ratio ?? "1:1",
    author: { name: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "" },
    caption: r.caption ?? "", likes: Number(r.likes_count),
    comments: Number(r.comments_count), reposts: 0, liked: !!r.liked_by_me,
    createdAt: toIso(r.created_at), tags: []
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  const res = await query(`
    select pc.id, pc.post_id, pc.content, pc.created_at,
           u.name as author_name, u.avatar as author_avatar
    from lumen.post_comments pc
    left join lumen.users u on u.id = pc.user_id
    where pc.post_id = $1
    order by pc.created_at asc
  `, [postId]);
  return res.rows.map((r) => ({
    id: r.id, postId: r.post_id,
    author: r.author_name ?? "Unknown", avatar: r.author_avatar ?? "",
    content: r.content, likes: 0, createdAt: toIso(r.created_at)
  }));
}

export async function getPlans(): Promise<Plan[]> {
  const res = await query(`
    select id, code, name, tagline, monthly_price_cents, yearly_price_cents,
           monthly_points, image_concurrency, video_concurrency, supports_hd_video,
           supports_stealth, features, highlight
    from lumen.subscription_plans order by monthly_price_cents
  `);
  return res.rows.map((r) => ({
    id: r.id, code: r.code, name: r.name, tagline: r.tagline ?? "",
    monthlyPriceCents: r.monthly_price_cents, yearlyPriceCents: r.yearly_price_cents,
    monthlyPoints: r.monthly_points, imageConcurrency: r.image_concurrency,
    videoConcurrency: r.video_concurrency,
    features: Array.isArray(r.features) ? (r.features as string[]) : [],
    highlight: r.highlight ?? false
  }));
}

export async function getBillingRecords(userId: string): Promise<BillingRecord[]> {
  const res = await query(`
    select id, user_id, plan_code, billing_cycle, type, amount_cents,
           points_delta, status, created_at
    from lumen.billing_records where user_id = $1 order by created_at desc
  `, [userId]);
  return res.rows.map((r) => ({
    id: r.id, userId: r.user_id, planCode: r.plan_code ?? "",
    billingCycle: r.billing_cycle ?? "", type: r.type,
    amountCents: r.amount_cents, pointsDelta: r.points_delta,
    status: r.status, createdAt: toIso(r.created_at)
  }));
}

// ---------- Admin 侧（真实数据） ----------

export async function getAdminOverview(): Promise<AdminOverview> {
  const [u, t, r, p, f, top] = await Promise.all([
    query(`select count(*)::int as n from lumen.users`),
    query(`select count(*)::int as n from lumen.generation_tasks`),
    query(`
      select coalesce(sum(amount_cents),0)::int as n
      from lumen.billing_records
      where status = 'paid' and created_at > now() - interval '30 days'
    `),
    query(`select count(*)::int as n from lumen.shared_posts`),
    query(`
      select count(*)::int as n from lumen.generation_tasks
      where status in ('failed','cancelled') and created_at > now() - interval '24 hours'
    `),
    query(`
      select * from lumen.users
      order by total_generated desc nulls last
      limit 5
    `)
  ]);
  return {
    totalUsers: u.rows[0].n,
    totalTasks: t.rows[0].n,
    revenue30d: r.rows[0].n,
    sharedPosts: p.rows[0].n,
    failedTasks24h: f.rows[0].n,
    topUsers: top.rows.map((x) => rowToAdminUser(x))
  };
}

function rowToAdminUser(r: Record<string, unknown>): AdminUser {
  const row = r as {
    id: string; name: string; email: string; avatar: string;
    plan: string; points: number; status: "active" | "banned";
    total_generated: number; joined_at: string;
  };
  return {
    id: row.id, name: row.name, email: row.email,
    avatar: row.avatar ?? "", plan: row.plan, points: row.points,
    status: row.status ?? "active",
    generated: row.total_generated ?? 0,
    joinedAt: row.joined_at ?? ""
  };
}

export async function getAdminUsers(search?: string): Promise<AdminUser[]> {
  const res = search && search.trim()
    ? await query(`
        select * from lumen.users
        where name ilike $1 or email ilike $1
        order by joined_at::timestamptz desc
      `, [`%${search.trim()}%`])
    : await query(`
        select * from lumen.users
        order by joined_at::timestamptz desc
      `);
  return res.rows.map((x) => rowToAdminUser(x));
}

export async function getAdminTasks(statusFilter?: string): Promise<AdminTask[]> {
  const filtered = !!statusFilter && statusFilter !== "全部";
  const where = filtered ? "where t.status = $1" : "";
  const res = await query(`
    select t.id, t.user_id, u.name as user_name, t.prompt, t.model,
           t.status, t.points_cost, t.created_at, t.completed_at,
           t.error_message, u.email as user_email
    from lumen.generation_tasks t
    join lumen.users u on u.id = t.user_id
    ${where}
    order by t.created_at desc
    limit 200
  `, filtered ? [statusFilter] : []);
  return res.rows.map((r) => {
    const row = r as {
      id: string; user_name: string; prompt: string; model: string;
      status: AdminTask["status"]; points_cost: number;
      created_at: Date; completed_at: Date | null; error_message: string;
    };
    let durationMs = 0;
    if (row.completed_at) {
      durationMs = Math.max(
        0,
        new Date(row.completed_at).getTime() - new Date(row.created_at).getTime()
      );
    }
    return {
      id: row.id, user: row.user_name, prompt: row.prompt,
      model: row.model, status: row.status, pointsCost: row.points_cost,
      durationMs, createdAt: toIso(row.created_at),
      error: row.error_message ?? undefined
    };
  });
}

export async function getAdminPosts(
  moderation?: string
): Promise<AdminPost[]> {
  const where = moderation && moderation !== "全部"
    ? "where sp.moderation_status = $1"
    : "";
  const res = await query(`
    select sp.id, gi.image_url as imageurl, u.name as author,
           sp.moderation_status as mstatus, sp.report_count as reports,
           sp.created_at,
           (select count(*) from lumen.post_likes pl where pl.post_id = sp.id)::int as likes,
           (select count(*) from lumen.post_comments pc where pc.post_id = sp.id)::int as comments
    from lumen.shared_posts sp
    left join lumen.generated_images gi on gi.id = sp.image_id
    join lumen.users u on u.id = sp.user_id
    ${where}
    order by sp.created_at desc
    limit 200
  `, moderation && moderation !== "全部" ? [moderation] : []);
  return res.rows.map((r) => {
    const row = r as {
      id: string; imageurl: string; author: string;
      mstatus: string; reports: number; created_at: Date;
      likes: number; comments: number;
    };
    const status: AdminPost["status"] =
      row.mstatus === "pending" ? "pending"
      : row.mstatus === "rejected" ? "flagged"
      : "published";
    return {
      id: row.id, imageUrl: row.imageurl, author: row.author,
      status, likes: row.likes, comments: row.comments,
      reports: row.reports ?? 0, createdAt: toIso(row.created_at)
    };
  });
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const res = await query(`
    select b.id, u.name as user_name, b.type, b.plan_code,
           b.amount_cents, b.points_delta, b.status, b.created_at
    from lumen.billing_records b
    join lumen.users u on u.id = b.user_id
    order by b.created_at desc
    limit 200
  `);
  return res.rows.map((r) => {
    const row = r as {
      id: string; user_name: string; type: AdminOrder["type"];
      plan_code: string; amount_cents: number; points_delta: number;
      status: AdminOrder["status"]; created_at: Date;
    };
    return {
      id: row.id, user: row.user_name,
      type: row.type === "topup" ? "topup" : "subscription",
      plan: row.plan_code ?? "", amountCents: row.amount_cents,
      points: row.points_delta,
      status: row.status === "paid" ? "paid"
        : row.status === "refunded" ? "refunded" : "failed",
      createdAt: toIso(row.created_at)
    };
  });
}

// ---------- SaaS 指标（真实聚合） ----------
export async function getAnalyticsData(): Promise<Analytics> {
  const [overview, retention, plans, social, trend] = await Promise.all([
    query(`
      select
        (select count(*)::int from lumen.users
          where joined_at::timestamptz > now() - interval '30 days') as new_users,
        (select count(distinct user_id)::int from (
           select user_id, created_at from lumen.point_records
           union all
           select user_id, created_at from lumen.generation_tasks
         ) a where created_at > now() - interval '1 day') as dau,
        (select count(distinct user_id)::int from (
           select user_id, created_at from lumen.point_records
           union all
           select user_id, created_at from lumen.generation_tasks
         ) a where created_at > now() - interval '7 days') as wau,
        (select count(distinct user_id)::int from (
           select user_id, created_at from lumen.point_records
           union all
           select user_id, created_at from lumen.generation_tasks
         ) a where created_at > now() - interval '30 days') as mau,
        (select round(100.0 * count(*) filter
            (where exists (select 1 from lumen.billing_records b
              where b.user_id = u.id and b.status='paid'))
            / nullif(count(*),0) * 100.0, 1)::float
          from lumen.users u) as paid_conversion,
        (select coalesce(sum(p.monthly_price_cents),0)::int
          from lumen.users u
          join lumen.subscription_plans p on p.code = u.plan
          where u.plan <> 'free') as mrr,
        (select coalesce(sum(delta) filter (where delta > 0),0)::int
          from lumen.point_records) as points_issued,
        (select coalesce(sum(-delta) filter (where delta < 0),0)::int
          from lumen.point_records) as points_consumed
    `),
    query(`
      with active as (
        select distinct user_id, min(created_at)::date as first_day
        from (
          select user_id, created_at from lumen.point_records
          union all
          select user_id, created_at from lumen.generation_tasks
        ) a group by user_id
      )
      select
        round(100.0 * count(*) filter (where exists (
          select 1 from active x where x.user_id = a.user_id
            and x.first_day > a.first_day))
          / nullif(count(*),0), 0)::int as d_simple,
        round(100.0 * count(*) filter (where exists (
          select 1 from active x where x.user_id = a.user_id
            and x.first_day >= a.first_day + 7))
          / nullif(count(*),0), 0)::int as d7,
        round(100.0 * count(*) filter (where exists (
          select 1 from active x where x.user_id = a.user_id
            and x.first_day >= a.first_day + 30))
          / nullif(count(*),0), 0)::int as d30
      from active a
    `),
    query(`
      select u.plan, count(*)::int as n
      from lumen.users u group by u.plan order by n desc
    `),
    query(`
      select
        (select count(*)::int from lumen.shared_posts) as shared,
        (select count(*)::int from lumen.post_likes) as likes,
        (select count(*)::int from lumen.post_comments) as comments,
        (select count(*)::int from lumen.shared_posts
          where repost_from_post_id is not null) as reposts,
        (select count(*)::int from lumen.users u
          where exists (select 1 from lumen.shared_posts sp
            where sp.user_id = u.id)) as social_users
    `),
    query(`
      select d::date as day,
        (select count(*) from lumen.users u
          where u.joined_at::timestamptz::date = d::date)::int as n
      from generate_series(
        date_trunc('day', now()) - interval '6 days',
        date_trunc('day', now()), interval '1 day') d
      order by day
    `)
  ]);

  const o = overview.rows[0] as {
    new_users: number; dau: number; wau: number; mau: number;
    paid_conversion: number; mrr: number;
    points_issued: number; points_consumed: number;
  };
  const rt = retention.rows[0] as {
    d_simple: number; d7: number; d30: number;
  };
  const colorMap: Record<string, string> = {
    free: "bg-muted-foreground", standard: "bg-primary",
    pro: "bg-accent", premium: "bg-warning"
  };
  const s = social.rows[0] as {
    shared: number; likes: number; comments: number;
    reposts: number; social_users: number;
  };

  return {
    overview: {
      newUsers: o.new_users, dau: o.dau, wau: o.wau, mau: o.mau,
      paidConversion: o.paid_conversion ?? 0, mrr: o.mrr,
      pointsIssued: o.points_issued, pointsConsumed: o.points_consumed
    },
    retention: {
      d1: rt.d_simple ?? 0, d7: rt.d7 ?? 0, d30: rt.d30 ?? 0
    },
    planDistribution: plans.rows.map((r) => {
      const row = r as { plan: string; n: number };
      return {
        plan: row.plan, count: row.n,
        color: colorMap[row.plan] ?? "bg-primary"
      };
    }),
    social: {
      sharedPosts: s.shared,
      likeRate: s.social_users ? Math.round((s.likes / s.social_users) * 10) / 10 : 0,
      commentRate: s.social_users ? Math.round((s.comments / s.social_users) * 10) / 10 : 0,
      repostRate: s.shared ? Math.round((s.reposts / s.shared) * 100) : 0
    },
    trend: trend.rows.map((r) => (r as { n: number }).n)
  };
}

// ---------- 监控日志（真实数据） ----------
export async function getApiLogs(limit = 50): Promise<import("./types").ApiCallLog[]> {
  const res = await query(`
    select * from lumen.api_call_logs
    order by created_at desc limit $1
  `, [limit]);
  return res.rows.map((r) => {
    const row = r as {
      id: string; route: string; method: string; user_id: string | null;
      status_code: number; duration_ms: number; created_at: Date;
    };
    return {
      id: row.id, route: row.route, method: row.method,
      userId: row.user_id, statusCode: row.status_code,
      durationMs: row.duration_ms, createdAt: toIso(row.created_at)
    };
  });
}

export async function getProviderLogs(limit = 50): Promise<import("./types").ProviderCallLog[]> {
  const res = await query(`
    select * from lumen.provider_call_logs
    order by created_at desc limit $1
  `, [limit]);
  return res.rows.map((r) => {
    const row = r as {
      id: string; provider_name: string; task_id: string | null;
      status: string; duration_ms: number; error_message: string;
      created_at: Date;
    };
    return {
      id: row.id, providerName: row.provider_name,
      taskId: row.task_id, status: row.status,
      durationMs: row.duration_ms,
      errorMessage: row.error_message ?? "",
      createdAt: toIso(row.created_at)
    };
  });
}

export async function getHealthChecks(limit = 20): Promise<import("./types").HealthCheck[]> {
  const res = await query(`
    select * from lumen.system_health_checks
    order by created_at desc limit $1
  `, [limit]);
  return res.rows.map((r) => {
    const row = r as {
      id: string; service_name: string; check_type: string;
      status: string; detail: Record<string, unknown>; created_at: Date;
    };
    return {
      id: row.id, serviceName: row.service_name,
      checkType: row.check_type, status: row.status,
      detail: row.detail ?? {}, createdAt: toIso(row.created_at)
    };
  });
}

export async function getObservabilityData(): Promise<Observability> {
  const [apiAgg, providerAgg, queue, health] = await Promise.all([
    query(`
      select count(*)::int as calls,
        round(100.0 * count(*) filter (where status_code < 400)
          / nullif(count(*),0), 1)::float as success,
        coalesce(avg(duration_ms),0)::int as avg_lat
      from lumen.api_call_logs
      where created_at > now() - interval '24 hours'
    `),
    query(`
      select provider_name, count(*)::int as calls,
        round(100.0 * count(*) filter (where status='success')
          / nullif(count(*),0), 1)::float as success,
        coalesce(avg(duration_ms),0)::int as avg_lat,
        (count(*) filter (where status <> 'success') > 0) as degraded
      from lumen.provider_call_logs
      where created_at > now() - interval '24 hours'
      group by provider_name
    `),
    query(`
      select
        count(*) filter (where status='queued')::int as pending,
        count(*) filter (where status='running')::int as processing,
        count(*) filter (where status='failed' and created_at > now() - interval '1 day')::int as failed,
        count(*) filter (where status='cancelled')::int as retrying
      from lumen.generation_tasks
    `),
    query(`
      select distinct on (service_name) service_name, status, detail, created_at
      from lumen.system_health_checks
      order by service_name, created_at desc
    `)
  ]);
  const a = apiAgg.rows[0] as {
    calls: number; success: number; avg_lat: number;
  };
  const q = queue.rows[0] as {
    pending: number; processing: number; failed: number; retrying: number;
  };
  return {
    api: {
      calls24h: a.calls ?? 0,
      successRate: a.success ?? 0,
      errorRate: Math.round(((100 - (a.success ?? 100)) * 10)) / 10,
      avgLatencyMs: a.avg_lat ?? 0
    },
    providers: providerAgg.rows.map((r) => {
      const row = r as {
        provider_name: string; calls: number; success: number;
        avg_lat: number; degraded: boolean;
      };
      return {
        name: row.provider_name, calls: row.calls,
        successRate: row.success, avgLatencyMs: row.avg_lat,
        status: row.degraded ? "degraded" : "healthy"
      };
    }),
    database: {
      connections: 0, maxConnections: 100, slowQueries: 0, failedRate: 0
    },
    queue: {
      pending: q.pending, processing: q.processing,
      failedToday: q.failed, retrying: q.retrying
    },
    health: health.rows.map((r) => {
      const row = r as {
        service_name: string; status: string;
        detail: Record<string, unknown>;
      };
      return {
        service: row.service_name,
        status: row.status === "healthy" ? "healthy" : "degraded",
        detail: typeof row.detail === "object"
          ? String((row.detail as { detail?: string }).detail ?? "")
          : ""
      };
    }),
    alerts: []
  };
}
