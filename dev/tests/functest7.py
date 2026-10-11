import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, json
from playwright.async_api import async_playwright
OUT=_T + '/'
IDLE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled && !/계산 중|다시 계산해요/.test(document.querySelector('#o-adj-note').textContent)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        # 1) toggle real while the automatic adjusted run is in progress
        await page.wait_for_function("/추세 보정 데이터로/.test(document.querySelector('#o-adj-note').textContent)", timeout=180000, polling=5)
        await page.click('#real')
        await page.wait_for_timeout(500)
        await page.wait_for_function(IDLE, timeout=120000); await page.wait_for_timeout(500)
        st = await page.evaluate("document.querySelector('#o-status').textContent")
        print('1 status:', st[-40:], '| adj note:', (await page.evaluate("document.querySelector('#o-adj-note').textContent"))[:40])
        # verify the 20y '내 기준' adjusted pick stats equal a fresh real-unit adjusted backtest
        chk = await page.evaluate("""(() => {
          const row = [...document.querySelectorAll('#o-adj-cmp tbody tr')][1];
          const td = row.querySelectorAll('td')[1];
          return td.innerText.replace(/\\n/g,' | ');
        })()""")
        print('  20y 내 기준 cell:', chk[:200])
        # 2) 3x fund follows its index: SOXL/GLD/IEF/SPY universe
        await page.click('#o-none')
        for t in ['SOXL', 'GLD', 'IEF', 'SPY']: await page.click(f'#o-picker .tchip[data-t="{t}"]')
        await page.click('#o-run'); await page.wait_for_function(IDLE, timeout=120000); await page.wait_for_timeout(300)
        rows = await page.evaluate("[...document.querySelectorAll('#t-trend-list tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))")
        print('2 list:', [r for r in rows if 'SOX' in r])
        a1 = await page.evaluate("document.querySelector('#o-adj-note').textContent")
        print('  adj note:', a1[:60])
        await page.click('#t-trend-list input[data-fam="SOXX"]'); await page.wait_for_timeout(300)
        rows = await page.evaluate("[...document.querySelectorAll('#t-trend-list tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))")
        print('  after untick SOXX:', [r for r in rows if 'SOX' in r])
        await page.wait_for_function(IDLE, timeout=120000); await page.wait_for_timeout(300)
        print('  adj note after:', (await page.evaluate("document.querySelector('#o-adj-note').textContent"))[:80])
        # 3) manually tick SPY -> nothing 3x in the universe, but SPY itself adjusted
        await page.click('#t-trend-list input[data-fam="SPY"]'); await page.wait_for_timeout(300)
        await page.wait_for_function(IDLE, timeout=120000); await page.wait_for_timeout(300)
        print('3 adj note:', (await page.evaluate("document.querySelector('#o-adj-note').textContent"))[:80])
        print('errors:', errs)
        await b.close()
asyncio.run(main())
