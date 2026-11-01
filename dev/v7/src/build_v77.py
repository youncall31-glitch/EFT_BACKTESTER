# ================= v7.7: summary tab (CAGR·MDD, consistency, overfitting, AI pick), mobile-first navigation =================
rep('<dt>v7.6 · 2026.10.28</dt>', """<dt>v7.7 · 2026.10.28</dt>
          <dd><ul>
            <li>새 ‘2 요약’ 탭: ① CAGR·MDD ② 정합성(기간별 CAGR·MDD, 아무 때나 3·5·10년 보유한 범위) ③ 과최적화(운 점검, 고르는 방식의 과최적화 확률) ④ AI 추천(고른 종목·감당할 MDD·회복 기간 안에서 오래 들고 갈 비중)을 그래프와 숫자로 한 화면에</li>
            <li>AI 추천은 요약 탭을 열면 자동으로 계산해요(기본 보기에서도)</li>
            <li>휴대폰: 아래쪽 메뉴를 입력 · 요약 · 결과 · 적립·인출 · 더보기로 정리하고, 점검·최적화·도움말과 ‘모든 기능’은 더보기에서</li>
          </ul></dd>
          <dt>v7.6 · 2026.10.28</dt>""")
rep('<span class="upd-v">v7.6</span><span class="upd-d">2026.10.28</span><span class="upd-t">3·5·10년 구간 산포를 보여주고, 신뢰도를 예측 가능성 점수로 바꿨어요</span>',
    '<span class="upd-v">v7.7</span><span class="upd-d">2026.10.28</span><span class="upd-t">요약 탭에서 CAGR·MDD, 정합성, 과최적화, AI 추천을 한눈에 봐요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.6</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.7</span></h1>')

# icons
rep('  <symbol id="i-checks"', '  <symbol id="i-sum" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="4" rx="1.5"/><rect x="13" y="10" width="7" height="10" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/></symbol>\n  <symbol id="i-more" viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></symbol>\n  <symbol id="i-checks"')
# top bar: summary as step 2, renumber
rep('<span><i class="n">2</i>결과</span>', '<span><i class="n">3</i>결과</span>')
rep('<span><i class="n">3</i>적립·인출</span>', '<span><i class="n">4</i>적립·인출</span>')
rep('<span><i class="n">4</i>점검</span>', '<span><i class="n">5</i>점검</span>')
rep('<span><i class="n">5</i>최적화</span>', '<span><i class="n">6</i>최적화</span>')
rep('<a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span><i class="n">1</i>입력</span></a>',
    '<a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span><i class="n">1</i>입력</span></a>\n      <a href="#g-sum" data-g="g-sum"><svg class="ic" aria-hidden="true"><use href="#i-sum"/></svg><span><i class="n">2</i>요약</span></a>')
# bottom bar (phones): 입력 · 요약 · 결과 · 적립·인출 · 더보기
rep('''  <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span>입력</span></a>
  <a href="#g-results" data-g="g-results">''', '''  <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span>입력</span></a>
  <a href="#g-sum" data-g="g-sum"><svg class="ic" aria-hidden="true"><use href="#i-sum"/></svg><span>요약</span></a>
  <a href="#g-results" data-g="g-results">''')
rep('''  <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
</nav>''', '''  <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
  <button type="button" class="bn-more2" id="bn-more2" aria-haspopup="dialog"><svg class="ic" aria-hidden="true"><use href="#i-more"/></svg><span>더보기</span></button>
</nav>
<div class="sheet" id="more-sheet" hidden>
  <div class="sheet-back" data-sheet-close></div>
  <div class="sheet-box" role="dialog" aria-modal="true" aria-labelledby="sheet-t">
    <div class="sheet-h"><b id="sheet-t">더보기</b><button class="btn ghost sm" type="button" data-sheet-close>닫기</button></div>
    <button class="sheet-i" type="button" data-go="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span><b>5 점검 <em>고급</em></b><small>시기를 나눠 결과가 일관됐는지 판정, 시작×끝 연도 지도</small></span></button>
    <button class="sheet-i" type="button" data-go="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span><b>6 최적화 <em>고급</em></b><small>기간별 최적 비중, 장기 유지, 신뢰도 반영, 생애 주기</small></span></button>
    <button class="sheet-i" type="button" data-go="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span><b>도움말</b><small>계산기 구성, 용어, ETF 설명, 화면 설정</small></span></button>
    <div class="sheet-mode"><span><b>모든 기능 보기</b><small>결과 탭의 고급 지표와 점검·최적화를 모두 보여요</small></span><button class="tb-mode" type="button" id="sheet-mode" aria-pressed="false"><span class="sw" aria-hidden="true"></span><span>모든 기능</span></button></div>
  </div>
</div>''')

