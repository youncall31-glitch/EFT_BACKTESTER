import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
IDLE = "/평가/.test(document.querySelector('#o-status').textContent) && /가장 과거: \\d/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled && !/계산 중|다시 계산해요/.test(document.querySelector('#o-adj-note').textContent)"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        await page.route('**/fonts.*/**', lambda r: r.abort())
        t0 = asyncio.get_event_loop().time()
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=300000, polling=100)
        t1 = asyncio.get_event_loop().time()
        await page.wait_for_function(IDLE, timeout=300000, polling=200); await page.wait_for_timeout(300)
        t2 = asyncio.get_event_loop().time()
        print(f'first results {t1-t0:.1f}s, all done {t2-t0:.1f}s')
        print('status:', await page.evaluate("document.querySelector('#o-status').textContent"))
        print('elig:', (await page.evaluate("document.querySelector('#o-elig').textContent"))[:300])
        print('era note:', (await page.evaluate("document.querySelector('#o-era-note').textContent"))[:120])
        rows = await page.evaluate("[...document.querySelectorAll('#o-era tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))")
        for r in rows[:3]: print('  era:', r[:400])
        print('era head:', await page.evaluate("[...document.querySelectorAll('#o-era thead th')].map(x=>x.innerText.replace(/\\s+/g,' '))"))
        # switch to the oldest windows
        await page.click('#o-pos button[data-p="old"]'); await page.wait_for_timeout(500)
        print('pos note:', await page.evaluate("document.querySelector('#o-pos-note').textContent"))
        print('hz heads:', await page.evaluate("[...document.querySelectorAll('#o-hz .hz-head')].map(x=>x.innerText.replace(/\\s+/g,' '))"))
        print('life head:', await page.evaluate("[...document.querySelectorAll('#o-life thead th')].map(x=>x.innerText.replace(/\\s+/g,' '))"))
        print('front aria:', await page.evaluate("document.querySelector('#c-front svg') && document.querySelector('#c-front svg').getAttribute('aria-label')"))
        print('adj table:', await page.evaluate("[...document.querySelectorAll('#o-adj-cmp tbody tr')].slice(0,2).map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,200))"))
        # life detail in old position + save
        await page.click('#o-life .stage-cell >> nth=0'); await page.wait_for_timeout(300)
        print('life detail:', (await page.evaluate("document.querySelector('#life-pick h3').textContent")))
        await page.click('#life-pick .apply .save'); await page.wait_for_timeout(500)
        print('saved:', await page.evaluate("[...document.querySelectorAll('.sv-card')].slice(0,1).map(c=>c.innerText.replace(/\\n/g,' | ').slice(0,200))"))
        # shorter analysis period (2010.01~) -> oldest 20/30 not computable
        await page.select_option('#s-y', '2010'); await page.select_option('#s-m', '1'); await page.wait_for_timeout(500)
        await page.click('#o-run'); await page.wait_for_function(IDLE, timeout=300000, polling=200); await page.wait_for_timeout(300)
        print('short status:', await page.evaluate("document.querySelector('#o-status').textContent"))
        print('short era:', await page.evaluate("[...document.querySelectorAll('#o-era tbody tr')].slice(0,1).map(r=>r.innerText.replace(/\\s+/g,' ').slice(0,400))"))
        print('short hz (old):', await page.evaluate("[...document.querySelectorAll('#o-hz .hz-col')].map(x=>x.innerText.replace(/\\s+/g,' ').slice(0,90))"))
        # back to recent
        await page.click('#o-pos button[data-p="recent"]'); await page.wait_for_timeout(300)
        print('recent hz heads:', await page.evaluate("[...document.querySelectorAll('#o-hz .hz-head h3')].map(x=>x.textContent)"))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
