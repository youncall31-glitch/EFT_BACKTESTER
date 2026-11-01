import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':390,'height':860}, device_scale_factor=2); ev = pg.evaluate
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file:///home/claude/v7/v7.html'); await pg.wait_for_timeout(1500)
        print('styles', await ev("[...document.querySelectorAll('input[name=sty]')].map(x=>x.value)"))
        await ev("(()=>{const r=document.querySelector('input[name=sty][value=Y]'); r.checked=true; r.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(1200)
        print('style Y note', await ev("document.querySelector('#st-note').textContent"), '| c label', await ev("document.querySelector('#st-c-l').textContent"))
        e = await pg.query_selector('#sec-style'); await e.screenshot(path='audit/m92_style.png')
        await ev("document.querySelector('#bn-more2').click()"); await pg.wait_for_timeout(300)
        await ev("document.querySelector('.sheet-i[data-go=g-flow]').click()"); await pg.wait_for_timeout(1500)
        print('cf buttons', await ev("[...document.querySelectorAll('#fl-cf button')].map(x=>x.textContent+':'+x.getAttribute('aria-pressed'))"))
        print('cards', await ev("document.querySelector('#fl-cards').innerText.replace(/\\s+/g,' ').slice(0,200)"))
        print('acc', await ev("document.querySelector('#t-acc').innerText.replace(/\\s+/g,' ').slice(0,200)"))
        print('presets', await ev("[...document.querySelectorAll('#fl-presets button')].map(x=>x.textContent)"))
        await ev("document.querySelectorAll('#fl-presets button')[2].click()"); await pg.wait_for_timeout(1000)
        print('preset3 cards', await ev("document.querySelector('#fl-cards').innerText.replace(/\\s+/g,' ').slice(0,160)"))
        await ev("(()=>{const r=document.querySelector('input[name=flt][value=us]'); r.checked=true; r.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(1000)
        print('tax us cards', await ev("document.querySelector('#fl-cards').innerText.replace(/\\s+/g,' ').slice(0,160)"))
        e = await pg.query_selector('#pane-flow'); await e.screenshot(path='audit/m92_flow.png')
        await ev("document.querySelector('#bnav a[data-g=g-sum]').click()"); await pg.wait_for_timeout(1000)
        print('res-flow', await ev("document.querySelector('#sec-res-flow').hidden"), await ev("document.querySelector('#t-rf').innerText.replace(/\\s+/g,' ').slice(0,160)"))
        print(await ev("document.documentElement.scrollWidth"), errs)
        await b.close()
asyncio.run(main())
