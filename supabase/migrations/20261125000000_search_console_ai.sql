-- Google Search Console connection + synced data, and the admin AI assistant (threads, messages, proposed changes).
-- Additive only: no existing table or column is changed. Every table is server-only: RLS on, no policies, so only the
-- service role (used by the Next.js server) can read or write them.

-- One row: the connected Google account. The refresh token is AES-256-GCM encrypted by the app before it is stored.
create table if not exists public.gsc_connection (
  id smallint primary key default 1 check (id = 1),
  google_email text,
  refresh_token_enc text not null,
  scope text not null default '',
  site_url text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sync_started_at timestamptz,
  last_sync_at timestamptz,
  last_sync_status text check (last_sync_status in ('ok', 'error')),
  last_sync_error text,
  last_sync_summary jsonb not null default '{}'::jsonb,
  data_from date,
  data_to date
);

-- Daily totals and breakdowns. kind = 'total' (key ''), 'country' (ISO-3166 alpha-3, lower case) or 'device'.
create table if not exists public.gsc_daily (
  site_url text not null,
  date date not null,
  kind text not null check (kind in ('total', 'country', 'device')),
  key text not null default '',
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr double precision not null default 0,
  position double precision not null default 0,
  primary key (site_url, date, kind, key)
);

-- Query x page x day. Google leaves out anonymised queries here, so totals come from gsc_daily, not from this table.
create table if not exists public.gsc_query_page (
  site_url text not null,
  date date not null,
  query text not null,
  page text not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr double precision not null default 0,
  position double precision not null default 0,
  primary key (site_url, date, query, page)
);
create index if not exists gsc_query_page_site_date_idx on public.gsc_query_page (site_url, date desc);
create index if not exists gsc_query_page_page_idx on public.gsc_query_page (site_url, page);

