import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, sys
from playwright.async_api import async_playwright
SRC=_D + '/out/etf-backtester.html'
W=_T + '/'
OUT=_T + '/shots/'
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'
SKEL='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>'
PANELS = [('g-results','#t-summary','sum'),('g-results','#sec-risk','risk'),('g-results','#t-trail','trail'),('g-results','#t-roll','roll'),
          ('g-checks','#sec-period','period'),('g-checks','#t-trend-cmp','trendcmp'),
          ('g-opt','#o-era-sec','era'),('g-opt','#o-adj-sec','adj'),('g-opt','#o-hz','hz'),('g-opt','#o-life','life'),('g-opt','#w-table','walk')]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        open(W+'test.html','w',encoding='utf-8').write(SKEL+open(SRC,encoding='utf-8').read()+'</body></html>')
        for (w,h,scheme,view) in [(390,844,'light','full'),(390,844,'dark','full'),(1280,900,'light','full'),(390,844,'light','simple')]:
            ctx = await b.new_context(viewport={'width':w,'height':h}, color_scheme=scheme, device_scale_factor=1)
            await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','tabs');localStorage.setItem('etf-backtester.view.v1','%s')}catch(e){}" % view)
            page = await ctx.new_page(); errs=[]
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
            await page.route('**/fonts.*/**', lambda r: r.abort())
            await page.goto('file://'+W+'test.html')
            await page.wait_for_function("document.querySelectorAll('#t-summary tbody tr').length > 5", timeout=60000); await page.wait_for_timeout(300)
            tag = f'{TAG}_{w}_{scheme}_{view}'
            for g in ['g-setup','g-results','g-checks','g-opt']:
                await page.evaluate(f"document.querySelector('#tb-nav a[data-g=\"{g}\"]').click()")
                if g == 'g-opt' and view == 'full':
                    await page.wait_for_function("document.querySelectorAll('#o-life .stage-cell').length > 0 && !document.querySelector('#o-run').disabled && document.querySelector('#o-era table') && document.querySelector('#o-adj-cmp table')", timeout=240000, polling=500); await page.wait_for_timeout(500)
                    await page.click('#w-run'); await page.wait_for_function("document.querySelectorAll('#w-table tbody tr').length > 0", timeout=240000, polling=500)
                await page.wait_for_timeout(400)
                await page.screenshot(path=f'{OUT}{tag}_{g}.png', full_page=True)
            for (g, sel, nm) in PANELS:
                if view == 'simple' and g == 'g-opt': continue
                await page.evaluate(f"document.querySelector('#tb-nav a[data-g=\"{g}\"]').click()"); await page.wait_for_timeout(150)
                loc = page.locator(sel)
                if await loc.count() and await loc.is_visible():
                    await loc.scroll_into_view_if_needed(); await page.wait_for_timeout(100)
                    await loc.screenshot(path=f'{OUT}{tag}_p_{nm}.png')
            print(tag, 'errors', errs)
            await ctx.close()
        await b.close()
asyncio.run(main())
