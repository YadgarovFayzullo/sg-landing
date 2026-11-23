"""Sayt kontenti (Grand Demo Day mavsumlari, tadbirlar, yangiliklar) — data/site.json yoki API (GET /v1/public/site).
Shartnoma: sg-new-api/docs/site-content.md. Faqat stdlib.

  SG_API_URL            o'rnatilgan bo'lsa — API'dan olinadi, data/site.json va assets/site/ yangilanadi;
                        olinmasa build xato bilan to'xtaydi (Vercel oldingi deploy'ni saqlaydi)
  SITE_ALLOW_SNAPSHOT=1 API ishlamasa ham data/site.json bilan davom etish
  SITE_TODAY=YYYY-MM-DD "bugun"ni qotirish (test uchun); default — Toshkent sanasi
"""
import datetime, html as H, json, os, re, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SNAPSHOT = os.path.join(ROOT, 'data', 'site.json')
ASSETS = os.path.join(ROOT, 'assets', 'site')
MANIFEST = os.path.join(ASSETS, '.versions.json')
TIMEOUT = 20
EXT = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/avif': 'avif', 'image/gif': 'gif'}
UA = {'User-Agent': 'startupgarage-landing-build', 'Accept': 'application/json'}

MONTHS = {'uz': ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
          'en': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']}

e = lambda s: H.escape(s or '', quote=False)
ea = lambda s: H.escape(s or '', quote=True)


# ---------------- ma'lumotni olish ----------------

def _get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read(), (r.headers.get('Content-Type') or '').split(';')[0].strip().lower()


def _version(url):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
    return (q.get('v') or [url])[0]


def _download_photos(api, photos):
    os.makedirs(ASSETS, exist_ok=True)
    try:
        man = json.load(open(MANIFEST, encoding='utf-8'))
    except (OSError, ValueError):
        man = {}
    new, got = {}, 0
    for p in photos:
        pid, v = p['id'], _version(p['url'])
        old = man.get(pid)
        if old and old.get('v') == v and os.path.isfile(os.path.join(ASSETS, old.get('file', ''))):
            new[pid] = old
            continue
        body, ctype = _get(api + p['url'])
        ext = EXT.get(ctype)
        if not ext:
            raise RuntimeError(f'photo {pid}: unexpected content type {ctype!r}')
        name = f'{pid}.{ext}'
        tmp = os.path.join(ASSETS, name + '.tmp')
        open(tmp, 'wb').write(body)
        os.replace(tmp, os.path.join(ASSETS, name))
        new[pid] = {'v': v, 'file': name}
        got += 1
    keep = {m['file'] for m in new.values()} | {'.versions.json'}
    for f in os.listdir(ASSETS):  # endi ishlatilmaydigan rasmlar
        if f not in keep:
            os.remove(os.path.join(ASSETS, f))
    open(MANIFEST, 'w', encoding='utf-8').write(json.dumps(new, ensure_ascii=False, indent=2, sort_keys=True) + '\n')
    return got


def _valid(d):
    return isinstance(d, dict) and all(isinstance(d.get(k), list) for k in ('gddSeasons', 'events', 'news', 'photos'))


def load():
    """site.json lug'atini qaytaradi; API rejimida snapshot va rasmlarni yangilaydi."""
    api = os.environ.get('SG_API_URL', '').strip().rstrip('/')
    if api:
        try:
            body, _ = _get(api + '/v1/public/site')
            data = json.loads(body.decode('utf-8'))
            if not _valid(data):
                raise ValueError('unexpected response shape')
            got = _download_photos(api, data['photos'])
            open(SNAPSHOT, 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
            print(f'site: {api} — {len(data["gddSeasons"])} mavsum, {len(data["events"])} tadbir, {len(data["news"])} yangilik, '
                  f'{len(data["photos"])} rasm ({got} ta yuklandi)')
            return data
        except Exception as ex:  # noqa: BLE001 — har qanday xato: tarmoq, JSON, rasm
            if os.environ.get('SITE_ALLOW_SNAPSHOT') != '1':
                sys.exit(f'site: {api}/v1/public/site olinmadi: {ex}. Snapshot bilan davom etish uchun SITE_ALLOW_SNAPSHOT=1')
            print(f'site: API xatosi ({ex}) — data/site.json ishlatiladi', file=sys.stderr)
    data = json.load(open(SNAPSHOT, encoding='utf-8'))
    if not _valid(data):
        sys.exit('site: data/site.json noto‘g‘ri')
    return data


# ---------------- yordamchilar ----------------

def today():
    t = os.environ.get('SITE_TODAY')
    if t:
        return t
    return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=5)).date().isoformat()  # Toshkent, UTC+5


