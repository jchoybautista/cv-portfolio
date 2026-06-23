# Portfolio — Mobile Fixes + Work-of-Fame & Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile (≤767px) Works choreography + flip and the Socials fanned deck, then add two new additive sections — an editorial "Work of Fame" index and a scrollytelling "Journey" timeline.

**Architecture:** Vanilla `index.html` + `assets/style.css` + `assets/script.js` (single IIFE). Animation is GSAP 3.12.5 + ScrollTrigger over Lenis smooth-scroll, applied as progressive enhancement. New sections reuse existing `portfolioData` and the existing modal/reveal/skill-bar machinery to stay DRY.

**Tech Stack:** HTML5, CSS3 (custom properties, clamp, grid), vanilla JS, GSAP + ScrollTrigger, Lenis.

## Global Constraints

- Design tokens (verbatim): `--bg #0a0b0a`, `--surface #141714`, `--surface-2 #181c18`, `--accent #c6ff3a`, `--accent-dim #9ec92a`, `--accent-glow rgba(198,255,58,.35)`, `--muted #8b918a`, `--muted-2 #5f655e`, `--text #ededed`, `--line rgba(255,255,255,.09)`, `--line-strong rgba(255,255,255,.18)`.
- Fonts: `--display` Prata, `--heading` Mona Sans, `--body` Manrope, `--mono` JetBrains Mono, `--sign` Caveat.
- Layout vars: `--maxw 1320px`, `--pad clamp(20px,5vw,90px)`, `--ease cubic-bezier(.22,1,.36,1)`.
- Responsive-first: use `clamp()`/fluid sizing on every new component. No fixed-pixel layouts.
- All motion is progressive enhancement: must remain usable with no JS and must honor `prefers-reduced-motion: reduce` (static fallback, no pin/flip/scrub).
- Do **not** modify or remove the original Hall of Fame grid (`#work`) or tabbed Journey (`#resume`). New sections use new ids: `#archive`, `#journey`.
- Mobile breakpoint = `max-width: 768px` except: Socials desktop pin uses `1024px`; Archive two-col/sticky split uses `920px`; Journey alternating layout uses `860px`.

## Verification environment (used by every task)

Start a static server from the repo root and open it in Chrome with the device toolbar:

```bash
cd /Users/jonathanbautista/Documents/Work/AI/choybautista.github.io
python3 -m http.server 8000
# open http://localhost:8000  → DevTools (Cmd+Opt+I) → device toolbar (Cmd+Shift+M)
```

Test viewports: **mobile 390×844**, **small 360×780**, **desktop 1440×900**. Reduced-motion check: DevTools → Rendering panel → "Emulate CSS prefers-reduced-motion: reduce".

## File Structure

- `index.html` — add `<section id="archive">` (after Socials) and `<section id="journey">` (last in `<main>`, before footer). Touch nothing else.
- `assets/style.css` — rewrite the mobile Works block (~L2000–2097) and the mobile Socials block (~L1456–1479); append new `.archive` and `.journey` style blocks.
- `assets/script.js` — remove the Works mobile gate; add Socials mobile fan; expose `openPortfolio`; add `initArchive()` + `initJourney()`.

---

## Task 1: Mobile Works — enable full choreography + flip on touch

**Files:**
- Modify: `assets/script.js` (initWorks gate, ~L730–733)
- Modify: `assets/style.css` (works mobile media query, ~L2000–2097)

**Interfaces:**
- Consumes: existing `initWorks()` GSAP timeline (heading reveal, diagonal entry, horizontal scroll, flip).
- Produces: no new symbols. Behavioral change only.

- [ ] **Step 1: Remove the mobile early-return in `initWorks()`**

In `assets/script.js`, find:

```javascript
  (function initWorks() {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    if (window.innerWidth < 768) return; // mobile handled purely via CSS
```

Replace with (delete the width gate so the choreography runs on touch too):

```javascript
  (function initWorks() {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
```

- [ ] **Step 2: Rewrite the Works mobile CSS so it no longer flattens the card**

In `assets/style.css`, replace the entire block that starts at `/* Mobile: disable horizontal effect, stack vertically */` `@media (max-width: 768px) {` (through its closing `}` just before `/* ---------- Reveal ---------- */`) with:

```css
/* Mobile: KEEP the pinned 3D choreography (heading → corner entry → horizontal
   scroll → flip). Only re-tune sizes/positions so the panels fit a portrait
   viewport instead of clipping. */
@media (max-width: 768px) {
  .works__intro-title {
    font-size: clamp(40px, 13vw, 72px);
  }
  .hof-cover__title {
    font-size: clamp(40px, 12vw, 72px);
  }

  /* Smaller thumbnails so three items read inside one 100vw panel */
  .work-item--sm .work-item__thumb {
    width: clamp(104px, 32vw, 150px);
    height: clamp(140px, 44vw, 200px);
  }
  .work-item--lg .work-item__thumb {
    width: clamp(168px, 54vw, 240px);
    height: clamp(224px, 72vw, 320px);
  }

  /* Re-place the three items per panel into a legible portrait cluster.
     Overrides the inline --wi-top/--wi-left via higher-specificity rules. */
  .works__panel .work-item:nth-of-type(1) { top: 8vh;  left: 5vw;  }
  .works__panel .work-item:nth-of-type(2) { top: 27vh; left: 24vw; }
  .works__panel .work-item:nth-of-type(3) { top: 63vh; left: 50vw; }
}
```

