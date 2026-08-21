#!/usr/bin/env python3
"""
Generates every raster brand asset the site references.

Written from scratch because this build box has no PIL, ImageMagick or sharp.
Everything here is stdlib: zlib for the PNG deflate stream, struct for chunk
headers. Run it any time the palette or wordmark changes:

    python3 scripts/make-assets.py

Why rasters at all, when the rest of the brand is SVG: social scrapers
(Facebook, X, LinkedIn, WhatsApp) refuse to render an SVG og:image. They
return a valid-looking tag and a blank preview, which is worse than no image.
og:image must be PNG, JPG or WebP. See CLAUDE.md, "Metadata".
"""
import zlib, struct, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public')

# Palette — must stay in sync with src/styles/global.css.
# Verified by scripts/contrast.mjs; do not change one without the other.
INK    = (0x0b, 0x15, 0x24)   # deep navy
AZURE  = (0x0b, 0x6a, 0xe0)   # electric blue
AZURE_D= (0x0a, 0x52, 0xad)
CYAN   = (0x22, 0xd3, 0xee)   # bright fill
ZEST   = (0xff, 0xc4, 0x00)   # hi-vis yellow — fill only, never text on light
CREAM  = (0xff, 0xff, 0xff)
MIST   = (0xef, 0xf6, 0xff)

# ── 5x7 bitmap font ────────────────────────────────────────────
# Each row is five bits, MSB first. Adding a glyph means adding seven rows.
#
# A missing glyph raises rather than rendering a blank, because a silent gap
# is genuinely hard to spot: the first version of this file had no W or F and
# shipped an og:image reading "COOL DO N. ... CARED OR HORSES." which looked
# like a kerning quirk rather than a bug.
FONT = {
 'A': [0x0E,0x11,0x11,0x1F,0x11,0x11,0x11],
 'B': [0x1E,0x11,0x11,0x1E,0x11,0x11,0x1E],
 'C': [0x0E,0x11,0x10,0x10,0x10,0x11,0x0E],
 'D': [0x1E,0x11,0x11,0x11,0x11,0x11,0x1E],
 'E': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x1F],
 'F': [0x1F,0x10,0x10,0x1E,0x10,0x10,0x10],
 'G': [0x0E,0x11,0x10,0x17,0x11,0x11,0x0F],
 'H': [0x11,0x11,0x11,0x1F,0x11,0x11,0x11],
 'I': [0x0E,0x04,0x04,0x04,0x04,0x04,0x0E],
 'K': [0x11,0x12,0x14,0x18,0x14,0x12,0x11],
 'L': [0x10,0x10,0x10,0x10,0x10,0x10,0x1F],
 'M': [0x11,0x1B,0x15,0x15,0x11,0x11,0x11],
 'N': [0x11,0x19,0x15,0x13,0x11,0x11,0x11],
 'O': [0x0E,0x11,0x11,0x11,0x11,0x11,0x0E],
 'Q': [0x0E,0x11,0x11,0x11,0x15,0x12,0x0D],
 'R': [0x1E,0x11,0x11,0x1E,0x14,0x12,0x11],
 'S': [0x0F,0x10,0x10,0x0E,0x01,0x01,0x1E],
 'T': [0x1F,0x04,0x04,0x04,0x04,0x04,0x04],
 'U': [0x11,0x11,0x11,0x11,0x11,0x11,0x0E],
 'V': [0x11,0x11,0x11,0x11,0x11,0x0A,0x04],
 'W': [0x11,0x11,0x11,0x15,0x15,0x1B,0x11],
 'X': [0x11,0x11,0x0A,0x04,0x0A,0x11,0x11],
 'Y': [0x11,0x11,0x0A,0x04,0x04,0x04,0x04],
 'Z': [0x1F,0x01,0x02,0x04,0x08,0x10,0x1F],
 'J': [0x07,0x02,0x02,0x02,0x02,0x12,0x0C],
 'P': [0x1E,0x11,0x11,0x1E,0x10,0x10,0x10],
 '0': [0x0E,0x11,0x13,0x15,0x19,0x11,0x0E],
 '1': [0x04,0x0C,0x04,0x04,0x04,0x04,0x0E],
 '2': [0x0E,0x11,0x01,0x02,0x04,0x08,0x1F],
 '3': [0x1F,0x02,0x04,0x02,0x01,0x11,0x0E],
 '4': [0x02,0x06,0x0A,0x12,0x1F,0x02,0x02],
 '5': [0x1F,0x10,0x1E,0x01,0x01,0x11,0x0E],
 '6': [0x06,0x08,0x10,0x1E,0x11,0x11,0x0E],
 '7': [0x1F,0x01,0x02,0x04,0x08,0x08,0x08],
 '8': [0x0E,0x11,0x11,0x0E,0x11,0x11,0x0E],
 '9': [0x0E,0x11,0x11,0x0F,0x01,0x02,0x0C],
 '-': [0x00,0x00,0x00,0x1F,0x00,0x00,0x00],
 '&': [0x0C,0x12,0x14,0x08,0x15,0x12,0x0D],
 ',': [0x00,0x00,0x00,0x00,0x00,0x04,0x08],
 "'": [0x04,0x04,0x00,0x00,0x00,0x00,0x00],
 '.': [0x00,0x00,0x00,0x00,0x00,0x00,0x04],
 ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00],
}


