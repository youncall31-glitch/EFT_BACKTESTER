import json, re, pathlib
R = pathlib.Path(__file__).resolve().parent
OUT = R / 'out'; OUT.mkdir(exist_ok=True)
src = (R / 'base.html').read_text()
h = src
def rep(old, new, count=1):
    global h
    n = h.count(old)
    assert n == count, (n, old[:120])
    h = h.replace(old, new)

# ---------------- name ----------------
rep('<title>ETF 포트폴리오 백테스터</title>', '<title>ETF 포트폴리오 백테스터 v7</title>')
rep('<h1>ETF 포트폴리오 백테스터</h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7</span></h1>')
rep('<a class="tb-brand" href="#top">ETF 백테스터</a>', '<a class="tb-brand" href="#top">ETF 백테스터 v7</a>')
rep('예시 포트폴리오 세 개를 채워 두었어요. 과거 데이터로 본 결과라 앞으로의 수익을 보장하지 않아요.</p>',
    '예시 포트폴리오 세 개를 채워 두었어요. 원화 기준으로도 보고, ‘적립·인출’ 탭에서 매달 넣고 빼는 돈과 세금까지 넣어 볼 수 있어요. 과거 데이터로 본 결과라 앞으로의 수익을 보장하지 않아요.</p>')

# ---------------- changelog ----------------
rep('<summary><span class="upd-v">v8</span><span class="upd-d">2026.10.16</span><span class="upd-t">휴대폰에서 한눈에 보이게 화면을 새로 정리했어요</span><span class="more"></span></summary>',
    '<summary><span class="upd-v">v7</span><span class="upd-d">2026.10.26</span><span class="upd-t">적립·인출, 세금, 원화 환율을 넣었어요</span><span class="more"></span></summary>')
rep('''        <dl>
          <dt>v8 · 2026.10.16</dt>''', '''        <dl>
          <dt>v7 (새 앱) · 2026.10.26</dt>
          <dd><ul>
            <li>이전 앱의 마지막 버전(아래 기록의 v8)을 그대로 옮기고 기능을 더한 새 앱이에요. 같은 설정이면 결과 숫자는 이전 앱과 같아요</li>
            <li>원화 기준: 입력 › 기간과 금액에서 ‘원화’를 고르면 매달 원/달러 환율을 반영해 모든 결과(차트·최적화 포함)를 다시 계산하고, 물가 반영은 한국 소비자물가로 바뀌어요. 금액은 만·억 단위로 보여줘요</li>
            <li>새 ‘적립·인출’ 탭: 매달 적립(해마다 증액, 기간), 인출(정액·물가 연동 / 평가액 비율, 시작 시점), 세금(미국 상장 ETF 직접, 국내 상장 해외 ETF, 연금저축·IRP), 내 돈 수익률(IRR), 바닥난 시점, 연도별 표와 CSV 저장</li>
            <li>은퇴 인출 점검: 과거 모든 시작 달로 같은 인출 계획을 돌려 버틴 비율, 가장 나빴던 시작, 모든 시작에서 버틴 인출률</li>
            <li>결과·적립·인출 탭 위에 ‘지금 설정’ 칩: 기간·금액·리밸런싱·통화·물가·배당을 한눈에 보고, 누르면 그 설정으로 이동</li>
            <li>금액 칸 옆에 ‘= 1,000만 원’처럼 읽기 쉬운 금액 표시</li>
            <li>계정 저장소는 앱마다 따로라, 이전 앱에 저장한 포트폴리오는 이전 앱의 ‘내보내기’ 코드로 옮겨 오세요</li>
          </ul></dd>
          <dt>v8 · 2026.10.16</dt>''')

# ---------------- icon + nav (6 tabs) ----------------
rep('  <symbol id="i-checks"', '  <symbol id="i-flow" viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="7" ry="2.7"/><path d="M5 6.5v5c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-5"/><path d="M5 11.5v5c0 1.5 3.1 2.7 7 2.7s7-1.2 7-2.7v-5"/></symbol>\n  <symbol id="i-checks"')
for nav in ['tb-nav', 'bnav']:
    pass
