import asyncio, json, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/v7/v7.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 390, 'height': 860})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        log = lambda *a: print(*a, flush=True)
        ev = pg.evaluate
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        msg = lambda: ev("(document.querySelector('#msg')||{}).textContent||''")
        qr = lambda: ev("document.querySelector('#qr-body').innerText.replace(/\\s+/g,' ').slice(0,160)")
        log('BOOT', await qr(), '|', await msg())
        # --- setup controls
        for q in ['30', '10', 'max']:
            r = await ev(f"(()=>{{const c=document.querySelector('#quick .chip[data-q=\"{q}\"]'); if(!c) return 'no chip'; c.click(); return 'ok'}})()"); await pg.wait_for_timeout(500)
            log('quick', q, r, await qr())
        await ev("(()=>{const e=document.querySelector('#rebal'); e.value='Q'; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(500); log('rebal Q', await qr())
        await ev("(()=>{const e=document.querySelector('#real'); e.checked=true; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(500); log('real', await qr())
        await ev("(()=>{const e=document.querySelector('#real'); e.checked=false; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(300)
        await ev("document.querySelector('#dm button[data-v=adj]').click()"); await pg.wait_for_timeout(700); log('dm adj', await qr(), '| banner hidden:', await ev("document.querySelector('#dm-banner').hidden"), await ev("document.querySelector('#dm-banner-txt').textContent"))
        await ev("document.querySelector('#dm button[data-v=act]').click()"); await pg.wait_for_timeout(500); log('dm act', await qr())
        await ev("(()=>{const e=document.querySelector('#rebal'); e.value='A'; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(500)
        # --- results tab
        await ev("document.querySelector('#bnav a[data-g=g-sum]').click()"); await pg.wait_for_timeout(1200)
        log('RES svgs', await ev("['#c-sum-bf','#c-growth','#c-dd','#c-recov','#c-guard'].map(s=>s+':'+document.querySelectorAll(s+' svg').length).join(' ')"))
        log('ax-lin', await ev("(()=>{document.querySelector('#ax-lin').click(); return document.querySelector('#ax-lin').getAttribute('aria-pressed')})()"))
        log('recov cell', await ev("(()=>{const c=document.querySelectorAll('#rc-grid td[data-m]')[3]; c.click(); return document.querySelector('#rc-ep-say').textContent.slice(0,80)})()"))
        log('recov port2', await ev("(()=>{document.querySelectorAll('#rc-port button')[1].click(); return document.querySelector('#rc-say').innerText.slice(0,100)})()"))
        await ev("document.querySelector('#guard-fold').open=true"); await pg.wait_for_timeout(500)
        log('guard', await ev("document.querySelector('#g-kpi').innerText.replace(/\\s+/g,' ')"), await ev("document.querySelectorAll('#c-guard svg').length"))
        await ev("document.querySelector('#sec-annual').open=true"); await pg.wait_for_timeout(500)
        log('annual svgs', await ev("document.querySelectorAll('#sec-annual svg').length"))
        # --- verify tab
        await ev("document.querySelector('#bnav a[data-g=g-results]').click()"); await pg.wait_for_timeout(1200)
        log('VER', await ev("document.querySelector('#vd-cards').innerText.slice(0,60).replace(/\\s+/g,' ')"), await ev("document.querySelectorAll('#c-spread svg, #c-corr table, #c-corr-dn svg').length"))
        await ev("document.querySelector('#sp-m button[data-m=m]').click()"); await pg.wait_for_timeout(300)
        log('spread mdd', await ev("document.querySelector('#c-spread svg').getAttribute('aria-label')"))
        await ev("document.querySelector('#cr-p button[data-p=e2]').click()"); await pg.wait_for_timeout(300)
        log('corr e2', await ev("document.querySelector('#cr-when').textContent"))
        await ev("document.querySelector('#cr-ref button[data-t=SPY]').click()"); await pg.wait_for_timeout(300)
        log('corr ref', await ev("document.querySelector('#cr-dn-say').textContent.slice(0,40)"))
        await ev("document.querySelector('#evid').open=true"); await pg.wait_for_timeout(300)
        log('evid trust table rows', await ev("document.querySelectorAll('#t-trust tr').length"))
        # --- AI tab
        await ev("document.querySelector('#bnav a[data-g=g-opt]').click()")
        for i in range(400):
            await pg.wait_for_timeout(500)
            if await ev("!!document.querySelector('#sum-ai .ai-rec')"): break
        log('AI first', i, await ev("document.querySelector('#sum-ai-st').textContent.slice(0,120)"), '|', await ev("(document.querySelector('#sum-ai .ai-kv')||{}).innerText"))
        # change cap
        await ev("(()=>{const e=document.querySelector('#sum-cap'); e.value='0.2'; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(1500)
        log('cap 20', await ev("(document.querySelector('#sum-ai .ai-kv')||document.querySelector('#sum-ai')).innerText.replace(/\\s+/g,' ').slice(0,200)"))
        log('ai-check say', await ev("document.querySelector('#ai-say').textContent.slice(0,140)"))
        # change uw
        await ev("(()=>{const e=document.querySelector('#sum-uw'); e.value=e.options[2].value; e.dispatchEvent(new Event('change'))})()"); await pg.wait_for_timeout(1500)
        log('uw', await ev("document.querySelector('#sum-uw').value"), await ev("(document.querySelector('#sum-ai .ai-kv')||document.querySelector('#sum-ai')).innerText.replace(/\\s+/g,' ').slice(0,200)"))
        # weights shown
        log('weights', await ev("(document.querySelector('#sum-ai .wbars')||{innerText:'NONE'}).innerText.replace(/\\s+/g,' ').slice(0,120)"))
        # add TLT via the top select
        await ev("(()=>{const s=document.querySelector('#sum-tk .tkx-add'); s.value='TLT'; s.dispatchEvent(new Event('change'))})()")
        await pg.wait_for_timeout(1500)
        log('after add TLT: status', await ev("document.querySelector('#sum-ai-st').textContent.slice(0,80)"), '| chips', await ev("[...document.querySelectorAll('#sum-tk .tkx-n')].map(x=>x.textContent).join(',')"))
        for i in range(400):
            await pg.wait_for_timeout(500)
            if await ev("!!document.querySelector('#sum-ai .ai-rec') && !document.querySelector('#sum-ai-st').textContent.startsWith('계산 중')"): break
        log('auto rerun', i, await ev("document.querySelector('#sum-ai-st').textContent.slice(0,120)"), '|', await ev("(document.querySelector('#sum-ai .wbars')||{innerText:'NONE'}).innerText.replace(/\\s+/g,' ').slice(0,120)"))
        # remove GLD with x
        await ev("(()=>{const x=[...document.querySelectorAll('#sum-tk .tkx')].find(c=>c.textContent.startsWith('GLD')); x.querySelector('.tkx-x').click()})()")
        for i in range(400):
            await pg.wait_for_timeout(500)
            if await ev("!!document.querySelector('#sum-ai .ai-rec') && !document.querySelector('#sum-ai-st').textContent.startsWith('계산 중') && !document.querySelector('#sum-ai-st').textContent.includes('바뀌')"): break
        log('after remove GLD', i, await ev("[...document.querySelectorAll('#sum-tk .tkx-n')].map(x=>x.textContent).join(',')"), await ev("(document.querySelector('#sum-ai .wbars')||{innerText:'NONE'}).innerText.replace(/\\s+/g,' ').slice(0,120)"))
        # back to my portfolio tickers
        await ev("(()=>{const b=[...document.querySelectorAll('#sum-tk button')].find(x=>x.textContent.includes('내 포트폴리오')); b && b.click()})()")
        await pg.wait_for_timeout(800)
        log('reset tickers', await ev("[...document.querySelectorAll('#sum-tk .tkx-n')].map(x=>x.textContent).join(',')"))
        # step change
        await ev("(()=>{const e=document.querySelector('#o-step'); e.value='0.1'; e.dispatchEvent(new Event('change'))})()")
        for i in range(400):
            await pg.wait_for_timeout(500)
            if await ev("document.querySelector('#sum-ai-st').textContent.includes('10% 단위') && !!document.querySelector('#sum-ai .ai-rec')"): break
        log('step 10%', i, await ev("document.querySelector('#sum-ai-st').textContent.slice(0,120)"))
        # o-run directly
        await ev("document.querySelector('#o-run').click()"); await pg.wait_for_timeout(1000)
        log('o-run status', await ev("document.querySelector('#o-status').textContent.slice(0,120)"))
        # apply to portfolio 3
        r = await ev("(()=>{const b=[...document.querySelectorAll('#sum-ai .apply button')].find(x=>x.textContent.includes('포트폴리오 3')); if(!b) return 'no apply'; b.click(); return 'ok'})()"); await pg.wait_for_timeout(1200)
        log('apply', r, await qr())
        # wf
        for i in range(200):
            await pg.wait_for_timeout(500)
            if await ev("!!document.querySelector('#ai-wf .wf')"): break
        log('wf', i, await ev("document.querySelector('#ai-wf').innerText.slice(0,160).replace(/\\s+/g,' ')"), await ev("document.querySelector('#ai-wf-st').textContent"))
        # --- flow tab
        await ev("document.querySelector('#bn-more2').click()"); await pg.wait_for_timeout(300)
        await ev("document.querySelector('.sheet-i[data-go=g-flow]').click()"); await pg.wait_for_timeout(1200)
        log('FLOW', await ev("document.querySelector('#pane-flow').innerText.slice(0,200).replace(/\\s+/g,' ')"))
        log('flow svgs', await ev("document.querySelectorAll('#pane-flow svg').length"))
        # change portfolio 1 ticker IEF -> TLT, AI tickers should follow
        await ev("document.querySelector('#bnav a[data-g=g-setup]').click()"); await pg.wait_for_timeout(600)
        r = await ev("(()=>{const i=[...document.querySelectorAll('#ports input')].find(x=>x.value==='IEF'); if(!i) return 'no input'; i.value='TLT'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); return 'ok'})()")
        await pg.wait_for_timeout(1500)
        log('port edit', r, await qr())
        await ev("document.querySelector('#bnav a[data-g=g-opt]').click()")
        for i in range(400):
            await pg.wait_for_timeout(500)
            if await ev("!!document.querySelector('#sum-ai .ai-rec') && !document.querySelector('#sum-ai-st').textContent.startsWith('계산 중')"): break
        log('AI after port edit', i, await ev("[...document.querySelectorAll('#sum-tk .tkx-n')].map(x=>x.textContent).join(',')"), await ev("document.querySelector('#sum-ai-st').textContent.slice(0,100)"))
        # dm3
        await ev("document.querySelector('#bnav a[data-g=g-sum]').click()"); await pg.wait_for_timeout(800)
        for v in ['adj', 'both', 'act']:
            await ev(f"document.querySelector('#dm3 button[data-v={v}]').click()"); await pg.wait_for_timeout(900)
            log('dm3', v, await ev("document.querySelector('#dm3-st').textContent"), '| tcmp hidden', await ev("document.querySelector('#sec-tcmp').hidden"), await ev("document.querySelectorAll('#c-tcmp svg').length"), await ev("document.querySelector('#tcmp-say').textContent.slice(0,120)"))
        log('errors', errs)
        await b.close()
asyncio.run(main())
