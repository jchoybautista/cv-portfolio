# Portfolio — Mobile Animation Fixes + Two New Sections

**Date:** 2026-06-21
**Branch:** redesign-lando-inspired
**Status:** Approved design → spec

## Overview

Jonathan Bautista's portfolio (`index.html` + `assets/style.css` + `assets/script.js`) is a
single-page, Lando-inspired site using Lenis smooth-scroll + GSAP ScrollTrigger. This effort has
four parts:

1. **Fix mobile (≤767px) Works (Featured) section** — make the full desktop scroll choreography
   (heading reveal → diagonal corner entry → horizontal panel scroll → 3D flip into the Work Hall
   of Fame cover) run on touch, re-tuned for portrait. Currently hard-disabled below 768px.
2. **Fix mobile Socials ("What's up") section** — replace the broken horizontal swipe-rail with the
   Lando-style fanned card deck.
3. **NEW "Work of Fame" section** (editorial index + live preview) — placed **after** Socials.
4. **NEW "Journey" section** (scrollytelling vertical timeline, no tabs) — placed at the **very
   bottom**, before the footer.

Parts 3 and 4 are **additive**. The existing Hall of Fame grid (`#work`) and tabbed Journey
(`#resume`) remain untouched so the owner can compare and choose later. Footer nav keeps pointing
at the originals.

## Goals

- Mobile users get the same beat-for-beat Works experience as desktop, including the flip.
- The mobile Socials deck visually matches the reference (fanned arc), no clipping/overflow.
- Two new, distinctive sections that fit the existing dark / neon-lime design system.
- Everything is mobile-web responsive and respects `prefers-reduced-motion`.

## Non-Goals

- No redesign of Hero, About, the existing Hall of Fame grid, or the existing tabbed Journey.
- No new project copy/content — reuse existing data.
- No backend, build tooling, or framework changes (stays vanilla HTML/CSS/JS + GSAP/Lenis).

## Constraints & Design System (must reuse)

- **Tokens** (`:root` in style.css): `--bg #0a0b0a`, `--surface #141714`, `--accent #c6ff3a`,
  `--muted #8b918a`, `--line` / `--line-strong`, `--text #ededed`.
- **Fonts:** `--display` Prata (serif), `--heading` Mona Sans, `--body` Manrope, `--mono`
  JetBrains Mono, `--sign` Caveat.
- **Spacing:** `--maxw 1320px`, `--pad clamp(20px,5vw,90px)`, `--ease cubic-bezier(.22,1,.36,1)`.
- **Sizing rule (project standing instruction):** build responsive on every component; use
  `clamp()` / fluid sizing throughout. No fixed pixel layouts.
- **Libs:** GSAP 3.12.5 + ScrollTrigger, Lenis 1.1.14. All animation is progressive enhancement —
  page must remain fully usable if CDNs fail or motion is reduced.
- **Mobile breakpoint:** standardize on `max-width: 768px` for "mobile" unless a component needs
  otherwise (Socials uses `1024px` for the desktop pin).

---

## Part 1 — Mobile Works choreography + flip

### Current behavior (the bug)
- `assets/script.js` `initWorks()` returns early at `if (window.innerWidth < 768) return;` — no
  pin, no horizontal scroll, no flip on mobile.
- `assets/style.css` `@media (max-width:768px)` (~L2000) flattens the card: `.works__flip` and
  `.works__face` get `position:static; transform:none !important;`, `.works` gets
  `perspective:none`, the strip becomes a vertical column, the back face becomes a static block.
- Net result on phones: the Hall of Fame cover renders as a dead black block; nothing animates.

### Target behavior
Identical sequence to desktop, sized for portrait:
1. "Featured Work" intro heading fades in alone and holds, then clears.
2. First panel flies up the diagonal from the bottom-right corner.
3. Horizontal right-to-left scroll across all 3 panels (scrubbed to vertical scroll).
4. The whole card flips (`rotateY 0 → -180`) so the strip turns away and the **Work Hall of Fame
   cover** faces the viewer. Pin releases; the HoF grid scrolls up after.

### Implementation
- **JS:** remove the `innerWidth < 768` early return in `initWorks()` (keep the `prefersReduced`
  and `!gsap/!ScrollTrigger` guards). The timing beats (`HEAD_PX`, `ENTER_PX`, `H_PX`, `FLIP_PX`)
  are already `innerHeight`-relative, so they scale to mobile. Ensure `ScrollTrigger.refresh()` is
  called on resize/orientationchange (a resize→refresh hook already exists for the signature; add
  works coverage / rely on `invalidateOnRefresh`).
