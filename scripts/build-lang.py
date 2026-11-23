#!/usr/bin/env python3
"""Til papkalarini yaratadi: /uz/... va /en/... (manba sahifalar — ildizdagi index.html va <slug>/index.html).
HTML ikkala tilda bir xil, farqi: <html lang>, ichki havolalar prefiksi va hreflang. Matn tarjimasi js/i18n.js da (manzil bo'yicha).
GDD mavsumlari, tadbirlar va blog — data/site.json (yoki SG_API_URL bo'lsa API'dan; scripts/site_content.py).
Ishga tushirish:  python3 scripts/build-lang.py   (yoki: npm run build)"""
import re, os, shutil, sys, json, html as H
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import site_content
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

SITEDATA = None  # site_content.Site — main() da yuklanadi

def T(lang, s):
    """Dinamik bloklardagi statik yorliqlar: en uchun js/i18n-en.js lug'ati."""
    return en_dict().get(s, s) if lang == 'en' else s

def posts_html(lang):
    return SITEDATA.posts_html(lang, READ[lang], EMPTY[lang])

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

def jsonld(lang, slug, url, t, extra=None):
    out = []
    if slug == '':
        out.append({'@context': 'https://schema.org', '@type': 'Organization', '@id': SITE + '/#org', 'name': 'Startup Garage', 'url': SITE + '/',
                    'logo': SITE + '/assets/icon-192.png', 'description': t['description'], 'sameAs': SAMEAS})
        out.append({'@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE + '/#website', 'name': 'Startup Garage', 'url': SITE + '/' + lang + '/',
                    'inLanguage': lang, 'publisher': {'@id': SITE + '/#org'}})
    elif slug.startswith('grand-demo-day/'):
        out.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': LABEL[lang][''], 'item': f'{SITE}/{lang}/'},
            {'@type': 'ListItem', 'position': 2, 'name': LABEL[lang]['grand-demo-day'], 'item': f'{SITE}/{lang}/grand-demo-day/'},
            {'@type': 'ListItem', 'position': 3, 'name': t['title'], 'item': url}]})
    elif slug.startswith('blog/'):
        out.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': LABEL[lang][''], 'item': f'{SITE}/{lang}/'},
            {'@type': 'ListItem', 'position': 2, 'name': LABEL[lang]['blog'], 'item': f'{SITE}/{lang}/blog/'},
            {'@type': 'ListItem', 'position': 3, 'name': t['title'], 'item': url}]})
    else:
        out.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': LABEL[lang][''], 'item': f'{SITE}/{lang}/'},
            {'@type': 'ListItem', 'position': 2, 'name': LABEL[lang][slug], 'item': url}]})
    if slug == 'grand-demo-day':
        ev = SITEDATA.event_ld(lang, url, t['description'])
        if ev:
            ev.update({'image': [OG_IMAGE], 'url': url, 'inLanguage': lang,
                       'organizer': {'@type': 'Organization', 'name': 'Startup Garage', 'url': SITE + '/'}})
            out.append(ev)
    if extra:
        out.append(extra)
    return ''.join(ld(o) for o in out)

def head_seo(lang, slug, page=None):
    """page — seo.json'da yo'q sahifa (blog maqolasi): {'title', 'description', 'image', 'type', 'ld'}."""
    t = page or seo(slug)[lang]
    url = f'{SITE}/{lang}/{slug + "/" if slug else ""}'
    e = lambda x: H.escape(x, quote=True)
    other = [l for l in LANGS if l != lang]
    img = (page or {}).get('image') or OG_IMAGE
    m = [f'<link rel="canonical" href="{url}">',
         f'<meta property="og:type" content="{(page or {}).get("type", "website")}">', '<meta property="og:site_name" content="Startup Garage">',
         f'<meta property="og:title" content="{e(t["title"])}">', f'<meta property="og:description" content="{e(t["description"])}">',
         f'<meta property="og:url" content="{url}">', f'<meta property="og:locale" content="{OG_LOCALE[lang]}">']
    m += [f'<meta property="og:locale:alternate" content="{OG_LOCALE[l]}">' for l in other]
    m += [f'<meta property="og:image" content="{img}">'] + (['<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">'] if img == OG_IMAGE else []) + [
          '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{e(t["title"])}">',
          f'<meta name="twitter:description" content="{e(t["description"])}">', f'<meta name="twitter:image" content="{img}">']
    return '\n  '.join(m) + '\n  ' + jsonld(lang, slug, url, t, (page or {}).get('ld')), t

