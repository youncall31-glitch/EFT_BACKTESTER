import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, json
from playwright.async_api import async_playwright
SRC=_D + '/out/etf-backtester.html'
W=_T + '/'
SKEL='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>'
JS = """(() => { const out = {}; document.querySelectorAll('.pane.on .tbl-wrap').forEach(w => { if (!w.getClientRects().length) return; const t = w.querySelector('table'); if (!t) return; out[t.id || t.className] = [t.scrollWidth, w.clientWidth]; });
 const W = document.documentElement.clientWidth; const wide=[]; document.querySelectorAll('.pane.on *').forEach(e => { const r=e.getBoundingClientRect(); if (r.width && r.right > W + 1 && !e.closest('.tbl-wrap') && !e.closest('.scroll-x') && getComputedStyle(e).position!=='absolute') wide.push(e.tagName+'.'+e.className); });
 return {tables: out, page: [document.documentElement.scrollWidth, W], wide: wide.slice(0,5)}; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        open(W+'test.html','w',encoding='utf-8').write(SKEL+open(SRC,encoding='utf-8').read()+'</body></html>')
        for w in [360, 390, 600, 760, 820, 1024, 1280]:
            ctx = await b.new_context(viewport={'width':w,'height':900})
            await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','tabs')}catch(e){}")
            page = await ctx.new_page(); errs=[]
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
            await page.route('**/fonts.*/**', lambda r: r.abort())
            await page.goto('file://'+W+'test.html')
            await page.wait_for_function("document.querySelectorAll('#t-summary tbody tr').length > 5", timeout=60000); await page.wait_for_timeout(200)
            res = {}
            for g in ['g-results','g-checks']:
                await page.evaluate(f"document.querySelector('#tb-nav a[data-g=\"{g}\"]').click()"); await page.wait_for_timeout(300)
                res[g] = await page.evaluate(JS)
            print(w, json.dumps(res, ensure_ascii=False), 'errors', errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
