import sys, json, asyncio
from playwright.async_api import async_playwright
# usage: snap.py page.html out.json [scenario]
SCEN = {
 'default': [],
 'real_cash_q': [("check", "#real"), ("radio", "cash"), ("select", "#rebal", "Q")],
 'band_30y': [("select", "#rebal", "B"), ("quick", "30")],
 'adj': [("adj",)],
}
async def main(path, out, scen):
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1300, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('file://' + path); await pg.wait_for_timeout(1500)
        await pg.evaluate("(()=>{const b=document.querySelector('#tb-mode'); if (b && b.getAttribute('aria-pressed')!=='true') b.click();})()"); await pg.wait_for_timeout(300)
        for st in SCEN[scen]:
            if st[0] == 'check': await pg.evaluate(f"(()=>{{const e=document.querySelector('{st[1]}'); e.checked=true; e.dispatchEvent(new Event('change'))}})()")
            if st[0] == 'radio': await pg.evaluate(f"(()=>{{const e=document.querySelector('input[name=divm][value={st[1]}]'); e.checked=true; e.dispatchEvent(new Event('change'))}})()")
            if st[0] == 'select': await pg.evaluate(f"(()=>{{const e=document.querySelector('{st[1]}'); e.value='{st[2]}'; e.dispatchEvent(new Event('change'))}})()")
            if st[0] == 'quick': await pg.evaluate(f"document.querySelector('#quick .chip[data-q=\"{st[1]}\"]').click()")
            if st[0] == 'adj': await pg.evaluate("document.querySelector('#dm button[data-v=adj]').click()")
            await pg.wait_for_timeout(700)
        # optimizer: open tab and run
        await pg.evaluate("document.querySelector('#o-run') && document.querySelector('#o-run').click()")
        for _ in range(240):
            await pg.wait_for_timeout(500)
            s = await pg.evaluate("document.querySelector('#o-status').textContent")
            if '평가한 조합' in s: break
        await pg.wait_for_timeout(1500)
        await pg.evaluate("document.querySelectorAll('details.more').forEach(d=>d.open=true)"); await pg.wait_for_timeout(300)
        ids = ['#t-summary', '#t-trail', '#t-mdd', '#t-risk', '#t-roll', '#hero', '#o-hz', '#o-life', '#o-era', '#pc-table', '#t-trend-cmp']
        res = {}
        for i in ids:
            res[i] = await pg.evaluate(f"(()=>{{const e=document.querySelector('{i}'); return e? e.innerText.replace(/\\s+/g,' ').trim():null}})()")
        res['errors'] = errs
        json.dump(res, open(out, 'w'), ensure_ascii=False, indent=1)
        await b.close()
asyncio.run(main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'default'))