rep('''<a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span>결과</span></a>''',
    '''<a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span>결과</span></a>
      <a href="#g-flow" data-g="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span>적립·인출</span></a>''', 2)

# ---------------- input tab: currency + amount hint ----------------
rep('''        <label for="init">처음 넣는 돈 ($)</label>
        <input id="init" type="number" min="1" step="1000" value="10000" inputmode="numeric">
        <p class="help">결과 금액만 달라지고 수익률은 같아요.</p>
      </div>''', '''        <label for="init" id="init-lbl">처음 넣는 돈 ($)</label>
        <input id="init" type="number" min="1" step="1000" value="10000" inputmode="numeric">
        <p class="amt-hint" id="init-h"></p>
        <p class="help">결과 금액만 달라지고 수익률은 같아요.</p>
      </div>
      <div class="field" id="cur-field">
        <span class="lbl" id="cur-lbl">통화 (환율)</span>
        <div class="seg-toggle big" id="cur" role="group" aria-labelledby="cur-lbl"><button type="button" data-v="USD" aria-pressed="true">달러 ($)</button><button type="button" data-v="KRW" aria-pressed="false">원화 (₩)</button></div>
        <p class="help" id="cur-note"></p>
      </div>''')
rep('<label class="toggle" for="real"><input id="real" type="checkbox"><span>미국 소비자물가(CPI-U)를 빼고',
    '<label class="toggle" for="real"><input id="real" type="checkbox"><span id="real-txt">미국 소비자물가(CPI-U)를 빼고')

# ---------------- results tab: settings strip; nav buttons ----------------
rep('  <div class="adj-banner" id="dm-banner" hidden>', '  <div class="ctx" id="ctx-res" role="group" aria-label="지금 설정"></div>\n  <div class="adj-banner" id="dm-banner" hidden>')
rep('<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-setup">← 입력</button><button class="btn" type="button" data-go="g-checks">점검 보기 →</button></nav>\n  </div>\n',
    '<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-setup">← 입력</button><button class="btn" type="button" data-go="g-flow">적립·인출 →</button></nav>\n  </div>\n\n' + (R / 'src/flow_pane.html').read_text())
rep('<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-results">← 결과</button><button class="btn" type="button" data-go="g-opt">최적화 보기 →</button></nav>',
    '<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-flow">← 적립·인출</button><button class="btn" type="button" data-go="g-opt">최적화 보기 →</button></nav>')

# ---------------- help: glossary + method ----------------
rep('      <div><dt>추세 보정</dt>', '''      <div><dt>원화 기준</dt><dd>달러로 낸 수익에 그 사이 원/달러 환율 변화를 더한, 원화로 투자한 사람의 수익률이에요.</dd></div>
      <div><dt>내 돈 수익률 (IRR)</dt><dd>언제 얼마를 넣고 뺐는지까지 따진 연 수익률이에요. 많이 넣은 뒤에 떨어지면 낮아져요.</dd></div>
      <div><dt>안전 인출률</dt><dd>과거 모든 시작 달에서 돈이 바닥나지 않은, 첫해 인출 금액의 최대 비율이에요(물가만큼 매년 늘림).</dd></div>
      <div><dt>추세 보정</dt>''')
