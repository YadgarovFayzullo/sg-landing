#!/usr/bin/env python3
"""Til papkalarini yaratadi: /uz/... va /en/... (manba sahifalar — ildizdagi index.html va <slug>/index.html).
HTML ikkala tilda bir xil, farqi: <html lang>, ichki havolalar prefiksi va hreflang. Matn tarjimasi js/i18n.js da (manzil bo'yicha).
Ishga tushirish:  python3 scripts/build-lang.py   (yoki: npm run build)"""
import re, os, shutil, sys, json, html as H
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUGS = ['services', 'for-partners', 'portfolio', 'books', 'media', 'grand-demo-day', 'branches', 'sg-women', 'events', 'blog']
LANGS = ['uz', 'en']
SITE = 'https://startupgarage.uz'
READ = {'uz': 'O‘qish', 'en': 'Read'}
EMPTY = {'uz': 'Yangi maqolalar tez orada chiqadi. Yangiliklarni Telegram kanalimizda kuzating.', 'en': 'New articles are coming soon. Follow the news on our Telegram channel.'}

def posts_html(lang):
    posts = json.load(open(os.path.join(ROOT, 'data', 'blog.json'), encoding='utf-8'))
    if not posts:
        return f'<p class="blsoon">{EMPTY[lang]}</p>'
    cards = ''
    for p in posts:
        t = p[lang]
        img = f'<span class="bp__img"><img src="{p["image"]}" alt="" loading="lazy"></span>' if p.get('image') else ''
        cards += (f'<li class="bp reveal"><a href="{p["url"]}">{img}<span class="bp__body"><span class="bp__meta"><span class="bp__tag">{H.escape(t["tag"])}</span>'
                  f'<span class="bp__date">{H.escape(t["date"])}</span></span><b>{H.escape(t["title"])}</b><span class="bp__ex">{H.escape(t["excerpt"])}</span>'
                  f'<span class="bp__go">{READ[lang]} <span aria-hidden="true">→</span></span></span></a></li>\n')
    return f'<ul class="bposts">{cards}</ul>'

def fill_posts(html, lang):
    return re.sub(r'<!-- posts:start -->.*?<!-- posts:end -->', lambda m: '<!-- posts:start -->' + posts_html(lang) + '<!-- posts:end -->', html, flags=re.S)

def funds_html():
    items = json.load(open(os.path.join(ROOT, 'data', 'partners.json'), encoding='utf-8'))
    lis = ''.join(
        f'<li{" style=\"--bg:" + i["bg"] + "\"" if i.get("bg") else ""}><img src="/assets/partners/{i["file"]}" alt="{H.escape(i["name"])}" loading="lazy"></li>'
        for i in items)
    return f'<ul class="funds reveal">{lis}</ul>'

def fill_funds(html):
    return re.sub(r'<!-- funds:start -->.*?<!-- funds:end -->', lambda m: '<!-- funds:start -->' + funds_html() + '<!-- funds:end -->', html, flags=re.S)

def fill_mq(html):
    cards = [(u, n, w) for (w, u, n) in re.findall(r'<li class="rcard"(?: data-name="[^"]*")?(?: data-wm="([^"]*)")?[^>]*><span class="rcard__logo[^"]*"><img src="([^"]+)" alt="([^"]*)"', html)]
    half = (len(cards) + 1) // 2
    def row(items, cls=''):
        lis = ''.join(f'<li><img src="{u}" alt="" loading="lazy">' + (f'<span class="mq__wm">{w}</span>' if w else '') + '</li>' for u, _, w in items)
        return f'<div class="mq__row{cls}"><ul class="mq__track">{lis}</ul></div>'
    body = f'<div class="mq" aria-hidden="true">{row(cards[:half])}{row(cards[half:], " mq__row--rev")}</div>'
    return re.sub(r'<!-- mq:start -->.*?<!-- mq:end -->', lambda m: '<!-- mq:start -->' + body + '<!-- mq:end -->', html, flags=re.S)

def src(slug):
    return os.path.join(ROOT, 'index.html' if slug == '' else f'{slug}/index.html')

def rewrite(html, lang, slug):
    html = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', html, count=1)
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}/{l}/{slug + "/" if slug else ""}">\n  ' for l in LANGS)
    alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/uz/{slug + "/" if slug else ""}">\n  '
    html = html.replace('</head>', alt + '</head>', 1)
    slugs = '|'.join(SLUGS)
    html = re.sub(rf'href="/({slugs})"', rf'href="/{lang}/\1/"', html)
    html = re.sub(r'href="/(blog/[^"]+)"', rf'href="/{lang}/\1"', html)
    html = re.sub(r'href="/(#[^"]*)?"', lambda m: f'href="/{lang}/{m.group(1) or ""}"', html)
    return html

def main():
    for lang in LANGS:
        shutil.rmtree(os.path.join(ROOT, lang), ignore_errors=True)
    sp0 = src('portfolio')
    mq_html = fill_mq(open(sp0, encoding='utf-8').read())
    open(sp0, 'w', encoding='utf-8').write(mq_html)
    for sl in ('', 'grand-demo-day'):
        sp = src(sl); h0 = fill_funds(open(sp, encoding='utf-8').read()); open(sp, 'w', encoding='utf-8').write(h0)
    bsrc = src('blog')
    bhtml = fill_posts(open(bsrc, encoding='utf-8').read(), 'uz')
    open(bsrc, 'w', encoding='utf-8').write(bhtml)
    n = 0
    for slug in [''] + SLUGS:
        html = open(src(slug), encoding='utf-8').read()
        for lang in LANGS:
            out = os.path.join(ROOT, lang, slug, 'index.html')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            page = fill_funds(fill_posts(html, lang) if slug == 'blog' else html)
            if slug == 'portfolio': page = fill_mq(page)
            open(out, 'w', encoding='utf-8').write(rewrite(page, lang, slug)); n += 1
    print(f'{n} ta sahifa yaratildi: {", ".join(LANGS)}')

if __name__ == '__main__':
    sys.exit(main())
