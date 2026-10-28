"""Builds the Sundmark trailer from the site's own Unreal Engine stills: slow camera moves, title cards and captions.

  python build_trailer.py          writes img/trailer-poster.jpg, media/trailer-en.mp4 and media/trailer-sv.mp4
  python build_trailer.py poster   only the poster (also: en or sv for one language)

It is a sequence of stills, not recorded gameplay, and says so on screen and on the demos page. Needs Pillow and ffmpeg.
Fonts: Bahnschrift and Consolas from Windows.
"""
import os
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS, FADE = 1600, 672, 30, 0.5          # 2.39:1, the stills are 1600 x 700, so nothing is upscaled
INK, PAPER, GRID, ACCENT, MARK, SOFT = (15, 22, 21), (227, 235, 232), (32, 44, 42), (108, 194, 170), (224, 149, 79), (159, 176, 171)
FONTS = "C:/Windows/Fonts/"


def font(name, size, variation=None):
    f = ImageFont.truetype(FONTS + name, size)
    if variation:
        try:
            f.set_variation_by_name(variation)
        except Exception:
            pass
    return f


DISPLAY = lambda s: font("bahnschrift.ttf", s, "Bold Condensed")
DISPLAY_LIGHT = lambda s: font("bahnschrift.ttf", s, "SemiLight Condensed")
MONO = lambda s: font("consola.ttf", s)

# shot: ("still", image, caption tag, caption text, seconds, (start box), (end box)) with boxes as fractions of the image
# card: ("card", kind, texts, seconds)
TEXT = {
    "en": {
        "label": "SEQUENCE OF STILLS · UNREAL ENGINE 5.8",
        "title": ("LINUS VIREBRAND · PORTFOLIO", "SUNDMARK", "A procedural world for a survival RPG · Unreal Engine 5.8"),
        "shots": [
            ("01  THE BRIEF", "Towns, roads, rivers and a catastrophe, written as data"),
            ("02  GENERATED", "Terrain, rivers and road graph in about 8 minutes"),
            ("03  KVARNVIK", "The market town, built from licensed city kits"),
            ("04  STREET LEVEL", "Kerbs, pavements and street lamps only inside town"),
            ("05  THE MONASTERY", "Laid out by one script from the lot it is given"),
            ("06  BACKPARKEN", "The cemetery park: chapel, avenue and grave quarters"),
            ("07  BJÖRKBACKA", "Farms on their own pads, fields with stone walls"),
            ("08  THE DEMO", "A 2.5 km square cut from the region, playable"),
        ],
        "numbers": ("8 × 8 km", "531 598 trees, bushes and rocks  ·  733 505 kit parts  ·  833 wooden houses"),
        "facility": ("THE TEST FACILITY", "Eleven rooms, one for each gameplay system"),
        "rooms": [
            ("HUB", "A booth and a teleport pad for every room"),
            ("1.3  HACKING", "A signal lock built in C++"),
            ("1.4  PIPE WORKS", "Gas and fire until the valve is shut"),
            ("1.6  DARK ROOM", "Stealth with a light meter"),
            ("1.7  SHOOTING RANGE", "Lanes at 10, 25 and 50 m"),
            ("1.10  WORKSHOP", "Settlers use what the player builds"),
        ],
        "end": ("SUNDMARK WORLD BUILDER", "Linus Virebrand  ·  portfolio.amastack.com",
                "Sequence of stills captured in Unreal Engine 5.8  ·  Art from licensed packs"),
    },
    "sv": {
        "label": "SEKVENS AV STILLBILDER · UNREAL ENGINE 5.8",
        "title": ("LINUS VIREBRAND · PORTFOLIO", "SUNDMARK", "En procedurell värld för ett överlevnads-RPG · Unreal Engine 5.8"),
        "shots": [
            ("01  BRIEFEN", "Städer, vägar, floder och en katastrof, skrivna som data"),
            ("02  GENERERAT", "Terräng, floder och vägnät på ungefär 8 minuter"),
            ("03  KVARNVIK", "Marknadsstaden, byggd av licensierade stadsbyggsatser"),
            ("04  GATUNIVÅ", "Kantsten, trottoarer och gatlyktor bara inne i stan"),
            ("05  KLOSTRET", "Utlagt av ett enda skript utifrån tomten det får"),
            ("06  BACKPARKEN", "Kyrkogårdsparken: kapell, allé och gravkvarter"),
            ("07  BJÖRKBACKA", "Gårdar på egna plattor, åkrar med stenmurar"),
            ("08  DEMOT", "En kvadrat på 2,5 km skuren ur regionen, spelbar"),
        ],
        "numbers": ("8 × 8 km", "531 598 träd, buskar och stenar  ·  733 505 byggsatsdelar  ·  833 trähus"),
        "facility": ("TESTANLÄGGNINGEN", "Elva rum, ett för varje gameplaysystem"),
        "rooms": [
            ("HALLEN", "En monter och en teleportplatta för varje rum"),
            ("1.3  HACKNING", "Ett signallås byggt i C++"),
            ("1.4  RÖRVERKET", "Gas och eld tills ventilen stängs"),
            ("1.6  MÖRKA RUMMET", "Smygande med ljusmätare"),
            ("1.7  SKJUTBANAN", "Banor på 10, 25 och 50 m"),
            ("1.10  VERKSTADEN", "Nybyggarna använder det spelaren bygger"),
        ],
        "end": ("SUNDMARK WORLD BUILDER", "Linus Virebrand  ·  portfolio.amastack.com",
                "Sekvens av stillbilder från Unreal Engine 5.8  ·  Grafik från licensierade paket"),
    },
}

