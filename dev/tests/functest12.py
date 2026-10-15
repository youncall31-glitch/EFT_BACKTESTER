import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
SH=_T + '/shots/'
T = lambda sel: f"(document.querySelector('{sel}')||{{innerText:''}}).innerText.replace(/\\s+/g,' ').trim()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='dark'); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){};document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true))"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=120000)
        # the user's own mix in card 1: QQQ 70 / IEF 22 / GLD 8
        await page.select_option('#preset-0', label='나스닥100 100%'); await page.wait_for_timeout(300)
        await page.fill('#wt-0-0', '70'); await page.click('.pcard[data-p="0"] .add'); await page.fill('#tk-0-1', 'IEF'); await page.fill('#wt-0-1', '22')
        await page.click('.pcard[data-p="0"] .add'); await page.fill('#tk-0-2', 'GLD'); await page.fill('#wt-0-2', '8'); await page.wait_for_timeout(600)
        print('P1:', await page.evaluate("document.querySelector('.pcard[data-p=\"0\"] .sum').textContent"))
        print('verdict:', await page.evaluate(T('#pc-verdict .vd-head')))
        for r in await page.evaluate("[...document.querySelectorAll('#pc-verdict .vd-row')].map(r=>r.innerText.replace(/\\s+/g,' '))"): print('  ', r[:300])
        # heat click: scroll into view first
        await page.eval_on_selector('#pc-heat', 'e => e.scrollIntoView({block:"center"})'); await page.wait_for_timeout(300)
        box = await (await page.query_selector('#pc-heat svg')).bounding_box()
        await page.mouse.move(box['x'] + box['width'] - 20, box['y'] + 26); await page.wait_for_timeout(150)
        print('tip:', await page.evaluate(T('#pc-heat .tip')))
        await page.mouse.click(box['x'] + box['width'] - 20, box['y'] + 26); await page.wait_for_timeout(400)
        print('after heat click custom:', await page.evaluate(T('#pc-custom .pc-title')), '| quick:', await page.evaluate("[...document.querySelectorAll('#pc-quick .chip')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent)"))
        await page.click('#pc-quick .chip'); await page.wait_for_timeout(300)
        await (await page.query_selector('#sec-period')).screenshot(path=SH + 'v7_d_period.png')
        await page.evaluate('scrollTo(0,0)'); await page.wait_for_timeout(200)
        await page.screenshot(path=SH + 'v7_d_top.png')
        await page.click('#tb-nav a[data-g="g-checks"]'); await page.wait_for_timeout(1500)
        print('nav on:', await page.evaluate("[...document.querySelectorAll('#tb-nav a.on')].map(a=>a.textContent)"))
        await (await page.query_selector('section[aria-labelledby="h-charts"]')).screenshot(path=SH + 'v7_d_charts.png')
        print('errors', errs); await ctx.close()
        # mobile light (folds open) + dark with every fold closed
        for scheme, closed, tag in [('light', False, 'm_light'), ('dark', True, 'm_closed_dark')]:
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=scheme, device_scale_factor=2); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){};document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('details[data-fold]').forEach(d=>d.open=true))"); page = await ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            await page.route('**/fonts.*/**', lambda r: r.abort())
            await page.goto('file://' + OUT + 'test.html'); await page.wait_for_timeout(2500)
            if closed: await page.click('#fold-close-all'); await page.wait_for_timeout(300)
            await page.screenshot(path=SH + f'v7_{tag}_top.png')
            await (await page.query_selector('#sec-period')).screenshot(path=SH + f'v7_{tag}_period.png')
            sw = await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            print(tag, sw, errs); await ctx.close()
        await b.close()
asyncio.run(main())
