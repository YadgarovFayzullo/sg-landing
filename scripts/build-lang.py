#!/usr/bin/env python3
"""Til papkalarini yaratadi: /uz/... va /en/... (manba sahifalar — ildizdagi index.html va <slug>/index.html).
HTML ikkala tilda bir xil, farqi: <html lang>, ichki havolalar prefiksi va hreflang. Matn tarjimasi js/i18n.js da (manzil bo'yicha).
Ishga tushirish:  python3 scripts/build-lang.py   (yoki: npm run build)"""
import re, os, shutil, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUGS = ['services', 'hamkorlarga', 'portfolio', 'books', 'media', 'grand-demo-day', 'branches', 'sg-women', 'events', 'blog']
LANGS = ['uz', 'en']
SITE = 'https://startupgarage.uz'

def src(slug):
    return os.path.join(ROOT, 'index.html' if slug == '' else f'{slug}/index.html')

def rewrite(html, lang, slug):
    html = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', html, count=1)
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}/{l}/{slug + "/" if slug else ""}">\n  ' for l in LANGS)
    alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/uz/{slug + "/" if slug else ""}">\n  '
    html = html.replace('</head>', alt + '</head>', 1)
    slugs = '|'.join(SLUGS)
    html = re.sub(rf'href="/({slugs})"', rf'href="/{lang}/\1/"', html)
    html = re.sub(r'href="/(#[^"]*)?"', lambda m: f'href="/{lang}/{m.group(1) or ""}"', html)
    return html

def main():
    for lang in LANGS:
        shutil.rmtree(os.path.join(ROOT, lang), ignore_errors=True)
    n = 0
    for slug in [''] + SLUGS:
        html = open(src(slug), encoding='utf-8').read()
        for lang in LANGS:
            out = os.path.join(ROOT, lang, slug, 'index.html')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            open(out, 'w', encoding='utf-8').write(rewrite(html, lang, slug)); n += 1
    print(f'{n} ta sahifa yaratildi: {", ".join(LANGS)}')

if __name__ == '__main__':
    sys.exit(main())
