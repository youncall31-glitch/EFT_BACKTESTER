# ================= v8.0: four steps — 1 my portfolio · 2 backtest · 3 verification · 4 AI pick (extra); loss & recovery simulator =================
import re as _re
rep('<dt>v7.9 · 2026.10.28</dt>', """<dt>v8.0 · 2026.10.29</dt>
          <dd><ul>
            <li>앱을 네 단계로 다시 나눔: 1 내 포트폴리오 → 2 백테스트 결과 → 3 검증(정합성·신빙성, 근거 자료는 펼쳐서) → 4 AI 추천(추가 검토)</li>
            <li>2 결과에 ‘하락과 회복’ 추가: 큰 하락마다 그대로 두기 · 바로 리밸런싱 · 공격 늘리기 · 수비로 옮기기를 언제(−5~−20%) 했을 때 가장 빨리 고점을 되찾았는지 비교</li>
            <li>3 검증 맨 위에 포트폴리오별 판정 카드(믿을 만해요 / 어느 정도 / 조심해서)와 ‘앞으로 10년을 과거에 비춰 보면’ 범위 막대</li>
            <li>4 AI 추천에 추천 비중의 백테스트(자산 성장·낙폭 그래프)와 같은 방법의 검증을 내 포트폴리오와 나란히</li>
            <li>모바일: 아래 탭 막대를 포트폴리오 · 결과 · 검증 · AI 추천 · 더보기로 정리</li>
          </ul></dd>
          <dt>v7.9 · 2026.10.28</dt>""")
rep('<span class="upd-v">v7.9</span><span class="upd-d">2026.10.28</span><span class="upd-t">손실 때 수비로 옮겼다가 되돌리는 규칙을 내 포트폴리오로 시험해요</span>',
    '<span class="upd-v">v8.0</span><span class="upd-d">2026.10.29</span><span class="upd-t">포트폴리오 → 결과 → 검증 → AI 추천, 네 단계로 정리했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.9</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v8.0</span></h1>')
rep('<section class="panel" aria-labelledby="h-charts">', '<section class="panel" aria-labelledby="h-charts" id="sec-charts">')

# ---------- split into panes ----------
P0 = h.index('  <div class="pane" data-g="g-setup"')
TAIL = h.index('\n</div>\n<nav class="bnav"')
head, body, tail = h[:P0], h[P0:TAIL + 1], h[TAIL + 1:]
starts = [m.start() for m in _re.finditer(r'  <div class="pane" data-g="', body)] + [len(body)]
panes = {}
for a, b in zip(starts, starts[1:]):
    g = _re.match(r'  <div class="pane" data-g="([\w-]+)"', body[a:]).group(1); panes[g] = body[a:b]
assert list(panes) == ['g-setup', 'g-sum', 'g-results', 'g-flow', 'g-checks', 'g-opt', 'g-ref'], list(panes)

def cut(g, ident):
    c = panes[g]; i = c.index(f'id="{ident}"'); s = c.rfind('\n', 0, i) + 1
    tag = _re.match(r'\s*<(\w+)', c[s:]).group(1)
    pos, depth = s, 0
    for m in _re.finditer(rf'<{tag}\b|</{tag}>', c[s:]):
        depth += -1 if m.group(0).startswith('</') else 1
        if depth == 0: e = s + m.end(); break
    while e < len(c) and c[e] == '\n': e += 1
    panes[g] = c[:s] + c[e:]
    return c[s:e].rstrip('\n') + '\n\n'
def cutline(g, needle):
    c = panes[g]; i = c.index(needle); s = c.rfind('\n', 0, i) + 1; e = c.index('\n', i) + 1
    panes[g] = c[:s] + c[e:]; return c[s:e]
def gsec(g, icon, eye, title, desc):
    return f'  <div class="gsec" id="{g}"><svg class="ic gsec-ic" aria-hidden="true"><use href="#{icon}"/></svg><div class="grp-tx"><span class="g-eye">{eye}</span><h2 class="grp-t">{title}</h2><p class="grp-d">{desc}</p></div></div>\n'
def jnav(label, items):
    ADV = ' class="adv"'
    b = ''.join(f'<button type="button" data-goto="{t}"{ADV if adv else ""}><i>{n}</i>{x}</button>' for n, t, x, adv in items)
    return f'  <nav class="sum-nav" aria-label="{label}">{b}</nav>\n\n'
def pnav(*btns):
    return '  <nav class="pane-nav tabs-only" aria-label="단계 이동">' + ''.join(f'<button class="btn{" ghost" if gh else ""}" type="button" data-go="{g}">{t}</button>' for g, t, gh in btns) + '</nav>\n'
def open_(g, pid): return f'  <div class="pane" data-g="{g}" id="{pid}">\n'

# pieces from the old summary pane
S = 'g-sum'
ctx_sum = cutline(S, 'id="ctx-sum"')
sum1, sum2, sum3, sum4, sum5 = [cut(S, f'sum-{i}') for i in range(1, 6)]
# pieces from the old results pane
Rr = 'g-results'
ctx_res = cutline(Rr, 'id="ctx-res"'); dmb = cutline(Rr, 'id="dm-banner"'); advlead = cutline(Rr, 'class="adv-lead"')
rflow, hero, charts, trail, mdd, disp, trust = [cut(Rr, i) for i in ['sec-res-flow', 'sec-hero', 'sec-charts', 'sec-trail', 'sec-mdd', 'sec-disp', 'sec-trust-res']]
radv = ''.join(cut(Rr, i) for i in ['sec-sum', 'sec-risk', 'sec-annual', 'sec-roll'])
# pieces from the old optimizer pane
oadv = ''.join(cut('g-opt', i) for i in ['sec-opt', 'sec-fix', 'sec-trust-opt', 'sec-hz', 'sec-keep', 'o-era-sec', 'o-adj-sec', 'o-life-sec', 'o-walk-sec', 'o-front-sec'])