- **CSS:** in `@media (max-width:768px)`, **stop flattening**. Keep `perspective`, `transform-style:
  preserve-3d`, `backface-visibility:hidden`, the pinned `100vh` `.works` stage, and the absolute
  strip. Add mobile overrides for **work-item placement and thumbnail sizes** so the three panels
  read well in a narrow portrait viewport instead of overlapping/clipping:
  - Reposition each `.work-item` via mobile `--wi-top`/`--wi-left` so items are legible within a
    100vw panel (e.g. larger vertical separation, left-aligned).
  - Reduce `.work-item--sm/--lg .work-item__thumb` dimensions for small screens.
- Keep `will-change`/`force3D` on the flip for GPU compositing.

### Acceptance criteria
- On a 390×844 viewport, scrolling through `.works` shows: heading reveal → corner entry →
  horizontal scroll across 3 panels → flip to the HoF cover, with no clipped/overlapping items.
- The flip lands cleanly on the "Work Hall of Fame" cover (no mirrored text, no z-fighting).
- `prefers-reduced-motion: reduce` shows a static, readable stacked fallback (no pin/flip).
- Desktop behavior is unchanged.

---

## Part 2 — Mobile Socials fanned deck

### Current behavior (the bug)
- `initSocials()` returns at `innerWidth < 1024` before applying any fan.
- `@media (max-width:1023px)` (style.css ~L1456) turns `.socials__deck` into a flex
  `overflow-x:auto` swipe-rail with `width: clamp(150px,58vw,240px)` cards → cards overflow/clip;
  does not match the reference fanned arc.

### Target behavior
The fanned card arc (matching the reference screenshot) on mobile: a centered spread of tall 9:16
cards, gently overlapping, splayed outward, fanning out on scroll-into-view.

### Implementation
- **CSS:** remove the swipe-rail block. Keep `.socials__deck { display:grid; place-items:center }`
  (the desktop stacking base) so cards stack in one cell and transforms position them into a fan.
  Tune `.social-card` width down for small screens via the existing height-capped `clamp` so 7
  cards fit ~360–430px wide without spilling.
- **JS:** for `< 1024`, instead of returning immediately, apply the **static fan geometry** to each
  card (reuse `geom(i)` → `x/y/rot/scale` via inline transform or `gsap.set`). Add a lightweight
  IntersectionObserver (or a non-pinned ScrollTrigger) that animates from stacked → fan once when
  the deck enters view. Tighten the fan spread multipliers for narrow viewports so the arc fits.
- Reduced-motion / no-JS: present the static fan (or simple stack) — never the broken rail.

### Acceptance criteria
- On a 390px-wide viewport, the Socials deck shows a centered fanned arc with no horizontal
  overflow/clipping and no scrollbar.
- Cards fan out on entry (or are statically fanned under reduced-motion).
- Desktop pin+hover fan behavior is unchanged.

---

## Part 3 — NEW "Work of Fame" → Editorial index + live preview

Placed immediately **after** the Socials section. New section `id="archive"`, base class
`.archive`. Dark background, lime accents, fits the system.

### Desktop layout (two columns)
- **Left column:** filter chips — `All · UI/UX · Web Dev · AI Builds · Branding` — followed by a
  numbered typographic list of all 28 projects: `№ · Name · Category · Year`. Row hover shows a
  thin lime underline + emphasized index.
- **Right column (sticky):** a large live-preview frame (`aspect-ratio` box). Hovering a row
  cross-fades in that project's image + a meta line (role · year). Idle state = most recent project.
- **Click a row → opens the EXISTING modal.** Rows carry `data-id` matching `portfolioData` keys, so
  the existing modal click handler (`document.querySelectorAll("[data-id]")`) wires them up
  automatically — Figma/XD/web/Claude links all work with no duplicated detail UI.

### Mobile layout (≤768px)
- Sticky side-preview can't sit beside the list, so each row becomes a **tap-to-expand accordion**:
  tapping reveals the preview image + meta inline; a "View details" control opens the modal.
- Filter chips become a horizontal chip scroller.

### Filtering
- Category derived from each project (see Data). Clicking a chip filters visible rows (and
  hides/shows accordingly); "All" resets. Pure JS class toggling; no animation dependency.

