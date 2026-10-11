import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
SRC=_D + '/out/etf-backtester.html'
OUT=_T + '/'
SKEL='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        open(OUT+'test.html','w',encoding='utf-8').write(SKEL+open(SRC,encoding='utf-8').read()+'</body></html>')
        for (w,h,scheme,lay) in [(1280,900,'light','tabs'),(390,844,'dark','tabs'),(768,1000,'light','page'),(390,844,'light','page')]:
            ctx = await b.new_context(viewport={'width':w,'height':h}, color_scheme=scheme)
            await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','%s')}catch(e){}" % lay)
            page = await ctx.new_page(); errs=[]
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
            await page.route('**/fonts.*/**', lambda r: r.abort())
            await page.goto('file://'+OUT+'test.html')
            await page.wait_for_function("document.querySelectorAll('#t-summary tbody tr').length > 5", timeout=60000); await page.wait_for_timeout(400)
            sw = await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            wide = await page.evaluate("""(() => { const W = document.documentElement.clientWidth; const out=[]; document.querySelectorAll('body *').forEach(e => { const r=e.getBoundingClientRect(); if (r.right > W + 1 && !e.closest('.tbl-wrap') && !e.closest('.scroll-x') && getComputedStyle(e).position!=='absolute') out.push(e.tagName+'.'+e.className+' '+Math.round(r.right)); }); return out.slice(0,8); })()""")
            print(w, scheme, lay, 'scroll/client', sw, 'errors', errs, 'wide', wide)
            await ctx.close()
        await b.close()
asyncio.run(main())
