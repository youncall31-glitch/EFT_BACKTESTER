# ================= v7.8: graph first, numbers on demand =================
rep('<dt>v7.7 · 2026.10.28</dt>', """<dt>v7.8 · 2026.10.28</dt>
          <dd><ul>
            <li>그래프 먼저, 숫자는 눌러서: 요약 탭과 결과 탭의 표·설명을 ‘숫자로 보기’로 접고 그래프를 앞에 둠</li>
            <li>요약 ② 예측 가능성 막대, ③ 운 점검표(✓·!), 결과 › 최근 10~30년 성과를 점 그래프로</li>
          </ul></dd>
          <dt>v7.7 · 2026.10.28</dt>""")
rep('<span class="upd-v">v7.7</span><span class="upd-d">2026.10.28</span><span class="upd-t">요약 탭에서 CAGR·MDD, 정합성, 과최적화, AI 추천을 한눈에 봐요</span>',
    '<span class="upd-v">v7.8</span><span class="upd-d">2026.10.28</span><span class="upd-t">그래프 먼저 보고, 자세한 숫자는 눌러서 펼쳐요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.7</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.8</span></h1>')

# results › latest 10–30 years: chart, table folded
rep('''    <div class="tbl-wrap trail-wide"><table id="t-trail" class="trail"></table></div>
    <div class="trail-narrow">
      <div class="chips trail-pick" id="trail-pick" role="group" aria-label="볼 기간"></div>
      <p class="trail-when" id="trail-when"></p>
      <div class="tbl-wrap"><table id="t-trail-m" class="trail-m"></table></div>
    </div>''', '''    <div class="legend" id="lg-trail"></div>
    <div class="chart-box" id="c-trail"></div>
    <details class="more"><summary>숫자 표 보기 (회복 기간 포함)</summary>
    <div class="tbl-wrap trail-wide"><table id="t-trail" class="trail"></table></div>
    <div class="trail-narrow">
      <div class="chips trail-pick" id="trail-pick" role="group" aria-label="볼 기간"></div>
      <p class="trail-when" id="trail-when"></p>
      <div class="tbl-wrap"><table id="t-trail-m" class="trail-m"></table></div>
    </div>''')
rep('''    <p class="small muted">MDD 아래 작은 글씨는 그 구간의 최장 회복 기간이고, +는 구간 끝까지 아직 회복하지 못했다는 뜻이에요.</p>
  </section>''', '''    <p class="small muted">MDD 아래 작은 글씨는 그 구간의 최장 회복 기간이고, +는 구간 끝까지 아직 회복하지 못했다는 뜻이에요.</p>
    </details>
  </section>''')
# MDD 구분 folded
rep('''    <div class="tbl-wrap"><table id="t-mdd" class="mddtbl"></table></div>
    <p class="mdd-note" id="mdd-note"></p>''', '''    <details class="more"><summary>MDD 종류별 표 보기</summary>
    <div class="tbl-wrap"><table id="t-mdd" class="mddtbl"></table></div>
    <p class="mdd-note" id="mdd-note"></p>
    </details>''')
# dispersion table folded
rep('''    <div class="tbl-wrap"><table id="t-disp" class="disptbl"></table></div>''', '''    <details class="more"><summary>숫자 표 보기 (3·5·10년 범위·손실 난 구간)</summary>
    <div class="tbl-wrap"><table id="t-disp" class="disptbl"></table></div>
    </details>''')
# trust: charts first, table folded
a = h.index('    <div class="tbl-wrap"><table id="t-trust" class="trusttbl"></table></div>')
b = h.index('</details>', a) + len('</details>')
h = h[:a] + '''    <h3 class="sc-sub">예측 가능성 <span class="small muted">— 언제 시작해도 결과가 비슷했나 (0~100)</span></h3>
    <div class="chart-box" id="c-trust-score"></div>
    <h3 class="sc-sub">운 점검 <span class="small muted">— ✓ 통과 · ! 주의</span></h3>
    <div id="trust-luck" class="lgrid-wrap"></div>
    <details class="more"><summary>숫자 표와 지표 읽는 법 보기</summary>
''' + h[a:b] + '''
    </details>''' + h[b:]

# script
rep("  /* ---------- boot ---------- */", (R / 'src/app_simple.js').read_text() + "\n  /* ---------- boot ---------- */")
rep("    renderCtx(); renderFlow(); renderTrustRes(); renderSum();\n  }", "    renderCtx(); renderFlow(); renderTrustRes(); renderSum(); drawTrail(); drawTrustRes();\n  }", 2)
h = h.replace("drawDisp(); drawSum(); }", "drawDisp(); drawSum(); drawTrail(); drawTrustRes(); }").replace("drawDisp(); drawSum(); });", "drawDisp(); drawSum(); drawTrail(); drawTrustRes(); });")

css8 = """
/* v7.8: numbers on demand */
details.more { border-top: 1px dashed var(--line-2); padding-top: 6px; min-width: 0; }
details.more.in { border-top: 0; padding-top: 0; }
details.more > summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 34px; font-size: 13px; font-weight: 600; color: var(--focus); }
details.more > summary::-webkit-details-marker { display: none; }
details.more > summary::before { content: ""; width: 7px; height: 7px; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: rotate(-45deg); transition: transform 0.15s; }
details.more[open] > summary::before { transform: rotate(45deg); }
details.more[open] > summary { margin-bottom: 8px; }
details.more > :not(summary) { min-width: 0; }
.lgrid-wrap { overflow-x: auto; }
.lgrid { width: auto; min-width: min(100%, 460px); }
.lgrid th, .lgrid td { text-align: center; padding: 6px 8px; font-size: 12.5px; }
.lgrid tbody th { text-align: left; font-family: var(--font-sans); font-weight: 600; white-space: nowrap; color: var(--ink); }
.lgrid td { font-family: var(--font-sans); font-weight: 700; font-size: 14px; cursor: help; border-radius: 6px; }
.lgrid td.ok { color: var(--pos); background: color-mix(in srgb, var(--pos) 10%, transparent); }
.lgrid td.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 14%, transparent); }
.lgrid td.na { color: var(--muted); }
.lgrid { border-collapse: separate; border-spacing: 3px; }
.lgrid th, .lgrid td { border-bottom: 0; }
#c-trail svg, #c-sum-per svg { margin-bottom: 8px; }
@media (max-width: 640px) { .lgrid th, .lgrid td { padding: 6px 4px; font-size: 11.5px; } .lgrid tbody th { max-width: 110px; overflow: hidden; text-overflow: ellipsis; } }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css8)
