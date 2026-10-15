"""v8 layout audit: every tab, with all folds closed and then all open, at phone / tablet / desktop widths,
light and dark, tabs and one-page layout. Reports console errors, sideways page scroll, elements wider than
the screen, and tables that need sideways scrolling inside their box (the phone tables meant to fit are flagged).

  python3 dev/tests/audit8.py            # checks only
  python3 dev/tests/audit8.py shots      # also full-page screenshots in dev/tests/shots/a8_*.png
"""
import os as _os
_T = _os.path.dirname(_os.path.abspath(__file__)); _D = _os.path.dirname(_T)
import asyncio, sys
from playwright.async_api import async_playwright
SHOTS = len(sys.argv) > 1 and sys.argv[1] == 'shots'
TABS = ['g-setup', 'g-results', 'g-checks', 'g-opt', 'g-ref']
MUST_FIT = ['#t-trail-m', '#t-mdd', '.qr-t', '#hero']   # on a phone these should never need sideways scrolling
WIDE = """(() => { const W = document.documentElement.clientWidth, out = [];
  document.querySelectorAll('body *').forEach(e => { if (!e.checkVisibility()) return; const r = e.getBoundingClientRect();
    if (r.right > W + 1 && !e.closest('.tbl-wrap') && !e.closest('.scroll-x') && !e.closest('.chart-box') && getComputedStyle(e).position !== 'absolute' && getComputedStyle(e).position !== 'fixed') out.push(e.tagName + '.' + e.className + ' ' + Math.round(r.right)); });
  return out.slice(0, 6); })()"""
SCROLLERS = """(sel => { const out = []; document.querySelectorAll('.tbl-wrap').forEach(w => { if (!w.checkVisibility()) return;
  if (w.scrollWidth > w.clientWidth + 1) { const t = w.querySelector('table'); out.push((t && (t.id || t.className)) + ' ' + w.scrollWidth + '>' + w.clientWidth); } });
  const bad = sel.filter(s => { const e = document.querySelector(s); if (!e || !e.checkVisibility()) return false; const w = e.closest('.tbl-wrap') || e; return w.scrollWidth > w.clientWidth + 1 || e.getBoundingClientRect().right > document.documentElement.clientWidth + 1; });
  return { scroll: out, mustFitBad: bad }; })"""

async def run(b, w, h, scheme, lay):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, color_scheme=scheme)
    await ctx.add_init_script("try{localStorage.setItem('etf-backtester.layout.v1','%s')}catch(e){}" % lay)
    page = await ctx.new_page(); errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    await page.route('**/fonts.*/**', lambda r: r.abort())
    await page.goto('file://' + _T + '/test.html')
    await page.wait_for_function("document.querySelector('#hero .hc')", timeout=60000); await page.wait_for_timeout(300)
    rep = []
    for opened in (False, True):
        if opened:
            await page.evaluate("document.querySelectorAll('details.fold, details.faq-i').forEach(d => d.open = true)")
            await page.wait_for_timeout(200)
        for g in (TABS if lay == 'tabs' else [None]):
            if g:
                await page.evaluate(f"(document.querySelector('#bnav a[data-g=\"{g}\"]').offsetParent ? document.querySelector('#bnav a[data-g=\"{g}\"]') : document.querySelector('#tb-nav a[data-g=\"{g}\"]')).click()")
                await page.wait_for_timeout(250)
            if g in ('g-opt', None):
                await page.wait_for_function("document.querySelectorAll('#o-life .stage-cell').length > 0 && !document.querySelector('#o-run').disabled", timeout=240000, polling=500)
                await page.wait_for_timeout(300)
            sw = await page.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            wide = await page.evaluate(WIDE)
            sc = await page.evaluate(SCROLLERS, MUST_FIT if w <= 430 else [])
            tag = f"{'open' if opened else 'closed'} {g or 'page'}"
            ok = sw[0] <= sw[1] and not wide and not sc['mustFitBad']
            rep.append(f"  {'ok ' if ok else 'BAD'} {tag:16s} page {sw[0]}/{sw[1]}" + (f" wide={wide}" if wide else '') + (f" mustfit={sc['mustFitBad']}" if sc['mustFitBad'] else '') + (f" scrollers={sc['scroll']}" if sc['scroll'] else ''))
            if SHOTS:
                await page.screenshot(path=f"{_T}/shots/a8_{w}_{scheme}_{lay}_{'open' if opened else 'closed'}_{g or 'page'}.png", full_page=True)
    print(f"{w}x{h} {scheme} {lay}: errors={errs}")
    print('\n'.join(rep))
    await ctx.close()
    return not errs and all(r.startswith('  ok') for r in rep)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        res = []
        for cfg in [(360, 780, 'light', 'tabs'), (390, 844, 'dark', 'tabs'), (768, 1000, 'light', 'tabs'), (1280, 900, 'dark', 'tabs'), (390, 844, 'light', 'page'), (1280, 900, 'light', 'page')]:
            res.append(await run(b, *cfg))
        await b.close()
        print('ALL OK' if all(res) else 'PROBLEMS FOUND')
asyncio.run(main())