faq_new = '''      <details class="faq-i" data-fold="m-10">
        <summary>원화 기준 (환율)</summary>
        <ul>
          <li>‘원화’를 고르면 각 ETF의 달러 월간 수익률 r에 그달 원/달러 환율 변화 f를 곱해 (1 + r) × (1 + f) − 1을 원화 수익률로 씁니다. 원화를 달러로 바꿔 사고, 팔 때 다시 원화로 바꾼 것과 같고 환헤지는 하지 않은 경우예요. 분배금도 받은 달 환율로 원화로 셉니다.</li>
          <li>환율은 월평균 값이에요. 1981.04 이후는 미국 연준 H.10 원/달러(<a href="https://fred.stlouisfed.org/series/EXKOUS" target="_blank" rel="noopener">FRED EXKOUS</a>), 그 이전은 OECD 월평균 환율(<a href="https://fred.stlouisfed.org/series/CCUSMA02KRM618N" target="_blank" rel="noopener">FRED CCUSMA02KRM618N</a>)이고, 1975~1979년은 484원 고정이었어요. 월말 잔고 기준 계산에 월평균 환율을 써서 환율이 급변한 달(예: 1997.12, 2008.10)은 실제 월말 환율과 조금 다를 수 있어요.</li>
          <li>원화 기준 + 물가 반영은 한국 소비자물가로 나눕니다. 2023.11까지는 OECD 소비자물가지수(<a href="https://fred.stlouisfed.org/series/KORCPIALLMINMEI" target="_blank" rel="noopener">FRED KORCPIALLMINMEI</a>), 그 뒤는 국가데이터처 소비자물가지수(2020=100)로 이었어요.</li>
          <li>샤프·소르티노·마틴 비율의 무위험 수익은 원화로 바꾼 미국 단기국채 수익이에요(달러 현금을 들고 있는 것과 비교).</li>
          <li>원화 기준은 달러 기준과 1997년·2008년처럼 위기에 원화가 약해질 때 낙폭이 크게 달라져요. 같은 포트폴리오도 두 기준을 함께 보세요.</li>
        </ul>
      </details>
      <details class="faq-i" data-fold="m-11">
        <summary>적립·인출과 세금</summary>
        <ul>
          <li>입력 탭의 포트폴리오·기간·리밸런싱·통화·물가·배당 처리를 그대로 쓰고, 매달 초에 넣을 돈을 목표 비중대로 사고, 뺄 돈은 들고 있는 비율대로 팝니다. 리밸런싱 규칙은 백테스트와 같아요. 넣고 빼는 돈이 없고 세금을 빼면 결과가 ‘결과’ 탭과 같습니다.</li>
          <li>물가 반영을 켜면 입력한 금액은 시작 시점 돈의 가치로 보고 매달 물가만큼 늘려 넣고 빼며, 보이는 금액도 모두 시작 시점 돈의 가치예요. 세금은 명목 금액으로 계산합니다.</li>
          <li><b>내 돈 수익률(IRR)</b>은 처음 넣은 돈, 매달 넣고 뺀 돈, 현금으로 받은 배당, 마지막에 모두 팔고 세금 낸 뒤 남는 돈으로 구한 연 수익률이에요. <b>시간가중 수익률</b>은 넣고 뺀 금액의 영향을 뺀 포트폴리오 자체의 수익률(세금은 포함)입니다.</li>
          <li><b>미국 상장 ETF 직접(일반 계좌)</b>: 분배금은 받을 때 15.4%(미국 원천징수 15% + 국내 추가분), 매매 차익은 해마다 1~12월에 판 것의 손익을 합쳐 250만 원을 넘는 부분에 22%를 이듬해 5월 말에 냅니다. 취득가는 원화로 기억해 환율 변화로 생긴 차익도 과세해요(이동평균 단가).</li>
          <li><b>국내 상장 해외 ETF(일반 계좌)</b>: 분배금과 매도 차익에 팔 때마다 15.4%, 손실과 차익을 서로 빼 주지 않습니다(환노출형 가정, 과표기준가와 실제 차익의 차이는 무시).</li>
          <li><b>연금저축·IRP</b>: 굴리는 동안 세금이 없고, 뺄 때 연금소득세(기본 5.5%)를 냅니다. 납입 세액공제, 연 1,500만 원 넘는 수령의 과세 방식, 중도 인출 세율(16.5%)은 반영하지 않아요. 마지막 금액도 연금으로 받는다고 보고 같은 세율을 뗍니다.</li>
          <li>세율과 공제는 2026년 기준값이고 바꿀 수 있어요. 과거 시점에도 같은 세법을 적용해 비교하기 쉽게 했습니다. 금융소득 종합과세(연 2,000만 원 초과), 건강보험료, 거래 비용은 반영하지 않아요.</li>
          <li><b>은퇴 인출 점검</b>은 처음 넣는 돈에서 첫해 인출률만큼을 12개월에 나눠 빼고 해마다 물가만큼 늘리는 계획을, 고른 자산의 데이터가 있는 모든 시작 달로 돌립니다. 남은 돈은 시작 시점 돈의 가치이고, ‘모든 시작에서 버틴 인출률’은 0.1%p 단위로 찾은 값이에요.</li>
        </ul>
      </details>
'''
rep('      <details class="faq-i" data-fold="m-8">', faq_new + '      <details class="faq-i" data-fold="m-8">')
rep('<summary>계산하지 않는 것 (은퇴 계획에 쓸 때)</summary>', '<summary>계산하지 않는 것 (은퇴 계획에 쓸 때)</summary>\n        <p class="small muted faq-note">아래 세금·환율·적립과 인출은 이 앱(v7)의 ‘원화’ 선택과 ‘적립·인출’ 탭에서 계산할 수 있어요. 결과·점검·최적화 탭의 숫자에는 여전히 세금과 적립·인출이 빠져 있어요.</p>')

