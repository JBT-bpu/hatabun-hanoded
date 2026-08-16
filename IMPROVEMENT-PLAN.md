# hatabun-hanoded — FX Wave 2: Improvement Plan

Execution plan for the next round of improvements. Written to be executed
step-by-step by any model/agent. Hebrew site, RTL. Dev server: `npm run dev`
→ http://localhost:3000.

## Ground rules for the executor

- Work on branch `feat/fx-wave-2` (create from `main`). Commit after EACH
  completed item with message `Wave2-<item number>: <short description>`.
- After each item: run `npx tsc --noEmit` (ignore the 3 pre-existing errors in
  `db/index.ts` and `worker/index.ts` — they are Cloudflare worker types) and
  `npx eslint app/ --quiet`. Both must add NO new errors.
- Verify each item in the browser at http://localhost:3000 before committing.
- Do NOT touch: `worker/`, `db/`, `drizzle/`, `.openai/`, `vite.config.ts`.
- Do NOT redesign existing sections. This wave is additive polish.
- Every animation must respect `prefers-reduced-motion: reduce` (see existing
  patterns) and must not run when `document.hidden`.
- All user-facing text is Hebrew. Keep RTL in mind: use logical CSS properties
  (`inset-inline-start`, `margin-inline`) like the rest of the codebase.

## Existing architecture you must reuse (do not reinvent)

- `app/page.tsx` — the whole site, one client component.
- `app/globals.css` — all styles (~2300 lines). Append new blocks at the end
  with a `/* ===== <name> ===== */` header comment.
- **Heat system**: CSS var `--site-heat` on `:root` goes 0 (cold) → 1 (lit),
  animated by GSAP at ignition. Use `calc()` with it for any warm/cold styling.
  Classes `site-is-dim` / `site-is-lit` on `<main>` flip at ignition.
- **Ember bursts**: add `data-ember-burst="24"` (+ optional
  `data-ember-intensity`, `data-ember-target="<selector>"`) to any clickable
  element → EmberField fires particles on click. Or dispatch
  `window.dispatchEvent(new CustomEvent("fire:burst", { detail: { selector, count, intensity } }))`.
- **Scroll**: Lenis runs via `app/SmoothScroll.tsx` (`lenisStore.instance`).
  GSAP ScrollTrigger is registered in `app/CinematicScroll.tsx`.
- **Parallax drift**: put `data-drift="<percent>"` (+ optional
  `data-drift-scale`) on an element → CinematicScroll scrubs it.
- **Scroll progress**: `--scroll` var on `:root` is 0→1 page progress,
  already maintained; `.scroll-progress` element exists.

---

## TIER 1 — Polish (do these first, lowest risk)

### 1.1 Burning-fuse scroll progress bar
The `.scroll-progress` element currently renders a plain bar. Restyle it as a
burning fuse: a thin gradient line with a glowing ember tip.
- File: `app/globals.css` only. Find the existing `.scroll-progress` rules.
- The bar's fill width already derives from `--scroll`. Add:
  - fill background: `linear-gradient(270deg, #fff1c8, #ffb43e 18%, #ff541b 55%, #7a2b0e)`
    (RTL: flame tip is at the leading edge).
  - an ember tip via `::after`: 6px circle at the leading edge,
    `box-shadow: 0 0 10px 3px rgba(255,132,40,.8)`, `border-radius: 50%`.
  - Multiply the whole bar's opacity by `var(--site-heat)` so it's invisible
    until ignition.
- Accept: scrolling shows a glowing fuse creeping across the top; invisible
  before ignition.

### 1.2 FAQ ember pops + smooth open
- File: `app/page.tsx` — on each `.answer-toggle` button add
  `data-ember-burst="10"` and `data-ember-intensity="0.6"`.
- File: `app/globals.css` — find `.answer-panel`. If it snaps open, animate it:
  wrap-grid technique — set parent `display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows 320ms var(--ease-state);` and
  `[data-open="true"] → 1fr`, with inner `overflow: hidden; min-height: 0`.
  If it already animates, leave it.
