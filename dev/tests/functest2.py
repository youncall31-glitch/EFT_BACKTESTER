import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, math, time
from playwright.async_api import async_playwright
OUT=_T + '/'
DONE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); ctx = await b.new_context(viewport={'width':1280,'height':900}); await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page()
        errs=[]; page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://'+OUT+'test.html')
        await page.wait_for_function(DONE, timeout=60000)
        ev = page.evaluate
        txt = lambda sel: ev(f"document.querySelector('{sel}').textContent")
        cards = lambda: ev("[...document.querySelectorAll('#o-hz .hz-col')].map(c => c.querySelector('h3').textContent + ' | ' + [...c.querySelectorAll('.pick')].map(p => p.querySelector('h3').textContent + ': ' + [...p.querySelectorAll('.kpi .v')].map(x=>x.textContent).join('/') + ' [' + [...p.querySelectorAll('.wbar')].map(x=>x.querySelector('.tk').textContent+' '+x.querySelector('.pct').textContent).join(', ') + ']' + (p.querySelector('.badge') ? ' (근사)' : '')).join(' || '))")
        life = lambda: ev("[...document.querySelectorAll('#o-life tbody tr')].map(r => r.querySelector('th b').textContent + ': ' + [...r.querySelectorAll('td.stage-td')].map(td => td.innerText.replace(/\\n/g,' ')).join(' | '))")
        print('1 status:', await txt('#o-status'))
        for c in await cards(): print('  ', c)
        for l in await life(): print('  ', l)
        print('  elig:', await txt('#o-elig'))
        # 2 select all + run
        await page.click('#o-all'); await page.wait_for_timeout(200)
        print('2 count:', await txt('#o-count'), '| stale:', await txt('#o-status'), '| attn:', await ev("document.querySelector('#o-run').classList.contains('attn')"))
        print('  elig:', await txt('#o-elig'))
        t0 = time.time(); await page.click('#o-run'); await page.wait_for_function(DONE, timeout=120000)
        print('  run all:', round(time.time()-t0,1), 's |', await txt('#o-status'))
        for c in await cards(): print('  ', c)
        for l in await life(): print('  ', l)
        # 3 recovery limit 2 years
        await page.select_option('#o-uw', '24'); await page.wait_for_timeout(300)
        print('3 uw<=2y:'); 
        for c in await cards(): print('  ', c)
        print('  crit:', await txt('#o-crit'))
        # 4 edit stage cap 30대 MDD 25
        await page.fill('#o-life input[data-s="0"][data-k="mdd"]', '25'); await page.wait_for_timeout(600)
        print('4 30대 MDD<=25:', (await life())[0])
        # 5 click stage cell (40대, 20년) and apply to P2
        await page.click('#o-life .stage-cell[data-s="1"][data-h="1"]'); await page.wait_for_timeout(300)
        print('5 detail:', (await ev("document.querySelector('#life-pick').innerText")).replace('\n',' | ')[:400])
        await page.click('#life-pick .apply button:nth-of-type(2)'); await page.wait_for_timeout(600)
        print('  P2 now:', await ev("document.querySelector('#pname-1').value"), await ev("[...document.querySelectorAll('.pcard')[1].querySelectorAll('.prow')].map(r=>r.querySelector('.tk').value+':'+r.querySelector('.wt').value).join(', ')"))
        print('  stale after apply?:', await txt('#o-status'))
        # 6 scatter tab
        await page.click('#o-ftabs button:nth-child(3)'); await page.wait_for_timeout(300)
        print('6 scatter:', await ev("document.querySelector('#c-front svg').getAttribute('aria-label')"), '| legend:', await txt('#lg-front'))
        # 7 click scatter point
        box = await (await page.query_selector('#c-front svg')).bounding_box()
        await page.mouse.move(box['x']+box['width']*0.45, box['y']+box['height']*0.5); await page.wait_for_timeout(150)
        await page.mouse.click(box['x']+box['width']*0.45, box['y']+box['height']*0.5); await page.wait_for_timeout(200)
        print('7 front pick:', (await ev("document.querySelector('#front-pick').innerText")).replace('\n',' | ')[:300])
        # 8 none + run
        await page.click('#o-none'); await page.click('#o-run'); await page.wait_for_timeout(200)
        print('8 none:', await txt('#o-status'))
        # 9 group toggle
        await page.click('#o-picker .gname[data-group="채권 · 현금"]'); await page.wait_for_timeout(200)
        print('9 group:', await txt('#o-count'), await ev("[...document.querySelectorAll('#o-picker .tchip[aria-pressed=true]')].map(c=>c.dataset.t).join(',')"))
        await page.click('#o-picker .gname[data-group="실물 자산 · 리츠"]'); await page.click('#o-picker .tchip[data-t="QQQ"]'); await page.select_option('#o-step', '0.1')
        await page.click('#o-run'); await page.wait_for_function(DONE, timeout=120000)
        print('  run bonds+real+QQQ @10%:', await txt('#o-status'))
        for c in await cards(): print('  ', c)
        # 10 custom ticker
        lines=['Date,Adj Close']; v=100.0
        for i in range(60):
            y=2020+(i//12); m=i%12+1; v*=1+0.01*math.sin(i)
            lines.append(f'{y}-{m:02d}-01,{v:.4f}')
        await page.click('#tick-groups ~ details summary'); await page.fill('#cu-tk','TEST1'); await page.fill('#cu-text','\n'.join(lines)); await page.click('#cu-add'); await page.wait_for_timeout(300)
        print('10 custom:', await txt('#cu-msg'), '| picker has:', await ev("!!document.querySelector('#o-picker .tchip[data-t=TEST1]')"), await ev("[...document.querySelectorAll('#o-picker .gname')].map(g=>g.textContent).join(',')"))
        # 11 etf-only mode eligibility
        await page.uncheck('#ext'); await page.wait_for_timeout(500)
        print('11 etf-only elig:', await txt('#o-elig'))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
