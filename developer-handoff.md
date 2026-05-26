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
- media upload/delete UI
- contact form API
- Prisma schema for PostgreSQL
- file-backed CMS store for immediate local use

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
- `/admin/media`

### API routes

- `/api/auth/[...nextauth]`
- `/api/contact`
- `/api/media`

## 3) Current Tech Stack

- Next.js App Router
- React 19
- Tailwind CSS v4
- Framer Motion for minimal animation
- Auth.js / NextAuth
- Prisma schema for PostgreSQL
- file-backed CMS store for phase one

## 4) Current Design Direction

Design language:

- dark, premium, restrained
- blue/cyan accent only
- strong typography
- calm spacing
- structured cards and grids
- no loud gradients
- no fake futuristic visuals
- no cartoon SaaS aesthetic

The site should feel like a real engineering company, closer in tone to modern enterprise brands than a startup template.

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
- total messages
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

### Media library

The media library supports:

- upload image
- store asset metadata
- show previews
- delete assets

## 7) How Data Works Right Now

There are two data layers:

### A. File-backed CMS store

Current runtime source of truth:

- [`data/cms-store.json`](./data/cms-store.json)
- read/write helpers in [`src/lib/store.ts`](./src/lib/store.ts)
- content helpers in [`src/lib/cms.ts`](./src/lib/cms.ts)

This exists so the app can work immediately without waiting for a database.

### B. Prisma schema

Prisma is already defined in:

- [`prisma/schema.prisma`](./prisma/schema.prisma)

Models already exist for:

- homepage content
- blog posts
- projects
- messages
- media assets
- activity logs

Important note:

- the Prisma schema is ready
- the runtime CMS still uses the JSON store
- next phase should switch read/write functions to PostgreSQL once `DATABASE_URL` is wired in

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

## 9) How Contact and Media Work

### Contact form

The contact page posts to `/api/contact`.

That route:

- validates form input with Zod
- creates a message record in the CMS store
- redirects back to `/contact?sent=1`

### Media upload

The media page posts to `/api/media`.

That route:

- validates file and metadata
- writes the file to `public/uploads`
- records the asset in the CMS store
- redirects back to `/admin/media?uploaded=1`

## 10) How to Start Development

### Local setup

From the repository root:

```bash
npm install
npm run dev
```

If you need to run Prisma tooling:

```bash
npm run prisma:generate
npm run prisma:studio
```

### Environment variables

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `UPLOAD_DIR`

## 11) Development Workflow To Keep Consistency

When continuing work, follow this order:

1. inspect the current page or route
2. trace the content source in `src/lib/cms.ts` or `src/lib/store.ts`
3. update the data model first if needed
4. update the route or component
5. run lint
6. run build
7. verify the flow in a browser

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

## 13) Recommended Next Work

The next developer should probably do one of these:

### Option 1: Move CMS to PostgreSQL

Replace the JSON store in `src/lib/cms.ts` with Prisma-backed reads/writes.

### Option 2: Improve admin UX

Add:

- richer media picker
- markdown toolbar for blog content
- better validation and error states
- autosave or draft support

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
- [`src/app/(admin)/admin/actions.ts`](./src/app/(admin)/admin/actions.ts)
- [`src/lib/cms.ts`](./src/lib/cms.ts)
- [`src/lib/store.ts`](./src/lib/store.ts)
- [`src/auth.ts`](./src/auth.ts)
- [`prisma/schema.prisma`](./prisma/schema.prisma)

## 15) Current State Summary

As of this handoff:

- the site is already built and working locally
- the public pages render correctly
- the admin login and protected dashboard work
- lint and production build pass
- the next major milestone is switching persistence from the JSON store to Prisma/PostgreSQL

Keep the implementation disciplined. The main risk on this project is drifting into a generic template or adding unnecessary complexity before the core content workflow is stable.