# ---------------- data: KRW FX and Korean CPI ----------------
kr = (R / 'data/kr.json').read_text()
rep('<script>\n/* Backtest engine', '<script type="application/json" id="kr-data">' + kr + '</script>\n<script>\n/* Backtest engine')

# ---------------- engine ----------------
rep("  const SETS = { n: { RET: {}, INC: {}, RF: null, RFCUM: null }, r: { RET: {}, INC: {}, RF: null, RFCUM: null } };",
    """  const SETS = { n: { RET: {}, INC: {}, RF: null, RFCUM: null }, r: { RET: {}, INC: {}, RF: null, RFCUM: null },
    kn: { RET: {}, INC: {}, RF: null, RFCUM: null }, kr: { RET: {}, INC: {}, RF: null, RFCUM: null } };   // v7: k = in won
  // v7 (new app): won view. KFX = monthly change of KRW per USD, KCPI = Korean inflation, KLV = KRW per USD level (KLV[m+1] = end of month m)
  let CUR = 'USD', KFX = null, KCPI = null, KLV = null;
  const ukey = () => (CUR === 'KRW' && KFX ? 'k' + (REAL && KCPI ? 'r' : 'n') : (REAL && CPI ? 'r' : 'n'));
  const toKrw = arr => { const o = new Float64Array(arr.length); for (let i = 0; i < arr.length; i++) o[i] = (1 + arr[i]) * (1 + KFX[i]) - 1; return o; };
  const kdeflate = arr => { const o = new Float64Array(arr.length); for (let i = 0; i < arr.length; i++) o[i] = (1 + arr[i]) / (1 + KCPI[i]) - 1; return o; };""")
rep("  function activate() { const s = REAL && CPI ? SETS.r : SETS.n; RET = s.RET; INC = s.INC; RF = s.RF; RFCUM = s.RFCUM; }",
    "  function activate() { const s = SETS[ukey()]; RET = s.RET; INC = s.INC; RF = s.RF; RFCUM = s.RFCUM; }")
rep("""    SETS.n.RET = {}; SETS.r.RET = {}; SETS.n.INC = {}; SETS.r.INC = {};
    for (const t of Object.keys(data.assets)) addSeries(t, data.assets[t]);""",
    """    SETS.n.RET = {}; SETS.r.RET = {}; SETS.n.INC = {}; SETS.r.INC = {};
    SETS.kn.RET = {}; SETS.kr.RET = {}; SETS.kn.INC = {}; SETS.kr.INC = {};
    KFX = null; KCPI = null; KLV = null;
    if (data.kfx) {
      KFX = new Float64Array(NM).fill(0); for (let i = 0; i < data.kfx.r.length && data.kfx.s + i < NM; i++) KFX[data.kfx.s + i] = data.kfx.r[i] / 1e6;
      KLV = new Float64Array(NM + 1); KLV[0] = data.kfx.lv0; for (let i = 0; i < NM; i++) KLV[i + 1] = KLV[i] * (1 + KFX[i]);
      if (data.kcpi) { KCPI = new Float64Array(NM).fill(0); for (let i = 0; i < data.kcpi.r.length && data.kcpi.s + i < NM; i++) KCPI[data.kcpi.s + i] = data.kcpi.r[i] / 1e6; }
    }
    for (const t of Object.keys(data.assets)) addSeries(t, data.assets[t]);""")