class Canvas:
    def __init__(self, w, h, bg):
        self.w, self.h = w, h
        self.px = bytearray(bg * (w * h))

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 3
            self.px[i:i+3] = bytes(c)

    def rect(self, x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(self.h, y1)):
            for x in range(max(0, x0), min(self.w, x1)):
                self.set(x, y, c)

    def disc(self, cx, cy, r, c):
        r2 = r * r
        for y in range(max(0, cy - r), min(self.h, cy + r + 1)):
            for x in range(max(0, cx - r), min(self.w, cx + r + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r2:
                    self.set(x, y, c)

    def ring(self, cx, cy, r_out, r_in, c):
        for y in range(max(0, cy - r_out), min(self.h, cy + r_out + 1)):
            for x in range(max(0, cx - r_out), min(self.w, cx + r_out + 1)):
                d = (x - cx) ** 2 + (y - cy) ** 2
                if r_in * r_in <= d <= r_out * r_out:
                    self.set(x, y, c)

    def droplet(self, cx, cy, r, c):
        """
        The brand mark: a circle with a tapered point on top.

        Below the centre it is a plain disc. Above it, the half-width shrinks
        linearly to zero at the tip, which is what gives a droplet its
        teardrop silhouette rather than an egg's.
        """
        top = cy - int(r * 1.75)
        for y in range(max(0, top), min(self.h, cy + r + 1)):
            if y >= cy:
                half = int((r * r - (y - cy) ** 2) ** 0.5) if abs(y - cy) <= r else 0
            else:
                t = (cy - y) / float(cy - top)          # 0 at centre, 1 at tip
                half = int(r * (1.0 - t ** 1.45))
            for x in range(cx - half, cx + half + 1):
                self.set(x, y, c)

    def text(self, s, x, y, scale, c, tracking=1):
        """Draw uppercase text. Returns the x cursor after the last glyph."""
        cur = x
        for ch in s.upper():
            g = FONT.get(ch)
            if g is None:
                raise KeyError(
                    f'No glyph for {ch!r} in FONT (drawing {s!r}). '
                    f'Add its seven rows rather than letting it render blank.'
                )
            for row in range(7):
                bits = g[row]
                for col in range(5):
                    if bits & (1 << (4 - col)):
                        self.rect(cur + col * scale, y + row * scale,
                                  cur + (col + 1) * scale, y + (row + 1) * scale, c)
            cur += (5 + tracking) * scale
        return cur

    def text_width(self, s, scale, tracking=1):
        return len(s) * (5 + tracking) * scale - tracking * scale

    def write(self, path):
        raw = bytearray()
        stride = self.w * 3
        for y in range(self.h):
            raw.append(0)                      # filter type 0 (None)
            raw += self.px[y * stride:(y + 1) * stride]

        def chunk(tag, data):
            return (struct.pack('>I', len(data)) + tag + data
                    + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

        png = (b'\x89PNG\r\n\x1a\n'
               + chunk(b'IHDR', struct.pack('>IIBBBBB', self.w, self.h, 8, 2, 0, 0, 0))
               + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
               + chunk(b'IEND', b''))
        with open(path, 'wb') as f:
            f.write(png)
        return len(png)


def wordmark(c, cx, baseline, scale):
    """CLEANLIVING in white, HQ in hi-vis yellow, centred on cx."""
    a, b = 'CLEANLIVING', 'HQ'
    gap = 2 * scale
    total = c.text_width(a, scale) + gap + c.text_width(b, scale)
    x = cx - total // 2
    x = c.text(a, x, baseline, scale, CREAM)
    c.text(b, x - scale + gap, baseline, scale, ZEST)


def make_og():
    c = Canvas(1200, 630, INK)
    # Depth: two soft off-canvas discs rather than a flat field.
    c.disc(1090, 70, 340, AZURE)
    c.disc(120, 615, 275, AZURE_D)
    c.disc(985, 175, 120, CYAN)
    c.droplet(600, 250, 78, CYAN)
    c.ring(600, 232, 132, 128, ZEST)
    wordmark(c, 600, 400, 9)
    tag = 'TESTED PROPERLY. EXPLAINED PLAINLY.'
    c.text(tag, 600 - c.text_width(tag, 3) // 2, 492, 3, MIST)
    c.rect(520, 556, 680, 562, ZEST)
    n = c.write(os.path.join(OUT, 'og-default.png'))
    print(f'  og-default.png        1200x630  {n:>7,} bytes')


def make_icon(size, path, pad_ratio=0.14):
    c = Canvas(size, size, AZURE)
    r = int(size * (0.5 - pad_ratio) * 0.62)
    c.droplet(size // 2, int(size * 0.60), r, ZEST)
    n = c.write(path)
    print(f'  {os.path.basename(path):<21} {size}x{size}    {n:>7,} bytes')
    return path


def make_ico(png_path, ico_path):
    """ICO with a single embedded PNG. Every browser since IE11 reads this."""
    with open(png_path, 'rb') as f:
        data = f.read()
    header = struct.pack('<HHH', 0, 1, 1)
    entry = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(data), 22)
    with open(ico_path, 'wb') as f:
        f.write(header + entry + data)
    print(f'  favicon.ico           32x32     {22 + len(data):>7,} bytes')


def make_placeholder(name, label, base, accent):
    """
    Product placeholder. Deliberately looks like a placeholder — a real-looking
    stock photo here would end up shipped by accident.
    """
    c = Canvas(800, 800, base)
    for i in range(0, 1600, 56):          # diagonal hatch
        for y in range(800):
            x = i - y
            if 0 <= x < 800:
                c.rect(x, y, x + 8, y + 1, accent)
    c.rect(60, 300, 740, 500, base)
    c.rect(60, 300, 740, 306, accent)
    c.rect(60, 494, 740, 500, accent)
    lines = label.upper().split('|')
    scale = 5
    y = 400 - (len(lines) * 9 * scale) // 2
    for line in lines:
        c.text(line, 400 - c.text_width(line, scale) // 2, y, scale, CREAM)
        y += 11 * scale
    tag = 'PLACEHOLDER IMAGE'
    c.text(tag, 400 - c.text_width(tag, 2) // 2, 720, 2, accent)
    n = c.write(os.path.join(OUT, 'images', name))
    print(f'  images/{name:<14} 800x800   {n:>7,} bytes')


if __name__ == '__main__':
    os.makedirs(os.path.join(OUT, 'images'), exist_ok=True)
    print('Generating brand assets:')
    make_og()
    p = make_icon(180, os.path.join(OUT, 'apple-touch-icon.png'))
    make_icon(32, os.path.join(OUT, 'favicon-32.png'))
    make_ico(os.path.join(OUT, 'favicon-32.png'), os.path.join(OUT, 'favicon.ico'))
    for name, label, base, accent in [
        ('towel-bath.png',   'COOLING|TOWEL', INK,     AZURE),
        ('towel-hand.png',   'TWO|PACK',      AZURE_D, CYAN),
        ('towel-gym.png',    'HI VIS|TOWEL',  INK,     ZEST),
        ('towel-set.png',    'FOUR|PACK',     AZURE_D, ZEST),
        ('cream-body.png',   'AFTER SUN|BALM', INK,    CYAN),
        ('cream-hand.png',   'HAND|BALM',     AZURE_D, CYAN),
    ]:
        make_placeholder(name, label, base, accent)
    print('Done.')
