#!/usr/bin/env python3
"""Turns your raw screenshots into store-ready 1280x800 images, with an optional caption on top.

1. Put PNG/JPG screenshots into store/screenshots/raw/ (they are sorted by file name).
2. Optional: write one caption per line in store/screenshots/captions.txt (same order as the files).
3. Run:

    pip install pillow
    python3 scripts/make-store-screenshots.py

The result is written to store/screenshots/ as 01.png, 02.png, ... Each screenshot is scaled to fit, gets
rounded corners and a soft shadow, and is placed on a dark gradient. Firefox accepts any size; Chrome and Edge
accept 1280x800 or 640x400.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

WIDTH, HEIGHT = 1280, 800
MARGIN = 48
RADIUS = 18
CAPTION_HEIGHT = 120
RAW = Path('store/screenshots/raw')
OUT = Path('store/screenshots')
CAPTIONS = OUT / 'captions.txt'

FONT_CANDIDATES = [
    '/usr/share/fonts/truetype/google-fonts/Poppins-Bold.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    'C:/Windows/Fonts/arialbd.ttf',
    '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
]


def load_font(size: int) -> ImageFont.ImageFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def background() -> Image.Image:
    image = Image.new('RGB', (WIDTH, HEIGHT))
    pixels = image.load()
    start, end = (9, 13, 30), (34, 26, 96)
    for y in range(HEIGHT):
        for x in range(WIDTH):
            t = (x / WIDTH + y / HEIGHT) / 2
            pixels[x, y] = tuple(int(start[i] + (end[i] - start[i]) * t) for i in range(3))
    return image


def frame(shot: Image.Image, caption: str | None) -> Image.Image:
    top = CAPTION_HEIGHT if caption else MARGIN
    shot = shot.convert('RGBA')
    shot.thumbnail((WIDTH - 2 * MARGIN, HEIGHT - top - MARGIN), Image.LANCZOS)
    mask = Image.new('L', shot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *shot.size), radius=RADIUS, fill=255)
    shot.putalpha(mask)

    canvas = background().convert('RGBA')
    x = (WIDTH - shot.width) // 2
    y = top + (HEIGHT - top - MARGIN - shot.height) // 2
    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((x, y + 14, x + shot.width, y + shot.height + 14), radius=RADIUS, fill=(0, 0, 0, 150))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(24)))
    canvas.alpha_composite(shot, (x, y))

    if caption:
        draw = ImageDraw.Draw(canvas)
        size = 44
        font = load_font(size)
        while draw.textlength(caption, font=font) > WIDTH - 2 * MARGIN and size > 20:
            size -= 2
            font = load_font(size)
        draw.text((WIDTH // 2, CAPTION_HEIGHT // 2 + 4), caption, font=font, fill=(255, 255, 255), anchor='mm')
    return canvas.convert('RGB')


def main() -> None:
    files = sorted(p for p in RAW.glob('*') if p.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'})
    if not files:
        raise SystemExit(f'No screenshots found in {RAW}/ (put .png or .jpg files there)')
    captions = CAPTIONS.read_text(encoding='utf-8').splitlines() if CAPTIONS.exists() else []
    OUT.mkdir(parents=True, exist_ok=True)
    for number, path in enumerate(files[:10], start=1):
        caption = captions[number - 1].strip() if number - 1 < len(captions) and captions[number - 1].strip() else None
        target = OUT / f'{number:02d}.png'
        frame(Image.open(path), caption).save(target, optimize=True)
        print(f'{path.name} -> {target}')
    if len(files) > 10:
        print('Only the first 10 screenshots were used.')


if __name__ == '__main__':
    main()