# image, seconds, start box, end box (x0, y0, x1, y1 as fractions); the map plates are square, so the box scans across them
WORLD = [
    ("plan_design_map.jpg", 3.4, (0.00, 0.10, 1.00, 0.52), (0.04, 0.42, 0.96, 0.82)),
    ("plan_preview.jpg", 3.2, (0.05, 0.50, 1.00, 0.90), (0.00, 0.20, 0.95, 0.60)),
    ("map_v3_kv_low.jpg", 3.8, (0.00, 0.00, 1.00, 0.96), (0.08, 0.06, 0.92, 0.86)),
    ("map_n_miller_low.jpg", 3.2, (0.06, 0.04, 0.94, 0.88), (0.00, 0.00, 1.00, 0.96)),
    ("map_m_aerial.jpg", 3.6, (0.00, 0.02, 1.00, 0.98), (0.10, 0.12, 0.90, 0.90)),
    ("map_c_gate.jpg", 3.2, (0.10, 0.04, 0.95, 0.86), (0.02, 0.02, 0.98, 0.96)),
    ("map_v2_bjork_air.jpg", 3.2, (0.00, 0.00, 0.90, 0.86), (0.10, 0.10, 1.00, 0.96)),
    ("map_d1_over2.jpg", 3.8, (0.12, 0.10, 0.88, 0.84), (0.00, 0.00, 1.00, 0.96)),
]
FACILITY = [
    ("fac_hub.jpg", 3.4, (0.00, 0.00, 1.00, 0.96), (0.10, 0.08, 0.90, 0.86)),
    ("fac_hack.jpg", 2.8, (0.06, 0.04, 0.94, 0.90), (0.00, 0.00, 1.00, 0.97)),
    ("fac_fire.jpg", 2.8, (0.00, 0.00, 1.00, 0.97), (0.08, 0.08, 0.92, 0.89)),
    ("fac_dark.jpg", 2.8, (0.10, 0.06, 0.92, 0.88), (0.00, 0.00, 1.00, 0.96)),
    ("fac_range.jpg", 2.8, (0.00, 0.00, 1.00, 0.96), (0.08, 0.06, 0.92, 0.86)),
    ("fac_workshop.jpg", 3.0, (0.04, 0.10, 0.96, 0.96), (0.00, 0.00, 1.00, 0.96)),
]