### Data
- Reuse the existing `portfolioData` object (28 entries: title, desc, created, role, image, and
  figma/xd/website/claude links). Category is **not** currently a field — derive it: add a light
  `category` mapping (by id) in JS, or infer from existing role/title. The index list can be
  generated from `portfolioData` at runtime (preferred — single source of truth) or authored as
  static HTML rows with `data-id`. **Decision: generate rows from `portfolioData` in JS** to avoid
  drift, with a static `<noscript>`/fallback list acceptable but optional.
- Year = `created` (use the latest year if a range like `2020-2025`).

### Acceptance criteria
- Section appears after Socials; lists all 28 projects with name/category/year.
- Desktop: hovering a row updates the sticky live preview; clicking opens the correct modal.
- Mobile: tapping a row expands an inline preview; "View details" opens the correct modal.
- Filters correctly narrow the list; "All" restores it.
- Original `#work` grid remains present and functional.

---

## Part 4 — NEW "Journey" → Scrollytelling vertical timeline (no tabs)

Placed at the **very bottom**, before the footer. New section `id="journey"`, base class
`.journey`. Dark background, lime accents. No tabs.

### Layout & behavior
- A single vertical **spine** spanning **2007 → Present** with a **lime progress line that fills as
  you scroll** (scroll-scrubbed via ScrollTrigger; CSS `scaleY` fallback).
- **Experience** = milestone nodes (the 4 roles). Desktop: alternating left/right of the spine.
  Mobile: single column to the right of the spine. Each milestone reveals on scroll; its node
  ignites (lime glow) as it nears center.
- **Craft (skills + tools)** = a "toolkit" block woven in mid-timeline: animated proficiency rows
  grouped Skills / Tools, bars filling on reveal. Reuse existing `data-width` values.
- **Education** = the final node (FEU, BS Marketing, 2007) as a closing card.

### Content (reuse existing copy)
- Experience: Sr. UI/UX Designer — Content House (2017–Present); Lead UI/UX & Front-End — Coreproc
  (2015–2020); UI/UX Designer — DXC Technology; UI/UX & Web Developer — Freelance (2010–2014).
- Skills/Tools: the existing `.bar` items (UI/UX 100, HTML5 97, CSS 95, Figma 100, etc.).
- Education: FEU — BS Marketing · 2003–2007.

### Reduced-motion
- Progress line shown full; all milestones/bars simply visible (no scrub, no reveal).

### Acceptance criteria
- Section appears at the very bottom, before the footer, with no tabs.
- Progress line fills as the user scrolls through the section.
- Experience milestones, skills/tools bars, and education all present and reveal correctly.
- Fully responsive (single-column spine on mobile); reduced-motion shows everything static.
- Original `#resume` tabbed section remains present and functional.

---

## Placement / final section order

```
Hero → About → Works(Featured) → Hall of Fame (orig #work) → Journey tabs (orig #resume)
→ Socials → [NEW Work of Fame #archive] → [NEW Journey #journey] → Footer
```

## Files affected
- `index.html` — add `#archive` and `#journey` section markup (or containers populated by JS).
- `assets/style.css` — Part 1 & 2 mobile rewrites; new `.archive` and `.journey` styles
  (+ their responsive rules).
- `assets/script.js` — remove Works mobile gate; Socials mobile fan; new `initArchive()`
  (list build + filter + hover/tap preview) and `initJourney()` (progress line + reveals).

## Risks & mitigations
- **Pinned 3D flip jank on low-end phones (Part 1):** keep `force3D`/`will-change`, 30fps-friendly;
  reduced-motion path avoids pin/flip entirely. Verify on a throttled mobile profile.
- **Fan overflow on very narrow screens (Part 2):** drive spread off live card width and cap by
  viewport height; test 360px.
- **Data drift (Part 3):** generate the index from `portfolioData` so the new section can't fall
  out of sync with the modal data.
- **Two Journey / two Work sections coexisting:** ensure unique IDs/classes (`#archive`,
  `#journey`) so styles/handlers don't collide with `#work`/`#resume`.
- **ScrollTrigger ordering:** adding pinned/scrubbed sections can shift offsets — call
  `ScrollTrigger.refresh()` after DOM build and on resize.

## Out of scope
- Removing or rewiring the original `#work` / `#resume` sections (owner will choose later).
- Any change to the Hero signature, contour canvas, or About choreography.
