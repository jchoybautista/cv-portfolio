# Portfolio Redesign — Lando-Inspired (Design Spec)

**Date:** 2026-06-17
**Owner:** Jonathan Bautista
**Inspiration:** https://landonorris.com/

## 1. Goal

Redesign the existing single-page portfolio (`index.html` + `assets/style.css` +
`assets/script.js`) into a dark, motion-rich, "cinematic narrative scroll"
experience inspired by landonorris.com — while **preserving all existing
content** (29 projects, project detail modal, load-more, skills/education/
experience, contact). The redesign drops the current soft-UI/neumorphism look in
favor of a flatter, sharper, modern aesthetic with neon-green accents, bold
typography, parallax, and smooth scroll.

## 2. Locked decisions

| Decision | Choice |
|---|---|
| Accent color | Neon/lime green on near-black |
| Motion stack | GSAP + ScrollTrigger + Lenis (via CDN, **no build tools / npm**) |
| Hero | Cut-out portrait layered over giant typography on a dark/neon stage; color-graded; parallax |
| Page structure | Cinematic narrative scroll (re-sequenced) |
| Content | All existing content preserved; modal + load-more kept |
| Hero tagline | **"Design-led. Code-fluent. AI-accelerated."** — `DESIGN-LED` set in lime accent, rest white |
| Display font | **Anton** (hero name + big section labels); **Inter** (body/UI). Swappable to Archivo if a wider/less-condensed feel is preferred later |
| Featured Work layout | Alternating full-width parallax rows (not a horizontal-pinned strip) |
| Delivery | New git branch; current site untouched until the swap is approved |

## 3. Visual system

- **Palette (CSS variables, exact green tunable together):**
  - Base background `#0A0B0A`
  - Raised surface `#141714`
  - Hairline border `rgba(255,255,255,0.08)`
  - Text `#EDEDED`; muted text `#8A8F88`
  - **Accent lime `#C8FF00`**; toned accent (large fills) `#A8E000`
- **Typography:**
  - Display: **Anton** — hero wordmark, big section titles/numbers (tall,
    condensed, high-impact).
  - Body/UI: **Inter** (weights 400–700).
  - Both via Google Fonts.
- **Texture & finish:** subtle film-grain/noise overlay, soft vignettes, neon
  hairlines, generous negative space. No neumorphism bevels.

## 4. Motion system (GSAP + ScrollTrigger + Lenis)

- **Smooth scroll** site-wide via Lenis, synced to ScrollTrigger.
- **Hero parallax:** photo scales/drifts slower than headline; gradient overlay
  deepens on scroll.
- **Scroll-reveal:** sections, headline words, and cards fade + rise + clip-
  reveal, staggered.
- **Animated counters:** e.g. 13+ years, 30+ projects.
- **Marquee ticker:** scrolling strip of brands worked with (AEON, Yamaha,
  Figaro, Travelbook, Smart, PRU Life, etc.) — reuses existing content.
- **Micro-interactions:** magnetic buttons, image zoom on hover, condensing
  sticky nav, lightweight page-load intro.
- **Accessibility:** honor `prefers-reduced-motion` — disable smooth-scroll
  hijack + heavy parallax, fall back to simple fades / no motion. Content fully
  readable and navigable without JS (progressive enhancement).

## 5. Sections (top → bottom)

1. **Nav** — minimal fixed bar: name left; Work / Resume / Contact + "Download
   CV" right; condenses on scroll; mobile = fullscreen menu.
2. **Hero** — full-viewport dark stage (grain + soft neon-lime glow/spotlight).
   Transparent cut-out portrait layered **over** a giant "JONATHAN BAUTISTA"
   Anton wordmark (figure in front, type behind — depth is the signature move).
   Tagline ("Design-led. Code-fluent. AI-accelerated."), neon role line, scroll
   cue, subtle social icons. The portrait is color-graded (higher contrast,
   slightly cooler tone, lime rim-light) so the bright studio shot reads
   cinematic. Parallax: figure and type drift at different speeds on scroll.
3. **Intro / manifesto** — one bold large statement with key phrases highlighted
   in neon, animated on reveal (sourced from existing bio: "13+ years turning
   the messiest ideas into digital products people genuinely enjoy using…"),
   plus animated stat counters.
4. **Featured Work** — cinematic large-format set of ~6 standout projects
   (Claude builds: Velocità store + admin, FF7 landing; Figaro/Vanguard/Gacha
   Figma-Make builds; plus a classic or two), big imagery with parallax,
   alternating full-width rows. Clicking opens the **same modal**.
5. **All Work** — full 29-project grid, restyled (dark cards, neon hover, image
   zoom, staggered reveal). **Load More + modal preserved**; modal restyled to
   match the new aesthetic.
6. **Resume** — restyled tabs (Skills / Education / Experience). Progress bars
   animate to width on scroll with a neon gradient; timeline restyled. All
   existing skill/tool/experience/education data retained.
7. **Contact / Footer** — large "Let's work together" CTA, email/phone, social
   links, Download CV.

## 6. Architecture

- **Stays static:** `index.html`, `assets/style.css`, `assets/script.js`.
  GSAP/ScrollTrigger/Lenis loaded via CDN `<script>` tags; fonts via Google
  Fonts `<link>`.
- **`portfolioData` object + modal logic preserved and extended**, restyled —
  not rewritten from scratch.
- **Progressive enhancement:** semantic HTML readable without JS; motion is the
  enhancement layer.
- **Branching:** implemented on a new git branch so the current live site
  remains intact until the redesign is approved and swapped in.

## 7. Responsive & performance

- Mobile-first responsive across hero, featured rows, grid, resume, footer.
- Heavy parallax reduced/disabled on small screens and under reduced-motion.
- Images: lazy-load offscreen project images; keep existing assets.
- No render-blocking beyond fonts + CDN libs; defer scripts.

## 8. Content preservation checklist

- [ ] All 29 projects (grid items + `portfolioData` entries with Figma/XD/
      Website/Claude links) carried over.
- [ ] Load-More behavior retained.
- [ ] Project modal retained (restyled).
- [ ] Resume: Skills (with percentages), Tools, Education, Experience timeline.
- [ ] Bio copy repurposed into hero/manifesto.
- [ ] Social links + Download CV.
- [ ] NDA note for 2012–2019 work retained somewhere appropriate.

## 9. Assets

- **Hero photo: provided.** Transparent cut-out portrait, 2000×3000 PNG (clean
  edges, bright studio look, navy polo, arms crossed). To be saved at
  `assets/img/hero-cutout.png`. Color-grading (contrast, cooler tint, lime
  rim-light/glow) applied via CSS so it integrates with the dark theme. A
  moodier/secondary photo can be added later but is not required.

## 10. Out of scope

- Backend, CMS, or contact-form submission (contact stays mailto/tel).
- Cleaning up unrelated stale files in the repo (`CE *.html`, `test2.html`) —
  left as-is unless requested.
- Migrating to a framework/build system (intentionally staying static).

## 11. Open / tunable items (safe defaults chosen; revisit during build)

- Exact accent green hex.
- Anton vs. Archivo for display type.
- Featured Work as alternating rows vs. horizontal-pinned strip.
- Intensity of the hero portrait color-grade / neon glow.
- Whether to add a preloader/intro animation (currently: lightweight yes).