# ---- edits to the moved cards ----
def sub1(s, a, b):
    assert s.count(a) == 1, a; return s.replace(a, b)
sum1 = sub1(sum1, '<h2 id="h-sum-1">CAGR · MDD</h2><p class="sc-q">해마다 얼마나 불었고, 가장 크게 얼마나 떨어졌나</p>', '<h2 id="h-sum-1">성과 한눈에 — CAGR · MDD</h2><p class="sc-q">해마다 얼마나 불었고(CAGR), 가장 크게 얼마나 떨어졌나(MDD)</p>')
sum1 = sub1(sum1, '    <div class="chart-box" id="c-sum-bf"></div>\n', '    <div class="say" id="sum-say"></div>\n    <div class="chart-box" id="c-sum-bf"></div>\n')
sum1 = _re.sub(r'    <details class="more"><summary>숫자로 보기 \(최종 금액·최장 회복\)</summary><div class="sk-grid" id="sum-kpi"></div></details>\n', '    <div class="sk-grid" id="sum-kpi" hidden></div>\n', sum1)
sum1 = _re.sub(r'    <div class="sc-more">.*?</div>\n', '', sum1)
sum2 = sub1(sum2, '<span class="sc-n">2</span>', '<span class="sc-n">1</span>')
sum2 = sub1(sum2, '    <h3 class="sc-sub">예측 가능성 <span class="small muted">— 언제 시작해도 결과가 비슷했나 (0~100)</span></h3>\n    <div class="chart-box" id="c-sum-score"></div>\n', '    <div hidden><div class="chart-box" id="c-sum-score"></div></div>\n')
sum2 = sub1(sum2, '<summary>포트폴리오별 설명 보기</summary>', '<summary>포트폴리오별 숫자로 보기</summary>')
sum3 = sub1(sum3, '<span class="sc-n">3</span>', '<span class="sc-n">2</span>')
sum3 = sub1(sum3, '<h2 id="h-sum-3">과최적화 — 운이나 고르기 때문은 아닌가</h2><p class="sc-q">내 포트폴리오는 운 점검 4가지로, AI가 고르는 방식은 과최적화 확률로 봐요</p>', '<h2 id="h-sum-3">신빙성 — 운이나 우연으로 나온 결과는 아닌가</h2><p class="sc-q">네 가지로 따져요: 유의성 · 비중 민감도 · 기록 길이 · 부트스트랩</p>')
sum3 = sub1(sum3, '    <div class="sum-pbo" id="sum-pbo"></div>\n', '')
sum4 = sub1(sum4, '<span class="sc-n">4</span>', '<span class="sc-n">1</span>')
sum4 = sub1(sum4, '<h2 id="h-sum-4">AI 추천 — 내 종목 · 내 조건으로 오래 들고 갈 포트폴리오</h2>', '<h2 id="h-sum-4">AI가 추천하는 비중 — 내 종목 · 내 조건으로</h2>')
sum5 = sub1(sum5, '<span class="sc-n">5</span>', '<span class="sc-n">3</span>')
sum5 = sub1(sum5, '<h2 id="h-sum-5">방어 규칙 — 떨어지면 줄이고, 돌아오면 되돌리기</h2>', '<h2 id="h-sum-5">방어 규칙 하나 자세히 — 떨어지면 줄이고, 돌아오면 되돌리기</h2>')
hero = sub1(hero, '<h2 id="h-hero">한눈에 보기</h2>', '<h2 id="h-hero">포트폴리오별 숫자</h2>')

