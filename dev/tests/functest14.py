import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio
from playwright.async_api import async_playwright
OUT=_T + '/'
SH=_T + '/shots/'
VIS = "s => { const e = document.querySelector(s); return !!(e && e.checkVisibility()); }"
async def vis(page, sels): return {s: await page.evaluate(VIS, s) for s in sels}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html'); await page.wait_for_timeout(1500)
        print('load tabs:', await page.evaluate("document.documentElement.classList.contains('tabs')"), await vis(page, ['.hdr', '#pane-setup', '#pane-results', '#sec-qr', '#sec-ports', '.pane-nav']))
        print('quick results:', await page.evaluate("[...document.querySelectorAll('#qr-body tbody tr')].map(x=>x.innerText.replace(/\\s+/g,' '))"))
        print('opt before:', await page.evaluate("document.querySelector('#o-status').textContent"))
        await page.click('#tb-nav a[data-g="g-results"]'); await page.wait_for_timeout(500)
        print('results tab:', await vis(page, ['.hdr', '#pane-setup', '#pane-results', '#sec-risk']), 'hash', await page.evaluate('location.hash'), 'growth svg w', await page.evaluate("document.querySelector('#c-growth svg').getAttribute('width')"), 'aria', await page.evaluate("[...document.querySelectorAll('#tb-nav a')].map(a=>a.getAttribute('aria-selected'))"))
        await page.click('#pane-results .pane-nav button[data-go="g-checks"]'); await page.wait_for_timeout(400)
        print('next btn ->', await page.evaluate("document.documentElement.dataset.tab"), 'heat w', await page.evaluate("document.querySelector('#pc-heat svg').getAttribute('width')"), 'scrollY', await page.evaluate('scrollY'))
        await page.click('#tb-nav a[data-g="g-opt"]')
        await page.wait_for_function("/평가/.test(document.querySelector('#o-status').textContent)", timeout=120000)
        print('opt ran on tab open:', (await page.evaluate("document.querySelector('#o-status').textContent"))[:60])
        await page.wait_for_function("document.querySelectorAll('#o-hz .apply button').length > 0", timeout=60000)
        await page.click('#o-hz .apply button:nth-of-type(2)'); await page.wait_for_timeout(600)
        print('after apply:', await page.evaluate("document.documentElement.dataset.tab"), '| toast:', await page.evaluate("document.querySelector('#toast').hidden ? '' : document.querySelector('#toast').textContent"), '| P2 name:', await page.evaluate("document.querySelector('#pname-1').value"))
        # ported fix: a typed 0 in the MDD ceiling stays 0
        await page.click('#tb-nav a[data-g="g-opt"]'); await page.click('details[data-fold="o-crit"] > summary'); await page.fill('#o-hi', '0'); await page.wait_for_timeout(500)
        print('crit summary:', await page.evaluate("document.querySelector('#o-crit-sum').textContent"))
        await page.click('#o-run'); await page.wait_for_timeout(300)
        print('o-hi=0 ->', await page.evaluate("document.querySelector('#o-status').textContent"))
        await page.fill('#o-hi', '30'); await page.wait_for_timeout(400)
        # switch to the one-page layout and back; persistence
        await page.click('#tb-nav a[data-g="g-ref"]'); await page.click('#lay-page'); await page.wait_for_timeout(400)   # v8: the layout switch lives in 도움말 › 화면 설정
        print('page layout:', await page.evaluate("document.documentElement.classList.contains('tabs')"), await vis(page, ['#pane-results', '#pane-opt', '#sec-qr', '.pane-nav', '#sec-hero']), 'stored', await page.evaluate("localStorage.getItem('etf-backtester.layout.v1')"))
        await page.reload(); await page.wait_for_timeout(2500)
        print('after reload layout tabs?', await page.evaluate("document.documentElement.classList.contains('tabs')"), '| opt status:', (await page.evaluate("document.querySelector('#o-status').textContent"))[:30])
        await page.click('#tb-nav a[data-g="g-checks"]'); await page.wait_for_timeout(900)
        print('page-mode nav scroll:', await page.evaluate('scrollY') > 1000, await page.evaluate("[...document.querySelectorAll('#tb-nav a.on')].map(a=>a.textContent)"))
        await page.evaluate('scrollTo(0,0)'); await page.click('#lay-tabs'); await page.wait_for_timeout(300)
        print('back to tabs:', await page.evaluate("document.documentElement.classList.contains('tabs')"), await page.evaluate("localStorage.getItem('etf-backtester.layout.v1')"))
        # help tab: open / close every fold
        await page.click('#tb-nav a[data-g="g-ref"]'); await page.wait_for_timeout(200)
        await page.click('#fold-open-all'); await page.wait_for_timeout(300)
        print('open all ->', await page.evaluate("[...document.querySelectorAll('details.fold')].every(d=>d.open)"), '| results charts redrawn w', await page.evaluate("document.querySelector('#c-ann svg') && document.querySelector('#c-ann svg').getAttribute('width')"))
        await page.click('#fold-close-all'); await page.wait_for_timeout(300)
        print('close all ->', await page.evaluate("[...document.querySelectorAll('details.fold')].every(d=>!d.open)"), '| toast:', await page.evaluate("document.querySelector('#toast').textContent"))
        await page.click('#tb-nav a[data-g="g-setup"]'); await page.wait_for_timeout(200)
        await page.screenshot(path=SH + 'v72_d_tab1.png')
        print('errors', errs); await ctx.close()
        # phone: bottom tab bar
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, color_scheme='dark', device_scale_factor=2); page = await ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.route('**/fonts.*/**', lambda r: r.abort())
        await page.goto('file://' + OUT + 'test.html'); await page.wait_for_timeout(2000)
        print('phone:', await vis(page, ['#bnav', '#tb-nav', '.tb-brand']), 'bnav rect', await page.evaluate("JSON.stringify(document.querySelector('#bnav').getBoundingClientRect())"))
        await page.screenshot(path=SH + 'v72_m_tab1.png')
        await page.click('#bnav a[data-g="g-results"]'); await page.wait_for_timeout(500)
        print('phone results:', await page.evaluate("document.documentElement.dataset.tab"), await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"))
        await page.screenshot(path=SH + 'v72_m_results.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
