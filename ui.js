/* Shared interface pieces for all portfolio pages: a small line-icon set (with the British and Swedish flags for the language switch)
   and a back-to-top button. Static pages write <i data-icon="name"></i> where an icon goes; this file fills them in when it loads.
   app.js asks for icons through PortfolioUI.icon(name). Without this file the pages still work, only without icons. */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  // 24 × 24 line icons, drawn with the current text colour
  const LINE = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    cube: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 7.5h4M3 12h18M3 16.5h4M17 7.5h4M17 16.5h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "arrow-up": '<path d="M12 19V5M6 11l6-6 6 6"/>',
    external: '<path d="M7 17 17 7M8 7h9v9"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    star: '<path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9Z"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2ZM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    gamepad: '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01"/>',
    map: '<path d="M14.1 5.9 9 3.5 3.6 5.4A1 1 0 0 0 3 6.3v13.2a.5.5 0 0 0 .7.5L9 18l6 2.5 5.4-1.9a1 1 0 0 0 .6-.9V4.5a.5.5 0 0 0-.7-.5L15 6Z"/><path d="M9 3.5V18M15 6v14.5"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4M8 4h8M2 14h2M20 14h2M9 13v2M15 13v2"/>',
    chip: '<path d="M6 3v3M12 3v3M18 3v3M6 18v3M12 18v3M18 18v3M3 6h3M3 12h3M3 18h3M18 6h3M18 12h3M18 18h3"/><rect x="6" y="6" width="12" height="12" rx="1.5"/>',
    video: '<path d="m16 13 5.2 3.5a.5.5 0 0 0 .8-.4V7.9a.5.5 0 0 0-.8-.4L16 11"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    flag: '<path d="M4 22V4M4 4h13l-2 4 2 4H4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
  };
  // filled marks
  const SOLID = {
    play: '<path d="M7 4.6v14.8a1 1 0 0 0 1.53.85l11.6-7.4a1 1 0 0 0 0-1.7L8.53 3.75A1 1 0 0 0 7 4.6Z"/>',
    github: '<path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.01-2.04c-3.34.72-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3"/>',
    linkedin: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z"/>'
  };
  let uid = 0;
  const FLAGS = {
    "flag-se": () => '<rect width="24" height="16" fill="#006aa7"/><rect x="7.5" width="3" height="16" fill="#fecc00"/><rect y="6.5" width="24" height="3" fill="#fecc00"/>',
    "flag-gb": () => {
      const c = "ukx" + (++uid);
      return '<svg viewBox="0 0 60 30" width="24" height="16" preserveAspectRatio="xMidYMid slice"><clipPath id="' + c + '"><path d="M30 15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath>' +
        '<rect width="60" height="30" fill="#012169"/><path d="M0 0l60 30M60 0 0 30" stroke="#fff" stroke-width="6"/>' +
        '<path d="M0 0l60 30M60 0 0 30" stroke="#c8102e" stroke-width="4" clip-path="url(#' + c + ')"/>' +
        '<path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6"/></svg>';
    }
  };

  function icon(name) {
    let svg;
    if (FLAGS[name]) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 16"); svg.setAttribute("class", "flag");
      svg.innerHTML = FLAGS[name]();
    } else if (LINE[name] || SOLID[name]) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 24 24"); svg.setAttribute("class", "ic");
      if (LINE[name]) { svg.setAttribute("fill", "none"); svg.setAttribute("stroke", "currentColor"); svg.setAttribute("stroke-width", "1.8"); svg.setAttribute("stroke-linecap", "round"); svg.setAttribute("stroke-linejoin", "round"); svg.innerHTML = LINE[name]; }
      else { svg.setAttribute("fill", "currentColor"); svg.innerHTML = SOLID[name]; }
    } else return null;
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
    return svg;
  }
  // <i data-icon="name"></i> placeholders in the static pages
  function fill(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach((el) => { const s = icon(el.dataset.icon); if (s) el.replaceWith(s); });
  }

  // a round button that appears after a screen and a half of scrolling and takes the reader back to the top
  function topButton() {
    if (document.querySelector(".totop")) return;
    const b = document.createElement("button");
    b.type = "button"; b.className = "totop";
    b.append(icon("arrow-up"));
    const label = () => b.setAttribute("aria-label", /^sv/i.test(document.documentElement.lang) ? "Till toppen" : "Back to top");
    b.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); });
    // hidden with visibility in site.css, so it is out of the tab order until it shows
    let shown = false;
    const check = () => { const on = scrollY > innerHeight * 1.5; if (on !== shown) { shown = on; label(); b.classList.toggle("show", on); } };
    label();
    addEventListener("scroll", check, { passive: true }); check();
    document.body.append(b);
  }

  fill(document);
  if (document.body) topButton(); else document.addEventListener("DOMContentLoaded", topButton);
  window.PortfolioUI = { icon, fill };
})();