recov = '''  <section class="panel scard" aria-labelledby="h-recov" id="sec-recov">
    <div class="sc-h"><span class="sc-n">2</span><div><h2 id="h-recov">하락과 회복 — 언제, 어떻게 하면 빨리 회복했나</h2><p class="sc-q">큰 하락이 왔을 때 무엇을(방법), 언제(몇 % 떨어졌을 때) 했다면 고점을 가장 빨리 되찾았나</p></div></div>
    <div class="field"><span class="lbl">포트폴리오</span><div class="chips" id="rc-port" role="group" aria-label="시험할 포트폴리오"></div></div>
    <p class="note" id="rc-msg" hidden></p>
    <div class="rc-say" id="rc-say"></div>
    <h3 class="sc-sub">방법 × 시기 — 고점을 되찾기까지 평균 기간</h3>
    <p class="help">가로는 ‘고점에서 몇 % 떨어졌을 때 시작했나’예요. 초록이 진할수록 그대로 두기보다 빨리 회복했고, 빨강은 더 늦었어요. ★ = 가장 빠른 칸(CAGR 손해 0.5%p 이내). 칸 아래 작은 숫자는 그대로 두기 대비 전체 CAGR 변화(%p)예요. 칸을 누르면 아래 그래프가 바뀌어요.</p>
    <div class="tbl-wrap" id="rc-grid"></div>
    <h3 class="sc-sub">하락 하나씩 보기</h3>
    <div class="chips" id="rc-ep" role="group" aria-label="볼 하락"></div>
    <p class="small muted" id="rc-ep-say"></p>
    <div class="legend" id="lg-recov"></div>
    <div class="chart-box" id="c-recov"></div>
    <details class="more"><summary>하락별 회복 기간 표</summary><div class="tbl-wrap" id="rc-tbl"></div></details>
    <details class="more"><summary>읽는 법과 주의할 점</summary>
      <ul class="small g-notes">
        <li><b>회복 기간</b>: 그대로 들고 있던 포트폴리오가 고점을 찍은 달부터, 각 방법의 평가액이 그날 값을 다시 넘기까지 걸린 개월 수예요. 기간 끝까지 못 넘었으면 +를 붙였어요.</li>
        <li><b>큰 하락</b>: 그대로 두었을 때 고점 대비 15% 넘게 떨어진 하락이에요(15% 하락이 두 번이 안 되면 10%).</li>
        <li><b>바로 리밸런싱</b>은 떨어진 달에 원래 비중으로 맞춰 내린 종목을 더 사는 것, <b>공격 늘리기</b>는 채권·금 같은 수비 종목 절반을 주식 같은 공격 종목으로 옮기는 것, <b>수비로</b>는 공격 종목 절반을 수비 종목으로 옮기는 것이에요.</li>
        <li>공격 늘리기는 V자 반등(2020년)에서 빠르고, 길게 이어진 하락(2000~2002, 2008)에서는 더 깊이 떨어져요. 수비로 옮기기는 그 반대예요. 그래서 ‘평균’과 ‘하락 하나씩’을 같이 보세요.</li>
        <li>하락이 몇 번뿐이라 결과는 그 몇 번의 사정에 크게 좌우돼요. 표에서 가장 좋은 칸 하나보다 주변 칸들도 고르게 좋은 방법을 고르는 것이 과최적화를 피하는 길이에요. 수수료·세금은 빠져 있어요.</li>
      </ul>
    </details>
  </section>

'''
verdict = '''  <section class="panel scard" aria-labelledby="h-verdict" id="sec-verdict">
    <div class="sc-h"><span class="sc-n">✓</span><div><h2 id="h-verdict">검증 결과 한눈에</h2><p class="sc-q">이 백테스트 결과를 앞으로도 어느 정도 믿을 수 있나</p></div></div>
    <ol class="vsteps"><li><b>정합성</b><span>기간을 바꿔도 결과가 비슷했나</span></li><li><b>신빙성</b><span>운이나 우연으로 나온 결과는 아닌가</span></li><li><b>근거 자료</b><span>원하는 분만 맨 아래에서</span></li></ol>
    <div class="vcards" id="vd-cards"></div>
    <p class="small muted">판정은 정합성(예측 가능성 80점 이상 높음, 60점 이상 보통)과 신빙성(운 점검 4개 중 통과 수)을 합쳐 ‘믿을 만해요 · 어느 정도 믿을 만해요 · 조심해서 보세요’로 나눠요. 어떤 지표도 미래 수익을 보장하지는 않아요.</p>
  </section>

'''
evid = ('''  <details class="evid" id="evid">
    <summary><span class="ev-t"><b>근거 자료 보기</b><small>3·5·10년 구간 산포도, 예측 가능성 세부 점수, 운 점검 수치, 지표 설명 — 원하는 분만</small></span></summary>
''' + disp + trust + '''  <section class="panel">
    <div class="panel-head"><h2>더 깊이 보기</h2><p class="help">지표가 무엇이고 어떻게 계산했는지, 시기를 나눠 본 판정은 아래에 있어요.</p></div>
    <div class="row"><button class="btn ghost sm" type="button" data-goto="m-12">지표 설명 (도움말)</button><button class="btn ghost sm" type="button" data-goto="sec-period">시기별 판정 (고급 점검)</button><button class="btn ghost sm" type="button" data-goto="o-walk-sec">직전 기간으로 고른 비중의 다음 성과 (고급)</button></div>
  </section>
  </details>

''')
aichk = '''  <section class="panel scard" aria-labelledby="h-ai-check" id="sec-ai-check">
    <div class="sc-h"><span class="sc-n">2</span><div><h2 id="h-ai-check">추천 비중의 결과와 검증</h2><p class="sc-q">AI 추천 비중을 내 포트폴리오와 같은 기간 · 같은 방법으로 백테스트하고 검증했어요</p></div></div>
    <p class="small muted" id="ai-when"></p>
    <p class="say1" id="ai-say"></p>
    <div id="ai-kpi"></div>
    <div class="legend" id="lg-ai"></div>
    <div class="chart-box" id="c-ai"></div>
    <h3 class="sc-sub">검증 — 정합성 · 신빙성</h3>
    <div class="vcards" id="ai-cards"></div>
    <h3 class="sc-sub">AI가 고르는 방식 자체는 믿을 만한가</h3>
    <div class="sum-pbo" id="sum-pbo"></div>
    <details class="more"><summary>운 점검표 보기</summary><div id="ai-luck" class="lgrid-wrap"></div></details>
    <p class="small muted">AI 추천은 추가로 검토해 볼 대안이에요. 과거 데이터로 고른 비중이라 내 포트폴리오보다 과거 성과가 좋아 보이는 것이 당연해요. 정합성 · 신빙성이 내 포트폴리오보다 뚜렷하게 나을 때만 바꿀 이유가 돼요.</p>
  </section>

'''
advhead = '''  <section class="panel only-basic adv-cta">
    <div class="panel-head"><h2>고급 최적화 도구</h2><p class="help">기간별 최적 비중, MDD 한도별 최고 CAGR 표, 10·20·30년 장기 유지 추천, 생애 주기, 비중 조합 지도는 ‘모든 기능’을 켜면 이 아래에 보여요.</p></div>
    <div class="row"><button class="btn ghost" type="button" id="opt-more">고급 최적화 도구 보기</button></div>
  </section>
  <div class="adv-sec">
  <div class="adv-sep"><span>고급 최적화 도구</span></div>
'''