rep("""    if (CPI) { SETS.r.RF = deflate(rf); SETS.r.RFCUM = cumOf(SETS.r.RF); }
    activate();""", """    if (CPI) { SETS.r.RF = deflate(rf); SETS.r.RFCUM = cumOf(SETS.r.RF); }
    if (KFX) { SETS.kn.RF = toKrw(rf); SETS.kn.RFCUM = cumOf(SETS.kn.RF); if (KCPI) { SETS.kr.RF = kdeflate(SETS.kn.RF); SETS.kr.RFCUM = cumOf(SETS.kr.RF); } }
    activate();""")
rep("""    SETS.n.RET[t] = arr;
    if (CPI) SETS.r.RET[t] = deflate(arr);""", """    SETS.n.RET[t] = arr;
    if (CPI) SETS.r.RET[t] = deflate(arr);
    if (KFX) { const k = toKrw(arr); SETS.kn.RET[t] = k; if (KCPI) SETS.kr.RET[t] = kdeflate(k); }""")
rep("""    delete SETS.n.INC[t]; delete SETS.r.INC[t];""", """    delete SETS.n.INC[t]; delete SETS.r.INC[t]; delete SETS.kn.INC[t]; delete SETS.kr.INC[t];""")
rep("""      if (CPI) { const ir = new Float64Array(NM); for (let i = 0; i < NM; i++) ir[i] = inc[i] / (1 + CPI[i]); SETS.r.INC[t] = ir; }""",
    """      if (CPI) { const ir = new Float64Array(NM); for (let i = 0; i < NM; i++) ir[i] = inc[i] / (1 + CPI[i]); SETS.r.INC[t] = ir; }
      if (KFX) {   // in won a distribution is worth d x (1 + f): price return (1 + r - d)(1 + f) - 1 = total - income
        const ik = new Float64Array(NM); for (let i = 0; i < NM; i++) ik[i] = inc[i] * (1 + KFX[i]); SETS.kn.INC[t] = ik;
        if (KCPI) { const ikr = new Float64Array(NM); for (let i = 0; i < NM; i++) ikr[i] = ik[i] / (1 + KCPI[i]); SETS.kr.INC[t] = ikr; }
      }""")
rep("  let ADJ = { n: {}, r: {} };\n  const adjSet = () => (REAL && CPI ? ADJ.r : ADJ.n);",
    "  let ADJ = { n: {}, r: {}, kn: {}, kr: {} };\n  const adjSet = () => ADJ[ukey()];")
rep("    ADJ = { n: {}, r: {} };\n    const by = {}; for (const sp of specs) by[sp.t] = sp;\n    for (const u of ['n', 'r']) {",
    "    ADJ = { n: {}, r: {}, kn: {}, kr: {} };\n    const by = {}; for (const sp of specs) by[sp.t] = sp;\n    for (const u of ['n', 'r', 'kn', 'kr']) {")
rep("  function setReal(on) { REAL = !!on && !!CPI; activate(); return REAL; }",
    "  function setReal(on) { REAL = !!on && !!(CUR === 'KRW' ? KCPI : CPI); activate(); return REAL; }")
rep("P.adjMap = opts.adj || null; P.real = !!opts._real;", "P.adjMap = opts.adj || null; P.real = !!opts._real; P.cur = opts._cur || 'USD';")
rep("opts = Object.assign({}, opts, { _ret: RET, _rf: RF, _real: REAL && !!CPI });",
    "opts = Object.assign({}, opts, { _ret: RET, _rf: RF, _real: REAL && !!(CUR === 'KRW' ? KCPI : CPI), _cur: CUR });")
