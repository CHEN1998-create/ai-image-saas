// scripts/seed-pg.ts — CloudBase PostgreSQL demo 数据灌入
// 用法：npm run seed  （自动建表 + 灌入）
// 幂等：每个 INSERT 用 ON CONFLICT DO UPDATE，重复跑覆盖
// 前置：.env.local 填 PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD

import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { getPool, query } from "../lib/pg";
import { hashPassword } from "../lib/auth/password";
import {
  adminOrders as mockAdminOrders,
  adminPosts as mockAdminPosts,
  adminTasks as mockAdminTasks,
  adminUsers as mockAdminUsers,
  galleryImages,
  generationTasks,
  plans as mockPlans,
  pointRecords,
  posts as mockPosts
} from "../lib/mock-data";

const ARIA_ID = "u_8f3a";
const ADMIN_ID = "u_admin";
const ariaAvatar = "https://picsum.photos/seed/lumen-avatar/200/200";
const adminAvatar = "https://picsum.photos/seed/lumen-admin/200/200";

function log(name: string, n: number) {
  console.log(`  ✓ ${name.padEnd(18)} ${n} 条`);
}

async function runSqlFile(path: string) {
  const fs = await import("node:fs");
  const sql = fs.readFileSync(resolve(process.cwd(), path), "utf8");
  await query(sql);
}

async function ensureSchema() {
  console.log("  → 执行建表/迁移 SQL ...");
  const fs = await import("node:fs");
  const dir = resolve(process.cwd(), "scripts");
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^\d{4}_pg_.*\.sql$/.test(f))
    .sort();
  for (const f of files) {
    await runSqlFile(`scripts/${f}`);
  }
  console.log(`  ✓ 表结构就绪（${files.length} 个迁移）\n`);
}

async function seedUsers() {
  const [ariaHash, adminHash] = await Promise.all([
    hashPassword("password"),
    hashPassword("admin123")
  ]);
  const now = new Date().toISOString();
  await query(`
    insert into lumen.users
      (id, email, name, avatar, role, plan, points, total_generated, joined_at, bio, links, password_hash)
    values
      ($1,'aria@lumen.art','Aria Chen',$2,'user','standard',6420,128,'2026-04-12','Visual explorer · neon & soft light',$7::jsonb,$3),
      ($4,'admin@lumen.art','Lumen Admin',$5,'admin','mega',99999,0,'2026-01-01','Platform administrator',$8::jsonb,$6)
    on conflict (id) do update set
      email = excluded.email, name = excluded.name, avatar = excluded.avatar,
      role = excluded.role, plan = excluded.plan, points = excluded.points,
      total_generated = excluded.total_generated, joined_at = excluded.joined_at,
      bio = excluded.bio, links = excluded.links, password_hash = excluded.password_hash
  `, [ARIA_ID, ariaAvatar, ariaHash, ADMIN_ID, adminAvatar, adminHash,
      JSON.stringify(["aria.art", "@aria_lumen"]), "[]"]);
  log("users", 2);
}

async function seedGallery() {
  const now = new Date();
  for (const g of galleryImages) {
    await query(`
      insert into lumen.generated_images
        (id, user_id, image_url, prompt, model, aspect_ratio, is_favorite, created_at)
      values ($1,$2,$3,$4,$5,$6,$7,$8)
      on conflict (id) do update set
        image_url = excluded.image_url, prompt = excluded.prompt,
        model = excluded.model, aspect_ratio = excluded.aspect_ratio,
        is_favorite = excluded.is_favorite
    `, [g.id, ARIA_ID, g.url, g.prompt, g.model, g.ratio, g.favorite, now]);
  }
  log("generated_images", galleryImages.length);
}

async function seedTasks() {
  for (const t of generationTasks) {
    await query(`
      insert into lumen.generation_tasks
        (id, user_id, prompt, negative_prompt, model, aspect_ratio,
         image_count, status, progress, points_cost, error_message, created_at)
      values ($1,$2,$3,'',$4,$5,$6,$7,case when $7='success' then 100 else 0 end,$8,$9,$10)
      on conflict (id) do update set
        prompt = excluded.prompt, model = excluded.model, status = excluded.status,
        progress = excluded.progress,
        points_cost = excluded.points_cost, error_message = excluded.error_message
    `, [t.id, ARIA_ID, t.prompt, t.model, t.ratio, t.count, t.status,
        t.pointsCost, t.error ?? null, t.createdAt]);
  }
  log("generation_tasks", generationTasks.length);
}