# the summary pane right after the input pane
rep('''  <div class="pane" data-g="g-results" id="pane-results">''', (R / 'src/sum_pane.html').read_text() + '''  <div class="pane" data-g="g-results" id="pane-results">''')
rep('<nav class="pane-nav tabs-only" aria-label="단계 이동"><span></span><button class="btn" type="button" data-go="g-results">결과 보기 →</button></nav>',
    '<nav class="pane-nav tabs-only" aria-label="단계 이동"><span></span><button class="btn" type="button" data-go="g-sum">요약 보기 →</button></nav>')
rep('<button class="btn" type="button" data-go="g-results">결과 자세히 보기</button>', '<button class="btn" type="button" data-go="g-sum">요약 보기</button><button class="btn ghost" type="button" data-go="g-results">결과 자세히</button>')
rep('<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-setup">← 입력</button><button class="btn" type="button" data-go="g-flow">적립·인출 →</button></nav>',
    '<nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-sum">← 요약</button><button class="btn" type="button" data-go="g-flow">적립·인출 →</button></nav>')
# step labels
rep('<span class="g-eye">기본 · 2단계</span><h2 class="grp-t">결과</h2>', '<span class="g-eye">기본 · 3단계 · 자세히</span><h2 class="grp-t">결과</h2>')
rep('<span class="g-eye">기본 · 3단계</span><h2 class="grp-t">적립·인출</h2>', '<span class="g-eye">기본 · 4단계</span><h2 class="grp-t">적립·인출</h2>')
rep('<span class="g-eye">고급 · 4단계</span><h2 class="grp-t">점검</h2>', '<span class="g-eye">고급 · 5단계</span><h2 class="grp-t">점검</h2>')
rep('<span class="g-eye">고급 · 5단계</span><h2 class="grp-t">최적화</h2>', '<span class="g-eye">고급 · 6단계</span><h2 class="grp-t">최적화</h2>')
h = h.replace('<span class="g-cat">기본 · 3 적립·인출</span>', '<span class="g-cat">기본 · 4 적립·인출</span>').replace('<span class="g-cat">고급 · 4 점검</span>', '<span class="g-cat">고급 · 5 점검</span>')
rep('<button class="goal" type="button" data-goto="sec-hero"><span class="g-cat">기본 · 2 결과</span><b>과거에 얼마나 불었을까</b>', '<button class="goal" type="button" data-goto="sum-1"><span class="g-cat">기본 · 2 요약</span><b>과거에 얼마나 불었을까</b>')
rep('<button class="goal" type="button" data-goto="sec-trust-res"><span class="g-cat">기본 · 2 결과</span><b>이 결과를 미래에도 믿을 수 있을까</b>', '<button class="goal" type="button" data-goto="sum-2"><span class="g-cat">기본 · 2 요약</span><b>이 결과를 미래에도 믿을 수 있을까</b>')
rep('<button class="goal adv" type="button" data-goto="sec-keep"><span class="g-cat">고급 · 5 최적화</span><b>어떤 비중이 좋았을까</b><span class="g-d">기간별 최적 비중과 오래 유지할 비중</span>',
    '<button class="goal" type="button" data-goto="sum-4"><span class="g-cat">기본 · 2 요약</span><b>내가 감당할 수 있는 최적 비중은</b><span class="g-d">고른 종목·최대 낙폭 안에서 AI가 추천</span>')
# site map: new card + renumber
rep('<div class="map-card"><h3><i class="n">2</i>결과</h3>', '''<div class="map-card"><h3><i class="n">2</i>요약</h3><p>핵심 네 가지를 한눈에</p><ul><li><button type="button" class="map-link" data-goto="sum-1">① CAGR · MDD</button></li><li><button type="button" class="map-link" data-goto="sum-2">② 정합성: 기간별 차이, 3·5·10년 범위</button></li><li><button type="button" class="map-link" data-goto="sum-3">③ 과최적화: 운 점검, 과최적화 확률</button></li><li><button type="button" class="map-link" data-goto="sum-4">④ AI 추천 포트폴리오</button></li></ul></div>
        <div class="map-card"><h3><i class="n">3</i>결과</h3>''')
