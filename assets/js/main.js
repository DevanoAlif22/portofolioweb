/* ============================================================
   Risma Paramesti — Portfolio interactions
   Vanilla JS + GSAP / ScrollTrigger (loaded via CDN)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Theme toggle (persisted) ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  var saved = null;
  try { saved = localStorage.getItem("risma-theme"); } catch (e) {}
  if (saved) root.setAttribute("data-theme", saved);

  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("risma-theme", next); } catch (e) {}
    });
  }

  /* ---------- Copy email + toast ---------- */
  var copyBtn = document.getElementById("copyEmail");
  var toast = document.getElementById("toast");
  var toastTween;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    if (window.gsap) {
      if (toastTween) toastTween.kill();
      toastTween = gsap.timeline()
        .fromTo(toast, { y: "200%", opacity: 0 }, { y: "0%", opacity: 1, duration: 0.4, ease: "back.out(2)" })
        .to(toast, { y: "200%", opacity: 0, duration: 0.35, ease: "power2.in", delay: 1.8 });
    } else {
      toast.style.transform = "translate(-50%, 0)";
      setTimeout(function () { toast.style.transform = "translate(-50%, 200%)"; }, 2000);
    }
  }

  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      var done = function () { showToast("Email disalin ✦"); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
      function fallbackCopy() {
        var t = document.createElement("textarea");
        t.value = email; document.body.appendChild(t); t.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(t); done();
      }
    });
  }

  /* ---------- GSAP animations ---------- */
  if (!window.gsap) return;
  document.body.classList.add("gsap-ready");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var skewTitles = [].slice.call(document.querySelectorAll(".services__title, .work__title, .cta__title"));
  var reveals = [].slice.call(document.querySelectorAll(".js-reveal")).filter(function (el) {
    return !el.closest(".hero") && skewTitles.indexOf(el) === -1;
  });

  if (prefersReduced) {
    /* Accessibility: show everything, skip motion entirely */
    gsap.set(".js-reveal", { opacity: 1, y: 0 });
    gsap.set(skewTitles, { opacity: 1, y: 0, skewY: 0 });
    return;
  }

  /* Hero intro + parallax use ScrollTrigger; those measure correctly. */
  gsap.registerPlugin(ScrollTrigger);

  var intro = gsap.timeline({ defaults: { ease: "power4.out" } });
  intro
    .from(".js-hero-line", { yPercent: 115, opacity: 0, duration: 1, stagger: 0.12 })
    .fromTo(".hero__portrait", { scale: 0.85, opacity: 0, rotate: -3 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.9, ease: "back.out(1.6)" }, "-=0.7")
    .fromTo(".hero__bio", { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7 }, "-=0.6")
    .fromTo(".hero__stats .stat", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 }, "-=0.5")
    .fromTo(".hero__rail--right", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "-=0.3");

  gsap.to(".js-parallax", {
    yPercent: -18,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  /* ---------- Scroll reveals via IntersectionObserver (GSAP-animated) ----------
     IO is used instead of ScrollTrigger for these because it needs no scroll-
     position math — reliable across layout shifts, fonts, and dynamic height.
     Each element gets a direction + a cascade delay so grids sweep in
     left→right as they enter the viewport. */
  var allReveals = reveals.concat(skewTitles);

  function directionFor(el) {
    if (el.matches(".card, .orgcard, .project, .timeline__item")) return "left";
    if (el.matches(".checklist li")) return "right";
    return "up";
  }
  /* cascade: later same-section siblings start slightly after earlier ones */
  function cascadeDelay(el) {
    var d = 0, p = el.previousElementSibling;
    while (p) {
      if (p.classList && p.classList.contains("js-reveal")) d += 0.1;
      p = p.previousElementSibling;
    }
    return Math.min(d, 0.5);
  }

  allReveals.forEach(function (el) {
    var from = { opacity: 0 };
    var dir = directionFor(el);
    if (dir === "left") from.x = -70;
    else if (dir === "right") from.x = 70;
    else from.y = 40;
    if (skewTitles.indexOf(el) !== -1) { from.y = 30; from.skewY = 4; }
    el.__delay = cascadeDelay(el);
    gsap.set(el, from);
  });

  function animateIn(el) {
    var to = {
      opacity: 1, x: 0, y: 0,
      duration: 0.8, ease: "power3.out",
      delay: el.__delay || 0
    };
    if (skewTitles.indexOf(el) !== -1) { to.skewY = 0; to.duration = 0.9; }
    gsap.to(el, to);
  }

  function revealAll() {
    allReveals.forEach(animateIn);
  }

  if (!window.innerHeight) {
    /* Degenerate viewport (some embedded/preview contexts) — just show everything */
    revealAll();
  } else {
    /* GSAP ScrollTrigger: each element animates the moment it scrolls into view,
       no matter how long the visitor waited before scrolling. */
    allReveals.forEach(function (el) {
      var to = {
        opacity: 1, x: 0, y: 0,
        duration: 0.8, ease: "power3.out", delay: el.__delay || 0,
        scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" }
      };
      if (skewTitles.indexOf(el) !== -1) { to.skewY = 0; to.duration = 0.9; }
      gsap.to(el, to);
    });
    ScrollTrigger.refresh();
  }

  /* ---------- Seamless GSAP marquee ---------- */
  var track = document.querySelector(".marquee__track");
  if (track) {
    var groupWidth = track.scrollWidth / 2;
    gsap.to(track, {
      x: -groupWidth,
      duration: 18,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: function (x) { return (parseFloat(x) % groupWidth) + "px"; }
      }
    });
    var recompute = function () { groupWidth = track.scrollWidth / 2; };
    window.addEventListener("load", recompute);
    window.addEventListener("resize", recompute);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(recompute);
  }

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });

  /* ---------- Custom cursor (desktop / fine pointer only) ---------- */
  if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
    var ring = document.createElement("div");
    var dot = document.createElement("div");
    ring.className = "cursor-ring";
    dot.className = "cursor-dot";
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    document.body.classList.add("has-cursor");

    gsap.set([ring, dot], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    var ringX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    var ringY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    var dotX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
    var dotY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });

    window.addEventListener("mousemove", function (e) {
      ringX(e.clientX); ringY(e.clientY);
      dotX(e.clientX); dotY(e.clientY);
    });

    /* Grow the ring over interactive things */
    var hoverables = document.querySelectorAll(
      "a, button, .card, .orgcard, .project, .techpill, .theme-toggle, .timeline__item"
    );
    hoverables.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        gsap.to(ring, { scale: 1.9, duration: 0.3, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(ring, { scale: 1, duration: 0.3, ease: "power3.out" });
      });
    });

    /* Click pulse */
    window.addEventListener("mousedown", function () {
      gsap.to(ring, { scale: 0.7, duration: 0.15 });
    });
    window.addEventListener("mouseup", function () {
      gsap.to(ring, { scale: 1, duration: 0.25 });
    });

    /* Hide when leaving the window */
    document.addEventListener("mouseleave", function () {
      gsap.to([ring, dot], { opacity: 0, duration: 0.2 });
    });
    document.addEventListener("mouseenter", function () {
      gsap.to([ring, dot], { opacity: 1, duration: 0.2 });
    });
  }
})();