async function seedPoints() {
  for (const p of pointRecords) {
    await query(`
      insert into lumen.point_records (id, user_id, type, delta, source, created_at)
      values ($1,$2,$3,$4,$5,$6)
      on conflict (id) do nothing
    `, [p.id, ARIA_ID, p.type, p.delta, p.source, p.createdAt]);
  }
  log("point_records", pointRecords.length);
}

async function seedPosts() {
  const authorToId: Record<string, string> = {};
  let n = 100;
  for (const p of mockPosts) {
    const name = p.author.name;
    if (!authorToId[name]) {
      authorToId[name] = name === "Aria Chen" ? ARIA_ID : `u_${1000 + n++}`;
    }
    const userId = authorToId[name];
    // 先确保该 author 有 users 行（非 aria/admin）
    if (userId !== ARIA_ID && userId !== ADMIN_ID) {
      await query(`
        insert into lumen.users (id, email, name, role, plan, points, joined_at)
        values ($1,$2,$3,'user','free',0,$4)
        on conflict (id) do nothing
      `, [userId, `${name.toLowerCase().replace(/\s/g, "")}@lumen.art`, name, new Date().toISOString()]);
    }
    await query(`
      insert into lumen.shared_posts
        (id, user_id, caption, visibility, created_at)
      values ($1,$2,$3,'public',$4)
      on conflict (id) do update set caption = excluded.caption
    `, [p.id, userId, p.caption, p.createdAt]);
  }
  log("shared_posts", mockPosts.length);
}

async function seedBilling() {
  const bnow = new Date();
  for (const [i, d] of [[0, -2592000000], [1, -1296000000]] as const) {
    await query(`
      insert into lumen.billing_records
        (id, user_id, plan_code, billing_cycle, type, amount_cents, points_delta, status, created_at)
      values ($1,$2,$3,$4,$5,$6,$7,'paid',$8)
      on conflict (id) do nothing
    `, [`b_0${i + 1}`, ARIA_ID, "standard", i === 0 ? "monthly" : "one-time",
        i === 0 ? "subscription" : "topup",
        i === 0 ? 3000 : 1500, i === 0 ? 8000 : 2000,
        new Date(bnow.getTime() + d).toISOString()]);
  }
  log("billing_records", 2);
}

async function seedPlans() {
  for (const p of mockPlans) {
    await query(`
      insert into lumen.subscription_plans
        (id, code, name, tagline, monthly_price_cents, yearly_price_cents,
         monthly_points, image_concurrency, video_concurrency,
         supports_hd_video, supports_stealth, features, highlight)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
      on conflict (id) do update set
        name = excluded.name, tagline = excluded.tagline,
        monthly_price_cents = excluded.monthly_price_cents,
        monthly_points = excluded.monthly_points, features = excluded.features
    `, [p.code, p.code, p.name, p.tagline, p.monthlyPriceCents, p.yearlyPriceCents,
        p.monthlyPoints, p.imageConcurrency, p.videoConcurrency,
        false, false, JSON.stringify(p.features), p.highlight ?? false]);
  }
  log("subscription_plans", mockPlans.length);
}

async function main() {
  console.log("\n开始灌入 CloudBase PostgreSQL demo 数据...\n");
  getPool(); // 预热连接池（立即触发 env 校验）
  await ensureSchema();
  await seedUsers();
  await seedGallery();
  await seedTasks();
  await seedPoints();
  await seedPosts();
  await seedBilling();
  await seedPlans();
  console.log("\n✅ 全部灌入完成。");
  console.log("   demo 账号：aria@lumen.art / password（用户）");
  console.log("              admin@lumen.art / admin123（管理员）\n");
}

main().catch((e) => {
  console.error("\n❌ 灌入失败：", e);
  process.exit(1);
});