# ---------- new panes ----------
setup = panes['g-setup']
setup = _re.sub(r'  <div class="gsec" id="g-setup">.*?\n', gsec('g-setup', 'i-setup', '1단계', '내 포트폴리오', '종목과 비중, 기간, 처음 넣는 돈을 정해요. 다른 모든 탭이 이 설정을 함께 써요.'), setup, count=1)
setup = _re.sub(r'  <nav class="pane-nav tabs-only".*?</nav>\n', pnav(('g-sum', '백테스트 결과 보기 →', False)), setup, count=1)

res = (open_('g-sum', 'pane-sum') + gsec('g-sum', 'i-results', '2단계', '백테스트 결과', '이 비중으로 과거에 들고 있었다면 얼마나 불었고, 얼마나 떨어졌고, 어떻게 회복했나.') + ctx_sum
       + jnav('결과 바로가기', [(1, 'sum-1', '성과', False), ('↗', 'h-charts', '차트', False), (2, 'sec-recov', '하락·회복', False), (3, 'sum-5', '방어 규칙', False)])
       + dmb + sum1 + rflow + charts + hero + trail + mdd + recov + sum5 + advlead + '\n' + radv
       + pnav(('g-setup', '← 포트폴리오', True), ('g-results', '검증 보기 →', False)) + '  </div>\n\n')
ver = (open_('g-results', 'pane-results') + gsec('g-results', 'i-checks', '3단계', '검증', '이 결과가 기간을 바꿔도 비슷했는지(정합성), 운이나 우연이 아니었는지(신빙성) 판정해요. 근거 자료는 원하는 분만 펼쳐 보세요.') + ctx_res
       + jnav('검증 바로가기', [('✓', 'sec-verdict', '한눈에', False), (1, 'sum-2', '정합성', False), (2, 'sum-3', '신빙성', False), ('+', 'evid', '근거 자료', False)])
       + verdict + sum2 + sum3 + evid
       + pnav(('g-sum', '← 결과', True), ('g-opt', 'AI 추천 보기 →', False)) + '  </div>\n\n')
ai = (open_('g-opt', 'pane-opt') + gsec('g-opt', 'i-opt', '4단계 · 추가 검토', 'AI 추천', '고른 종목으로 AI가 오래 들고 갈 비중을 추천하고, 그 비중도 같은 방법으로 백테스트 · 검증해요. 내 포트폴리오와 비교해 보는 참고용이에요.')
      + jnav('AI 추천 바로가기', [(1, 'sum-4', '추천 비중', False), (2, 'sec-ai-check', '결과·검증', False), ('+', 'sec-opt', '고급 도구', True)])
      + sum4 + aichk + advhead + oadv + '  </div>\n'
      + pnav(('g-results', '← 검증', True), ('g-flow', '적립·인출 →', False)) + '  </div>\n\n')
flow = panes['g-flow']
flow = flow.replace('<span class="g-eye">기본 · 4단계</span>', '<span class="g-eye">더보기</span>')
flow = _re.sub(r'  <nav class="pane-nav tabs-only".*?</nav>\n', pnav(('g-opt', '← AI 추천', True), ('g-setup', '처음으로', True)), flow, count=1)
chk = panes['g-checks']
chk = _re.sub(r'<span class="g-eye">고급 · 5단계</span><h2 class="grp-t">점검</h2>', '<span class="g-eye">더보기 · 고급</span><h2 class="grp-t">고급 점검</h2>', chk)
chk = _re.sub(r'  <nav class="pane-nav tabs-only".*?</nav>\n', pnav(('g-results', '← 검증', True), ('g-opt', 'AI 추천 →', False)), chk, count=1)
ref = panes['g-ref']
ref = _re.sub(r'  <nav class="pane-nav tabs-only".*?</nav>\n', pnav(('g-setup', '처음으로', True)), ref, count=1)
# leftovers must be empty shells
for g in ['g-sum', 'g-results']:
    left = _re.sub(r'<nav class="sum-nav".*?</nav>', '', panes[g], flags=_re.S)
    left = _re.sub(r'<div class="gsec".*?\n|<nav class="(sum-nav|jump|pane-nav)[^\n]*\n|<div class="pane"[^\n]*\n|</div>\n|\s+', '', left)
    assert left == '', (g, left[:300])
h = head + setup + res + ver + ai + flow + chk + ref + tail

# ---------- navigation ----------
a = h.index('    <nav class="tb-nav" id="tb-nav"'); b = h.index('</nav>', a) + 6
h = h[:a] + '''    <nav class="tb-nav" id="tb-nav" aria-label="섹션 바로가기">
      <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span><i class="n">1</i>포트폴리오</span></a>
      <a href="#g-sum" data-g="g-sum"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span><i class="n">2</i>결과</span></a>
      <a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span><i class="n">3</i>검증</span></a>
      <a href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span><i class="n">4</i>AI 추천</span></a>
      <span class="nav-sep" aria-hidden="true"></span>
      <a href="#g-flow" data-g="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span>적립·인출</span></a>
      <a class="adv-nav" href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>고급 점검</span></a>
      <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
    </nav>''' + h[b:]
