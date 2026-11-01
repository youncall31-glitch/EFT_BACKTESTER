# ================= v9.1: inputs on top in one colour, AI follows my tickers, trend-kept data switch with side-by-side =================
import re as _re
rep('<dt>v9.0 · 2026.10.29</dt>', """<dt>v9.1 · 2026.10.29</dt>
          <dd><ul>
            <li>내가 고르는 항목을 탭 맨 위 파란 ‘입력’ 상자에 모음(결과: 기간 · 데이터, AI 추천: 대상 종목 · MDD · 회복 한도). 1 포트폴리오와 적립·인출의 입력 칸도 같은 색으로 표시</li>
            <li>AI 비중 최적화 고침: 대상 종목이 처음에 정해진 뒤 포트폴리오를 바꿔도 따라오지 않던 문제, 종목을 바꿔도 다시 계산되지 않던 문제. 이제 내 포트폴리오 종목을 따라가고, 종목 · 기간 · 리밸런싱이 바뀌면 AI 추천 탭에서 저절로 다시 계산</li>
            <li>AI 대상 종목을 위에서 바로 빼기(×) · 더하기(+ 종목 추가)</li>
            <li>추세 보정 데이터: 결과 탭 맨 위에서 ‘실제 · 추세 보정 · 둘 다 비교’로 전환. 지금 어느 데이터인지와 보정된 종목을 항상 표시하고, ‘둘 다 비교’에서는 실제(실선)와 보정(점선)을 한 그래프와 표로 비교</li>
            <li>‘자세히’ 펼침을 눈에 띄는 버튼 모양으로</li>
          </ul></dd>
          <dt>v9.0 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.0</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.1</span></h1>')
rep('<span class="upd-v">v9.0</span><span class="upd-d">2026.10.29</span><span class="upd-t">검증에 필요한 것만 남기고, 기간 편차와 상관성을 더했어요</span>',
    '<span class="upd-v">v9.1</span><span class="upd-d">2026.10.29</span><span class="upd-t">입력은 맨 위 파란 상자에서, AI 추천은 내 종목을 따라 저절로 다시 계산해요</span>')

# ---------- 2 results: input bar on top ----------
q3 = '    <div class="chips sum-q" id="quick3" role="group" aria-label="기간 빠르게 바꾸기"></div>\n'
assert h.count(q3) == 1; h = h.replace(q3, '')
inbar = '''  <div class="inbar" id="in-res">
    <div class="in-h"><span class="in-tag">입력</span><b>여기서 바꾸면 이 탭의 그래프가 모두 바뀌어요</b></div>
    <div class="in-row"><span class="in-l">기간</span><div class="chips sum-q" id="quick3" role="group" aria-label="기간 빠르게 바꾸기"></div></div>
    <div class="in-row"><span class="in-l">데이터</span><div class="seg-toggle" id="dm3" role="group" aria-label="결과 데이터"><button type="button" data-v="act" aria-pressed="true">실제</button><button type="button" data-v="adj" aria-pressed="false">추세 보정</button><button type="button" data-v="both" aria-pressed="false">둘 다 비교</button></div></div>
    <p class="dm3-st" id="dm3-st"></p>
  </div>
'''
a = h.index('  <div class="ctx" id="ctx-sum"')
h = h[:a] + inbar + h[a:]
tcmp = '''  <section class="panel scard" aria-labelledby="h-tcmp" id="sec-tcmp" hidden>
    <div class="sc-h"><span class="sc-n">⇄</span><div><h2 id="h-tcmp">실제 vs 추세 보정</h2><p class="sc-q">최근 급등한 종목이 결과를 부풀리지 않았나 — 실선 = 실제 데이터, 점선 = 추세 보정 데이터</p></div></div>
    <p class="say1" id="tcmp-say"></p>
    <div class="legend" id="lg-tcmp"></div>
    <div class="chart-box" id="c-tcmp"></div>
    <div class="tbl-wrap"><table id="t-tcmp" class="aikpi"></table></div>
    <p class="small muted" id="tcmp-rule"></p>
  </section>

'''
a = h.index('  <section class="panel" aria-labelledby="h-charts" id="sec-charts">')
h = h[:a] + tcmp + h[a:]
rep('<div class="field"><span class="lbl">포트폴리오</span><div class="chips" id="rc-port" role="group" aria-label="시험할 포트폴리오"></div></div>',
    '<div class="inbar sm"><div class="in-row"><span class="in-tag">입력</span><span class="in-l">포트폴리오</span><div class="chips" id="rc-port" role="group" aria-label="시험할 포트폴리오"></div></div></div>')
a = h.index('    <div class="field"><span class="lbl">시험할 포트폴리오</span><div class="chips" id="g-port"')
b = h.index('    </div>\n', h.index('<div class="g-ctl">', a)) + len('    </div>\n')
h = h[:a] + '    <div class="inbar"><div class="in-h"><span class="in-tag">입력</span><b>규칙을 정하면 아래 그래프와 표가 바뀌어요</b></div>\n' + h[a:b] + '    </div>\n' + h[b:]

# ---------- 3 verification: graph toggles labelled ----------
rep('<div class="sp-ctl"><div class="seg-toggle" id="sp-m"', '<div class="sp-ctl"><span class="tog-l">그래프</span><div class="seg-toggle" id="sp-m"')
rep('    <div class="seg-toggle" id="cr-p" role="group" aria-label="기간">', '    <div class="sp-ctl"><span class="tog-l">기간</span><div class="seg-toggle" id="cr-p" role="group" aria-label="기간">')
rep('<button type="button" data-p="e2" aria-pressed="false">2021~</button></div>', '<button type="button" data-p="e2" aria-pressed="false">2021~</button></div></div>')
rep('    <div class="chips" id="cr-ref" role="group" aria-label="기준 종목"></div>', '    <div class="sp-ctl"><span class="tog-l">기준</span><div class="chips" id="cr-ref" role="group" aria-label="기준 종목"></div></div>')

# ---------- 4 AI: inputs on top ----------
rep('''    <div class="ai-ctl">
      <div class="field ai-tk"><span class="lbl">대상 종목</span><div class="chips" id="sum-tk"></div><button class="btn ghost sm" type="button" data-goto="fold-assets">종목 바꾸기</button></div>''',
    '''    <div class="ai-ctl inbar">
      <div class="in-h"><span class="in-tag">입력</span><b>바꾸면 저절로 다시 계산해요</b></div>
      <div class="field ai-tk"><span class="lbl">대상 종목 <span class="small muted">— 처음엔 내 포트폴리오 종목</span></span><div class="tkx-wrap" id="sum-tk"></div></div>''')
rep('<h2 id="h-opt">비중 최적화</h2>', '<h2 id="h-opt">더 자세한 계산 설정</h2>')
h = _re.sub(r'(<h2 id="h-opt">더 자세한 계산 설정</h2><p>)[^<]*(?:<span[^>]*>[^<]*</span>[^<]*)?', r'\g<1>비중 단위(5% · 10% · 2.5%), 한 종목 최대 비중, 전체 종목 목록에서 고르기. 바꾸면 AI 추천을 저절로 다시 계산해요.<span id="o-end" class="mono" hidden>–</span>', h, count=1)
rep('''<span class="fold-d" id="o-crit-sum">''', '''<span class="fold-d">비중 단위 · 자산별 최대 비중</span><span class="fold-d" id="o-crit-sum" hidden>''')

# ---------- input panels elsewhere ----------
for sid in ['sec-style', 'sec-ports', 'sec-set', 'sec-fl-set']:
    h = _re.sub(rf'<section class="panel([^"]*)"([^>]*) id="{sid}">', rf'<section class="panel inpanel\g<1>"\g<2> id="{sid}">', h, count=1)

# ---------- script ----------
rep("  /* ---------- boot ---------- */", (R / 'src/app_v91.js').read_text() + "\n  /* ---------- boot ---------- */")
assert h.count("renderGuard(); renderSpread(); renderCorr();") == 2
h = h.replace("renderGuard(); renderSpread(); renderCorr();", "renderGuard(); renderSpread(); renderCorr(); renderTcmp(); syncOptSel();")
h = h.replace("drawAICheck(); drawSpread(); drawCorr(); }", "drawAICheck(); drawSpread(); drawCorr(); drawTcmp(); }").replace("drawAICheck(); drawSpread(); drawCorr(); });", "drawAICheck(); drawSpread(); drawCorr(); drawTcmp(); });")
rep("    if (state.last) { computeTrend(); renderTrend(); }\n    markOptStale();\n  }", "    if (state.last) { computeTrend(); renderTrend(); }\n    markOptStale(); aiAuto();\n  }")
rep("    markNav();\n    maybeRunDeferredOpt();\n    if (state.layout !== 'tabs' || g === 'g-flow') markRetireStale();", "    markNav();\n    maybeRunDeferredOpt(); aiAuto();\n    if (state.layout !== 'tabs' || g === 'g-flow') markRetireStale();")
rep("    for (const t of [...state.optSel]) chips.appendChild(etfBtn(t, 'chip fix-chip'));", "    renderAITk(chips);")
rep("    ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum); $(id).addEventListener('change', renderCritSum); });",
    "    ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum); $(id).addEventListener('change', renderCritSum); });\n  ['#o-step', '#o-max'].forEach(id => $(id).addEventListener('change', () => { markOptStale(); aiAuto(); }));") if "    ['#o-step'," in h else None
if "  ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum);" in h:
    rep("  ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum); $(id).addEventListener('change', renderCritSum); });",
        "  ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum); $(id).addEventListener('change', renderCritSum); });\n  ['#o-step', '#o-max'].forEach(id => $(id).addEventListener('change', () => setTimeout(() => { markOptStale(); aiAuto(); }, 0)));")

css91 = """
/* v9.1: inputs in one colour, details as buttons */
.inbar { background: color-mix(in srgb, var(--focus) 7%, var(--panel)); border: 1.5px solid color-mix(in srgb, var(--focus) 45%, transparent); border-radius: 14px; padding: 12px 14px; display: grid; gap: 10px; min-width: 0; }
.inbar.sm { padding: 8px 12px; margin: 4px 0 8px; }
.in-h { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; } .in-h b { font-size: 13.5px; }
.in-tag { background: var(--focus); color: #fff; font-size: 11.5px; font-weight: 800; border-radius: 999px; padding: 2px 9px; flex: none; }
.in-row { display: flex; align-items: center; gap: 8px 10px; flex-wrap: wrap; min-width: 0; }
.in-l { font-weight: 700; font-size: 13px; min-width: 44px; }
.inbar .chips { margin: 0; }
.inbar .field { margin: 0; }
.ai-ctl.inbar { display: grid; gap: 10px; }
.inpanel { border: 1.5px solid color-mix(in srgb, var(--focus) 40%, transparent) !important; box-shadow: inset 4px 0 0 var(--focus); }
.dm3-st { margin: 0; font-size: 12.5px; color: var(--muted); }
.dm3-st.on { color: var(--warn); font-weight: 700; } .dm3-st.same { color: var(--ink-2); font-weight: 600; }
.tog-l { font-size: 12px; font-weight: 700; color: var(--muted); margin-right: 6px; }
.sp-ctl { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 6px 0; }
.tkx-wrap { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 4px; }
.tkx { display: inline-flex; align-items: center; border: 1px solid var(--line-2); border-radius: 999px; background: var(--panel); overflow: hidden; }
.tkx-n { font: inherit; font-family: var(--font-mono); font-weight: 700; font-size: 13px; padding: 6px 4px 6px 12px; background: none; border: 0; color: var(--ink); cursor: pointer; }
.tkx-x { font: inherit; font-size: 16px; line-height: 1; padding: 6px 10px 6px 6px; background: none; border: 0; color: var(--muted); cursor: pointer; min-height: 34px; }
.tkx-x:hover { color: var(--neg); }
.tkx-add { font: inherit; font-size: 13px; border: 1.5px dashed color-mix(in srgb, var(--focus) 60%, transparent); border-radius: 999px; padding: 6px 10px; background: var(--panel); color: var(--focus); font-weight: 700; max-width: 100%; }
#sec-opt .opt-grid .field:nth-child(n+3), #sec-opt .run-row, #sec-opt .opt-prog { display: none !important; }
details.more { border-top: 0 !important; padding-top: 0 !important; margin-top: 6px; }
details.more > summary { display: flex !important; width: 100%; box-sizing: border-box; justify-content: flex-start; min-height: 44px; padding: 10px 14px; border: 1.5px solid color-mix(in srgb, var(--focus) 35%, var(--line-2)); border-radius: 10px; background: color-mix(in srgb, var(--focus) 5%, var(--panel)); color: var(--focus); font-weight: 700; font-size: 13.5px; }
details.more > summary::after { content: "펼치기"; margin-left: auto; font-size: 12px; font-weight: 700; background: var(--focus); color: #fff; border-radius: 999px; padding: 2px 10px; }
details.more[open] > summary::after { content: "접기"; background: var(--muted); }
details.evid > summary::after { content: "펼치기"; margin-left: auto; font-size: 12px; font-weight: 700; background: var(--focus); color: #fff; border-radius: 999px; padding: 3px 12px; flex: none; }
details.evid[open] > summary::after { content: "접기"; background: var(--muted); }
details.evid { border: 1.5px solid color-mix(in srgb, var(--focus) 35%, var(--line-2)); background: color-mix(in srgb, var(--focus) 4%, transparent); }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css91)

# the optimizer only needs what the AI pick uses now: skip the oldest-period horizons and the trend-kept rerun (their panels are gone)
rep("    if (!state.rerun) {\n      try {\n        const resO = await BT.optimizeHorizons(", "    if (!state.rerun && false) {\n      try {\n        const resO = await BT.optimizeHorizons(")
rep("    await runOptAdj(true);\n    if (state.rerun) { state.rerun = false; runOpt(); return; }\n", "")
rep("+ (stale ? ' · 설정이 바뀌어 다시 계산이 필요해요' : '')", "+ (stale ? ' · 설정이 바뀌어 곧 다시 계산해요' : '')")