rep("  function addAsset(t, a) {\n    D.assets[t] = a;", (R / 'src/engine_flow.js').read_text() + "  function addAsset(t, a) {\n    D.assets[t] = a;")
rep("optPlan: planHorizon, optPlanWin: planWindow, countCompositions, has, get NM() { return NM; }, get D() { return D; }, rfCum: () => RFCUM };",
    "optPlan: planHorizon, optPlanWin: planWindow, countCompositions, has, get NM() { return NM; }, get D() { return D; }, rfCum: () => RFCUM,\n    setCur, getCur: () => CUR, hasFX: () => !!KFX, fxLevel: m => (KLV ? KLV[m + 1] : null), flowSim, flowStarts, safeRate };")

# ---------------- app ----------------
rep("  const DATA = JSON.parse(document.getElementById('etf-data').textContent);",
    "  const DATA = JSON.parse(document.getElementById('etf-data').textContent);\n  try { const K = JSON.parse(document.getElementById('kr-data').textContent); DATA.kfx = K.kfx; DATA.kcpi = K.kcpi; } catch (_) {}")
rep("    ddKey: null       // v7.1: portfolio shown in the drawdown list\n  };",
    "    ddKey: null,      // v7.1: portfolio shown in the drawdown list\n    cur: 'USD', initU: 10000, initK: 10000000   // v7 (new app): currency and the starting amount kept per currency\n  };")
rep("  const money = x => '$' + Math.round(x).toLocaleString('en-US');",
    """  /* v7 (new app): won amounts in 만/억 units */
  function krwTxt(x) {
    const neg = x < 0; let v = Math.abs(x); let s;
    if (v >= 1e8) { let eok = Math.floor(v / 1e8), man = Math.round((v - eok * 1e8) / 1e4); if (man >= 10000) { eok++; man = 0; } s = eok.toLocaleString('ko-KR') + '억' + (man ? ' ' + man.toLocaleString('ko-KR') + '만' : '') + ' 원'; }
    else if (v >= 1e4) s = Math.round(v / 1e4).toLocaleString('ko-KR') + '만 원';
    else s = Math.round(v).toLocaleString('ko-KR') + '원';
    return (neg && Math.round(v) ? '−' : '') + s;
  }
  const money = x => (state.cur === 'KRW' ? krwTxt(x) : '$' + Math.round(x).toLocaleString('en-US'));""")
rep("  const fmtMoneyShort = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'K' : '$' + Math.round(v);",
    """  const fmtMoneyShort = v => state.cur === 'KRW'
    ? (v >= 1e12 ? (v / 1e12).toFixed(v >= 1e13 ? 0 : 1) + '조' : v >= 1e8 ? (v / 1e8).toFixed(v >= 1e9 ? 0 : 1).replace(/\\.0$/, '') + '억' : v >= 1e4 ? Math.round(v / 1e4).toLocaleString('ko-KR') + '만' : Math.round(v) + '원')
    : v >= 1e6 ? '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'K' : '$' + Math.round(v);""")
# unit-dependent keys and the optimizer's unit
rep("return [l.s, l.e, state.rebal, state.ext, state.real, [...state.optSel]", "return [l.s, l.e, state.rebal, state.ext, state.real + state.cur, [...state.optSel]")
rep("key: [T.on, end, mode, state.real, T.R,", "key: [T.on, end, mode, state.real + state.cur, T.R,")
rep("return [T.on, I.end, o.mode, state.real, T.R, T.L, hit.join(',')].join('|');", "return [T.on, I.end, o.mode, state.real + state.cur, T.R, T.L, hit.join(',')].join('|');")
rep("tickers, step, maxW, real: state.real, sec:", "tickers, step, maxW, real: state.real, cur: state.cur, sec:")
rep("""  function withUnit(real, fn) {
    const prev = BT.isReal(); if (prev !== real) BT.setReal(real);
    try { return fn(); } finally { if (prev !== real) BT.setReal(prev); }
  }""", """  function withUnit(real, fn, cur) {
    const prevC = BT.getCur(), prev = BT.isReal(); cur = cur || prevC;
    if (prevC !== cur) BT.setCur(cur);
    if (BT.isReal() !== real) BT.setReal(real);
    try { return fn(); } finally { if (BT.getCur() !== prevC) BT.setCur(prevC); if (BT.isReal() !== prev) BT.setReal(prev); }
  }""")
