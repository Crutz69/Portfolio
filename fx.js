/* Motion for the portfolio pages: a live 3D terrain behind the title, a little depth on the title text, pictures that tilt toward
   the pointer, and content that rises into view. Shared by index.html (app.js calls it), the case studies and the demo pages.
   With prefers-reduced-motion the terrain is drawn once, still, and nothing else moves. Without this file the pages work as before. */
(function () {
  "use strict";
  const reduceQ = matchMedia("(prefers-reduced-motion: reduce)");
  const fineQ = matchMedia("(hover: hover) and (pointer: fine)");
  const still = () => reduceQ.matches;

  const style = document.createElement("style");
  style.textContent = [
    ".fx-reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: var(--fx-delay, 0ms); }",
    ".fx-reveal.fx-in { opacity: 1; transform: none; }",
    ".fx-tilt { position: relative; transform: perspective(900px) rotateX(var(--fx-rx, 0deg)) rotateY(var(--fx-ry, 0deg)); transition: transform .6s cubic-bezier(.2,.7,.2,1); }",
    ".fx-tilt.fx-live { transition: transform .1s linear; }",
    ".fx-tilt::after { content: \"\"; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .4s;",
    "  background: radial-gradient(circle at var(--fx-gx, 50%) var(--fx-gy, 50%), rgba(255,255,255,.2), transparent 55%); }",
    ".fx-tilt.fx-live::after { opacity: 1; }",
    "@media (prefers-reduced-motion: reduce) { .fx-reveal { opacity: 1; transform: none; transition: none; } .fx-tilt { transform: none; } }",
    "@media print { .fx-reveal { opacity: 1 !important; transform: none !important; } }"
  ].join("\n");
  document.head.append(style);

  // ---------- terrain ----------
  // A fixed noise field seen from a low camera that drifts forward. Rows are drawn far to near, each one filled with the page
  // colour before its line is stroked, so nearer ridges hide the ones behind them.
  function height(x, z) {
    return Math.sin(x * .55 + Math.cos(z * .45)) + .6 * Math.cos(z * .85 - x * .25) + .35 * Math.sin((x + z) * 1.15) + .15 * Math.sin(x * 2.3 - z * 1.9);
  }
  const NEAR = 1.3, FAR = 20, ROW = .36, CAM_H = 1.75, AMP = .72, SPEED = .32;
  let active = null;

  function terrain(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    if (active && active.canvas === canvas) { active.refresh(); return active; }
    if (active) active.stop();
    opts = opts || {};
    const g = canvas.getContext("2d"), host = canvas.parentElement, layers = opts.layers || [];
    let W = 1, H = 1, dpr = 1, colors = null, raf = 0, visible = true, t0 = performance.now(), frames = 0, fpsAt = t0;
    let mx = 0, my = 0, cx = 0, cy = 0; // pointer target and eased camera offset, -1..1
    let pts = new Float32Array(0);

    function readColors() {
      const s = getComputedStyle(document.documentElement), v = (n, d) => s.getPropertyValue(n).trim() || d;
      colors = { paper: v("--paper", "#eef1f0"), line: v("--ink-soft", "#4b5755"), accent: v("--accent", "#23705f") };
    }
    function size() {
      const r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      pts = new Float32Array((Math.ceil(W / (6 * dpr)) + 2) * 2);
    }
    function draw(time) {
      g.clearRect(0, 0, W, H);
      const f = Math.max(H * .7, W * .36), horizon = H * (.3 + cy * .03), step = 6 * dpr, camZ = time * SPEED, panX = cx * 1.4;
      const kFar = Math.floor((camZ + FAR) / ROW), kNear = Math.ceil((camZ + NEAR) / ROW);
      for (let k = kFar; k >= kNear; k--) {
        const depth = k * ROW - camZ, zw = k * ROW;
        let n = 0;
        for (let sx = 0; sx <= W + step; sx += step) {
          const xw = (sx - W / 2) / f * depth + panX;
          pts[n++] = sx; pts[n++] = horizon + (CAM_H - height(xw, zw) * AMP) / depth * f;
        }
        g.beginPath(); g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < n; i += 2) g.lineTo(pts[i], pts[i + 1]);
        g.lineTo(W, H); g.lineTo(0, H); g.closePath();
        g.globalAlpha = 1; g.fillStyle = colors.paper; g.fill();
        g.beginPath(); g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < n; i += 2) g.lineTo(pts[i], pts[i + 1]);
        const fog = Math.pow(Math.max(0, 1 - (depth - NEAR) / (FAR - NEAR)), 1.3), major = k % 4 === 0;
        g.globalAlpha = major ? fog * .9 : fog * .45; g.strokeStyle = major ? colors.accent : colors.line; g.lineWidth = dpr * (major ? 1.3 : 1);
        g.stroke();
      }
      g.globalAlpha = 1;
      layers.forEach(([el, d]) => { el.style.translate = (-cx * d).toFixed(2) + "px " + (-cy * d * .6).toFixed(2) + "px"; });
    }
    function loop(now) {
      raf = 0;
      cx += (mx - cx) * .05; cy += (my - cy) * .05;
      draw((now - t0) / 1000);
      frames++;
      if (now - fpsAt >= 1000) { if (opts.onFps) opts.onFps(Math.round(frames * 1000 / (now - fpsAt))); frames = 0; fpsAt = now; }
      kick();
    }
    function kick() { if (!raf && visible && !document.hidden && !still()) raf = requestAnimationFrame(loop); }
    function refresh() { size(); readColors(); if (still()) { cx = cy = 0; draw(0); layers.forEach(([el]) => { el.style.translate = ""; }); } else kick(); }

    const onMove = (e) => { if (!fineQ.matches) return; const r = host.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * 2 - 1; my = (e.clientY - r.top) / r.height * 2 - 1; };
    const onLeave = () => { mx = my = 0; };
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(refresh, 150); };
    const onVis = () => kick();
    const onMotion = () => { if (opts.onFps && still()) opts.onFps(0); t0 = performance.now(); refresh(); };
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }) : null;
    const onScheme = () => { readColors(); if (still()) draw(0); };
    const schemeQ = matchMedia("(prefers-color-scheme: dark)");
    const mo = new MutationObserver(onScheme);
    host.addEventListener("pointermove", onMove); host.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", onResize); document.addEventListener("visibilitychange", onVis);
    try { reduceQ.addEventListener("change", onMotion); schemeQ.addEventListener("change", onScheme); } catch (e) {}
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    if (io) io.observe(canvas);

    active = {
      canvas, refresh,
      stop() {
        if (raf) cancelAnimationFrame(raf); raf = 0;
        host.removeEventListener("pointermove", onMove); host.removeEventListener("pointerleave", onLeave);
        window.removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis);
        try { reduceQ.removeEventListener("change", onMotion); schemeQ.removeEventListener("change", onScheme); } catch (e) {}
        mo.disconnect(); if (io) io.disconnect();
        if (active && active.canvas === canvas) active = null;
      }
    };
    refresh();
    return active;
  }

  // ---------- content rising into view ----------
  let seen = null;
  function reveal(root, selector) {
    if (still() || !("IntersectionObserver" in window)) return;
    if (!seen) seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("fx-in"); seen.unobserve(e.target); } }),
      { rootMargin: "0px 0px -6% 0px", threshold: .06 });
    root.querySelectorAll(selector).forEach((el) => {
      if (el.classList.contains("fx-reveal")) return;
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--fx-delay", (i % 4) * 80 + "ms");
      el.classList.add("fx-reveal"); seen.observe(el);
    });
  }

  // ---------- pictures that tilt toward the pointer ----------
  function tilt(root, selector) {
    if (still() || !fineQ.matches) return;
    root.querySelectorAll(selector).forEach((el) => {
      if (el.classList.contains("fx-tilt")) return;
      el.classList.add("fx-tilt");
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const deg = 10 * Math.min(1, 420 / r.width); // big pictures tilt less
        el.classList.add("fx-live");
        el.style.setProperty("--fx-ry", ((px - .5) * deg).toFixed(2) + "deg"); el.style.setProperty("--fx-rx", ((.5 - py) * deg * .8).toFixed(2) + "deg");
        el.style.setProperty("--fx-gx", (px * 100).toFixed(1) + "%"); el.style.setProperty("--fx-gy", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", () => { el.classList.remove("fx-live"); el.style.setProperty("--fx-rx", "0deg"); el.style.setProperty("--fx-ry", "0deg"); });
    });
  }

  window.PortfolioFX = { terrain, reveal, tilt, still };
})();
