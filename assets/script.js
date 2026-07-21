/* =========================================================
   Jonathan Bautista — Portfolio (redesign)
   Lenis smooth-scroll + GSAP parallax + UI logic
   All animation is progressive enhancement; the page is
   fully usable if the CDN libraries fail to load.
   ========================================================= */

(function () {
  "use strict";

  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  let _aboutP = 0; // 0→1 across the about section (olive → black, lines → white)
  // Logo-colour signals (read by updateLogoColor):
  let _heroP = 0; // 0→1 hero pin progress (panel shrink)
  let _worksFlipP = 0; // 0→1 across the works card flip (front→dark back face)

  /* ---------- Hero topographic contour field ----------
     A handful of slowly drifting Gaussian "energy" sources define a scalar
     field; each frame we trace iso-contours through it with marching squares
     and stroke them as faint lime lines. Because the field moves, the contours
     continuously grow, shrink, split and merge — like an animated topo map.
     Pauses when the hero scrolls out of view; static single frame for
     reduced-motion. No libraries. */
  function initContours() {
    const canvas = document.getElementById("hero-contours");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Line colour follows the background through three states:
    //   hero  — faint lime on dark olive            (aboutP 0, worksP 0)
    //   about — bright white on black               (aboutP 1, worksP 0)
    //   works — dark warm-olive on warm light        (aboutP 1, worksP 1)
    const LINE_DARK = [168, 214, 84, 0.14]; // lime
    const LINE_ABOUT = [31, 31, 31, 0.45]; // near-black — barely perceptible on black bg
    const LINE_LIGHT = [120, 122, 115, 0.38]; // warm olive
    const lerp = (a, b, t) => a + (b - a) * t;
    function getLineColor() {
      const ap = _aboutP;
      // hero → about (lime → dark gray)
      let r = lerp(LINE_DARK[0], LINE_ABOUT[0], ap);
      let g = lerp(LINE_DARK[1], LINE_ABOUT[1], ap);
      let b = lerp(LINE_DARK[2], LINE_ABOUT[2], ap);
      let a = lerp(LINE_DARK[3], LINE_ABOUT[3], ap);
      // sine arch keeps the lines readable through the mid-transition
      a += 0.22 * Math.sin(Math.PI * ap);
      return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`;
    }

    // Scroll-ramped distortion — the contour points wobble as the About section
    // takes over (peaks at aboutP=1).
    let _t = 0;
    const DIST_AMP = 24;
    function distM(px, py) {
      const d = _aboutP * DIST_AMP;
      if (d > 0.01)
        ctx.moveTo(
          px + d * Math.sin(py * 0.016 + _t * 1.6),
          py + d * Math.cos(px * 0.016 + _t * 1.3),
        );
      else ctx.moveTo(px, py);
    }
    function distL(px, py) {
      const d = _aboutP * DIST_AMP;
      if (d > 0.01)
        ctx.lineTo(
          px + d * Math.sin(py * 0.016 + _t * 1.6),
          py + d * Math.cos(px * 0.016 + _t * 1.3),
        );
      else ctx.lineTo(px, py);
    }
    const THRESHOLDS = [0.18, 0.34, 0.54, 0.78, 1.05, 1.4];
    const GRID = 38; // px spacing of the sampling grid (CSS px)

    // Drifting field sources, in normalised [0,1] space.
    const N = 6;
    const blobs = [];
    for (let i = 0; i < N; i++) {
      blobs.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() * 2 - 1) * 0.012,
        vy: (Math.random() * 2 - 1) * 0.012,
        sig: 0.13 + Math.random() * 0.12, // base spread
        amp: 0.75 + Math.random() * 0.6, // base strength
        ph: Math.random() * Math.PI * 2, // pulse phase
        pf: 0.15 + Math.random() * 0.35, // pulse frequency
      });
    }

    let W = 0,
      H = 0,
      cols = 0,
      rows = 0,
      sx = 0,
      sy = 0;
    let field = null;
    const dpr = 1; // faint decorative lines — full res isn't worth the fill cost

    // Pointer-reactive source — one extra Gaussian that eases toward the
    // cursor, so the topo lines swell and re-route around the mouse. Fine
    // pointers only; amp eases to 0 when the pointer leaves the window.
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amp: 0, tamp: 0 };
    if (
      !prefersReduced &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      window.addEventListener(
        "mousemove",
        (e) => {
          mouse.tx = e.clientX / Math.max(1, W);
          mouse.ty = e.clientY / Math.max(1, H);
          mouse.tamp = 1;
        },
        { passive: true },
      );
      document.documentElement.addEventListener("mouseleave", () => {
        mouse.tamp = 0;
      });
    }

    function resize() {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / GRID) + 1;
      rows = Math.ceil(H / GRID) + 1;
      sx = W / (cols - 1);
      sy = H / (rows - 1);
      field = new Float32Array(cols * rows);
    }

    function computeField(t) {
      // advance + bounce the sources, pulse their spread/strength
      for (let i = 0; i < N; i++) {
        const b = blobs[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
      }
      const mAmp = 1.15 * mouse.amp;
      const mInv = 1 / (2 * 0.09 * 0.09); // cursor source spread
      for (let r = 0; r < rows; r++) {
        const ny = (r * sy) / H;
        for (let c = 0; c < cols; c++) {
          const nx = (c * sx) / W;
          let v = 0;
          for (let i = 0; i < N; i++) {
            const b = blobs[i];
            const sig = b.sig * (1 + 0.45 * Math.sin(t * b.pf + b.ph));
            const amp = b.amp * (1 + 0.25 * Math.sin(t * b.pf * 0.7 + b.ph));
            const dx = nx - b.x,
              dy = ny - b.y;
            v += amp * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
          }
          if (mAmp > 0.01) {
            const mdx = nx - mouse.x,
              mdy = ny - mouse.y;
            v += mAmp * Math.exp(-(mdx * mdx + mdy * mdy) * mInv);
          }
          field[r * cols + c] = v;
        }
      }
    }

    // Allocation-free marching squares (no per-cell closures/arrays — that was
    // generating tens of thousands of throwaway objects per frame).
    function drawContours() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = getLineColor();
      for (let li = 0; li < THRESHOLDS.length; li++) {
        const thr = THRESHOLDS[li];
        ctx.beginPath();
        for (let r = 0; r < rows - 1; r++) {
          const y = r * sy;
          const off = r * cols;
          for (let c = 0; c < cols - 1; c++) {
            const tl = field[off + c];
            const tr = field[off + c + 1];
            const br = field[off + cols + c + 1];
            const bl = field[off + cols + c];
            let id = 0;
            if (tl > thr) id |= 8;
            if (tr > thr) id |= 4;
            if (br > thr) id |= 2;
            if (bl > thr) id |= 1;
            if (id === 0 || id === 15) continue;
            const x = c * sx;
            // edge crossings (only computed for the edges a case needs)
            let ax, ay, bx, by;
            switch (id) {
              case 1:
              case 14: // left → bottom
                ax = x;
                ay = y + (sy * (thr - tl)) / (bl - tl);
                bx = x + (sx * (thr - bl)) / (br - bl);
                by = y + sy;
                break;
              case 2:
              case 13: // bottom → right
                ax = x + (sx * (thr - bl)) / (br - bl);
                ay = y + sy;
                bx = x + sx;
                by = y + (sy * (thr - tr)) / (br - tr);
                break;
              case 3:
              case 12: // left → right
                ax = x;
                ay = y + (sy * (thr - tl)) / (bl - tl);
                bx = x + sx;
                by = y + (sy * (thr - tr)) / (br - tr);
                break;
              case 4:
              case 11: // top → right
                ax = x + (sx * (thr - tl)) / (tr - tl);
                ay = y;
                bx = x + sx;
                by = y + (sy * (thr - tr)) / (br - tr);
                break;
              case 6:
              case 9: // top → bottom
                ax = x + (sx * (thr - tl)) / (tr - tl);
                ay = y;
                bx = x + (sx * (thr - bl)) / (br - bl);
                by = y + sy;
                break;
              case 7:
              case 8: // top → left
                ax = x + (sx * (thr - tl)) / (tr - tl);
                ay = y;
                bx = x;
                by = y + (sy * (thr - tl)) / (bl - tl);
                break;
              case 5: {
                // saddle: top-left + bottom-right
                const ry = y + (sy * (thr - tr)) / (br - tr);
                distM(x + (sx * (thr - tl)) / (tr - tl), y);
                distL(x, y + (sy * (thr - tl)) / (bl - tl));
                distM(x + (sx * (thr - bl)) / (br - bl), y + sy);
                distL(x + sx, ry);
                continue;
              }
              case 10: {
                // saddle: top-right + bottom-left
                const ry = y + (sy * (thr - tr)) / (br - tr);
                distM(x + (sx * (thr - tl)) / (tr - tl), y);
                distL(x + sx, ry);
                distM(x + (sx * (thr - bl)) / (br - bl), y + sy);
                distL(x, y + (sy * (thr - tl)) / (bl - tl));
                continue;
              }
              default:
                continue;
            }
            distM(ax, ay);
            distL(bx, by);
          }
        }
        ctx.stroke();
      }
    }

    let rafId = null,
      running = false,
      last = 0;
    const FRAME_MS = 1000 / 30; // 30fps is plenty for slow-drifting contours
    function frame(now) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (now - last < FRAME_MS) return;
      last = now;
      _t = now * 0.001;
      // ease the cursor source toward the pointer / its resting amplitude
      mouse.x += (mouse.tx - mouse.x) * 0.14;
      mouse.y += (mouse.ty - mouse.y) * 0.14;
      mouse.amp += (mouse.tamp - mouse.amp) * 0.07;
      computeField(_t);
      drawContours();
    }
    function start() {
      if (running || prefersReduced) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    resize();
    window.addEventListener("resize", () => {
      resize();
      if (prefersReduced || !running) {
        computeField(0);
        drawContours();
      }
    });

    if (prefersReduced) {
      computeField(0);
      drawContours();
      return;
    }

    // Animate while the hero OR the works section is on screen (works shares
    // the same fixed canvas background and needs it live during Phase 2).
    const hero = document.querySelector(".hero");
    const aboutEl = document.querySelector(".stage-about");
    const worksEl = document.querySelector(".works");
    if ("IntersectionObserver" in window) {
      const visible = new Set();
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) =>
            e.isIntersecting ? visible.add(e.target) : visible.delete(e.target),
          );
          visible.size > 0 ? start() : stop();
        },
        { threshold: 0 },
      );
      [hero, aboutEl, worksEl].filter(Boolean).forEach((el) => io.observe(el));
    } else {
      start();
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });
  }
  initContours();

  /* ---------- Hero intro trigger ---------- */
  window.addEventListener("load", () => {
    requestAnimationFrame(() =>
      document.documentElement.classList.add("loaded"),
    );
  });

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis === "function" && !prefersReduced) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    // If GSAP is present we sync via its ticker (smoother); otherwise rAF.
    if (window.gsap && window.gsap.ticker) {
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", ({ scroll }) => {
        if (window.ScrollTrigger) window.ScrollTrigger.update();
        updateLogoSize(scroll);
      });
    } else {
      requestAnimationFrame(raf);
    }
  }

  /* ---------- Intro splash (cold-load cover) ----------
     A full-screen lime panel sits over the page until the hero video can
     paint its first frame (or a failsafe fires), then slides up to reveal
     the site — mirroring the landonorris.com cold-load behaviour. The inline
     <head> script already locked scroll and armed a 7s failsafe; here we
     reveal as soon as content is genuinely ready and tidy up the DOM. */
  (function initSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;
    const html = document.documentElement;
    const MIN_VISIBLE = prefersReduced ? 300 : 2000; // ensure the loop is seen
    const FAILSAFE = 7000;
    const startedAt = performance.now();
    let revealed = false;
    let readyArmed = false;
    let morphTween = null;

    if (lenis) lenis.stop();
    startMorph();

    function reveal() {
      if (revealed) return;
      revealed = true;
      // Freeze the morph at its current shape while the panel slides away.
      if (morphTween && typeof morphTween.pause === "function")
        morphTween.pause();
      html.classList.add("splash-done"); // triggers the CSS exit transition

      let cleaned = false;
      function cleanup() {
        if (cleaned) return;
        cleaned = true;
        if (morphTween) morphTween.kill();
        splash.removeEventListener("transitionend", onEnd);
        if (splash.parentNode) splash.parentNode.removeChild(splash);
        html.classList.remove("splash-on");
        if (lenis) lenis.start();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        document.dispatchEvent(new CustomEvent("hero:intro"));
      }
      function onEnd(e) {
        if (e.target === splash) cleanup();
      }
      splash.addEventListener("transitionend", onEnd);
      // Belt-and-braces in case transitionend never fires.
      setTimeout(cleanup, 1300);
    }

    function armReady() {
      if (readyArmed) return;
      readyArmed = true;
      const wait = Math.max(0, MIN_VISIBLE - (performance.now() - startedAt));
      setTimeout(reveal, wait);
    }

    const video = document.querySelector(".hero__video");
    if (video && !prefersReduced) {
      if (video.readyState >= 3) {
        armReady(); // HAVE_FUTURE_DATA — first frame is paintable
      } else {
        video.addEventListener("canplay", armReady, { once: true });
        video.addEventListener("loadeddata", armReady, { once: true });
        video.addEventListener(
          "error",
          () => {
            // Video failed to load — don't wait on it; fall back to page load.
            if (document.readyState === "complete") armReady();
            else window.addEventListener("load", armReady, { once: true });
          },
          { once: true },
        );
      }
    } else if (document.readyState === "complete") {
      armReady();
    } else {
      window.addEventListener("load", armReady, { once: true });
    }

    // Hard failsafe: the splash can never trap the page.
    setTimeout(reveal, FAILSAFE);

    /* Liquid-morph the UI/UX wordmark into </> and back, on a loop, by
       interpolating the SVG path data with flubber. Mapping tells a story:
         U·X (left glyphs)  →  <
         /   (centre slash) →  /   (it just slides into place)
         U·I (right glyphs) →  >
       If flubber or motion is unavailable the static UI/UX wordmark in the
       markup simply stays put. */
    function startMorph() {
      if (prefersReduced || !window.flubber) return;
      const L = document.getElementById("splashPathL");
      const M = document.getElementById("splashPathM");
      const R = document.getElementById("splashPathR");
      if (!L || !M || !R) return;

      // Source outlines — the individual UI/UX glyphs (left U, X, /, right U, I).
      const U_LEFT =
        "M58.6475 23.2554C65.0687 23.7139 66.993 27.4454 66.9742 33.3339C67.0157 47.3849 66.8147 61.4971 66.9577 75.5436C67.0752 87.1074 66.266 95.9651 57.6575 104.683C51.6997 110.77 43.5532 114.22 35.0352 114.262C24.7735 114.33 17.087 112.172 9.54647 104.9C-1.11728 94.6151 0.190975 82.8806 0.193475 69.3769L0.208222 48.0481C0.179972 42.1839 -0.836775 31.8764 1.89398 26.5479C2.55548 25.2574 5.35022 23.8779 6.79847 23.7411C18.102 22.6744 16.2405 34.3926 16.228 41.7889L16.1877 69.9591C16.1782 79.2404 14.4752 89.8424 23.5267 95.6339C32.221 101.197 46.6125 97.9614 50.0297 87.5201C51.3742 83.4121 50.992 76.4249 50.9937 71.9216L50.9852 44.2339C50.9807 39.7449 50.773 35.1071 51.0697 30.6496C51.3812 25.9696 54.3835 23.8679 58.6475 23.2554Z";
      const X =
        "M83.0814 23.5249C85.1991 23.3394 87.2141 23.4307 89.0651 24.6024C92.1896 26.5807 104.023 45.3684 106.832 49.5397C107.864 51.0727 109.48 54.2174 111.053 55.1264C112.082 55.7204 113.496 52.8522 114.025 52.0987C117.999 46.4414 122.134 40.8847 126.195 35.2894C128.649 31.9094 131.144 27.6432 134.228 24.8472C134.953 24.1899 135.879 23.8119 136.82 23.5827C139.124 23.0209 141.612 23.3589 143.599 24.6849C145.379 25.8732 146.575 27.7574 146.893 29.8739C147.097 31.1754 146.91 33.4419 146.258 34.5469C143.935 38.4892 140.723 42.6059 138.017 46.3329L120.79 70.0662C122.056 72.2349 124.599 75.7359 126.062 77.8934L136.955 93.9192C138.453 96.1247 141.692 100.649 142.673 102.834C143.19 103.979 143.42 105.232 143.343 106.486C143.17 109.231 141.838 110.898 139.893 112.596C131.459 117.887 127.205 107.991 123.281 102.422C119.021 96.3769 115.107 89.9677 110.742 83.9972C106.225 90.1202 101.751 96.2747 97.3204 102.46C95.5334 104.931 91.9344 110.205 89.9184 112.083C88.9326 113.019 87.7094 113.668 86.3814 113.958C82.1284 114.93 77.7209 111.987 76.9496 107.597C76.0966 103.294 79.6226 99.5889 81.9911 96.2322C88.2501 87.3617 95.0324 78.6847 101.186 69.7364C97.9549 65.0064 78.0809 36.6434 77.3046 33.8532C76.6969 31.6694 76.8826 29.3142 77.9931 27.3224C79.1444 25.2572 80.8834 24.1967 83.0814 23.5249Z";
      const SLASH =
        "M213.049 0.000400243C216.999 -0.0310998 220.474 1.7959 221.542 5.7799C222.607 9.7464 219.664 14.3257 217.984 17.8412L211.539 31.3182L190.834 74.6791L171.542 115.076L165.802 127.178C163.167 132.733 162.324 137.113 155.789 138.618C152.049 138.768 147.686 135.643 147.385 131.923C147.023 127.455 151.059 120.802 152.972 116.835L161.049 99.9282L188.359 42.7261L200.914 16.3799C202.379 13.3022 203.822 10.1907 205.334 7.13691C207.377 3.00466 208.162 0.8174 213.049 0.000400243Z";
      const U_RIGHT =
        "M288.96 23.2559C295.05 23.6151 297.38 26.9171 297.417 32.7581L297.397 63.7989C297.41 70.7184 297.925 83.9939 296.377 90.1851C294.955 95.6899 292.087 100.714 288.07 104.736C282.055 110.88 273.805 114.316 265.207 114.256C254.997 114.264 247.457 112.067 239.985 104.863C229.317 94.5759 230.64 82.2341 230.645 68.7436L230.662 48.2981C230.68 41.4434 228.217 25.5954 236.752 23.7704C239.002 23.2766 241.357 23.7391 243.255 25.0474C244.542 25.9526 245.897 27.4334 246.225 28.9846C247.02 32.7576 246.73 37.8371 246.725 41.7449L246.695 69.6664C246.692 73.5656 246.465 81.3941 247.025 84.8926C247.685 89.0364 249.975 92.7436 253.385 95.1896C262.012 101.405 277.2 98.1671 280.55 87.4546C281.82 83.3981 281.45 76.6709 281.45 72.3101L281.442 44.1006C281.44 40.5369 281.412 36.9711 281.4 33.4081C281.392 30.8206 281.52 28.4234 283.147 26.2689C284.765 24.1261 286.472 23.6861 288.96 23.2559Z";
      const I =
        "M319.817 23.2607C329.939 24.0567 328.142 33.3695 328.144 40.8777L328.152 61.9305L328.149 89.96C328.147 95.0117 328.177 100.041 328.062 105.092C327.944 110.328 325.939 113.084 320.659 114.186C317.234 113.997 313.012 112.302 312.459 108.417C311.904 104.508 312.109 100.09 312.114 96.1172L312.112 76.8457L312.104 47.3078C312.104 42.0888 312.037 36.881 312.204 31.6642C312.374 26.3777 314.599 24.003 319.817 23.2607Z";

      // Targets — slim chevrons + slash that spell </> in the same 329×139
      // box. They're intentionally thin; the rounded stroke grown below gives
      // them their weight and soft, non-pointy corners.
      const LT = "M114 30L40 69.5L114 109L114 99L56 69.5L114 40Z";
      const SLASH2 = "M155 109L184 31L174 31L145 109Z";
      const GT = "M215 30L289 69.5L215 109L215 99L273 69.5L215 40Z";

      const opt = { maxSegmentLength: 4 };
      let iL, iM, iR;
      try {
        iL = window.flubber.combine(
          [U_LEFT, X],
          LT,
          Object.assign({ single: true }, opt),
        );
        iM = window.flubber.interpolate(SLASH, SLASH2, opt);
        iR = window.flubber.combine(
          [U_RIGHT, I],
          GT,
          Object.assign({ single: true }, opt),
        );
      } catch (e) {
        return; // morph unavailable — keep the static wordmark
      }

      const MAX_STROKE = 15; // grows the rounded outline as UI/UX → </>
      const state = { v: 0 };
      function apply() {
        const sw = state.v * MAX_STROKE + "px";
        L.setAttribute("d", iL(state.v));
        M.setAttribute("d", iM(state.v));
        R.setAttribute("d", iR(state.v));
        L.style.strokeWidth = M.style.strokeWidth = R.style.strokeWidth = sw;
      }
      apply();

      if (window.gsap) {
        morphTween = window.gsap.to(state, {
          v: 1,
          duration: 0.85,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
          repeatDelay: 0.75,
          delay: 0.55, // let UI/UX read first
          onUpdate: apply,
        });
      } else {
        // requestAnimationFrame ping-pong fallback (no GSAP).
        const FWD = 850,
          HOLD = 750,
          DELAY = 550;
        const cycle = FWD * 2 + HOLD * 2;
        const t0 = performance.now() + DELAY;
        const ease = (t) =>
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        let raf = 0;
        function loop(now) {
          let p = (((now - t0) % cycle) + cycle) % cycle;
          let v;
          if (p < FWD) v = p / FWD;
          else if (p < FWD + HOLD) v = 1;
          else if (p < FWD * 2 + HOLD) v = 1 - (p - FWD - HOLD) / FWD;
          else v = 0;
          state.v = ease(v);
          apply();
          raf = requestAnimationFrame(loop);
        }
        raf = requestAnimationFrame(loop);
        morphTween = { kill: () => cancelAnimationFrame(raf) };
      }
    }
  })();

  /* ---------- Anchor links via Lenis ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -70 });
      else target.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Nav: logo-only with background-aware colour ----------
     The logo is a CSS-masked glyph whose `background-color` is its fill, so
     adapting it to the background is just a matter of writing that colour.
     Rule (concept "dark bg → light logo"):
       • dark background   → WHITE
       • light background  → BLACK
       • olive background  → #e7fcb0 (the one exception)
     The hero (off-panel), about and works sections share ONE fixed canvas
     whose colour is driven olive → black by _aboutP. The logo also tracks
     the works card flip. HOF and Socials are white (black logo); everything else is dark. */
  const nav = document.getElementById("nav");
  const progressBar = document.querySelector(".scroll-progress span");
  const navLogo = nav ? nav.querySelector(".nav__logo") : null;
  const sectHero = document.querySelector(".hero");
  const sectAbout = document.querySelector(".stage-about");
  const sectHof = document.querySelector(".hof");
  const sectResume = document.querySelector(".resume");
  const sectSocials = document.querySelector(".socials");

  const LOGO_WHITE = [255, 255, 255];
  const LOGO_BLACK = [0, 0, 0];
  const LOGO_OLIVE = [231, 252, 176]; // #e7fcb0
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp3 = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];

  // Logo colour over the shared fixed canvas: olive →(_aboutP)→ white.
  function canvasLogoColor() {
    return lerp3(LOGO_OLIVE, LOGO_WHITE, clamp01(_aboutP));
  }

  // Fraction of the logo still covered by the shrinking (dark) hero video panel
  // — 1 = fully over the panel, 0 = fully clear of it (over the olive canvas).
  function heroPanelCoverage(rect) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const finalS = Math.min(1, Math.min(943 / vw, 608 / vh)); // matches GSAP scale target
    const curS = 1 - clamp01(_heroP) * (1 - finalS);
    const panelLeft = (vw * (1 - curS)) / 2; // panel occupies [panelLeft … vw-panelLeft]
    return clamp01((rect.right - panelLeft) / (rect.width || 1));
  }

  function updateLogoColor() {
    if (!navLogo || !nav) return;
    const r = nav.getBoundingClientRect();
    const y = r.top + r.height / 2; // vertical line the logo sits on
    const within = (el) => {
      if (!el) return false;
      const b = el.getBoundingClientRect();
      return b.top <= y && b.bottom > y;
    };
    // True when any part of el is on screen AND its bottom is still below the nav.
    // Unlike within(), doesn't require el.top <= y — handles pinned elements that
    // start below the nav but have a white page bg extending to the top.
    const onScreen = (el) => {
      if (!el) return false;
      const b = el.getBoundingClientRect();
      return b.bottom > y && b.top < window.innerHeight;
    };

    let rgb;
    if (within(sectAbout)) {
      const backFace = sectAbout.querySelector(".about__face--back");
      if (window.innerWidth <= 880 && backFace && within(backFace)) {
        // Mobile: the white "Some of My Work" cover sits statically in flow —
        // black logo keeps it legible (the flip's _worksFlipP never runs here).
        rgb = LOGO_BLACK;
      } else {
        // During back-face expansion (0.5→1) the white "Some of My Work" cover
        // is revealed — lerp logo from white to black so it stays legible.
        if (_worksFlipP > 0.5) {
          const t = (_worksFlipP - 0.5) * 2; // 0→1 during back face expansion
          rgb = lerp3(LOGO_WHITE, LOGO_BLACK, t);
        } else {
          rgb = canvasLogoColor();
        }
      }
    } else if (onScreen(sectHof) && !within(sectResume)) {
      // HOF is on screen and the journey section hasn't slid over the nav yet —
      // white bg (including the gap above the pinned grid) so logo must be black.
      rgb = LOGO_BLACK;
    } else if (within(sectHero)) {
      // Blend between the dark panel (white logo) and the olive canvas as the
      // panel edge sweeps across the logo.
      rgb = lerp3(canvasLogoColor(), LOGO_WHITE, heroPanelCoverage(r));
    } else if (within(sectSocials)) {
      // Socials has a white background — logo must be black for contrast.
      rgb = LOGO_BLACK;
    } else {
      // Hall of Fame, Journey, Footer — dark page background.
      rgb = LOGO_WHITE;
    }
    navLogo.style.backgroundColor =
      "rgb(" + (rgb[0] | 0) + "," + (rgb[1] | 0) + "," + (rgb[2] | 0) + ")";
  }

  function updateLogoSize(y) {
    if (!navLogo) return;
    const t = Math.min(1, Math.max(0, y / 120));
    const isMobile = window.innerWidth <= 768;
    const startW = isMobile ? 165 : 245;
    const startH = isMobile ? 53 : 78;
    const shrinkW = isMobile ? 55 : 85;
    const shrinkH = isMobile ? 17 : 27;
    navLogo.style.width = startW - shrinkW * t + "px";
    navLogo.style.height = startH - shrinkH * t + "px";
  }

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (progressBar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    if (!lenis) updateLogoSize(y);
    // Mobile: the hero shows a large centered wordmark instead of the top-left
    // nav logo. Hide the nav logo while the hero fills the screen, reveal it
    // once the user scrolls down past it (CSS handles the fade).
    if (nav && window.innerWidth <= 880) {
      nav.classList.toggle("nav--hero", y < window.innerHeight * 0.6);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Skill bars fill (defined early so reveal IO can call it) ---------- */
  function fillBar(bar) {
    bar.style.transform = `scaleX(${(bar.getAttribute("data-width") || 0) / 100})`;
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            // Fill any bars inside this element so they animate as it fades in
            entry.target.querySelectorAll(".bar__fill").forEach(fillBar);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ---------- Animated stat counters ---------- */
  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const dur = 1500;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll(".stat__num").forEach((el) => {
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              animateCount(el);
              obs.unobserve(el);
            }
          });
        },
        { threshold: 0.6 },
      );
      io.observe(el);
    } else {
      el.textContent = el.getAttribute("data-count");
    }
  });

  /* ---------- Skill bars fill (IO as secondary trigger for bars outside .reveal) ---------- */
  const bars = document.querySelectorAll(".bar__fill");
  if ("IntersectionObserver" in window) {
    const barIo = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fillBar(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0 },
    );
    bars.forEach((b) => barIo.observe(b));
  } else {
    bars.forEach(fillBar);
  }

  /* ---------- Hero signature: measure + draw helpers ----------
     Shared by the desktop scroll-scrub timeline and the mobile on-load
     entrance below. A single hand-drawn stroke path writes itself on via
     stroke-dashoffset; the drawSig/measureSig logic is generic over any
     list of `.hero__sig-mp` paths, so one path just works. */
  const heroSection = document.querySelector(".hero");
  const heroPanel = document.getElementById("hero-panel");
  const heroIsMobile = window.innerWidth <= 880;

  const sigSvg = document.getElementById("hero-sig-svg");
  const sigPen = document.getElementById("hero-sig-pen");
  const SIG_VB_X = 0,
    SIG_VB_Y = 0,
    SIG_VB_W = 2968; // matches viewBox
  const sigStrokes = Array.prototype.slice.call(
    document.querySelectorAll("#hero-sig-svg .hero__sig-mp"),
  );
  let sigLens = [],
    sigTotal = 0;

  function measureSig() {
    sigLens = sigStrokes.map((p) => p.getTotalLength());
    sigTotal = sigLens.reduce((a, b) => a + b, 0);
    sigStrokes.forEach((p, i) => {
      const L = sigLens[i];
      // dash = stroke length, gap = oversized so NO wrapped dash (and its
      // round cap) can poke back into view at the hidden offset.
      p.style.strokeDasharray = L + " " + (L * 2 + 20);
      p.style.strokeDashoffset = L; // fully hidden until written
    });
  }
  function drawSig(prog) {
    const p = Math.max(0, Math.min(1, prog));
    const target = p * sigTotal; // total ink length to reveal so far
    let cum = 0,
      penIdx = -1,
      penLocal = 0;
    for (let i = 0; i < sigStrokes.length; i++) {
      const len = sigLens[i];
      const drawn = Math.max(0, Math.min(len, target - cum));
      sigStrokes[i].style.strokeDashoffset = String(len - drawn);
      if (drawn > 0) {
        penIdx = i;
        penLocal = drawn;
      } // last stroke with ink = the frontier
      cum += len;
    }
    if (
      sigPen &&
      penIdx >= 0 &&
      p > 0.002 &&
      p < 0.998 &&
      window.innerWidth > 880
    ) {
      try {
        const pt = sigStrokes[penIdx].getPointAtLength(
          Math.min(penLocal, sigLens[penIdx]),
        );
        const scale = sigSvg.clientWidth / SIG_VB_W;
        sigPen.style.transform = `translate(${(pt.x - SIG_VB_X) * scale}px, ${(pt.y - SIG_VB_Y) * scale}px)`;
        sigPen.style.opacity = "1";
      } catch (e) {}
    } else if (sigPen) {
      sigPen.style.opacity = "0";
    }
  }
  if (sigStrokes.length && !prefersReduced) {
    measureSig();
    drawSig(0);
    window.addEventListener("resize", () => {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

  /* ---------- Desktop hero: GSAP scroll-pin timeline ----------
     Panel shrinks to a small centered box + signature draws, both scrubbed
     to scroll. Mobile never runs this — see the on-load intro below. */
  if (
    window.gsap &&
    window.ScrollTrigger &&
    !prefersReduced &&
    !heroIsMobile &&
    heroSection &&
    heroPanel
  ) {
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: heroSection,
        start: "top top",
        end: () => `+=65%`,
        scrub: 1.1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          _heroP = self.progress;
          updateLogoColor();
        },
        onRefresh: (self) => {
          _heroP = self ? self.progress : 0;
          updateLogoColor();
        },
      },
    });

    // Panel scales to exactly 943×608px regardless of viewport size.
    tl.to(
      heroPanel,
      {
        scaleX: () =>
          Math.min(
            1,
            Math.min(943 / window.innerWidth, 608 / window.innerHeight),
          ),
        scaleY: () =>
          Math.min(
            1,
            Math.min(943 / window.innerWidth, 608 / window.innerHeight),
          ),
        borderRadius: 64,
        ease: "none",
        duration: 1,
        force3D: true,
      },
      0,
    );

    // The centered signature writes itself off the same scrubbed timeline, so
    // it stays in lockstep with the shrink and un-writes when scrolling up.
    if (sigStrokes.length) {
      const sigState = { p: 0 };
      tl.to(
        sigState,
        {
          p: 1,
          ease: "none",
          duration: 1,
          onUpdate: () => {
            const y = window.scrollY || document.documentElement.scrollTop;
            drawSig(y < 3 ? 0 : sigState.p);
          },
        },
        0,
      );

      // After signature completes, hold the pin for an extra scroll beat
      // before the hero unpins and the next section scrolls in.
      tl.to({}, { duration: 0.15 });

      // Instantly snap sig to hidden the moment native scroll hits zero —
      // bypasses GSAP scrub lag and Lenis lerp settle time.
      window.addEventListener(
        "scroll",
        function () {
          if ((window.scrollY || document.documentElement.scrollTop) === 0)
            drawSig(0);
        },
        { passive: true },
      );
    }
  }

  /* ---------- Mobile hero: no scroll animation ----------
     The video panel and marquee are static (CSS handles the layout). The
     JONATHAN BAUTISTA wordmark slides in first, then — once its transition
     ends — the signature draws itself in beneath it. Fires exactly once, right
     as the intro splash disappears (see initSplash's cleanup(), which
     dispatches "hero:intro"). The top-left nav logo stays hidden while the
     hero fills the screen (see onScroll's nav--hero toggle) and fades in once
     the user scrolls past it. */
  if (heroIsMobile && !prefersReduced) {
    const heroName = document.getElementById("hero-name");
    document.addEventListener(
      "hero:intro",
      function () {
        if (heroName) heroName.classList.add("is-in");
        if (sigStrokes.length) {
          setTimeout(() => {
            sigStrokes.forEach((p) => {
              p.style.strokeDashoffset = "0";
            });
          }, 700); // starts once the wordmark's 0.7s transition has finished
        }
      },
      { once: true },
    );
  }

  /* ---------- ABOUT — columns slide in, then section pins and flips to HOF cover ----------
     Phase 1 (scroll): olive→black canvas transition + columns slide in from edges.
     Phase 2 (pinned): card flips right-to-left, revealing the Work Hall of Fame cover. */
  (function initStageAbout() {
    if (!window.gsap || !window.ScrollTrigger) return;
    const gsap = window.gsap;
    const section = document.querySelector(".stage-about");
    if (!section) return;
    const left = section.querySelector(".stage-about__col--left");
    const right = section.querySelector(".stage-about__col--right");
    const blackLayer = document.getElementById("hero-black-layer");
    const flipper = document.getElementById("about-flip");

    // Phase 1a — background canvas olive→black. Always runs so the mood change
    // happens on every device, even without motion/animation.
    gsap
      .timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top top",
          scrub: true,
          onUpdate(self) {
            _aboutP = self.progress;
            updateLogoColor();
          },
          onLeaveBack() {
            _aboutP = 0;
            updateLogoColor();
          },
        },
      })
      .fromTo(blackLayer, { opacity: 0 }, { opacity: 1, ease: "none" }, 0);

    // Phase 1b — column slide-in (desktop + motion-OK only).
    if (!prefersReduced && window.innerWidth >= 880 && left && right) {
      const colTrigger = {
        trigger: section,
        start: "top 64%",
        end: "top 18%",
        scrub: true,
      };
      gsap.fromTo(
        left,
        { xPercent: -118, opacity: 0 },
        {
          xPercent: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: colTrigger,
        },
      );
      gsap.fromTo(
        right,
        { xPercent: 118, opacity: 0 },
        {
          xPercent: 0,
          opacity: 1,
          ease: "power2.out",
          scrollTrigger: colTrigger,
        },
      );
    }

    // Phase 2 — pin the section once it fills the viewport, then flip the card.
    // Uses a two-phase scaleX approach: front collapses to zero (first half),
    // back expands from zero (second half). Content is always readable.
    // DESKTOP ONLY (>880px): on phones the front-face content is taller than the
    // viewport, so pinning + flipping would (a) collapse the text before it can
    // be read and (b) inject ~1.4× viewport of pin-spacer that buries the work
    // grid. Mobile gets the scroll-stack transition in the else-if branch below.
    if (!prefersReduced && flipper && window.innerWidth > 880) {
      const front = flipper.querySelector(".about__face--front");
      const back = flipper.querySelector(".about__face--back");
      const FLIP_PX = Math.round(window.innerHeight * 1.4);

      // Spacer goes white ONLY once the flip reveals the white "Some of My Work"
      // cover (back face starts expanding at the midpoint), and reverts when you
      // scroll back up to the dark About face. Toggling a class on THIS section's
      // spacer keeps the white scoped to Work — the hero spacer stays untouched —
      // and shows up as a real rule in devtools (.pin-spacer.is-work-white).
      const FLIP_WHITE_AT = 0.5; // back face begins to show at the flip midpoint
      const setSpacerWhite = (on) => {
        const spacer = section.closest(".pin-spacer");
        if (spacer) spacer.classList.toggle("is-work-white", on);
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          pin: true,
          pinSpacing: true,
          start: "top top",
          end: `+=${FLIP_PX}`,
          scrub: 1,
          onRefresh: (self) => setSpacerWhite(self.progress >= FLIP_WHITE_AT),
          onUpdate(self) {
            _worksFlipP = Math.min(1, Math.max(0, self.progress));
            setSpacerWhite(self.progress >= FLIP_WHITE_AT);
            updateLogoColor();
          },
          onLeaveBack() {
            _worksFlipP = 0;
            setSpacerWhite(false);
            updateLogoColor();
          },
        },
      });

      if (front) {
        tl.fromTo(
          front,
          { scaleX: 1 },
          { scaleX: 0, ease: "power1.in", duration: 0.5 },
          0,
        );
      }
      if (back) {
        tl.fromTo(
          back,
          { scaleX: 0 },
          { scaleX: 1, ease: "power1.out", duration: 0.5 },
          0.5,
        );
      }
    } else if (!prefersReduced && flipper && window.innerWidth <= 880) {
      // Mobile: reuse the site's scroll-stack transition (the same effect used
      // for Work → Journey → Socials). Freeze the about copy once its bottom
      // reaches the viewport bottom — so it has been fully read — then let the
      // white "Some of My Work" cover scroll up and over it. pinSpacing:false
      // adds no scroll distance, so the work grid stays close. The cover paints
      // above the pinned copy via its higher z-index (set in the mobile CSS).
      const front = flipper.querySelector(".about__face--front");
      const back = flipper.querySelector(".about__face--back");
      if (front && back) {
        window.ScrollTrigger.create({
          trigger: front,
          start: "bottom bottom",
          endTrigger: back,
          end: "bottom bottom",
          pin: true,
          pinSpacing: false,
          invalidateOnRefresh: true,
        });
      }
    }
  })();

  /* ---------- SOCIALS — stacked deck fans out on scroll ---------- */
  (function initSocials() {
    const stage = document.getElementById("socials-stage");
    const deck = document.getElementById("socials-deck");
    if (!stage || !deck) return;

    const cards = Array.from(deck.querySelectorAll(".social-card"));
    if (!cards.length) return;

    // Tap / click focus — the cards no longer navigate anywhere, so a tap just
    // toggles `.is-active`, which the CSS renders with the same colour + glow +
    // lift the desktop pointer gets on hover. Tapping another card moves the
    // spotlight; tapping the active card (or anywhere off the deck) clears it.
    cards.forEach((card) => {
      card.addEventListener("click", (e) => {
        e.stopPropagation();
        const wasActive = card.classList.contains("is-active");
        cards.forEach((c) => c.classList.remove("is-active"));
        if (!wasActive) card.classList.add("is-active");
      });
    });
    document.addEventListener("click", () => {
      cards.forEach((c) => c.classList.remove("is-active"));
    });

    const mid = (cards.length - 1) / 2; // 3 for 7 cards

    // Final fan geometry for one card, derived from the live card width so it
    // scales with the viewport. ax = distance from centre (0,1,2,3…).
    const geom = (i) => {
      const cw = cards[Math.round(mid)].offsetWidth || 200;
      const o = i - mid;
      const ax = Math.abs(o);
      // Tighter spread + flatter arc on phones so the fan fits a narrow portrait
      // viewport; desktop keeps the wider, more dramatic splay.
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

    // Centre card always on top; neighbours recede symmetrically.
    // Expose each card's fan scale so the CSS hover can grow every card to the
    // same true 1.18×, regardless of how small it sits in the fan (1/scale).
    cards.forEach((card, i) => {
      const g = geom(i); // scale here doesn't depend on card width
      card.style.zIndex = String(100 - Math.abs(i - mid));
      card.style.setProperty("--inv-scale", (1 / g.scale).toFixed(4));
    });

    // Phone / tablet: present the SAME fan (no pin). It fans out from a stack
    // once when the deck scrolls into view; static under reduced-motion / no GSAP.
    if (window.innerWidth < 1024) {
      const g2 = window.gsap;
      const applyFan = (animate) => {
        cards.forEach((card, i) => {
          const g = geom(i);
          if (animate && g2) {
            g2.to(card, {
              x: g.x,
              y: g.y,
              rotation: g.rot,
              scale: g.scale,
              duration: 0.7,
              ease: "power3.out",
              delay: Math.abs(i - mid) * 0.06,
            });
          } else {
            card.style.transform = `translate(${g.x}px, ${g.y}px) rotate(${g.rot}deg) scale(${g.scale})`;
          }
        });
      };
      if (prefersReduced || !g2) {
        applyFan(false);
        return;
      }
      g2.set(cards, { x: 0, y: 0, rotation: 0, scale: 1 });
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (!e.isIntersecting) return;
              applyFan(true);
              io.disconnect();
            });
          },
          { threshold: 0.35 },
        );
        io.observe(deck);
      } else {
        applyFan(true);
      }
      return;
    }

    const gsap = window.gsap;
    if (!gsap) return;

    // Reduced motion: skip the scroll choreography, just present the fan.
    if (prefersReduced || !window.ScrollTrigger) {
      cards.forEach((card, i) => {
        const g = geom(i);
        gsap.set(card, { x: g.x, y: g.y, rotation: g.rot, scale: g.scale });
      });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        pin: true,
        pinSpacing: true,
        start: "top top",
        end: "+=120%",
        scrub: 1,
        invalidateOnRefresh: true, // recompute geometry on resize
      },
    });

    cards.forEach((card, i) => {
      tl.fromTo(
        card,
        { x: 0, y: 0, rotation: 0, scale: 1, immediateRender: false },
        {
          x: () => geom(i).x,
          y: () => geom(i).y,
          rotation: () => geom(i).rot,
          scale: () => geom(i).scale,
          ease: "power3.out",
          duration: 1,
        },
        0,
      );
    });
  })();

  /* ---------- JOURNEY — scroll-scrubbed progress line + node lighting ---------- */
  (function initJourney() {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    const tl = document.getElementById("journey-timeline");
    const prog = document.getElementById("journey-progress");
    if (!tl || !prog) return;

    const nodes = Array.from(tl.querySelectorAll(".journey__node"));

    // Fractional position (0–1) of each node's circle within the timeline.
    // The ::before pseudo-element sits at top:5px within the node.
    let thresholds = [];
    function computeThresholds() {
      const h = tl.offsetHeight || 1;
      thresholds = nodes.map((n) => (n.offsetTop + 5) / h);
    }
    computeThresholds();

    window.gsap.fromTo(
      prog,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        transformOrigin: "top",
        scrollTrigger: {
          trigger: tl,
          start: "top 75%",
          end: "bottom 75%",
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: computeThresholds,
          onUpdate(self) {
            const p = self.progress;
            nodes.forEach((node, i) => {
              node.classList.toggle(
                "journey__node--lit",
                p >= (thresholds[i] ?? 0),
              );
            });
          },
        },
      },
    );
  })();

  /* ---------- Resume tabs ---------- */
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const id = tab.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const panel = document.getElementById(id);
      if (panel) {
        panel.classList.add("active");
        // re-fill any bars now visible
        panel.querySelectorAll(".bar__fill").forEach(fillBar);
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* ===================================================== */
  /* ---------- Portfolio modal ---------- */
  /* ===================================================== */
  const portfolioData = {
    1: {
      title: "NBL Basketball Website Redesign Concept",
      desc: "A conceptual design project created entirely in Figma. I focused on improving the visual appeal and content organization of the National Basketball League website for a more engaging fan experience.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-1.png",
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=14-2&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    2: {
      title: "Playtech E-Commerce Website and Mobile App Concept",
      desc: "Personal UI/UX design project created entirely in Figma. This concept reimagines the online shopping experience for gaming electronics, focusing on intuitive product discovery, clear specification displays, and an optimized checkout process across both website and mobile app interfaces.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-3.png",
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=1-893&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    3: {
      title: "Codecrafted CV Website Concept",
      desc: "A personal UI/UX design project created entirely in Figma. This concept focuses on crafting a unique, highly organized, and aesthetically professional online CV to present experience, education, and projects with clarity and impact.",
      created: "2025",
      role: "App Designer",
      image: "assets/img/project-4.png",
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=1-142&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    4: {
      title: "Gamestop E-Commerce Website Concept",
      desc: "A personal UI/UX design concept created in Figma. This project focused on modernizing the GameStop digital storefront for video games. The core deliverable showcases comprehensive responsive layout design, demonstrating how the e-commerce experience is optimized for every screen size while enhancing product visibility and checkout flow.",
      created: "2025",
      role: "App Designer",
      image: "assets/img/project-5.png",
      figmaLink:
        "https://www.figma.com/design/btDoc5mZwwjTWvfmvABhEa/Personal-Projects?node-id=0-1&t=q81CPdX7Ki9ehocw-1",
      xdLink: "",
      websiteLink: "",
    },
    5: {
      title: "Content House Web App",
      desc: "As the Senior UI/UX Designer at Content House Inc. from July 2020 to December 2025, I was responsible for the end-to-end design of the company's proprietary, in-house web applications. Content House specializes in high-end real estate marketing services (such as photography, video, drone, floor plans, copywriting, etc.), and my designs were critical in providing real estate agents—our direct users—with the intuitive tools they needed to efficiently manage and showcase properties, securing a distinct edge in their sales efforts. My design process was highly structured and collaborative: I began by conducting thorough user and market research, as well as looking into our key competitors, maintained constant communication with our CEO, Product Manager, and the development team, and utilized Figma to execute every stage, moving systematically from initial wireframes through high-fidelity mockups, and creating detailed prototypes for comprehensive usability testing.",
      created: "2020-2025",
      role: "Designer",
      image: "assets/img/project-23.png",
      figmaLink:
        "https://www.figma.com/design/d8mVV2q97RtrVJSPWg66j8/Content-House-Web?node-id=10-40239&t=pYixpo1NXFlICUOt-1",
      xdLink: "",
      websiteLink: "",
    },
    6: {
      title: "Content House Mobile App",
      desc: "As the Senior UI/UX Designer at Content House Inc. from July 2020 to December 2025, I was responsible for the end-to-end design of the company's proprietary, in-house mobile application. This app was conceptualized and created simultaneously with the web application, ensuring a consistent cross-platform user experience for our agents. Content House specializes in high-end real estate marketing services (such as photography, video, drone, floor plans, copywriting, etc.), and my designs were critical in providing real estate agents—our direct users—with the intuitive tools they needed to manage assets on the go and efficiently showcase properties, securing a distinct edge in their sales efforts. My design process was highly structured and collaborative: I began by conducting thorough user and market research, as well as looking into our key competitors, maintained constant communication with the CEO, Product Manager, and the development team, and utilized Figma to execute every stage, moving systematically from initial wireframes through high-fidelity mockups, and creating detailed prototypes for comprehensive usability testing.",
      created: "2020-2025",
      role: "Designer",
      image: "assets/img/project-22.png",
      figmaLink:
        "https://www.figma.com/design/p2IiGez2N7lAKeNA7bdbr8/Content-House-Mobile-App?node-id=1-69106&t=TkHSp5qjfGxgS5HC-1",
      xdLink: "",
      websiteLink: "",
    },
    7: {
      title: "Content House Inc. Marketing Website",
      desc: "This project involved the full redesign and deployment of the main marketing website for Content House, replacing the initial version I created in 2020. The 2024 redesign focused on visually elevating the company's brand and clearly communicating the full suite of high-end real estate marketing services offered (photography, video, drone, floor plans, copywriting, etc.). The design process started with user research and moved through wireframing to high-fidelity mockups created in Figma. I then finalized the UX with detailed prototypes for usability testing. Critically, I then translated the final design into an actual, mobile-web responsive website using Squarespace. This implementation required advanced technical skills, utilizing custom HTML, CSS, and JavaScript to extend Squarespace's core capabilities. Furthermore, in 2025, I was responsible for subsequent content and feature updates, making direct code and content modifications within the Squarespace platform to maintain the site's functionality and relevance.",
      created: "2024-2025",
      role: "Designer and Developer",
      image: "assets/img/project-6.png",
      figmaLink:
        "https://www.figma.com/design/7dfXILsjej7ZVP2LkhUP9h/Marketing-Website?node-id=0-1&t=GGwW7AbNOWGooq9b-1",
      xdLink: "",
      websiteLink: "",
    },
    8: {
      title: "Agents Space Artwork Editor",
      desc: "This project involved the UI/UX design of a complex, feature-rich artwork editor integrated within the Agent's Space web application for real estate agents. The editor's core is powered by Chili Publish, enabling users to customize and generate high-quality marketing collateral (flyers, brochures, signs, etc.) using pre-approved, brand-compliant templates. Executed entirely in Figma, my design process was structured to ensure user-centricity and usability for a technical tool. I began with user research, followed by defining the architecture through wireframing. I then created detailed high-fidelity mockups and built prototypes for comprehensive usability testing, ultimately delivering an intuitive, professional editing environment that simplifies asset customization and ensures a quick, error-free workflow for property marketing material production.",
      created: "2025",
      role: "Designer",
      image: "assets/img/project-7.png",
      figmaLink:
        "https://www.figma.com/design/6674NGZUI86pZ5h0nALOSK/Agents-Space-Web?node-id=15-186&t=BfNky61zPcENvgJA-1",
      xdLink: "",
      websiteLink: "",
    },
    9: {
      title: "Agents Space Web App",
      desc: "Agent's Space is the primary, proprietary web application developed for Content House clients, serving as an all-in-one operational hub for real estate agents. The platform’s complexity stems from its wide range of interconnected, critical features, including: property detail creation, quote generation, artwork customization, product/supplier management, category reconciliation, and property sharing tools. Executed entirely in Figma, the core design challenge was creating a highly structured, scalable, and secure interface that supports multi-level user roles. I designed a sophisticated access management system where available features dynamically change based on the user's role (user, admin, or group member). My design process was rigorous and user-centric: I began with thorough user and market research, as well as looking into our key competitors, to map out complex agent workflows. I defined the entire information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure efficiency and ease-of-use across all user types.",
      created: "2023-2025",
      role: "Designer",
      image: "assets/img/project-8.png",
      figmaLink:
        "https://www.figma.com/design/6674NGZUI86pZ5h0nALOSK/Agents-Space-Web?node-id=1-34205&t=BfNky61zPcENvgJA-1",
      xdLink: "",
      websiteLink: "",
    },
    10: {
      title: "Agents Space Mobile App",
      desc: "The Agent's Space Mobile Application was designed simultaneously with the web application to provide Content House clients with critical, on-the-go access to their operational hub. The platform supports a wide array of interconnected, complex features, including property detail creation, quote generation, artwork review, product management, property sharing, and data reconciliation. Executed entirely in Figma, the core design challenge was adapting this high-complexity toolset to the constraints of a mobile interface while maintaining user security. I designed a sophisticated role-based access management system where features dynamically adjust based on the user's role (user, admin, or group member). My design process was rigorous and user-centric, starting with user research to map out complex agent workflows. I defined the mobile information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure a highly efficient, seamless, and secure experience for agents in the field.",
      created: "2023-2025",
      role: "Designer",
      image: "assets/img/project-9.png",
      figmaLink:
        "https://www.figma.com/design/2dw24WW2YdNzGkje7rNbQh/Agents-Space-Mobile?node-id=1-13749&t=OQp39AaaDTkfl31s-1",
      xdLink: "",
      websiteLink: "",
    },
    11: {
      title: "Agents Space Marketing Website",
      desc: "The Agent's Space Mobile Application was designed simultaneously with the web application to provide Content House clients with critical, on-the-go access to their operational hub. The platform supports a wide array of interconnected, complex features, including property detail creation, quote generation, artwork review, product management, property sharing, and data reconciliation. Executed entirely in Figma, the core design challenge was adapting this high-complexity toolset to the constraints of a mobile interface while maintaining user security. I designed a sophisticated role-based access management system where features dynamically adjust based on the user's role (user, admin, or group member). My design process was rigorous and user-centric, starting with user research to map out complex agent workflows. I defined the mobile information architecture through wireframing, then produced detailed high-fidelity mockups, and finalized the experience by creating prototypes for comprehensive usability testing to ensure a highly efficient, seamless, and secure experience for agents in the field.",
      created: "2024",
      role: "Designer and Developer",
      image: "assets/img/project-10.png",
      figmaLink: "",
      xdLink: "",
      websiteLink: "",
    },
    12: {
      title: "Travelbook PH Website Revamp and Mobile App",
      desc: "This was my first major project at Coreproc Inc., where I was the main UI/UX Designer and Front-End Developer for the client's Travelbook PH platform revamp, while also serving as the project representative for client communication. The application is a vital travel resource, enabling users to book accommodations (hotels, houses, etc.) across the Philippines with filters for preferred dates and locations, and allowing them to create detailed reviews to inform other users' booking decisions. My design process was initiated with thorough market and user research, including an analysis of many key competitors, to define product strategy, and I ensured I followed the branding guidelines precisely. My role included the full design of the website and the dedicated mobile apps for both Android and iOS. Since this was 2014, I created wireframes using Balsamiq Mockups and detailed high-fidelity designs in Adobe Photoshop, which were compiled into prototypes for usability testing. I was responsible for translating the final web design into a fully functional, mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap. Furthermore, I managed the project by conducting frequent meetings with our Japanese clients and working side-by-side with them to align on scope and deliverables. Note: Travelbook PH ceased its operations in 2020.",
      created: "2014-2016",
      role: "Designer and Developer",
      image: "assets/img/project-12.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Travelbook-PH?node-id=2-86&t=lEg93tpqWyTGkHwj-1",
      xdLink: "",
    },
    13: {
      title: "Nexgo Express Website",
      desc: "This project involved the complete redesign, UI/UX conceptualization, and front-end development of the Nexgo Express website. Nexgo Express is a crucial door-to-door pick-up and express delivery service provider for eCommerce businesses and online sellers operating within Metro Manila. The website's primary function is to empower users with essential information: the ability to easily track their packages and quickly view accurate shipping rates across the Philippines. My process was an end-to-end blend of design strategy and implementation: I started with comprehensive market and user research, including identifying and analyzing key competitors, to define the platform’s information architecture. I maintained constant communication with the CTO and Project Manager to ensure technical and business alignment. I then moved to designing high-fidelity websites and prototypes for the tracking and rating features. Finally, I executed the front-end development to create a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, ensuring a fast, reliable, and user-friendly experience for all online sellers. (Note: Last time I checked, it seems Nexgo does not have the website anymore and I am unsure to this day if the company is still operational.)",
      created: "2016",
      role: "Designer and Developer",
      image: "assets/img/project-13.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=2-128&t=lEg93tpqWyTGkHwj-1",
      xdLink: "assets/files/nexgo.xd",
      websiteLink: "",
    },
    14: {
      title: "MyPocketDoctor Website and Mobile App",
      desc: "This project involved the complete design and front-end implementation of the Mypocketdoctor platform (2016), one of the pioneers in the Philippine telemedicine and teleconsult sector. Our core mission was to provide quality, fast, and affordable telemedicine services to patients 24/7/365 with a consistently high service level and utmost customer satisfaction. I handled two primary roles: serving as the UI/UX Designer for both the website and the mobile apps (Android and iOS), and as the Front-End Developer for the website. My design process was strategically informed: I began with extensive market and user research, including identifying and analyzing key competitors, and ensured alignment by maintaining clear communication with the Client, CTO, and Project Manager throughout the lifecycle. I then focused on creating high-fidelity websites and apps using Adobe XD,  also did prototyping for comprehensive usability testing. Finally, I executed the web development, translating the design into a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, delivering a secure and highly accessible digital healthcare solution.)",
      created: "2016",
      role: "Designer and Developer",
      image: "assets/img/project-14.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=14-132&t=lEg93tpqWyTGkHwj-1",
      xdLink: "assets/files/mypocketdoctor.xd",
      websiteLink: "",
    },
    15: {
      title: "It's More Fun in the Philippines Website",
      desc: "This was a key project handled early in my tenure at Coreproc Inc., where I served as both the UI/UX Designer and Front-End Developer for the official It's More Fun in the Philippines tourism website. My design process was focused on creating an engaging and functional platform to promote travel and tourism. I began with user research to understand traveler needs, and made sure to follow the branding guidelines for the campaign. I maintained clear communication with our client and the CTO throughout the project lifecycle. For design execution, I utilized Balsamiq Mockups for wireframing and Adobe Photoshop for high-fidelity design. Following approval, I executed the front-end development, translating the design into a fully mobile-web responsive website using HTML, CSS, JavaScript, jQuery, and Twitter Bootstrap, ensuring the site was accessible and visually impactful across all devices.",
      created: "2014",
      role: "Designer and Developer",
      image: "assets/img/project-15.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=20-10&t=BovGgegej1hnWJNf-1",
      xdLink: "",
      websiteLink: "",
    },
    16: {
      title: "Coreproc Inc. Website",
      desc: "This project, executed in 2018, involved the complete UI/UX design and front-end development of the Coreproc Inc. corporate website. Leveraging direct insight from the CEO and CTO regarding necessary content and showcase elements, I streamlined the design process. I moved immediately to designing the high-fidelity mockups using Adobe XD, bypassing extensive wireframing to achieve a fast turnaround. A key focus of this project was exploring new front-end technology: I adopted Tailwind CSS as the main CSS framework, utilizing its utility-first approach to accelerate development. Following the design phase, I executed the front-end implementation to create a fully mobile-web responsive website, delivering a modern, performance-driven digital presence for the company.",
      created: "2018",
      role: "Designer and Developer",
      image: "assets/img/project-16.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=22-14&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/coreproc_website.xd",
      websiteLink: "https://coreproc.com/",
    },
    17: {
      title: "Mansmith Conference 2020 mobile app",
      desc: "This project, created in 2019, was one of the last initiatives I was responsible for at Coreproc Inc., focusing on the complete UI/UX design for the Mansmith 2020 Conference mobile application. The app served as a centralized digital event hub, requiring a highly efficient and visually polished interface for attendees to access rich content, including schedules, speaker details, and networking features. My structured design process began with extensive market and user research to identify critical conference needs. I maintained continuous communication with the CTO and Project Manager to align the design with technical requirements. The process moved rapidly through high-fidelity prototyping and designing the final interface, culminating in thorough usability testing to ensure the mobile experience was seamless and highly effective for all conference attendees. The tool I used for the design is Adobe XD.",
      created: "2019",
      role: "Designer",
      image: "assets/img/project-17.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=22-22&t=BovGgegej1hnWJNf-1",
      xdLink: "",
      websiteLink: "",
    },
    18: {
      title: "Yamaha Motors Philippines Mobile App",
      desc: "This project, conducted in 2018, involved the complete UI/UX redesign of Yamaha Motors Philippines' digital ecosystem, encompassing both their customer-facing mobile applications and the specialized internal backend platform (YZone). The goal was to modernize the entire digital experience, from customer product browsing and reservations to dealer management of motorcycle inventory, parts, and appointments. My design process was highly structured and client-focused: I began with extensive market and user research, including identifying and analyzing key competitors, to inform the strategic direction, and made sure to follow the Yamaha branding guidelines precisely. I attended meetings with our Yamaha clients alongside the Project Manager, ensuring clear and continuous alignment throughout the lifecycle. The tool I used for the design is Adobe XD. The process involved creating high-fidelity prototyping and designing the new interfaces, culminating in thorough usability testing to ensure a highly efficient, seamless experience for both consumer users and internal administrators.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-18.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=26-39&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/yamaha_motors.xd",
      websiteLink: "",
    },
    19: {
      title: "Figaro Coffee Mobile App",
      desc: "This project involved the complete UI/UX design of the Figaro Coffee customer-facing mobile application, completed in 2018. The application was designed to serve as a comprehensive tool for coffee lovers, facilitating easy menu browsing, customized item selection, order placement, reward tracking, and store location lookups. My design process was strategically focused on enhancing the customer experience and maintaining brand integrity: I began with extensive market and user research, including identifying and analyzing key competitors within the fast-casual dining sector, and made sure to follow strict branding guidelines throughout the process. I maintained continuous communication with the CTO and Project Manager to align the app design with business goals and technical feasibility. The final high-fidelity design was created using Adobe XD, moving through detailed prototyping and culminating in usability testing to ensure a seamless and intuitive mobile ordering experience.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-19.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=33-43&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/figaro_coffee.xd",
      websiteLink: "",
    },
    20: {
      title: "Angels Pizza Mobile App",
      desc: "This project involved the complete UI/UX design of the Angel's Pizza customer mobile application, completed in 2018. The app was designed as a direct-to-consumer platform to streamline the entire ordering process, supporting essential functions like delivery, order ahead, menu browsing, item customization (sizes, quantity), and store location mapping. My design process was focused on efficiency and brand fidelity: I began with extensive market and user research, including identifying and analyzing key competitors, while meticulously ensuring the design adhered to existing branding guidelines. I maintained continuous communication with the CTO and Project Manager to align the app with business and technical needs. The final high-fidelity design was created using Adobe XD, moving through detailed prototyping and culminating in usability testing to deliver a fast, intuitive, and brand-consistent mobile ordering experience.",
      created: "2018",
      role: "Designer",
      image: "assets/img/project-20.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=36-80&t=BovGgegej1hnWJNf-1",
      xdLink: "assets/files/angels_pizza.xd",
      websiteLink: "",
    },
    21: {
      title: "Aeon Cambodia Mobile App Redesign",
      desc: "This project, conducted in 2019, involved the complete UI/UX redesign of AEON Cambodia's digital payment ecosystem for a prominent Japanese Fintech company. My role encompassed redesigning both the consumer mobile application (as seen in the screenshot, likely focusing on mVisa payments, loyalty points, and payment confirmation flows) and the corresponding merchant mobile application. The objective was to modernize the user experience, enhance functionality, and improve overall usability for both customer transactions and business operations. My design process was highly systematic and client-driven: It began with thorough information gathering from clients and the Project Manager, followed by extensive market and user research to understand the specific needs of the Cambodian market and fintech landscape. I then initiated the design process using Adobe XD, starting with detailed wireframes, progressing to high-fidelity designs, and concluding with comprehensive prototyping for usability testing and gathering user feedback to refine the final product.",
      created: "2018-2019",
      role: "Designer",
      image: "assets/img/project-21.png",
      figmaLink:
        "https://www.figma.com/design/Eb0A2QxEg77paPdzwv6Wyx/Coreproc-Inc.-Projects?node-id=45-24&t=D51t5yxzyOLmX6hR-1",
      xdLink: "assets/files/aeon_consumer.xd",
      websiteLink: "",
    },
    22: {
      title: "KicksMart E-Commerce App — Figma Make (AI)",
      desc: "This is just a personal project that demonstrates a high-speed approach to mobile e-commerce design and prototyping. I designed and built the JUST the foundational Splash Screen and Home Page mockups. For efficiency, the remaining app pages were generated using Figma AI and quickly assembled into an interactive prototype. This exercise prioritizes showcasing rapid ideation and leveraging AI tools in the design workflow, resulting in a functional, albeit unpolished, proof-of-concept. This design is for mobile only.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-24.png",
      figmaLink:
        "https://www.figma.com/design/SVqMjYICFN33aFoWVmD5ej/Kicksmart?node-id=0-1&p=f",
      xdLink: "",
      websiteLink: "https://export-glad-87190303.figma.site/",
    },
    23: {
      title: "Vanguard Admin Dashboard — Figma Make (AI)",
      desc: "This UI/UX design project for the Vanguard Admin Dashboard utilized a modern, efficient workflow. I designed the main dashboard pages, including the complete visual system for both the Light Mode and the high-contrast Dark Mode. After these core interfaces were completed, the remaining pages, secondary screens, and interactive components of the website were automatically built using AI technology through Figma Make. Crucially, I directed the AI to ensure the entire output was fully mobile web responsive. Furthermore, thanks to my solid understanding of frontend development, I was able to review and comprehend the underlying code created by the AI. This dual workflow serves as proof of concept, demonstrating my ability to effectively integrate and utilize AI tools to enhance and efficiently scale my design output while maintaining technical control.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-25.png",
      figmaLink:
        "https://www.figma.com/design/gs2Nkkk9qEV8Ya0mRc6vvn/Vanguar---Admin-Dashboard?node-id=0-1&t=7tKlPFrrco00moGz-1",
      xdLink: "",
      websiteLink: "https://found-grasp-74066159.figma.site",
    },
    24: {
      title: "Vanguard Landing Page — Figma Make (AI)",
      desc: "This personal project was created to explore the frontier of AI-assisted UI design, specifically showcasing my proficiency with Figma Make. By leveraging Figma’s AI capabilities, I built a cohesive and modern landing page for Vanguard, focusing on how AI can be directed to produce high-quality, brand-aligned layouts. This project demonstrates my ability to integrate emerging technologies into the design process to accelerate production without losing sight of the core user experience.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-26.png",
      figmaLink:
        "https://www.figma.com/design/hjJ1SeflUvchY1X6Wq3C7Y/Vanguard-Landing-Page?node-id=0-1&t=uqzJgVTmhkbcRpC6-1",
      xdLink: "",
      websiteLink: "https://pear-jeep-99379078.figma.site",
    },
    25: {
      title: "Gacha Social App — Figma Make (AI)",
      desc: "I developed and designed this gacha platform as a primary showcase of my AI skills, utilizing Figma AI to architect a system where users can pull and collect unique characters while engaging in a highly interactive community. The application facilitates deep social engagement through features like player battling, liking, commenting, and direct messaging. My extensive front-end development experience provided a significant advantage during the build; because I deeply understand the code the AI generates, I was able to refine every component to ensure the entire system functions perfectly. This technical oversight was key to achieving a fully mobile-web responsive design, allowing the platform to work seamlessly on both desktop and mobile browsers. Users can enjoy a high-fidelity, app-like experience on any device without the need for a separate download, maintaining a consistent and polished feel across all screens.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-27.png",
      figmaLink: "",
      xdLink: "",
      websiteLink: "https://try-undo-36289219.figma.site",
    },
    26: {
      title: "Dragon Ball Flappy Goku Game (Retro Style) — Figma Make (AI)",
      desc: "I developed and designed this Retro Style Dragon Ball Flappy Goku game as a dedicated showcase of my AI skills, utilizing Figma AI to bring this Flappy Bird-inspired experience to life. My background in front-end development provided the necessary technical foundation to ensure the game functions perfectly; because I have a deep understanding of the code the AI generates, I was able to bridge the gap between AI-driven design and a fully playable, high-performance product. This project highlights a completely mobile-web responsive design, ensuring that the fast-paced gameplay remains smooth and intuitive whether you are playing on a desktop or a smartphone. By focusing on a seamless browser-based experience, I’ve ensured that the game delivers a polished, app-like feel on any device without the need for an external download.",
      created: "2025",
      role: "Designer and Developer",
      image: "assets/img/project-28.png",
      figmaLink: "",
      xdLink: "",
      websiteLink: "https://flappy-goku-topaz.vercel.app/",
    },
    27: {
      title: "Final Fantasy VII Marketing Landing Page — Claude Code",
      desc: "I developed this Final Fantasy VII marketing landing page to showcase my ability to leverage Claude Code for end-to-end web development. By using this agentic tool, I managed the entire design and implementation process directly from my terminal, while my front-end expertise allowed me to refine and optimize the AI-generated code for production-level performance. The result is a fully mobile-web responsive experience that maintains its cinematic impact and fluid navigation across both desktop and mobile. This project demonstrates how combining technical oversight with AI-driven workflows produces polished, high-performance results without the need for a separate app.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-29.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://final-fantasy-7.vercel.app/",
    },
    28: {
      title: "Velocità E-Commerce Website — Claude Code",
      desc: "I built the Velocità E-Commerce platform and its companion admin dashboard as a personal project to showcase my design and development workflow using Claude. By leveraging Claude Code to build the system with React, Tailwind, and Supabase, I managed everything from initial design to final deployment. My front-end expertise was essential for refining the code to ensure a robust, high-performance experience. Both applications are fully mobile-web responsive, providing a seamless experience across all devices. This project highlights my ability to use AI as a force multiplier while maintaining the technical oversight required to deliver professional, scalable solutions.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-30.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://scooter-store.vercel.app/",
    },
    32: {
      title: "WeSave: Savings & Expenses Tracker - Claude Code",
      desc: "I built WeSave using Flutter and Dart, guided entirely by my own prompts through Claude Code. It's a cross-platform budget and expense tracker for Android and iOS that I originally made for my wife and me to track our savings and spending together, though it works just as well for any couple or individual.\n\nHighlights:\n\nAI-Assisted Build: Prototyped and built from scratch for mobile using Claude Code, Flutter, and Dart.\n\nReal-Time Sync: Powered by Supabase and an offline cache, letting partners link accounts with a code and keep balances, expenses, and income updated live.\n\nSolid Engineering: Built with strict security rules, WCAG 2.1 AA accessibility standards (with light and dark mode support), and 206 passing tests.\n\nAlways-On Demo: Includes a one-tap demo mode with pre-loaded data so anyone can test the app instantly without signing up or worrying about server downtime.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-34.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://wesave-alpha.vercel.app/",
    },
    31: {
      title: "Meridian Landing Page — Claude Code",
      desc: "I designed and built the marketing landing page for Meridian, a personal project created to show how I use AI to build better apps faster. Using React 18, TypeScript, and Vite, I led the entire design and coding process through my own clear instructions for Claude Code. Every design and technical choice was guided by me.\n\nThe page features a bar at the top that shows live cryptocurrency prices and interactive pictures that show how the app works. I also added smooth animations that move as you scroll down the page to keep things interesting. The project is fully finished and live on the internet using Vercel.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-33.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://meridian-landing-nine.vercel.app/",
    },
    30: {
      title: "Meridian - Crypto & Stock Tracker — Claude Code",
      desc: "I designed and built Meridian using React 18, leading the design process entirely through my own iterative prompts.\n\nMeridian is another personal project I created to showcase my Claude Code skills. This is a full-stack financial dashboard for tracking live cryptocurrency and stock market data. Built with TypeScript and Supabase, it integrates the CoinGecko, Binance, and Finnhub APIs to deliver real-time prices, interactive charts, and portfolio management in a polished dark-themed UI.\n\nKey features include a live market overview with top 100 cryptocurrencies and major stocks, interactive asset detail pages with candlestick charts and sparklines, an authenticated portfolio tracker with transaction logging and allocation breakdowns, a personalized watchlist, market heatmap, fear & greed index gauge, trending coins, and sector performance panels. Fully responsive mobile-first layout with accessible, keyboard-navigable components.\n\nCryptocurrency prices are streamed in real time via the Binance WebSocket API. Stock prices, however, are sourced from Finnhub's free tier, which enforces strict rate limits and a capped number of daily requests so stock data reflects the most recently fetched price rather than a true live feed. This is a known trade-off of working within free API tiers and would be resolved with a paid plan in a production setting.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-32.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://meridian-xi.vercel.app/",
    },
    29: {
      title: "Velocità Admin Page — Claude Code",
      desc: "As the companion admin page for the Velocità E-Commerce platform, I built this dashboard as a personal project to showcase my end-to-end design and development workflow using Claude. By leveraging Claude Code to build this system with React, Tailwind, and Supabase, I handled everything from the initial interface design to final deployment. My front-end expertise was essential for refining the code to ensure a robust, high-performance experience. This dashboard serves as the command center for the store, allowing for seamless management of product content and orders. Fully mobile-web responsive, it provides a fluid, professional experience across any device, highlighting my ability to use AI as a force multiplier while maintaining the technical oversight required to deliver complete, scalable solutions.",
      created: "2026",
      role: "Designer and Developer",
      image: "assets/img/project-31.png",
      figmaLink: "",
      xdLink: "",
      claudeLink: "https://scooter-store-admin.vercel.app/dashboard/",
    },
  };

  /* ---------- WORK HALL OF FAME — Lando-style staggered columns ----------
     Re-flows the existing #portfolio-grid cards into N vertical columns. The
     even (2nd / 4th) columns start offset down and "catch up" to align as the
     grid scrolls into view (GSAP scrub). Rebuilds on breakpoint change. Cards
     keep their data-id so the shared modal handler still wires them. */
  function initHofGrid() {
    const grid = document.getElementById("portfolio-grid");
    if (!grid) return;
    const allCards = Array.from(grid.querySelectorAll(".hof-card"));
    if (!allCards.length) return;
    // The column convergence is the entrance, so drop the generic reveal fade.
    allCards.forEach((c) => c.classList.remove("reveal"));

    const colsFor = () => (window.innerWidth < 760 ? 2 : 4);
    let builtCols = 0;
    let conv = null;

    function build() {
      const COLS = colsFor();
      builtCols = COLS;
      if (conv) {
        if (conv.scrollTrigger) conv.scrollTrigger.kill();
        conv.kill();
        conv = null;
      }
      const cols = [];
      for (let i = 0; i < COLS; i++) {
        const col = document.createElement("div");
        col.className = "hof-col" + (i % 2 === 1 ? " hof-col--offset" : "");
        cols.push(col);
      }
      allCards.forEach((card, i) => cols[i % COLS].appendChild(card));
      grid.innerHTML = "";
      cols.forEach((c) => grid.appendChild(c));

      const gsap = window.gsap;
      if (!gsap || !window.ScrollTrigger || prefersReduced) return;
      const offsetCols = cols.filter((_, i) => i % 2 === 1);
      if (!offsetCols.length) return;
      const OFFSET = window.innerWidth < 760 ? 80 : 180;
      conv = gsap.fromTo(
        offsetCols,
        { y: OFFSET },
        {
          y: 0,
          ease: "none",
          scrollTrigger: {
            trigger: grid,
            start: "top 90%",
            end: "top -10%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }

    build();

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (colsFor() !== builtCols) {
          build();
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        }
      }, 200);
    });
  }
  initHofGrid();
  // Re-flowing the grid into columns changes layout; recompute ScrollTrigger.
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();

  /* ---------- HOF scroll-stack pin: freeze when its bottom reaches the
     viewport bottom so resume / socials / journey / footer scroll up over it */
  (function () {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    const hof = document.querySelector(".hof");
    const footer = document.querySelector(".footer");
    if (!hof || !footer) return;
    // The Work grid is white, but GSAP's pin-spacer is transparent. On wide/short
    // viewports the grid is shorter than the screen, so when it pins (bottom-bottom)
    // the dark body shows through the spacer as a band above the grid. The grid is
    // always white, so its spacer is always white too — reuse the flip's class.
    // GSAP rebuilds pin-spacers on refresh, so re-apply via onRefresh.
    const whitenHofSpacer = () => {
      const sp = hof.closest(".pin-spacer");
      if (sp) sp.classList.add("is-work-white");
    };
    window.ScrollTrigger.create({
      trigger: hof,
      start: "bottom bottom",
      endTrigger: footer,
      end: "bottom top",
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
      onRefresh: whitenHofSpacer,
    });
    whitenHofSpacer();
  })();

  /* ---------- Journey entry buffer: start the resume section 120 px below
     its natural scroll position and ease to 0 over the first ~150 px of
     scroll. This keeps the HOF "View all work" button visible longer before
     the Journey section slides up and covers it. */
  (function () {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    const resume = document.querySelector(".resume");
    if (!resume) return;
    gsap.from(resume, {
      y: 120,
      ease: "none",
      scrollTrigger: {
        trigger: resume,
        start: "top bottom",
        end: "top 72%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  })();

  /* ---------- Journey scroll-stack pin: freeze when its bottom reaches the
     viewport bottom so socials / footer scroll up over it */
  (function () {
    if (!window.gsap || !window.ScrollTrigger || prefersReduced) return;
    const resume = document.querySelector(".resume");
    const footer = document.querySelector(".footer");
    if (!resume || !footer) return;
    window.ScrollTrigger.create({
      trigger: resume,
      start: "bottom bottom",
      endTrigger: footer,
      end: "bottom top",
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
    });
  })();

  /* ---------- Custom cursor — dot + lagging ring ----------
     Fine pointers with motion allowed only. The dot tracks the pointer 1:1;
     the ring lerps behind it. States (link / card / pressed) are CSS classes
     so all the styling lives in the stylesheet. Built entirely from JS so
     touch devices never carry the markup. */
  (function initCursor() {
    if (prefersReduced) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;

    const root = document.createElement("div");
    root.className = "cursor";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<span class="cursor__ring"><span class="cursor__ring-in">' +
      '<span class="cursor__label">View</span></span></span>' +
      '<span class="cursor__dot"><span class="cursor__dot-in"></span></span>';
    document.body.appendChild(root);
    const ring = root.querySelector(".cursor__ring");
    const dot = root.querySelector(".cursor__dot");
    document.documentElement.classList.add("has-cursor-fx");

    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100,
      shown = false,
      rafId = null;

    function loop() {
      rafId = requestAnimationFrame(loop);
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = "translate(" + mx + "px," + my + "px)";
      ring.style.transform = "translate(" + rx + "px," + ry + "px)";
    }
    rafId = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!rafId) {
        rafId = requestAnimationFrame(loop);
      }
    });

    window.addEventListener(
      "mousemove",
      (e) => {
        mx = e.clientX;
        my = e.clientY;
        if (!shown) {
          // snap the ring to the entry point so it doesn't fly across the page
          rx = mx;
          ry = my;
          shown = true;
          root.classList.add("is-visible");
        }
      },
      { passive: true },
    );
    document.documentElement.addEventListener("mouseleave", () => {
      shown = false;
      root.classList.remove("is-visible");
    });
    window.addEventListener("mousedown", () => root.classList.add("is-down"));
    window.addEventListener("mouseup", () => root.classList.remove("is-down"));

    // Hover states via delegation — cards win over generic interactives.
    document.addEventListener(
      "mouseover",
      (e) => {
        const t = e.target;
        if (!t || !t.closest) return;
        const card = t.closest(".hof-card, .social-card");
        const link = card
          ? null
          : t.closest("a, button, [role='button'], .tab");
        root.classList.toggle("is-card", !!card);
        root.classList.toggle("is-link", !!link);
      },
      { passive: true },
    );
  })();

  /* ---------- Magnetic hover — buttons + round icon links ----------
     Elements ease toward the cursor while hovered and spring back on leave.
     Uses GSAP quickTo (transform x/y only). The CSS hover-lift on these
     elements is disabled under .has-cursor-fx so the two never conflict. */
  (function initMagnetic() {
    if (prefersReduced || !window.gsap) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
      return;
    const PULL = 0.32;
    document
      .querySelectorAll(
        ".btn, .about__icons a, .footer__social a, .socials__follow-links a, .modal__links a",
      )
      .forEach((el) => {
        const xTo = window.gsap.quickTo(el, "x", {
          duration: 0.4,
          ease: "power3.out",
        });
        const yTo = window.gsap.quickTo(el, "y", {
          duration: 0.4,
          ease: "power3.out",
        });
        el.addEventListener("mousemove", (e) => {
          const r = el.getBoundingClientRect();
          // untransformed centre — subtract the current pull so easing
          // toward the cursor doesn't feed back into the next offset
          const cx =
            r.left + r.width / 2 - (window.gsap.getProperty(el, "x") || 0);
          const cy =
            r.top + r.height / 2 - (window.gsap.getProperty(el, "y") || 0);
          xTo((e.clientX - cx) * PULL);
          yTo((e.clientY - cy) * PULL);
        });
        el.addEventListener("mouseleave", () => {
          xTo(0);
          yTo(0);
        });
      });
  })();

  const modal = document.getElementById("portfolio-modal");
  if (modal) {
    const closeBtn = document.getElementById("modal-close");
    const figmaBtn = modal.querySelector(".figma-link");
    const xdBtn = modal.querySelector(".xd-link");
    const webBtn = modal.querySelector(".website-link");
    const claudeBtn = modal.querySelector(".claude-link");
    let lastFocused = null;

    const FOCUSABLE =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function setLink(btn, url) {
      if (!btn) return;
      if (url) {
        btn.href = url;
        btn.style.display = "inline-flex";
      } else {
        btn.style.display = "none";
      }
    }

    function openModal(id) {
      const data = portfolioData[id];
      if (!data) return;
      const img = document.getElementById("modal-img");
      img.src = data.image;
      img.alt = data.title;
      img.onerror = function () {
        this.src = "https://via.placeholder.com/600x400?text=Project";
      };
      document.getElementById("modal-title").textContent = data.title;
      document.getElementById("modal-desc").textContent = data.desc;
      document.getElementById("modal-created").textContent = data.created;
      document.getElementById("modal-role").textContent = data.role;
      setLink(figmaBtn, data.figmaLink);
      setLink(xdBtn, data.xdLink);
      setLink(webBtn, data.websiteLink);
      setLink(claudeBtn, data.claudeLink);
      const isFigmaMake =
        data.websiteLink && data.websiteLink.includes("figma.site");
      webBtn.querySelector("img").src = isFigmaMake
        ? "assets/img/Figma-logo.svg"
        : "assets/img/web-icon.svg";
      webBtn.querySelector("span").textContent = isFigmaMake
        ? "Live Build"
        : "Website";
      webBtn.setAttribute(
        "aria-label",
        isFigmaMake ? "Open live Figma Make build" : "Visit website",
      );
      lastFocused = document.activeElement;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
      // Move focus into modal after transition begins
      requestAnimationFrame(() => closeBtn.focus());
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
      // Return focus to the element that triggered the modal
      if (lastFocused) {
        lastFocused.focus();
        lastFocused = null;
      }
    }

    // Focus trap — keep Tab/Shift+Tab inside the modal while it's open
    modal.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("open") || e.key !== "Tab") return;
      const focusable = Array.from(modal.querySelectorAll(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    document.querySelectorAll("[data-id]").forEach((el) => {
      el.addEventListener("click", () => openModal(el.getAttribute("data-id")));
    });
    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }
})();
