create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.homepage_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  hero_eyebrow text not null,
  hero_title text not null,
  hero_description text not null,
  primary_cta_label text not null,
  primary_cta_href text not null,
  secondary_cta_label text not null,
  secondary_cta_href text not null,
  services jsonb not null default '[]'::jsonb,
  testimonials jsonb not null default '[]'::jsonb,
  stats jsonb not null default '[]'::jsonb,
  process jsonb not null default '[]'::jsonb,
  cta_title text not null,
  cta_description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  featured_image text,
  featured_image_attribution text,
  featured_image_source_url text,
  featured_image_license text,
  featured_image_license_url text,
  category text not null,
  tags jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  problem text not null,
  solution text not null,
  stack jsonb not null default '[]'::jsonb,
  screenshots jsonb not null default '[]'::jsonb,
  results text not null,
  featured boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  project_type text not null,
  budget text not null,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company_name text,
  email text not null,
  phone text,
  country text,
  budget text,
  timeline text,
  service_interested_in text not null,
  subject text,
  message text not null,
  preferred_contact_method text,
  website_url text,
  ip_address text,
  user_agent text,
  referrer text,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  status text not null default 'New',
  notes text,
  assigned_team_member text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_service_idx on public.leads(service_interested_in);
create index if not exists leads_created_at_idx on public.leads(created_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alt text not null,
  url text not null,
  storage_bucket text,
  storage_path text,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  detail text not null,
  created_at timestamptz not null default now()
);

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

grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.homepage_content,
  public.blog_posts,
  public.projects,
  public.messages,
  public.leads,
  public.media_assets,
  public.activity_logs,
  public.email_logs
to service_role;

alter table public.homepage_content enable row level security;
alter table public.blog_posts enable row level security;
alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.leads enable row level security;
alter table public.media_assets enable row level security;
alter table public.activity_logs enable row level security;
alter table public.email_logs enable row level security;

insert into storage.buckets (id, name, public)
values ('media-assets', 'media-assets', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "Public read media-assets" on storage.objects;
create policy "Public read media-assets"
on storage.objects
for select
to public
using (bucket_id = 'media-assets');

drop policy if exists "Service role insert media-assets" on storage.objects;
create policy "Service role insert media-assets"
on storage.objects
for insert
to service_role
with check (bucket_id = 'media-assets');

drop policy if exists "Service role update media-assets" on storage.objects;
create policy "Service role update media-assets"
on storage.objects
for update
to service_role
using (bucket_id = 'media-assets')
with check (bucket_id = 'media-assets');

drop policy if exists "Service role delete media-assets" on storage.objects;
create policy "Service role delete media-assets"
on storage.objects
for delete
to service_role
using (bucket_id = 'media-assets');

drop trigger if exists set_homepage_content_updated_at on public.homepage_content;
create trigger set_homepage_content_updated_at
before update on public.homepage_content
for each row execute function public.set_updated_at();

drop trigger if exists set_blog_posts_updated_at on public.blog_posts;
create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_leads_updated_at on public.leads;
create trigger set_leads_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
