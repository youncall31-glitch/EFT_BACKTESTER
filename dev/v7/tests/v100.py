import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,tag in [(390,'m'),(1300,'d')]:
            pg=await b.new_page(viewport={'width':vw,'height':860},device_scale_factor=2 if vw<500 else 1); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); ev=pg.evaluate
            await pg.goto('file:///home/claude/v7/v7.html'); await pg.wait_for_timeout(1500)
            nav='#bnav' if vw<500 else '#tb-nav'
            await ev(f"document.querySelector('{nav} a[data-g=g-sum]').click()"); await pg.wait_for_timeout(1200)
            print(tag, 'say', await ev("document.querySelector('#sum-say').innerText.slice(0,180)"))
            e=await pg.query_selector('#sum-1'); await e.screenshot(path=f'audit/{tag}100_sum1.png')
            print('rc-say', await ev("document.querySelector('#rc-say').innerText"))
            for t in ['0.05','0.15']:
                await ev(f"document.querySelector('#rc-t button[data-t=\"{t}\"]').click()"); await pg.wait_for_timeout(600)
                print(t, await ev("document.querySelector('#rc-say').innerText.slice(0,160)"))
            await ev("document.querySelector('#rc-t button[data-t=\"0.1\"]').click()"); await pg.wait_for_timeout(600)
            e=await pg.query_selector('#sec-recov'); await e.screenshot(path=f'audit/{tag}100_recov.png')
            for d in ['rc-d-ev','rc-d-ep','rc-d-all']:
                await ev(f"document.querySelector('#{d}').open=true"); await pg.wait_for_timeout(500)
            print('svgs', await ev("['#c-rc-main','#c-rc-ev','#c-recov','#c-rc-sc'].map(s=>s+':'+document.querySelectorAll(s+' svg').length).join(' ')"), await ev("document.querySelectorAll('#rc-grid td').length"))
            # click a row in the main chart (hit rect)
            await ev("(()=>{const r=[...document.querySelectorAll('#c-rc-main rect')].filter(x=>x.style.cursor==='pointer')[3]; r.dispatchEvent(new MouseEvent('click',{bubbles:true}))})()"); await pg.wait_for_timeout(700)
            print('picked', await ev("document.querySelector('#rc-ev-say').innerText.slice(0,80)"))
            await ev(f"document.querySelector('{nav} a[data-g=g-results]').click()"); await pg.wait_for_timeout(1000)
            await ev("document.querySelector('#sp-m button[data-m=u]').click()"); await pg.wait_for_timeout(500)
            e=await pg.query_selector('#sec-spread'); await e.screenshot(path=f'audit/{tag}100_spread.png')
            print(tag, errs, await ev('document.documentElement.scrollWidth'))
            await pg.close()
        await b.close()
asyncio.run(main())
