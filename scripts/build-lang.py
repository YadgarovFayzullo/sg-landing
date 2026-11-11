#!/usr/bin/env python3
"""Til papkalarini yaratadi: /uz/... va /en/... (manba sahifalar — ildizdagi index.html va <slug>/index.html).
HTML ikkala tilda bir xil, farqi: <html lang>, ichki havolalar prefiksi va hreflang. Matn tarjimasi js/i18n.js da (manzil bo'yicha).
Ishga tushirish:  python3 scripts/build-lang.py   (yoki: npm run build)"""
import re, os, shutil, sys, json, html as H
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SLUGS = ['services', 'for-partners', 'portfolio', 'books', 'media', 'grand-demo-day', 'branches', 'sg-women', 'events', 'blog', 'team']
LANGS = ['uz', 'en']
SITE = 'https://startupgarage.uz'
OG_IMAGE = SITE + '/assets/og-default.jpg'
OG_LOCALE = {'uz': 'uz_UZ', 'en': 'en_US'}
LABEL = {'uz': {'': 'Bosh sahifa', 'services': 'Xizmatlar', 'for-partners': 'Hamkorlarga', 'portfolio': 'Portfolio', 'books': 'Kitoblar', 'media': 'Media', 'grand-demo-day': 'Grand Demo Day', 'branches': 'Filiallar', 'sg-women': 'SG Women', 'events': 'Tadbirlar', 'blog': 'Blog', 'team': 'Jamoa'},
         'en': {'': 'Home', 'services': 'Services', 'for-partners': 'For partners', 'portfolio': 'Portfolio', 'books': 'Books', 'media': 'Media', 'grand-demo-day': 'Grand Demo Day', 'branches': 'Branches', 'sg-women': 'SG Women', 'events': 'Events', 'blog': 'Blog', 'team': 'Team'}}
SAMEAS = ['https://t.me/startupgarage_uz', 'https://www.instagram.com/startupgarage_uz', 'https://www.linkedin.com/company/startupgarageuz', 'https://www.youtube.com/@startupgarage_uz']
LASTMOD = '2026-11-12'
PRIORITY_WEEKLY = {'', 'portfolio', 'events', 'blog'}
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
    extras = json.load(open(os.path.join(ROOT, 'data', 'marquee-extra.json'), encoding='utf-8'))
    for e in extras:  # faqat lentada ko'rinadigan qo'shimcha belgilar (ro'yxatda yo'q), alifbo tartibida
        pos = next((i for i, c in enumerate(cards) if c[1].lower() > e['name'].lower()), len(cards))
        cards.insert(pos, (e['src'], e['name'], e.get('wm', '')))
    half = (len(cards) + 1) // 2
    def row(items, cls=''):
        lis = ''.join(f'<li><img src="{u}" alt="" loading="lazy">' + (f'<span class="mq__wm">{w}</span>' if w else '') + '</li>' for u, _, w in items)
        return f'<div class="mq__row{cls}"><ul class="mq__track">{lis}</ul></div>'
    body = f'<div class="mq" aria-hidden="true">{row(cards[:half])}{row(cards[half:], " mq__row--rev")}</div>'
    return re.sub(r'<!-- mq:start -->.*?<!-- mq:end -->', lambda m: '<!-- mq:start -->' + body + '<!-- mq:end -->', html, flags=re.S)

def src(slug):
    return os.path.join(ROOT, 'index.html' if slug == '' else f'{slug}/index.html')

def seo(slug):
    return json.load(open(os.path.join(ROOT, 'data', 'seo.json'), encoding='utf-8'))[slug]

def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/') + '</script>\n  '

def jsonld(lang, slug, url, t):
    out = []
    if slug == '':
        out.append({'@context': 'https://schema.org', '@type': 'Organization', '@id': SITE + '/#org', 'name': 'Startup Garage', 'url': SITE + '/',
                    'logo': SITE + '/assets/icon-192.png', 'description': t['description'], 'sameAs': SAMEAS})
        out.append({'@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', 'name': 'Startup Garage', 'url': SITE + '/' + lang + '/',
                    'inLanguage': lang, 'publisher': {'@id': SITE + '/#org'}})
    else:
        out.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': LABEL[lang][''], 'item': f'{SITE}/{lang}/'},
            {'@type': 'ListItem', 'position': 2, 'name': LABEL[lang][slug], 'item': url}]})
    if slug == 'grand-demo-day':
        out.append({'@context': 'https://schema.org', '@type': 'Event', 'name': 'Grand Demo Day 2026', 'description': t['description'],
                    'startDate': '2026-11-19T14:00:00+05:00', 'endDate': '2026-11-19T18:00:00+05:00',
                    'eventStatus': 'https://schema.org/EventScheduled', 'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
                    'location': {'@type': 'Place', 'name': 'Yandex Uzbekistan office', 'address': {'@type': 'PostalAddress', 'addressLocality': 'Tashkent', 'addressCountry': 'UZ'}},
                    'image': [OG_IMAGE], 'url': url, 'inLanguage': lang,
                    'organizer': {'@type': 'Organization', 'name': 'Startup Garage', 'url': SITE + '/'}})
    return ''.join(ld(o) for o in out)

