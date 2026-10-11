import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)   # dev/tests, dev
import asyncio, subprocess, time, os
from playwright.async_api import async_playwright
APP = _D + '/out/app'
DONE = "document.querySelectorAll('#t-summary tbody tr').length > 5 && document.querySelectorAll('#qr-body .qr-item').length > 0"
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=APP + '/pwa', stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.0)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            # 1) single file opened from disk
            ctx = await b.new_context(viewport={'width': 820, 'height': 1180}, accept_downloads=True)   # iPad-like
            page = await ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text and 'fonts' not in m.text else None)
            await page.goto('file://' + APP + '/etf-backtester.html')
            await page.wait_for_function(DONE, timeout=300000, polling=200)
            print('single: title', await page.title(), '| doctype', await page.evaluate("document.doctype && document.doctype.name"), '| mode', await page.evaluate("document.compatMode"))
            await page.click('.pcard[data-p="0"] .sv'); await page.wait_for_timeout(300)
            print('  saved where:', (await page.evaluate("document.querySelector('#sv-where').textContent"))[:40], '| items', await page.evaluate("document.querySelectorAll('.sv-card').length"))
            await page.click('#sv-export'); await page.wait_for_timeout(200)
            print('  file-save visible:', await page.evaluate("!document.querySelector('#io-file-save').hidden"))
            async with page.expect_download() as dl:
                await page.click('#io-file-save')
            d = await dl.value; print('  download:', d.suggested_filename)
            sw = await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            print('  scroll/client', sw, 'errors', errs)
            await ctx.close()
            # 2) installable app over http, then offline
            ctx = await b.new_context(viewport={'width': 390, 'height': 844}, service_workers='allow')
            page = await ctx.new_page(); errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            await page.goto('http://127.0.0.1:8765/')
            await page.wait_for_function(DONE, timeout=300000, polling=200)
            ok = await page.evaluate("navigator.serviceWorker.ready.then(r => !!r.active)")
            man = await page.evaluate("fetch('manifest.webmanifest').then(r => r.json()).then(j => [j.name, j.display, j.icons.length])")
            print('pwa: sw active', ok, '| manifest', man)
            await page.wait_for_timeout(800)
            keys = await page.evaluate("caches.keys().then(ks => Promise.all(ks.map(k => caches.open(k).then(c => c.keys()).then(r => [k, r.length]))))")
            print('  caches', keys)
            await ctx.set_offline(True)
            await page.reload()
            await page.wait_for_function(DONE, timeout=300000, polling=200)
            print('  offline reload ok:', await page.evaluate("document.querySelector('#t-summary tbody tr td') && document.querySelector('#t-summary tbody tr td').textContent"), '| errors', errs)
            await ctx.close(); await b.close()
    finally:
        srv.terminate()
asyncio.run(main())
