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
            for m in ['cagr','mdd','uw','rec']:
                await ev(f"document.querySelector('#rc-m button[data-m={m}]').click()"); await pg.wait_for_timeout(500)
                print(tag, m, await ev("document.querySelector('#rc-gh').textContent"), '|', await ev("[...document.querySelectorAll('#rc-grid td')].slice(0,3).map(t=>t.innerText.replace(/\\s+/g,' ')).join(' / ')"))
            await ev("document.querySelector('#rc-m button[data-m=cagr]').click()"); await pg.wait_for_timeout(500)
            await ev("document.querySelector('#rc-all').closest('details').open=true"); await pg.wait_for_timeout(400)
            print('all rows', await ev("document.querySelectorAll('#rc-all tbody tr').length"), await ev("document.querySelector('#rc-all tbody').innerText.split('\\n').slice(0,3).join(' | ')"))
            # click a scatter point
            await ev("(()=>{const c=document.querySelectorAll('#c-rc-sc circle')[5]; c.dispatchEvent(new MouseEvent('click',{bubbles:true}))})()"); await pg.wait_for_timeout(600)
            print('after click', await ev("document.querySelector('#rc-ep-say').textContent.slice(0,90)"))
            e=await pg.query_selector('#sec-recov'); await e.screenshot(path=f'/home/claude/v7/audit/{tag}98_recov.png')
            print(tag, errs, await ev('document.documentElement.scrollWidth'))
            await pg.close()
        await b.close()
asyncio.run(main())
