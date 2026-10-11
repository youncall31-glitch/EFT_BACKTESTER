import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 390, 'height': 844}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=300000, polling=300)
        # custom asset with only Adj Close -> no income
        rows = ['Date,Adj Close'] + [f'{2019 + k // 12}-{k % 12 + 1:02d}-28,{100 * 1.01 ** k:.4f}' for k in range(40)]
        await page.evaluate("document.querySelector('#tick-groups ~ details').open = true")
        await page.fill('#cu-tk', 'NODV'); await page.fill('#cu-text', '\n'.join(rows)); await page.click('#cu-add'); await page.wait_for_timeout(400)
        print('msg:', await page.evaluate("document.querySelector('#cu-msg').textContent"))
        # use it in portfolio 3 and switch to cash
        await page.fill('#tk-2-0', 'NODV'); await page.fill('#wt-2-0', '100')
        for k in (1, 2):
            if await page.query_selector(f'#tk-2-{k}'):
                await page.fill(f'#tk-2-{k}', ''); await page.fill(f'#wt-2-{k}', '')
        await page.wait_for_timeout(400)
        await page.click('input[name="divm"][value="cash"]'); await page.wait_for_timeout(600)
        print('notice:', await page.evaluate("document.querySelector('#msg').textContent"))
        print('cov:', await page.evaluate("[...document.querySelectorAll('#cov .divsrc')].map(x=>x.textContent).filter(x=>/없음/.test(x))"))
        sw = await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        print('scroll/client', sw, 'errors', errs)
        await b.close()
asyncio.run(main())