-- AI assistant: saved threads. summary holds a running summary of older messages so long threads keep their context.
create table if not exists public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New chat',
  summary text not null default '',
  summarized_through timestamptz,
  pinned boolean not null default false,
  archived boolean not null default false,
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ai_threads_updated_idx on public.ai_threads (archived, pinned desc, updated_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.ai_threads (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (octet_length(content) <= 200000),
  -- Tools the assistant ran to answer: [{ name, args, ok, preview }]. Shown under the answer; not replayed to the model.
  tool_calls jsonb not null default '[]'::jsonb,
  model text,
  tokens integer,
  created_at timestamptz not null default now()
);
create index if not exists ai_messages_thread_idx on public.ai_messages (thread_id, created_at);

-- Changes the assistant proposes (SEO title/description, lead or application status). Nothing is changed until the
-- admin presses Apply on the screen.
create table if not exists public.ai_actions (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references public.ai_threads (id) on delete cascade,
  message_id uuid references public.ai_messages (id) on delete set null,
  kind text not null check (kind in ('blog_seo', 'lead_update', 'application_update')),
  target_id text not null,
  target_label text not null default '',
  before jsonb not null default '{}'::jsonb,
  after jsonb not null,
  reason text not null default '',
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists ai_actions_thread_idx on public.ai_actions (thread_id, created_at);

alter table public.gsc_connection enable row level security;
alter table public.gsc_daily enable row level security;
alter table public.gsc_query_page enable row level security;
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_actions enable row level security;

-- Report functions (aggregate in the database, so reports are not cut by the API's 1,000-row page limit).
-- Called with the service role only; execute is revoked from the public roles.

-- Search Console totals by query, page, or query+page over a period. Position is impression-weighted.
create or replace function public.gsc_report(
  p_site text, p_from date, p_to date, p_group text, p_limit integer default 50,
  p_order text default 'clicks', p_page text default null, p_query text default null, p_min_impressions integer default 0
) returns table (query text, page text, clicks bigint, impressions bigint, ctr double precision, avg_position double precision)
language sql stable set search_path = public as $$
  select
    case when p_group in ('query', 'query_page') then q.query end,
    case when p_group in ('page', 'query_page') then q.page end,
    sum(q.clicks)::bigint,
    sum(q.impressions)::bigint,
    case when sum(q.impressions) > 0 then sum(q.clicks)::double precision / sum(q.impressions) else 0 end,
    case when sum(q.impressions) > 0 then sum(q.position * q.impressions) / sum(q.impressions) else 0 end
  from public.gsc_query_page q
  where q.site_url = p_site and q.date between p_from and p_to
    and (p_page is null or q.page ilike '%' || p_page || '%')
    and (p_query is null or q.query ilike '%' || p_query || '%')
  group by 1, 2
  having sum(q.impressions) >= greatest(p_min_impressions, 0)
  order by
    case when p_order = 'impressions' then sum(q.impressions) else sum(q.clicks) end desc,
    sum(q.impressions) desc
  limit least(greatest(p_limit, 1), 500)
$$;

-- Country or device totals over a period.
create or replace function public.gsc_breakdown(p_site text, p_from date, p_to date, p_kind text, p_limit integer default 20)
returns table (key text, clicks bigint, impressions bigint, ctr double precision, avg_position double precision)
language sql stable set search_path = public as $$
  select d.key, sum(d.clicks)::bigint, sum(d.impressions)::bigint,
    case when sum(d.impressions) > 0 then sum(d.clicks)::double precision / sum(d.impressions) else 0 end,
    case when sum(d.impressions) > 0 then sum(d.position * d.impressions) / sum(d.impressions) else 0 end
  from public.gsc_daily d
  where d.site_url = p_site and d.date between p_from and p_to and d.kind = p_kind
  group by 1 order by 2 desc, 3 desc limit least(greatest(p_limit, 1), 100)
$$;

-- Traffic source label: UTM source, else the referring host (ignoring the site itself and localhost), else fallback.
create or replace function public.ai_source(p_utm text, p_referrer text, p_fallback text default 'direct')
returns text language sql immutable set search_path = public as $$
  select coalesce(
    nullif(trim(p_utm), ''),
    nullif(case when h is null or h ~ '(^|\.)codetelemetrylabs?\.me$' or h ~ '^(localhost|127\.0\.0\.1)(:|$)' or h ~ '\.vercel\.app$' then null else h end, ''),
    nullif(trim(p_fallback), ''),
    'direct')
  from (select lower(regexp_replace(substring(p_referrer from '^https?://([^/?#]+)'), '^www\.', '')) as h) x
$$;

-- Website visits by source (UTM source, else referring host, else direct) with conversions.
create or replace function public.ai_traffic_sources(p_since timestamptz, p_limit integer default 25)
returns table (source text, sessions bigint, converted bigint, avg_pages double precision, avg_seconds double precision, top_entry text)
language sql stable set search_path = public as $$
  with s as (
    select public.ai_source(s.utm_source, s.referrer) as source,
      s.converted, s.page_count, s.duration_seconds, s.entry_path
    from public.visitor_sessions s where s.started_at >= p_since
  )
  select source, count(*)::bigint, count(*) filter (where converted)::bigint,
    avg(page_count)::double precision, avg(duration_seconds)::double precision,
    mode() within group (order by entry_path)
  from s group by 1 order by 2 desc limit least(greatest(p_limit, 1), 100)
$$;

-- Most viewed pages on the site (tracked page views) with average time on page.
create or replace function public.ai_top_paths(p_since timestamptz, p_limit integer default 25)
returns table (path text, views bigint, visitors bigint, avg_ms double precision)
language sql stable set search_path = public as $$
  select e.path, count(*) filter (where e.type = 'pageview')::bigint, count(distinct e.session_id)::bigint,
    avg(e.duration_ms) filter (where e.type = 'exit')::double precision
  from public.visitor_events e
  where e.occurred_at >= p_since and e.path is not null
  group by 1 having count(*) filter (where e.type = 'pageview') > 0
  order by 2 desc limit least(greatest(p_limit, 1), 100)
$$;

-- Leads and job applications by source and status for a period.
create or replace function public.ai_inbound_breakdown(p_since timestamptz)
returns table (kind text, source text, status text, total bigint)
language sql stable set search_path = public as $$
  select 'lead', public.ai_source(l.utm_source, l.referrer, l.source), coalesce(l.status, 'New'), count(*)::bigint
  from public.leads l where l.created_at >= p_since group by 1, 2, 3
  union all
  -- Applications: the source of the visit that led to the application when it was tracked, else the form's own data.
  select 'application', public.ai_source(coalesce(a.utm_source, vs.utm_source), coalesce(vs.referrer, a.referrer)), coalesce(a.status, 'new'), count(*)::bigint
  from public.job_applications a
  left join public.visitor_sessions vs on vs.session_key = a.session_key
  where a.created_at >= p_since group by 1, 2, 3
  order by 4 desc
$$;

revoke all on function public.ai_source(text, text, text) from public, anon, authenticated;
revoke all on function public.gsc_report(text, date, date, text, integer, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.gsc_breakdown(text, date, date, text, integer) from public, anon, authenticated;
revoke all on function public.ai_traffic_sources(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.ai_top_paths(timestamptz, integer) from public, anon, authenticated;
revoke all on function public.ai_inbound_breakdown(timestamptz) from public, anon, authenticated;
grant execute on function public.ai_source(text, text, text) to service_role;
grant execute on function public.gsc_report(text, date, date, text, integer, text, text, text, integer) to service_role;
grant execute on function public.gsc_breakdown(text, date, date, text, integer) to service_role;
grant execute on function public.ai_traffic_sources(timestamptz, integer) to service_role;
grant execute on function public.ai_top_paths(timestamptz, integer) to service_role;
grant execute on function public.ai_inbound_breakdown(timestamptz) to service_role;
