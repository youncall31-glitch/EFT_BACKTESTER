# ================= v7.1: ETF descriptions + one mix kept for every horizon =================
rep('<dt>v7 (새 앱) · 2026.10.26</dt>', """<dt>v7.1 · 2026.10.26</dt>
          <dd><ul>
            <li>ETF 설명: 포트폴리오 티커 아래 ‘설명’, 도움말 › 지원 티커와 ETF 설명, 최적화 결과의 티커를 누르면 그 ETF가 무엇을 담는지, 운용사·지수·상장일·총보수·알아 둘 점과 이 앱 데이터로 본 CAGR·MDD를 보여줘요. 바로 포트폴리오에 넣을 수도 있어요</li>
            <li>최적화 › 장기 유지 추천: 한 가지 비중을 분석 기간 전체(30년이 넘어도)와 최근·가장 과거 10·20·30년 모든 구간에 그대로 들고 있었을 때 가장 고르게 좋았던 조합(AI 유지형·내 기준 유지형·생애 주기별). 구간마다 따로 고른 최적 비중과 성과·종목·비중을 나란히 비교</li>
          </ul></dd>
          <dt>v7 (새 앱) · 2026.10.26</dt>""")
rep('<span class="upd-v">v7</span><span class="upd-d">2026.10.26</span><span class="upd-t">적립·인출, 세금, 원화 환율을 넣었어요</span>',
    '<span class="upd-v">v7.1</span><span class="upd-d">2026.10.26</span><span class="upd-t">ETF 설명과 기간이 바뀌어도 유지되는 최적 비중을 더했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.1</span></h1>')
rep('<p class="help">ETF 티커(예: SPY)와 비중(%)을 넣어요. 비중 합계가 100%가 되면 바로 계산하고, 세 개까지 나란히 비교해요.</p>',
    '<p class="help">ETF 티커(예: SPY)와 비중(%)을 넣어요. 비중 합계가 100%가 되면 바로 계산하고, 세 개까지 나란히 비교해요. 티커 아래 ‘설명’을 누르면 그 ETF가 무엇인지 볼 수 있어요.</p>')
rep('<span class="fold-t" id="h-list">지원 티커</span></span><span class="fold-d">계산할 수 있는 ETF 목록, 없는 티커는 CSV로 추가</span>',
    '<span class="fold-t" id="h-list">지원 티커와 ETF 설명</span></span><span class="fold-d">계산할 수 있는 ETF 50개 — 누르면 설명, 없는 티커는 CSV로 추가</span>')
rep('      <div class="tick-groups" id="tick-groups"></div>', '''      <p class="help">티커를 누르면 무엇을 담는 ETF인지, 보수와 이 앱 데이터로 본 성과를 보여줘요.</p>
      <div class="tick-groups" id="tick-groups"></div>''')
rep("""        const c = el('code', null, t); c.title = `${a.n} · ${a.c} · 데이터 ${BT.label(BT.avail(t, 'ext')[0])}~`;
        d.appendChild(c);""", """        const c = el('button', 'etf-chip'); c.type = 'button'; c.dataset.etf = t; c.title = `${a.n} · ${a.c} · 데이터 ${BT.label(BT.avail(t, 'ext')[0])}~`;
        c.append(el('code', null, t), el('span', null, a.c || ''));
        d.appendChild(c);""")
rep("""        sub.title = a.n;
      });""", """        sub.title = a.n;
        const ib = el('button', 'tk-info', '설명'); ib.type = 'button'; ib.dataset.etf = t; ib.setAttribute('aria-label', `${t} 설명 보기`); sub.append(' ', ib);
      });""")
rep("""      const tk = el('span', 'tk', t); if (DATA.assets[t]) tk.title = DATA.assets[t].n;""",
    """      let tk; if (DATA.assets[t]) { tk = el('button', 'tk', t); tk.type = 'button'; tk.dataset.etf = t; tk.title = `${DATA.assets[t].n} — 눌러서 설명 보기`; } else tk = el('span', 'tk', t);""")
rep("const c = el('button', 'tchip', t); c.type = 'button'; c.dataset.t = t; c.title = `${a.n} · ${a.c}`;",
    "const c = el('button', 'tchip', t); c.type = 'button'; c.dataset.t = t; c.title = `${a.n} · ${a.c}` + (ETF_INFO[t] ? ` — ${ETF_INFO[t][2]}` : '');")

