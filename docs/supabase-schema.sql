create table if not exists public.deals (
  id text primary key,
  mall text not null,
  title text not null,
  category text not null,
  original_price integer not null check (original_price >= 0),
  sale_price integer not null check (sale_price >= 0),
  discount_rate integer not null check (discount_rate between 0 and 100),
  discount_amount integer not null check (discount_amount >= 0),
  image_url text,
  link text not null,
  source text not null,
  expires_at timestamptz not null,
  is_hot boolean not null default false,
  is_new boolean not null default false,
  is_ending_soon boolean not null default false,
  created_at timestamptz not null default now(),
  tags text[] not null default '{}',
  popularity_score integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists deals_category_idx on public.deals (category);
create index if not exists deals_created_at_idx on public.deals (created_at desc);
create index if not exists deals_expires_at_idx on public.deals (expires_at asc);
create index if not exists deals_discount_rate_idx on public.deals (discount_rate desc);

alter table public.deals
  add column if not exists product_url text,
  add column if not exists search_url text,
  add column if not exists original_url text,
  add column if not exists affiliate_url text,
  add column if not exists final_purchase_url text,
  add column if not exists click_count integer not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists is_sold_out boolean not null default false;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nickname text not null,
  favorite_categories text[] not null default '{}',
  marketing_consent boolean not null default false,
  notification_consent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_favorite_deals (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.user_recent_deals (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.deal_click_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  deal_id text not null,
  from_page text not null default 'unknown',
  final_purchase_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.price_drop_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  target_price integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.price_snapshots (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null references public.deals(id) on delete cascade,
  original_price integer not null,
  sale_price integer not null,
  discount_rate integer not null,
  observed_at timestamptz not null default now()
);

create index if not exists price_snapshots_deal_observed_idx
  on public.price_snapshots (deal_id, observed_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  deal_id text references public.deals(id) on delete set null,
  page text,
  metadata jsonb not null default '{}',
  received_at timestamptz not null default now()
);

create index if not exists analytics_events_event_type_idx on public.analytics_events (event_type);
create index if not exists analytics_events_received_at_idx on public.analytics_events (received_at desc);
create index if not exists analytics_events_deal_idx on public.analytics_events (deal_id);

create table if not exists public.deal_reports (
  id uuid primary key default gen_random_uuid(),
  deal_id text references public.deals(id) on delete set null,
  mall text not null,
  title text not null,
  reason text not null,
  message text not null default '',
  status text not null default 'open',
  received_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deal_reports_status_idx on public.deal_reports (status);
create index if not exists deal_reports_received_at_idx on public.deal_reports (received_at desc);
create index if not exists deal_reports_deal_idx on public.deal_reports (deal_id);

alter table public.deals enable row level security;
alter table public.price_snapshots enable row level security;
alter table public.analytics_events enable row level security;
alter table public.deal_reports enable row level security;
alter table public.user_profiles enable row level security;
alter table public.user_favorite_deals enable row level security;
alter table public.user_recent_deals enable row level security;
alter table public.deal_click_logs enable row level security;
alter table public.price_drop_alerts enable row level security;

create policy "public read deals"
  on public.deals for select
  using (true);

create policy "service writes deals"
  on public.deals for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service writes price snapshots"
  on public.price_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service writes analytics"
  on public.analytics_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service writes deal reports"
  on public.deal_reports for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "users read own profile"
  on public.user_profiles for select
  using (auth.uid() = user_id);

create policy "users upsert own profile"
  on public.user_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own favorites"
  on public.user_favorite_deals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own recent deals"
  on public.user_recent_deals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users manage own price alerts"
  on public.price_drop_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "service writes click logs"
  on public.deal_click_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
