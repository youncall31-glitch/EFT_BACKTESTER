# ================= v7.4: choose the investment style first; my tickers fixed for the whole period =================
rep('<dt>v7.3 · 2026.10.27</dt>', """<dt>v7.4 · 2026.10.27</dt>
          <dd><ul>
            <li>입력 탭 맨 앞 ‘어떻게 투자하나요?’: 한 번에 넣기 · 매달 적립 · 매년 초 적립 · 모은 돈 꺼내 쓰기 중에서 고르고 금액을 바로 넣어요. 고른 방식의 결과가 결과 탭 맨 위와 입력 탭 미리보기에 나와요</li>
            <li>최적화 › 고른 종목으로 전체 기간 고정: 대상 자산만으로 비중을 분석 기간 내내 바꾸지 않을 때, MDD 한도(10~50%, 제한 없음)마다 CAGR이 가장 높은 조합. 각 조합이 10·20·30년 구간에서 가장 나빴던 CAGR도 함께</li>
            <li>‘모든 조합의 CAGR과 MDD’ 차트에 분석 기간 전체 탭</li>
          </ul></dd>
          <dt>v7.3 · 2026.10.27</dt>""")
rep('<span class="upd-v">v7.3</span><span class="upd-d">2026.10.27</span><span class="upd-t">처음 쓰는 분도 쉽게: 기본·고급으로 나누고 길잡이를 더했어요</span>',
    '<span class="upd-v">v7.4</span><span class="upd-d">2026.10.27</span><span class="upd-t">투자 방식을 맨 앞에서 고르고, 전체 기간 고정 비중의 최적 조합을 더했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.3</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.4</span></h1>')

style_html = '''  <section class="panel style-sec" aria-labelledby="h-style" id="sec-style">
    <div class="panel-head"><h2 id="h-style">어떻게 투자하나요?</h2><p class="help">먼저 투자 방식을 고르세요. 결과 탭과 적립·인출 탭이 이 방식으로 계산해요. 언제든 바꿀 수 있어요.</p></div>
    <div class="styles" role="radiogroup" aria-labelledby="h-style">
      <label class="sty"><input type="radio" name="sty" value="lump"><span class="sty-ic" aria-hidden="true">●</span><span class="sty-tx"><b>한 번에 넣기</b><small>거치식 · 처음에 넣고 그대로 둬요</small></span></label>
      <label class="sty"><input type="radio" name="sty" value="M"><span class="sty-ic" aria-hidden="true">▮▮▮</span><span class="sty-tx"><b>매달 적립</b><small>처음 넣는 돈 + 매달 넣는 돈</small></span></label>
      <label class="sty"><input type="radio" name="sty" value="Y"><span class="sty-ic" aria-hidden="true">▮ ▮ ▮</span><span class="sty-tx"><b>매년 초 적립</b><small>처음 넣는 돈 + 해마다 1월에 넣는 돈</small></span></label>
      <label class="sty"><input type="radio" name="sty" value="wd"><span class="sty-ic" aria-hidden="true">▼</span><span class="sty-tx"><b>모은 돈 꺼내 쓰기</b><small>은퇴 · 처음 넣은 돈에서 매달 빼 써요</small></span></label>
    </div>
    <div class="sty-amt">
      <div class="field"><label for="st-init" id="st-init-l">처음 넣는 돈</label><input id="st-init" type="number" min="1" step="1000" inputmode="numeric"><p class="amt-hint" id="st-init-h"></p></div>
      <div class="field" id="st-c-f"><label for="st-c" id="st-c-l">매달 넣는 돈</label><input id="st-c" type="number" min="0" step="100" inputmode="numeric"><p class="amt-hint" id="st-c-h"></p></div>
      <div class="field" id="st-w-f"><label for="st-w" id="st-w-l">매달 빼는 돈</label><input id="st-w" type="number" min="0" step="100" inputmode="numeric"><p class="amt-hint" id="st-w-h"></p></div>
      <p class="help sty-note" id="st-note"></p>
    </div>
    <p class="notice" id="st-mix" hidden>적립·인출 탭에서 직접 정한 계획(넣다가 빼기 등)을 쓰고 있어요. 위에서 방식을 고르면 그 방식으로 바뀌어요.</p>
    <p class="small muted">기간·통화·리밸런싱은 아래 ‘기간과 금액’에서, 세금과 자세한 계획(해마다 늘리기, 빼기 시작 시점 등)은 ‘3 적립·인출’ 탭에서 정해요.</p>
  </section>

'''
rep('  <section class="panel start" aria-labelledby="h-start" id="sec-start">', style_html + '  <section class="panel start" aria-labelledby="h-start" id="sec-start">')
rep('<li><b>포트폴리오 고르기</b><span>ETF와 비중(%)을 넣거나 ‘예시 불러오기’</span></li>\n        <li><b>기간·금액 정하기</b><span>언제부터 얼마로 시작했는지, 달러 또는 원화</span></li>',
    '<li><b>투자 방식·금액 고르기</b><span>위에서 한 번에 / 매달 / 매년 / 꺼내 쓰기</span></li>\n        <li><b>포트폴리오와 기간</b><span>ETF와 비중(%), 언제부터 · 달러 또는 원화</span></li>')