a = h.index('<nav class="bnav" id="bnav"'); b = h.index('</nav>', a) + 6
h = h[:a] + '''<nav class="bnav" id="bnav" aria-label="탭">
  <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span>포트폴리오</span></a>
  <a href="#g-sum" data-g="g-sum"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span>결과</span></a>
  <a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>검증</span></a>
  <a href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span>AI 추천</span></a>
  <a href="#g-flow" data-g="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span>적립·인출</span></a>
  <a class="adv-nav" href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>고급 점검</span></a>
  <a class="only-basic bn-more" href="#g-checks" data-g="g-checks" id="bn-more"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg><span>고급 켜기</span></a>
  <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
  <button type="button" class="bn-more2" id="bn-more2" aria-haspopup="dialog"><svg class="ic" aria-hidden="true"><use href="#i-more"/></svg><span>더보기</span></button>
</nav>''' + h[b:]
a = h.index('    <button class="sheet-i" type="button" data-go="g-checks">'); b = h.index('    <div class="sheet-mode">', a)
h = h[:a] + '''    <button class="sheet-i" type="button" data-go="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span><b>적립·인출</b><small>매달·매년 넣기, 꺼내 쓰기, 세금·환율, 은퇴 인출 점검</small></span></button>
    <button class="sheet-i" type="button" data-go="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span><b>고급 점검 <em>고급</em></b><small>시기를 나눈 판정, 시작×끝 연도 지도, 추세 보정</small></span></button>
    <button class="sheet-i" type="button" data-go="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span><b>도움말</b><small>앱 구성, 용어, ETF 설명, 화면 설정</small></span></button>
''' + h[b:]
rep('<small>결과 탭의 고급 지표와 점검·최적화를 모두 보여요</small>', '<small>결과의 고급 지표, 고급 점검, 고급 최적화 도구를 모두 보여요</small>')

# ---------- start guide and site map ----------
GC = {'sum-1': '2 결과', 'sum-2': '3 검증', 'sum-4': '4 AI 추천', 'sum-5': '2 결과', 'sec-acc': '더보기 · 적립·인출', 'sec-rt': '더보기 · 적립·인출', 'sec-fl-set': '더보기 · 적립·인출', 'sec-period': '더보기 · 고급 점검'}
for k, v in GC.items():
    h = _re.sub(rf'(data-goto="{k}"><span class="g-cat">)[^<]*(</span>)', rf'\g<1>{v}\g<2>', h)
a = h.index('        <button class="goal" type="button" data-goto="sum-5">')
h = h[:a] + '        <button class="goal" type="button" data-goto="sec-recov"><span class="g-cat">2 결과</span><b>떨어지면 어떻게 해야 빨리 회복할까</b><span class="g-d">방법 × 시기별 회복 기간 비교</span></button>\n' + h[a:]
a = h.index('    <div class="map">', h.index('id="sec-map"')); b = h.index('    <p class="small muted">기본 보기에서는', a)
L_ = lambda t, x, adv=False: f'<li><button type="button" class="map-link{" adv" if adv else ""}" data-goto="{t}">{x}</button></li>'
card = lambda n, t, d, items: f'        <div class="map-card"><h3><i class="n">{n}</i>{t}</h3><p>{d}</p><ul>{"".join(items)}</ul></div>\n'
h = h[:a] + '    <div class="map">\n      <div class="map-col"><span class="map-cat">네 단계</span>\n' + \
    card('1', '내 포트폴리오', '무엇을, 얼마씩, 언제부터', [L_('sec-style', '투자 방식: 한 번에 · 매달 · 매년 초 · 꺼내 쓰기'), L_('sec-ports', '포트폴리오 3개와 예시'), L_('sec-set', '기간 · 처음 넣는 돈 · 통화 · 리밸런싱')]) + \
    card('2', '백테스트 결과', '얼마나 불고, 떨어지고, 회복했나', [L_('sum-1', '성과 한눈에: CAGR · MDD'), L_('h-charts', '자산 성장 · 낙폭 차트'), L_('sec-trail', '최근 10~30년 성과'), L_('sec-recov', '하락과 회복: 언제, 어떻게'), L_('sum-5', '방어 규칙 시험')]) + \
    card('3', '검증', '앞으로도 믿을 수 있나', [L_('sec-verdict', '판정 카드'), L_('sum-2', '정합성: 기간별 차이, 3·5·10년 범위'), L_('sum-3', '신빙성: 운 점검 4가지'), L_('evid', '근거 자료')]) + \
    card('4', 'AI 추천', '추가 검토용 대안', [L_('sum-4', '추천 비중'), L_('sec-ai-check', '추천 비중의 결과와 검증'), L_('sec-fix', 'MDD 한도별 최고 CAGR (고급)', True), L_('sec-keep', '10·20·30년 장기 유지 (고급)', True)]) + \
    '      </div>\n      <div class="map-col"><span class="map-cat">더보기</span>\n' + \
    card('+', '적립·인출', '꾸준히 넣고 꺼내 쓴다면', [L_('sec-fl-set', '넣는 돈 · 빼는 돈 · 세금 · 환율'), L_('sec-acc', '적립하면 얼마나 모일까'), L_('sec-rt', '은퇴 인출 점검')]) + \
    card('+', '고급 점검', '시기를 나눠 깊이', [L_('sec-period', '구간별 판정', True), L_('pc-heat-sec', '시작 연도 × 끝 연도 지도', True), L_('sec-trend', '추세 유지 보정', True)]) + \
    '      </div>\n    </div>\n' + h[b:]
h = _re.sub(r'(<h2 id="h-map">이 계산기의 구성</h2><p class="help">)[^<]*', r'\g<1>네 단계로 써요: 1 내 포트폴리오에서 종목·비중을 정하면 → 2 결과에서 과거 성과와 하락·회복을 보고 → 3 검증에서 얼마나 믿을 만한지 판정을 보고 → 4 AI 추천에서 대안을 검토해요. 항목을 누르면 그곳으로 가요.', h)