def sitemap(posts=(), seasons=()):
    """posts — [(slug, lastmod)] blog maqolalari (blog/<slug>); seasons — [(raqam, lastmod)] (grand-demo-day/<n>)."""
    rows = ''
    for slug, lastmod in ([(s, LASTMOD) for s in [''] + SLUGS] + [(f'blog/{s}', d) for s, d in posts]
                          + [(f'grand-demo-day/{n}', d) for n, d in seasons]):
        for lang in LANGS:
            u = lambda l: f'{SITE}/{l}/{slug + "/" if slug else ""}'
            alt = ''.join(f'    <xhtml:link rel="alternate" hreflang="{l}" href="{u(l)}"/>\n' for l in LANGS) + f'    <xhtml:link rel="alternate" hreflang="x-default" href="{u("uz")}"/>\n'
            freq = 'weekly' if slug in PRIORITY_WEEKLY else 'monthly'
            rows += f'  <url>\n    <loc>{u(lang)}</loc>\n{alt}    <lastmod>{lastmod}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{"1.0" if slug == "" else "0.7"}</priority>\n  </url>\n'
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
    # <!-- site:X:start -->…<!-- site:X:end --> — build vaqtida tilga mos chizilgan blok (site.json), lug'at tegmaydi
    parts = re.split(r'(<!-- site:([a-z-]+):start -->.*?<!-- site:\2:end -->|<script\b.*?</script>|<style\b.*?</style>|<noscript\b.*?</noscript>|<!--.*?-->)', body, flags=re.S)
    parts = [x for k, x in enumerate(parts) if k % 3 != 2]  # ichki guruh (blok nomi) qismlarini tashlash
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

def rewrite(html, lang, slug, page=None):
    html = re.sub(r'<html lang="[a-z]+"', f'<html lang="{lang}"', html, count=1)
    alt = ''.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}/{l}/{slug + "/" if slug else ""}">\n  ' for l in LANGS)
    alt += f'<link rel="alternate" hreflang="x-default" href="{SITE}/uz/{slug + "/" if slug else ""}">\n  '
    block, t = head_seo(lang, slug, page)
    html = re.sub(r'<title>.*?</title>', lambda m: f'<title>{H.escape(t["title"], quote=False)}</title>', html, count=1, flags=re.S)
    html = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{H.escape(t["description"], quote=True)}">', html, count=1)
    html = html.replace('</head>', alt + block + '</head>', 1)
    slugs = '|'.join(SLUGS)
    html = re.sub(rf'href="/({slugs})(#[^"]*)?"', lambda m: f'href="/{lang}/{m.group(1)}/{m.group(2) or ""}"', html)
    html = re.sub(r'href="/(blog/[^"]+)"', rf'href="/{lang}/\1"', html)
    html = re.sub(r'href="/(grand-demo-day/\d+/)"', rf'href="/{lang}/\1"', html)
    html = re.sub(r'href="/(#[^"]*)?"', lambda m: f'href="/{lang}/{m.group(1) or ""}"', html)
    if lang == 'en':
        html = translate_body(html)
    return html

GEN = '<!-- generated by scripts/build-lang.py from data/site.json -->'

def fill_site(slug, html, lang):
    """data/site.json bloklari: bosh sahifa (GDD bloki), /grand-demo-day, /events, /blog."""
    if slug == '': return SITEDATA.fill_home(html, lang)
    if slug == 'grand-demo-day': return SITEDATA.fill_gdd(html, lang)
    if slug == 'events': return SITEDATA.fill_events(html, lang)
    if slug == 'blog': return fill_posts(html, lang)
    return html

def post_page(tpl, p, lang):
    """blog/<slug>/ — blog sahifasi shabloni, <main> o'rniga maqola."""
    t = site_content.tx
    html = re.sub(r'<main id="main">.*?</main>', lambda m: SITEDATA.post_main(p, lang), tpl, count=1, flags=re.S)
    title, desc = t(p.get('title'), lang) + ' — Startup Garage', t(p.get('excerpt'), lang) or t(p.get('title'), lang)
    src = SITEDATA.src(p.get('coverPhotoId')) if p.get('coverPhotoId') in SITEDATA.photos else None
    img = (SITE + src if src and src.startswith('/') else src) or None
    ld = {'@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': t(p.get('title'), lang), 'description': desc,
          'datePublished': p['date'], 'inLanguage': lang, 'url': f'{SITE}/{lang}/blog/{p["slug"]}/',
          'publisher': {'@type': 'Organization', 'name': 'Startup Garage', 'url': SITE + '/'}}
    if img: ld['image'] = [img]
    return html, {'title': title, 'description': desc, 'image': img, 'type': 'article', 'ld': ld}

def season_page(tpl, s, lang):
    """grand-demo-day/<n>/ — GDD sahifasi shabloni, <main> o'rniga mavsum."""
    t = site_content.tx
    html = re.sub(r'<main id="main">.*?</main>', lambda m: SITEDATA.season_main(s, lang), tpl, count=1, flags=re.S)
    name = t(s.get('title'), lang) or site_content.season_title(s, lang)
    sm = sum(float(r.get('amount') or 0) for r in s.get('results') or [])
    if t(s.get('lead'), lang):
        desc = t(s.get('lead'), lang)
    elif lang == 'uz':
        desc = f'{s["number"]}-mavsum' + (f': {site_content.money(sm)} soft commitment' if sm else '') + ', finalchilar va tadbirdan lavhalar.'
    else:
        desc = f'Season {s["number"]}' + (f': {site_content.money(sm)} in soft commitments' if sm else '') + ', finalists and photos from the event.'
    src = SITEDATA.src(s.get('coverPhotoId')) if s.get('coverPhotoId') in SITEDATA.photos else None
    img = (SITE + src if src and src.startswith('/') else src) or None
    return html, {'title': f'{name} — Startup Garage', 'description': desc, 'image': img, 'type': 'website'}