def tx(l10n, lang):
    """L10n → matn; en bo'sh bo'lsa uz."""
    l10n = l10n or {}
    return ((l10n.get(lang) or '').strip() if lang != 'uz' else '') or (l10n.get('uz') or '').strip()


def _ymd(s):
    y, m, d = (int(x) for x in s.split('-'))
    return y, m, d


def d_short(s, lang):  # 19-noyabr / November 19
    _, m, d = _ymd(s)
    return f'{d}-{MONTHS["uz"][m - 1]}' if lang == 'uz' else f'{MONTHS["en"][m - 1]} {d}'


def d_long(s, lang):  # 2026-yil 8-oktabr / October 8, 2026
    y, m, d = _ymd(s)
    return f'{y}-yil {d}-{MONTHS["uz"][m - 1]}' if lang == 'uz' else f'{MONTHS["en"][m - 1]} {d}, {y}'


def d_post(s, lang):  # 19-noyabr, 2026 / November 19, 2026
    y, m, d = _ymd(s)
    return f'{d}-{MONTHS["uz"][m - 1]}, {y}' if lang == 'uz' else f'{MONTHS["en"][m - 1]} {d}, {y}'


def d_range(a, b, lang, this_year):
    """Tadbir sanasi: 9-noyabr · 24–26-noyabr · 16-oktabr — 11-noyabr (yil boshqa bo'lsa — yil bilan)."""
    ya, ma, da = _ymd(a)
    if not b or b == a:
        return d_short(a, lang) if ya == this_year else d_long(a, lang)
    yb, mb, db = _ymd(b)
    if (ya, ma) == (yb, mb):
        s = f'{da}–{db}-{MONTHS["uz"][ma - 1]}' if lang == 'uz' else f'{MONTHS["en"][ma - 1]} {da}–{db}'
        if ya != this_year:
            s = f'{ya}-yil {s}' if lang == 'uz' else f'{s}, {ya}'
        return s
    if ya == yb == this_year:
        return f'{d_short(a, lang)} — {d_short(b, lang)}'
    return f'{d_long(a, lang)} — {d_long(b, lang)}'


def money(n):
    n = float(n or 0)
    return f'${n:,.0f}' if n == int(n) else f'${n:,.2f}'


def money_short(n):
    n = float(n or 0)
    for div, suf in ((1e6, 'M'), (1e3, 'K')):
        if n >= div:
            v = f'{n / div:.1f}'.rstrip('0').rstrip('.')
            return f'${v}{suf}'
    return money(n)


def season_label(n, lang):
    return f'{n}-mavsum' if lang == 'uz' else f'Season {n}'


def season_title(s, lang):
    return tx(s.get('title'), lang) or (f'Grand Demo Day · {s["number"]}-mavsum' if lang == 'uz' else f'Grand Demo Day · Season {s["number"]}')


def season_href(n):
    return f'/grand-demo-day/{n}/'


# labels of the season cards and pages, in both languages
SL = {
    'uz': {'all': 'Barcha mavsumlar', 'more': 'Batafsil', 'nodate': 'Sana belgilanmagan', 'done': 'Yakunlangan mavsum',
           'soon': 'Yaqinlashayotgan mavsum', 'results': 'Natijalar', 'back': '← Barcha mavsumlar', 'prev': '← {n}-mavsum',
           'next': '{n}-mavsum →', 'empty': 'Natijalar va lavhalar tadbirdan keyin shu yerda chiqadi.'},
    'en': {'all': 'All seasons', 'more': 'Learn more', 'nodate': 'Date to be announced', 'done': 'Season completed',
           'soon': 'Upcoming season', 'results': 'Results', 'back': '← All seasons', 'prev': '← Season {n}',
           'next': 'Season {n} →', 'empty': 'Results and photos appear here after the event.'},
}


def ext_link(url):
    return ' target="_blank" rel="noopener"' if re.match(r'https?://', url or '') else ''