# ---------- glossary ----------
rep('      <div><dt>방어 규칙</dt>', '      <div><dt>정합성 · 신빙성</dt><dd>정합성은 기간을 바꿔도 결과가 비슷했는지(3·5·10년 구간 결과가 얼마나 모여 있나), 신빙성은 그 결과가 운이나 우연이 아닌지(유의성 · 비중 민감도 · 기록 길이 · 부트스트랩)예요. 3 검증 탭에서 봐요.</dd></div>\n      <div><dt>회복 기간</dt><dd>고점에서 떨어진 뒤 그 고점을 다시 넘기까지 걸린 시간이에요. 2 결과 › 하락과 회복에서 방법·시기별로 비교해요.</dd></div>\n      <div><dt>방어 규칙</dt>')
h = h.replace('요약 ⑤에서 시험해요.', '2 결과 › 방어 규칙에서 시험해요.')

# ---------- script ----------
rep("  const TAB_IDS = ['g-setup', 'g-sum', 'g-results', 'g-flow', 'g-checks', 'g-opt', 'g-ref'];", "  const TAB_IDS = ['g-setup', 'g-sum', 'g-results', 'g-opt', 'g-flow', 'g-checks', 'g-ref'];")
rep("  const ADV_TABS = ['g-checks', 'g-opt'];", "  const ADV_TABS = ['g-checks'];")
rep("    if (state.layout === 'tabs' && state.tab !== 'g-opt' && state.tab !== 'g-sum') return;\n    if (state.mode === 'basic' && state.tab !== 'g-sum' && state.layout === 'tabs') return;\n", "    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;\n")
rep("bm.classList.toggle('on', ['g-checks', 'g-opt', 'g-ref'].includes(g));", "bm.classList.toggle('on', ['g-flow', 'g-checks', 'g-ref'].includes(g));")
rep("""!!(t && t.closest('details.adv') && t.closest('.pane[data-g="g-results"]'))""", "!!(t && (t.closest('details.adv') || t.closest('.adv-sec')))")
rep("toast(on ? '모든 기능을 켰어요. 4 점검 · 5 최적화 탭이 보여요.'", "toast(on ? '모든 기능을 켰어요. 고급 점검 탭과 고급 최적화 도구가 보여요.'")
rep("  function fullOn(msg) { if (state.mode === 'full') return; setMode('full', true); toast(msg || '점검·최적화도 보이도록 모든 기능을 켰어요. 위쪽 스위치나 도움말 › 화면 설정에서 끌 수 있어요.'); }",
    "  function fullOn(msg) { if (state.mode === 'full') return; setMode('full', true); toast(msg || '고급 점검 · 고급 최적화 도구도 보이도록 모든 기능을 켰어요. 위쪽 스위치나 도움말 › 화면 설정에서 끌 수 있어요.'); }")
rep("    drawSum(); renderSumAI();\n  }", "    drawSum(); renderSumAI(); renderVerdict(); renderSay();\n  }")
rep("state.sum = null; drawSum(); renderSumAI(); return; }", "state.sum = null; drawSum(); renderSumAI(); renderVerdict(); renderSay(); return; }")
rep("  function drawSumAI() {\n", "  function drawSumAI() {\n    renderAICheck();\n")
h = h.replace("drawTrail(); drawTrustRes(); drawGuard(); }", "drawTrail(); drawTrustRes(); drawGuard(); drawRecov(); drawAICheck(); }").replace("drawTrail(); drawTrustRes(); drawGuard(); });", "drawTrail(); drawTrustRes(); drawGuard(); drawRecov(); drawAICheck(); });")
extra = (R / 'src/app_recov.js').read_text() + (R / 'src/app_verdict.js').read_text() + '''
  /* plain sentences on top of the results */
  function renderSay() {
    const host = $('#sum-say'); if (!host) return; host.innerHTML = '';
    const L = state.last; if (!L) return;
    for (const x of L.series.filter(s => !s.bench).slice(0, 3)) {
      const p = el('p'); const k = el('span', 'key'); k.style.background = x.color; p.appendChild(k);
      const mi = x.st.mddInfo, uw = x.st.uw;
      p.appendChild(el('b', null, x.name + ' '));
      p.appendChild(document.createTextNode(`처음 ${money(state.initial)} → ${BT.label(L.e)}에 ${money(state.initial * x.st.final)}. 해마다 평균 ${pct(x.st.cagr, 1)}씩 불었고, 가장 크게 떨어졌을 때는 ${mpct1(x.st.mdd)}${mi && mi.mdd < 0 ? `(${mi.peakLabel}→${mi.troughLabel})` : ''}, 고점을 되찾기까지 가장 오래 걸린 때는 ${uw.months ? dur(uw.months) + (uw.ongoing ? ' 넘게(아직 회복 중)' : '') : '없음'}이에요.`));
      host.appendChild(p);
    }
  }
  document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details.more, details.evid') && d.open) redrawVisible(); }, true);
  $('#opt-more').addEventListener('click', () => { fullOn(); requestAnimationFrame(() => goTo('sec-opt')); });
'''
rep("  /* ---------- boot ---------- */", extra + "\n  /* ---------- boot ---------- */")