- [ ] **Step 3: Verify on mobile (390×844)**

Reload `http://localhost:8000` in device mode at 390×844. Scroll slowly through the Works section.
Expected (PASS): "Featured Work" heading fades in alone → first panel rises from the bottom-right corner → panels scroll right-to-left → the whole card flips and the "WORK Hall of Fame" cover faces you → pin releases and the HoF grid scrolls up. No work-item is clipped off the right edge; no horizontal page scrollbar.
If any item clips, nudge its `nth-of-type` `left` value down by a few vw and re-check.

- [ ] **Step 4: Verify at 360×780 and reduced-motion**

At 360×780: same sequence, still no clipping.
Toggle "Emulate prefers-reduced-motion: reduce" and reload: the Works section shows a static, readable layout with **no** pin/flip (page just scrolls). PASS = no stuck black block, no broken overlap.

- [ ] **Step 5: Verify desktop unchanged (1440×900)**

At 1440×900 the Works choreography is identical to before (heading → entry → horizontal → flip). PASS = no regression.

- [ ] **Step 6: Commit**

```bash
git add assets/script.js assets/style.css
git commit -m "fix: run Works scroll choreography + flip on mobile (re-tuned for portrait)"
```

---

## Task 2: Mobile Socials — fanned deck instead of swipe-rail

**Files:**
- Modify: `assets/script.js` (`geom()` and the `< 1024` branch in `initSocials()`, ~L870–898)
- Modify: `assets/style.css` (socials mobile media query, ~L1456–1479; add ≤767 card width)

**Interfaces:**
- Consumes: existing `cards`, `mid`, `geom(i)` in `initSocials()`.
- Produces: no new symbols; mobile now renders the fan.

- [ ] **Step 1: Make `geom()` viewport-aware (tighter fan on mobile)**

In `assets/script.js`, replace the `geom` function inside `initSocials()`:

```javascript
    const geom = (i) => {
      const cw = cards[Math.round(mid)].offsetWidth || 200;
      const o = i - mid;
      const ax = Math.abs(o);
      const arc = (ax + ax * ax * 0.12) * cw * 0.08;
      const arcMax = (mid + mid * mid * 0.12) * cw * 0.08;
      return {
        x: o * cw * 0.6, // horizontal spread (cards overlap)
        y: arc - arcMax * 0.35, // outer cards arc down, centre rides a touch up
        rot: o * 6.5, // splay outward
        scale: 1 - ax * 0.05, // outer cards sit a touch smaller
      };
    };
```

with:

```javascript
    const geom = (i) => {
      const cw = cards[Math.round(mid)].offsetWidth || 200;
      const o = i - mid;
      const ax = Math.abs(o);
      const mobile = window.innerWidth < 768;
      const spreadX = mobile ? 0.44 : 0.6;
      const arcK = mobile ? 0.06 : 0.08;
      const rotK = mobile ? 5 : 6.5;
      const arc = (ax + ax * ax * 0.12) * cw * arcK;
      const arcMax = (mid + mid * mid * 0.12) * cw * arcK;
      return {
        x: o * cw * spreadX, // horizontal spread (cards overlap)
        y: arc - arcMax * 0.35, // outer cards arc down, centre rides a touch up
        rot: o * rotK, // splay outward
        scale: 1 - ax * 0.05, // outer cards sit a touch smaller
      };
    };
```

- [ ] **Step 2: Replace the `< 1024` early-return with a mobile fan branch**

In `assets/script.js`, find:

```javascript
    // Phone / tablet: CSS turns the deck into a swipe rail — no fan, no pin.
    // The fan is a hover + scroll-pin interaction, so it's desktop-only.
    if (window.innerWidth < 1024) return;
```

Replace with:

```javascript
    // Phone / tablet: present the SAME fan (no pin). It fans out from a stack
    // once when the deck scrolls into view; static under reduced-motion / no GSAP.
    if (window.innerWidth < 1024) {
      const g2 = window.gsap;
      const applyFan = (animate) => {
        cards.forEach((card, i) => {
          const g = geom(i);
          if (animate && g2) {
            g2.to(card, {
              x: g.x, y: g.y, rotation: g.rot, scale: g.scale,
              duration: 0.7, ease: "power3.out",
              delay: Math.abs(i - mid) * 0.06,
            });
          } else {
            card.style.transform =
              `translate(${g.x}px, ${g.y}px) rotate(${g.rot}deg) scale(${g.scale})`;
          }
        });
      };
      if (prefersReduced || !g2) { applyFan(false); return; }
      g2.set(cards, { x: 0, y: 0, rotation: 0, scale: 1 });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return;
            applyFan(true);
            io.disconnect();
          });
        }, { threshold: 0.35 });
        io.observe(deck);
      } else {
        applyFan(true);
      }
      return;
    }
```