- Accept: opening a FAQ fires a small ember pop and the panel unfolds smoothly.

### 1.3 Ticker ignition run
The benefits ticker (`.poster-ticker > div`) currently plays its animation once
(`animation: ticker 6s linear 1 both paused` → running when lit). Make it loop
forever but slower after the first pass: change to
`animation: ticker 6s linear both paused; animation-iteration-count: infinite;`
and add `animation-timing-function: linear`. Keep `paused` → running via
`.site-is-lit`. If a continuous loop looks wrong because the content doesn't
tile seamlessly, duplicate the inner span set once more in `app/page.tsx` so it
tiles, then loop.
- Accept: after ignition the ticker scrolls continuously, seamless.

### 1.4 Mobile bottom bar ignites
`.mobile-bar a` first link has `background: var(--orange)`. Make it heat-aware:
`background: color-mix(in oklab, var(--orange) calc(var(--site-heat) * 100%), #46403a);`
- Accept (mobile viewport): bar is gray while cold, warms with the site.

### 1.5 Cold-state legibility bump
In `app/globals.css` the rule `.site-is-dim .slogan-word` sets `opacity: 0.3`.
Raise to `opacity: 0.42` and reduce blur from `2px` to `1.5px` — the main
headline must stay readable during the cold intro.
- Accept: cold hero slogan clearly readable but still obviously "unlit".

### 1.6 Focus rings in brand flame
Add at end of `globals.css`:
```css
:focus-visible { outline: 2px solid var(--orange); outline-offset: 3px; border-radius: 2px; }
```
Check it doesn't double up with existing focus styles (search `focus-visible`
first; merge if present).
- Accept: keyboard-Tab shows orange rings, no double outlines.

---

## TIER 2 — New content blocks

### 2.1 Stats strip — "האש במספרים"
New section between the theater section (`#experience`) and the menu
(`#menu`) in `app/page.tsx`.
- Content (3 stats, placeholder numbers — flag to the owner to confirm):
  - `120+` אירועים שהודלקו
  - `4,000+` פוקאצ׳ות מהאש
  - `100%` מול האורחים
- Markup: `<section className="fire-stats" aria-label="האש במספרים">` with three
  `<div className="fire-stat">` each containing `<b data-count="120" data-suffix="+">0</b>`
  and a `<span>` label, plus one existing brand icon per stat from
  `/brand/icon-flame-v2.png`, `/brand/icon-wheat-v2.png`, `/brand/icon-oven-v2.png`
  (all already in `public/brand/`).
- Count-up: in a new small client component `app/CountUp.tsx` OR inline effect:
  IntersectionObserver (once, threshold .4) → rAF loop 1200ms, ease-out,
  animate textContent from 0 to `data-count`, append `data-suffix`.
  Respect reduced motion: set final value instantly.
- Style: dark section, numbers in `var(--display)` font clamp(44px, 5vw, 72px),
  orange numbers, cream labels, icons 40px above each number. Add `data-enter`
  on each stat for the existing reveal system, and `data-ember-source="stats"`
  on the section so ambient embers visit it.
- Accept: scrolling to the strip counts the numbers up once; RTL layout; looks
  native to the design.

### 2.2 Testimonials — "מסביב לאש"
New horizontally scroll-snapped strip after the locations section (`#events`).
- 3 placeholder quotes (flag to owner to replace):
  - "הטאבון היה מרכז הערב. אנשים פשוט לא זזו משם." — רותם, אירוע חברה
  - "הריח של הפוקאצ׳ות עוד לפני שהגשנו — זה עשה את האירוע." — דנה ואור, חתונה בטבע
  - "עמדה שהיא שואו. פשוט שואו." — אבי, יום הולדת 50
- Markup: `<section className="fire-voices" aria-labelledby="voices-title">`,
  heading `<h2 id="voices-title">מסביב לאש</h2>`, then `<div className="voices-track">`
  with `<figure className="voice-card">` per quote (`<blockquote>` + `<figcaption>`).
