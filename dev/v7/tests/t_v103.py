import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for vw,tag in [(390,'m'),(1300,'d')]:
            pg=await b.new_page(viewport={'width':vw,'height':860},device_scale_factor=2 if vw<500 else 1); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e))); ev=pg.evaluate
            await pg.goto('file:///home/claude/v7/v7.html'); await pg.wait_for_timeout(1500)
            nav='#bnav' if vw<500 else '#tb-nav'
            await ev(f"document.querySelector('{nav} a[data-g=g-results]').click()"); await pg.wait_for_timeout(1500)
            print(tag,'say', await ev("document.querySelector('#rl-say').innerText"))
            print(await ev("document.querySelector('#rl-tbl').innerText"))
            print(await ev("document.querySelector('#rl-note').innerText"))
            e=await pg.query_selector('#sec-real'); await e.screenshot(path=f'audit/{tag}103_real.png')
            await ev("document.querySelector('#rl-how').open=true"); await pg.wait_for_timeout(800)
            print('how', await ev("document.querySelector('#rl-how-x').innerText"))
            print('svgs', await ev("['#c-rl-exp','#c-rl-era','#c-rl-start','#c-rl-bond','#c-rl-sc'].map(s=>s+':'+document.querySelectorAll(s+' svg').length).join(' ')"))
            if tag=='d':
                for H in ['10','30']:
                    await ev(f"(()=>{{const s=document.querySelector('#rl-h'); s.value='{H}'; s.dispatchEvent(new Event('change'))}})()"); await pg.wait_for_timeout(800)
                    print('H',H, await ev("document.querySelector('#rl-tbl').innerText.replace(/\\n/g,' | ')"))
                await ev("(()=>{const s=document.querySelector('#rl-h'); s.value='20'; s.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(500)
            await ev(f"document.querySelector('{nav} a[data-g=g-opt]').click()"); await pg.wait_for_timeout(9000)
            print('ai st', await ev("document.querySelector('#sum-ai-st').innerText.slice(0,120)"))
            print('ai', await ev("document.querySelector('#sum-ai').innerText.slice(0,900)"))
            print('aisay', await ev("document.querySelector('#ai-say').innerText"))
            print('aikpi', await ev("document.querySelector('#ai-kpi').innerText"))
            e=await pg.query_selector('#sum-4'); await e.screenshot(path=f'audit/{tag}103_ai.png')
            await pg.wait_for_timeout(8000)
            print('wf', await ev("document.querySelector('#ai-wf').innerText.slice(0,700)"))
            e=await pg.query_selector('#sec-ai-check'); await e.screenshot(path=f'audit/{tag}103_aichk.png')
            if tag=='d':
                await ev("(()=>{const s=document.querySelector('#sum-crit'); s.value='past'; s.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(3000)
                print('PAST ai', await ev("document.querySelector('#sum-ai').innerText.slice(0,600)"))
            print(tag, errs, await ev('document.documentElement.scrollWidth'))
            await pg.close()
        await b.close()
asyncio.run(main())
