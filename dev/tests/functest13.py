import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
SH=_T + '/shots/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='dark'); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){};document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true))"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=120000)
        rows = await page.evaluate("[...document.querySelectorAll('#t-risk tr')].map(r=>[...r.children].map(c=>c.innerText.replace(/\\s+/g,' ').trim()).join(' | ') + ([...r.querySelectorAll('td.best')].length ? '   [best:' + [...r.children].map((c,i)=>c.classList.contains('best')?i:null).filter(x=>x!==null).join(',') + ']' : ''))")
        for r in rows: print(r)
        await page.click('#dd-port .chip:nth-child(3)'); await page.wait_for_timeout(200)
        print('dd note:', await page.evaluate("document.querySelector('#dd-note').textContent"))
        for r in await page.evaluate("[...document.querySelectorAll('#t-dd tr')].map(r=>r.innerText.replace(/\\s+/g,' '))"): print('  ', r)
        await (await page.query_selector('#sec-risk')).screenshot(path=SH + 'v71_d_risk.png')
        await page.click('#dm button[data-v="adj"]'); await page.wait_for_timeout(300)
        print('adj martin row:', await page.evaluate("[...document.querySelectorAll('#t-risk tr')].find(r=>/마틴/.test(r.innerText)).innerText.replace(/\\s+/g,' ')"), '| mark:', await page.evaluate("!!document.querySelector('#h-risk .adj-mark')"))
        await page.click('#dm-off'); await page.wait_for_timeout(200)
        # v8: the whole risk section folds away; closed, nothing of it shows, open again it is all there
        await page.evaluate("document.querySelector('#sec-risk').open = false"); await page.wait_for_timeout(200)
        print('folded: risk rows visible', await page.evaluate("[...document.querySelectorAll('#t-risk tbody tr')].filter(r=>r.checkVisibility()).length"), '| dd visible', await page.evaluate("document.querySelector('#t-dd').checkVisibility()"))
        await page.click('#sec-risk > summary'); await page.wait_for_timeout(200)
        print('opened: risk rows visible', await page.evaluate("[...document.querySelectorAll('#t-risk tbody tr')].filter(r=>r.checkVisibility()).length"), '| dd visible', await page.evaluate("document.querySelector('#t-dd').checkVisibility()"))
        print('errors', errs); await ctx.close()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, color_scheme='light', device_scale_factor=2); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){};document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true))"); page = await ctx.new_page()
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html'); await page.wait_for_timeout(2500)
        await (await page.query_selector('#sec-risk')).screenshot(path=SH + 'v71_m_risk.png')
        print('mobile scroll', await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"))
        await b.close()
asyncio.run(main())
