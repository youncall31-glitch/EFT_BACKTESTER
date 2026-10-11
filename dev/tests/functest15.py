# v7.3: MDD 구분 panel, period labels on every table, phone cards, walk queue, sign formatting
import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, json, re
from playwright.async_api import async_playwright
OUT=_T + '/'
READY = "document.querySelectorAll('#t-summary tbody tr').length > 5"
async def open_page(b, w, h, layout='tabs', view='full', scheme='light'):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme)
    await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','%s');localStorage.setItem('etf-backtester.view.v1','%s')}catch(e){}" % (layout, view))
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    await page.route('**/fonts.*/**', lambda r: r.abort())
    await page.goto('file://' + OUT + 'test.html'); await page.wait_for_function(READY, timeout=60000); await page.wait_for_timeout(300)
    return ctx, page, errs
async def tab(page, g): await page.evaluate(f"document.querySelector('#tb-nav a[data-g=\"{g}\"]').click()"); await page.wait_for_timeout(250)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx, page, errs = await open_page(b, 1280, 900)
        ev = page.evaluate
        await tab(page, 'g-results')
        # 1 MDD panel rows and consistency with the other tables
        mdd = await ev("""[...document.querySelectorAll('#t-mdd tbody tr')].map(r => [r.querySelector('th').childNodes[0].textContent, ...[...r.querySelectorAll('td')].map(td => td.childNodes[0] ? td.childNodes[0].textContent : '')])""")
        for r in mdd: print('mdd', r)
        summ = await ev("""(() => { const r = [...document.querySelectorAll('#t-summary tbody tr')].find(r => /MDD · 전체/.test(r.children[0].textContent)); return [...r.querySelectorAll('td')].map(td => td.childNodes[0].textContent); })()""")
        trail = await ev("""[...document.querySelectorAll('#t-trail tbody tr')].map(r => { const td = r.querySelectorAll('td'); return [td[1], td[5]].map(x => x.querySelector('.cellbar span').textContent); })""")
        print('summary MDD', summ, '| trail 10y/20y MDD', trail)
        r1 = lambda s: round(float(s.replace('−', '-').replace('%', '')), 1)
        ok_full = all(abs(r1(a) - r1(b2)) < 0.051 for a, b2 in zip(mdd[0][1:], summ))
        ok_10 = all(abs(r1(a) - r1(t[0])) < 0.051 for a, t in zip(mdd[1][1:], trail)); ok_20 = all(abs(r1(a) - r1(t[1])) < 0.051 for a, t in zip(mdd[2][1:], trail))
        roll10 = await ev("""[...document.querySelectorAll('#t-roll tbody tr:not(.ph)')].slice(0, 4).map(r => r.querySelectorAll('td')[4].childNodes[0].textContent)""")
        ok_roll = all(abs(r1(a) - r1(b2)) < 0.051 for a, b2 in zip(mdd[3][1:], roll10))
        risk = await ev("""(() => { const r = [...document.querySelectorAll('#t-risk tbody tr')]; const f = re => r.find(x => re.test(x.children[0].textContent)); return [f(/보통의 10년 MDD/), f(/평균 낙폭/)].map(x => [...x.querySelectorAll('td')].map(td => td.textContent)); })()""")
        ok_risk = mdd[4][1:] == risk[0] and mdd[5][1:] == risk[1]
        print('consistent: full', ok_full, '10y', ok_10, '20y', ok_20, 'roll10', ok_roll, 'risk', ok_risk)
        print('mdd note:', await ev("document.querySelector('#mdd-note').textContent"))
        # 2 trailing headers carry the period; group cells are real table cells
        heads = await ev("""[[...document.querySelectorAll('#t-trail thead tr:first-child th.grp')].map(th => th.querySelector('.gname').textContent + '|' + getComputedStyle(th).display), [...document.querySelectorAll('#t-trail thead tr:last-child th')].slice(1, 5).map(th => th.textContent)]""")
        print('trail heads', heads)
        print('roll groups', await ev("[...document.querySelectorAll('#t-roll tr.ph .gname')].map(x => x.textContent)"), '| chips', await ev("document.querySelectorAll('#t-roll .hzc').length"))
        print('section dividers', await ev("[...document.querySelectorAll('.gsec')].map(g => getComputedStyle(g).display).join(',')"), '| th.grp displays', await ev("[...new Set([...document.querySelectorAll('th.grp')].map(t => getComputedStyle(t).display))]"))
        # 3 optimizer: queue the walk while the optimizer is busy
        await tab(page, 'g-opt')
        await page.wait_for_function("document.querySelector('#o-run').disabled", timeout=10000)
        await page.click('#w-run'); queued = await ev("document.querySelector('#w-status').textContent")
        await page.wait_for_function("document.querySelectorAll('#w-table tbody tr').length > 0", timeout=240000, polling=300)
        print('walk queued msg:', queued, '| rows', await ev("document.querySelectorAll('#w-table tbody tr').length"))
        print('opt group heads', await ev("""['#o-life', '#o-adj-cmp table', '#o-era table', '#w-table'].map(s => [...document.querySelectorAll(s + ' thead th.grp')].map(t => t.childNodes[0].textContent).join('/'))"""))
        # 4 signs: no '−0.0' / '-0.0', no hyphen-minus numbers in values, anywhere in the app
        for g in ['g-setup', 'g-results', 'g-checks', 'g-opt']:
            await tab(page, g)
        txt = await ev("document.querySelector('.wrap').innerText")
        print('neg zero:', re.findall(r'[−-]0\.0+%p?(?!\d)', txt)[:5], '| hyphen numbers:', sorted(set(re.findall(r'(?<![\w.~])-\d+(?:\.\d+)?%', txt)))[:8])
        print('errors', errs)
        await ctx.close()
        # 5 phone: cards with portfolio names, trailing by period, nothing wider than the screen
        ctx, page, errs = await open_page(b, 390, 844, scheme='dark'); ev = page.evaluate
        await tab(page, 'g-results')
        vis = await ev("""['.trail-wide', '.trail-narrow'].map(s => !!document.querySelector(s).getClientRects().length)""")
        lab = await ev("""[...document.querySelectorAll('#t-summary td, #t-mdd td, #t-risk td')].filter(td => !td.dataset.label).length""")
        cardcols = await ev("""getComputedStyle(document.querySelector('#t-summary tbody tr')).display""")
        before = await ev("""getComputedStyle(document.querySelector('#t-mdd tbody td'), '::before').content""")
        ph = await ev("""[...document.querySelectorAll('#t-trail-m tr.ph')].map(r => r.querySelector('.gname').textContent + ' ' + r.querySelector('.when').textContent)""")
        print('phone trail wide/narrow visible', vis, '| unlabeled cells', lab, '| row display', cardcols, '| label', before)
        print('phone trail periods', ph)
        res = {}
        for g in ['g-setup', 'g-results', 'g-checks', 'g-opt']:
            await tab(page, g)
            if g == 'g-opt': await page.wait_for_function("document.querySelectorAll('#o-life .stage-cell').length > 0", timeout=240000, polling=300)
            res[g] = await ev("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
        caps = await ev("[...document.querySelectorAll('#o-era .cell-cap')].slice(0, 3).map(c => c.textContent)")
        print('phone widths', res, '| era caps', caps)
        print('errors', errs)
        await ctx.close()
        # 6 short period (< 10 years), one portfolio, no benchmark, simple view
        ctx, page, errs = await open_page(b, 390, 844, view='simple'); ev = page.evaluate
        await page.select_option('#s-y', '2019'); await page.select_option('#s-m', '1'); await page.wait_for_timeout(400)
        await page.select_option('#bench', ''); await page.wait_for_timeout(300)
        await page.click('.pcard[data-p="1"] .clr') if await page.locator('.pcard[data-p="1"] .clr').count() else None
        await tab(page, 'g-results')
        mdd = await ev("""[...document.querySelectorAll('#t-mdd tbody tr')].filter(r => r.getClientRects().length).map(r => r.querySelector('th').childNodes[0].textContent + ': ' + [...r.querySelectorAll('td')].map(td => td.textContent).join(' | '))""")
        for r in mdd: print('short mdd', r)
        print('short note:', await ev("document.querySelector('#mdd-note').textContent"))
        print('short trail-m:', await ev("[...document.querySelectorAll('#t-trail-m tr.ph')].map(r => r.textContent).join(' / ')"))
        print('errors', errs)
        await ctx.close()
        await b.close()
asyncio.run(main())