rep('<h3><i class="n">3</i>적립·인출</h3>', '<h3><i class="n">4</i>적립·인출</h3>')
rep('<h3><i class="n">4</i>점검</h3>', '<h3><i class="n">5</i>점검</h3>')
rep('<h3><i class="n">5</i>최적화</h3>', '<h3><i class="n">6</i>최적화</h3>')
rep("‘1 입력’에서 정한 포트폴리오·기간·처음 넣는 돈·통화·물가·배당 설정을 다른 모든 탭이 함께 써요.", "‘1 입력’에서 정한 포트폴리오·기간·처음 넣는 돈·통화·물가·배당 설정을 다른 모든 탭이 함께 써요. 처음이라면 ‘2 요약’만 봐도 핵심(CAGR·MDD, 정합성, 과최적화, AI 추천)을 알 수 있어요.")

# script
rep("const TAB_IDS = ['g-setup', 'g-results', 'g-flow', 'g-checks', 'g-opt', 'g-ref'];", "const TAB_IDS = ['g-setup', 'g-sum', 'g-results', 'g-flow', 'g-checks', 'g-opt', 'g-ref'];")
rep("""    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;
    if (state.mode === 'basic') return;
    state.optDeferred = false; setTimeout(runOpt, 60);""", """    if (state.layout === 'tabs' && state.tab !== 'g-opt' && state.tab !== 'g-sum') return;
    if (state.mode === 'basic' && state.tab !== 'g-sum' && state.layout === 'tabs') return;
    state.optDeferred = false; setTimeout(() => { runOpt(); renderSumAI(); }, 60);""")
rep("    if (state.layout !== 'tabs' || g === 'g-flow') markRetireStale();\n  }",
    "    if (state.layout !== 'tabs' || g === 'g-flow') markRetireStale();\n    const bm = document.getElementById('bn-more2'); if (bm) bm.classList.toggle('on', ['g-checks', 'g-opt', 'g-ref'].includes(g));\n  }")
rep("    for (const host of [$('#quick'), (k === 25 || k === 15) ? null : $('#quick2')]) {", "    for (const host of [$('#quick'), (k === 25 || k === 15) ? null : $('#quick2'), (k === 25 || k === 15) ? null : $('#quick3')]) {")
rep("document.querySelectorAll('#quick .chip, #quick2 .chip')", "document.querySelectorAll('#quick .chip, #quick2 .chip, #quick3 .chip')")
rep("    renderCtx(); renderFlow(); renderTrustRes();\n  }", "    renderCtx(); renderFlow(); renderTrustRes(); renderSum();\n  }", 2)
h = h.replace("drawAcc(); drawDisp(); }", "drawAcc(); drawDisp(); drawSum(); }").replace("drawAcc(); drawDisp(); });", "drawAcc(); drawDisp(); drawSum(); });")
rep("    o.trust = { T, pbo, VSR: v / Math.max(1, S.n - 1) };\n    await new Promise(r => setTimeout(r, 0));\n    trustPickAll(); renderTrustOpt();",
    "    o.trust = { T, pbo, VSR: v / Math.max(1, S.n - 1) };\n    await new Promise(r => setTimeout(r, 0));\n    trustPickAll(); renderTrustOpt(); state.sumAI = null; renderSumAI();")
ui7 = r'''
  /* ---------- v7.7: phone 'more' sheet ---------- */
  function sheet(open) { $('#more-sheet').hidden = !open; document.documentElement.classList.toggle('dlg-open', open); if (open) $('#sheet-mode').setAttribute('aria-pressed', state.mode === 'full' ? 'true' : 'false'); }
  $('#bn-more2').addEventListener('click', () => sheet(true));
  $('#more-sheet').addEventListener('click', e => { if (e.target.closest('[data-sheet-close]') || e.target.closest('[data-go]')) sheet(false); });
  $('#sheet-mode').addEventListener('click', () => { setMode(state.mode === 'full' ? 'basic' : 'full', true); $('#sheet-mode').setAttribute('aria-pressed', state.mode === 'full' ? 'true' : 'false'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#more-sheet').hidden) sheet(false); });
  $('#sum-run').addEventListener('click', () => { if (optBusy) return; if (!state.optSel.size) validPorts().forEach(p => p.info.tickers.forEach(t => state.optSel.add(t))); runOpt(); renderSumAI(); });
'''
rep("  /* ---------- boot ---------- */", (R / 'src/app_sum.js').read_text() + ui7 + "\n  /* ---------- boot ---------- */")
rep("  initUI(); syncStyleUI();", "  initUI(); syncStyleUI();\n  if (state.tab === 'g-sum') state.optDeferred = true;")

