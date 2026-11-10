import asyncio, json
from playwright.async_api import async_playwright
JS = """
(sels) => {
  const lum = (c) => { const m = c.match(/[\\d.]+/g).map(Number); const f = (v)=>{v/=255; return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(m[0])+0.7152*f(m[1])+0.0722*f(m[2]); };
  const bgOf = (el) => { let e = el; while (e) { const b = getComputedStyle(e).backgroundColor; const a = b.match(/[\\d.]+/g); if (a && a.length===4 && Number(a[3])>0.5 || a && a.length===3) return b; e = e.parentElement; } return 'rgb(255,255,255)'; };
  return sels.map(s => { const el = document.querySelector(s); if (!el) return {s, missing:true};
    const cs = getComputedStyle(el); const fg = cs.color, bg = bgOf(el);
    const L1 = lum(fg), L2 = lum(bg); const r = (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
    return {s, fg, bg, ratio: Math.round(r*100)/100, text: el.textContent.trim().slice(0,30)}; });
}
"""
async def main():
    out = {}
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        for phase in ("night", "day", "evening"):
            c = await b.new_context(viewport={"width":1440,"height":900})
            p = await c.new_page(); await p.goto(f"http://127.0.0.1:5181/?time={phase}"); await p.wait_for_timeout(3500)
            r0 = await p.evaluate(JS, [".card__label", ".card__peers", ".card__list li", ".card__desc", ".hero__lead", ".stage__caption", ".eyebrow"])
            await p.evaluate("(()=>{const j=document.getElementById('journey');window.scrollTo(0, j.offsetTop + (j.offsetHeight-innerHeight)*0.5);})()"); await p.wait_for_timeout(1800)
            r1 = await p.evaluate(JS, [".card--left .card__list li", ".card--left .card__desc", ".card--left .card__cabin"])
            jbg = await p.evaluate("getComputedStyle(document.getElementById('journey')).backgroundColor")
            out[phase] = {"top": r0, "mid": r1, "journey_bg": jbg}
            if phase == "day":
                await p.evaluate("window.scrollTo(0,0)"); await p.wait_for_timeout(1500); await p.screenshot(path="day-top.png")
            await c.close()
        # day-theme slow load
        c = await b.new_context(viewport={"width":1440,"height":900})
        async def slow(route):
            await asyncio.sleep(8); await route.continue_()
        await c.route("**/scene-1536.webp", slow)
        p = await c.new_page(); await p.goto("http://127.0.0.1:5181/?time=day"); await p.wait_for_timeout(1500); await p.screenshot(path="day-slow.png")
        await c.close(); await b.close()
    print(json.dumps(out, indent=1, ensure_ascii=False))
asyncio.run(main())
