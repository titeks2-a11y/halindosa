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
  add column if not exists final_url text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists event_url text,
  add column if not exists link_type text not null default 'direct_purchase',
  add column if not exists availability text not null default 'active',
  add column if not exists validation_status text not null default 'passed',
  add column if not exists validation_reason text not null default 'seed_verified',
  add column if not exists last_checked_at timestamptz not null default now(),
  add column if not exists priority_score integer not null default 0,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists click_count integer not null default 0,
  add column if not exists like_count integer not null default 0,
  add column if not exists is_sold_out boolean not null default false;

create index if not exists deals_visibility_quality_idx
  on public.deals (is_hidden, availability, validation_status, priority_score desc);

create index if not exists deals_link_type_idx on public.deals (link_type);
create index if not exists deals_last_checked_at_idx on public.deals (last_checked_at desc);

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

comment on table public.user_profiles is '할인도사 회원 프로필과 관심 카테고리/수신 동의 설정. OAuth/이메일 가입 공통 사용.';

create table if not exists public.user_favorite_deals (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

comment on table public.user_favorite_deals is '로그인 사용자의 찜한 특가. 앱 localStorage 찜은 로그인 후 이 테이블로 마이그레이션한다.';

create table if not exists public.user_recent_deals (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

comment on table public.user_recent_deals is '로그인 사용자의 최근 본 상품. 중복 deal_id는 viewed_at 갱신으로 최신순 정렬한다.';

create table if not exists public.deal_click_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  deal_id text not null,
  from_page text not null default 'unknown',
  final_purchase_url text not null,
  created_at timestamptz not null default now()
);

comment on table public.deal_click_logs is '구매 이동 클릭 로그. 회원 탈퇴 시 user_id는 null로 익명화한다.';

create table if not exists public.deal_validation_logs (
  id uuid primary key default gen_random_uuid(),
  deal_id text references public.deals(id) on delete cascade,
  provider text not null default 'manual',
  checked_url text not null,
  final_url text,
  http_status integer,
  redirect_count integer not null default 0,
  link_type text not null default 'direct_purchase',
  availability text not null default 'unknown',
  validation_status text not null default 'needs_review',
  validation_reason text not null default '',
  response_excerpt text,
  checked_at timestamptz not null default now()
);

comment on table public.deal_validation_logs is '상품 링크 검증 로그. 검색/품절/오류/리다이렉트 결과를 기록해 관리자 숨김과 재검증 근거로 사용한다.';

create index if not exists deal_validation_logs_deal_idx on public.deal_validation_logs (deal_id, checked_at desc);
create index if not exists deal_validation_logs_status_idx on public.deal_validation_logs (validation_status, availability);

create table if not exists public.provider_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  mode text not null default 'manual',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer not null default 0,
  normalized_count integer not null default 0,
  visible_count integer not null default 0,
  hidden_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  report jsonb not null default '{}'
);

comment on table public.provider_runs is 'Coupang/Naver/11st/Event/Manual provider 수집 실행 이력. refresh:deals 결과를 운영 DB에 영구 저장할 때 사용한다.';

create index if not exists provider_runs_provider_started_idx on public.provider_runs (provider, started_at desc);

create table if not exists public.deal_engagement_rollups (
  deal_id text primary key references public.deals(id) on delete cascade,
  click_count integer not null default 0,
  favorite_count integer not null default 0,
  recent_click_count integer not null default 0,
  recent_favorite_count integer not null default 0,
  category_rank integer,
  overall_rank integer,
  ranking_score numeric not null default 0,
  refreshed_at timestamptz not null default now()
);

comment on table public.deal_engagement_rollups is '찜/클릭 기반 인기 특가 집계. 홈 인기 특가, 카테고리별 인기, 최근 인기 특가 랭킹을 재배포와 무관하게 유지한다.';

create index if not exists deal_engagement_rollups_score_idx
  on public.deal_engagement_rollups (ranking_score desc, refreshed_at desc);

create index if not exists deal_engagement_rollups_category_rank_idx
  on public.deal_engagement_rollups (category_rank, overall_rank);

create table if not exists public.deal_popularity_snapshots (
  id uuid primary key default gen_random_uuid(),
  deal_id text references public.deals(id) on delete cascade,
  snapshot_date date not null default current_date,
  click_count integer not null default 0,
  favorite_count integer not null default 0,
  rank_position integer,
  category text,
  created_at timestamptz not null default now(),
  unique (deal_id, snapshot_date)
);

comment on table public.deal_popularity_snapshots is '일별 인기 특가 스냅샷. 어제 대비 급상승, 주간 인기, 카테고리별 랭킹 계산에 사용한다.';

create index if not exists deal_popularity_snapshots_date_idx
  on public.deal_popularity_snapshots (snapshot_date desc, rank_position);

create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  deal_id text references public.deals(id) on delete set null,
  before_state jsonb not null default '{}',
  after_state jsonb not null default '{}',
  reason text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.admin_actions is '관리자 숨김/복구/수정/재검증 액션 감사 로그. 클라이언트에는 공개하지 않고 service_role 서버 액션만 기록한다.';

