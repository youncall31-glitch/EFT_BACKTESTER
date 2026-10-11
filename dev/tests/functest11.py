import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, json
from playwright.async_api import async_playwright
OUT=_T + '/'
IDLE = "/가장 과거: \\d/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled && !/계산 중|다시 계산해요/.test(document.querySelector('#o-adj-note').textContent)"
T = lambda sel: f"(document.querySelector('{sel}')||{{innerText:''}}).innerText.replace(/\\s+/g,' ').trim()"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=120000)
        print('verdict:', await page.evaluate(T('#pc-verdict .vd-head')))
        for r in await page.evaluate("[...document.querySelectorAll('#pc-verdict .vd-row')].map(r=>r.innerText.replace(/\\s+/g,' '))"): print('  ', r[:260])
        rows = await page.evaluate("[...document.querySelectorAll('#pc-table tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' '))")
        print('table rows', len(rows)); [print('  ', r) for r in rows]
        print('heat cells', await page.evaluate("document.querySelectorAll('#pc-heat rect').length"), 'legend', await page.evaluate(T('#pc-legend')))
        print('custom:', (await page.evaluate(T('#pc-custom')))[:400])
        print('quick:', await page.evaluate("[...document.querySelectorAll('#pc-quick .chip')].map(b=>b.textContent+(b.getAttribute('aria-pressed')==='true'?'*':''))"))
        print('dm-note:', await page.evaluate(T('#dm-note')))
        s0 = await page.evaluate("[...document.querySelectorAll('#t-summary tbody tr')].find(r=>/CAGR/.test(r.innerText)).innerText.replace(/\\s+/g,' ')")
        print('summary CAGR actual:', s0)
        # ---- switch to trend-kept data
        await page.click('#dm button[data-v="adj"]'); await page.wait_for_timeout(400)
        s1 = await page.evaluate("[...document.querySelectorAll('#t-summary tbody tr')].find(r=>/CAGR/.test(r.innerText)).innerText.replace(/\\s+/g,' ')")
        print('summary CAGR adjusted:', s1)
        print('banner hidden?', await page.evaluate("document.querySelector('#dm-banner').hidden"), '|', await page.evaluate(T('#dm-banner')))
        print('sum-note:', await page.evaluate(T('#sum-note')))
        print('marks:', await page.evaluate("[...document.querySelectorAll('.adj-mark')].map(m=>m.closest('h2,span')&&m.parentElement.id)"))
        await page.click('#pc-port .chip:nth-child(2)'); await page.wait_for_timeout(300)
        print('verdict P2 adj:', await page.evaluate(T('#pc-verdict .vd-head')))
        for r in await page.evaluate("[...document.querySelectorAll('#pc-verdict .vd-row')].map(r=>r.innerText.replace(/\\s+/g,' '))"): print('  ', r[:260])
        # trend table still compares actual vs adjusted (not adjusted vs adjusted)
        print('trend cmp row2:', (await page.evaluate("[...document.querySelectorAll('#t-trend-cmp tbody tr')][1].innerText.replace(/\\s+/g,' ')"))[:200])
        # ---- turning the trend adjustment off returns to actual data
        await page.click('#tr-on'); await page.wait_for_timeout(400)
        print('after tr-on off: dataAdj banner hidden?', await page.evaluate("document.querySelector('#dm-banner').hidden"), 'pressed:', await page.evaluate("[...document.querySelectorAll('#dm button')].map(b=>b.getAttribute('aria-pressed'))"), 'note:', await page.evaluate(T('#dm-note')))
        await page.click('#dm button[data-v="adj"]'); await page.wait_for_timeout(400)
        print('adj again -> tr-on checked?', await page.evaluate("document.querySelector('#tr-on').checked"), 'banner hidden?', await page.evaluate("document.querySelector('#dm-banner').hidden"))
        await page.click('#dm-off'); await page.wait_for_timeout(300)
        # ---- heat click and custom selects
        await page.click('#pc-port .chip:nth-child(1)'); await page.wait_for_timeout(300)
        box = await (await page.query_selector('#pc-heat svg')).bounding_box()
        await page.mouse.click(box['x'] + box['width'] - 20, box['y'] + 26); await page.wait_for_timeout(300)
        print('after heat click custom:', (await page.evaluate(T('#pc-custom .pc-title'))))
        await page.select_option('#pc-sy', '2008'); await page.select_option('#pc-sm', '1'); await page.select_option('#pc-ey', '2012'); await page.select_option('#pc-em', '12'); await page.wait_for_timeout(300)
        print('custom select:', await page.evaluate(T('#pc-custom')))
        await page.click('#pc-metric button[data-m="mdd"]'); await page.wait_for_timeout(200)
        print('mdd legend:', await page.evaluate(T('#pc-legend')))
        # ---- simple view: persists, defers the optimizer on load
        await page.wait_for_function(IDLE, timeout=300000, polling=300)
        await page.click('#v-simple'); await page.wait_for_timeout(200)
        vis = await page.evaluate("['#sec-period','section[aria-labelledby=\"h-opt\"]','#simple-opt','section[aria-labelledby=\"h-roll\"]','#g-ref','#pc-custom-sec'].map(s=>{const e=document.querySelector(s);return s+':'+(e&&e.getClientRects().length>0)})")
        print('simple visible:', vis)
        print('summary rows simple:', await page.evaluate("[...document.querySelectorAll('#t-summary tbody tr')].filter(r=>r.getClientRects().length).map(r=>r.querySelector('th').textContent)"))
        await page.reload(); await page.wait_for_timeout(2500)
        print('after reload simple?', await page.evaluate("document.documentElement.classList.contains('simple')"), 'o-status:', (await page.evaluate(T('#o-status')))[:80])
        await page.click('#v-full'); await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=120000)
        print('full again o-status:', (await page.evaluate(T('#o-status')))[:80])
        await page.click('#tb-nav a[data-g="g-checks"]'); await page.wait_for_timeout(900)
        print('nav on:', await page.evaluate("[...document.querySelectorAll('#tb-nav a.on')].map(a=>a.textContent)"), 'scrollY', await page.evaluate('scrollY'))
        await page.click('#v-full')
        print('upd summary:', await page.evaluate(T('#upd summary')))
        print('errors', errs)
        await b.close()
asyncio.run(main())
