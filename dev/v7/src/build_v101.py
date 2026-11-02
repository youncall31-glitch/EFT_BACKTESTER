# ================= v10.1: one date for everything — rebalancing and the yearly deposit both at the start of a chosen month (default March) =================
import os as _os, re as _re
rep('<dt>v10.0 · 2026.10.30</dt>', """<dt>v10.1 · 2026.11.02</dt>
          <dd><ul><li>리밸런싱과 매년 적립을 같은 날에: ‘리밸런싱 · 적립 시점’을 고르면(기본 3월 초) 매년 리밸런싱과 매년 넣는 돈이 모두 그 달 초에 이뤄져요. 반기 · 분기 리밸런싱도 그 달을 기준으로 6 · 3개월마다. 이전처럼 계산하려면 1월 초를 고르면 돼요(1월 초 = 12월 말 리밸런싱).</li></ul></dd>
          <dt>v10.0 · 2026.10.30</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.0</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.1</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.0</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.1</span><span class="upd-d">2026.11.02</span><span class="upd-t">리밸런싱과 매년 적립을 같은 달 초(기본 3월)에 해요</span>', h, count=1)
DEF = 0 if _os.environ.get('V6DEF') else 2      # 0 = January (the previous behaviour), 2 = March
# ---- engine: the calendar rebalancing month follows the anchor (rebalance at the end of the month before it) ----
rep("""  function calRebal(m, rule) {
    const mo = m % 12; // 0 = Jan
    switch (rule) {
      case 'M': return true;
      case 'Q': return mo === 2 || mo === 5 || mo === 8 || mo === 11;
      case 'S': return mo === 5 || mo === 11;
      case 'A': return mo === 11;
      default: return false;
    }""", f"""  let ANCHOR = {DEF};   // v10.1: month (0 = Jan) whose start is the yearly rebalancing and deposit date
  function calRebal(m, rule) {{
    const mo = (m % 12 - ((ANCHOR + 11) % 12) + 12) % 12; // 0 = the month that ends just before the anchor month
    switch (rule) {{
      case 'M': return true;
      case 'Q': return mo % 3 === 0;
      case 'S': return mo % 6 === 0;
      case 'A': return mo === 0;
      default: return false;
    }}""")
rep("sharpeTest, bootstrap, trustScan, trustPick, pboCalc, guardSim };", "sharpeTest, bootstrap, trustScan, trustPick, pboCalc, guardSim, setAnchor: a => { ANCHOR = ((a % 12) + 12) % 12; }, getAnchor: () => ANCHOR };")
# yearly deposit at the start of the anchor month; yearly growth counted in those years
rep("if (cAmt > 0 && t < cMonths && (!cYear || m % 12 === 0)) {   // yearly: at the start of each January",
    "if (cAmt > 0 && t < cMonths && (!cYear || m % 12 === ANCHOR)) {   // yearly: at the start of the anchor month (rebalancing date)")
rep("Math.pow(1 + cGrow, cYear ? Math.floor(m / 12) - y0 : Math.floor(t / 12))", "Math.pow(1 + cGrow, cYear ? Math.floor((m - ANCHOR) / 12) - Math.floor((o.i0 - ANCHOR) / 12) : Math.floor(t / 12))")
assert h.count("if (!yearly || s % 12 === 0) starts.push(s);") >= 1
h = h.replace("if (!yearly || s % 12 === 0) starts.push(s);", "if (!yearly || s % 12 === BT.getAnchor()) starts.push(s);")
# ---- the choice, next to rebalancing ----
a = h.index('<p class="help">정해진 때마다 처음 비중으로 되돌려요. 잘 모르면 ‘매년’.</p>')
b = h.index('</div>', a) + len('</div>')
opts = ''.join(f'<option value="{i}">{i + 1}월 초</option>' for i in range(12))
h = h[:b] + f'''
      <div class="field">
        <label for="anchor">리밸런싱 · 매년 적립 시점</label>
        <select id="anchor">{opts}</select>
        <p class="help">매년 리밸런싱과 매년 넣는 돈이 모두 이 달 초에 이뤄져요. 반기 · 분기도 이 달부터 6 · 3개월마다예요.</p>
      </div>''' + h[b:]
rep('<p class="help">정해진 때마다 처음 비중으로 되돌려요. 잘 모르면 ‘매년’.</p>', '<p class="help">정해진 때마다 처음 비중으로 되돌려요. 잘 모르면 ‘매년’. 시점은 아래에서 정해요.</p>')
rep('<b>매년 초 적립</b><small>처음 넣는 돈 + 해마다 1월에 넣는 돈</small>', '<b>매년 초 적립</b><small id="sty-y-sub">처음 넣는 돈 + 해마다 3월 초에 넣는 돈</small>')
rep("FL.cf === 'Y' ? '해마다 1월 초에 넣어요. 시작 달이 1월이면 첫해에도 처음 넣는 돈과 함께 넣어요.'", "FL.cf === 'Y' ? `해마다 ${BT.getAnchor() + 1}월 초(리밸런싱과 같은 날)에 넣어요. 시작 달이 ${BT.getAnchor() + 1}월이면 첫해에도 처음 넣는 돈과 함께 넣어요.`")
h = h.replace("처음 넣는 돈에 더해 해마다 1월 초에 넣어요.", "처음 넣는 돈에 더해 해마다 ${BT.getAnchor() + 1}월 초(리밸런싱과 같은 날)에 넣어요.")
if "'처음 넣는 돈에 더해 해마다 ${BT.getAnchor() + 1}월 초" in h:
    i = h.index("'처음 넣는 돈에 더해 해마다 ${BT.getAnchor() + 1}월 초"); j = h.index("'", i + 1)
    h = h[:i] + '`' + h[i + 1:j] + '`' + h[j + 1:]
rep('정기 리밸런싱은 달력 기준입니다. 매년은 12월 말, 반기는 6·12월 말, 분기는 3·6·9·12월 말에 목표 비중으로 되돌립니다.',
    '정기 리밸런싱은 달력 기준입니다. ‘리밸런싱 · 매년 적립 시점’에서 고른 달 초(기본 3월 초 = 2월 말 종가)에 매년 목표 비중으로 되돌리고, 반기는 그 달부터 6개월마다, 분기는 3개월마다예요. 매년 적립도 같은 날 넣어요. 1월 초를 고르면 이전 버전(12월 말)과 같아요.')
h = h.replace('<b>매년 초 적립</b>은 해마다 1월 초에 넣어요. 분석 시작 달이 1월이면', '<b>매년 초 적립</b>은 해마다 리밸런싱과 같은 달 초(기본 3월)에 넣어요. 분석 시작 달이 그 달이면')
h = h.replace('처음 넣는 돈에 더해 해마다 1월에 넣으면 얼마나 모이는지', '처음 넣는 돈에 더해 해마다 정한 달 초에 넣으면 얼마나 모이는지')
# opt cache key follows the date
rep("return [l.s, l.e, state.rebal, state.ext, state.real + state.cur, [...state.optSel].sort().join(','), $('#o-step').value, $('#o-max').value].join('|');",
    "return [l.s, l.e, state.rebal, BT.getAnchor(), state.ext, state.real + state.cur, [...state.optSel].sort().join(','), $('#o-step').value, $('#o-max').value].join('|');")
js = r'''
  /* v10.1: one date for rebalancing and the yearly deposit */
  const ANCHOR_KEY = 'etf-backtester-v7.anchor.v1';
  function anchorTxt() {
    const a = BT.getAnchor(), M = k => ((a + k) % 12) + 1;
    REBAL_TXT.A = `매년(${M(0)}월 초)`; REBAL_TXT.S = `반기(${M(0)}·${M(6)}월 초)`; REBAL_TXT.Q = `분기(${[0, 3, 6, 9].map(M).join('·')}월 초)`;
    const r = $('#rebal'); if (r) for (const o of r.options) { if (o.value === 'A') o.textContent = `매년 (${M(0)}월 초)`; if (o.value === 'S') o.textContent = `반기 (${M(0)}·${M(6)}월 초)`; if (o.value === 'Q') o.textContent = `분기 (${[0, 3, 6, 9].map(M).join('·')}월 초)`; }
    const sub = $('#sty-y-sub'); if (sub) sub.textContent = `처음 넣는 돈 + 해마다 ${M(0)}월 초에 넣는 돈`;
    $('#anchor').value = String(a);
  }
  (function initAnchor() {
    let a = null; try { a = window.localStorage.getItem(ANCHOR_KEY); } catch (_) {}
    if (a != null && /^\d+$/.test(a)) BT.setAnchor(+a);
    anchorTxt();
    $('#anchor').addEventListener('change', e => {
      BT.setAnchor(+e.target.value); try { window.localStorage.setItem(ANCHOR_KEY, String(BT.getAnchor())); } catch (_) {}
      anchorTxt(); recompute(); syncStyleUI(); markOptStale(); aiAuto();
      toast(`리밸런싱과 매년 적립을 ${BT.getAnchor() + 1}월 초로 바꿔 다시 계산했어요.`);
    });
  })();
'''
rep("  /* ---------- boot ---------- */", js + "\n  /* ---------- boot ---------- */")
