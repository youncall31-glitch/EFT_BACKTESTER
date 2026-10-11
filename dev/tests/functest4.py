import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, math
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
        ev = page.evaluate; txt = lambda s: ev(f"document.querySelector('{s}').textContent")
        cagr_row = "[...document.querySelectorAll('#t-summary tbody tr')].find(r=>/CAGR/.test(r.children[0].textContent)).innerText.replace(/\\s+/g,' ')"
        print('1 nominal:', await txt('#sum-note'), '|', await ev(cagr_row))
        await page.check('#real'); await page.wait_for_timeout(300)
        await page.wait_for_function(DONE, timeout=60000)
        print('  real   :', await txt('#sum-note'), '|', await ev(cagr_row))
        print('  opt status:', await txt('#o-status'))
        await page.uncheck('#real'); await page.wait_for_timeout(300); await page.wait_for_function(DONE, timeout=60000)
        # 2 walk-forward
        await page.click('#w-run'); await page.wait_for_function("document.querySelector('#w-table tbody') && !document.querySelector('#w-run').disabled", timeout=120000)
        print('2 walk sum:', await txt('#w-sum'))
        rows = await ev("[...document.querySelectorAll('#w-table tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,230))")
        for r in rows: print('   ', r)
        # 3 save portfolio card 1 + optimizer pick
        await page.click('.pcard[data-p="0"] .sv'); await page.wait_for_timeout(300)
        await page.click('#o-hz .hz-col:nth-child(2) .pick:nth-of-type(2) .apply .save'); await page.wait_for_timeout(300)
        print('3 saved:', await txt('#sv-count'), '|', await txt('#sv-msg'), '|', await txt('#sv-where'))
        print('  cards:', await ev("[...document.querySelectorAll('.sv-card')].map(c=>c.innerText.replace(/\\s+/g,' ').slice(0,160))"))
        # 4 load the saved optimizer pick into P3, then delete it (two-step)
        await page.click('.sv-card:first-child button[data-act=load][data-p="2"]'); await page.wait_for_timeout(500)
        print('4 P3 now:', await ev("document.querySelector('#pname-2').value"), await ev("[...document.querySelectorAll('.pcard')[2].querySelectorAll('.prow')].map(r=>r.querySelector('.tk').value+':'+r.querySelector('.wt').value).join(', ')"))
        # export all -> import -> duplicates
        await page.click('#sv-export'); await page.wait_for_timeout(200)
        code = await ev("document.querySelector('#io-text').value")
        print('  export code len', len(code), code[:20])
        await page.click('#sv-import'); await page.fill('#io-text', code); await page.click('#io-add'); await page.wait_for_timeout(400)
        print('  import:', await txt('#io-msg'), '| count', await txt('#sv-count'))
        await page.click('.sv-card:first-child button[data-act=del]'); await page.wait_for_timeout(100)
        print('  del armed:', await ev("document.querySelector('.sv-card:first-child button[data-act=del]').textContent"))
        await page.click('.sv-card:first-child button[data-act=del]'); await page.wait_for_timeout(300)
        print('  after delete count:', await txt('#sv-count'))
        # rename
        await page.fill('.sv-card:first-child .sv-name', '내 은퇴 후보 A'); await page.wait_for_timeout(900)
        # 5 reload -> persisted?
        await page.reload(); await page.wait_for_function(DONE, timeout=60000); await page.wait_for_timeout(300)
        print('5 after reload count:', await txt('#sv-count'), '| first:', await ev("document.querySelector('.sv-card .sv-name') && document.querySelector('.sv-card .sv-name').value"))
        # 6 date clamp bug: end 2005-12 then SCHD in P1
        await page.select_option('#e-y', '2005'); await page.select_option('#e-m', '12'); await page.wait_for_timeout(400)
        await page.fill('#tk-0-0', 'SCHD'); await page.wait_for_timeout(600)
        print('6 clamp:', await txt('#sum-note'), '|', await txt('#msg'))
        # 7 12-month minimum with end close to data start
        await page.select_option('#s-y', '2011'); await page.select_option('#s-m', '11'); await page.select_option('#e-y', '2012'); await page.select_option('#e-m', '4'); await page.wait_for_timeout(500)
        print('7 min12:', await txt('#sum-note'), '|', await txt('#msg'))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
