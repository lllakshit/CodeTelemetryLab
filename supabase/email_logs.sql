-- Internal outbound email logs (admin Email module)
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  cc jsonb not null default '[]'::jsonb,
  bcc jsonb not null default '[]'::jsonb,
  subject text not null,
  body text not null,
  status text not null,
  error_message text,
  resend_id text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_created_at_idx on public.email_logs(created_at desc);
create index if not exists email_logs_status_idx on public.email_logs(status);

grant select, insert on table public.email_logs to service_role;

alter table public.email_logs enable row level security;

notify pgrst, 'reload schema';
