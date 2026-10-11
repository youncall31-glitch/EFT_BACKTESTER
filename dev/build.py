"""Build every published form of the ETF backtester from dev/src.

  python3 dev/build.py

  dev/out/etf-backtester.html        the claude.ai artifact page (publish this file to the artifact URL)
  dev/out/app/etf-backtester.html    one self-contained file (open in any browser; works offline)
  dev/out/app/etf-backtester-app.zip the installable web app zipped, with Korean setup notes
  index.html, manifest.webmanifest, sw.js, icons in the repo root  (the GitHub Pages site)
  dev/tests/test.html                the page the browser tests open

Bump VERSION for every release: it names the offline cache, so installed apps pick up the new files.
Set GOATCOUNTER to a GoatCounter site code (e.g. 'etfbt' for https://etfbt.goatcounter.com) to count
visits to the GitHub Pages site only (no cookies; the artifact and the single file never load it).
"""
import base64, io, json, os, re, shutil, zipfile
from PIL import Image, ImageDraw

DEV = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(DEV)
OUT = f'{DEV}/out/app'
VERSION = 'v7.3-2026-10-10'
GOATCOUNTER = ''          # GoatCounter site code; '' = no visit counting

# ---- 1) the artifact page: template with data, engine and app inlined (no doctype; claude.ai wraps it)
S = f'{DEV}/src'
t = open(f'{S}/template.html', encoding='utf-8').read()
data = open(f'{S}/data.json', encoding='utf-8').read().replace('</', '<\\/')
page_src = t.replace('__DATA__', data).replace('__ENGINE__', open(f'{S}/engine.js', encoding='utf-8').read()).replace('__APP__', open(f'{S}/app.js', encoding='utf-8').read())
os.makedirs(f'{DEV}/out', exist_ok=True)
SRC = f'{DEV}/out/etf-backtester.html'
open(SRC, 'w', encoding='utf-8').write(page_src)
SKEL = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>'
open(f'{DEV}/tests/test.html', 'w', encoding='utf-8').write(SKEL + page_src + '</body></html>')
print('artifact page', round(len(page_src) / 1024), 'KB')

INK, BG, P1 = (21, 32, 28), (239, 242, 240), (57, 135, 229)

def icon(size, maskable=False):
    """dark tile with a rising line chart and an end dot"""
    S = 4 * size                                   # draw large, then downsample for smooth edges
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if maskable: d.rectangle([0, 0, S, S], fill=INK)
    else: d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=INK)
    k = 0.62 if maskable else 0.74                 # content box (maskable keeps to the safe zone)
    x0, y0 = S * (1 - k) / 2, S * (1 - k) / 2
    pts = [(0.00, 0.78), (0.18, 0.62), (0.32, 0.70), (0.50, 0.44), (0.64, 0.52), (0.84, 0.22), (1.00, 0.10)]
    P = [(x0 + x * S * k, y0 + y * S * k) for x, y in pts]
    lw = int(S * 0.055)
    base_y = y0 + 1.0 * S * k
    mid = tuple(int(a + 0.32 * (b - a)) for a, b in zip(INK, BG))   # faint baseline, solid (no transparent hole)
    d.line([(x0, base_y), (x0 + S * k, base_y)], fill=mid, width=int(lw * 0.45))
    d.line(P, fill=BG, width=lw, joint='curve')
    for x, y in P[:-1]: d.ellipse([x - lw / 2, y - lw / 2, x + lw / 2, y + lw / 2], fill=BG)
    r = lw * 1.25; x, y = P[-1]
    d.ellipse([x - r, y - r, x + r, y + r], fill=P1)
    return im.resize((size, size), Image.LANCZOS)

def png_bytes(im):
    b = io.BytesIO(); im.save(b, 'PNG', optimize=True); return b.getvalue()
def data_uri(im):
    return 'data:image/png;base64,' + base64.b64encode(png_bytes(im)).decode()