- Style: cards look like scorched paper notes: cream background
  `var(--cream)`, coal text, slight uneven rotation per card
  (`:nth-child(1) rotate(-1.2deg)` etc.), a burnt-edge effect via
  `box-shadow: inset 0 0 18px rgba(90,40,10,.18)` and one corner darkened with
  a radial-gradient overlay. Track: `overflow-x: auto; scroll-snap-type: x
  mandatory; display: flex; gap: 24px;` cards `scroll-snap-align: center;
  min-width: min(420px, 82vw)`. Desaturate cards with the usual
  `calc()`+`--site-heat` filter so they warm with the site.
- Accept: swipeable/snappable strip, readable, warms with ignition.

### 2.3 Floating WhatsApp ember (desktop)
- New element at the end of `<main>` in `page.tsx`: fixed-position circular
  WhatsApp link (`https://wa.me/972544669111`), bottom-inline-start corner,
  56px, coal background, orange border, WhatsApp glyph can be an inline SVG
  path (draw a simple phone/chat bubble — do NOT add a dependency).
- Behavior: hidden until BOTH conditions: `--scroll > 0.25` and site is lit.
  Implement visibility with a tiny effect in `page.tsx` (scroll listener already
  exists — extend `updateScroll` to toggle class `is-visible` on it) or pure
  CSS `opacity: calc((var(--scroll) - 0.25) * 8 * var(--site-heat))` clamped
  with `clamp(0, ..., 1)` — CSS-only preferred.
  Add `data-ember-burst="14"` for a pop on click. Hide on `max-width: 760px`
  (the mobile bar already covers this).
- Accept: bubble fades in after ~25% scroll on desktop, ember pop on click,
  never overlaps the mobile bar.

---

## TIER 3 — Creative swings (verify each visually before commit)

### 3.1 Heat-shimmer section dividers
SVG-filter shimmer strip between major sections (no WebGL needed).
- Add once in `page.tsx` (right after `<main>` opens) a hidden SVG:
```html
<svg width="0" height="0" aria-hidden="true"><filter id="heat-ripple">
  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="7">
    <animate attributeName="baseFrequency" dur="9s" values="0.012 0.06;0.016 0.08;0.012 0.06" repeatCount="indefinite"/>
  </feTurbulence>
  <feDisplacementMap in="SourceGraphic" scale="14"/>
</filter></svg>
```
- Add `<div className="heat-divider" aria-hidden="true" />` before the menu
  section and before the final poster. Style: height 60px, a soft horizontal
  orange gradient band (`radial-gradient(50% 100% at 50% 100%, rgba(255,110,30,.22), transparent 70%)`),
  `filter: url(#heat-ripple)`, `opacity: var(--site-heat)`.
- SVG SMIL `<animate>` runs even when offscreen — acceptable (GPU-cheap), but
  gate with `@media (prefers-reduced-motion: reduce) { .heat-divider { display: none; } }`.
- Accept: subtle rising-heat wobble between sections; nothing when cold.

### 3.2 Focaccia "into the oven" send animation
In the menu section, the WhatsApp send link (`שלחו את הכיוון לוואטסאפ`).
On click (before navigation — it opens a new tab, so no need to delay), fire:
- a big ember burst at the menu photo: it already may have a burst attr —
  ensure `data-ember-burst="40" data-ember-target=".menu-photo"`.
- plus a one-shot CSS animation on `.menu-photo`: class `is-sent` for 600ms
  (scale 1 → 1.02 → 1 with a bright flash via `filter: brightness(1) → 1.35 → 1`).
  Add the class in a small onClick handler in `page.tsx`, remove via setTimeout.
- Accept: clicking send visibly "fires the oven" and still opens WhatsApp.

### 3.3 Seal easter egg
`BrandEmblem` renders the brand seal in the hero. Triple-click within 900ms →
ember storm (`fire:burst` count 80 intensity 1.4 at `.poster-photo`) + toast
`מוכנים לאש? 🔥` bottom-center for 2.5s (new `.fire-toast` element, cream on
coal pill, animation slide-up+fade). Counter resets on timeout. No state
libraries — three refs.
- Accept: triple-click seal → storm + toast; double-click does nothing.

