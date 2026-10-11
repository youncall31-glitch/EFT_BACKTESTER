import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
DONE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1280,'height':900}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page()
        errs=[]; page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://'+OUT+'test.html')
        await page.wait_for_function(DONE, timeout=60000)
        ev = page.evaluate
        sel = '#o-life input[data-s="3"][data-k="mdd"]'
        await page.click(sel); await page.keyboard.press('Control+A'); await page.keyboard.type('10'); await page.wait_for_timeout(500)
        print('focus kept:', await ev(f"document.activeElement === document.querySelector('{sel}')"), '| 은퇴 10y cell:', await ev("document.querySelector('#o-life td.stage-td[data-s=\"3\"][data-h=\"0\"]').innerText.replace(/\\n/g,' ')"))
        await page.keyboard.press('Control+A'); await page.keyboard.type('2'); await page.wait_for_timeout(400)
        print('invalid flagged:', await ev(f"document.querySelector('{sel}').getAttribute('aria-invalid')"))
        await page.click('#life-reset'); await page.wait_for_timeout(400)
        print('after reset values:', await ev("[...document.querySelectorAll('#o-life input')].map(i=>i.value).join(',')"))
        print('은퇴 10y cell:', await ev("document.querySelector('#o-life td.stage-td[data-s=\"3\"][data-h=\"0\"]').innerText.replace(/\\n/g,' ')"))
        # MDD range edit re-picks without rerun
        await page.fill('#o-lo', '10'); await page.fill('#o-hi', '20'); await page.wait_for_timeout(500)
        print('user range 10-20:', await ev("[...document.querySelectorAll('#o-hz .pick')].filter(p=>/내 기준/.test(p.querySelector('h3').textContent)).map(p=>p.querySelector('h3').textContent+' '+[...p.querySelectorAll('.kpi .v')].slice(0,2).map(x=>x.textContent).join('/')).join(' | ')"))
        print('status unchanged (no stale):', await ev("document.querySelector('#o-status').textContent.slice(0,40)"))
        # change rebalancing -> stale
        await page.select_option('#rebal', 'Q'); await page.wait_for_timeout(500)
        print('stale on rebal change:', await ev("document.querySelector('#o-status').textContent.slice(0,30)"), await ev("document.querySelector('#o-run').classList.contains('attn')"))
        await page.click('#o-run'); await page.wait_for_function(DONE, timeout=60000)
        print('rerun:', await ev("document.querySelector('#o-status').textContent"))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
