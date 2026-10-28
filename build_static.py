"""Builds Portfolio/dist/, the static copy of the portfolio for normal web hosting (Cloudflare Pages: portfolio.amastack.com).

  python Portfolio/build_static.py

index.html here is the page as the claude.ai artifact stores it (no <!doctype>/<head>; the artifact adds them). dist/ gets complete
documents plus site.css, app.js, sundmark.html and img/. Content lives in the JSON block "site-data" in index.html: edit it, rebuild,
upload dist/ again. On a normal host app.js finds no window.claude, so the page is read-only and the owner editor stays hidden.
"""
import os
import re
import shutil

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "dist")
SITE = "https://portfolio.amastack.com"
# the text search engines and link previews (LinkedIn, Messenger, Slack) show for the home page
DESCRIPTION = ("Linus Virebrand, software engineering student: games in C++ and Unreal Engine 5, "
               "procedural worlds, full-stack web apps and AI developer tools.")

if os.path.exists(DIST):
    shutil.rmtree(DIST)
os.makedirs(DIST)
body = open(os.path.join(HERE, "index.html"), encoding="utf-8").read()
title = re.search(r"<title>.*?</title>", body, re.S).group(0)
body = body.replace(title, "", 1)
page = ("<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n"
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n" + title + "\n"
        "<meta name=\"description\" content=\"" + DESCRIPTION + "\">\n"
        "<meta property=\"og:type\" content=\"website\">\n"
        "<meta property=\"og:title\" content=\"Linus Virebrand Portfolio\">\n"
        "<meta property=\"og:description\" content=\"" + DESCRIPTION + "\">\n"
        "<meta property=\"og:url\" content=\"" + SITE + "/\">\n"
        "<meta property=\"og:image\" content=\"" + SITE + "/img/map_v3_kv_low.jpg\">\n"
        "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
        "<link rel=\"alternate\" hreflang=\"en\" href=\"" + SITE + "/?lang=en\">\n"
        "<link rel=\"alternate\" hreflang=\"sv\" href=\"" + SITE + "/?lang=sv\">\n"
        "<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}"
        "img{max-width:100%}[hidden]{display:none!important}</style>\n</head>\n<body>\n" + body + "</body>\n</html>\n")
open(os.path.join(DIST, "index.html"), "w", encoding="utf-8").write(page)
for name in ("site.css", "app.js", "fx.js", "favicon.svg", "404.html", "sundmark.html", "media.html", "sundmark.sv.html", "media.sv.html"):
    shutil.copy(os.path.join(HERE, name), DIST)
shutil.copytree(os.path.join(HERE, "img"), os.path.join(DIST, "img"))
# the 3D models shown by the viewer on the home page (web GLB, one file per model)
if os.path.isdir(os.path.join(HERE, "models")):
    shutil.copytree(os.path.join(HERE, "models"), os.path.join(DIST, "models"))
media_dir = os.path.join(HERE, "media")
if os.path.isdir(media_dir):
    os.makedirs(os.path.join(DIST, "media"), exist_ok=True)
    for name in os.listdir(media_dir):
        if name.endswith(".mp4"):
            shutil.copy(os.path.join(media_dir, name), os.path.join(DIST, "media", name))
# for search engines: every page in both languages; the 404 page stays out
pages = ["/", "/?lang=sv", "/sundmark.html", "/sundmark.sv.html", "/media.html", "/media.sv.html"]
open(os.path.join(DIST, "sitemap.xml"), "w", encoding="utf-8").write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join("  <url><loc>" + SITE + p + "</loc></url>\n" for p in pages) + "</urlset>\n")
open(os.path.join(DIST, "robots.txt"), "w", encoding="utf-8").write("User-agent: *\nAllow: /\nSitemap: " + SITE + "/sitemap.xml\n")
print("built", DIST, sum(len(f) for _, _, f in os.walk(DIST)), "files")