- [ ] **Step 3: Replace the Socials swipe-rail CSS with fan-friendly mobile CSS**

In `assets/style.css`, replace the block:

```css
/* Phone & tablet / no-JS fallback — the fan is a desktop hover+pin
   interaction, so on touch widths the deck becomes a swipe rail instead. */
@media (max-width: 1023px) {
  .socials__stage {
    min-height: auto;
    align-items: stretch;
  }
  .socials__deck {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    padding-bottom: 18px;
    scrollbar-width: none;
    transform: none !important;
  }
  .socials__deck::-webkit-scrollbar {
    display: none;
  }
  .social-card {
    flex: 0 0 auto;
    width: clamp(150px, 58vw, 240px);
    transform: none !important;
    scroll-snap-align: center;
  }
}
```

with:

```css
/* Phone & tablet — keep the grid-stacked deck (base) so JS can fan the cards
   out exactly like desktop, just tighter. No swipe rail. */
@media (max-width: 1023px) {
  .socials__stage {
    min-height: auto;
  }
}
@media (max-width: 767px) {
  .social-card {
    width: clamp(92px, 29vw, 124px);
  }
}
```

- [ ] **Step 4: Verify mobile fan (390×844 and 360×780)**

Reload, scroll to the "What's up / on socials" section.
Expected (PASS): cards start stacked, then fan out into a centered arc as the deck enters view (matching the reference). The arc is centered; no horizontal page scrollbar; outer cards may sit slightly off-frame by design but the fan reads balanced. Re-check at 360px.
If outer cards clip too hard, lower `spreadX` (e.g. 0.40) and/or the `.social-card` width clamp max.

- [ ] **Step 5: Verify reduced-motion + desktop**

Reduced-motion on: the deck shows a static fan immediately (no animation), not a rail. PASS.
Desktop 1440×900: pinned scroll-driven fan + hover focus unchanged. PASS.

- [ ] **Step 6: Commit**

```bash
git add assets/script.js assets/style.css
git commit -m "fix: Socials renders Lando-style fanned deck on mobile (replaces swipe-rail)"
```

---

## Task 3: New Work of Fame — section, data-driven list, filtering

**Files:**
- Modify: `index.html` (insert `<section id="archive">` after the Socials `</section>`, before `</main>`)
- Modify: `assets/style.css` (append `.archive` styles)
- Modify: `assets/script.js` (add `let openPortfolio = null;`; set it in the modal block; add + call `initArchive()` before the modal block)

**Interfaces:**
- Consumes: existing `portfolioData` (keys 1–29, each `{title, created, role, image, ...}`).
- Produces:
  - `let openPortfolio` — IIFE-scope reference to `openModal(id)`, set inside the modal block.
  - DOM: `#archive-list` populated with `<li class="archive__row" data-cat="<Category>">` rows; each row's button is `.archive__row-main[data-archive-id="<id>"][data-img][data-name][data-info]`; each row also contains `.archive__row-preview > img` + `.archive__details[data-archive-id]`.
  - `#archive-filters` populated with `.archive__chip[data-filter]` (consumed by Task 4 for active styling; filtering wired here).

- [ ] **Step 1: Add the Archive section markup**

In `index.html`, immediately AFTER the Socials section's closing `</section>` (the one that ends right before `</main>`), insert:

```html
      <!-- ===================== WORK OF FAME (editorial index) ===================== -->
      <section class="archive" id="archive">
        <div class="archive__head">
          <span class="archive__kicker">The Complete Archive</span>
          <h2 class="archive__title">Work <em>of Fame</em></h2>
        </div>
        <div class="archive__filters" id="archive-filters" role="tablist" aria-label="Filter projects"></div>
        <div class="archive__layout">
          <ol class="archive__list" id="archive-list"></ol>
          <aside class="archive__preview" id="archive-preview" aria-hidden="true">
            <div class="archive__preview-frame"><img id="archive-preview-img" src="" alt="" /></div>
            <div class="archive__preview-meta">
              <span id="archive-preview-name"></span>
              <span id="archive-preview-info"></span>
            </div>
          </aside>
        </div>
      </section>
```

- [ ] **Step 2: Append the Archive CSS**

At the END of `assets/style.css`, append:

