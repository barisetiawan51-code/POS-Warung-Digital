<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tokigo Starter — Rules for AI Agents

This repo is Tokigo's plain starter for building client websites (mostly landing pages) with Next.js + Tailwind CSS. Every template in this repo is built by AI agents. This file is the contract: follow it unless the human explicitly overrides it.

## 1. Mindset

- The starter ships only two routes: home (`/`) and the design-system reference (`/design-system`). Each project replaces them and creates its own pages under `app/`.
- Keep it plain: no design opinions, no component libraries, no flashy extras. Each project defines its own look through tokens and its own sections.
- Every output must be production-ready for an Indonesian client: Indonesian copy, mobile-first, fast, accessible, SEO-friendly.
- When something is ambiguous, ask the human. Never invent client data (addresses, prices, phone numbers) without being told.

## 2. Stack (do not downgrade or swap)

| Layer     | Choice                                             |
| --------- | -------------------------------------------------- |
| Framework | Next.js 16.x (App Router, Turbopack, React 19)     |
| Styling   | Tailwind CSS v4 (CSS-first, no tailwind.config.js) |
| Language  | TypeScript strict                                  |
| Package   | pnpm                                               |
| Classes   | `cn()` from `lib/utils.ts` (clsx + tailwind-merge) |
| Icons     | `react-icons` (subpath imports only)               |

Read version-matched Next.js docs before coding: `node_modules/next/dist/docs/`.

## 3. Folder map

```
app/                     routes only (Next.js special files): home + design-system
components/ui/           primitives (button, badge, card, input, field, ...)
components/layouts/      structural wrappers (section, skip-link, navbar, footer, shell)
components/pages/<page>/ sections for one page, one folder per page
content/                 site + page copy (typed TS modules)
lib/                     shared utilities (cn, links, seo, data)
styles/                  Tailwind entry (globals.css) + tokens (theme.css)
public/                  static assets
```

Placement rules:

- Route files live only in `app/`. Never create pages anywhere else.
- Shared primitives go in `components/ui/`; page-specific sections go in `components/pages/<page>/`.
- Anything reusable by two or more pages is not page-specific: move it to `components/ui/` or `components/layouts/`.

## 4. Golden rules

1. Server Components by default. Add `"use client"` only when state, event handlers, effects, or browser APIs are required, and keep client components small and leaf-level.
2. No hardcoded routes or URLs inside components. Internal links only to routes that exist; outbound/CTA links are built through helpers in `lib/links.ts`.
3. No hardcoded colors. Every color comes from a token in `styles/theme.css`.
4. All user-facing copy lives in `content/`. Components receive copy via props or imports; never scatter literal strings across components.
5. Put page sections in `components/pages/<page-name>/`. `page.tsx` files stay thin: metadata + composition only.
6. Extend primitives, never fork them. Need another button style? Add a variant to `components/ui/button.tsx`.
7. Add a dependency only when a task truly needs it, one library per job (see section 15). Pre-approved: `react-icons`, `swiper`, `react-hot-toast`.
8. Never use `<img>`. Use `next/image` with width/height or `fill`, plus a real `alt`.
9. Every page exports `metadata` (title and description).
10. No visual effect without a reason. Gradients, glass, blur, and motion must be justified and reused via tokens or documented variants. Motion is welcome when the brand calls for it (see section 8).
11. Every new token, primitive, or variant is registered on `/design-system` in the same change. If it is not on the design-system page, it does not exist.
12. A task is done only when all quality gates pass (see section 18).
13. Never verify visuals yourself: no browsers, screenshots, or manual UI inspection (AntiGravity browser checks included) — they burn tokens and time. Run the code gates only; the human developer checks the rendered result.

## 5. Building a page (standard workflow)

1. Decide the design direction first (see section 8): hero archetype, type mood, palette character, layout rhythm, one signature detail. The starter home is a structural example, not a layout to copy — if a minimal prompt leads to the same look as another project, change the direction before coding.
2. Check `/design-system` and reuse the tokens and primitives that already exist.
3. Check `node_modules/next/dist/docs/` for anything uncertain about Next 16.
4. Create the route: `app/<route>/page.tsx`, plus every detail route the design links to (`/produk/[slug]`, `/berita/[slug]`, ...) with `generateStaticParams` from `content/`. Never ship a clickable card without its destination page.
5. Keep `page.tsx` thin: `export const metadata`, then compose sections.
6. Create `components/pages/<page-name>/` with one file per section (`hero.tsx`, `pricing.tsx`, `faq.tsx`, ...).
7. Write the copy in `content/<page-name>.ts` as typed objects.
8. Wrap sections with `Section` (`components/layouts/section.tsx`) and `Container` (`components/ui/container.tsx`).
9. Touch `styles/theme.css` only when the project needs new tokens, and register every new token, primitive, or variant on the design-system page.
10. Run the quality gates and hand over for the human visual check (no browser verification by the agent).

