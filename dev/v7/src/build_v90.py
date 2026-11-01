# ================= v9.0: only what verification needs — spread over 2·5·10·20·30 years, correlation, AI on the period it did not see =================
import re as _re
rep('<dt>v8.1 · 2026.10.29</dt>', """<dt>v9.0 · 2026.10.29</dt>
          <dd><ul>
            <li>3 검증을 네 가지로 정리: 판정 카드 · 2·5·10·20·30년 보유 편차(가장 최근 구간 표시) · 종목 간 상관성 · 근거 자료</li>
            <li>상관성 추가: 종목끼리의 상관계수 표(전체 / 2000~2020 / 2021~), 포트폴리오별 평균 상관, 기준 종목이 한 달에 5% 넘게 빠진 달의 종목별 평균 수익률</li>
            <li>정합성 점수를 2·5·10년 구간으로 계산(20·30년은 겹치는 구간이 많아 참고로만 표시). 신빙성은 유의성 · 비중 민감도 2가지로 줄임(기록 길이 · 부트스트랩은 같은 샤프 검정의 반복)</li>
            <li>4 AI 추천 검증: 과최적화 확률을 AI 카드에 넣고, ‘고를 때 안 쓴 기간’ 점검(직전 기간만으로 AI 방식으로 고른 비중의 그 뒤 10·20년 성과)을 자동 계산</li>
            <li>뺀 항목: 포트폴리오별 숫자 카드, 최근 10~30년 성과, MDD 구분, 자세한·위험 지표, 롤링 수익률, 기간별 점 그래프·3·5·10년 범위·산포도, 운 점검표, 고급 점검 탭(시기별 판정·시작×끝 지도·추세 보정), MDD 한도별 표, 신뢰도 반영 최적화, 기간별 최적, 장기 유지, 시대별, 생애 주기, 효율적 경계, AI의 다른 선택</li>
            <li>보기 모드(기본/모든 기능) 없앰 — 남은 항목은 모두 보여요</li>
          </ul></dd>
          <dt>v8.1 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v8.1</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.0</span></h1>')
rep('<span class="upd-v">v8.1</span><span class="upd-d">2026.10.29</span><span class="upd-t">예시 포트폴리오를 60/40 · 균형 · 노후로 바꿨어요</span>',
    '<span class="upd-v">v9.0</span><span class="upd-d">2026.10.29</span><span class="upd-t">검증에 필요한 것만 남기고, 기간 편차와 상관성을 더했어요</span>')

def cut_h(ident, keep_text=False):
    global h
    i = h.index(f' id="{ident}"'); s = h.rfind('\n', 0, i) + 1
    tag = _re.match(r'\s*<(\w+)', h[s:]).group(1)
    depth = 0
    for m in _re.finditer(rf'<{tag}\b|</{tag}>', h[s:]):
        depth += -1 if m.group(0).startswith('</') else 1
        if depth == 0: e = s + m.end(); break
    while e < len(h) and h[e] == '\n': e += 1
    blk = h[s:e]; h = h[:s] + h[e:]
    return blk.rstrip('\n') + '\n'
def cut_line(needle):
    global h
    i = h.index(needle); s = h.rfind('\n', 0, i) + 1; e = h.index('\n', i) + 1
    blk = h[s:e]; h = h[:s] + h[e:]; return blk

retired = ''.join(cut_h(i) for i in ['sec-hero', 'sec-trail', 'sec-mdd', 'sec-sum', 'sec-risk', 'sec-roll', 'sum-2', 'sum-3', 'sec-disp',
                                      'sec-fix', 'sec-trust-opt', 'sec-hz', 'sec-keep', 'o-era-sec', 'o-adj-sec', 'o-life-sec', 'o-walk-sec', 'o-front-sec', 'pane-checks'])
retired += cut_line('<p class="adv-lead">아래 ‘고급’ 항목은')
a = h.index('  <section class="panel only-basic adv-cta">'); b = h.index('</section>', a) + len('</section>\n')
retired += h[a:b]; h = h[:a] + h[b:]
a = h.index('\n</div>\n<nav class="bnav"')
h = h[:a] + '\n<div id="retired" hidden aria-hidden="true">\n' + retired + '</div>' + h[a:]

# ---------- 2 results ----------
rep('<details class="panel fold adv" data-fold="r-annual" id="sec-annual">', '<details class="panel fold" data-fold="r-annual" id="sec-annual">')
sum5 = cut_h('sum-5')
sum5 = sum5.replace('<span class="sc-n">3</span>', '<span class="sc-n">⚙</span>')
guard = ('  <details class="evid" id="guard-fold">\n    <summary><span class="ev-t"><b>방어 규칙 직접 설정해 보기</b><small>언제 줄일지 · 얼마나 · 어디로 · 언제 되돌릴지를 내가 정해서 시험 — 발동 기준 × 되돌리는 기준 민감도 표</small></span></summary>\n'
         + sum5 + '  </details>\n\n')
a = h.index('  <details class="panel fold" data-fold="r-annual" id="sec-annual">')
h = h[:a] + guard + h[a:]
h = h.replace('아래 ③ 방어 규칙 설정을 같이 써요', '아래 ‘방어 규칙 직접 설정해 보기’ 설정을 같이 써요')
h = _re.sub(r'  <nav class="sum-nav" aria-label="결과 바로가기">.*?</nav>', '  <nav class="sum-nav" aria-label="결과 바로가기"><button type="button" data-goto="sum-1"><i>1</i>성과</button><button type="button" data-goto="h-charts"><i>↗</i>차트</button><button type="button" data-goto="sec-recov"><i>2</i>하락·회복</button><button type="button" data-goto="sec-annual"><i>▦</i>연도별</button></nav>', h, count=1, flags=_re.S)

# ---------- 3 verification ----------
spread = '''  <section class="panel scard" aria-labelledby="h-spread" id="sec-spread">
    <div class="sc-h"><span class="sc-n">1</span><div><h2 id="h-spread">정합성 — 언제 시작했느냐에 따라 얼마나 달랐나</h2><p class="sc-q">2·5·10·20·30년을 들고 있었다면, 시작한 달마다 결과가 얼마나 벌어지나</p></div></div>
    <p class="small muted" id="sp-when"></p>
    <div class="sp-ctl"><div class="seg-toggle" id="sp-m" role="group" aria-label="볼 값"><button type="button" data-m="c" aria-pressed="true">CAGR</button><button type="button" data-m="m" aria-pressed="false">구간 MDD</button></div></div>
    <div class="legend" id="lg-spread"></div>
    <div class="chart-box" id="c-spread"></div>
    <p class="help">굵은 막대 = 시작한 달의 80%(하위 10% ~ 상위 10%), 가는 선 = 최저 ~ 최고, 세로 눈금 = 가운데, ◆ = 가장 최근 구간(지금부터 거꾸로 N년). 막대가 짧을수록 언제 시작해도 비슷했어요(정합성이 높아요).</p>
    <p class="help">‘독립 N개’는 서로 겹치지 않는 구간 수예요. 20·30년은 겹치는 구간이 많아 실제로는 1~2번의 경험이라, 막대가 짧아도 정합성의 증거로 보기 어려워요. 그래서 정합성 점수는 2·5·10년으로 매겨요.</p>
    <details class="more"><summary>숫자 표 보기</summary><div class="tbl-wrap"><table id="t-spread" class="sptbl"></table></div></details>
  </section>

  <section class="panel scard" aria-labelledby="h-corr" id="sec-corr">
    <div class="sc-h"><span class="sc-n">2</span><div><h2 id="h-corr">상관성 — 내 종목끼리 같이 움직이나</h2><p class="sc-q">같이 움직이는 종목만 모으면 비중을 나눠도 분산 효과가 없어요</p></div></div>
    <div class="seg-toggle" id="cr-p" role="group" aria-label="기간"><button type="button" data-p="all" aria-pressed="true">전체</button><button type="button" data-p="e1" aria-pressed="false">2000~2020</button><button type="button" data-p="e2" aria-pressed="false">2021~</button></div>
    <p class="small muted" id="cr-when"></p>
    <p class="note" id="cr-msg" hidden></p>
    <div class="cr-port" id="cr-port"></div>
    <div class="tbl-wrap" id="c-corr"></div>
    <p class="help">1에 가까울수록(빨강) 같이 움직이고, 0이면 따로, 마이너스(파랑)면 반대로 움직여요. 회색 이름은 비교용 기준(QQQ · SPY)이에요. 상관은 시기에 따라 바뀌어요 — 미국 국채는 2000~2020년에는 주식과 반대였지만 2021년 이후에는 같은 방향이 많았어요.</p>
    <h3 class="sc-sub">기준 종목이 크게 빠진 달에는</h3>
    <div class="chips" id="cr-ref" role="group" aria-label="기준 종목"></div>
    <p class="small muted" id="cr-dn-say"></p>
    <div class="chart-box" id="c-corr-dn"></div>
    <p class="help">상관이 낮아도 폭락한 달에 같이 떨어지는 종목이 있어요(예: 원자재 · 에너지). 방어 역할은 이 막대가 플러스인지로 보세요.</p>
  </section>

'''
a = h.index('  <details class="evid" id="evid">')
h = h[:a] + spread + h[a:]
h = _re.sub(r'  <nav class="sum-nav" aria-label="검증 바로가기">.*?</nav>', '  <nav class="sum-nav" aria-label="검증 바로가기"><button type="button" data-goto="sec-verdict"><i>✓</i>한눈에</button><button type="button" data-goto="sec-spread"><i>1</i>기간 편차</button><button type="button" data-goto="sec-corr"><i>2</i>상관성</button><button type="button" data-goto="evid"><i>+</i>근거</button></nav>', h, count=1, flags=_re.S)
rep('<ol class="vsteps"><li><b>정합성</b><span>기간을 바꿔도 결과가 비슷했나</span></li><li><b>신빙성</b><span>운이나 우연으로 나온 결과는 아닌가</span></li><li><b>근거 자료</b><span>원하는 분만 맨 아래에서</span></li></ol>',
    '<ol class="vsteps"><li><b>정합성</b><span>2·5·10년, 언제 시작해도 비슷했나</span></li><li><b>신빙성</b><span>유의성 · 비중 민감도 — 운은 아닌가</span></li><li><b>상관성</b><span>종목끼리 정말 분산되어 있나</span></li></ol>')
rep('판정은 정합성(예측 가능성 80점 이상 높음, 60점 이상 보통)과 신빙성(운 점검 4개 중 통과 수)을 합쳐', '판정은 정합성(2·5·10년 구간으로 매긴 점수, 80점 이상 높음 · 60점 이상 보통)과 신빙성(유의성 · 비중 민감도 2개 중 통과 수)을 합쳐')
rep('<small>3·5·10년 구간 산포도, 예측 가능성 세부 점수, 운 점검 수치, 지표 설명 — 원하는 분만</small>', '<small>정합성 세부 점수(수익 산포 · 낙폭 산포 · 나쁜 경우), 신빙성 수치, 지표 설명 — 원하는 분만</small>')
h = _re.sub(r'<button class="btn ghost sm" type="button" data-goto="sec-period">[^<]*</button>', '', h)
h = _re.sub(r'<button class="btn ghost sm" type="button" data-goto="o-walk-sec">[^<]*</button>', '', h)
h = _re.sub(r'<button class="btn ghost sm" type="button" data-goto="sec-trust-opt">[^<]*</button>', '', h)
h = _re.sub(r'<button class="btn ghost sm" type="button" data-goto="sec-fix">[^<]*</button>', '', h)
rep('<p class="help">지표가 무엇이고 어떻게 계산했는지, 시기를 나눠 본 판정은 아래에 있어요.</p>', '<p class="help">지표가 무엇이고 어떻게 계산했는지는 도움말에 있어요.</p>')

# ---------- 4 AI ----------
rep('''    <h3 class="sc-sub">검증 — 정합성 · 신빙성</h3>''', '''    <h3 class="sc-sub">검증 — 정합성 · 신빙성 · 과최적화</h3>''')
rep('''    <h3 class="sc-sub">AI가 고르는 방식 자체는 믿을 만한가</h3>
    <div class="sum-pbo" id="sum-pbo"></div>
    <details class="more"><summary>운 점검표 보기</summary><div id="ai-luck" class="lgrid-wrap"></div></details>
''', '''    <h3 class="sc-sub">고를 때 안 쓴 기간에서도 통했나 <span class="small muted">— 다음 기간 성과</span></h3>
    <p class="help">AI 추천은 전체 기간을 다 보고 고른 거라 과거 성과가 좋아 보이는 게 당연해요. 그래서 마지막 10·20년을 가리고 그 앞 기간만으로 같은 방식(같은 MDD · 회복 한도)으로 비중을 고른 뒤, 가려 둔 기간에 그대로 들고 갔다면 어땠는지 봐요. 빈 원 = 고를 때, 채운 원 = 그 뒤.</p>
    <p class="small muted" id="ai-wf-st" aria-live="polite"></p>
    <div id="ai-wf"></div>
''')
h = _re.sub(r'  <nav class="sum-nav" aria-label="AI 추천 바로가기">.*?</nav>', '  <nav class="sum-nav" aria-label="AI 추천 바로가기"><button type="button" data-goto="sum-4"><i>1</i>추천 비중</button><button type="button" data-goto="sec-ai-check"><i>2</i>결과·검증</button><button type="button" data-goto="sec-opt"><i>⚙</i>계산 설정</button></nav>', h, count=1, flags=_re.S)
rep('  <div class="adv-sec">\n  <div class="adv-sep"><span>고급 최적화 도구</span></div>', '  <div class="opt-set">\n  <div class="adv-sep"><span>AI 계산 설정 — 대상 종목 · 비중 단위 · 기준</span></div>')

# ---------- navigation and mode ----------
h = _re.sub(r'\s*<a class="adv-nav" href="#g-checks" data-g="g-checks">.*?</a>', '', h)
h = _re.sub(r'\s*<a class="only-basic bn-more" href="#g-checks".*?</a>', '', h)
h = _re.sub(r'\s*<button class="sheet-i" type="button" data-go="g-checks">.*?</button>', '', h)
rep("  const TAB_IDS = ['g-setup', 'g-sum', 'g-results', 'g-opt', 'g-flow', 'g-checks', 'g-ref'];", "  const TAB_IDS = ['g-setup', 'g-sum', 'g-results', 'g-opt', 'g-flow', 'g-ref'];")
rep("  const ADV_TABS = ['g-checks'];", "  const ADV_TABS = [];")
rep("    if (m !== 'full' && m !== 'basic') m = 'basic';", "    m = 'full';   // v9: one view — everything that is left is shown")
rep("  $('#bn-more').addEventListener('click',", "  if ($('#bn-more')) $('#bn-more').addEventListener('click',")
rep("bm.classList.toggle('on', ['g-flow', 'g-checks', 'g-ref'].includes(g));", "bm.classList.toggle('on', ['g-flow', 'g-ref'].includes(g));")

# ---------- start guide, map, glossary, help ----------
h = _re.sub(r'\s*<button class="goal adv" type="button" data-goto="sec-period">.*?</button>', '', h)
h = h.replace('<button class="goal" type="button" data-goto="sum-2">', '<button class="goal" type="button" data-goto="sec-spread">')
h = h.replace('<button class="goal" type="button" data-goto="sum-5">', '<button class="goal" type="button" data-goto="guard-fold">')
a = h.index('    <div class="map">', h.index('id="sec-map"')); b = h.index('    <p class="small muted">기본 보기에서는', a); b = h.index('</p>', b) + 5
L_ = lambda t, x: f'<li><button type="button" class="map-link" data-goto="{t}">{x}</button></li>'
card = lambda n, t, d, items: f'        <div class="map-card"><h3><i class="n">{n}</i>{t}</h3><p>{d}</p><ul>{"".join(items)}</ul></div>\n'
h = h[:a] + '    <div class="map">\n      <div class="map-col"><span class="map-cat">네 단계</span>\n' + \
    card('1', '내 포트폴리오', '무엇을, 얼마씩, 언제부터', [L_('sec-style', '투자 방식'), L_('sec-ports', '포트폴리오 3개와 예시'), L_('sec-set', '기간 · 처음 넣는 돈 · 통화 · 리밸런싱')]) + \
    card('2', '백테스트 결과', '얼마나 불고, 떨어지고, 회복했나', [L_('sum-1', '성과 한눈에: CAGR · MDD'), L_('h-charts', '자산 성장 · 낙폭 차트'), L_('sec-recov', '하락과 회복: 언제, 어떻게'), L_('guard-fold', '방어 규칙 직접 설정'), L_('sec-annual', '연도별 수익률')]) + \
    card('3', '검증', '앞으로도 믿을 수 있나', [L_('sec-verdict', '판정 카드'), L_('sec-spread', '정합성: 2·5·10·20·30년 편차'), L_('sec-corr', '상관성: 종목끼리 같이 움직이나'), L_('evid', '근거 자료')]) + \
    card('4', 'AI 추천', '추가 검토용 대안', [L_('sum-4', '추천 비중'), L_('sec-ai-check', '추천 비중의 결과와 검증'), L_('sec-opt', 'AI 계산 설정')]) + \
    '      </div>\n      <div class="map-col"><span class="map-cat">더보기</span>\n' + \
    card('+', '적립·인출', '꾸준히 넣고 꺼내 쓴다면', [L_('sec-fl-set', '넣는 돈 · 빼는 돈 · 세금 · 환율'), L_('sec-acc', '적립하면 얼마나 모일까'), L_('sec-rt', '은퇴 인출 점검')]) + \
    '      </div>\n    </div>\n' + h[b:]
h = _re.sub(r'<div><dt>정합성 · 신빙성</dt><dd>.*?</dd></div>', '<div><dt>정합성 · 신빙성 · 상관성</dt><dd>정합성은 2·5·10년을 들고 있었을 때 시작한 달에 따라 결과가 얼마나 벌어졌는지, 신빙성은 그 결과가 운이 아닌지(유의성 · 비중 민감도), 상관성은 종목끼리 같이 움직이는 정도예요. 3 검증 탭에서 봐요.</dd></div>', h, count=1, flags=_re.S)
a = h.index('<summary>미래 신뢰도 지표 — 과거 결과를 얼마나 믿을 수 있나</summary>') + len('<summary>미래 신뢰도 지표 — 과거 결과를 얼마나 믿을 수 있나</summary>')
a = h.index('<ul>', a) + 4
h = h[:a] + '\n          <li><b>v9.0부터</b>: 정합성(예측 가능성) 점수는 2·5·10년 구간으로 매기고(2년 수익 산포 6%p 이하 100점 ~ 43%p 이상 0점, 나쁜 경우 −12%p 0점 ~ +2%p 100점), 신빙성은 유의성(PSR/DSR)과 비중 민감도 2가지만 판정에 써요. 기록 길이(MinTRL)와 부트스트랩은 같은 샤프 검정을 다시 표현한 것이라 판정에서 뺐어요(근거 표에는 남아 있어요).</li>' + h[a:]

# ---------- script ----------
rep("  /* ---------- boot ---------- */", (R / 'src/app_v90.js').read_text() + "\n  /* ---------- boot ---------- */")
assert h.count("renderSum(); drawTrail(); drawTrustRes(); renderGuard();") == 2
h = h.replace("renderSum(); drawTrail(); drawTrustRes(); renderGuard();", "renderSum(); drawTrail(); drawTrustRes(); renderGuard(); renderSpread(); renderCorr();")
h = h.replace("drawGuard(); drawRecov(); drawAICheck(); }", "drawGuard(); drawRecov(); drawAICheck(); drawSpread(); drawCorr(); }").replace("drawGuard(); drawRecov(); drawAICheck(); });", "drawGuard(); drawRecov(); drawAICheck(); drawSpread(); drawCorr(); });")

css90 = """
/* v9.0 */
#tb-mode, .sheet-mode, #bn-more { display: none !important; }
#sec-trust-res > .sc-sub, #c-trust-score, #trust-luck { display: none; }
.sp-ctl { margin: 4px 0 6px; }
.sptbl th, .sptbl td { white-space: nowrap; font-size: 12.5px; }
.sptbl tbody th { text-align: left; font-family: var(--font-sans); }
.sptbl .key, .cr-pt .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
#cr-p { margin: 6px 0 4px; }
.cr-port { display: grid; gap: 4px; margin: 6px 0 10px; }
.cr-pt { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13.5px; }
.cr-v { font-size: 12.5px; font-weight: 600; border-radius: 999px; padding: 2px 9px; }
.cr-v.good { background: color-mix(in srgb, var(--pos) 14%, transparent); color: var(--pos); }
.cr-v.mid { background: color-mix(in srgb, var(--warn) 16%, transparent); color: var(--warn); }
.cr-v.bad { background: color-mix(in srgb, var(--neg) 13%, transparent); color: var(--neg); }
.cgrid { border-collapse: separate; border-spacing: 2px; width: auto; margin: 0 auto 4px 0; }
.cgrid th { font-size: 11.5px; font-family: var(--font-mono); font-weight: 700; padding: 3px 4px; border-bottom: 0; color: var(--ink); text-align: center; }
.cgrid tbody th { text-align: right; }
.cgrid th.ref { color: var(--muted); font-weight: 500; }
.cgrid td { width: 46px; min-width: 40px; height: 32px; text-align: center; font-family: var(--font-mono); font-size: 11.5px; border-radius: 5px; border-bottom: 0; padding: 0;
  background: color-mix(in srgb, var(--neg) calc(var(--p, 0) * 70%), color-mix(in srgb, var(--focus) calc(var(--n, 0) * 70%), var(--panel-2))); color: var(--ink); }
.cgrid td.diag { background: var(--line); }
#cr-ref { margin: 4px 0; }
.wf { border: 1px solid var(--line-2); border-radius: 12px; padding: 10px 12px; margin-bottom: 10px; display: grid; gap: 6px; min-width: 0; }
.wf h4 { margin: 0; font-size: 13px; }
.wf-say { margin: 0; font-size: 13.5px; line-height: 1.55; font-weight: 600; }
.wf-w { margin: 0; }
.vc-x { display: grid; gap: 8px; border-top: 1px dashed var(--line-2); padding-top: 8px; }
.opt-set .adv-sep { margin-top: 6px; }
@media (max-width: 640px) {
  .cgrid td { width: 38px; min-width: 34px; height: 30px; font-size: 10.5px; }
  .cgrid th { font-size: 10.5px; padding: 2px; }
}
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css90)
