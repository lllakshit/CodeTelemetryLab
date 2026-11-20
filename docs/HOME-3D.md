# Home page — 3D layout

The home page (`src/app/(site)/page.tsx`) is a normal server-rendered page with a 3D scene behind it. Every word, heading and link is HTML; the scene only decorates and animates it.

## How it works

| Piece | File | Job |
|---|---|---|
| Page and content | `src/app/(site)/page.tsx` | Server component. Reads the CMS, renders all sections. |
| Styles | `src/components/home3d/home-3d.css` | Everything scoped under `.h3d`. Pinned scroll layout, phone layout, plain layout. |
| Loader | `src/components/home3d/home-3d.tsx` | Client. Adds the canvas, then loads the scene after `load` and idle. |
| Scenes | `src/components/home3d/home-scene.ts` | three.js (r128, pinned). Six scenes, scrubbed by scroll. Loaded only on demand. |
| Section navigation | `src/components/home3d/scene-nav.tsx` | Desktop dots; phone dock and "More" sheet. |
| Shared data | `src/components/home3d/home-data.ts` | Section ids, service labels and icons. |

Scenes (scroll order): 0 hero + who we help, 1 services, 2 process + technologies, 3 selected work, 4 why + FAQ, 5 next step. Notes and the footer sit outside the 3D layer.

## Layout modes

The wrapper carries `data-h3d`:

- `pending` — server default. Same pinned layout as `on`, so nothing shifts when the scene arrives.
- `on` — scene running.
- `static` — no 3D. Plain stacked layout, every section open, dashboard image and process diagram shown. Chosen **before first paint** for `prefers-reduced-motion`, data saver, devices with 2 GB or less memory, or no WebGL, and as a fallback if the scene fails to start.

## Content: what comes from where

| Section | Source |
|---|---|
| Hero stats (3 cards), final call to action title and text | CMS homepage record (`getHomeContent`) |
| Selected work (up to 3 featured projects) | CMS projects marked **featured** and published |
| Notes (3 latest posts) | CMS blog posts that are published |
| Services list | `seoServices` in `src/lib/seo-markets.ts` (names, links, descriptions) |
| Hero heading and text, audiences, technologies, FAQ, why-us text, process steps | Written in `page.tsx` / `engineering-diagrams.tsx` |

Saving a blog post, a project or the homepage record in the admin refreshes `/` (`revalidatePath("/")`), so these sections update without a deploy.

**Known gap:** the admin "Homepage" form also has hero title, hero text, button labels, services, testimonials and process fields that this page does not read. Editing them has no effect on the live page. Either remove those fields from the form or wire the page to them after the CMS values are set to the live wording.

## Adding or changing things

- **Add a featured project:** mark it featured in the admin. The 3D carousel and the phone list adapt to 1–3 (or more) cards.
- **Change service labels or icons:** `serviceMeta` in `home-data.ts`. Icons are indexes 0–5 of the drawn glyphs in `home-scene.ts` (`glyphTexture`).
- **Add a section:** add the markup with an `id`, add it to `homeSections` and to one entry of `homeStops` in `home-data.ts`, and give it a `data-scene` number if it should belong to a scene. `tests/home3d/home-data.test.ts` fails if these drift apart.
- **Change copy:** edit `page.tsx`. Keep exactly one `h1`, and keep the title, description, canonical and JSON-LD as they are unless SEO changes are intended.

## Performance rules

- The scene chunk (about 137 KB gzipped) is loaded with a dynamic `import()` after `load` and an idle callback. It is never downloaded in `static` mode.
- The scenes are built one per idle slice; textures are uploaded as they are built; rendering stops while no scene is on screen.
- Phones: pixel ratio 1.5 at most, fewer particles and globe points, smaller card textures, no antialiasing.
- The dashboard image is lazy and visually hidden in 3D mode; the scene reuses the same optimised file as its texture.
- Check Lighthouse (mobile and desktop) before and after any change to this folder. Measured at launch on one machine, production code vs this page: mobile performance 94 vs 92, desktop 100 vs 100; SEO, accessibility and best practices 100 in both; LCP unchanged; CLS 0. The 2-point mobile difference is the cost of creating a WebGL context in Lighthouse's software renderer (about 120 ms of blocking time); real GPUs take a few milliseconds.
- The wrapper records the start-up stage in `data-h3d-stage` (`effect`, `scheduled`, `idle-wait`, `start`, `loaded`, `ready`) and the scene sets `performance.mark("h3d:first-frame")` and `performance.mark("h3d:ready")`. Use them to diagnose a page that stays in the plain layout.

## Testing

- `npm test` runs `tests/home3d/home-data.test.ts` (data, SEO copy, CMS refresh).
- By hand: open `/` on desktop and a phone; scroll through all six scenes; open the phone "More" sheet; switch on "Reduce motion" in the OS and reload to see the plain layout.

## Known limits

- Needs `overflow: clip` and `:has()` (Chrome 105, Safari 16, Firefox 121, all 2022–2023). Older browsers keep working but the sections do not pin.
- three.js is pinned to r128 so the look matches the approved prototype. Upgrading changes lighting and colour handling and needs a visual review.