keep_html = """  <section class="panel" aria-labelledby="h-keep" id="sec-keep">
    <div class="panel-head"><h2 id="h-keep">장기 유지 추천 — 기간이 바뀌어도 같은 종목·비중</h2><p class="help">위 ‘기간별 최적 비중’은 구간마다 따로 고른 비중이라 10·20·30년마다 종목과 비중이 달라요. 여기서는 비중 하나를 정해 분석 기간 전체(30년이 넘어도)와 최근·가장 과거 10·20·30년 모든 구간에 바꾸지 않고 들고 있었을 때, 가장 나빴던 구간에서도 가장 좋았던 조합을 골라요.</p></div>
    <p class="small muted" id="o-keep-status" aria-live="polite"></p>
    <div class="picks" id="o-keep"></div>
    <div id="keep-more" hidden>
      <div class="sub-sec">
        <div class="sub-head"><h3>같은 비중을 그대로 들고 있었다면</h3><div class="seg-toggle" id="o-keep-c" role="group" aria-label="비교할 기준"><button type="button" data-c="ai" aria-pressed="true">AI 유지형</button><button type="button" data-c="user" aria-pressed="false">내 기준 유지형</button></div></div>
        <p class="help">구간마다 그 구간만 보고 고른 최적 비중과 비교해요. CAGR 차이가 작을수록 비중을 바꾸지 않고 오래 들고 가도 손해가 적었다는 뜻이에요. ‘같은 비중’은 두 조합에 공통으로 들어간 비중의 합이에요.</p>
        <div class="tbl-wrap"><table id="t-keep" class="keeptbl"></table></div>
      </div>
      <div class="sub-sec">
        <div class="sub-head"><h3>구간마다 고른 종목과 비중</h3></div>
        <p class="help">열마다 그 구간만 보고 고른 비중이고, 마지막에서 두 번째 열이 모든 구간에 같이 쓰는 유지형이에요. ‘뽑힌 구간’이 많은 종목일수록 시기가 바뀌어도 꾸준히 뽑힌 종목이에요. 티커를 누르면 설명이 나와요.</p>
        <div class="tbl-wrap"><table id="t-keep-w" class="keepw"></table></div>
      </div>
      <div class="sub-sec">
        <div class="sub-head"><h3>생애 주기별 유지형</h3></div>
        <p class="help">아래 ‘생애 주기별 추천’의 MDD·회복 기간 한도(수정하면 함께 바뀜)를 전체 기간에 지키면서, 가장 나빴던 구간의 CAGR이 가장 높은 조합이에요. 줄을 누르면 비중과 적용 버튼이 나와요.</p>
        <div class="tbl-wrap"><table id="t-keep-life" class="keeplife"></table></div>
        <div id="keep-life-pick" class="keep-life-pick"></div>
      </div>
    </div>
  </section>

"""
rep('  <details class="panel fold" data-fold="o-era" id="o-era-sec">', keep_html + '  <details class="panel fold" data-fold="o-era" id="o-era-sec">')
faq_keep = """          <li><b>장기 유지 추천</b>: 분석 기간 전체를 하나의 구간으로 같은 방식(전수 또는 표본 + 주변 탐색)으로 계산한 뒤, 기준마다 상위 조합(최대 3,000개)을 비중을 바꾸지 않고 최근·가장 과거 10·20·30년 구간에도 각각 새로 시작해 다시 계산해요. AI 유지형은 전체 기간과 모든 구간의 AI 점수(전체·앞 절반·뒤 절반 샤프 비율 중 가장 낮은 값) 가운데 가장 낮은 값이 최대인 조합, 내 기준·생애 주기 유지형은 전체 기간 MDD와 최장 회복 기간이 한도 안인 조합 중 모든 구간 CAGR의 최솟값이 최대인 조합이에요. 구간 안의 하락은 전체 기간에도 그대로 있어서 전체 기간 MDD·회복 기간이 모든 구간의 MDD·회복 기간 이상이에요. 분석 기간 전체의 데이터가 있는 자산만 써요.</li>
"""
rep("          <li><b>과최적화 점검</b>은 같은 방법으로", faq_keep + "          <li><b>과최적화 점검</b>은 같은 방법으로")
modal = """<div class="etf-dlg" id="etf-dlg" hidden>
  <div class="etf-back" data-close></div>
  <div class="etf-box" id="etf-box" role="dialog" aria-modal="true" aria-labelledby="etf-t">
    <div class="etf-head"><div class="etf-ttl"><h2><span id="etf-t" class="mono"></span><span id="etf-c" class="etf-cat"></span></h2><p id="etf-n"></p></div><button class="btn ghost sm" type="button" id="etf-x" data-close>닫기</button></div>
    <div class="etf-body" id="etf-body"></div>
    <div class="etf-add" id="etf-add"></div>
  </div>
</div>
"""
rep('<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>', modal + '<div class="toast" id="toast" role="status" aria-live="polite" hidden></div>')

