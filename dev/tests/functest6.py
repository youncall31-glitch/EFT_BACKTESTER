import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, time
from playwright.async_api import async_playwright
OUT=_T + '/'
DONE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled"
ADJDONE = DONE + " && !/다시 계산 중/.test(document.querySelector('#o-adj-note').textContent)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1280,'height':900}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page()
        errs=[]; page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        t0 = time.time()
        await page.goto('file://'+OUT+'test.html')
        await page.wait_for_function(ADJDONE, timeout=90000); await page.wait_for_timeout(500)
        print('boot+opt', round(time.time()-t0, 1), 's')
        ev = page.evaluate; txt = lambda s: ev(f"document.querySelector('{s}').textContent")
        print('note:', await txt('#tr-note'))
        print('list:', await ev("[...document.querySelectorAll('#t-trend-list tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))"))
        print('cmp:', await ev("[...document.querySelectorAll('#t-trend-cmp tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))"))
        print('adj note:', await txt('#o-adj-note'))
        rows = await ev("[...document.querySelectorAll('#o-adj-cmp tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,330))")
        for r in rows: print('  ', r)
        # switch view to adjusted
        await page.click('#o-view button[data-v=adj]'); await page.wait_for_timeout(300)
        print('view adj banner:', await ev("!!document.querySelector('.hz-banner')"), '| first card:', (await ev("document.querySelector('#o-hz .hz-col .pick').innerText")).replace('\n',' ')[:160])
        print('life 30y 은퇴:', await ev("document.querySelector('#o-life td.stage-td[data-s=\"3\"][data-h=\"2\"]').innerText.replace(/\\n/g,' ')"))
        print('scatter label:', await ev("document.querySelector('#c-front svg').getAttribute('aria-label')"))
        # save an adjusted pick -> meta says 추세 보정
        await page.click('#o-hz .hz-col:nth-child(2) .pick .apply .save'); await page.wait_for_timeout(300)
        print('saved meta:', await ev("document.querySelector('.sv-card .sv-p').textContent"), '|', await ev("document.querySelector('.sv-card .sv-name').value"))
        await page.click('#o-view button[data-v=actual]'); await page.wait_for_timeout(300)
        # untick gold family -> adjusted results become stale -> rerun adj
        await page.click('#t-trend-list input[data-fam="GLD"]'); await page.wait_for_timeout(300)
        print('after untick GLD: note:', await txt('#tr-note'), '| rerun visible:', await ev("!document.querySelector('#o-adj-rerun').hidden"), '|', await txt('#o-adj-note'))
        # threshold 10 -> SPY family flagged too
        await page.select_option('#tr-thr', '10'); await page.wait_for_timeout(300)
        print('thr10 list:', await ev("[...document.querySelectorAll('#t-trend-list tbody tr.flag th b')].map(b=>b.textContent).join(', ')"))
        await page.click('#o-adj-rerun'); await page.wait_for_function(ADJDONE, timeout=90000); await page.wait_for_timeout(300)
        print('rerun adj note:', (await txt('#o-adj-note'))[:120])
        rows = await ev("[...document.querySelectorAll('#o-adj-cmp tbody tr')].slice(0,2).map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,300))")
        for r in rows: print('  ', r)
        # trend off
        await page.uncheck('#tr-on'); await page.wait_for_timeout(300)
        print('off:', await txt('#tr-note'), '| cmp hidden:', await ev("document.querySelector('#tr-cmp-wrap').hidden"), '| view hidden:', await ev("document.querySelector('#o-view').hidden"), '|', await txt('#o-adj-note'))
        await page.check('#tr-on'); await page.wait_for_timeout(300)
        for sel, name in [('section[aria-labelledby="h-trend"]', 'd_trend.png'), ('#o-adj-sec', 'd_adjcmp.png')]:
            el = await page.query_selector(sel); await el.screenshot(path=OUT + name)
        print('errors:', errs)
        await b.close()
asyncio.run(main())