def fill(html, name, body):
    pat = rf'<!-- site:{name}:start -->.*?<!-- site:{name}:end -->'
    if not re.search(pat, html, flags=re.S):
        raise RuntimeError(f'marker site:{name} not found')
    return re.sub(pat, lambda m: f'<!-- site:{name}:start -->{body}<!-- site:{name}:end -->', html, count=1, flags=re.S)


# ---------------- kontent modeli ----------------

class Site:
    def __init__(self, data, T):
        """T(lang, uz) — statik yorliq tarjimasi (js/i18n-en.js lug'ati)."""
        self.data, self.T = data, T
        self.today = today()
        self.year = int(self.today[:4])
        pub = lambda xs: [x for x in xs if x.get('published', True) is not False]
        self.photos = {p['id']: p for p in data['photos']}
        self.seasons = sorted(pub(data['gddSeasons']), key=lambda s: s['number'])
        self.events = pub(data['events'])
        self.news = sorted(pub(data['news']), key=lambda p: p['date'], reverse=True)
        up = sorted((s for s in self.seasons if s.get('date') and s['date'] >= self.today), key=lambda s: s['date'])
        self.hero = up[0] if up else (max(self.seasons, key=lambda s: s['number']) if self.seasons else None)
        self.with_results = [s for s in self.seasons if s.get('results')]
        self.galleries = [s for s in sorted(self.seasons, key=lambda s: -s['number']) if self.gallery(s)]
        try:
            self.manifest = json.load(open(MANIFEST, encoding='utf-8'))
        except (OSError, ValueError):
            self.manifest = {}

    # rasm manzili: API'dan yuklangan fayl (assets/site/) yoki sayt yo'li
    def src(self, pid):
        p = self.photos.get(pid)
        if not p:
            return None
        m = self.manifest.get(pid)
        if m and os.path.isfile(os.path.join(ASSETS, m['file'])):
            return f'/assets/site/{m["file"]}'
        url = p.get('url') or ''
        if url.startswith('/') and not url.startswith('/v1/'):
            return url.split('?')[0]
        print(f'site: rasm {pid} lokal emas ({url})', file=sys.stderr)
        return url

    def gallery(self, s):
        return [self.photos[i] for i in (s.get('galleryPhotoIds') or []) if i in self.photos]

    def totals(self):
        rs = [r for s in self.with_results for r in s['results']]
        return sum(float(r.get('amount') or 0) for r in rs), sum(1 for r in rs if float(r.get('amount') or 0) > 0), len(self.with_results)

    # ---------- /grand-demo-day ----------
    def meta_items(self, s, lang):
        items = []
        if s.get('date'):
            items.append(d_short(s['date'], lang) if int(s['date'][:4]) == self.year else d_long(s['date'], lang))
        if s.get('time'):
            items.append(s['time'])
        if tx(s.get('place'), lang):
            items.append(tx(s.get('place'), lang))
        return items

    def hero_html(self, lang):
        T, s = self.T, self.hero
        if not s:
            return '<h1 class="gdd-hero__title">Grand Demo Day</h1>'
        kicker = tx(s.get('kicker'), lang)  # the line above the title (the season's partner); empty → none
        out = f'<p class="gdd-hero__kicker" data-noi18n>{e(kicker)}</p>' if kicker else ''
        out += f'<h1 class="gdd-hero__title" data-noi18n>{e(tx(s.get("title"), lang) or "Grand Demo Day")}</h1>'
        if tx(s.get('lead'), lang):
            out += f'\n        <p class="gdd-hero__lead" data-noi18n>{e(tx(s["lead"], lang))}</p>'
        items = self.meta_items(s, lang)
        if items:
            out += '\n        <ul class="gdd-hero__meta" data-noi18n>' + ''.join(f'<li>{e(x)}</li>' for x in items) + '</ul>'
        btns = ''
        if s.get('registerUrl'):
            btns += f'<a class="btn btn--light" href="{ea(s["registerUrl"])}"{ext_link(s["registerUrl"])}>{e(T(lang, "Ro‘yxatdan o‘tish"))}</a>'
        if s.get('applyUrl'):
            btns += f'<a class="btn btn--ghost-light" href="{ea(s["applyUrl"])}"{ext_link(s["applyUrl"])}>{e(T(lang, "Ariza topshirish"))}</a>'
        if btns:
            out += f'\n        <div class="phero__actions" data-noi18n>{btns}</div>'
        return out

    def cover_html(self, lang):
        s = self.hero
        if not s or s.get('coverPhotoId') not in self.photos:
            return ''
        p = self.photos[s['coverPhotoId']]
        cap = ''
        owner = next((g for g in self.galleries if p['id'] in (g.get('galleryPhotoIds') or [])), None)
        if owner:
            parts = [season_label(owner['number'], lang)] + ([d_long(owner['date'], lang)] if owner.get('date') else [])
            prev = owner['number'] != s['number']
            lead = ('Oldingi Grand Demo Day' if lang == 'uz' else 'Previous Grand Demo Day') if prev else 'Grand Demo Day'
            cap = f'<figcaption>{e(" · ".join([lead] + parts))}</figcaption>'
        return (f'<div class="container"><figure class="gdd-hero__img" data-noi18n><img src="{ea(self.src(p["id"]))}" alt="{ea(tx(p.get("alt"), lang))}" '
                f'width="{p["width"]}" height="{p["height"]}">{cap}</figure></div>')

    def way_html(self, lang):
        if not self.with_results:
            return ''
        total, n, k = self.totals()
        sp = (f'jami soft commitment — {n} ta startup, {k} mavsum' if lang == 'uz'
              else f'total soft commitment — {n} startup{"s" if n != 1 else ""}, {k} season{"s" if k != 1 else ""}')
        return f'<li class="reveal" data-noi18n><b>{money_short(total)}</b><span>{e(sp)}</span></li>'

    def results_html(self, lang):
        """Natijalar: jami ko'rsatkichlar va har mavsum uchun karta (jadval — mavsum sahifasida)."""
        T = self.T
        out = ''
        if self.with_results:
            nums = [s['number'] for s in self.with_results]
            if lang == 'uz':
                lead = (', '.join(f'{x}-' for x in nums[:-1]) + f' va {nums[-1]}-mavsum' if len(nums) > 1 else f'{nums[0]}-mavsum') + ' soft commitment natijalari'
            else:
                lead = 'Soft commitment results for ' + (('seasons ' + ', '.join(str(x) for x in nums[:-1]) + f' and {nums[-1]}') if len(nums) > 1 else f'season {nums[0]}')
            total, n, k = self.totals()
            out += (f'<p class="gdd-rhead__lead" data-noi18n>{e(lead)}</p>\n'
                    f'        <ul class="gdd-facts gdd-facts--row gdd-facts--res" data-noi18n>\n'
                    f'          <li class="reveal"><b>{money(total)}</b><span>{e(T(lang, "Jami soft commitment"))}</span></li>\n'
                    f'          <li class="reveal"><b>{n}{" ta" if lang == "uz" else ""}</b><span>{e(T(lang, "Soft commitment olgan startup"))}</span></li>\n'
                    f'          <li class="reveal"><b>{k} {"mavsum" if lang == "uz" else ("season" if k == 1 else "seasons")}</b><span>{e(T(lang, "Jamlangan natijalar"))}</span></li>\n'
                    f'        </ul>\n')
        if self.seasons:
            cards = ''.join(self.season_tile(s, lang) for s in sorted(self.seasons, key=lambda s: -s['number']))
            out += (f'        <h3 class="gdd-sub" id="mavsumlar" data-noi18n>{e(SL[lang]["all"])}</h3>\n'
                    f'        <ul class="evl gdd-seasons" data-noi18n>{cards}\n        </ul>')
        return out

    def season_tile(self, s, lang):
        """Mavsum kartasi (GDD sahifasida): muqova, sana, nom, summa → /grand-demo-day/N/."""
        up = bool(s.get('date')) and s['date'] >= self.today
        src = self.src(s['coverPhotoId']) if s.get('coverPhotoId') in self.photos else None
        img = f'<span class="evc__img"><img src="{ea(src)}" alt="" loading="lazy"></span>' if src else ''
        date = d_long(s['date'], lang) if s.get('date') else SL[lang]['nodate']
        where = ' · '.join([date] + ([tx(s.get('place'), lang)] if tx(s.get('place'), lang) else []))
        sm = sum(float(r.get('amount') or 0) for r in s.get('results') or [])
        amt = f'<span class="evc__amt">{money(sm)}</span>' if sm > 0 else ''
        tag = f'<span class="evc__tag">{e(SL[lang]["soon"])}</span>' if up else ''
        return (f'\n          <li class="evc{"" if up else " evc--past"} reveal"><a href="{season_href(s["number"])}">{img}<span class="evc__body">'
                f'{tag}<span class="evc__date">{e(where)}</span><b>{e(season_title(s, lang))}</b>{amt}'
                f'<span class="evc__go">{e(SL[lang]["more"])} <span aria-hidden="true">→</span></span></span></a></li>')

    def season_main(self, s, lang):
        """/grand-demo-day/N/ sahifasining <main> qismi: hero, natijalar jadvali, galereya, mavsumlar orasida o'tish."""
        T, L = self.T, SL[lang]
        up = bool(s.get('date')) and s['date'] >= self.today
        kicker = tx(s.get('kicker'), lang)
        hero = f'<p class="gdd-hero__kicker">{e(kicker)}</p>' if kicker else ''
        hero += f'<h1 class="gdd-hero__title">{e(tx(s.get("title"), lang) or season_title(s, lang))}</h1>'
        if tx(s.get('lead'), lang):
            hero += f'\n        <p class="gdd-hero__lead">{e(tx(s["lead"], lang))}</p>'
        items = self.meta_items(s, lang)
        if items:
            hero += '\n        <ul class="gdd-hero__meta">' + ''.join(f'<li>{e(x)}</li>' for x in items) + '</ul>'
        if up:
            btns = ''
            if s.get('registerUrl'):
                btns += f'<a class="btn btn--light" href="{ea(s["registerUrl"])}"{ext_link(s["registerUrl"])}>{e(T(lang, "Ro‘yxatdan o‘tish"))}</a>'
            if s.get('applyUrl'):
                btns += f'<a class="btn btn--ghost-light" href="{ea(s["applyUrl"])}"{ext_link(s["applyUrl"])}>{e(T(lang, "Ariza topshirish"))}</a>'
            if btns:
                hero += f'\n        <div class="phero__actions">{btns}</div>'
        cover = ''
        if s.get('coverPhotoId') in self.photos:
            p = self.photos[s['coverPhotoId']]
            cover = (f'\n      <div class="container"><figure class="gdd-hero__img"><img src="{ea(self.src(p["id"]))}" alt="{ea(tx(p.get("alt"), lang))}" '
                     f'width="{p["width"]}" height="{p["height"]}"></figure></div>')
        out = (f'<main id="main">\n    <!-- site:season:start --><div data-noi18n>\n'
               f'    <section class="gdd-hero">\n      <div class="container gdd-hero__in">\n        {hero}\n      </div>{cover}\n    </section>\n')
        if s.get('results'):
            head = f'<thead><tr><th scope="col">{e(T(lang, "Startup"))}</th><th scope="col">{e(T(lang, "Soft commitment"))}</th><th scope="col">{e(T(lang, "Investor(lar)"))}</th></tr></thead>'
            date = f'<span class="gs-date">{e(d_long(s["date"], lang))}</span>' if s.get('date') else ''
            sm = sum(float(r.get('amount') or 0) for r in s['results'])
            rows = ''
            for r in s['results']:
                invs = ''.join(f'<span class="gs-inv">{e(i["name"])}' + (f'<b>{money(i["amount"])}</b>' if i.get('amount') is not None else '') + '</span>'
                               for i in r.get('investors') or [])
                rows += f'<tr><th scope="row">{e(r["startup"])}</th><td class="gs-sum">{money(r.get("amount"))}</td><td>{invs}</td></tr>'
            note = (f'\n        <p class="gdd-note"><b>{e(T(lang, "Qo‘shimcha natijalar:"))}</b> {e(tx(s["note"], lang))}</p>'
                    if tx(s.get('note'), lang) else '')
            out += (f'    <section class="psec psec--soft" aria-labelledby="s-res"><div class="container">\n'
                    f'        <h2 class="psec__title" id="s-res">{e(L["results"])}</h2>\n'
                    f'        <div class="gseason"><div class="gseason__h"><div><h3>{e(season_label(s["number"], lang))}</h3>{date}</div><b>{money(sm)}</b></div>\n'
                    f'          <table>{head}<tbody>{rows}</tbody></table></div>{note}\n    </div></section>\n')
        photos = self.gallery(s)
        if photos:
            lis = ''.join(f'\n          <li class="gal__i"><button type="button" class="gal__b" data-i="{i}" aria-label="{ea(T(lang, "Foto") + " " + str(i + 1))}">'
                          f'<img src="{ea(self.src(p["id"]))}" alt="{ea(tx(p.get("alt"), lang))}" width="{p["width"]}" height="{p["height"]}" loading="lazy"></button></li>'
                          for i, p in enumerate(photos))
            out += (f'    <section class="psec" id="lavhalar" aria-labelledby="s-gal"><div class="container">\n'
                    f'        <h2 class="psec__title" id="s-gal">{e(T(lang, "Tadbirdan lavhalar"))}</h2>\n'
                    f'        <ul class="gal" id="gdGal">{lis}\n        </ul>\n    </div></section>\n')
        if not s.get('results') and not photos:
            out += f'    <section class="psec psec--soft"><div class="container"><p class="gdd-sub2">{e(L["empty"])}</p></div></section>\n'
        nums = [x['number'] for x in self.seasons]
        i = nums.index(s['number'])
        prev = f'<a class="btn btn--ghost" href="{season_href(nums[i - 1])}">{e(L["prev"].format(n=nums[i - 1]))}</a>' if i > 0 else ''
        nxt = f'<a class="btn btn--ghost" href="{season_href(nums[i + 1])}">{e(L["next"].format(n=nums[i + 1]))}</a>' if i + 1 < len(nums) else ''
        out += (f'    <section class="psec"><div class="container"><nav class="gdd-snav" aria-label="{e(L["all"])}">'
                f'<a class="btn btn--primary" href="/grand-demo-day">{e(L["back"])}</a><span class="gdd-snav__pn">{prev}{nxt}</span></nav></div></section>\n'
                f'    </div><!-- site:season:end -->\n  </main>')
        return out

    def gallery_html(self, lang):
        if not self.galleries:
            return ''
        T, many = self.T, len(self.galleries) > 1
        def sub(s):
            return ' · '.join([season_label(s['number'], lang)] + ([d_long(s['date'], lang)] if s.get('date') else []))
        def ul(s, gid):
            lis = ''
            for i, p in enumerate(self.gallery(s)):
                lis += (f'\n          <li class="gal__i"><button type="button" class="gal__b" data-i="{i}" aria-label="{ea(T(lang, "Foto") + " " + str(i + 1))}">'
                        f'<img src="{ea(self.src(p["id"]))}" alt="{ea(tx(p.get("alt"), lang))}" width="{p["width"]}" height="{p["height"]}" loading="lazy"></button></li>')
            return f'<ul class="gal" id="{gid}" data-noi18n>{lis}\n        </ul>'
        body = ''
        if many:
            body += '\n        <div class="mchips gal-tabs" role="tablist" data-noi18n>' + ''.join(
                f'<button type="button" class="mchip{" is-on" if k == 0 else ""}" role="tab" data-gal="{s["number"]}" aria-selected="{"true" if k == 0 else "false"}">{e(season_label(s["number"], lang))}</button>'
                for k, s in enumerate(self.galleries)) + '</div>'
            for k, s in enumerate(self.galleries):
                body += (f'\n        <div class="gal-set" data-gal="{s["number"]}"{"" if k == 0 else " hidden"}><p class="gdd-sub2" data-noi18n>{e(sub(s))}</p>\n        '
                         + ul(s, 'gdGal' if k == 0 else f'gdGal-{s["number"]}') + '</div>')
        else:
            s = self.galleries[0]
            body += f'\n        <p class="gdd-sub2" data-noi18n>{e(sub(s))}</p>\n        ' + ul(s, 'gdGal')
        return (f'\n    <section class="psec" id="lavhalar" aria-labelledby="g-gal">\n      <div class="container">\n'
                f'        <h2 class="psec__title" id="g-gal">{e(T(lang, "Tadbirdan lavhalar"))}</h2>{body}\n      </div>\n    </section>')

    def links(self, html):
        """data-site="register|apply" tugmalari — joriy mavsum havolalari."""
        s = self.hero or {}
        for k, field in (('register', 'registerUrl'), ('apply', 'applyUrl')):
            url = s.get(field)
            if url:
                html = re.sub(rf'(<a [^>]*data-site="{k}" href=")[^"]*(")', lambda m: m.group(1) + ea(url) + m.group(2), html)
        return html

    def fill_gdd(self, html, lang):
        html = fill(html, 'hero', self.hero_html(lang))
        html = fill(html, 'cover', self.cover_html(lang))
        html = fill(html, 'way', self.way_html(lang))
        html = fill(html, 'results', self.results_html(lang))
        html = fill(html, 'gallery', self.gallery_html(lang))
        return self.links(html)

    def fill_home(self, html, lang):
        s = self.hero
        meta = f'<ul class="gdd-home__meta reveal" data-noi18n>' + ''.join(f'<li>{e(x)}</li>' for x in (self.meta_items(s, lang) if s else [])) + '</ul>'
        if self.with_results:
            total, _, k = self.totals()
            sp = f'jami soft commitment — {k} mavsum davomida' if lang == 'uz' else f'total soft commitment — over {k} season{"s" if k != 1 else ""}'
            meta += f'\n            <div class="gdd-home__stat reveal" data-noi18n><b>{money_short(total)}</b><span>{e(sp)}</span></div>'
        return self.links(fill(html, 'home-gdd', meta))

    def event_ld(self, lang, url, description):
        s = self.hero
        if not s or not s.get('date'):
            return None
        times = re.findall(r'\b(\d{1,2}):(\d{2})\b', s.get('time') or '')
        def at(t):
            return f'{s["date"]}T{int(t[0]):02d}:{t[1]}:00+05:00'
        o = {'@context': 'https://schema.org', '@type': 'Event', 'name': f'Grand Demo Day {s["date"][:4]}', 'description': description,
             'startDate': at(times[0]) if times else s['date']}
        if len(times) > 1:
            o['endDate'] = at(times[1])
        place = tx(s.get('place'), 'en')
        o.update({'eventStatus': 'https://schema.org/EventScheduled', 'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
                  'location': {'@type': 'Place', 'name': place or 'Tashkent', 'address': {'@type': 'PostalAddress', 'addressLocality': 'Tashkent', 'addressCountry': 'UZ'}}})
        return o

    # ---------- /events ----------
    def event_card(self, ev, lang, past):
        T = self.T
        title, summary = tx(ev.get('title'), lang), tx(ev.get('summary'), lang)
        parts = [d_range(ev['dateFrom'], ev.get('dateTo'), lang, self.year)] + [x for x in (ev.get('time'), tx(ev.get('place'), lang)) if x]
        cover = None if past else self.src(ev.get('coverPhotoId')) if ev.get('coverPhotoId') in self.photos else None
        img = f'<span class="evc__img"><img src="{ea(cover)}" alt="{ea(title)}" loading="lazy"></span>' if cover else ''
        body = (f'<span class="evc__body"><span class="evc__date">{e(" · ".join(parts))}</span><b>{e(title)}</b>'
                + (f'<span>{e(summary)}</span>' if summary else ''))
        cls = 'evc' + ('' if cover else ' evc--past') + ' reveal'
        if ev.get('url'):
            return (f'<li class="{cls}" data-noi18n><a href="{ea(ev["url"])}"{ext_link(ev["url"])}>{img}{body}'
                    f'<span class="evc__go">{e(T(lang, "Batafsil"))} <span aria-hidden="true">→</span></span></span></a></li>')
        return f'<li class="{cls}" data-noi18n><div class="evc__box">{img}{body}</span></div></li>'

    def season_card(self, s, lang):
        T = self.T
        date = d_long(s['date'], lang) if s.get('date') else T(lang, 'Yakunlangan mavsum')
        sm = sum(float(r.get('amount') or 0) for r in s['results'])
        return (f'<li class="evc evc--past reveal" data-noi18n><a href="{season_href(s["number"])}"><span class="evc__body"><span class="evc__date">{e(date)}</span>'
                f'<b>{e(season_title(s, lang))}</b><span class="evc__amt">{money(sm)}</span><span>{e(T(lang, "Soft commitment natijalari, finalchilar va investorlar."))}</span>'
                f'<span class="evc__go">{e(T(lang, "Batafsil"))} <span aria-hidden="true">→</span></span></span></a></li>')

    def events_html(self, lang):
        T = self.T
        end = lambda ev: ev.get('dateTo') or ev['dateFrom']
        up = sorted((ev for ev in self.events if end(ev) >= self.today), key=lambda ev: (ev['dateFrom'], end(ev)))
        shown = {s['id'] for s in self.with_results if not (s.get('date') and s['date'] >= self.today)}
        past = [(end(ev), 0, self.event_card(ev, lang, True)) for ev in self.events
                if end(ev) < self.today and ev.get('gddSeasonId') not in shown]  # mavsum kartasi bor bo'lsa — takrorlanmasin
        past += [(s.get('date') or '', s['number'], self.season_card(s, lang)) for s in self.with_results if s['id'] in shown]
        past.sort(key=lambda x: (x[0], x[1]), reverse=True)
        out = ''
        if up:
            out += (f'<h2 class="psec__title" id="g-ev">{e(T(lang, "Yaqinlashayotgan tadbir"))}</h2>\n      <ul class="evl">'
                    + ''.join(f'\n        {self.event_card(ev, lang, False)}' for ev in up) + '\n      </ul>\n      '
                    f'<h2 class="psec__title evl-t2">{e(T(lang, "O‘tgan tadbirlar"))}</h2>')
        else:
            out += f'<h2 class="psec__title" id="g-ev">{e(T(lang, "O‘tgan tadbirlar"))}</h2>'
        out += '\n      <ul class="evl">' + ''.join(f'\n        {c}' for _, _, c in past)
        return out

    def fill_events(self, html, lang):
        return fill(html, 'events', self.events_html(lang))

    # ---------- /blog ----------
    def post_href(self, p):
        return p['url'] if p.get('url') else f'/blog/{p["slug"]}/'

    def pages(self):
        """O'z sahifasi bo'lgan postlar (body bor, url yo'q)."""
        return [p for p in self.news if not p.get('url') and tx(p.get('body'), 'uz')]

    def posts_html(self, lang, read, empty):
        if not self.news:
            return f'<p class="blsoon">{empty}</p>'
        cards = ''
        for p in self.news:
            src = self.src(p.get('coverPhotoId')) if p.get('coverPhotoId') in self.photos else None
            img = f'<span class="bp__img"><img src="{ea(src)}" alt="" loading="lazy"></span>' if src else ''
            href = self.post_href(p)
            cards += (f'<li class="bp reveal" data-noi18n><a href="{ea(href)}"{ext_link(href)}>{img}<span class="bp__body"><span class="bp__meta"><span class="bp__tag">{e(tx(p.get("tag"), lang))}</span>'
                      f'<span class="bp__date">{e(d_post(p["date"], lang))}</span></span><b>{e(tx(p.get("title"), lang))}</b><span class="bp__ex">{e(tx(p.get("excerpt"), lang))}</span>'
                      f'<span class="bp__go">{read} <span aria-hidden="true">→</span></span></span></a></li>\n')
        return f'<ul class="bposts">{cards}</ul>'

    def post_main(self, p, lang):
        T = self.T
        src = self.src(p.get('coverPhotoId')) if p.get('coverPhotoId') in self.photos else None
        ph = self.photos.get(p.get('coverPhotoId')) or {}
        fig = (f'\n      <figure class="post__img"><img src="{ea(src)}" alt="{ea(tx(ph.get("alt"), lang))}" width="{ph.get("width")}" height="{ph.get("height")}"></figure>'
               if src else '')
        paras = [x.strip() for x in re.split(r'\n\s*\n', tx(p.get('body'), lang).replace('\r\n', '\n')) if x.strip()]
        body = ''.join(f'\n        <p>{e(x).replace(chr(10), "<br>")}</p>' for x in paras)
        back = '← Blog'
        return (f'<main id="main">\n    <!-- site:post:start --><section class="phero" data-noi18n><div class="container">\n'
                f'      <h1 class="phero__title">{e(tx(p.get("title"), lang))}</h1>\n'
                + (f'      <p class="phero__lead">{e(tx(p.get("excerpt"), lang))}</p>\n' if tx(p.get('excerpt'), lang) else '')
                + f'    </div></section>\n'
                f'    <article class="psec psec--soft" data-noi18n><div class="container post">\n'
                f'      <p class="post__meta"><span class="bp__tag">{e(tx(p.get("tag"), lang))}</span><span class="bp__date">{e(d_post(p["date"], lang))}</span></p>{fig}\n'
                f'      <div class="post__body">{body}\n      </div>\n'
                f'      <p class="post__back"><a class="btn btn--ghost" href="/blog">{back}</a></p>\n'
                f'    </div></article><!-- site:post:end -->\n  </main>')
