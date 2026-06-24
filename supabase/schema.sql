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
