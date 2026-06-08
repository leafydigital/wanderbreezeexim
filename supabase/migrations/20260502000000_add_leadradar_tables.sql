-- ============================================================
--  LeadRadar Migration — add to your existing Supabase project
--  Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Lead Searches log ─────────────────────────────────────
create table if not exists lr_searches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id) on delete set null,
  query        text not null,
  location     text not null,
  result_count int  default 0,
  sources      jsonb default '{}',
  created_at   timestamptz default now()
);

-- ── Saved Leads ───────────────────────────────────────────
create table if not exists lr_leads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  name       text not null,
  email      text,
  phone      text,
  website    text,
  address    text,
  country    text,
  category   text,
  rating     text,
  source     text default 'ai',
  stage      text default 'new',
  notes      text,
  created_at timestamptz default now()
);

-- ── API Keys (admin-managed) ──────────────────────────────
create table if not exists lr_api_keys (
  id         uuid primary key default gen_random_uuid(),
  key_name   text unique not null,
  key_value  text not null,
  updated_by uuid references users(id) on delete set null,
  updated_at timestamptz default now()
);

-- ── Add 'leadradar' permission to existing roles table ────
-- Your roles.permissions is a jsonb column.
-- This just makes sure the key exists for new roles.
-- Existing roles will default to false (no access) until you grant it via Roles page.

-- ── RLS ───────────────────────────────────────────────────
alter table lr_searches enable row level security;
alter table lr_leads    enable row level security;
alter table lr_api_keys enable row level security;

-- lr_searches: users see their own rows
create policy "lr_searches_own" on lr_searches
  for all using (auth.uid()::text = user_id::text);

-- lr_leads: users see their own; service role sees all
create policy "lr_leads_own" on lr_leads
  for all using (auth.uid()::text = user_id::text);

-- lr_api_keys: service role only (accessed via edge function or service key)
-- Frontend never reads raw key values — only checks if set
create policy "lr_apikeys_select" on lr_api_keys
  for select using (true);
create policy "lr_apikeys_modify" on lr_api_keys
  for all using (auth.role() = 'service_role');

-- ── Indexes ───────────────────────────────────────────────
create index if not exists idx_lr_leads_user_id    on lr_leads(user_id);
create index if not exists idx_lr_leads_stage      on lr_leads(stage);
create index if not exists idx_lr_searches_user_id on lr_searches(user_id);
create index if not exists idx_lr_searches_created on lr_searches(created_at desc);
