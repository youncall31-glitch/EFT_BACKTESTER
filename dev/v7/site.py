"""Make the GitHub Pages site (repository root index.html, sw.js cache name, manifest) from dev/v7/out/etf-backtester.html.
   Run after build.py:  python3 dev/v7/build.py && python3 dev/v7/site.py"""
import pathlib, re
VERSION = 'v10.2-2026-11-02'          # bump on every upload: it is the offline cache name, so installed apps pick up the new file
R = pathlib.Path(__file__).resolve().parent
ROOT = R.parent.parent
h = (R / 'out' / 'etf-backtester.html').read_text()
DESC = '미국 상장 ETF 포트폴리오를 Portfolio Visualizer 방식으로 백테스트해 CAGR·MDD·회복 기간, 2·5·10·20·30년 편차·상관성 검증, 하락과 회복 전략, AI 추천 비중과 그 검증을 보여주는 도구'
head = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{DESC}">
<meta name="theme-color" content="#eff2f0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0e1412" media="(prefers-color-scheme: dark)">
<meta name="color-scheme" content="light dark">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="ETF 백테스터">
<meta name="app-version" content="{VERSION}">
<link rel="icon" type="image/png" href="favicon-64.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">'''
# the artifact page starts with a small document skeleton (charset, viewport, base style, </head><body>); the site needs a real head
m = re.match(r'(?s)<!doctype html>\s*<html>\s*<head>\s*<meta charset=utf8>\s*<meta name=viewport[^>]*>\s*(<style>.*?</style>)\s*</head>\s*<body>\s*', h, re.I)
assert m, 'unexpected page start'
rest = h[m.end():]
# move the page's own <head> material (title, metas, styles, fonts) into the head, before <body>
cut = rest.index('<svg class="sprite"') if '<svg class="sprite"' in rest else None
pre, body = (rest[:cut], rest[cut:]) if cut else ('', rest)
i = body.rfind('</body>')
sw = '''<script>
/* installable app: register the offline cache when served from a web address (not when opened as a file) */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>
'''
body = body[:i] + sw + body[i:] if i >= 0 else body + sw
out = '<!doctype html>\n<html lang="ko">\n<head>\n' + head + '\n' + m.group(1) + '\n' + pre + '</head>\n<body>\n' + body
if not out.rstrip().endswith('</html>'): out = out.rstrip() + '\n</html>\n'
(ROOT / 'index.html').write_text(out)
sw_js = (ROOT / 'sw.js').read_text()
sw_js = re.sub(r"const CACHE = 'etf-backtester-[^']*';", f"const CACHE = 'etf-backtester-{VERSION}';", sw_js)
(ROOT / 'sw.js').write_text(sw_js)
man = (ROOT / 'manifest.webmanifest').read_text()
man = re.sub(r'"description": "[^"]*"', f'"description": "{DESC}"', man)
(ROOT / 'manifest.webmanifest').write_text(man)
print('site written', ROOT / 'index.html', len(out), 'bytes ·', VERSION)
