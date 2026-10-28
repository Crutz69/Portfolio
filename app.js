/* Portfolio home. The site's content lives in the JSON block #site-data inside index.html; this script renders it.
   The owner gets an editor: changes are kept in the browser session until "Save & publish" writes a new index.html
   (same shell, new JSON) through the artifact capability. Cover images are uploaded through the assets capability. */
(function () {
  "use strict";
  const DRAFT_KEY = "portfolio-draft-v1";
  const app = document.getElementById("app");
  let saved = JSON.parse(document.getElementById("site-data").textContent);
  let data = clone(saved);
  let editing = false, canEdit = false, artifactNs = null, assetsNs = null, dirty = false;

  // ---------- language ----------
  // English lives in the plain fields; Swedish in an "sv" object beside them (data.sv, project.sv, experience item .sv).
  // An empty Swedish field falls back to English. The choice: ?lang= in the URL, then the visitor's last pick, then the browser.
  const LANG_KEY = "portfolio-lang", LANGS = ["en", "sv"];
  const UI = {
    en: { language: "Language", sections: "Sections", work: "Work", skills: "Skills", skillsEyebrow: "Skills and approach", experience: "Experience", demos: "Demos", about: "About", contact: "Contact",
      seeWork: "See the work", getInTouch: "Get in touch", selectedWork: "Selected work", projects: "Projects", empty: "Projects will appear here.",
      featured: "Featured", readCase: "Read the case study", open: "Open", tools: "Tools and topics", expEyebrow: "Experience and education",
      background: "Background", aboutMe: "About me", workWith: "Languages and tools", letsTalk: "Let's talk", copy: "Copy address", copied: "Copied",
      selected: "Selected, press Ctrl+C", live: "Procedural terrain, drawn live in your browser", seeDemos: "Watch the demos", demo: "See the demo",
      code: "Source code", glance: "At a glance",
      models: "3D", modelsEyebrow: "3D models", modelHint: "Drag to rotate · scroll to zoom", modelPick: "Choose a model", modelAlt: "3D model", modelStill: "Still picture in this preview · turn it in 3D on portfolio.amastack.com" },
    sv: { language: "Språk", sections: "Avsnitt", work: "Projekt", skills: "Kunskaper", skillsEyebrow: "Kunskaper och arbetssätt", experience: "Erfarenhet", demos: "Demos", about: "Om mig", contact: "Kontakt",
      seeWork: "Se projekten", getInTouch: "Hör av dig", selectedWork: "Utvalda arbeten", projects: "Projekt", empty: "Projekten visas här.",
      featured: "Utvalt", readCase: "Läs fallstudien", open: "Öppna", tools: "Verktyg och ämnen", expEyebrow: "Erfarenhet och utbildning",
      background: "Bakgrund", aboutMe: "Om mig", workWith: "Språk och verktyg", letsTalk: "Hör av dig", copy: "Kopiera adressen", copied: "Kopierad",
      selected: "Markerad, tryck Ctrl+C", live: "Procedurell terräng, ritad live i din webbläsare", seeDemos: "Se demos", demo: "Se demot",
      code: "Källkod", glance: "I korthet",
      models: "3D", modelsEyebrow: "3D-modeller", modelHint: "Dra för att vrida · scrolla för att zooma", modelPick: "Välj en modell", modelAlt: "3D-modell", modelStill: "Stillbild i förhandsvisningen · vrid den i 3D på portfolio.amastack.com" }
  };
  // pages of this site that have a Swedish copy
  const SV_PAGES = { "sundmark.html": "sundmark.sv.html", "media.html": "media.sv.html" };
  let lang = pickLang();

  function pickLang() {
    try { const q = new URLSearchParams(location.search).get("lang"); if (LANGS.includes(q)) return q; } catch (e) {}
    try { const s = localStorage.getItem(LANG_KEY); if (LANGS.includes(s)) return s; } catch (e) {}
    return /^sv\b/i.test(navigator.language || "") ? "sv" : "en";
  }
  function setLang(l) {
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    try { const u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(null, "", u); } catch (e) {}
    render();
  }
  function ui(k) { return UI[lang][k]; }
  function filled(v) { return v != null && v !== "" && !(Array.isArray(v) && !v.length); }
  // the text to show: Swedish when chosen and filled in, else English
  function tx(o, k) { const v = lang === "sv" && o && o.sv ? o.sv[k] : null; return filled(v) ? v : o ? o[k] : undefined; }
  // the editor reads and writes the shown language only
  function own(o, k) { return lang === "sv" ? (o.sv || {})[k] : o[k]; }
  function put(o, k, v) { if (lang === "sv") { o.sv = o.sv || {}; o.sv[k] = v; } else o[k] = v; }
  function localize(u) {
    const m = lang === "sv" && /^([a-z0-9_\-.]+\.html)(#.*)?$/i.exec(String(u || "").trim());
    return m && SV_PAGES[m[1]] ? SV_PAGES[m[1]] + (m[2] || "") : u;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  }
  // Links: http(s) to other sites, or a page of this site (letters, digits, - _ . / #).
  function safeHref(u) {
    u = String(u || "").trim();
    if (/^https?:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^[a-z0-9][a-z0-9_\-./]*(#[a-z0-9_\-.~]+)?$/i.test(u) && !u.includes("..")) return u;
    if (/^#[a-z0-9_\-.~]+$/i.test(u)) return u;
    return null;
  }
  function external(u) { return /^https?:/i.test(u); }
  function coverSrc(c) {
    if (!c) return null;
    if (c.asset && /^[a-z0-9]{8,64}$/i.test(c.asset)) return "/_blob/" + c.asset;
    if (c.src && /^img\/[a-z0-9_\-.]+\.(jpg|jpeg|png|webp)$/i.test(c.src)) return c.src;
    return null;
  }
  function link(href, label, cls) {
    const ok = safeHref(localize(href));
    if (!ok) return null;
    return h("a", { href: ok, class: cls, target: external(ok) ? "_blank" : null, rel: external(ok) ? "noopener" : null }, label);
  }
  function lines(text) { return String(text || "").split(/\n{2,}/).map(s => s.trim()).filter(Boolean); }
  // an icon from ui.js, or nothing when that file is not loaded
  function ic(name) { return window.PortfolioUI && name ? window.PortfolioUI.icon(name) : null; }
  function eyebrow(icon, text) { return h("p", { class: "eyebrow" }, ic(icon), text); }

  // ---------- render ----------
  function render() {
    document.title = (data.name || "Portfolio") + " Portfolio";
    document.documentElement.lang = lang;
    app.replaceChildren();
    const wrap = h("div", { class: "wrap" });
    const nl = (href, icon, label) => h("a", { href, class: "nl" }, ic(icon), h("span", {}, label));
    wrap.append(
      h("header", { class: "top" },
        h("a", { class: "mark", href: "#top" }, data.name || "Portfolio"),
        h("nav", { "aria-label": ui("sections") }, nl("#work", "grid", ui("work")), data.models ? nl("#models", "cube", ui("models")) : null,
          data.approach ? nl("#skills", "cpu", ui("skills")) : null,
          (data.experience || []).length ? nl("#experience", "briefcase", ui("experience")) : null,
          nl(localize("media.html"), "film", ui("demos")), nl("#about", "user", ui("about")), nl("#contact", "mail", ui("contact"))),
        langSwitch()),
      ...[plate(), glance(), work(), models(), approach(), experience(), about(), contact()].filter(Boolean),
      h("footer", {}, h("p", {}, tx(data, "footer") || ""), h("p", {}, "© " + new Date().getFullYear() + " " + (data.name || "")))
    );
    app.append(wrap);
    drawTopo();
    startFx();
    spy();
    if (editing) app.append(editbar());
    else if (canEdit) app.append(editToggle());
  }
  function langSwitch() {
    return h("span", { class: "lang", role: "group", "aria-label": ui("language") }, LANGS.map(l =>
      h("a", { href: "?lang=" + l, hreflang: l, lang: l, "aria-label": l === "sv" ? "Svenska" : "English", "aria-current": l === lang ? "true" : null,
        onclick: (e) => { e.preventDefault(); if (l !== lang) setLang(l); } }, ic(l === "sv" ? "flag-se" : "flag-gb"), h("span", {}, l.toUpperCase()))));
  }
  // the menu marks the section on screen
  let spyIo = null, spyEnd = false, spyMark = null, spyPin = null;
  function spy() {
    if (spyIo) spyIo.disconnect();
    if (!("IntersectionObserver" in window)) return;
    const links = new Map([...app.querySelectorAll(".top nav a[href^='#']")].map(a => [a.getAttribute("href").slice(1), a]));
    const on = new Set();
    const mark = () => {
      // a clicked link stays lit until the reader scrolls by hand; at the very bottom the last section is the one being read,
      // even if it is too short to reach the middle band
      const ids = [...links.keys()];
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
      const cur = spyPin || (atEnd ? ids[ids.length - 1] : ids.find(id => on.has(id)));
      links.forEach((a, id) => { if (id === cur) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
    };
    spyIo = new IntersectionObserver((es) => { es.forEach(e => e.isIntersecting ? on.add(e.target.id) : on.delete(e.target.id)); mark(); }, { rootMargin: "-30% 0px -60% 0px" });
    links.forEach((a, id) => { const s = document.getElementById(id); if (s) spyIo.observe(s); });
    links.forEach((a, id) => a.addEventListener("click", () => { spyPin = id; mark(); }));
    if (!spyEnd) {
      spyEnd = true;
      addEventListener("scroll", () => { if (spyMark) spyMark(); }, { passive: true });
      const unpin = () => { if (spyPin) { spyPin = null; if (spyMark) spyMark(); } };
      ["wheel", "touchstart", "keydown", "pointerdown"].forEach(ev => addEventListener(ev, unpin, { passive: true }));
    }
    spyMark = mark;
  }

  function plate() {
    const p = h("header", { class: "plate", id: "top" }, h("canvas", { id: "topo", "aria-hidden": "true" }));
    p.append(h("p", { class: "eyebrow" }, tx(data, "headline") || ""));
    p.append(h("h1", {}, data.name || ""));
    if (tx(data, "intro")) p.append(h("p", { class: "lede" }, tx(data, "intro")));
    const acts = h("div", { class: "actions" }, h("a", { class: "btn solid", href: "#work" }, ic("grid"), ui("seeWork")),
      h("a", { class: "btn", href: localize("media.html") }, ic("play") || h("span", { "aria-hidden": "true" }, "▶"), ui("seeDemos")), h("a", { class: "btn", href: "#contact" }, ic("mail"), ui("getInTouch")));
    p.append(acts);
    // factIcons: one icon name per fact, in the same order
    const fi = data.factIcons || [];
    if ((tx(data, "facts") || []).length) p.append(h("div", { class: "facts mono" }, tx(data, "facts").map((f, i) => h("span", {}, ic(fi[i]), f))));
    if (window.PortfolioFX) p.append(h("p", { class: "hud mono", "aria-hidden": "true" }, h("span", {}, ui("live")), h("span", { class: "fps" })));
    if (editing) p.append(h("div", { class: "actions" }, h("button", { class: "tbtn", type: "button", onclick: () => profileDialog() }, "Edit name, intro and contact")));
    return p;
  }

  // the key numbers in one strip under the title, for readers who skim; whole numbers count up once when they come into view
  function glance() {
    const items = tx(data.glance, "items") || [];
    if (!items.length) return null;
    const strip = h("ul", { class: "glance", "aria-label": ui("glance") }, items.map(x => h("li", {}, h("b", { "data-count": /^\d+$/.test(x.n) ? x.n : null }, x.n), h("span", {}, x.text))));
    const counts = strip.querySelectorAll("[data-count]");
    const still = window.PortfolioFX ? window.PortfolioFX.still() : true;
    if (!still && "IntersectionObserver" in window && counts.length) {
      counts.forEach(el => { el.textContent = "0"; });
      const io = new IntersectionObserver((es) => {
        if (!es.some(e => e.isIntersecting)) return;
        io.disconnect();
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
          counts.forEach(el => { el.textContent = String(Math.round(e * +el.dataset.count)); });
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }, { threshold: .4 });
      io.observe(strip);
    }
    return strip;
  }

  function work() {
    const s = h("section", { id: "work", "aria-labelledby": "workh" }, h("header", {}, eyebrow("grid", ui("selectedWork")), h("h2", { id: "workh" }, ui("projects"))));
    const projects = data.projects || [];
    const fi = projects.findIndex(p => p.featured);
    if (fi >= 0) s.append(feature(projects[fi], fi));
    const rest = projects.map((p, i) => [p, i]).filter(([, i]) => i !== fi);
    const grid = h("div", { class: "cards" });
    rest.forEach(([p, i], n) => grid.append(card(p, i, n + (fi >= 0 ? 2 : 1))));
    if (editing) grid.append(h("button", { class: "addcard", type: "button", onclick: () => projectDialog(-1) }, "+ Add a project"));
    if (rest.length || editing) s.append(grid);
    if (!projects.length && !editing) s.append(h("p", { class: "empty" }, ui("empty")));
    return s;
  }

  function picture(p, cls) {
    const src = coverSrc(p.cover);
    // without a cover the card gets a title plate on contour lines instead of an empty box
    const img = src ? h("img", { src, alt: tx(p, "coverAlt") || p.title || "", loading: "lazy" }) : h("div", { class: "noimg", role: "img", "aria-label": p.title || "Project" }, h("span", {}, p.title || ""));
    const href = safeHref(localize(p.link));
    return href ? h("a", { class: cls, href, target: external(href) ? "_blank" : null, rel: external(href) ? "noopener" : null, "aria-label": p.title }, img) : h("div", { class: cls }, img);
  }
  function metaLine(p) {
    const bits = [p.year, tx(p, "role")].filter(Boolean);
    return bits.length ? h("p", { class: "meta mono" }, bits.map(b => h("span", {}, b))) : null;
  }
  // the project's own link and, when it has footage on the demo page, a second one to that
  function moreLinks(p, fallback) {
    const a = link(p.link, tx(p, "linkLabel") || fallback, "more");
    if (a) a.append(ic(external(a.getAttribute("href")) ? "external" : "arrow-right") || " →");
    const b = link(p.demo, tx(p, "demoLabel") || ui("demo"), "more demo");
    if (b) b.prepend(ic("play") || "▶ ");
    const c = /^https:\/\//i.test(p.code || "") ? link(p.code, ui("code"), "more code") : null;
    if (c) c.prepend(ic("code") || "</> ");
    return a || b || c ? h("p", { class: "morerow" }, a, b, c) : null;
  }
  function tagList(p) { const tags = tx(p, "tags") || []; return tags.length ? h("ul", { class: "tags", "aria-label": ui("tools") }, tags.map(t => h("li", {}, t))) : null; }

  function feature(p, i) {
    const box = h("article", { class: "feature" }, picture(p, "pic"));
    const txt = h("div", { class: "txt" }, eyebrow("star", ui("featured")), h("h3", {}, p.title || "Untitled"), metaLine(p), tx(p, "summary") ? h("p", {}, tx(p, "summary")) : null, tagList(p));
    const more = moreLinks(p, ui("readCase"));
    if (more) txt.append(more);
    box.append(txt);
    if (editing) box.style.position = "relative", box.append(tools(i));
    return box;
  }
  function card(p, i, number) {
    const c = h("article", { class: "card" }, picture(p, "pic"),
      h("p", { class: "no" }, String(number).padStart(2, "0")),
      h("h3", {}, safeHref(p.link) ? link(p.link, p.title || "Untitled") : (p.title || "Untitled")),
      metaLine(p), tx(p, "summary") ? h("p", { class: "sum" }, tx(p, "summary")) : null, tagList(p));
    const more = moreLinks(p, ui("open"));
    if (more) c.append(more);
    if (editing) c.append(tools(i));
    return c;
  }
  function tools(i) {
    const n = data.projects.length;
    const t = h("div", { class: "tools" },
      h("button", { type: "button", onclick: () => projectDialog(i) }, "Edit"),
      i > 0 ? h("button", { type: "button", "aria-label": "Move earlier", onclick: () => move(i, -1) }, "↑") : null,
      i < n - 1 ? h("button", { type: "button", "aria-label": "Move later", onclick: () => move(i, 1) }, "↓") : null,
      h("button", { type: "button", class: "danger", onclick: (e) => askDelete(i, e.currentTarget.closest("article")) }, "Delete"));
    return t;
  }

  // 3D models: one <model-viewer> stage and a list to pick from. The viewer script loads only when the section comes near the screen,
  // and each model file only when it is picked. Without the script the stage shows the model's still picture.
  const MODEL_VIEWER = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
  let modelIndex = 0, viewerLoading = false;
  function modelFile(u) { return /^models\/[a-z0-9_\-]+\.glb$/i.test(String(u || "")) ? u : null; }
  function loadViewer() {
    if (viewerLoading || (window.customElements && customElements.get("model-viewer"))) return;
    viewerLoading = true;
    const sc = document.createElement("script"); sc.type = "module"; sc.src = MODEL_VIEWER; document.head.append(sc);
  }
  function models() {
    const m = data.models, items = ((m && m.items) || []).filter(x => modelFile(x.file));
    if (!items.length) return null;
    if (modelIndex >= items.length) modelIndex = 0;
    const s = h("section", { id: "models", "aria-labelledby": "modelsh" }, h("header", {}, eyebrow("cube", ui("modelsEyebrow")), h("h2", { id: "modelsh" }, tx(m, "title") || ""),
      tx(m, "intro") ? h("p", { class: "col" }, tx(m, "intro")) : null));
    // claude.ai artifacts do not serve .glb files, so the private preview there shows each model's still picture instead
    const still3d = !!(window.claude && window.claude.use);
    const poster = h("img", { slot: still3d ? null : "poster", alt: "" });
    const viewer = still3d ? h("div", { class: "still3d" }, poster) : h("model-viewer", { "camera-controls": true, "auto-rotate": true, "auto-rotate-delay": "1500", "rotation-per-second": "18deg", "shadow-intensity": "1",
      "environment-image": "neutral", exposure: "1.05", "touch-action": "pan-y", "interaction-prompt": "none", "camera-orbit": "-30deg 72deg auto", loading: "lazy" }, poster);
    const cap = h("p", { class: "stagecap mono" }), text = h("p", { class: "mvtext" });
    const buttons = items.map((x, i) => h("button", { type: "button", class: "mvpick", "aria-pressed": "false", onclick: () => show(i) },
      coverSrc({ src: x.thumb }) ? h("img", { src: x.thumb, alt: "", loading: "lazy" }) : null,
      h("span", { class: "nm" }, tx(x, "name") || ""), h("span", { class: "pj mono" }, x.project || "")));
    function show(i) {
      modelIndex = i; const x = items[i];
      if (!still3d) { viewer.setAttribute("src", x.file); viewer.setAttribute("alt", ui("modelAlt") + ": " + (tx(x, "name") || "")); }
      else poster.alt = tx(x, "name") || "";
      if (coverSrc({ src: x.thumb })) poster.src = x.thumb;
      cap.textContent = (tx(x, "name") || "") + " · " + (x.project || "");
      text.textContent = tx(x, "text") || "";
      buttons.forEach((b, j) => b.setAttribute("aria-pressed", j === i ? "true" : "false"));
    }
    show(modelIndex);
    s.append(h("div", { class: "mv" },
      h("div", { class: "stage" }, viewer, cap, h("p", { class: "hint mono", "aria-hidden": still3d ? null : "true" }, ui(still3d ? "modelStill" : "modelHint"))),
      h("div", { class: "mvside" }, h("div", { class: "mvlist", role: "group", "aria-label": ui("modelPick") }, buttons), text)));
    if (tx(m, "note")) s.append(h("p", { class: "mvnote" }, tx(m, "note")));
    // start fetching the viewer a screen before the section is reached
    if (still3d) return s;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es.some(e => e.isIntersecting)) { io.disconnect(); loadViewer(); } }, { rootMargin: "600px 0px" });
      io.observe(s);
    } else loadViewer();
    return s;
  }

  // skills and approach: a quote in the owner's own words, skill areas, then working principles (edited in index.html, like experience)
  function approach() {
    const a = data.approach;
    if (!a) return null;
    const s = h("section", { id: "skills", "aria-labelledby": "skillsh" }, h("header", {}, eyebrow("cpu", ui("skillsEyebrow")), h("h2", { id: "skillsh" }, tx(a, "title") || ""),
      tx(a, "intro") ? h("p", { class: "quote" }, tx(a, "intro")) : null));
    // each area's icon is set on the English list; the Swedish list uses the same one by position
    const areas = tx(a, "areas") || [];
    const areaIcon = (x, i) => { const s = ic(x.icon || ((a.areas || [])[i] || {}).icon); return s ? h("span", { class: "badge" }, s) : null; };
    if (areas.length) s.append(h("div", { class: "areas" }, areas.map((x, i) => h("div", {}, h("h3", {}, areaIcon(x, i), x.title || ""), h("p", {}, x.text || "")))));
    const rules = tx(a, "principles") || [];
    if (rules.length) s.append(h("div", { class: "how" }, h("h3", {}, tx(a, "principlesTitle") || ""),
      h("ol", { class: "principles" }, rules.map(x => h("li", {}, h("span", {}, h("b", {}, x.lead || ""), " ", x.text || ""))))));
    return s;
  }

  // experience and education, newest first, as the JSON lists them (edited in index.html; the in-page editor leaves them alone)
  function experience() {
    const items = data.experience || [];
    if (!items.length) return null;
    const s = h("section", { id: "experience", "aria-labelledby": "exph" }, h("header", {}, eyebrow("briefcase", ui("expEyebrow")), h("h2", { id: "exph" }, ui("background"))));
    s.append(h("ol", { class: "cv" }, items.map(x => h("li", {},
      h("span", { class: "when mono" }, tx(x, "when") || ""),
      h("div", {}, h("h3", {}, tx(x, "title") || ""), tx(x, "org") ? h("p", { class: "org" }, tx(x, "org")) : null, tx(x, "detail") ? h("p", { class: "detail" }, tx(x, "detail")) : null)))));
    return s;
  }

  function about() {
    const s = h("section", { id: "about", "aria-labelledby": "abouth" }, h("header", {}, eyebrow("user", ui("about")), h("h2", { id: "abouth" }, tx(data, "aboutTitle") || ui("aboutMe"))));
    const left = h("div", { class: "prose" }, lines(tx(data, "about")).map(t => h("p", {}, t)));
    const right = h("div", {}, h("h3", {}, ui("workWith")), h("ul", { class: "skills" }, (tx(data, "skills") || []).map(x => h("li", {}, x))));
    s.append(h("div", { class: "twocol" }, left, right));
    return s;
  }

  function contact() {
    const s = h("section", { id: "contact", "aria-labelledby": "contacth" }, h("header", {}, eyebrow("mail", ui("contact")), h("h2", { id: "contacth" }, tx(data, "contactTitle") || ui("letsTalk"))));
    const box = h("div", { class: "contact" });
    if (tx(data, "contactNote")) box.append(h("p", { class: "col" }, tx(data, "contactNote")));
    if (data.email) {
      const em = h("span", { class: "email" }, data.email);
      const word = h("span", {}, ui("copy"));
      let glyph = ic("copy");
      const mark = (name) => { const s = ic(name); if (s && glyph) { glyph.replaceWith(s); glyph = s; } };
      const copy = h("button", { class: "btn", type: "button", onclick: async () => {
        try { await navigator.clipboard.writeText(data.email); word.textContent = ui("copied"); mark("check"); }
        catch (err) { const r = document.createRange(); r.selectNodeContents(em); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); word.textContent = ui("selected"); }
        setTimeout(() => { word.textContent = ui("copy"); mark("copy"); }, 2500);
      } }, glyph, word);
      box.append(h("div", { class: "addr" }, em, copy));
    }
    // profile links as buttons, with the site's mark when it is one the icon set knows
    const brand = (u) => /github\.com/i.test(u) ? "github" : /linkedin\.com/i.test(u) ? "linkedin" : "globe";
    const ls = (data.links || []).map(l => { const a = link(l.url, l.label || l.url, "btn"); if (a) a.prepend(ic(brand(l.url)) || ""); return a; }).filter(Boolean);
    if (ls.length) box.append(h("ul", { class: "links" }, ls.map(a => h("li", {}, a))));
    s.append(box);
    return s;
  }

  // ---------- motion (fx.js): live 3D terrain, depth on the title, tilting pictures, content rising into view ----------
  function startFx() {
    const fx = window.PortfolioFX; if (!fx) return;
    const fps = app.querySelector(".hud .fps"), plateEl = app.querySelector(".plate");
    const layers = [[".eyebrow", 4], ["h1", 12], [".lede", 7]].map(([s, d]) => [plateEl.querySelector(s), d]).filter(([el]) => el);
    fx.terrain(document.getElementById("topo"), { layers, onFps: (n) => { if (fps) fps.textContent = n ? n + " fps" : ""; } });
    if (editing) return; // the editor re-renders on every change; keep it still
    fx.reveal(app, "section > header, .feature, .card, .areas > div, .principles li, .cv li, .twocol > div, .contact > *");
    fx.tilt(app, ".pic");
  }

  // ---------- topographic lines (the still fallback when fx.js is not loaded) ----------
  function drawTopo() {
    if (window.PortfolioFX) return;
    const cv = document.getElementById("topo"); if (!cv) return;
    const r = cv.getBoundingClientRect(); const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
    const g = cv.getContext("2d"); g.clearRect(0, 0, cv.width, cv.height);
    const col = getComputedStyle(document.documentElement).getPropertyValue("--rule").trim() || "#c9d2cf";
    const W = 120, H = Math.max(30, Math.round(120 * cv.height / cv.width)); const f = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const u = x / W * 6, v = y / H * 6 * H / W;
      f[y * W + x] = Math.sin(u * 1.1 + Math.cos(v * .9)) + .6 * Math.cos(v * 1.7 - u * .5) + .35 * Math.sin((u + v) * 2.3) + u * .18;
    }
    g.strokeStyle = col; g.lineWidth = dpr; const sx = cv.width / (W - 1), sy = cv.height / (H - 1);
    for (let lv = -2; lv <= 3; lv += .2) {
      g.beginPath();
      for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
        const a = f[y * W + x], b = f[y * W + x + 1], c = f[(y + 1) * W + x + 1], d = f[(y + 1) * W + x]; const pts = [];
        const e = (p, q, x0, y0, x1, y1) => { if ((p < lv) !== (q < lv)) { const t = (lv - p) / (q - p); pts.push([(x0 + (x1 - x0) * t) * sx, (y0 + (y1 - y0) * t) * sy]); } };
        e(a, b, x, y, x + 1, y); e(b, c, x + 1, y, x + 1, y + 1); e(c, d, x + 1, y + 1, x, y + 1); e(d, a, x, y + 1, x, y);
        if (pts.length >= 2) { g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); }
      }
      g.stroke();
    }
  }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawTopo, 150); });
  try { matchMedia("(prefers-color-scheme: dark)").addEventListener("change", drawTopo); } catch (e) {}
  new MutationObserver(drawTopo).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- editing ----------
  function change(mutator) {
    mutator(); dirty = JSON.stringify(data) !== JSON.stringify(saved);
    try { if (dirty) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); else sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
    render();
  }
  function move(i, d) { change(() => { const a = data.projects; const [p] = a.splice(i, 1); a.splice(i + d, 0, p); }); }
  function askDelete(i, article) {
    const p = data.projects[i];
    const bar = h("div", { class: "confirm", role: "alert" }, h("span", {}, "Delete “" + (p.title || "Untitled") + "”?"),
      h("button", { class: "tbtn", type: "button", onclick: () => change(() => data.projects.splice(i, 1)) }, "Delete"),
      h("button", { class: "tbtn", type: "button", onclick: () => bar.remove() }, "Keep"));
    article.append(bar); bar.querySelector("button").focus();
  }

  function editbar() {
    const state = h("span", { class: "state" + (dirty ? " dirty" : ""), "aria-live": "polite" }, (dirty ? "Unsaved changes" : "Editing: only you see these controls") + (lang === "sv" ? " · Swedish text" : " · English text"));
    return h("div", { class: "editbar", role: "toolbar", "aria-label": "Edit site" }, state,
      h("button", { class: "btn", type: "button", onclick: () => projectDialog(-1) }, "Add project"),
      h("button", { class: "btn", type: "button", onclick: () => profileDialog() }, "Profile"),
      dirty ? h("button", { class: "btn", type: "button", onclick: () => change(() => { data = clone(saved); }) }, "Discard") : null,
      h("button", { class: "btn solid", type: "button", disabled: !dirty || null, onclick: publish }, "Save & publish"),
      h("button", { class: "btn", type: "button", onclick: () => { editing = false; render(); } }, "Preview"));
  }
  // a line for the dialogs while the Swedish version is shown
  function langNote() { return lang === "sv" ? h("p", { class: "hint" }, "You are editing the Swedish text. Empty fields show the English text. Switch to EN in the menu to edit English.") : null; }
  function editToggle() {
    return h("div", { class: "editbar" }, h("button", { class: "btn solid", type: "button", onclick: (e) => { editing = true; e.currentTarget.parentElement.remove(); render(); } }, dirty ? "Edit site (unsaved changes)" : "Edit site"));
  }

  function field(id, label, value, opts = {}) {
    const input = opts.area ? h("textarea", { id, name: id, rows: opts.rows || 4 }) : h("input", { id, name: id, type: opts.type || "text", placeholder: opts.placeholder || null });
    input.value = value || "";
    return h("div", { class: "field" }, h("label", { for: id }, label), input, opts.hint ? h("span", { class: "hint" }, opts.hint) : null);
  }
  function openDialog(build) {
    const d = h("dialog", { "aria-modal": "true" }); const form = h("form", { method: "dialog" });
    build(form, () => d.close()); d.append(form); document.body.append(d);
    d.addEventListener("close", () => d.remove()); d.showModal();
    const first = form.querySelector("input, textarea"); if (first) first.focus();
  }

  function projectDialog(i) {
    const p = i >= 0 ? clone(data.projects[i]) : { title: "", year: String(new Date().getFullYear()), role: "", summary: "", tags: [], link: "", linkLabel: "", cover: null, coverAlt: "", featured: false };
    openDialog((form, close) => {
      form.append(h("h2", {}, i >= 0 ? "Edit project" : "Add a project"), langNote());
      form.append(field("p-title", "Title", p.title));
      form.append(h("div", { class: "row2" }, field("p-year", "Year", p.year), field("p-role", "Your role", own(p, "role"), { placeholder: p.role || "Game design, level design" })));
      form.append(field("p-summary", "Short description", own(p, "summary"), { area: true, rows: 3 }));
      form.append(field("p-tags", "Tools and topics", (own(p, "tags") || []).join(", "), { hint: "Separate with commas: Unreal Engine 5, Blender, Level design" }));
      form.append(h("div", { class: "row2" }, field("p-link", "Link", p.link, { placeholder: "https://… or sundmark.html", hint: "A web page, a video, a store page, or a page of this site." }), field("p-linklabel", "Link text", own(p, "linkLabel"), { placeholder: p.linkLabel || "Watch the trailer" })));
      form.append(h("div", { class: "row2" }, field("p-demo", "Demo link", p.demo, { placeholder: "media.html#castledefence", hint: "Where the footage is, often a part of the demo page." }), field("p-demolabel", "Demo link text", own(p, "demoLabel"), { placeholder: p.demoLabel || "Watch gameplay" })));
      // cover image
      const prev = h("div", { class: "prev" }); const src = coverSrc(p.cover); if (src) prev.append(h("img", { src, alt: "" }));
      const status = h("span", { class: "hint", "aria-live": "polite" }, assetsNs ? "JPG, PNG or WebP, up to 20 MB. A wide 16:9 image looks best." : "Image upload is not available in this view.");
      const fileIn = h("input", { id: "p-file", type: "file", accept: "image/jpeg,image/png,image/webp", disabled: !assetsNs || null });
      fileIn.addEventListener("change", async () => {
        const f = fileIn.files && fileIn.files[0]; if (!f) return;
        status.textContent = "Uploading…";
        try {
          const r = await assetsNs.upload(f, { type: f.type || "image/jpeg" });
          p.cover = { asset: r.id }; prev.replaceChildren(h("img", { src: r.url, alt: "" })); status.textContent = "Uploaded.";
        } catch (e) {
          status.textContent = e && e.code === "too_large" ? "The image is over 20 MB. Choose a smaller one." :
            e && e.code === "unsupported_type" ? "Use a JPG, PNG or WebP image." :
            e && (e.code === "not_granted" || e.code === "capability_disabled") ? "Image upload is not available in this view." : "The upload failed. Try again in a moment.";
        }
      });
      form.append(h("div", { class: "field" }, h("label", { for: "p-file" }, "Cover image"), h("div", { class: "cover" }, prev, h("div", { class: "field" }, fileIn, status))));
      form.append(field("p-alt", "Image description", own(p, "coverAlt"), { hint: "One line for screen readers: what the image shows." }));
      const feat = h("input", { id: "p-featured", type: "checkbox" }); feat.checked = !!p.featured;
      form.append(h("div", { class: "check" }, feat, h("label", { for: "p-featured" }, "Feature this project at the top")));
      const err = h("p", { class: "hint", role: "alert" });
      form.append(err);
      form.append(h("div", { class: "dlg-actions" },
        h("button", { class: "btn", type: "button", onclick: close }, "Cancel"),
        h("button", { class: "btn solid", type: "submit" }, i >= 0 ? "Apply" : "Add project")));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (id) => form.querySelector("#" + id).value.trim();
        if (!v("p-title")) { err.textContent = "Give the project a title."; return; }
        if (v("p-link") && !safeHref(v("p-link"))) { err.textContent = "The link must start with https:// or name a page of this site."; return; }
        if (v("p-demo") && !safeHref(v("p-demo"))) { err.textContent = "The demo link must start with https:// or name a page of this site."; return; }
        const out = Object.assign(p, { title: v("p-title"), year: v("p-year"), link: v("p-link"), demo: v("p-demo"), featured: feat.checked });
        put(out, "role", v("p-role")); put(out, "summary", v("p-summary")); put(out, "linkLabel", v("p-linklabel")); put(out, "demoLabel", v("p-demolabel")); put(out, "coverAlt", v("p-alt"));
        put(out, "tags", v("p-tags").split(",").map(t => t.trim()).filter(Boolean).slice(0, 12));
        close();
        change(() => {
          if (out.featured) data.projects.forEach(q => { q.featured = false; });
          if (i >= 0) data.projects[i] = out; else data.projects.push(out);
        });
      });
    });
  }

  function profileDialog() {
    openDialog((form, close) => {
      form.append(h("h2", {}, "Profile and contact"), langNote());
      form.append(h("div", { class: "row2" }, field("f-name", "Name", data.name), field("f-headline", "Headline", own(data, "headline"), { placeholder: data.headline || "Game designer · World builder" })));
      form.append(field("f-intro", "Introduction", own(data, "intro"), { area: true, rows: 3 }));
      form.append(field("f-facts", "Short facts", (own(data, "facts") || []).join(" | "), { hint: "Separate with |, e.g. Based in Sweden | Unreal Engine 5" }));
      form.append(field("f-about", "About you", own(data, "about"), { area: true, rows: 6, hint: "Leave an empty line between paragraphs." }));
      form.append(field("f-skills", "What you work with", (own(data, "skills") || []).join(", "), { hint: "Separate with commas." }));
      form.append(h("div", { class: "row2" }, field("f-email", "Email", data.email, { type: "email" }), field("f-note", "Contact line", own(data, "contactNote"))));
      form.append(field("f-links", "Links", (data.links || []).map(l => l.label + " | " + l.url).join("\n"), { area: true, rows: 3, hint: "One per line: Label | https://…  (LinkedIn, ArtStation, itch.io, YouTube)" }));
      const err = h("p", { class: "hint", role: "alert" }); form.append(err);
      form.append(h("div", { class: "dlg-actions" }, h("button", { class: "btn", type: "button", onclick: close }, "Cancel"), h("button", { class: "btn solid", type: "submit" }, "Apply")));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (id) => form.querySelector("#" + id).value.trim();
        const links = v("f-links").split("\n").map(s => s.trim()).filter(Boolean).map(s => { const [a, b] = s.includes("|") ? s.split("|") : [s, s]; return { label: a.trim(), url: (b || a).trim() }; });
        const bad = links.find(l => !safeHref(l.url));
        if (bad) { err.textContent = "This link must start with https://: " + bad.url; return; }
        if (!v("f-name")) { err.textContent = "Your name is needed."; return; }
        close();
        change(() => {
          Object.assign(data, { name: v("f-name"), email: v("f-email"), links });
          put(data, "headline", v("f-headline")); put(data, "intro", v("f-intro")); put(data, "facts", v("f-facts").split("|").map(s => s.trim()).filter(Boolean));
          put(data, "about", form.querySelector("#f-about").value.trim()); put(data, "skills", v("f-skills").split(",").map(s => s.trim()).filter(Boolean)); put(data, "contactNote", v("f-note"));
        });
      });
    });
  }

  function toast(msg) { const t = h("div", { class: "toast", role: "status" }, msg); document.body.append(t); setTimeout(() => t.remove(), 5000); }

  // The published page is this same shell with the new JSON (index.html as Claude wrote it; site.css and app.js stay).
  const RESET = ":root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}";
  function shell(d) {
    const json = JSON.stringify(d, null, 1).replace(/</g, "\\u003c");
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    return "<!doctype html><html><head><meta charset=utf8><meta name=viewport content=\"width=device-width,initial-scale=1,viewport-fit=cover\"><style>" + RESET + "</style></head><body>" +
      "<title>" + esc((d.name || "Portfolio") + " Portfolio") + "</title>\n" +
      "<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n" +
      "<link rel=\"icon\" href=\"favicon.svg\" type=\"image/svg+xml\">\n" +
      "<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap\">\n" +
      "<link rel=\"stylesheet\" href=\"site.css\">\n" +
      "<script type=\"application/json\" id=\"site-data\">" + json + "</script>\n" +
      "<div id=\"app\"></div>\n<script src=\"ui.js\"></script>\n<script src=\"fx.js\"></script>\n<script src=\"app.js\"></script>\n</body></html>";
  }
  async function publish() {
    if (!artifactNs) { toast("Saving is not available in this view."); return; }
    toast("Publishing…");
    try {
      try { sessionStorage.removeItem(DRAFT_KEY); } catch (e) {}
      await artifactNs.publish(shell(data));
    } catch (e) {
      try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch (x) {}
      const c = e && e.code;
      if (c === "conflict") toast("A newer version was saved elsewhere. The page reloads to it; your changes are kept for this session.");
      else if (c === "not_writer" || c === "not_granted" || c === "consent_required" || c === "capability_disabled") { toast("This view is read-only, so nothing was saved."); editing = false; canEdit = false; render(); }
      else if (c === "too_large") toast("The page is too large to save. Remove some text.");
      else if (c === "rate_limited") toast("Saved too often. Wait a minute and try again.");
      else toast("Saving failed. Try again in a moment.");
    }
  }

  // ---------- start ----------
  render();
  const use = window.claude && window.claude.use ? window.claude.use.bind(window.claude) : null;
  if (use) {
    Promise.all([use("user"), use("artifact"), use("assets")]).then(async ([user, art, assets]) => {
      artifactNs = art; assetsNs = assets;
      canEdit = !!(user && art && await user.canEdit());
      if (!canEdit) return;
      try { const d = sessionStorage.getItem(DRAFT_KEY); if (d) { data = JSON.parse(d); dirty = JSON.stringify(data) !== JSON.stringify(saved); } } catch (e) {}
      if (dirty) { editing = true; render(); toast("Your unsaved changes from this session are back."); }
      else render();
    }).catch(() => {});
  }
})();