def write_generated(path, page, meta):
    """Prefikssiz (uz) manba sahifasi: generated belgisi bilan — keyingi build uni o'chirib qayta yozadi."""
    page = re.sub(r'<title>.*?</title>', lambda m: f'<title>{H.escape(meta["title"], quote=False)}</title>', page, count=1, flags=re.S)
    page = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{H.escape(meta["description"], quote=True)}">', page, count=1)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(page.replace('<head>', '<head>\n  ' + GEN, 1))

def main():
    global SITEDATA
    SITEDATA = site_content.Site(site_content.load(), T)
    for lang in LANGS:
        shutil.rmtree(os.path.join(ROOT, lang), ignore_errors=True)
    sp0 = src('portfolio')
    mq_html = fill_mq(open(sp0, encoding='utf-8').read())
    open(sp0, 'w', encoding='utf-8').write(mq_html)
    for sl in ('', 'grand-demo-day'):
        sp = src(sl); h0 = fill_funds(open(sp, encoding='utf-8').read()); open(sp, 'w', encoding='utf-8').write(h0)
    for sl in ('', 'grand-demo-day', 'events', 'blog'):  # manba sahifalar ham yangilanadi (uz)
        sp = src(sl); h0 = fill_site(sl, open(sp, encoding='utf-8').read(), 'uz'); open(sp, 'w', encoding='utf-8').write(h0)
    n = 0
    for slug in [''] + SLUGS:
        html = open(src(slug), encoding='utf-8').read()
        for lang in LANGS:
            out = os.path.join(ROOT, lang, slug, 'index.html')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            page = fill_funds(fill_site(slug, html, lang))
            if slug == 'portfolio': page = fill_mq(page)
            open(out, 'w', encoding='utf-8').write(rewrite(page, lang, slug)); n += 1
    # blog maqolalari: /blog/<slug>/ (manba, uz — prefikssiz manzil uchun) va /uz|en/blog/<slug>/
    bdir = os.path.join(ROOT, 'blog')
    for d in os.listdir(bdir):
        f = os.path.join(bdir, d, 'index.html')
        if os.path.isfile(f) and GEN in open(f, encoding='utf-8').read():
            shutil.rmtree(os.path.join(bdir, d))
    tpl = open(src('blog'), encoding='utf-8').read()
    posts = SITEDATA.pages()
    for p in posts:
        page, meta = post_page(tpl, p, 'uz')
        page = re.sub(r'<title>.*?</title>', lambda m: f'<title>{H.escape(meta["title"], quote=False)}</title>', page, count=1, flags=re.S)
        page = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{H.escape(meta["description"], quote=True)}">', page, count=1)
        os.makedirs(os.path.join(bdir, p['slug']), exist_ok=True)
        open(os.path.join(bdir, p['slug'], 'index.html'), 'w', encoding='utf-8').write(page.replace('<head>', '<head>\n  ' + GEN, 1))
        for lang in LANGS:
            page, meta = post_page(tpl, p, lang)
            out = os.path.join(ROOT, lang, 'blog', p['slug'], 'index.html')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            open(out, 'w', encoding='utf-8').write(rewrite(page, lang, f'blog/{p["slug"]}', meta)); n += 1
    # Grand Demo Day mavsumlari: /grand-demo-day/<n>/ (manba, uz) va /uz|en/grand-demo-day/<n>/
    gdir = os.path.join(ROOT, 'grand-demo-day')
    for d in os.listdir(gdir):
        f = os.path.join(gdir, d, 'index.html')
        if os.path.isfile(f) and GEN in open(f, encoding='utf-8').read():
            shutil.rmtree(os.path.join(gdir, d))
    gtpl = open(src('grand-demo-day'), encoding='utf-8').read()
    for s in SITEDATA.seasons:
        page, meta = season_page(gtpl, s, 'uz')
        write_generated(os.path.join(gdir, str(s['number']), 'index.html'), page, meta)
        for lang in LANGS:
            page, meta = season_page(gtpl, s, lang)
            out = os.path.join(ROOT, lang, 'grand-demo-day', str(s['number']), 'index.html')
            os.makedirs(os.path.dirname(out), exist_ok=True)
            open(out, 'w', encoding='utf-8').write(rewrite(page, lang, f'grand-demo-day/{s["number"]}', meta)); n += 1
    sitemap([(p['slug'], p['date']) for p in posts],
            [(s['number'], (s.get('updatedAt') or LASTMOD)[:10]) for s in SITEDATA.seasons])
    print(f'{n} ta sahifa yaratildi: {", ".join(LANGS)}')

if __name__ == '__main__':
    sys.exit(main())