def head_seo(lang, slug):
    t = seo(slug)[lang]
    url = f'{SITE}/{lang}/{slug + "/" if slug else ""}'
    e = lambda x: H.escape(x, quote=True)
    other = [l for l in LANGS if l != lang]
    m = [f'<link rel="canonical" href="{url}">',
         '<meta property="og:type" content="website">', '<meta property="og:site_name" content="Startup Garage">',
         f'<meta property="og:title" content="{e(t["title"])}">', f'<meta property="og:description" content="{e(t["description"])}">',
         f'<meta property="og:url" content="{url}">', f'<meta property="og:locale" content="{OG_LOCALE[lang]}">']
    m += [f'<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">' for l in other]
    m += [f'<meta property="og:image" content="{OG_IMAGE}">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
          '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{e(t["title"])}">',
          f'<meta name="twitter:description" content="{e(t["description"])}">', f'<meta name="twitter:image" content="{OG_IMAGE}">']
    return '\n  '.join(m) + '\n  ' + jsonld(lang, slug, url, t), t

def sitemap():
    rows = ''
    for slug in [''] + SLUGS:
        for lang in LANGS:
            u = lambda l: f'{SITE}/{l}/{slug + "/" if slug else ""}'
            alt = ''.join(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{u(l)}"/>\n' for l in LANGS) + f'    <xhtml:link rel="alternate" hreflang="x-default" href="{u("uz")}"/>\n'
            freq = 'weekly' if slug in PRIORITY_WEEKLY else 'monthly'
            rows += f'  <url>\n    <loc>{u(lang)}</loc>\n{alt}    <lastmod>{LASTMOD}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{"1.0" if slug == "" else "0.7"}</priority>\n  </url>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + rows + '</urlset>\n')

_EN = None
def en_dict():
    """js/i18n-en.js dagi EN lug'ati (node orqali) — build vaqtida /en/ HTML'ni tarjima qilish uchun."""
    global _EN
    if _EN is None:
        import subprocess
        out = subprocess.run(['node', '-e', "import('./js/i18n-en.js').then(m=>process.stdout.write(JSON.stringify(m.EN)))"], cwd=ROOT, capture_output=True, text=True, check=True).stdout
        _EN = json.loads(out)
    return _EN

def translate_body(html):
    """i18n.js bilan bir xil mantiq: matn tugunlari va alt/aria-label/title/placeholder/data-peers-label atributlari."""
    EN = en_dict()
    norm = lambda x: re.sub(r'\s+', ' ', x).strip()
    i = html.find('<body')
    head, body = html[:i], html[i:]
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>|<noscript\b.*?</noscript>|<!--.*?-->)', body, flags=re.S)
    def txt(m):
        raw = m.group(1)
        v = EN.get(norm(H.unescape(raw)))
        if not v: return m.group(0)
        lead = re.match(r'\s*', raw).group(0); trail = re.search(r'\s*$', raw).group(0)
        return '>' + lead + H.escape(v, quote=False) + trail + '<'
    def attr(m):
        v = EN.get(norm(H.unescape(m.group(2))))
        return f'{m.group(1)}="{H.escape(v, quote=True)}"' if v else m.group(0)
    out = []
    for k, part in enumerate(parts):
        if k % 2 == 1: out.append(part); continue
        part = re.sub(r'>([^<>]+)<', txt, part)
        part = re.sub(r'\b(alt|aria-label|title|data-peers-label|placeholder)="([^"]*)"', attr, part)
        out.append(part)
    return head + ''.join(out)

def rewrite(html, lang, slug):
    html = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', html, count=1)
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}/{l}/{slug + "/" if slug else ""}">\n  ' for l in LANGS)
    alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/uz/{slug + "/" if slug else ""}">\n  '
    block, t = head_seo(lang, slug)
    html = re.sub(r'<title>.*?</title>', lambda m: f'<title>{H.escape(t["title"], quote=False)}</title>', html, count=1, flags=re.S)
    html = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{H.escape(t["description"], quote=True)}">', html, count=1)
    html = html.replace('</head>', alt + block + '</head>', 1)
    slugs = '|'.join(SLUGS)
    html = re.sub(rf'href="/({slugs})"', rf'href="/{lang}/\1/"', html)
    html = re.sub(r'href="/(blog/[^"]+)"', rf'href="/{lang}/\1"', html)
    html = re.sub(r'href="/(#[^"]*)?"', lambda m: f'href="/{lang}/{m.group(1) or ""}"', html)
    if lang == 'en':
        html = translate_body(html)
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
    sitemap()
    print(f'{n} ta sahifa yaratildi: {", ".join(LANGS)}')

if __name__ == '__main__':
    sys.exit(main())
