-- Careers applications + customer journey tracking.
-- Additive and idempotent: safe to run more than once. No existing table is changed.
-- Row Level Security is enabled with NO policies, so only the server (service role) can read or write.

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_slug text not null,
  job_title text not null,
  full_name text not null,
  email text not null,
  phone text,
  location text,
  linkedin_url text,
  portfolio_url text,
  current_company text,
  years_experience text,
  notice_period text,
  expected_compensation text,
  cover_note text,
  resume_path text,
  resume_filename text,
  status text not null default 'new'
    check (status in ('new', 'reviewing', 'shortlisted', 'interview', 'offer', 'hired', 'rejected')),
  notes text,
  visitor_id text,
  session_key text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_created_idx on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx on public.job_applications (status);
create index if not exists job_applications_job_idx on public.job_applications (job_slug);

create table if not exists public.visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  visitor_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  entry_path text,
  exit_path text,
  landing_url text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  country text,
  region text,
  city text,
  device_type text,
  browser text,
  os text,
  ip_hash text,
  page_count integer not null default 0,
  event_count integer not null default 0,
  duration_seconds integer not null default 0,
  converted boolean not null default false,
  conversion_type text,
  is_returning boolean not null default false
);

create index if not exists visitor_sessions_started_idx on public.visitor_sessions (started_at desc);
create index if not exists visitor_sessions_visitor_idx on public.visitor_sessions (visitor_id);
create index if not exists visitor_sessions_converted_idx on public.visitor_sessions (converted) where converted;

create table if not exists public.visitor_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.visitor_sessions (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  type text not null,
  path text,
  title text,
  target text,
  href text,
  duration_ms integer,
  scroll_depth integer,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists visitor_events_session_idx on public.visitor_events (session_id, occurred_at);
create index if not exists visitor_events_type_idx on public.visitor_events (type, occurred_at desc);

alter table public.job_applications enable row level security;
alter table public.visitor_sessions enable row level security;
alter table public.visitor_events enable row level security;

-- Private bucket for résumés (the existing media bucket is public and must never hold them).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-applications',
  'job-applications',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
