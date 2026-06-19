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

    const LINE = "rgba(168, 214, 84, 0.14)"; // faint lime on olive
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
          field[r * cols + c] = v;
        }
      }
    }

    // Allocation-free marching squares (no per-cell closures/arrays — that was
    // generating tens of thousands of throwaway objects per frame).
    function drawContours() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      ctx.strokeStyle = LINE;
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
                ctx.moveTo(x + (sx * (thr - tl)) / (tr - tl), y);
                ctx.lineTo(x, y + (sy * (thr - tl)) / (bl - tl));
                ctx.moveTo(x + (sx * (thr - bl)) / (br - bl), y + sy);
                ctx.lineTo(x + sx, ry);
                continue;
              }
              case 10: {
                // saddle: top-right + bottom-left
                const ry = y + (sy * (thr - tr)) / (br - tr);
                ctx.moveTo(x + (sx * (thr - tl)) / (tr - tl), y);
                ctx.lineTo(x + sx, ry);
                ctx.moveTo(x + (sx * (thr - bl)) / (br - bl), y + sy);
                ctx.lineTo(x, y + (sy * (thr - tl)) / (bl - tl));
                continue;
              }
              default:
                continue;
            }
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
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
      computeField(now * 0.001);
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

    // Only animate while the hero is on screen.
    const hero = document.querySelector(".hero");
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(
        (entries) =>
          entries.forEach((e) => (e.isIntersecting ? start() : stop())),
        { threshold: 0 },
      ).observe(hero);
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
      lenis.on("scroll", () => {
        if (window.ScrollTrigger) window.ScrollTrigger.update();
      });
    } else {
      requestAnimationFrame(raf);
    }
  }

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

  /* ---------- Nav: logo-only with scroll-aware colour ---------- */
  const nav = document.getElementById("nav");
  const progressBar = document.querySelector(".scroll-progress span");

  // Switches the logo between white (over the video panel) and #E8FFAE (off it).
  // stProgress is the raw ScrollTrigger progress 0–1.
  function setLogoColor(stProgress) {
    if (!nav) return;
    const vw = window.innerWidth;
    const finalSX = Math.min(1, 943 / vw);
    const curSX = 1 - Math.min(1, Math.max(0, stProgress)) * (1 - finalSX);
    // Panel left edge retreats toward centre as it scales.
    const panelLeft = (vw * (1 - curSX)) / 2;
    // Logo occupies [16 … 16 + nav.offsetWidth]px from the left.
    nav.classList.toggle(
      "logo-dimmed",
      panelLeft >= 16 + nav.offsetWidth || stProgress >= 1,
    );
  }

  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    if (progressBar) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
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

  /* ---------- Skill bars fill ---------- */
  function fillBar(bar) {
    bar.style.transform = `scaleX(${(bar.getAttribute("data-width") || 0) / 100})`;
  }
  const bars = document.querySelectorAll(".bar__fill");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            fillBar(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 },
    );
    bars.forEach((b) => io.observe(b));
  } else {
    bars.forEach(fillBar);
  }

  /* ---------- GSAP hero scroll animation ---------- */
  if (window.gsap && window.ScrollTrigger && !prefersReduced) {
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    const heroSection = document.querySelector(".hero");
    const heroPanel = document.getElementById("hero-panel");

    if (heroSection && heroPanel) {
      // Logo starts white (over the full-screen panel); colour is updated each frame.
      setLogoColor(0);

      // Signature: a single hand-drawn stroke path that writes itself on via
      // stroke-dashoffset, scrubbed to scroll — drawing from its start point
      // (top of the first loop) through to the end, with a glowing pen nib
      // riding the leading edge. The drawSig/measureSig logic is generic over
      // any list of `.hero__sig-mp` paths, so one path just works.
      const sigEl = document.getElementById("hero-sig");
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
        if (sigPen && penIdx >= 0 && p > 0.002 && p < 0.998) {
          try {
            const pt = sigStrokes[penIdx].getPointAtLength(
              Math.min(penLocal, sigLens[penIdx]),
            );
            const scale = sigSvg.clientWidth / SIG_VB_W;
            sigPen.style.left = (pt.x - SIG_VB_X) * scale + "px";
            sigPen.style.top = (pt.y - SIG_VB_Y) * scale + "px";
            sigPen.style.opacity = "1";
          } catch (e) {}
        } else if (sigPen) {
          sigPen.style.opacity = "0";
        }
      }
      if (sigStrokes.length) {
        measureSig();
        drawSig(0);
        window.addEventListener("resize", () => {
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroSection,
          start: "top top",
          end: "+=65%",
          scrub: 1.1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setLogoColor(self.progress),
          onRefresh: (self) => setLogoColor(self ? self.progress : 0),
          onLeave: () => nav && nav.classList.add("logo-dimmed"),
          onLeaveBack: () => nav && nav.classList.remove("logo-dimmed"),
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
  }

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

  /* ---------- Load more ---------- */
  const cards = Array.from(document.querySelectorAll(".hof-card"));
  const loadMoreBtn = document.getElementById("load-more-btn");
  const PER_LOAD = 12;
  let visible = 12;
  cards.forEach((c, i) => {
    if (i >= visible) c.classList.add("hidden");
  });
  if (loadMoreBtn) {
    if (cards.length <= visible) loadMoreBtn.style.display = "none";
    loadMoreBtn.addEventListener("click", () => {
      const hidden = cards.filter((c) => c.classList.contains("hidden"));
      hidden.slice(0, PER_LOAD).forEach((c) => {
        c.classList.remove("hidden");
        c.classList.add("in"); // already in view region; ensure visible
      });
      if (!document.querySelector(".hof-card.hidden")) {
        loadMoreBtn.style.display = "none";
      }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }

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
      desc: "This is just a personal project that demonstrates a high-speed approach to mobile e-commerce design and prototyping. I designed and built the foundational Splash Screen and Home Page mockups. For efficiency, the remaining app pages were generated using Figma AI and quickly assembled into an interactive prototype. This exercise prioritizes showcasing rapid ideation and leveraging AI tools in the design workflow, resulting in a functional, albeit unpolished, proof-of-concept. This design is for mobile only.",
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
      websiteLink: "https://sniff-ahead-92042786.figma.site",
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

  const modal = document.getElementById("portfolio-modal");
  if (modal) {
    const closeBtn = document.getElementById("modal-close");
    const figmaBtn = modal.querySelector(".figma-link");
    const xdBtn = modal.querySelector(".xd-link");
    const webBtn = modal.querySelector(".website-link");
    const claudeBtn = modal.querySelector(".claude-link");

    function setLink(btn, url) {
      if (!btn) return;
      if (url) {
        btn.href = url;
        btn.style.display = "grid";
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
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (lenis) lenis.stop();
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }

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