rep("  function addAsset(t, a) {\n    D.assets[t] = a;", (R / 'src/engine_keep.js').read_text() + "  function addAsset(t, a) {\n    D.assets[t] = a;")
rep("flowSim, flowStarts, safeRate };", "flowSim, flowStarts, safeRate, keepPlan, keepPick };")
rep("  const PCOL = ['var(--p1)', 'var(--p2)', 'var(--p3)'];", (R / 'src/etf_info.js').read_text() + "  const PCOL = ['var(--p1)', 'var(--p2)', 'var(--p3)'];")
rep("""    prog.style.width = '100%';
    btn.disabled = false; optBusy = false;""", """    if (!state.rerun) await runKeep();
    prog.style.width = '100%';
    btn.disabled = false; optBusy = false;""")
rep("function renderOptResults() { renderHz(); buildLife(); fillLife(); renderLifePick(); renderFrontTabs(); drawFrontier(); }",
    "function renderOptResults() { renderHz(); buildLife(); fillLife(); renderLifePick(); renderFrontTabs(); drawFrontier(); renderKeep(); }")
rep("function renderAfterCrit(ids) { if (ids.includes('ai') || ids.includes('user')) renderHz(); fillLife(); renderLifePick(); drawFrontier(); renderAdjCompare(); renderEraCompare(); }",
    "function renderAfterCrit(ids) { if (ids.includes('ai') || ids.includes('user')) renderHz(); fillLife(); renderLifePick(); drawFrontier(); renderAdjCompare(); renderEraCompare(); keepPickAll(); renderKeep(); }")
rep("const plans = allPlans().filter(P => P.ok && P.refine);", "const plans = allPlans().concat(state.opt.keep && state.opt.keep.P.ok ? [state.opt.keep.P] : []).filter(P => P.ok && P.refine);")
rep("  /* ---------- boot ---------- */", (R / 'src/app_keep.js').read_text() + "\n  /* ---------- boot ---------- */")

css2 = """
/* v7.1: ETF dialog, ticker buttons, kept-mix tables */
.tk-info { font: inherit; font-size: 11px; font-weight: 600; color: var(--focus); background: none; border: 1px solid color-mix(in srgb, var(--focus) 35%, transparent); border-radius: 999px; padding: 0 7px; margin-left: 2px; cursor: pointer; line-height: 1.6; }
.tk-info:hover { background: color-mix(in srgb, var(--focus) 10%, transparent); }
.wbar button.tk, .etf-link { font: inherit; font-family: var(--font-mono); font-weight: 600; color: var(--ink); background: none; border: 0; padding: 0; text-align: left; cursor: pointer; text-decoration: underline dotted color-mix(in srgb, var(--ink-2) 55%, transparent); text-underline-offset: 3px; }
.wbar button.tk:hover, .etf-link:hover { color: var(--focus); }
.tick-groups .etf-chip { font: inherit; display: inline-flex; align-items: baseline; gap: 6px; border: 1px solid var(--line-2); background: var(--panel); border-radius: 7px; padding: 3px 9px; margin: 3px 4px 3px 0; cursor: pointer; color: var(--ink-2); font-size: 12px; }
.tick-groups .etf-chip code { font-family: var(--font-mono); font-weight: 600; color: var(--ink); font-size: 12.5px; background: none; padding: 0; }
.tick-groups .etf-chip:hover { border-color: var(--ink-2); }
:root.dlg-open, :root.dlg-open body { overflow: hidden; }
.etf-dlg { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); }
.etf-back { position: absolute; inset: 0; background: rgba(10, 16, 14, 0.45); }
.etf-box { position: relative; width: min(600px, 100%); max-height: min(86vh, 860px); overflow: auto; background: var(--panel); border: 1px solid var(--line-2); border-radius: 14px; box-shadow: 0 18px 50px rgba(0, 0, 0, 0.25); display: grid; gap: 14px; padding: 18px 20px 16px; }
.etf-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.etf-ttl { min-width: 0; display: grid; gap: 2px; }
.etf-ttl h2 { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-size: 22px; }
.etf-ttl p { color: var(--ink-2); font-size: 13px; }
.etf-cat { font-family: var(--font-sans); font-size: 12px; font-weight: 600; color: var(--ink-2); background: var(--panel-2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 9px; }
.etf-d { font-size: 14.5px; line-height: 1.6; }
.etf-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; margin: 0; padding: 12px 0; border-block: 1px solid var(--line); }
.etf-facts div { min-width: 0; }
.etf-facts dt { font-size: 11.5px; color: var(--muted); }
.etf-facts dd { margin: 0; font-size: 13px; color: var(--ink); }
.etf-warn { font-size: 13px; color: var(--ink-2); background: var(--panel-2); border-radius: 8px; padding: 9px 12px; border-left: 3px solid var(--warn); }
.etf-warn b { color: var(--ink); }
.etf-num { display: grid; gap: 6px; }
.etf-num h3 { font-size: 14px; }
.etf-tbl th .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-mono); font-weight: 400; }
.etf-more { color: var(--ink-2); font-family: var(--font-mono); font-size: 12px; }
.etf-add { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; border-top: 1px solid var(--line); padding-top: 12px; }
@media (max-width: 560px) { .etf-dlg { place-items: end stretch; padding-inline: 0; padding-bottom: 0; } .etf-box { width: 100%; border-radius: 14px 14px 0 0; max-height: 88vh; padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px)); } .etf-facts { grid-template-columns: 1fr; } }
#sec-keep .picks { margin-top: 4px; }
.keeptbl td .sub { display: block; font-family: var(--font-sans); font-size: 11px; color: var(--muted); white-space: normal; max-width: 240px; margin-left: auto; }
.keeptbl tbody th .sub, .keeplife tbody th .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-mono); font-weight: 400; }
.keepw td.wcell { color: var(--muted); }
.keepw td.wcell.on { color: var(--ink); font-weight: 600; }
.keepw .keepcol { background: color-mix(in srgb, var(--p1) 9%, transparent); }
.keepw thead th { white-space: normal; min-width: 64px; }
.keeplife td.twrap { white-space: normal; text-align: left; min-width: 140px; }
.keeplife td.wtxt { min-width: 200px; font-size: 12.5px; }
.keeplife td .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-sans); }
.keeplife td.ok { color: var(--pos); }
.keeplife thead th:nth-child(2), .keeplife thead th:nth-child(3) { text-align: left; }
.keeplife tr.life-row { cursor: pointer; }
.keeplife tr.life-row:hover th, .keeplife tr.life-row:hover td, .keeplife tr.life-row.sel th, .keeplife tr.life-row.sel td { background: var(--panel-2); }
.keep-life-pick:not(:empty) { margin-top: 12px; max-width: 560px; }
"""
rep("@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }", "@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }" + css2)

