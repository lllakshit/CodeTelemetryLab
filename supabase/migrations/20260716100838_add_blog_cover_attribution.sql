alter table public.blog_posts
  add column if not exists featured_image_attribution text,
  add column if not exists featured_image_source_url text,
  add column if not exists featured_image_license text,
  add column if not exists featured_image_license_url text;

notify pgrst, 'reload schema';