rep("return withUnit(!!H.real, () => [BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false)), BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false, true))]);",
    "return withUnit(!!H.real, () => [BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false)), BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false, true))], H.cur);")
rep("const st = withUnit(!!H.real, () => BT.stats(BT.backtest(vp.info.tickers, vp.info.weights, H.i0, H.i1, o.rule, H.adjMap || false)));",
    "const st = withUnit(!!H.real, () => BT.stats(BT.backtest(vp.info.tickers, vp.info.weights, H.i0, H.i1, o.rule, H.adjMap || false)), H.cur);")
# saved snapshots remember the currency
rep("real: !!sn.real, adj: !!sn.adj,", "real: !!sn.real, cur: sn.cur === 'KRW' ? 'KRW' : 'USD', adj: !!sn.adj,")
rep("meta.push((it.snap.real ? '물가 반영' : '명목')", "meta.push((it.snap.cur === 'KRW' ? '원화 · ' : '') + (it.snap.real ? '물가 반영' : '명목')")
rep("real: state.opt ? state.opt.real : state.real, rule:", "real: state.opt ? state.opt.real : state.real, cur: state.opt ? (state.opt.cur || 'USD') : state.cur, rule:")
# render hooks
rep("renderRolling(); renderCoverage(); renderDataMode(); renderPeriod(); markOptStale(); markAdjStale();\n  }",
    "renderRolling(); renderCoverage(); renderDataMode(); renderPeriod(); markOptStale(); markAdjStale();\n    renderCtx(); renderFlow();\n  }")
rep("    $('#cov').innerHTML = ''; $('#sum-note').textContent = '';\n  }",
    "    $('#cov').innerHTML = ''; $('#sum-note').textContent = '';\n    renderCtx(); renderFlow();\n  }")
rep("rsTimer = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); }, 120); }).observe(document.querySelector('.charts'));",
    "rsTimer = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); drawFlow(); drawRetire(); drawAcc(); }, 120); }).observe(document.querySelector('.charts'));")
rep("foldRedrawT = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); }, 30); }",
    "foldRedrawT = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); drawFlow(); drawRetire(); drawAcc(); }, 30); }")
rep("const TAB_IDS = ['g-setup', 'g-results', 'g-checks', 'g-opt', 'g-ref'];", "const TAB_IDS = ['g-setup', 'g-results', 'g-flow', 'g-checks', 'g-opt', 'g-ref'];")
rep("const redrawVisible = () => requestAnimationFrame(() => { drawCharts(); drawFrontier(); drawHeat(); });",
    "const redrawVisible = () => requestAnimationFrame(() => { drawCharts(); drawFrontier(); drawHeat(); drawFlow(); drawRetire(); drawAcc(); });")
rep("    markNav();\n    maybeRunDeferredOpt();\n  }\n  function setLayout", "    markNav();\n    maybeRunDeferredOpt();\n    if (state.layout !== 'tabs' || g === 'g-flow') markRetireStale();\n  }\n  function setLayout")
rep("  /* ---------- boot ---------- */", (R / 'src/app_flow.js').read_text() + "\n  /* ---------- boot ---------- */")

