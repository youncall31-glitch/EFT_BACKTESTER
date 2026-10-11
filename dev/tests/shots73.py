import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, sys, json
from playwright.async_api import async_playwright
W=_T + '/'
OUT=_T + '/shots/'
# usage: shots73.py tag width scheme view "tab:selector:name,..." [eval-js]
tag, w, scheme, view, spec = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5]
extra = sys.argv[6] if len(sys.argv) > 6 else None
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':w,'height':900}, color_scheme=scheme)
        await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','tabs');localStorage.setItem('etf-backtester.view.v1','%s')}catch(e){}" % view)
        page = await ctx.new_page(); errs=[]
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://'+W+'test.html')
        await page.wait_for_function("document.querySelectorAll('#t-summary tbody tr').length > 5", timeout=60000); await page.wait_for_timeout(300)
        if extra:
            r = await page.evaluate(extra); print('eval:', json.dumps(r, ensure_ascii=False)[:3000])
        for item in spec.split(','):
            g, sel, nm = item.split(':')
            await page.evaluate(f"document.querySelector('#tb-nav a[data-g=\"{g}\"]').click()"); await page.wait_for_timeout(250)
            if g == 'g-opt':
                await page.wait_for_function("document.querySelectorAll('#o-life .stage-cell').length > 0 && !document.querySelector('#o-run').disabled && document.querySelector('#o-adj-cmp table')", timeout=240000, polling=500)
                if 'w-table' in sel:
                    await page.click('#w-run'); await page.wait_for_function("document.querySelectorAll('#w-table tbody tr').length > 0", timeout=240000, polling=500)
                await page.wait_for_timeout(300)
            loc = page.locator(sel).first
            await loc.scroll_into_view_if_needed(); await page.wait_for_timeout(150)
            # hide the sticky bars so they do not cover element shots
            await page.add_style_tag(content='.topbar,.bnav{visibility:hidden!important}')
            await loc.screenshot(path=f'{OUT}{tag}_{nm}.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