css7 = """
/* v7.7: summary tab */
.sum-nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.sum-nav button { font: inherit; font-size: 13px; font-weight: 600; color: var(--ink); background: var(--panel); border: 1px solid var(--line-2); border-radius: 10px; padding: 8px 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 42px; }
.sum-nav button:hover { border-color: var(--ink-2); }
.sum-nav i, .sc-n { font-style: normal; font-family: var(--font-mono); font-weight: 700; display: inline-grid; place-items: center; border-radius: 50%; background: var(--ink); color: var(--panel); }
.sum-nav i { width: 20px; height: 20px; font-size: 11.5px; }
.scard { display: grid; gap: 12px; }
.sc-h { display: flex; gap: 12px; align-items: flex-start; }
.sc-n { width: 30px; height: 30px; font-size: 15px; flex: none; margin-top: 1px; }
.sc-h h2 { font-size: 19px; }
.sc-q { font-size: 13px; color: var(--muted); }
.sc-sub { font-size: 14.5px; margin-top: 6px; }
.sc-sub-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
.sc-more { display: flex; flex-wrap: wrap; gap: 6px; border-top: 1px dashed var(--line-2); padding-top: 10px; }
.sum-q { margin-top: -4px; }
.sk-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: 10px; }
.sk { border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; display: grid; gap: 6px; background: var(--panel); min-width: 0; }
.sk.bench { background: var(--panel-2); border-style: dashed; }
.sk-n { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; min-width: 0; }
.sk-n span:not(.key) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.sk-n i { margin-left: auto; font-style: normal; font-size: 11px; font-weight: 500; color: var(--muted); white-space: nowrap; }
.sk-v { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.sk-v div { display: grid; }
.sk-v span { font-size: 11.5px; color: var(--muted); }
.sk-v b { font-family: var(--font-mono); font-size: 24px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.15; }
.sk-v b.neg { color: var(--neg); }
.sk-f { font-size: 12px; color: var(--ink-2); font-family: var(--font-mono); }
.sv-list { display: grid; gap: 8px; }
.sv, .sl { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 4px; background: var(--panel); }
.sv p, .sl p { font-size: 12.5px; color: var(--ink-2); line-height: 1.5; }
.sv-n { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.sv-n b { font-size: 14px; }
.sv-g { font-size: 12px; color: var(--muted); }
.badges { display: flex; flex-wrap: wrap; gap: 5px; }
.bdg { font-size: 12px; font-weight: 600; padding: 2px 9px; border-radius: 999px; border: 1px solid var(--line-2); cursor: help; }
.bdg.ok { color: var(--pos); border-color: color-mix(in srgb, var(--pos) 40%, transparent); background: color-mix(in srgb, var(--pos) 8%, transparent); }
.bdg.warn { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 45%, transparent); background: color-mix(in srgb, var(--warn) 10%, transparent); }
.bdg.na { color: var(--muted); }
.sum-pbo:not(:empty) { display: grid; gap: 6px; margin-top: 4px; }
.sum-pbo h4, .ai-alt h4 { font-size: 14px; margin: 0; }
.ai-ctl { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr); gap: 12px 16px; align-items: end; }
.ai-tk { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.ai-tk .lbl { width: 100%; }
.ai-rec { border: 2px solid var(--p3); border-radius: 14px; padding: 14px 16px; display: grid; gap: 12px; background: color-mix(in srgb, var(--p3) 5%, var(--panel)); }
.ai-h { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; }
.ai-h h3 { font-size: 15.5px; }
.ai-badge { font-size: 12px; font-weight: 700; color: var(--panel); background: var(--p3); border-radius: 999px; padding: 2px 10px; }
.ai-kv { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.ai-kv div { display: grid; gap: 1px; background: var(--panel); border-radius: 8px; padding: 8px 10px; min-width: 0; }
.ai-kv span { font-size: 11.5px; color: var(--muted); }
.ai-kv b { font-family: var(--font-mono); font-size: 19px; font-weight: 600; }
.ai-kv b.neg { color: var(--neg); }
.ai-kv i { font-style: normal; font-family: var(--font-mono); font-size: 10.5px; color: var(--muted); }
.ai-why { margin: 0; padding-left: 18px; display: grid; gap: 4px; font-size: 13px; color: var(--ink-2); }
.ai-alt { display: grid; gap: 8px; margin-top: 4px; }
.alt-r { border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; display: grid; gap: 4px; }
.alt-n { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
.alt-n span { font-size: 12px; color: var(--muted); }
.alt-v { font-family: var(--font-mono); font-size: 13px; }
.alt-w { font-family: var(--font-mono); font-size: 12px; color: var(--ink-2); }
#sum-map-wrap { display: grid; gap: 6px; }
#sum-prog { max-width: 520px; }
/* phone sheet */
.bnav .bn-more2 { display: none; }
.sheet { position: fixed; inset: 0; z-index: 70; display: grid; align-items: end; }
.sheet-back { position: absolute; inset: 0; background: rgba(10, 16, 14, 0.45); }
.sheet-box { position: relative; background: var(--panel); border-radius: 16px 16px 0 0; padding: 14px max(16px, env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); display: grid; gap: 8px; box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2); }
.sheet-h { display: flex; justify-content: space-between; align-items: center; font-size: 16px; }
.sheet-i { font: inherit; display: grid; grid-template-columns: 30px minmax(0, 1fr); gap: 10px; align-items: center; text-align: left; padding: 12px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); color: var(--ink); cursor: pointer; }
.sheet-i .ic { width: 24px; height: 24px; }
.sheet-i span { display: grid; gap: 2px; }
.sheet-i b { font-size: 15px; }
.sheet-i em { font-style: normal; font-size: 11px; font-weight: 600; color: var(--muted); border: 1px solid var(--line-2); border-radius: 999px; padding: 0 6px; margin-left: 4px; }
.sheet-i small { font-size: 12px; color: var(--muted); }
.sheet-mode { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 4px 0; }
.sheet-mode > span { display: grid; gap: 2px; } .sheet-mode small { font-size: 12px; color: var(--muted); }
@media (max-width: 760px) { .ai-ctl { grid-template-columns: 1fr 1fr; } .ai-tk { grid-column: 1 / -1; } .ai-kv { grid-template-columns: 1fr 1fr; } }
@media (max-width: 640px) {
  :root.tabs .bnav a[data-g="g-checks"], :root.tabs .bnav a[data-g="g-opt"], :root.tabs .bnav a[data-g="g-ref"], :root.tabs .bnav a.bn-more { display: none !important; }
  :root.tabs .bnav .bn-more2 { display: grid; justify-items: center; gap: 2px; padding: 5px 0 4px; color: var(--muted); font: inherit; font-size: 11.5px; font-weight: 600; background: none; border: 0; min-width: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  :root.tabs .bnav .bn-more2 .ic { width: 54px; height: 30px; padding: 4px 16px; border-radius: 999px; }
  :root.tabs .bnav .bn-more2.on { color: var(--ink); }
  :root.tabs .bnav .bn-more2.on .ic { background: color-mix(in srgb, var(--ink) 11%, transparent); }
  .sum-nav { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; position: sticky; top: env(safe-area-inset-top, 0px); z-index: 20; background: var(--bg); padding-block: 6px; margin-inline: calc(-1 * max(16px, env(safe-area-inset-left, 0px))); padding-inline: max(16px, env(safe-area-inset-left, 0px)); }
  .sum-nav button { flex-direction: column; gap: 2px; font-size: 11.5px; padding: 6px 2px; min-height: 48px; }
  .sc-h h2 { font-size: 17px; }
  .sk-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .sk { padding: 10px 11px; }
  .sk-v b { font-size: 19px; }
  .sk-n { font-size: 13px; }
}
@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }
"""
rep("@media (max-width: 900px) { .disp-grid { grid-template-columns: 1fr; } }", "@media (max-width: 900px) { .disp-grid { grid-template-columns: 1fr; } }" + css7)
