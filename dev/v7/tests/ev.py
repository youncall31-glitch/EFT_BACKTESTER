import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,tag in [(390,'m'),(1300,'d')]:
            pg=await b.new_page(viewport={'width':vw,'height':860},device_scale_factor=2 if vw<500 else 1); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); ev=pg.evaluate
            await pg.goto('file:///home/claude/v7/v7.html'); await pg.wait_for_timeout(1500)
            nav='#bnav' if vw<500 else '#tb-nav'
            await ev(f"document.querySelector('{nav} a[data-g=g-sum]').click()"); await pg.wait_for_timeout(1000)
            print(tag, await ev("document.querySelector('#rc-gh').textContent"), '|', await ev("[...document.querySelectorAll('#rc-grid td')].slice(0,6).map(t=>t.innerText.replace(/\\s+/g,' ')).join(' / ')"))
            # pick def-sma @ 5%
            await ev("document.querySelector('#rc-grid td[data-m=\"def-sma\"][data-tr=\"0.05\"]').click()"); await pg.wait_for_timeout(700)
            print(await ev("document.querySelector('#rc-ev-say').innerText"))
            print(await ev("document.querySelector('#rc-ev-tbl').innerText"))
            print('dots', await ev("document.querySelectorAll('#c-rc-ev circle').length"))
            if tag=='m':
                e=await pg.query_selector('#sec-recov'); await e.screenshot(path='/home/claude/v7/audit/m99_recov.png')
            print(tag, errs, await ev('document.documentElement.scrollWidth'))
            await pg.close()
        await b.close()
asyncio.run(main())