page = open(SRC, encoding='utf-8').read()
assert page.count('</style>') == 1
head_part, body_part = page.split('</style>', 1)
head_part += '</style>'
DESC = '미국 상장 ETF 포트폴리오를 Portfolio Visualizer 방식으로 백테스트해 CAGR·MDD·회복 기간, 구간별 점검, 배당 재투자/현금 수령, 추세 보정, 최적 비중을 보여주는 도구'

def document(extra_head, extra_body, icons):
    return f"""<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
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
{icons}
{extra_head}{head_part}
</head>
<body>
{body_part}
{extra_body}
</body>
</html>
"""

if os.path.exists(OUT): shutil.rmtree(OUT)
os.makedirs(f'{OUT}/pwa')

# 1) single file: icons inline, nothing else needed
fav = data_uri(icon(64)); touch = data_uri(icon(180, maskable=True))
single = document('', '', f'<link rel="icon" type="image/png" href="{fav}">\n<link rel="apple-touch-icon" href="{touch}">')
open(f'{OUT}/etf-backtester.html', 'w', encoding='utf-8').write(single)

# 2) installable web app
for name, im in [('icon-192.png', icon(192)), ('icon-512.png', icon(512)), ('icon-maskable-512.png', icon(512, maskable=True)),
                 ('apple-touch-icon.png', icon(180, maskable=True)), ('favicon-64.png', icon(64))]:
    open(f'{OUT}/pwa/{name}', 'wb').write(png_bytes(im))
