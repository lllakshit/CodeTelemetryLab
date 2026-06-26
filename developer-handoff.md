# CodeTelemetryLabs Developer Handoff

This document is the working guide for the next developer, including Codex, who will continue the CodeTelemetryLabs build.

## 1) Product Goal

CodeTelemetryLabs is a premium, trustworthy, enterprise-style software agency website for USA and Canada clients.

The product is not meant to feel like a generic AI landing page. The target is a calm, structured, engineering-first site that can later grow into:

- a client portal
- an agency operating system
- a SaaS-style platform
- a content-driven marketing site with a real admin workflow

The first milestone is the foundation, not visual perfection.

## 2) What Is Already Implemented

The repository already includes a working Phase 1 foundation:

- public frontend pages
- protected admin area
- login with Auth.js / NextAuth
- blog CRUD
- project CRUD
- homepage CMS editing
- lead capture and lead management
- media upload/delete UI
- contact form API
- SEO routes for sitemap, robots, and RSS/feed
- Prisma schema for PostgreSQL
- Supabase-ready CMS layer with a file-backed store fallback for immediate local use

### Public pages

- `/`
- `/services`
- `/projects`
- `/projects/[slug]`
- `/about`
- `/blog`
- `/blog/[slug]`
- `/contact`

### Admin pages

