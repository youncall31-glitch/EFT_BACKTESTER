import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, json
from playwright.async_api import async_playwright
OUT=_T + '/'
IDLE = "/평가/.test(document.querySelector('#o-status').textContent) && !document.querySelector('#o-run').disabled && !/계산 중|다시 계산해요/.test(document.querySelector('#o-adj-note').textContent)"
SUMROWS = "[...document.querySelectorAll('#t-summary tbody tr')].map(r=>[r.querySelector('th').textContent, ...[...r.querySelectorAll('td')].map(td=>td.childNodes[0] ? td.childNodes[0].textContent : '')])"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900})
        await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','page')}catch(e){}"); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html')
        await page.wait_for_function(IDLE, timeout=240000, polling=200); await page.wait_for_timeout(300)
        before = await page.evaluate(SUMROWS)
        print('reinvest rows:', [r[0] for r in before][:4], before[2])
        # switch to cash
        await page.click('input[name="divm"][value="cash"]'); await page.wait_for_timeout(600)
        after = await page.evaluate(SUMROWS)
        for r in after[:8]: print('  ', r)
        vis = await page.evaluate("({inc: !document.querySelector('#inc-chart').hidden, svg: !!document.querySelector('#c-inc svg'), trail: !document.querySelector('#trail-div').hidden, roll: !document.querySelector('#roll-div').hidden, odiv: !document.querySelector('#o-div-note').hidden, divlines: document.querySelectorAll('.divline').length, cov: document.querySelectorAll('#cov .divsrc').length, trailSub: [...document.querySelectorAll('#t-trail td .sub')].filter(x=>/배당 연/.test(x.textContent)).length, ann: document.querySelector('#ann-title').textContent, note: document.querySelector('#sum-note').textContent})")
        print('cash UI:', vis)
        # consistency: page summary vs a fresh engine run for portfolio 1
        chk = await page.evaluate("""(() => {
          const s = BT.idxOf(+document.querySelector('#s-y').value, +document.querySelector('#s-m').value), e = BT.idxOf(+document.querySelector('#e-y').value, +document.querySelector('#e-m').value);
          const st = BT.stats(BT.backtest(['SPY','IEF'], [60,40], s, e, document.querySelector('#rebal').value, false, true));
          return {cagr: (st.cagr*100).toFixed(2)+'%', inc: Math.round(st.income.total*10000), ttm: (st.income.ttmYield*100).toFixed(2)+'%', wealth: (st.income.wealthCagr*100).toFixed(2)+'%'};
        })()""")
        print('engine P1:', chk)
        print('cov sample:', await page.evaluate("[...document.querySelectorAll('#cov .divsrc')].slice(0,4).map(x=>x.textContent)"))
        print('divline:', await page.evaluate("document.querySelector('.divline') && document.querySelector('.divline').textContent"))
        print('trend cmp head:', await page.evaluate("[...document.querySelectorAll('#t-trend-cmp tbody tr')].map(r=>r.innerText.replace(/\\s+/g,' ')).slice(0,3)"))
        # income chart tooltip
        await page.hover('#c-inc svg rect >> nth=5'); await page.wait_for_timeout(200)
        print('inc tip:', await page.evaluate("document.querySelector('#c-inc .tip').innerText.replace(/\\n/g,' | ')"))
        # real mode on top of cash
        await page.click('#real'); await page.wait_for_timeout(800)
        print('real+cash:', (await page.evaluate(SUMROWS))[1:4])
        await page.wait_for_function(IDLE, timeout=240000, polling=200); await page.wait_for_timeout(300)
        print('real+cash divlines:', await page.evaluate("document.querySelectorAll('.divline').length"))
        await page.click('#real'); await page.wait_for_function(IDLE, timeout=240000, polling=200); await page.wait_for_timeout(300)
        # save portfolio card in cash mode
        await page.click('.pcard[data-p="0"] .sv'); await page.wait_for_timeout(500)
        print('saved card:', await page.evaluate("[...document.querySelectorAll('.sv-card')].slice(0,1).map(c=>c.innerText.replace(/\\n/g,' | '))"))
        # life-stage detail shows the cash line
        await page.click('#o-life .stage-cell >> nth=0'); await page.wait_for_timeout(300)
        print('life detail divline:', await page.evaluate("!!document.querySelector('#life-pick .divline')"))
        # frontier click shows the cash line
        box = await page.evaluate("(() => { const r = document.querySelector('#c-front svg').getBoundingClientRect(); return [r.left + r.width*0.5, r.top + r.height*0.5]; })()")
        await page.mouse.click(box[0], box[1]); await page.wait_for_timeout(300)
        print('front pick divline:', await page.evaluate("!!document.querySelector('#front-pick .divline')"))
        # custom CSV with Close and Adj Close
        rows = ['Date,Open,High,Low,Close,Adj Close,Volume']
        c, a = 100.0, 100.0
        for k in range(36):
            y, m = 2020 + k // 12, k % 12 + 1
            c *= 1.005; a *= 1.005 + 0.002
            rows.append(f'{y}-{m:02d}-28,0,0,0,{c:.4f},{a:.4f},0')
        await page.evaluate("document.querySelector('#tick-groups ~ details').open = true")
        await page.fill('#cu-tk', 'TSTX'); await page.fill('#cu-text', '\n'.join(rows)); await page.click('#cu-add'); await page.wait_for_timeout(500)
        print('custom msg:', await page.evaluate("document.querySelector('#cu-msg').textContent"))
        dd = await page.evaluate("(() => { const a = BT.D.assets.TSTX; return [a.d.slice(0,3), a.dsrc, BT.hasIncome('TSTX')]; })()")
        print('custom d:', dd)
        # back to reinvest
        await page.click('input[name="divm"][value="re"]'); await page.wait_for_timeout(600)
        back = await page.evaluate(SUMROWS)
        print('reinvest again same as before:', back[:3] == before[:3], '| inc hidden:', await page.evaluate("document.querySelector('#inc-chart').hidden"), '| divlines:', await page.evaluate("document.querySelectorAll('.divline').length"))
        print('errors:', errs)
        await b.close()
asyncio.run(main())