Reference skeleton:

```tsx
import type { Metadata } from "next";
import { Hero } from "@/components/pages/home/hero";
import { home } from "@/content/home";

export const metadata: Metadata = {
  title: "Beranda",
  description: "Deskripsi halaman.",
};

export default function HomePage() {
  return (
    <>
      <Hero content={home.hero} />
    </>
  );
}
```

## 6. Component standards

- Named exports everywhere. `export default` only in Next.js special files (`page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`).
- File names kebab-case (`hero-section.tsx`), component names PascalCase (`HeroSection`).
- Type props explicitly. Extend native element props (`HTMLAttributes<HTMLElement>`, `ButtonHTMLAttributes<...>`) and spread `...props` through.
- Accept `className?: string`, merge it last with `cn(...)`.
- React 19: `ref` is a normal prop. Do not use `forwardRef`.
- No `React.FC`, no `any`, no non-null assertions. Export prop types when useful.
- Provide content as data props (`content`, `items`) instead of hardcoding markup variants.
- Icons: use `react-icons`. Pick one or two UI packs per project so designs stay varied but consistent — `react-icons/lu` (Lucide), `react-icons/tb` (Tabler), `react-icons/pi` (Phosphor), `react-icons/ri` (Remix), `react-icons/hi2` (Heroicons), `react-icons/bs` (Bootstrap), `react-icons/fi` (Feather). Brand and social logos may come from `react-icons/fa6` or `react-icons/si` and do not count toward that limit. Never mix more than two UI icon styles on one project. Size them with `size-*` utilities and let them inherit color via `currentColor`.
- Forms: always use `Field` + `Input`/`Textarea`/`Select` from `components/ui/`. `Field` wires label, hint, error, and `aria-describedby` automatically. Never restyle raw form elements.

## 7. Styling standards

- Tailwind utilities only. No CSS modules, no CSS-in-JS, no inline `style` except values that cannot be expressed in CSS.
- Tokens: add a CSS variable in `:root`, then map it under `@theme inline` in `styles/theme.css` (`--color-*`, `--radius-*`, `--font-*`). Utilities follow automatically (`bg-primary`, `text-muted-foreground`).
- Colors must be token-based. Arbitrary values like `bg-[#ff0000]` are forbidden.
- Spacing and sizes use the default scale. Arbitrary values (`w-[173px]`) only when the design truly requires them.
- Mobile-first: base styles for mobile, then `sm:`, `md:`, `lg:`.
- Light and dark mode are both required (the starter ships both). Dark values live in the `.dark` block in `styles/theme.css`; use the `dark:` variant for rare exceptions, never hardcode dark colors. Both modes must pass WCAG AA.
- Never hand-sort Tailwind classes. Prettier + `prettier-plugin-tailwindcss` does it on save/format.
- Before inventing a style, read section 8 (design quality) and section 9 (design system).

## 8. Design quality (anti AI-slop)

Default AI output looks generic: violet gradients, glassmorphism everywhere, emoji as icons, everything centered, three identical feature cards. This repo must never ship that. These rules are part of the contract:

- Start from content and hierarchy. Typography, spacing, and structure carry the design; effects come last, only when they add meaning.
- Gradients: only when the brand or context justifies it (hero backdrop, overlay to keep text readable on a photo). One per screen, subtle, built from brand tokens. Never the default purple/indigo/rainbow gradient.
- Glass and blur: only with a functional reason (sticky header over busy content, overlay on an image). Never stack blur on cards, sections, and buttons at the same time. Reuse one documented blur; do not improvise per component.
- Fonts: choose the project font deliberately for its character (audience, tone) via `next/font`. Good starting points: Plus Jakarta Sans (fits most Indonesian brands), Inter, Manrope, Geist, Outfit, Sora; serif option: Newsreader, Lora. Max two families (sans + optional display/serif) and max three weights. Body text at least 16px, line-height 1.5–1.75, measure 60–75ch. `tracking-tight` only for large headings, never for body text. Never leave the default font when the project has a brand, and never mix more than two families.
- Color: one primary, neutrals, and at most a few documented accents. Every color must pass WCAG AA on the background it is used on.
- Shapes and shadows: one radius logic (the `--radius` tokens) and one shadow level per elevation. Do not mix `rounded-2xl` here with `rounded-md` there.
- Motion is part of the design when the brand calls for it. Elegant fashion, footwear, and portfolio sites should feel smooth: page transitions, gentle section reveals, and rich hover states. Motion is choreography, not default decoration.
- One motion language per project: reuse the same durations (about 150ms for micro-interactions, 250ms for components, 400ms for section reveals and page transitions) and the `ease-smooth` token everywhere. Register custom motion on `/design-system`.
- Page transitions: keep them under ~400ms and never delay navigation or content. Prefer CSS and the native View Transitions API; add a small library only when the choreography truly needs it (section 15).
- Section reveals: subtle fade/translate is fine for premium brands, but not on every element, never blocking content, never causing layout shift.
- Sliders: use one only when there are multiple images worth comparing; otherwise a grid or static gallery is better. A hero image slideshow (Swiper, section 15) is a valid use when the material is strong — one slider style per project, visible controls, pause on hover/focus.
- `prefers-reduced-motion` must always disable non-essential movement (the base CSS already enforces this). Avoid parallax and scroll-jacking unless the brand direction explicitly calls for them.
- Imagery-led layouts: full-image backgrounds and full-bleed sections (hero covers, gallery strips, image cards) are welcome when the theme fits — hotels, resorts, fashion, F&B, travel. Same rules apply: real photos downloaded into `public/`, rendered with `next/image` (`fill` + `sizes` + `object-cover`), and text stays readable through one subtle scrim (`bg-foreground/40`) or a bottom-to-top gradient built from tokens. Never place text over an unshaded busy photo. Full-bleed sections may skip `Container`; the text inside still respects the container width or the 60–75ch measure.
- Layout: avoid centered-everything. Use grids and asymmetry where it improves scanning. Every section has one message and one primary action.
- Header and navigation: maximum five primary links. More than that goes into a dropdown or a separate page — do not cram everything into the homepage. When a page gets long, split it into new routes instead of stacking more sections.
- Mobile is a bug report waiting to happen: design every page so it works at 375px. Header CTAs such as WhatsApp must never be squeezed inline on mobile — collapse them into the mobile menu or turn them into a small floating button in the bottom-right corner (small, respects safe-area insets, never covers content).
- Large screens matter too: pages must hold up at 1600px+. The `Container` primitive widens at `2xl` (`max-w-6xl` → `2xl:max-w-7xl`); never leave huge empty margins on big monitors, and never stretch body text beyond a readable measure (60–75ch).
- Anti-repetition: sameness is the strongest AI-slop signal. Never rebuild the same skeleton for every client (navbar + split hero + three cards + stat band + CTA). Vary deliberately per brand:
  - Hero archetypes: editorial type-led, split text/image, full-bleed photo with scrim, centered minimal, collage/grid, asymmetric offset.
  - Layout rhythm: alternating image/text, stat band, numbered steps, big pull quote, masonry gallery, sticky split, horizontal gallery.
  - Choose from the brand persona, not from the last project. With a minimal prompt, write a one-line design brief (hero, type mood, palette, rhythm, signature detail) and confirm the direction before coding.
- Specificity beats decoration: real services, real photos, real numbers. Generic copy plus decorative effects is the strongest AI-slop signal.
- If an effect has no functional or brand reason, delete it. When in doubt, subtract.

## 9. Design system (per project)

Every project that starts from this starter owns exactly one design system and must stay internally consistent — even when the theme is colorful and grows a lot. Two different projects may look completely different (one minimal, one full of colors) — that is expected — but each one follows this same structure, so agents and developers can move between projects without relearning anything.

Three sources of truth:

1. `styles/theme.css` — token values for light and dark (the `.dark` block) (`--color-*`, `--radius-*`, `--font-*`). Brand changes happen here, never inside components.
2. `components/ui/` — primitives built from those tokens (`button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `field.tsx`, `select.tsx`, `textarea.tsx`, `container.tsx`, ...).
3. `app/design-system/page.tsx` — the living reference that renders every token and every primitive variant.

Rules:

- Before building anything, check the design-system page and reuse the existing tokens and primitives. Do not invent new colors, radii, or one-off styles.
- Any new token, primitive, or variant must be added to `/design-system` in the same change. If it is not on the design-system page, it does not exist.
- Never rename the canonical tokens to fit a design (`primary`, `muted`, `border`, `destructive`, ...). Keep the names, change the values per project. This is what keeps every project structured the same while looking independent.
- The design system is expected to grow with the project. A playful theme (a kids' course site, for example) may need many colors: add them as new tokens (`--accent-1`, `--accent-2`, extra brand or decorative colors, extra radii/shadows) in `styles/theme.css` and render them on the design-system page (add the swatch to `content/design-system.ts`). Adding tokens is healthy; hardcoded colors and one-off styles are not.
- Special styles (gradients, decorative backgrounds, custom shapes, extra radii/shadows) follow the same rule: define them once as a token or a documented primitive variant, register them on `/design-system`, then reuse them everywhere. Never duplicate the same special style by copy-paste, and never hide a style inside a single component.
- Consistency comes from the system, not from having few colors. A project with ten documented colors is correct as long as every color has a token, a name, and a place on the design-system page.
- Dark mode: keep the same token names; only values change inside the `.dark` block. Put `ThemeToggle` (`components/ui/theme-toggle.tsx`) in the header or footer. Never ship a page that only works in one mode.
- Fonts are part of the design system. Pick the project font with `next/font` in the root layout, map it to the `--font-sans` token in `styles/theme.css`, and update the font block on `/design-system` so the choice is recorded.
- The design-system page is internal: it stays `noindex`, is never linked from navigation or client-facing marketing pages (only the starter home links to it for convenience), and is removed only when the human asks.

Starting a new project from the starter:

1. Set token values in `styles/theme.css`, including the base `--radius`.
2. Set the brand in `content/site.ts` (used by the root layout `metadata`).
3. Write the project copy in `content/`.
4. Build pages from existing primitives; extend them by adding variants, never by adding ad-hoc classes.
5. Keep `/design-system` updated — it documents this project's design system, not another project's.
6. If the project deploys to Cloudflare, rename the worker to the project slug before the first deploy (section 17).

## 10. Content standards

- Language: Indonesian (unless told otherwise), friendly and professional.
- Site-wide identity goes in `content/site.ts` (name, tagline, phone/WhatsApp, address, socials). Page copy goes in `content/<page>.ts`.
- Format rupiah as `Rp 99.000`. Dates in Indonesian (`1 Januari 2026`).
- Placeholders are fine while scaffolding, but anything shown to the human as a finish must have real, specific copy. No lorem ipsum.
- Photos: when the client has no assets yet, use free stock photos (Unsplash, Pexels, Pixabay). Download the file into `public/` — never hotlink an external image URL — then render it with `next/image` and a real `alt`.

## 11. Links and CTAs

- Create `lib/links.ts` when the first outbound link is needed. Example: `whatsappLink(message)` reading the number from `content/site.ts`.
- Phone numbers, domains, and social URLs live in `content/site.ts`, never in components.
- Internal navigation uses `next/link`. External links get `target="_blank"` and `rel="noopener noreferrer"`.
- Pre-filled WhatsApp messages must name the source, e.g. `"Halo, saya ingin order dari halaman menu."`.

## 12. SEO

- Every page exports `metadata` with title and description.
- The root layout owns the `title.template`; each client's brand name is set in `content/site.ts`.
- Add JSON-LD per template when relevant: `LocalBusiness`, `EducationalOrganization`, `Organization`, `FAQPage`, `Article`, `Course`, `JobPosting`. Build the object in `lib/seo.ts` and render it with a `<script type="application/ld+json">` in the page.
- Social/OG images must live in `public/`.

## 13. Accessibility

- The root layout renders `<main id="main-content">` and a "skip to content" link (`components/layouts/skip-link.tsx`). Header, nav, and footer belong in `components/layouts/` and are composed in the root layout, not inside pages. Exactly one `<h1>`; headings in order.
- Images: meaningful `alt`; `alt=""` only when decorative.
- Buttons perform actions, links navigate. Never nest a link inside a button.
- Visible `focus-visible` states (primitives already include them). Never remove outlines without a replacement.
- Form inputs always go through `Field`; it renders the `<label>`, hint, error, and `aria-describedby` automatically.
- Contrast: WCAG AA minimum (4.5:1 for body text).

## 14. Performance

- Server-first. Client components only for interactive leaves (mobile menu, carousel, lightbox, forms).
- Lazy-load maps, videos, and third-party embeds (`next/dynamic`, `loading="lazy"`, click-to-load).
- Always `next/image`, with `sizes` when using `fill`.
- Fonts only via `next/font`, never a `<link>` to Google Fonts. The default is the system font stack.
- Import icons from their pack subpath (`react-icons/lu`, `react-icons/tb`, ...), never from the root `react-icons`, so only the icons used are bundled.
- Keep slider, carousel, and toast libraries out of the initial bundle when they are below the fold or only used on interaction (load with `next/dynamic` or click-to-load).
- Budget: under 100KB gzip of JS per landing route.
- CSS transitions and native View Transitions first. Animation and slider libraries (section 15) only when the design needs them, and keep them out of the initial bundle when possible.

## 15. Dependencies

- Add a dependency only when a task genuinely needs it. Never install two libraries that do the same job.
- Pre-approved:
  - `clsx`, `tailwind-merge` (already installed, used by `cn()`).
  - `react-icons` (already installed) — all icons.
  - `swiper` — image sliders and carousels. For simple sliders, prefer CSS scroll-snap first.
  - `react-hot-toast` — toast feedback for forms. Use only when a form really needs async feedback.
  - `motion` — page and section choreography for brand-led sites (fashion, footwear, portfolio). Load it lazily where possible.
- Need something else (maps, lightbox, date picker, ...)? Pick a small, well-maintained library that fits this plain stack and mention why in your summary. If two options exist, ask the human.
- Do not build a dashboard/admin dependency into the starter; that belongs to the future `app/(app)/` group (section 16).

## 16. Dashboard (future)

- Reserved route group for dashboards: `app/(app)/`. Do not build it until asked.
- Data access must go through `lib/data/` modules so static/mock data can later be swapped for a database (Drizzle + SQLite/Postgres) without touching UI.
- Never import dashboard code into marketing pages, and never ship admin dependencies to public routes.

## 17. Deployment (Cloudflare)

Client sites deploy to Cloudflare Workers. Use Cloudflare's recommended path for Next.js 16 (`vinext`; run `npx vinext check` first) or OpenNext when a project already uses it. Both are driven by `wrangler.jsonc`, and worker names are unique per Cloudflare account — the most common deploy error is deploying with the starter's name or a name that already exists.

Naming rules (before the first deploy of every project):

- `wrangler.jsonc` → `"name"` must be the project slug in lowercase kebab-case (e.g. `tokigo-warung-bu-tini`). Never leave `tokigo-starter` or another client's name.
- `package.json` → `"name"` uses the same slug.
- One worker per client project; never create a second worker name for the same site.

Deploy checklist:

- `pnpm typecheck && pnpm lint && pnpm build` pass first.
- Keep `compatibility_date` recent (bump it when starting a project) and keep `nodejs_compat` in `compatibility_flags`.
- Validate with a dry run (`wrangler deploy --dry-run` or the deploy tool's preview command) before the real deploy.
- Secrets never go into `wrangler.jsonc`: use `wrangler secret put` and `.dev.vars` (gitignored).
- After config or binding changes, regenerate types (`wrangler types`) and commit them.

## 18. Definition of Done

Before reporting a task complete, all must pass:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm format:check` (run `pnpm format` to fix)
- `pnpm build`
- Visual check is the human's job: report the routes and viewports to review (375px, 768px, 1280px, 1600px+, light and dark mode, header CTA and mobile floating button behavior included). Do not open a browser, take screenshots, or run browser tooling yourself.
- Every route has metadata; copy is real Indonesian text from `content/`
- Every clickable card and CTA points to a route that exists (detail pages created, no `href="#"`, no dead links)
- New tokens, primitives, and variants are registered on `/design-system`
- Design follows section 8: no unjustified gradients/glass/blur, max two font families, one radius logic
- Motion, if present, uses one language, respects `prefers-reduced-motion`, and never delays content
- Forms use `Field` + primitives, with hint/error/disabled states verified
- No hardcoded colors, routes, or phone numbers
- Report what changed and what is still open

## 19. Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```