- `/admin/login`
- `/admin/dashboard`
- `/admin/blogs`
- `/admin/blogs/new`
- `/admin/blogs/[id]`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/projects/[id]`
- `/admin/homepage`
- `/admin/leads`
- `/admin/media`

### API routes

- `/api/auth/[...nextauth]`
- `/api/contact`
- `/api/leads`
- `/api/leads/[id]`
- `/api/leads/export`
- `/api/media`

## 3) Current Tech Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- Framer Motion for minimal animation
- Auth.js / NextAuth
- Prisma schema for PostgreSQL
- Supabase admin client support with JSON fallback
- Zod validation for contact and lead capture

## 4) Current Design Direction

Design language:

- light, premium, restrained
- blue/cyan accent only
- strong typography
- calm spacing
- structured cards and grids
- subtle technical/blueprint visual language
- no loud gradients
- no fake futuristic visuals
- no cartoon SaaS aesthetic

The site should feel like a real engineering company, closer in tone to modern enterprise brands than a startup template.

Important current design note:

- the public site was refreshed to a light professional frontend direction
- the admin has also been moved away from the old dark theme
- the admin should feel like a clean backend management workspace, visually consistent with the public site but optimized for editing, review, and operations
- public-facing pages should not expose links or references to the admin area

## 5) What the Frontend Is Doing

The public site is built around a single shared shell:

- [`src/app/(site)/layout.tsx`](./src/app/(site)/layout.tsx) wraps the public pages
- [`src/components/site-header.tsx`](./src/components/site-header.tsx) renders navigation
- [`src/components/site-footer.tsx`](./src/components/site-footer.tsx) renders the footer
- [`src/app/globals.css`](./src/app/globals.css) defines the visual system

The homepage is the main narrative page. It includes:

- hero
- services
- why choose us
- case studies
- process
- testimonials
- CTA
- recent blog content

The page content is driven from the CMS layer, not hard-coded inline.

## 6) What the Admin Is Doing

The admin area is a protected operations surface, not an afterthought.

### Dashboard

The dashboard shows:

- total blogs
- total projects
- total leads/messages
- recent activity

### Blog management

The blog admin supports:

- create
- edit
- delete
- publish / unpublish
- SEO fields
- tags
- featured image URL
- MDX-ready content body

### Project management

The project admin supports:

- create
- edit
- delete
- stack list
- screenshot URLs
- featured flag
- publish flag
- problem / solution / results fields

### Homepage CMS

The homepage editor supports:

- hero eyebrow
- hero title
- hero description
- CTA labels and links
- services
- testimonials
- stats
- process steps
- CTA section copy

The current admin editor stores repeating content as line-based text input to keep phase one simple and predictable.

### Lead management

The admin lead workspace supports:

- listing captured inquiries
- filtering by search, status, service, and date range
- updating lead status
- assigning an internal owner
- saving internal notes
- deleting/archiving leads
- CSV export

Lead management files to know first:

- [`src/app/(admin)/admin/leads/page.tsx`](./src/app/(admin)/admin/leads/page.tsx)
- [`src/app/api/leads/route.ts`](./src/app/api/leads/route.ts)
- [`src/app/api/leads/[id]/route.ts`](./src/app/api/leads/[id]/route.ts)
- [`src/app/api/leads/export/route.ts`](./src/app/api/leads/export/route.ts)
- [`src/lib/lead-capture.ts`](./src/lib/lead-capture.ts)

### Media library

The media library supports:

- upload image
- store asset metadata
- show previews
- delete assets

## 7) How Data Works Right Now

There are two data layers:

### A. Supabase-ready CMS layer

The main read/write facade is:

- [`src/lib/cms.ts`](./src/lib/cms.ts)

It can use Supabase tables when Supabase environment variables are configured. If Supabase is missing or required tables are unavailable locally, it falls back to the JSON store.

Supabase schema is in:

- [`supabase/schema.sql`](./supabase/schema.sql)

### B. File-backed CMS store

Current local fallback source of truth:

- [`data/cms-store.json`](./data/cms-store.json)
- read/write helpers in [`src/lib/store.ts`](./src/lib/store.ts)
- content helpers in [`src/lib/cms.ts`](./src/lib/cms.ts)

This exists so the app can work immediately without waiting for a database.

### C. Prisma schema

Prisma is already defined in:

- [`prisma/schema.prisma`](./prisma/schema.prisma)

Models already exist for:

- homepage content
- blog posts
- projects
- messages
- leads
- media assets
- activity logs

Important note:

- the Prisma schema is ready
- the runtime CMS facade currently supports Supabase first and JSON fallback
- next phase should make the production database choice explicit and remove ambiguity between Prisma/PostgreSQL and Supabase if needed

## 8) Authentication and Admin Access

Auth.js is configured in:

- [`src/auth.ts`](./src/auth.ts)

Current behavior:

- credentials provider
- admin-only access
- `/admin/*` is protected via [`src/proxy.ts`](./src/proxy.ts)
- local dev fallback credentials exist if env vars are missing

Local fallback values in dev:

- email: `admin@codetelemetrylabs.com`
- password: `admin1234`

Production should always use real environment variables:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXTAUTH_SECRET`

Production site URL:

- set `NEXT_PUBLIC_SITE_URL` and `NEXTAUTH_URL` to the primary custom domain in Vercel
- do not hardcode `vercel.app` in metadata or canonical URLs

Local test URLs:

- public site: `http://localhost:3000`
- admin login: `http://localhost:3000/admin/login`
- admin dashboard after login: `http://localhost:3000/admin/dashboard`

## 9) How Contact and Media Work

### Contact form

The contact page posts to `/api/contact`.

That route:

- validates form input with Zod
- creates a lead record and mirrored legacy message record through the CMS layer
- can send an inbox notification when Resend env vars are configured
- redirects back to `/contact?sent=1`
- redirects browser validation failures back to `/contact?error=invalid` instead of exposing raw JSON

Contact capture details:

- parser and payload mapping live in [`src/lib/lead-capture.ts`](./src/lib/lead-capture.ts)
- optional blank fields are normalized before validation
- missing service falls back to `General project inquiry`
- name, email, and message are still required for a useful lead

### Media upload

The media page posts to `/api/media`.

That route:

- validates file and metadata
- writes to Supabase Storage in production
- falls back to local `public/uploads` only during local development
- records the asset in the CMS store
- redirects back to `/admin/media?uploaded=1`

Production media uploads require:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- a public `media-assets` bucket in Supabase

If uploads fail on Vercel, check the function logs first. The most common failure is an incomplete storage config rather than a UI issue.

## 10) How to Start Development

### Local setup

From the repository root:

```bash
npm install
npm run dev
npm run cms:sync
```

If you need to run Prisma tooling:

```bash
npm run prisma:generate
npm run prisma:studio
```

### Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SITE_URL` to the primary custom domain
- `NEXTAUTH_URL` to the same production domain in Vercel and `http://localhost:3000` locally
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `CONTACT_NOTIFICATION_FROM`
- `CONTACT_NOTIFICATION_TO`

Keep `SUPABASE_URL` / `SUPABASE_ANON_KEY` aliases in sync only if a deployment already depends on them.

Recommended production contact inbox:

- `CONTACT_NOTIFICATION_TO=contact@codetelemetrylab.me`

## 11) Development Workflow To Keep Consistency

When continuing work, follow this order:

1. inspect the current page or route
2. trace the content source in `src/lib/cms.ts` or `src/lib/store.ts`
3. update the data model first if needed
4. update the route or component
5. run lint
6. run build
7. verify the flow in a browser

For contact/lead work specifically:

1. submit `/contact` through the actual browser form
2. verify redirect to `/contact?sent=1`
3. verify the new inquiry appears in `/admin/leads`
4. remove any test leads from `data/cms-store.json` or the active database after verification

Do not jump straight into visual changes without checking whether the data model or admin workflow needs to change too.

## 12) Working Rules For Codex

When Codex continues this repo, it should stay consistent with these rules:

- keep the tone premium and restrained
- avoid fake stats or inflated claims
- do not add flashy motion unless it serves clarity
- prefer Server Components unless interactivity is required
- keep `'use client'` scoped as narrowly as possible
- keep admin forms simple and predictable
- revalidate routes after mutations
- avoid duplicating content between components and data sources
- keep all public pages free of visible admin links or admin references
- make admin pages mobile responsive, especially forms, filters, tables/cards, and action panels

## 13) Recommended Next Work

The next developer should probably do one of these:

### Option 1: Finalize production persistence

Choose and document the production persistence path clearly. The code currently has Prisma schema, Supabase schema/client support, and JSON fallback. Avoid running two database strategies indefinitely.

### Option 2: Improve admin UX

Add:

- richer media picker
- markdown toolbar for blog content
- better validation and error states
- autosave or draft support
- richer lead timeline/history and assignment workflow

### Option 3: Refine public pages

Improve:

- project detail visuals
- blog detail typography
- contact page trust cues
- homepage visual polish

### Option 4: Add real content workflow

Add:

- drafts and scheduled publishing
- activity log UI
- SEO preview in admin
- richer image metadata

## 14) Key Files To Know First

- [`src/app/(site)/page.tsx`](./src/app/(site)/page.tsx)
- [`src/app/(site)/services/page.tsx`](./src/app/(site)/services/page.tsx)
- [`src/app/(site)/projects/page.tsx`](./src/app/(site)/projects/page.tsx)
- [`src/app/(site)/blog/page.tsx`](./src/app/(site)/blog/page.tsx)
- [`src/app/(site)/contact/page.tsx`](./src/app/(site)/contact/page.tsx)
- [`src/app/(admin)/admin/dashboard/page.tsx`](./src/app/(admin)/admin/dashboard/page.tsx)
- [`src/app/(admin)/admin/leads/page.tsx`](./src/app/(admin)/admin/leads/page.tsx)
- [`src/app/(admin)/admin/actions.ts`](./src/app/(admin)/admin/actions.ts)
- [`src/app/api/contact/route.ts`](./src/app/api/contact/route.ts)
- [`src/app/api/leads/route.ts`](./src/app/api/leads/route.ts)
- [`src/lib/lead-capture.ts`](./src/lib/lead-capture.ts)
- [`src/lib/cms.ts`](./src/lib/cms.ts)
- [`src/lib/store.ts`](./src/lib/store.ts)
- [`src/lib/admin-ui.ts`](./src/lib/admin-ui.ts)
- [`src/auth.ts`](./src/auth.ts)
- [`prisma/schema.prisma`](./prisma/schema.prisma)
- [`supabase/schema.sql`](./supabase/schema.sql)

## 15) Current State Summary

As of this handoff:

- the site is already built and working locally
- the public pages render correctly
- the admin login and protected dashboard work
- the admin theme has been refreshed to match the light public-site direction
- the Leads admin page is implemented and responsive across mobile/tablet/desktop
- public-facing admin references have been removed from the frontend navigation/footer scan
- contact form submissions have been verified through the real browser form and create backend leads
- invalid browser contact submissions redirect to `/contact?error=invalid` with a friendly page message
- lint and production build pass
- the next major milestone is finalizing the production persistence strategy and deploying with real environment variables

Keep the implementation disciplined. The main risk on this project is drifting into a generic template or adding unnecessary complexity before the core content workflow is stable.

## 16) Latest Verification Notes

Most recent local verification completed on June 26, 2026:

- `npm run lint` passed
- `npm run build` passed
- `http://localhost:3000/contact` returned HTTP 200
- real browser contact submission redirected to `/contact?sent=1`
- backend lead count increased during contact-form verification
- temporary Codex/Playwright test leads were removed after verification
- responsive overflow audit across public and admin routes at mobile, tablet, and desktop widths returned no horizontal overflow issues

Local URLs currently useful for QA:

- public contact form: `http://localhost:3000/contact`
- admin leads: `http://localhost:3000/admin/leads`