create index if not exists admin_actions_created_idx on public.admin_actions (created_at desc);
create index if not exists admin_actions_deal_idx on public.admin_actions (deal_id, created_at desc);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text,
  fcm_token text,
  platform text not null default 'web',
  interest_categories text[] not null default '{}',
  alert_types text[] not null default '{}',
  enabled boolean not null default true,
  consent_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_subscriptions is '향후 FCM/Web Push 알림 구독. 실제 발송은 사용자 동의와 서버 FCM 설정이 완료된 뒤 활성화한다.';

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id, enabled);
create index if not exists push_subscriptions_platform_idx on public.push_subscriptions (platform, enabled);

create table if not exists public.push_notification_queue (
  id uuid primary key default gen_random_uuid(),
  deal_id text references public.deals(id) on delete set null,
  benefit_id text,
  source_kind text not null default 'product_deal',
  campaign_id text,
  alert_type text not null,
  title text not null,
  body text not null,
  target_categories text[] not null default '{}',
  source_names text[] not null default '{}',
  target_user_ids uuid[] not null default '{}',
  target_segments text[] not null default '{}',
  status text not null default 'queued',
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  failure_reason text,
  dry_run_only boolean not null default true,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_notification_queue is '특가 등록, 공식 무료 이벤트, 가격 인하, 품절 임박, 관심 카테고리 알림 발송 큐. FCM 서버 키와 사용자 동의가 준비된 뒤 service_role 작업자가 dry_run_only=false 행만 처리한다.';

create index if not exists push_notification_queue_status_idx
  on public.push_notification_queue (status, scheduled_at);

create index if not exists push_notification_queue_deal_idx
  on public.push_notification_queue (deal_id, created_at desc);

create index if not exists push_notification_queue_benefit_idx
  on public.push_notification_queue (benefit_id, created_at desc);

create index if not exists push_notification_queue_campaign_idx
  on public.push_notification_queue (campaign_id, scheduled_at desc);

create table if not exists public.push_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid references public.push_notification_queue(id) on delete set null,
  campaign_id text,
  deal_id text,
  benefit_id text,
  source_kind text not null default 'product_deal',
  alert_type text not null,
  delivery_mode text not null default 'dry_run',
  delivery_status text not null,
  priority text not null default 'medium',
  token_count integer not null default 0,
  attempted_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  confirmed_consent boolean not null default false,
  blocked_reasons text[] not null default '{}',
  policy_warnings text[] not null default '{}',
  next_allowed_at timestamptz,
  provider_message text not null default '',
  request_id text,
  created_at timestamptz not null default now()
);

comment on table public.push_delivery_logs is 'FCM/Web Push dry-run 및 실제 발송 시도 감사 로그. 토큰 원문은 저장하지 않고 대상 수, 차단 사유, 정책 판단, 결과만 service_role 서버 액션이 기록한다.';

create index if not exists push_delivery_logs_campaign_idx
  on public.push_delivery_logs (campaign_id, created_at desc);

create index if not exists push_delivery_logs_status_idx
  on public.push_delivery_logs (delivery_status, created_at desc);

create index if not exists push_delivery_logs_queue_idx
  on public.push_delivery_logs (queue_id, created_at desc);

create table if not exists public.price_drop_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id text not null,
  target_price integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.price_drop_alerts is '가격 하락 알림 준비 테이블. 실제 푸시 권한 요청 전까지 서버 저장 구조만 제공한다.';

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
alter table public.deal_validation_logs enable row level security;
alter table public.provider_runs enable row level security;
alter table public.deal_engagement_rollups enable row level security;
alter table public.deal_popularity_snapshots enable row level security;
alter table public.admin_actions enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.push_notification_queue enable row level security;
alter table public.push_delivery_logs enable row level security;

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

create policy "users insert own click logs"
  on public.deal_click_logs for insert
  with check (auth.uid() = user_id);

create policy "service manages validation logs"
  on public.deal_validation_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service manages provider runs"
  on public.provider_runs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "public read engagement rollups"
  on public.deal_engagement_rollups for select
  using (true);

create policy "service manages engagement rollups"
  on public.deal_engagement_rollups for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "public read popularity snapshots"
  on public.deal_popularity_snapshots for select
  using (true);

create policy "service manages popularity snapshots"
  on public.deal_popularity_snapshots for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service manages admin actions"
  on public.admin_actions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "users manage own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "service manages push subscriptions"
  on public.push_subscriptions for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service manages push notification queue"
  on public.push_notification_queue for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "service manages push delivery logs"
  on public.push_delivery_logs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- 회원 탈퇴 운영 기준:
-- 1. 클라이언트는 service_role을 절대 보유하지 않는다.
-- 2. /api/account/delete 서버 라우트가 Authorization Bearer 토큰으로 본인 확인 후 service_role로 아래 순서 처리:
--    user_favorite_deals 삭제, user_recent_deals 삭제, price_drop_alerts 삭제, user_profiles 삭제,
--    deal_click_logs.user_id null 익명화, auth.users 삭제.
-- 3. favorites/recent_views라는 명칭이 필요한 외부 리포트 도구는 아래 호환 View를 사용할 수 있다.

create or replace view public.favorites as
select user_id, deal_id, created_at
from public.user_favorite_deals;

create or replace view public.recent_views as
select user_id, deal_id, viewed_at
from public.user_recent_deals;