### 3.4 Crackle sound (opt-in only)
- Source a fire-crackle loop ~10s. Preferred: generate/fetch via the media
  tooling if available in the executing environment; otherwise SKIP this item
  entirely and note it. Place at `public/audio/fire-crackle.mp3` (<300KB).
- Small round toggle button next to the ignition button (`.sound-toggle`),
  `aria-pressed`, icon 🔊/🔇 as text. Default OFF. On enable: create one
  `<audio loop>` element, volume 0 → 0.18 fade over 1.2s (rAF), tied to lit
  state (pause when `site-is-dim` or tab hidden via `visibilitychange`).
  Never autoplay — only after this explicit user click.
- Accept: silent by default; toggling on plays soft crackle; tab-switch pauses;
  toggle state visible.

---

## TIER 4 — Performance / SEO / metadata

### 4.1 Compress heavy statics
- `public/og.png` is ~3.5MB. Re-encode to ≤300KB: `npx sharp-cli` is NOT a
  dependency — instead use ffmpeg (available on PATH):
  `ffmpeg -i public/og.png -vf scale=1672:-1 -q:v 4 public/og.jpg`
  then update `app/layout.tsx` metadata to point to `/og.jpg` (both openGraph
  and twitter images), keep width/height 1672×909.
- `public/hero-fire.png` (1.8MB) and `public/taboon-ember-trail-logo.png`
  (450KB): grep `app/` for usages; convert any that are actually used to webp
  (`ffmpeg -i in.png -c:v libwebp -q:v 82 out.webp`) and update references.
  If unused, leave them (do not delete).
- Accept: `ls -la public` shows og under 300KB; page still renders all images.

### 4.2 JSON-LD structured data
In `app/layout.tsx` body, add:
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "הטאבון הנודד",
  description: "טאבון נייד לאירועים — פוקאצ׳ות נאפות מול האורחים",
  telephone: "+972-54-466-9111",
  email: "hatabunhanoded@gmail.com",
  areaServed: "ישראל",
  servesCuisine: "פוקאצ׳ות מהטאבון",
  url: "https://hatabunhanoded.co.il"
}) }} />
```
- Accept: view-source shows the script; https://validator.schema.org passes
  (or at minimum JSON.parse of the payload succeeds).

### 4.3 Preload hero + filmstrip after ignition
In `page.tsx`, in the ignition effect after `runIgnition` is armed, inject
`<link rel="prefetch" as="image">` for `/fire-story-filmstrip.webp`,
`/campaign/menu-dairy.webp`, `/campaign/menu-meat.webp` (createElement +
head.appendChild, once). Do it inside a `requestIdleCallback` fallback
setTimeout 2s.
- Accept: Network tab shows the three images prefetched shortly after load;
  scrolling to menu/story shows no image pop-in.

### 4.4 `sitemap.xml` + `robots.txt`
Static files in `public/`: robots.txt (`User-agent: *\nAllow: /\nSitemap:
https://hatabunhanoded.co.il/sitemap.xml`) and a minimal one-URL sitemap.
- Accept: both reachable at http://localhost:3000/robots.txt & /sitemap.xml.

---

## Suggested execution order

Tier 1 (1.1→1.6) → 4.1 → 4.2 → 4.4 → 2.1 → 2.2 → 2.3 → 4.3 → 3.1 → 3.2 → 3.3 → 3.4.
Stop and report after Tier 1 + Tier 4 with a screenshot; continue on approval.

## Definition of done (whole wave)

- All items committed individually on `feat/fx-wave-2`, tsc/eslint clean.
- Site verified in desktop AND mobile (760px) viewports.
- Cold→ignite→scroll full journey tested after the last item.
- A final summary listing: items done, items skipped (with reason), and the
  placeholder content (stats numbers, testimonial quotes) the owner must
  replace with real data.