```css
/* ===================== WORK OF FAME (editorial index) ===================== */
.archive {
  position: relative;
  z-index: 2;
  background: var(--bg);
  max-width: var(--maxw);
  margin: 0 auto;
  padding: clamp(70px, 12vh, 140px) var(--pad) clamp(60px, 10vh, 120px);
}
.archive__head { margin-bottom: clamp(30px, 5vh, 56px); }
.archive__kicker {
  display: block; font-family: var(--mono); font-size: 13px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent);
  margin-bottom: clamp(12px, 2vw, 20px);
}
.archive__title {
  font-family: var(--heading); font-weight: 900; text-transform: uppercase;
  line-height: 0.92; letter-spacing: -0.02em; color: var(--text);
  font-size: clamp(40px, 8vw, 110px);
}
.archive__title em {
  font-style: normal; font-family: var(--display); text-transform: none;
  letter-spacing: -0.01em; color: var(--accent);
}
.archive__filters {
  display: flex; gap: 10px; flex-wrap: wrap;
  margin-bottom: clamp(22px, 4vh, 38px);
}
.archive__chip {
  font-family: var(--mono); font-size: 12px; letter-spacing: 0.05em;
  text-transform: uppercase; color: var(--muted);
  border: 1px solid var(--line); border-radius: 100px; padding: 9px 18px;
  transition: color .3s, border-color .3s, background .3s;
}
.archive__chip:hover { color: var(--text); border-color: var(--line-strong); }
.archive__chip.is-active { color: #0a0b0a; background: var(--accent); border-color: var(--accent); }

.archive__layout { display: grid; grid-template-columns: 1fr; gap: clamp(28px, 4vw, 56px); }
.archive__list { list-style: none; }
.archive__row { border-top: 1px solid var(--line); }
.archive__list .archive__row:last-child { border-bottom: 1px solid var(--line); }
.archive__row.is-hidden { display: none; }
.archive__row-main {
  width: 100%; display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  align-items: center; gap: clamp(12px, 2vw, 24px);
  padding: clamp(15px, 2.2vh, 24px) 0; text-align: left; color: var(--text);
}
.archive__num { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.archive__name {
  font-family: var(--heading); font-weight: 700; letter-spacing: -0.01em;
  font-size: clamp(18px, 2.4vw, 30px); transition: color .3s;
}
.archive__cat {
  font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--muted);
}
.archive__year { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.archive__arrow { color: var(--accent); opacity: 0; transform: translateX(-6px); transition: opacity .3s, transform .3s; }
.archive__row-main:hover .archive__name { color: var(--accent); }
.archive__row-main:hover .archive__arrow { opacity: 1; transform: none; }

.archive__row-preview { display: none; }

.archive__preview {
  position: sticky; top: 90px;
  border: 1px solid var(--line); border-radius: 18px; overflow: hidden;
  background: var(--surface);
}
.archive__preview-frame { aspect-ratio: 4 / 3; overflow: hidden; background: var(--surface-2); }
.archive__preview-frame img { width: 100%; height: 100%; object-fit: cover; transition: opacity .4s var(--ease); }
.archive__preview-meta { display: flex; justify-content: space-between; gap: 12px; padding: 16px 18px; }
.archive__preview-meta span:first-child { font-family: var(--heading); font-weight: 700; }
.archive__preview-meta span:last-child { font-family: var(--mono); font-size: 12px; color: var(--muted); text-align: right; }

/* Desktop: two columns + sticky live preview */
@media (min-width: 920px) {
  .archive__layout { grid-template-columns: 1.05fr 0.95fr; align-items: start; }
}

/* Tablet / mobile: single column, no sticky preview, rows expand inline */
@media (max-width: 919px) {
  .archive__preview { display: none; }
  .archive__row-main { grid-template-columns: auto 1fr auto; }
  .archive__cat { display: none; }
  .archive__row.is-open .archive__row-preview {
    display: block; padding: 2px 0 20px;
  }
  .archive__row-preview img { border-radius: 12px; aspect-ratio: 4 / 3; object-fit: cover; width: 100%; }
  .archive__details {
    margin-top: 14px; font-family: var(--mono); font-size: 12px; text-transform: uppercase;
    letter-spacing: 0.05em; color: var(--accent);
    border: 1px solid var(--line-strong); border-radius: 100px; padding: 9px 18px;
  }
}
```

- [ ] **Step 3: Expose `openPortfolio` in IIFE scope**

In `assets/script.js`, find the line near the top of the IIFE:

```javascript
  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
```

Insert above it:

```javascript
  // Set by the modal block; lets initArchive() open the shared project modal.
  let openPortfolio = null;
```

Then, inside the `if (modal) {` block, find the end of `function openModal(id) { ... }` and immediately after that function's closing `}` add:

```javascript
    openPortfolio = openModal;
```

- [ ] **Step 4: Add `initArchive()` and call it before the modal block**

In `assets/script.js`, immediately BEFORE the line `const modal = document.getElementById("portfolio-modal");`, insert:

```javascript
  /* ---------- WORK OF FAME — editorial index built from portfolioData ---------- */
  function initArchive() {
    const listEl = document.getElementById("archive-list");
    const filtersEl = document.getElementById("archive-filters");
    if (!listEl || typeof portfolioData !== "object") return;

    // id → category (no category field exists in portfolioData, so map it here)
    const CATS = {
      1:"UI/UX",2:"UI/UX",3:"UI/UX",4:"UI/UX",5:"UI/UX",6:"UI/UX",8:"UI/UX",
      9:"UI/UX",10:"UI/UX",17:"UI/UX",18:"UI/UX",19:"UI/UX",20:"UI/UX",21:"UI/UX",
      7:"Web Dev",11:"Web Dev",12:"Web Dev",13:"Web Dev",14:"Web Dev",15:"Web Dev",16:"Web Dev",
      22:"AI Builds",23:"AI Builds",24:"AI Builds",25:"AI Builds",26:"AI Builds",27:"AI Builds",28:"AI Builds",29:"AI Builds",
    };
    const lastYear = (s) => {
      const m = String(s || "").match(/\d{4}/g);
      return m ? parseInt(m[m.length - 1], 10) : 0;
    };

    // Build a sorted list (newest first) of {id, data, cat, year}
    const items = Object.keys(portfolioData).map((id) => ({
      id: id,
      data: portfolioData[id],
      cat: CATS[id] || "UI/UX",
      year: lastYear(portfolioData[id].created),
    })).sort((a, b) => b.year - a.year || (a.data.title < b.data.title ? -1 : 1));

    // Rows
    listEl.innerHTML = "";
    items.forEach((it, idx) => {
      const num = String(idx + 1).padStart(2, "0");
      const shortName = it.data.title.split(/[—-]| App| Website| Mobile/)[0].trim() || it.data.title;
      const info = it.cat + " · " + (it.data.created || it.year) + " · " + (it.data.role || "");
      const li = document.createElement("li");
      li.className = "archive__row";
      li.setAttribute("data-cat", it.cat);
      li.innerHTML =
        '<button class="archive__row-main" type="button"' +
          ' data-archive-id="' + it.id + '"' +
          ' data-img="' + it.data.image + '"' +
          ' data-name="' + shortName.replace(/"/g, "&quot;") + '"' +
          ' data-info="' + info.replace(/"/g, "&quot;") + '" aria-expanded="false">' +
          '<span class="archive__num">' + num + '</span>' +
          '<span class="archive__name">' + shortName + '</span>' +
          '<span class="archive__cat">' + it.cat + '</span>' +
          '<span class="archive__year">' + (it.data.created || it.year) + '</span>' +
          '<span class="archive__arrow" aria-hidden="true">↗</span>' +
        '</button>' +
        '<div class="archive__row-preview">' +
          '<img src="' + it.data.image + '" alt="" loading="lazy" />' +
          '<button class="archive__details" type="button" data-archive-id="' + it.id + '">View details →</button>' +
        '</div>';
      listEl.appendChild(li);
    });

    // Filter chips from the categories actually present
    if (filtersEl) {
      const cats = ["All"].concat(
        Array.from(new Set(items.map((i) => i.cat)))
      );
      filtersEl.innerHTML = cats.map((c, i) =>
        '<button class="archive__chip' + (i === 0 ? ' is-active' : '') +
        '" type="button" data-filter="' + c + '">' + c + '</button>'
      ).join("");
      filtersEl.addEventListener("click", (e) => {
        const chip = e.target.closest(".archive__chip");
        if (!chip) return;
        filtersEl.querySelectorAll(".archive__chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        const f = chip.getAttribute("data-filter");
        listEl.querySelectorAll(".archive__row").forEach((row) => {
          const show = f === "All" || row.getAttribute("data-cat") === f;
          row.classList.toggle("is-hidden", !show);
          row.classList.remove("is-open");
        });
      });
    }
  }
  initArchive();
```

- [ ] **Step 5: Verify the list + filters render (desktop 1440×900)**

Reload. Scroll past Socials to the new "Work of Fame" section.
Expected (PASS): a numbered list of all projects (newest first) with name / category / year; a sticky preview panel on the right; filter chips `All · UI/UX · Web Dev · AI Builds`. Clicking a chip narrows the list; "All" restores it. (Hover preview + click-to-open come in Task 4.)

- [ ] **Step 6: Verify single-column on mobile (390×844)**

At 390×844: the list is single-column, category column hidden, no sticky preview, chips wrap/scroll. PASS = readable list, no overflow.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/style.css assets/script.js
git commit -m "feat: add Work of Fame editorial index (data-driven list + category filters)"
```

---

## Task 4: New Work of Fame — live preview (desktop) + inline expand (mobile) + modal

**Files:**
- Modify: `assets/script.js` (extend `initArchive()` with interaction handlers)

**Interfaces:**
- Consumes: `openPortfolio` (Task 3), the `.archive__row-main[data-archive-id|data-img|data-name|data-info]` rows and `#archive-preview-*` nodes (Task 3).
- Produces: no new symbols; adds hover/click behavior.