# ---------- CSS ----------
rep(':root[data-mode="basic"] .pane[data-g="g-opt"],', ':root[data-mode="basic"] .adv-sec,')
rep(':root[data-mode="basic"] .pane[data-g="g-results"] details.adv,', ':root[data-mode="basic"] .pane details.adv,')
rep(':root[data-mode="basic"] .pane[data-g="g-results"] .adv-lead,', ':root[data-mode="basic"] .pane .adv-lead,\n:root[data-mode="basic"] .sum-nav .adv,')
rep(':root.tabs .bnav a[data-g="g-checks"], :root.tabs .bnav a[data-g="g-opt"], :root.tabs .bnav a[data-g="g-ref"], :root.tabs .bnav a.bn-more { display: none !important; }',
    ':root.tabs .bnav a[data-g="g-checks"], :root.tabs .bnav a[data-g="g-flow"], :root.tabs .bnav a[data-g="g-ref"], :root.tabs .bnav a.bn-more { display: none !important; }')
css80 = """
/* v8.0: four steps */
.sum-nav, .sum-nav[class] { grid-template-columns: none !important; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); }
#quick2 { display: none; }
.say { display: grid; gap: 6px; margin: 4px 0 10px; }
.say p { margin: 0; font-size: 14px; line-height: 1.55; padding: 8px 12px; background: var(--panel-2); border-radius: 10px; }
.say .key, .vc-h .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px; vertical-align: 0; }
.say1 { font-size: 14px; line-height: 1.55; font-weight: 600; margin: 4px 0 10px; }
/* recovery */
.rc-say { border: 1px solid color-mix(in srgb, var(--pos) 40%, var(--line-2)); background: color-mix(in srgb, var(--pos) 7%, var(--panel)); border-radius: 12px; padding: 12px 14px; margin: 8px 0 6px; }
.rc-say:empty { display: none; }
.rc-say p { margin: 4px 0; font-size: 14px; line-height: 1.55; }
.rc-best { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.rc-best b { font-size: 16px; }
.rc-tag { font-size: 11.5px; font-weight: 700; color: var(--panel); background: var(--pos); border-radius: 999px; padding: 2px 8px; }
.rgrid { border-collapse: separate; border-spacing: 3px; width: 100%; }
.rgrid thead th { font-size: 12px; font-weight: 600; color: var(--ink-2); text-align: center; border-bottom: 0; padding: 4px; }
.rgrid thead th:first-child { text-align: left; }
.rgrid tbody th { text-align: left; font-family: var(--font-sans); padding: 4px 6px 4px 0; border-bottom: 0; min-width: 120px; max-width: 220px; }
.rgrid tbody th b { display: block; font-size: 12.5px; color: var(--ink); line-height: 1.3; }
.rgrid tbody th small { display: block; font-size: 11px; color: var(--muted); font-weight: 400; line-height: 1.35; margin-top: 2px; }
.rgrid td { cursor: pointer; text-align: center; padding: 6px 3px; border-radius: 8px; border: 2px solid transparent; border-bottom: 2px solid transparent; position: relative;
  background: color-mix(in srgb, var(--pos) calc(var(--g, 0) * 36%), color-mix(in srgb, var(--neg) calc(var(--r, 0) * 26%), var(--panel-2))); }
.rgrid td b { display: block; font-size: 12.5px; color: var(--ink); white-space: nowrap; }
.rgrid td span { display: block; font-size: 10.5px; font-family: var(--font-mono); color: var(--ink-2); }
.rgrid td span.neg { color: var(--neg); font-weight: 700; }
.rgrid td.sel { border-color: var(--ink); }
.rgrid td.best::after { content: "★"; position: absolute; top: 1px; right: 4px; font-size: 11px; color: var(--pos); }
.rgrid td:hover { border-color: var(--ink-2); }
.rgrid tr.hold td { background: var(--panel-2); }
.rctbl th, .rctbl td { white-space: nowrap; font-size: 12.5px; text-align: left; }
#rc-ep { margin: 4px 0; }
.lgrid-wrap, details.more, details.evid { max-width: 100%; }
.scard, .vcard, .scard > * { min-width: 0; }
/* verdict cards */
.vsteps { list-style: none; padding: 0; margin: 6px 0 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; counter-reset: vs; }
.vsteps li { border: 1px solid var(--line-2); border-radius: 10px; padding: 8px 10px; display: grid; gap: 2px; counter-increment: vs; }
.vsteps li b { font-size: 13px; } .vsteps li b::before { content: counter(vs) " "; color: var(--muted); font-family: var(--font-mono); }
.vsteps li span { font-size: 12px; color: var(--muted); line-height: 1.4; }
.vcards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; }
.vcard { border: 1px solid var(--line-2); border-radius: 14px; padding: 12px 14px; display: grid; gap: 10px; min-width: 0; background: var(--panel); }
.vc-h { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.vc-h b { font-size: 15px; margin-right: auto; }
.vbadge { font-size: 12.5px; font-weight: 700; border-radius: 999px; padding: 3px 10px; }
.vbadge.hi { background: color-mix(in srgb, var(--pos) 16%, transparent); color: var(--pos); }
.vbadge.mid { background: color-mix(in srgb, var(--warn) 18%, transparent); color: var(--warn); }
.vbadge.lo { background: color-mix(in srgb, var(--neg) 14%, transparent); color: var(--neg); }
.vc-r { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 4px 10px; align-items: center; }
.vc-l b { display: block; font-size: 13.5px; } .vc-l small { display: block; font-size: 11px; color: var(--muted); line-height: 1.3; }
.vc-m { display: flex; align-items: center; gap: 8px; min-width: 0; }
.vc-m em { font-style: normal; font-weight: 700; font-size: 13px; white-space: nowrap; }
.vc-p { grid-column: 1 / -1; margin: 0; font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
.vm { flex: 1; height: 10px; border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, var(--neg) 14%, transparent) 0 60%, color-mix(in srgb, var(--warn) 16%, transparent) 60% 80%, color-mix(in srgb, var(--pos) 16%, transparent) 80%); position: relative; overflow: hidden; }
.vm i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; background: var(--ink-2); }
.vm.hi i { background: var(--pos); } .vm.mid i { background: var(--warn); } .vm.lo i { background: var(--neg); }
.vd4 { display: flex; gap: 4px; flex: 1; }
.vd4 i { flex: 1; height: 10px; border-radius: 3px; background: var(--line-2); max-width: 40px; }
.vd4 i.on { background: var(--pos); }
.vc-f { border-top: 1px dashed var(--line-2); padding-top: 8px; display: grid; gap: 6px; }
.vc-f > b { font-size: 12.5px; }
.vr { position: relative; height: 34px; margin: 0 18px; }
.vr::before { content: ""; position: absolute; left: 0; right: 0; top: 9px; height: 4px; background: var(--line); border-radius: 2px; }
.vr-0 { position: absolute; top: 2px; height: 18px; width: 0; border-left: 1.5px dashed var(--ink-2); }
.vr-b { position: absolute; top: 5px; height: 12px; border-radius: 6px; background: color-mix(in srgb, var(--pos) 55%, transparent); }
.vr-b.neg { background: linear-gradient(90deg, color-mix(in srgb, var(--neg) 45%, transparent), color-mix(in srgb, var(--pos) 55%, transparent)); }
.vr-m { position: absolute; top: 2px; height: 18px; width: 3px; margin-left: -1.5px; background: var(--ink); border-radius: 2px; }
.vr-a, .vr-c { position: absolute; top: 20px; font-size: 11px; font-family: var(--font-mono); color: var(--ink-2); transform: translateX(-50%); white-space: nowrap; }
.vc-n { margin: 0; }
/* AI check */
.aikpi { min-width: 460px; }
.aikpi th, .aikpi td { white-space: nowrap; font-size: 13px; }
.aikpi tbody th { text-align: left; font-family: var(--font-sans); }
.aikpi tr.ai th, .aikpi tr.ai td { font-weight: 700; }
.aikpi .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
#sec-ai-check.empty-sec .chart-box, #sec-ai-check.empty-sec .sc-sub, #sec-ai-check.empty-sec details { display: none; }
/* evidence and advanced */
details.evid { border: 1px dashed var(--line-2); border-radius: 14px; padding: 0; margin: 4px 0 14px; }
details.evid > summary { list-style: none; cursor: pointer; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
details.evid > summary::-webkit-details-marker { display: none; }
details.evid > summary::before { content: ""; width: 8px; height: 8px; border-right: 2px solid var(--focus); border-bottom: 2px solid var(--focus); transform: rotate(-45deg); transition: transform 0.15s; flex: none; }
details.evid[open] > summary::before { transform: rotate(45deg); }
.ev-t b { display: block; color: var(--focus); font-size: 15px; } .ev-t small { display: block; color: var(--muted); font-size: 12.5px; margin-top: 2px; }
details.evid[open] { padding: 0 10px 10px; border-style: solid; }
details.evid > .panel { margin-bottom: 12px; }
.adv-sep { display: flex; align-items: center; gap: 10px; margin: 18px 0 10px; color: var(--muted); font-size: 12.5px; font-weight: 700; }
.adv-sep::before, .adv-sep::after { content: ""; flex: 1; border-top: 1px solid var(--line-2); }
@media (max-width: 640px) {
  .vsteps { grid-template-columns: 1fr; }
  .vsteps li { grid-template-columns: auto 1fr; align-items: baseline; gap: 8px; padding: 6px 10px; }
  .vcards { grid-template-columns: 1fr; }
  .vc-r { grid-template-columns: 86px minmax(0, 1fr); }
  .rgrid tbody th { min-width: 0; width: 34%; }
  .rgrid tbody th b { font-size: 11.5px; }
  .rgrid { border-spacing: 2px; }
  .rgrid tbody th small { display: none; }
  .rgrid td b { font-size: 11.5px; }
  .say p { font-size: 13.5px; }
  .sum-nav button { font-size: 11px !important; }
}
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css80)
rep('title="점검·최적화 탭과 결과의 고급 항목도 보여요"', 'title="고급 점검 탭, 결과의 고급 항목, 고급 최적화 도구도 보여요"')
rep('<p class="small muted">기본 보기에서는 점검·최적화 탭과 결과의 고급 항목이 숨겨져 있어요. 고급 항목을 누르면 모든 기능이 켜져요.</p>', '<p class="small muted">기본 보기에서는 고급 점검 탭, 결과의 고급 항목, AI 추천의 고급 최적화 도구가 숨겨져 있어요. 고급 항목을 누르면 모든 기능이 켜져요.</p>')
rep("  $('#more-on').addEventListener('click',", "  if ($('#more-on')) $('#more-on').addEventListener('click',")
rep("    const host = $('#sum-pbo'); if (!host) return; host.innerHTML = '';", "    const host = $('#sum-pbo'); if (!host) return; host.innerHTML = ''; if (!isShown(host)) return;")
h = h.replace("— 그대로 두면 ${durS(hold.avg)}라 평균 ${durS(faster)} 빨랐어요.", "— 그대로 두기(평균 ${durS(hold.avg)})보다 ${durS(faster)} 빨랐어요.").replace("아래 ⑤ 방어 규칙 설정을 같이 써요", "아래 ③ 방어 규칙 설정을 같이 써요")
rep("    if (!S || !isShown($('#c-sum-bf'))) { drawSumAI(); return; }", "    if (!S || !['#c-sum-bf', '#c-sum-per', '#sum-luck-grid'].some(s => isShown($(s)))) { drawSumAI(); return; }")
