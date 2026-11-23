-- Daily lead discovery (admin Leads -> Prospects).
-- prospects: companies that passed qualification (score >= 70, real evidence link and signal date).
-- prospect_screened: every company domain the pipeline has looked at, so rejects are not re-scored daily.
-- prospect_runs: one row per discovery run, with its summary, and a guard against two runs at once.
-- Additive only: no existing table or column is changed.

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  company text not null,
  website text not null,
  domain text not null check (domain = lower(domain) and domain <> ''),
  industry text,
  location text,
  signal_kind text not null check (signal_kind in ('funding', 'hiring', 'launch', 'growth', 'workflow')),
  signal_summary text not null,
  signal_date date not null,
  evidence_url text not null check (evidence_url ~ '^https?://'),
  source text not null,
  potential_need text not null,
  service_fit jsonb not null default '[]'::jsonb,
  decision_maker_name text,
  decision_maker_role text,
  contact_route text,
  contact_email text,
  score integer not null check (score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  draft_subject text not null default '',
  draft_body text not null default '',
  status text not null default 'new'
    check (status in ('new', 'approved', 'contacted', 'replied', 'follow_up_due', 'rejected', 'won')),
  notes text,
  -- Email log row written when the prospect was emailed from /admin/email. No foreign key: the email log can
  -- fall back to the local store when Supabase is unavailable, and a send must never fail because of this link.
  email_log_id uuid,
  contacted_at timestamptz,
  run_id uuid
);

create unique index if not exists prospects_domain_key on public.prospects(domain);
create index if not exists prospects_status_idx on public.prospects(status);
create index if not exists prospects_created_at_idx on public.prospects(created_at desc);

create table if not exists public.prospect_screened (
  domain text primary key check (domain = lower(domain) and domain <> ''),
  company text,
  evidence_url text,
  verdict text not null check (verdict in ('saved', 'qualified_not_saved', 'rejected')),
  score integer,
  reason text,
  screened_at timestamptz not null default now()
);

create index if not exists prospect_screened_at_idx on public.prospect_screened(screened_at desc);

create table if not exists public.prospect_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('cron', 'manual')),
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  error text
);

create index if not exists prospect_runs_started_at_idx on public.prospect_runs(started_at desc);

-- At most one run in progress at a time (a stale one is closed by the app before it starts a new run).
create unique index if not exists prospect_runs_one_running on public.prospect_runs ((true)) where status = 'running';

create or replace function public.set_prospects_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_prospects_updated_at on public.prospects;
create trigger set_prospects_updated_at
before update on public.prospects
for each row execute function public.set_prospects_updated_at();

alter table public.prospects enable row level security;
alter table public.prospect_screened enable row level security;
alter table public.prospect_runs enable row level security;

-- Only the server (service role) reads or writes these tables; browser-facing roles get nothing.
revoke all on table public.prospects from anon, authenticated;
revoke all on table public.prospect_screened from anon, authenticated;
revoke all on table public.prospect_runs from anon, authenticated;
grant select, insert, update on table public.prospects to service_role;
grant select, insert, update on table public.prospect_screened to service_role;
grant select, insert, update on table public.prospect_runs to service_role;

notify pgrst, 'reload schema';