# ================= v7.2: yearly contributions + how much a saving plan gathered =================
rep('<dt>v7.1 · 2026.10.26</dt>', """<dt>v7.2 · 2026.10.27</dt>
          <dd><ul>
            <li>적립·인출 › 넣는 때: ‘매달’ 또는 ‘매년 초’(해마다 1월 초)를 골라요. 처음 넣는 돈과 함께 매년 넣는 돈으로 계산해요</li>
            <li>적립·인출 › 적립하면 얼마나 모일까: 같은 적립 계획을 과거 모든 시작 시점에서 5~30년 했다면 얼마가 모였는지(가장 적게·하위 10%·중앙값·상위 10%·가장 많이), 넣은 돈보다 적었던 비율과 시작 시점별 차트</li>
          </ul></dd>
          <dt>v7.1 · 2026.10.26</dt>""")
rep('<span class="upd-v">v7.1</span><span class="upd-d">2026.10.26</span><span class="upd-t">ETF 설명과 기간이 바뀌어도 유지되는 최적 비중을 더했어요</span>',
    '<span class="upd-v">v7.2</span><span class="upd-d">2026.10.27</span><span class="upd-t">매년 초 적립과 ‘적립하면 얼마나 모일까’를 더했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.1</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.2</span></h1>')
rep("          <li><b>은퇴 인출 점검</b>은", """          <li><b>매년 초 적립</b>은 해마다 1월 초에 넣어요. 분석 시작 달이 1월이면 첫해에도 처음 넣는 돈과 함께 넣고, ‘해마다 늘리기’는 해가 바뀔 때마다 적용해요. <b>적립하면 얼마나 모일까</b>는 같은 계획(인출 없음)을 고른 자산의 데이터가 있는 모든 시작 달(매년 초 적립이면 모든 1월)에서 정한 기간만큼 돌린 결과예요. 넣은 돈은 처음 넣는 돈과 적립금의 합(물가 반영이면 시작 시점 돈의 가치)이에요.</li>
          <li><b>은퇴 인출 점검</b>은""")
rep(".rt-help { align-self: center; }", ".rt-help { align-self: center; }\n.acc-help { grid-column: 2 / -1; }\n.acctbl td .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-sans); }")
