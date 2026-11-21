# Contact page — 3D layout

The contact page (`src/app/(site)/contact/page.tsx`) is a normal server-rendered page with a 3D inquiry-flow carousel in the hero and a soft 3D background. Every word, field and link is HTML; the 3D only decorates it. The form is a plain POST to `/api/contact` and works without JavaScript.

## How it works

| Piece | File | Job |
|---|---|---|
| Page | `src/app/(site)/contact/page.tsx` | Server component. Metadata, copy, form, sent and error states. |
| Copy and options | `src/components/contact3d/contact-data.ts` | The wording, the five flow steps and every select option. The page and the tests read the same lists. |
| Styles | `src/components/contact3d/contact-3d.css` | Everything is scoped under `.c3d` and prefixed `c-`. Desktop two-column layout, tablet and phone single column. |
| Loader and behaviours | `src/components/contact3d/contact-3d.tsx`, `contact-enhance.ts` | Client. Reveal, tilt, FAQ, strip, form cubes, double-submit guard, jump-to-form. Then loads the scene. |
| Scenes | `src/components/contact3d/contact-scene.ts` | three.js (r128, pinned, shared with the home page). The inquiry carousel and the background. Loaded only on demand. |

The site header and footer are the real ones from the layout. The prototype's own header and footer were stand-ins.

## Layout modes

The wrapper carries `data-c3d`:

- `pending` — server default. The stage already has its final height and shows the five steps as a list, so nothing shifts when the scene arrives.
- `on` — scene running. The carousel fades in over the list; the background starts right after it, when the browser is idle.
- `static` — no 3D. The five steps are a plain list in the card, everything is visible. Chosen **before first paint** for `prefers-reduced-motion`, data saver, devices with 2 GB or less memory, or no WebGL, and as a fallback if the scene fails to start.

`data-js="1"` is set by the same inline script; reveal animations only hide cards once it is set, so with scripts off everything is visible and every FAQ answer is open.

## Content: what comes from where

Nothing on this page is read from the CMS. All wording is in `contact-data.ts` and `page.tsx`; it is the text that was on `/contact` before the redesign. The inquiry-flow step names, the strip and the FAQ were already part of the page or of the old illustration.

## The form

Same endpoint, same field names, same server checks. The route (`src/app/api/contact/route.ts`) redirects to `/contact?sent=1` or `/contact?error=invalid`; the page shows the result in the card (and as a status line under the heading on tablets and phones), and scrolls to the card when it is below the fold.

- Honeypot: `fax`, hidden off screen.
- Attribution fields (`source`, `referrer`, UTM) are hidden inputs filled from the query string, as before.
- Added on the client only: a double-submit guard (the button reads "Sending…" and a second submit is ignored), progress cubes (decorative), and the header/footer "Send a brief" links jump to the form on this page.
- Phone keyboards: `type="tel"` on Phone, `inputMode="url"` on Website URL, and autofill hints on name, email, company, phone, country and website.

## Phones and tablets

One column in this order: heading, inquiry flow, what to include, form, email and location, engagement expectations, FAQ. A "Send a brief" button floats at the bottom until the form (or footer) is on screen. The strip is a swipeable coverflow. Depth offsets and pointer tilt are mouse-only, so touch text stays sharp.

## Performance rules

- The scene chunk is loaded with a dynamic `import()` once the visitor first moves the mouse, scrolls, taps or presses a key (or 7 s after load if they do not), inside an idle callback. It is never downloaded in `static` mode, and it never competes with the first paint, hydration or the cookie banner.
- The lead paragraph is the largest text painted first, so it has no entrance animation; this keeps it as the largest-contentful-paint element on phones instead of the cookie banner text.
- Phones: pixel ratio 1.5 at most for the background, fewer shapes, no antialiasing there.
- One frame is drawn even when the carousel is off screen, so the page leaves `pending`.
- Rendering pauses while the carousel is off screen or the tab is hidden.
- Check Lighthouse (mobile and desktop) before and after any change to this folder.
- The wrapper records the start-up stage in `data-c3d-stage` (`effect`, `scheduled`, `idle-wait`, `start`, `loaded`, `ready`) and the scene sets `performance.mark("c3d:first-frame")` and `performance.mark("c3d:ready")`.

## Testing

- `npm test` runs `tests/contact3d/contact-data.test.ts` (copy, field names, states, five steps).
- By hand: open `/contact` on desktop and a phone; drag and tap the carousel; open the FAQ; open "Optional project details"; switch on "Reduce motion" in the OS and reload to see the plain layout; open `/contact?sent=1` and `/contact?error=invalid`.

## Known limits

- Needs `overflow: clip`, `:has()` and individual transform properties (Chrome 105, Safari 16, Firefox 121). Older browsers keep working but lose the sticky form card and some reveal effects.
- three.js is pinned to r128 so the look matches the approved prototype.
- The old contact illustration image (`/brand/inquiry-flow-contact.png`) is no longer used on this page; the 3D carousel replaces it, with an `aria-label` describing the same five steps.