def ease(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def fit_box(img, box):
    """A box of the frame's aspect ratio around the fractional box, kept inside the image."""
    iw, ih = img.size
    x0, y0, x1, y1 = box[0] * iw, box[1] * ih, box[2] * iw, box[3] * ih
    cx, cy, bw = (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0
    bh = bw * H / W
    if bh > ih:
        bh = ih; bw = bh * W / H
    if bw > iw:
        bw = iw; bh = bw * H / W
    cx = min(max(cx, bw / 2), iw - bw / 2); cy = min(max(cy, bh / 2), ih - bh / 2)
    return cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2


def vignette():
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    steps = 60
    for i in range(steps):  # concentric ellipses, brighter toward the middle
        k = i / steps
        d.ellipse((-W * .25 + k * W * .3, -H * .45 + k * H * .5, W * 1.25 - k * W * .3, H * 1.45 - k * H * .5), fill=int(150 + 105 * k))
    return Image.merge("RGB", (m, m, m))


def text_layer(lines, outline=0):
    """lines: (text, font, colour, (x, y), anchor). Returns an RGBA layer; outline gives small text a dark edge on bright stills."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for text, f, col, xy, anchor in lines:
        d.text(xy, text, font=f, fill=col + (255,), anchor=anchor, stroke_width=outline, stroke_fill=(0, 0, 0, 200))
    return layer


def caption_layer(tag, text):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # a soft dark band under the caption so it reads on bright stills
    band = Image.new("L", (W, 200), 0)
    bd = ImageDraw.Draw(band)
    for y in range(200):
        bd.line((0, y, W, y), fill=int(220 * (y / 200) ** 1.4))
    layer.paste((0, 0, 0, 255), (0, H - 200), band)
    d = ImageDraw.Draw(layer)
    d.text((64, H - 94), tag, font=font("consolab.ttf", 24), fill=MARK + (255,), anchor="ls", stroke_width=2, stroke_fill=(0, 0, 0, 210))
    d.text((62, H - 46), text, font=DISPLAY_LIGHT(40), fill=PAPER + (255,), anchor="ls", stroke_width=1, stroke_fill=(0, 0, 0, 160))
    return layer


def card_background():
    bg = Image.new("RGB", (W, H), INK)
    d = ImageDraw.Draw(bg)
    for x in range(0, W, 48):
        d.line((x, 0, x, H), fill=GRID)
    for y in range(0, H, 48):
        d.line((0, y, W, y), fill=GRID)
    return bg


def with_alpha(layer, k):
    if k >= 1:
        return layer
    a = layer.getchannel("A").point(lambda v: int(v * k))
    out = layer.copy(); out.putalpha(a)
    return out


def build(lang, out_path):
    T = TEXT[lang]
    label = text_layer([(T["label"], font("consolab.ttf", 15), PAPER, (W - 40, 36), "rs")], outline=2)
    vig = vignette()
    bg = card_background()

    segments = []  # (duration, render(t_local) -> RGB image)

    def still(name, secs, a, b, tag, text):
        img = Image.open(os.path.join(HERE, "img", name)).convert("RGB")
        b0, b1 = fit_box(img, a), fit_box(img, b)
        cap = caption_layer(tag, text)

        def render(t):
            k = ease(t / secs)
            box = tuple(p + (q - p) * k for p, q in zip(b0, b1))
            frame = img.transform((W, H), Image.EXTENT, box, Image.BICUBIC)
            frame = ImageChops.multiply(frame, vig)
            ca = ease((t - .35) / .5) * (1 - ease((t - (secs - .55)) / .45))
            frame = frame.convert("RGBA")
            if ca > 0:
                frame.alpha_composite(with_alpha(cap, ca), (0, int((1 - ca) * 10)))
            frame.alpha_composite(with_alpha(label, .75))
            return frame.convert("RGB")
        segments.append((secs, render))

    def card(lines, secs, label_on=True):
        layer = text_layer(lines)

        def render(t):
            k = ease((t - .15) / .7) * (1 - ease((t - (secs - .45)) / .45))
            frame = bg.copy().convert("RGBA")
            # the grid drifts a little, like the site's terrain
            frame = Image.Image.transform(frame, (W, H), Image.AFFINE, (1, 0, -(t * 6) % 48, 0, 1, 0), Image.BILINEAR)
            if k > 0:
                frame.alpha_composite(with_alpha(layer, k), (0, int((1 - k) * 14)))
            if label_on:
                frame.alpha_composite(with_alpha(label, .75))
            return frame.convert("RGB")
        segments.append((secs, render))

    eyebrow, title, sub = T["title"]
    card([(eyebrow, MONO(22), MARK, (W / 2, H / 2 - 112), "ms"), (title, DISPLAY(190), PAPER, (W / 2, H / 2 + 62), "ms"),
          (sub, DISPLAY_LIGHT(36), SOFT, (W / 2, H / 2 + 122), "ms")], 3.4, label_on=False)
    for (name, secs, a, b), (tag, text) in zip(WORLD, T["shots"]):
        still(name, secs, a, b, tag, text)
    big, small = T["numbers"]
    card([(big, DISPLAY(170), ACCENT, (W / 2, H / 2 + 40), "ms"), (small, MONO(24), PAPER, (W / 2, H / 2 + 104), "ms")], 3.2)
    head, line = T["facility"]
    card([(head, DISPLAY(120), PAPER, (W / 2, H / 2 + 30), "ms"), (line, DISPLAY_LIGHT(38), SOFT, (W / 2, H / 2 + 90), "ms")], 2.8)
    for (name, secs, a, b), (tag, text) in zip(FACILITY, T["rooms"]):
        still(name, secs, a, b, tag, text)
    e1, e2, e3 = T["end"]
    card([(e1, DISPLAY(112), PAPER, (W / 2, H / 2 + 6), "ms"), (e2, DISPLAY_LIGHT(40), ACCENT, (W / 2, H / 2 + 66), "ms"),
          (e3, MONO(18), SOFT, (W / 2, H - 52), "ms")], 4.2, label_on=False)

    # lay the segments end to end, each one fading over the last for FADE seconds
    starts, t = [], 0.0
    for i, (secs, _) in enumerate(segments):
        starts.append(t); t += secs - (FADE if i < len(segments) - 1 else 0)
    total = t
    frames = int(total * FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-tune", "film", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out_path],
                          stdin=subprocess.PIPE)
    for n in range(frames):
        now = n / FPS
        live = [(i, now - s) for i, (s, (secs, _)) in enumerate(zip(starts, segments)) if s <= now < s + secs]
        i, lt = live[-1]
        frame = segments[i][1](lt)
        if len(live) > 1:  # in a fade: blend the previous segment underneath
            j, pt = live[-2]
            frame = Image.blend(segments[j][1](pt), frame, ease(lt / FADE))
        # fade in from black at the start and out to black at the end
        edge = min(ease(now / .6), ease((total - now) / .8))
        if edge < 1:
            frame = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), frame, edge)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close(); ff.wait()
    print(out_path, f"{total:.1f} s", os.path.getsize(out_path) // 1024, "KB")


def poster(path):
    """The video poster: the Kvarnvik shot without any text, so one picture serves both languages."""
    name, secs, a, b = WORLD[2]
    img = Image.open(os.path.join(HERE, "img", name)).convert("RGB")
    b0, b1 = fit_box(img, a), fit_box(img, b)
    box = tuple(p + (q - p) * .5 for p, q in zip(b0, b1))
    frame = ImageChops.multiply(img.transform((W, H), Image.EXTENT, box, Image.BICUBIC), vignette())
    frame.save(path, "JPEG", quality=86, optimize=True, progressive=True)
    print(path, os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    os.makedirs(os.path.join(HERE, "media"), exist_ok=True)
    poster(os.path.join(HERE, "img", "trailer-poster.jpg"))
    for lang in [a for a in sys.argv[1:] if a in TEXT] if sys.argv[1:] else ["en", "sv"]:
        build(lang, os.path.join(HERE, "media", f"trailer-{lang}.mp4"))
