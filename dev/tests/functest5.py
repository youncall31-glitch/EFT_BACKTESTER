import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, time
from playwright.async_api import async_playwright
OUT=_T + '/'
DONE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True, device_scale_factor=2); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page()
        errs=[]; page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://'+OUT+'test.html')
        await page.wait_for_function(DONE, timeout=60000)
        ev = page.evaluate; txt = lambda s: ev(f"document.querySelector('{s}').textContent")
        # select all and run (mobile emulation, CPU not throttled)
        await page.tap('#o-all'); t0 = time.time(); await page.tap('#o-run')
        await page.wait_for_function(DONE, timeout=120000)
        print('all run', round(time.time() - t0, 1), 's |', await txt('#o-status'))
        # edit 은퇴 MDD -> instant re-pick, then re-search
        before = await ev("document.querySelector('#o-life td.stage-td[data-s=\"3\"][data-h=\"0\"]').innerText.replace(/\\n/g,' ')")
        await page.fill('#o-life input[data-s="3"][data-k="mdd"]', '12')
        await page.wait_for_timeout(400)
        mid = await txt('#o-status')
        await page.wait_for_function(DONE, timeout=60000)
        after = await ev("document.querySelector('#o-life td.stage-td[data-s=\"3\"][data-h=\"0\"]').innerText.replace(/\\n/g,' ')")
        print('edit: before', before, '| during:', mid[:40], '| after', after)
        # tap on scatter -> pick shows
        box = await (await page.query_selector('#c-front svg')).bounding_box()
        await page.mouse.click(box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.45)
        await page.wait_for_timeout(300)
        print('tap pick:', (await ev("document.querySelector('#front-pick').innerText")).replace('\n', ' ')[:120])
        # iOS zoom guard: computed font sizes of inputs on mobile
        print('input font sizes:', await ev("[...new Set([...document.querySelectorAll('select, input[type=number], input[type=text], textarea')].map(e=>getComputedStyle(e).fontSize))].join(',')"))
        sw = await ev("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        print('scroll/client', sw)
        for sel, name in [('section[aria-labelledby="h-saved"]', 'm_saved.png'), ('section[aria-labelledby="h-set"]', 'm_set.png')]:
            el = await page.query_selector(sel); await el.screenshot(path=OUT + name)
        await page.tap('#w-run'); await page.wait_for_function("document.querySelector('#w-table tbody') && !document.querySelector('#w-run').disabled", timeout=180000)
        el = await page.query_selector('#w-table'); await el.screenshot(path=OUT + 'm_walk.png')
        print('walk sum:', await txt('#w-sum'))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