- [ ] **Step 1: Add interaction handlers to `initArchive()`**

In `assets/script.js`, inside `initArchive()`, just BEFORE its final closing `}` (after the filters block), insert:

```javascript
    // Live preview (desktop) — hovering a row swaps the sticky image + meta.
    const pImg = document.getElementById("archive-preview-img");
    const pName = document.getElementById("archive-preview-name");
    const pInfo = document.getElementById("archive-preview-info");
    const setPreview = (btn) => {
      if (!pImg) return;
      pImg.style.opacity = "0";
      const src = btn.getAttribute("data-img");
      const apply = () => {
        pImg.src = src;
        pName.textContent = btn.getAttribute("data-name");
        pInfo.textContent = btn.getAttribute("data-info");
        pImg.style.opacity = "1";
      };
      // tiny delay so the fade reads; load-safe
      pImg.onload = () => { pImg.style.opacity = "1"; };
      apply();
    };
    // Seed preview with the first (newest) row
    const firstBtn = listEl.querySelector(".archive__row-main");
    if (firstBtn) setPreview(firstBtn);

    const isCompact = () => window.matchMedia("(max-width: 919px)").matches;

    listEl.querySelectorAll(".archive__row-main").forEach((btn) => {
      btn.addEventListener("mouseenter", () => { if (!isCompact()) setPreview(btn); });
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-archive-id");
        if (isCompact()) {
          // mobile: toggle inline expand
          const row = btn.closest(".archive__row");
          const open = row.classList.toggle("is-open");
          btn.setAttribute("aria-expanded", open ? "true" : "false");
        } else if (openPortfolio) {
          openPortfolio(id);
        }
      });
    });

    // "View details" inside an expanded mobile row → open the shared modal
    listEl.querySelectorAll(".archive__details").forEach((d) => {
      d.addEventListener("click", (e) => {
        e.stopPropagation();
        if (openPortfolio) openPortfolio(d.getAttribute("data-archive-id"));
      });
    });
```

- [ ] **Step 2: Verify desktop hover + click-to-modal (1440×900)**

Reload. In the Work of Fame list: hovering different rows cross-fades the sticky preview image + updates the name/meta. Clicking a row opens the existing project modal with the correct title, description, created/role, and the right Figma/XD/Web/Claude links.
PASS = preview tracks hover; modal opens with matching content; Escape/✕/backdrop close it.

- [ ] **Step 3: Verify mobile expand + details (390×844)**

At 390×844: tapping a row expands an inline preview image under it (and collapses on second tap). Tapping "View details →" opens the shared modal with the correct project. Switching a filter closes any open rows.
PASS = expand toggles; details opens correct modal; no double-open.

- [ ] **Step 4: Verify the original grid still works**

Scroll up to the original Hall of Fame grid (`#work`): its cards still open the modal as before. PASS = no regression (the generic `[data-id]` handler is untouched; archive uses `data-archive-id`).

- [ ] **Step 5: Commit**

```bash
git add assets/script.js
git commit -m "feat: Work of Fame live preview (hover) + mobile expand + shared modal wiring"
```

---

## Task 5: New Journey — scrollytelling vertical timeline (no tabs)

**Files:**
- Modify: `index.html` (insert `<section id="journey">` as the LAST child of `<main>`, before `</main>`)
- Modify: `assets/style.css` (append `.journey` styles)
- Modify: `assets/script.js` (add + call `initJourney()` for the scroll-scrubbed progress line)

**Interfaces:**
- Consumes: existing `.reveal` IntersectionObserver (auto-wires `.journey__node.reveal`) and the existing `.bar__fill` IntersectionObserver (auto-wires reused skill bars).
- Produces: `initJourney()` (IIFE-scoped); a scrubbed ScrollTrigger on `#journey-progress`.

- [ ] **Step 1: Add the Journey section markup (last in `<main>`)**

In `index.html`, immediately BEFORE `</main>` (after the Archive section from Task 3), insert:

```html
      <!-- ===================== JOURNEY (scrollytelling timeline) ===================== -->
      <section class="journey" id="journey">
        <div class="journey__head">
          <span class="journey__kicker">2007 — Present</span>
          <h2 class="journey__title">The <em>Journey</em></h2>
        </div>

        <div class="journey__timeline" id="journey-timeline">
          <div class="journey__spine" aria-hidden="true"><span class="journey__progress" id="journey-progress"></span></div>

          <article class="journey__node reveal" data-side="right">
            <span class="journey__year">2017 — Present</span>
            <h3 class="journey__role">Sr. UI/UX Designer</h3>
            <span class="journey__org">Content House Inc.</span>
            <ul class="journey__points">
              <li>Lead a small UI/UX design team.</li>
              <li>Design websites &amp; mobile apps in Adobe XD / Figma.</li>
              <li>Build responsive Squarespace sites with custom HTML, CSS, JS &amp; jQuery.</li>
              <li>Support devs building Vue/React components.</li>
            </ul>
          </article>

          <article class="journey__node reveal" data-side="left">
            <span class="journey__year">2015 — 2020</span>
            <h3 class="journey__role">Lead UI/UX Designer &amp; Front-End Developer</h3>
            <span class="journey__org">Coreproc Inc.</span>
            <ul class="journey__points">
              <li>UI/UX for websites &amp; mobile apps; PSD slicing.</li>
              <li>Converted designs into responsive front-end builds.</li>
              <li>Guided the team toward excellent UI/UX.</li>
            </ul>
          </article>

          <article class="journey__node reveal" data-side="right">
            <span class="journey__year">Taguig</span>
            <h3 class="journey__role">UI/UX Designer</h3>
            <span class="journey__org">DXC Technology</span>
            <ul class="journey__points">
              <li>UI/UX designs for web applications.</li>
              <li>RPA automations with WinAutomation.</li>
            </ul>
          </article>

          <article class="journey__node reveal" data-side="left">
            <span class="journey__year">2010 — 2014</span>
            <h3 class="journey__role">UI/UX Designer &amp; Web Developer</h3>
            <span class="journey__org">Freelance</span>
            <ul class="journey__points">
              <li>Photo editing, coupons &amp; posters in Photoshop.</li>
              <li>Designed websites and converted them into WordPress.</li>
            </ul>
          </article>

          <div class="journey__toolkit reveal">
            <h3>Toolkit</h3>
            <div class="journey__bars">
              <div class="bar"><div class="bar__head"><span>UI/UX Design</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Figma</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Adobe XD</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Prototyping</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>HTML5</span><span>97%</span></div><div class="bar__track"><div class="bar__fill" data-width="97"></div></div></div>
              <div class="bar"><div class="bar__head"><span>CSS3 / SASS</span><span>95%</span></div><div class="bar__track"><div class="bar__fill" data-width="95"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Mobile-Web Responsive</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>CSS Frameworks</span><span>100%</span></div><div class="bar__track"><div class="bar__fill" data-width="100"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Vibe Coding</span><span>87%</span></div><div class="bar__track"><div class="bar__fill" data-width="87"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Generative AI</span><span>85%</span></div><div class="bar__track"><div class="bar__fill" data-width="85"></div></div></div>
              <div class="bar"><div class="bar__head"><span>Photoshop</span><span>90%</span></div><div class="bar__track"><div class="bar__fill" data-width="90"></div></div></div>
              <div class="bar"><div class="bar__head"><span>jQuery</span><span>55%</span></div><div class="bar__track"><div class="bar__fill" data-width="55"></div></div></div>
            </div>
          </div>

          <article class="journey__node journey__node--edu reveal" data-side="right">
            <span class="journey__year">2003 — 2007</span>
            <h3 class="journey__role">BS, Major in Marketing</h3>
            <span class="journey__org">Far Eastern University — Manila</span>
          </article>
        </div>
      </section>
```

- [ ] **Step 2: Append the Journey CSS**

At the END of `assets/style.css`, append:

```css
/* ===================== JOURNEY (scrollytelling timeline) ===================== */
.journey {
  position: relative; z-index: 2; background: var(--bg);
  max-width: var(--maxw); margin: 0 auto;
  padding: clamp(70px, 12vh, 140px) var(--pad) clamp(80px, 14vh, 160px);
}
.journey__head { text-align: center; margin-bottom: clamp(40px, 8vh, 80px); }
.journey__kicker {
  display: block; font-family: var(--mono); font-size: 13px;
  letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent); margin-bottom: 14px;
}
.journey__title {
  font-family: var(--heading); font-weight: 900; text-transform: uppercase;
  line-height: 0.92; letter-spacing: -0.02em; font-size: clamp(40px, 8vw, 110px); color: var(--text);
}
.journey__title em { font-style: normal; font-family: var(--display); text-transform: none; color: var(--accent); }

.journey__timeline { position: relative; }
.journey__spine { position: absolute; top: 6px; bottom: 6px; left: 18px; width: 2px; background: var(--line); }
.journey__progress {
  position: absolute; inset: 0; width: 100%;
  background: linear-gradient(var(--accent), var(--accent-dim));
  box-shadow: 0 0 12px var(--accent-glow);
  transform: scaleY(0); transform-origin: top;
}

.journey__node, .journey__toolkit { position: relative; padding-left: 52px; margin-bottom: clamp(32px, 6vh, 60px); }
.journey__node::before {
  content: ""; position: absolute; left: 11px; top: 5px; width: 16px; height: 16px;
  border-radius: 50%; background: var(--bg); border: 2px solid var(--muted-2);
  transition: background .4s, border-color .4s, box-shadow .4s;
}
.journey__node.in::before { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 16px var(--accent-glow); }
.journey__year { font-family: var(--mono); font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; color: var(--accent); }
.journey__role { font-family: var(--body); font-weight: 800; font-size: clamp(18px, 2.4vw, 24px); margin: 6px 0 4px; }
.journey__org { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.journey__points { list-style: none; margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
.journey__points li { position: relative; padding-left: 20px; color: var(--muted); font-size: 15px; }
.journey__points li::before { content: "→"; position: absolute; left: 0; color: var(--accent); }

.journey__toolkit { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: clamp(22px, 3vw, 34px); }
.journey__toolkit > h3 {
  font-family: var(--heading); font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.04em; color: var(--accent); font-size: 18px; margin-bottom: 18px;
}
.journey__bars { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 600px) { .journey__bars { grid-template-columns: 1fr 1fr; gap: 14px 40px; } }

/* Desktop: centre the spine and alternate milestones left / right */
@media (min-width: 860px) {
  .journey__spine { left: 50%; transform: translateX(-50%); }
  .journey__node { width: 50%; padding-left: 0; }
  .journey__node[data-side="right"] { margin-left: 50%; padding-left: 52px; }
  .journey__node[data-side="left"] { margin-right: 50%; padding-right: 52px; text-align: right; }
  .journey__node[data-side="right"]::before { left: -8px; }
  .journey__node[data-side="left"]::before { left: auto; right: -8px; }
  .journey__node[data-side="left"] .journey__points li { padding-left: 0; padding-right: 20px; }
  .journey__node[data-side="left"] .journey__points li::before { left: auto; right: 0; }
  .journey__toolkit { margin-left: 52px; }
}

@media (prefers-reduced-motion: reduce) {
  .journey__progress { transform: scaleY(1); }
}
```