# ---------------- CSS ----------------
css = '''
/* v7 (new app): settings strip, currency, cash-flow tab */
.h1-v { font-family: var(--font-mono); font-size: 0.55em; font-weight: 600; vertical-align: 0.35em; color: var(--muted); border: 1px solid var(--line-2); border-radius: 6px; padding: 1px 6px; margin-left: 4px; }
.amt-hint { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); min-height: 1em; margin-top: -2px; }
.amt-hint:empty { display: none; }
.ctx { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ctx:empty { display: none; }
.ctx-l { font-size: 12px; font-weight: 600; color: var(--muted); margin-right: 2px; }
.ctx-c { font: inherit; font-size: 12.5px; font-family: var(--font-sans); color: var(--ink-2); background: var(--panel); border: 1px solid var(--line-2); border-radius: 999px; padding: 3px 10px; cursor: pointer; min-height: 28px; }
.ctx-c:hover { color: var(--ink); border-color: var(--ink-2); }
.ctx-c.warn { border-color: color-mix(in srgb, var(--p2) 55%, var(--line-2)); }
@keyframes v7flash { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--focus) 0%, transparent); } 25% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus) 35%, transparent); } 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--focus) 0%, transparent); } }
.flash { animation: v7flash 1.4s ease-out; border-radius: 8px; }
.fl-pre { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 14px; }
.fl-pre .lbl { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.fl-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: start; }
.fl-box { border: 1px solid var(--line); border-radius: var(--r); padding: 12px 14px 14px; margin: 0; display: grid; gap: 12px; min-width: 0; background: var(--panel); }
.fl-box legend { font-weight: 700; font-size: 14px; padding: 0 6px; margin-left: -6px; color: var(--ink); }
.fl-two { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: 10px; }
.choice.slim { grid-template-columns: 1fr; gap: 6px; }
.choice.slim .opt { padding: 8px 10px; }
.choice.slim .opt b { font-size: 13.5px; }
.fl-rates { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; border-top: 1px dashed var(--line-2); padding-top: 10px; }
.fl-card .fl-lab { font-size: 12px; color: var(--muted); margin-bottom: -6px; }
.fl-card .hc-from.neg, .fl-card .hc-from.neg b { color: var(--neg); }
.fl-kv { grid-template-columns: repeat(3, minmax(0, 1fr)); row-gap: 12px; }
.fl-kv b { font-size: 16px; }
.fl-chart, .rt-chart { display: grid; gap: 6px; margin-top: 18px; min-width: 0; }
.rt-set { display: grid; grid-template-columns: 150px 150px minmax(0, 1fr); gap: 12px 16px; align-items: end; margin-bottom: 10px; }
.rt-help { align-self: center; }
.rttbl td .sub, .fltbl td .sub { display: block; }
.fltbl td, .fltbl th { padding-block: 6px; }
.faq-note { margin: 2px 0 6px; }
@media (max-width: 980px) { .fl-grid { grid-template-columns: 1fr 1fr; } .fl-grid .fl-box:last-child { grid-column: 1 / -1; } }
@media (max-width: 640px) {
  .fl-grid { grid-template-columns: 1fr; }
  .rt-set { grid-template-columns: 1fr 1fr; }
  .rt-help { grid-column: 1 / -1; }
  .fl-kv { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ctx-l { width: 100%; }
}
@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }
'''
rep("@media (prefers-reduced-motion: reduce) { * { transition: none !important; } html { scroll-behavior: auto; } }",
    "@media (prefers-reduced-motion: reduce) { * { transition: none !important; } html { scroll-behavior: auto; } }" + css)

exec((R / 'src/build_v71.py').read_text())
exec((R / 'src/build_v73.py').read_text())
exec((R / 'src/build_v74.py').read_text())
exec((R / 'src/build_v75.py').read_text())
exec((R / 'src/build_v76.py').read_text())
exec((R / 'src/build_v77.py').read_text())
exec((R / 'src/build_v78.py').read_text())
exec((R / 'src/build_v79.py').read_text())
exec((R / 'src/build_v80.py').read_text())
exec((R / 'src/build_v81.py').read_text())
exec((R / 'src/build_v90.py').read_text())
exec((R / 'src/build_v91.py').read_text())
exec((R / 'src/build_v92.py').read_text())
exec((R / 'src/build_v93.py').read_text())
exec((R / 'src/build_v94.py').read_text())
exec((R / 'src/build_v95.py').read_text())
exec((R / 'src/build_v96.py').read_text())
exec((R / 'src/build_v97.py').read_text())
exec((R / 'src/build_v98.py').read_text())
exec((R / 'src/build_v99.py').read_text())
exec((R / 'src/build_v100.py').read_text())
exec((R / 'src/build_v101.py').read_text())
exec((R / 'src/build_v102.py').read_text())
exec((R / 'src/build_v103.py').read_text())
(OUT / 'etf-backtester.html').write_text(h)
print('built', OUT / 'etf-backtester.html')
print('ok', len(src), '->', len(h))
