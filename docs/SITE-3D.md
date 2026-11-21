# Site pages — shared 3D design system

Services, Projects, Process, About, Blog and Careers are built on one design system ported from the approved prototype (`codetelemetrylab-3d-prototype`). Home (`docs/HOME-3D.md`) and Contact (`docs/CONTACT-3D.md`) have their own implementations in the same visual language. The header and footer (`src/components/site-header.tsx`, `site-footer.tsx`, `site-chrome.css`) use the prototype's styling site-wide.

| Piece | File | Job |
|---|---|---|
| Page wrapper | `src/components/site3d/site-3d-page.tsx` | `Site3DPage` (server): wrapper, inline layout script, background. `Words` (h1 word animation), `vars` (CSS variables). |
| Hero and small parts | `site-3d-ui.tsx` | `SceneHero` (eyebrow, the one h1, lead, 3D stage), `Glyph`, `Rcube`, badge colours. |
| Styles | `site-3d.css` | The prototype stylesheet, every rule scoped under `.s3d`. |
| Behaviours | `site-enhance.ts` | Reveal, tilt, FAQ, iso layers, process timeline, stacked case studies, About ring, blog and careers filters. No WebGL. |
| Loader | `site-3d.tsx` | Starts the behaviours; loads the WebGL chunk after the first interaction (or 7 s) when idle. |
| Scenes | `site-scenes.ts` | three.js r128: background plus one scene per page (`data-scene="services|projects|process|blog|about|careers"`). Labels are read from the page markup. |

Modes on the wrapper (`data-s3d`): `pending` (server default, stages keep their size), `on` (3D running), `static` (reduced motion, data saver, ≤2 GB memory, no WebGL, or a failed load: stages hidden, all content visible).

What each scene reads: services `.svc[data-name][data-icon]`; projects `.case[data-label]`; process `.key` (`b`, `strong`, `span`); blog `[data-sheet-title][data-sheet-cat][data-sheet-date]` (first 5); careers and about need nothing.

All copy, metadata, links and data sources are the ones the pages had before. Detail pages (`/services/[slug]`, `/projects/[slug]`, `/blog/[slug]`, `/careers/[slug]`) are unchanged.

Performance: the WebGL chunk never loads before the first interaction, so it does not affect first paint or hydration. Lab mobile scores are 92–93 (live pages before: 92–99); the difference is that the cookie-banner text becomes the largest paint once the old hero images are gone. SEO, accessibility and best practices are 100.