- [ ] **Step 3: Add `initJourney()` for the scrubbed progress line**

In `assets/script.js`, immediately AFTER the `})();` that closes `initSocials`, insert:

```javascript
  /* ---------- JOURNEY — scroll-scrubbed progress line ---------- */
  (function initJourney() {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    const tl = document.getElementById("journey-timeline");
    const prog = document.getElementById("journey-progress");
    if (!tl || !prog) return;
    window.gsap.fromTo(
      prog,
      { scaleY: 0 },
      {
        scaleY: 1, ease: "none", transformOrigin: "top",
        scrollTrigger: { trigger: tl, start: "top 75%", end: "bottom 75%", scrub: true },
      },
    );
  })();
```

- [ ] **Step 4: Verify desktop (1440×900)**

Reload. Scroll to the bottom "The Journey" section (after Work of Fame, before footer).
Expected (PASS): centered vertical spine; milestones alternate left/right and fade up as they enter, their dots igniting lime; a lime progress line fills top→bottom as you scroll through; the Toolkit card's skill bars animate to their widths; education sits as the final node. No tabs anywhere.

- [ ] **Step 5: Verify mobile (390×844) + reduced-motion**

At 390×844: single-column timeline (spine on the left, all nodes to its right), bars stack to one/two columns, progress line still fills on scroll. PASS.
Reduced-motion on: progress line shown full, everything visible, no scrub. PASS.

- [ ] **Step 6: Verify original `#resume` tabs still work**

Scroll up to the original Journey (`#resume`) tabbed section: tabs still switch Experience/Skills/Education. PASS = no regression.

- [ ] **Step 7: Commit**

```bash
git add index.html assets/style.css assets/script.js
git commit -m "feat: add scrollytelling Journey timeline (progress line, milestones, toolkit, education)"
```

---

## Self-Review

**Spec coverage:**
- Part 1 Mobile Works choreography + flip → Task 1. ✓
- Part 2 Mobile Socials fanned deck → Task 2. ✓
- Part 3 New Work of Fame editorial index + live preview + filters + modal reuse → Tasks 3 & 4. ✓
- Part 4 New Journey scrollytelling timeline (no tabs, experience/skills/education) → Task 5. ✓
- Placement (archive after Socials; journey last in `<main>`) → Tasks 3 & 5 markup steps. ✓
- Originals untouched (`#work`, `#resume`) → verified in Tasks 4 & 5. ✓
- Reduced-motion fallbacks → verification steps in every task + CSS. ✓

**Adjustment vs. spec:** the spec's chip list named "Branding," but `portfolioData` contains no branding projects, so chips are derived from real data → `All · UI/UX · Web Dev · AI Builds`. Documented in Task 3 Step 4.

**Placeholder scan:** no TBD/TODO; all CSS/HTML/JS blocks are complete and ready to paste.

**Type/name consistency:** `openPortfolio` defined (Task 3 Step 3) and consumed (Task 4 Step 1); archive rows use `data-archive-id` (never `data-id`, so the generic modal handler does not double-bind); `#archive-list`, `#archive-preview-img/name/info`, `#journey-timeline`, `#journey-progress` ids match between markup and JS; reused `.reveal` and `.bar__fill` class names match the existing observers.