rep("<p class=\"help\" id=\"start-lede\">모든 탭이 이 ‘입력’ 탭의 포트폴리오와 기간을 함께 써요.", "<p class=\"help\" id=\"start-lede\">모든 탭이 이 ‘입력’ 탭의 투자 방식·포트폴리오·기간을 함께 써요.")
rep("$('#start-lede').textContent = open ? '모든 탭이 이 ‘입력’ 탭의 포트폴리오와 기간을 함께 써요.", "$('#start-lede').textContent = open ? '모든 탭이 이 ‘입력’ 탭의 투자 방식·포트폴리오·기간을 함께 써요.")
# input-tab preview + results tab: the chosen style's outcome
rep('    <div class="qr-list" id="qr-body"></div>', '    <div class="qr-list" id="qr-body"></div>\n    <div class="qr-flow" id="qr-flow" hidden><h3 id="qr-flow-h"></h3><div id="qr-flow-t"></div></div>')
rep('''  <section class="panel hero" aria-labelledby="h-hero" id="sec-hero">''', '''  <section class="panel" aria-labelledby="h-res-flow" id="sec-res-flow" hidden>
    <div class="hero-head"><h2 id="h-res-flow">내 투자 방식대로 했다면</h2><p class="hero-when" id="rf-when"></p></div>
    <div id="t-rf"></div>
    <div class="row rf-go"><button class="btn ghost sm" type="button" data-goto="sec-fl-res">자세히 보기 (3 적립·인출)</button><button class="btn ghost sm" type="button" data-goto="sec-acc">언제 시작했느냐에 따라 얼마나 모였나</button><button class="btn ghost sm" type="button" data-goto="sec-style">투자 방식 바꾸기</button></div>
  </section>
  <section class="panel hero" aria-labelledby="h-hero" id="sec-hero">''')
rep('      <p class="hero-when" id="hero-when"></p>', '      <p class="hero-when" id="hero-when"></p>\n      <p class="small muted" id="hero-mode" hidden>아래는 처음 넣는 돈만 한 번에 넣었을 때예요. 연 수익률·최대 낙폭은 포트폴리오 자체의 성과라 투자 방식과 상관없이 같아요.</p>')

# optimizer: my tickers fixed for the whole period
fix_html = '''  <section class="panel" aria-labelledby="h-fix" id="sec-fix">
    <div class="panel-head"><h2 id="h-fix">고른 종목으로 전체 기간 고정 — 최적 CAGR·MDD 조합</h2><p class="help">‘대상 자산’에서 고른 종목만 써서, 비중을 분석 기간 내내 바꾸지 않고(정해진 때 그 비중으로 리밸런싱만) 들고 있었을 때예요. 감당할 MDD마다 CAGR이 가장 높았던 조합을 보여줘요. MDD 한도를 올릴수록 CAGR이 얼마나 늘어나는지 비교해 고르세요. 줄을 누르면 비중과 적용 버튼이 나와요.</p></div>
    <div class="fix-sel"><span class="lbl">대상 종목</span><div class="chips" id="fix-tk"></div><button class="btn ghost sm" type="button" id="fix-edit">종목 바꾸기</button></div>
    <p class="small muted" id="fix-status" aria-live="polite"></p>
    <div class="tbl-wrap"><table id="t-fix" class="fixtbl keeplife"></table></div>
    <div id="fix-pick" class="keep-life-pick"></div>
    <p class="small muted">가장 나쁜 구간 CAGR은 같은 비중을 최근·가장 과거 10·20·30년에 새로 시작했을 때 가장 낮았던 값이고, 아무 10년 최저 CAGR은 분석 기간 안 모든 10년 구간(1개월 간격) 중 가장 낮은 값이에요. 모든 조합의 위치는 아래 ‘모든 조합의 CAGR과 MDD’의 ‘전체’ 탭에서 볼 수 있어요. 종목을 바꾸면 ‘최적 비중 찾기’를 다시 눌러 주세요.</p>
  </section>

'''
rep('  <section class="panel" aria-labelledby="h-hz" id="sec-hz">', fix_html + '  <section class="panel" aria-labelledby="h-hz" id="sec-hz">')
rep('<button type="button" class="jchip" data-goto="sec-hz">기간별 최적 비중</button>', '<button type="button" class="jchip" data-goto="sec-fix">전체 기간 고정</button><button type="button" class="jchip" data-goto="sec-hz">기간별 최적 비중</button>')
rep('<li><button type="button" class="map-link adv" data-goto="sec-hz">기간별 최적 비중</button></li>', '<li><button type="button" class="map-link adv" data-goto="sec-fix">고른 종목으로 전체 기간 고정</button></li><li><button type="button" class="map-link adv" data-goto="sec-hz">기간별 최적 비중</button></li>')
rep('<p>무엇을, 언제부터, 얼마로</p><ul>', '<p>어떻게, 무엇을, 언제부터, 얼마로</p><ul><li><button type="button" class="map-link" data-goto="sec-style">투자 방식: 한 번에 · 매달 · 매년 초 · 꺼내 쓰기</button></li>')
# frontier chart: a tab for the whole period
rep("  const POS_TXT = { recent: '최근', old: '가장 과거' };", "  const POS_TXT = { recent: '최근', old: '가장 과거', all: '전체' };")
rep("  const posName = P => (P.pos === 'old' ? `과거 ${P.years}년(${BT.label(P.i0)}~)` : `${P.years}년`);",
    "  const posName = P => (P.pos === 'old' ? `과거 ${P.years}년(${BT.label(P.i0)}~)` : P.pos === 'all' ? `전체 기간(${BT.label(P.i0)}~${BT.label(P.i1)})` : `${P.years}년`);")