manifest = {
    'name': 'ETF 포트폴리오 백테스터', 'short_name': 'ETF 백테스터', 'description': DESC, 'lang': 'ko', 'dir': 'ltr',
    'id': './', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'any',
    'background_color': '#eff2f0', 'theme_color': '#15201c',
    'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
              {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'},
              {'src': 'icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'}]
}
json.dump(manifest, open(f'{OUT}/pwa/manifest.webmanifest', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
sw = f"""/* offline cache for the backtester: app files are served from the cache (so it runs without a connection)
   and refreshed in the background, so a newly uploaded version shows up on the next launch */
const CACHE = 'etf-backtester-{VERSION}';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon-64.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('etf-backtester-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
}});
self.addEventListener('fetch', e => {{
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {{
    // only this app's own top-level files; other apps in sub-folders (e.g. retire120/) handle their own requests
    const base = new URL('./', self.registration.scope).pathname;
    const rel = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : null;
    if (rel === null || rel.includes('/')) return;
    e.respondWith(caches.open(CACHE).then(async c => {{
      const hit = await c.match(req, {{ ignoreSearch: true }});
      const net = fetch(req).then(res => {{ if (res && res.ok) c.put(req, res.clone()); return res; }}).catch(() => null);
      if (hit) {{ e.waitUntil(net); return hit; }}
      return (await net) || (await c.match('./index.html')) || Response.error();
    }}));
  }} else if (/(^|\\.)fonts\\.(googleapis|gstatic)\\.com$/.test(url.hostname)) {{
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req)) ||
      fetch(req).then(res => {{ if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }}).catch(() => Response.error())));
  }}
}});
"""
open(f'{OUT}/pwa/sw.js', 'w', encoding='utf-8').write(sw)
reg = """<script>
/* installable app: register the offline cache when served from a web address (not when opened as a file) */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>"""
stats = ''
if GOATCOUNTER:   # visit counting on the GitHub Pages address only (not when opened as a file or elsewhere)
    stats = f'''<script>
if (/(^|\\.)github\\.io$/.test(location.hostname)) {{ var gc = document.createElement('script'); gc.async = true; gc.src = 'https://gc.zgo.at/count.js';
  gc.setAttribute('data-goatcounter', 'https://{GOATCOUNTER}.goatcounter.com/count'); document.head.appendChild(gc); }}
</script>'''
pwa = document('<link rel="manifest" href="manifest.webmanifest">\n', reg + stats,
               '<link rel="icon" type="image/png" href="favicon-64.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">')
open(f'{OUT}/pwa/index.html', 'w', encoding='utf-8').write(pwa)
readme = """ETF 포트폴리오 백테스터 — 휴대폰·태블릿에 앱처럼 설치하는 방법
================================================================

이 폴더(pwa)를 인터넷 주소가 있는 곳에 올리면, 휴대폰·태블릿 홈 화면에 앱처럼 설치하고
한 번 연 뒤에는 인터넷 없이도 실행할 수 있어요. 계산은 모두 기기 안에서 합니다.

1) 폴더 올리기 (둘 중 하나, 무료)
   ● GitHub Pages
     1. github.com 가입 후 새 저장소(Repository)를 만듭니다. 이름 예: etf-backtester (Public)
     2. 'Add file' → 'Upload files'로 이 폴더 안의 파일을 모두 올리고 'Commit changes'를 누릅니다.
        (index.html, manifest.webmanifest, sw.js, 아이콘 png 파일들 — 폴더째가 아니라 안의 파일들)
     3. 저장소의 Settings → Pages → Branch를 'main' / '(root)'로 고르고 Save.
     4. 1~2분 뒤 https://<아이디>.github.io/etf-backtester/ 주소가 생깁니다.
   ● Netlify Drop (app.netlify.com/drop): 무료 가입 후 이 폴더를 화면에 끌어다 놓으면 주소가 생깁니다.

2) 휴대폰·태블릿에 설치
   ● 아이폰·아이패드: Safari로 주소를 열고 → 공유 버튼(□↑) → '홈 화면에 추가'
   ● 안드로이드 폰·태블릿: Chrome으로 주소를 열고 → 메뉴(⋮) → '앱 설치' 또는 '홈 화면에 추가'
   ● PC: Chrome·Edge 주소창 오른쪽의 설치 아이콘

3) 알아 둘 점
   ● 저장한 포트폴리오는 기기(브라우저)마다 따로 저장돼요. 다른 기기로 옮길 때는 '저장한 포트폴리오'의
     '내보내기' 코드를 복사해 그 기기에서 '가져오기'에 붙여 넣으세요.
   ● 새 버전 파일을 같은 곳에 다시 올리면, 앱을 한 번 열었다 닫은 뒤 다음 실행부터 새 버전이 나와요.
   ● 데이터 기준일: 2026년 9월 말. 계산 방식과 데이터 출처는 앱 맨 아래 '계산 방식과 데이터 출처'에 있어요.

파일 하나로 쓰기: '파일 하나로 쓰기' 폴더의 etf-backtester.html은 PC에서 더블클릭하면 바로 열려요(인터넷 없이도 계산).
안드로이드는 파일 앱에서 열 수 있지만, 아이폰·아이패드는 파일을 바로 열면 계산이 돌지 않으니 위 방법이나 claude.ai 링크를 쓰세요.
"""
open(f'{OUT}/pwa/설치 방법.txt', 'w', encoding='utf-8').write(readme)
with zipfile.ZipFile(f'{OUT}/etf-backtester-app.zip', 'w', zipfile.ZIP_DEFLATED) as z:
    for f in sorted(os.listdir(f'{OUT}/pwa')):
        z.write(f'{OUT}/pwa/{f}', f'etf-backtester-app/{f}')
    z.write(f'{OUT}/etf-backtester.html', 'etf-backtester-app/파일 하나로 쓰기/etf-backtester.html')
for f in ['etf-backtester.html', 'etf-backtester-app.zip']:
    print(f, round(os.path.getsize(f'{OUT}/{f}') / 1024), 'KB')

# ---- 3) the GitHub Pages site = the installable app files in the repo root
for f in ['index.html', 'manifest.webmanifest', 'sw.js', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-64.png']:
    shutil.copyfile(f'{OUT}/pwa/{f}', f'{ROOT}/{f}')
print('site files copied to', ROOT, '| visit counting:', GOATCOUNTER or 'off')
