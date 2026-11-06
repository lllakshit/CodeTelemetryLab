-- Outreach (personal email) module.
-- Sender accounts keep their Resend API key encrypted (AES-GCM, key derived from a server secret), so the
-- database alone never reveals a key. Messages keep the Resend id and the latest delivery status.
-- Also adds delivery-status columns to the existing admin email log. Additive: nothing is changed or removed.

create table if not exists public.outreach_accounts (
  id uuid primary key default gen_random_uuid(),
  from_email text not null unique check (from_email = lower(from_email)),
  display_name text not null,
  signature text not null default '',
  api_key_ciphertext text not null,
  api_key_last4 text not null,
  is_default boolean not null default false,
  source text not null default 'manual' check (source in ('manual', 'github')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one default sender.
create unique index if not exists outreach_accounts_one_default
  on public.outreach_accounts ((true)) where is_default;

create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.outreach_accounts(id) on delete restrict,
  from_email text not null,
  to_emails jsonb not null default '[]'::jsonb,
  cc jsonb not null default '[]'::jsonb,
  bcc jsonb not null default '[]'::jsonb,
  subject text not null,
  body text not null,
  signature text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  resend_id text,
  status text not null default 'queued',
  last_event text,
  last_event_at timestamptz,
  status_checked_at timestamptz,
  status_note text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists outreach_messages_created_at_idx on public.outreach_messages(created_at desc);
create index if not exists outreach_messages_status_idx on public.outreach_messages(status);
create index if not exists outreach_messages_resend_id_idx on public.outreach_messages(resend_id);

alter table public.outreach_accounts enable row level security;
alter table public.outreach_messages enable row level security;

-- Only the server (service role) reads or writes these tables; there are no public policies, and the
-- browser-facing roles get no table privileges at all.
revoke all on table public.outreach_accounts from anon, authenticated;
revoke all on table public.outreach_messages from anon, authenticated;
grant select, insert, update on table public.outreach_accounts to service_role;
grant select, insert, update on table public.outreach_messages to service_role;

-- Delivery status for the existing admin email log (polled from Resend).
alter table public.email_logs add column if not exists delivery_status text;
alter table public.email_logs add column if not exists last_event_at timestamptz;
alter table public.email_logs add column if not exists status_checked_at timestamptz;
alter table public.email_logs add column if not exists status_note text;
grant update on table public.email_logs to service_role;

-- Public bucket for attachments uploaded from the Outreach screen. Paths contain a random id, so a file is
-- only reachable by someone who has its link. No file size limit is set here (the project limit applies).
insert into storage.buckets (id, name, public)
values ('outreach-attachments', 'outreach-attachments', true)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
