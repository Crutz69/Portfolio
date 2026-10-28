"""Build screenshot walkthroughs and a static media gallery from real captures."""
from pathlib import Path
import html
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
MEDIA = ROOT / "media"
MEDIA.mkdir(exist_ok=True)
FFMPEG = shutil.which("ffmpeg")

PROJECTS = [
    ("sundmark", "Sundmark World Builder", "Screenshot walkthrough", [
        ("plan_region_map.jpg", "Region plan for the generated world"),
        ("map_v3_kv_low.jpg", "Kvarnvik rooftops and surrounding terrain"),
        ("map_v2_bjork_air.jpg", "Aerial view of a generated settlement")]),
    ("facility", "Gameplay Test Facility", "Screenshot walkthrough", [
        ("fac_hub.jpg", "The central test facility hub"),
        ("fac_range.jpg", "The shooting test room"),
        ("fac_workshop.jpg", "The workshop test room")]),
    ("landmarks", "Kvarnvik Landmarks", "Screenshot walkthrough", [
        ("map_m_aerial.jpg", "Aerial view of the monastery"),
        ("map_m_gate.jpg", "The monastery entrance"),
        ("map_c_aerial.jpg", "Aerial view of the cemetery")]),
    ("chaos-crown", "Chaos Crown", "Prototype screenshots", [
        ("chaos-crown-gameplay.png", "Physics-driven RTS units during combat"),
        ("chaos-crown-formation.png", "Two opposing armies in the stress arena")]),
    ("castledefence", "CastleDefence / Emberfall: Factions", "Recorded gameplay", [
        ("castledefence-gameplay.png", "Army recruitment and combat in the browser game"),
        ("castledefence-battle.png", "The battlefield during a campaign stage"),
        ("castledefence-menu.png", "The game start screen")]),
]


def slideshow(slug, images):
    output = MEDIA / (slug + "-walkthrough.mp4")
    if output.exists():
        return
    args = [FFMPEG, "-y", "-hide_banner", "-loglevel", "error"]
    for filename, _ in images:
        args += ["-loop", "1", "-t", "4", "-i", str(ROOT / "img" / filename)]
    filters = []
    for i in range(len(images)):
        filters.append(f"[{i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=25[v{i}]")
    filters.append("".join(f"[v{i}]" for i in range(len(images))) + f"concat=n={len(images)}:v=1:a=0[out]")
    args += ["-filter_complex", ";".join(filters), "-map", "[out]", "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)]
    subprocess.run(args, check=True)


sections = []
for slug, title, kind, images in PROJECTS:
    for filename, _ in images:
        if not (ROOT / "img" / filename).is_file():
            raise FileNotFoundError(filename)
    is_slideshow = kind == "Screenshot walkthrough"
    if is_slideshow:
        slideshow(slug, images)
    video = f"media/{slug}-{'walkthrough' if is_slideshow else 'gameplay'}.mp4"
    has_video = kind != "Prototype screenshots"
    if has_video and not (ROOT / video).is_file():
        raise FileNotFoundError(video)
    figures = "".join(f'<figure><a href="img/{filename}"><img src="img/{filename}" alt="{html.escape(caption)}" loading="lazy"></a><figcaption>{html.escape(caption)}</figcaption></figure>' for filename, caption in images)
    note = "An edited sequence of existing screenshots, not live gameplay footage." if is_slideshow else (
        "Prototype stress-arena combat. Simple placeholder characters and environment assets are used." if slug == "chaos-crown" else "A browser gameplay recording showing recruitment, combat and camera controls.")
    player = f'<video controls playsinline preload="none" poster="img/{images[0][0]}"><source src="{video}" type="video/mp4"></video><p><a href="{video}" download>Download MP4</a></p>' if has_video else ''
    sections.append(f'<section id="{slug}"><h2>{html.escape(title)}</h2><p class="kind">{kind}</p><p>{note}</p>{player}<div class="gallery">{figures}</div></section>')

page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Project Media | Linus Virebrand</title><link rel="stylesheet" href="site.css">
<style>body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body)}main{max-width:1120px;margin:auto;padding:32px 24px}nav{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:32px}h1{font-size:36px}h2{font-size:26px}a{color:var(--accent)}section{padding:32px 0;border-top:1px solid var(--rule)}video{display:block;width:100%;aspect-ratio:16/9;background:#111;object-fit:contain}.kind{font-weight:600}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}figure{margin:0}figure img{display:block;width:100%;aspect-ratio:16/9;object-fit:contain;background:#111}figcaption{padding-top:8px;font-size:14px;line-height:1.5}p{max-width:72ch;line-height:1.6}</style>
</head><body><main><nav><a href="index.html">Portfolio</a><a href="#sundmark">Sundmark</a><a href="#facility">Test facility</a><a href="#landmarks">Landmarks</a><a href="#chaos-crown">Chaos Crown</a><a href="#castledefence">CastleDefence</a></nav>
<h1>Project Media</h1><p>Gameplay recordings and screenshots from five projects. The Sundmark, facility and landmark videos are screenshot walkthroughs.</p>
''' + "\n".join(sections) + '</main></body></html>\n'
(ROOT / "media.html").write_text(page, encoding="utf-8")
print("Built media.html and three screenshot walkthroughs.")
