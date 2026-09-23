-- ============================================================
-- 0003_pg_billing.sql — 支付链路幂等字段
-- billing_records 增加 Stripe 关联键，防止 webhook + 成功页重复发放
-- ============================================================

alter table lumen.billing_records add column if not exists stripe_session_id text;
alter table lumen.billing_records add column if not exists stripe_invoice_id text;
alter table lumen.billing_records add column if not exists product_type text; -- subscription / topup

-- 同一 Stripe checkout session 只允许入账一次（幂等核心）
create unique index if not exists idx_lumen_billing_session
  on lumen.billing_records (stripe_session_id)
  where stripe_session_id is not null;

-- 同一 Stripe invoice（订阅续期）也只入账一次
create unique index if not exists idx_lumen_billing_invoice
  on lumen.billing_records (stripe_invoice_id)
  where stripe_invoice_id is not null;

-- 查用户订单/对账常用
create index if not exists idx_lumen_billing_status_created
  on lumen.billing_records (status, created_at desc);