rep("""      host.appendChild(b);
    });
  }
  const textW""", """      host.appendChild(b);
    });
    const K = o.keep;
    if (K && K.P) {
      const b = el('button', null, `전체 ${monthsTxt(K.P.i1 - K.P.i0 + 1)}`); b.type = 'button'; b.setAttribute('aria-pressed', state.optTab === 'all' ? 'true' : 'false');
      if (!K.P.ok) { b.disabled = true; b.title = K.P.reason; }
      b.addEventListener('click', () => { state.optTab = 'all'; $('#front-pick').innerHTML = ''; renderFrontTabs(); drawFrontier(); });
      host.appendChild(b);
    }
  }
  const textW""")
rep("    const H = viewPlans()[state.optTab];\n    if (!H || !H.ok) { host.appendChild(el('p', 'empty', H ? H.reason : '계산된 구간이 없어요.')); return; }",
    "    const H = state.optTab === 'all' ? (o.keep ? o.keep.P : null) : viewPlans()[state.optTab];\n    if (!H || !H.ok) { host.appendChild(el('p', 'empty', H ? H.reason : state.optTab === 'all' ? '분석 기간 전체를 계산하는 중이에요.' : '계산된 구간이 없어요.')); return; }")
rep("  /* ---------- boot ---------- */", (R / 'src/app_style.js').read_text() + "\n  /* ---------- boot ---------- */")
rep("  initUI();", "  initUI(); syncStyleUI();")

css4 = """
/* v7.4: investment style chooser, style outcome, fixed-mix table */
.style-sec .panel-head { margin-bottom: 12px; }
.styles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.sty { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; align-items: center; padding: 14px 16px; border: 1px solid var(--line-2); border-radius: 12px; background: var(--panel); cursor: pointer; min-width: 0; }
.sty input { position: absolute; opacity: 0; pointer-events: none; }
.sty:hover { border-color: var(--ink-2); }
.sty.on { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); background: var(--panel-2); }
.sty:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
.sty-ic { font-family: var(--font-mono); font-size: 13px; letter-spacing: -0.12em; color: var(--muted); width: 38px; text-align: center; }
.sty.on .sty-ic { color: var(--ink); }
.sty-tx { display: grid; gap: 2px; min-width: 0; }
.sty-tx b { font-size: 15px; }
.sty-tx small { font-size: 12px; color: var(--ink-2); line-height: 1.4; }
.sty-amt { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr)); gap: 12px 18px; align-items: start; margin-top: 14px; }
.sty-amt .sty-note { align-self: center; grid-column: auto; }
.qr-flow { margin-top: 14px; display: grid; gap: 6px; }
.qr-flow h3 { font-size: 14px; }
.qr-flow .tbl-wrap { max-width: 780px; }
.rftbl tbody th { white-space: normal; }
.rf-go { margin-top: 12px; }
.fix-sel { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; margin-bottom: 8px; }
.fix-sel .lbl { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.fix-chip { font-family: var(--font-mono); font-weight: 600; }
.fix-chip.out { text-decoration: line-through; opacity: 0.6; }
.fixtbl tbody th { white-space: nowrap; font-weight: 600; }
.fixtbl tr.fix-row { cursor: pointer; }
.fixtbl tr.fix-row:hover th, .fixtbl tr.fix-row:hover td, .fixtbl tr.fix-row.sel th, .fixtbl tr.fix-row.sel td { background: var(--panel-2); }
.fixtbl td .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-sans); }
@media (max-width: 900px) { .styles { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) { .sty { padding: 12px; grid-template-columns: 1fr; } .sty-ic { display: none; } .sty-tx b { font-size: 14px; } }
"""
rep("@media (max-width: 560px) { .tb-mode span:last-child { display: none; } .tb-nav a .n { display: none; } }",
    "@media (max-width: 560px) { .tb-mode span:last-child { display: none; } .tb-nav a .n { display: none; } }" + css4)
