# ================= v7.9: defence rule (cut attack on a loss, put back on a signal) =================
rep('<dt>v7.8 · 2026.10.28</dt>', """<dt>v7.9 · 2026.10.28</dt>
          <dd><ul>
            <li>요약 ⑤ 방어 규칙 시험: 손실이 정한 만큼 나면 공격 종목을 줄여 수비 종목으로 옮기고, 추세·회복 신호에 되돌리는 규칙을 내 포트폴리오로 시험</li>
            <li>발동 조건 × 되돌리는 기준을 한 번에 비교하는 민감도 표(MDD·CAGR 변화)</li>
          </ul></dd>
          <dt>v7.8 · 2026.10.28</dt>""")
rep('<span class="upd-v">v7.8</span><span class="upd-d">2026.10.28</span><span class="upd-t">그래프 먼저 보고, 자세한 숫자는 눌러서 펼쳐요</span>',
    '<span class="upd-v">v7.9</span><span class="upd-d">2026.10.28</span><span class="upd-t">손실 때 수비로 옮겼다가 되돌리는 규칙을 내 포트폴리오로 시험해요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.8</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.9</span></h1>')

# summary nav + card
rep('    <button type="button" data-goto="sum-4"><i>4</i>AI 추천</button>\n  </nav>', '    <button type="button" data-goto="sum-4"><i>4</i>AI 추천</button>\n    <button type="button" data-goto="sum-5"><i>5</i>방어 규칙</button>\n  </nav>')
card = '''  <section class="panel scard" aria-labelledby="h-sum-5" id="sum-5">
    <div class="sc-h"><span class="sc-n">5</span><div><h2 id="h-sum-5">방어 규칙 — 떨어지면 줄이고, 돌아오면 되돌리기</h2><p class="sc-q">손실이 정한 만큼 나면 공격 종목을 줄여 수비 종목으로 옮기고, 신호가 오면 원래 비중으로 되돌렸다면</p></div></div>
    <div class="field"><span class="lbl">시험할 포트폴리오</span><div class="chips" id="g-port" role="group" aria-label="시험할 포트폴리오"></div></div>
    <div class="field"><span class="lbl">줄일 공격 종목 <span class="small muted">— 눌러서 바꾸기 (채권·금·현금은 처음엔 수비)</span></span><div class="chips" id="g-att" role="group" aria-label="공격 종목"></div></div>
    <div class="g-ctl">
      <div class="field"><label for="g-trig">언제 줄일까</label><select id="g-trig"></select></div>
      <div class="field"><label for="g-cut">얼마나 줄일까</label><select id="g-cut"></select></div>
      <div class="field"><label for="g-def">어디로 옮길까</label><select id="g-def"></select></div>
      <div class="field"><label for="g-back">언제 되돌릴까</label><select id="g-back"></select></div>
      <div class="field"><label for="g-stage">되돌리는 방식</label><select id="g-stage"></select></div>
    </div>
    <p class="note" id="g-msg" hidden></p>
    <div class="gk-grid" id="g-kpi"></div>
    <p class="small muted" id="g-line"></p>
    <div class="legend" id="lg-guard"></div>
    <div class="chart-box" id="c-guard"></div>
    <h3 class="sc-sub">다른 기준이었다면 <span class="small muted">— 칸을 누르면 그 규칙으로 바뀌어요</span></h3>
    <p class="help">초록이 진할수록 MDD가 많이 얕아졌어요. CAGR이 0.5%p 넘게 줄면 빨간 글씨예요. 이웃 칸들도 비슷하게 좋아야 우연이 아니에요.</p>
    <div class="tbl-wrap" id="g-grid"></div>
    <details class="more"><summary>발동·복귀 기록 보기</summary><div class="tbl-wrap" id="g-ev"></div></details>
    <details class="more"><summary>이 규칙 읽는 법과 주의할 점</summary>
      <ul class="small g-notes">
        <li>신호는 그 달 말 종가로 판단하고 그 달 말에 바로 사고팔아, 다음 달부터 반영돼요(미래 정보를 쓰지 않음). 수수료·세금·호가 차이는 빠져 있어서 자주 바꾸는 규칙일수록 실제 성과는 이보다 낮아요.</li>
        <li><b>언제 줄일까</b>: ‘고점 대비 −10%’는 포트폴리오 전체가 고점에서 그만큼 떨어진 달 말에 발동해요. 한 번 되돌린 뒤에는 새 고점을 찍거나 직전 저점 아래로 다시 내려갈 때만 다시 발동해서, 매달 줄였다 늘렸다를 반복하지 않아요. ‘추세 이탈’은 공격 종목만 모은 가격이 10개월 이동평균 아래로 내려가면 줄이고 위로 올라오면 되돌려요(되돌리는 기준 선택은 쓰지 않음).</li>
        <li><b>언제 되돌릴까</b>: 추세 회복(공격 종목이 10개월 이동평균 위) · 낙폭 절반 회복 · 저점 +10% · 12개월 뒤 · 고점 −5% 이내. 과거 데이터로는 앞의 두 가지가 대체로 나았고, 고점 근처까지 기다리면 반등 초반을 놓치기 쉬웠어요.</li>
        <li><b>민감도 표가 중요해요</b>: 가장 좋은 칸 하나만 고르면 그 자체가 과최적화예요. 주변 칸들도 고르게 MDD를 줄여 주는 규칙을 고르세요. 반대로 칸마다 결과가 들쭉날쭉하면 그 규칙은 몇 번의 우연한 시점에 기대고 있어요.</li>
        <li>방어 규칙은 급락이 길게 이어진 하락장(2000~2002, 2008)에서 크게 도움이 되고, 빠르게 V자로 반등한 하락(2020년 3월)에서는 낮은 가격에 팔고 높은 가격에 되사서 손해를 볼 수 있어요.</li>
      </ul>
    </details>
  </section>

'''
rep('  <nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-setup">← 입력</button><button class="btn" type="button" data-go="g-results">결과 자세히 →</button></nav>',
    card + '  <nav class="pane-nav tabs-only" aria-label="단계 이동"><button class="btn ghost" type="button" data-go="g-setup">← 입력</button><button class="btn" type="button" data-go="g-results">결과 자세히 →</button></nav>')
rep('<li><button type="button" class="map-link" data-goto="sum-4">④ AI 추천 포트폴리오</button></li></ul></div>',
    '<li><button type="button" class="map-link" data-goto="sum-4">④ AI 추천 포트폴리오</button></li><li><button type="button" class="map-link" data-goto="sum-5">⑤ 방어 규칙: 떨어지면 줄이고 되돌리기</button></li></ul></div>')
rep('<p>핵심 네 가지를 한눈에</p>', '<p>핵심 다섯 가지를 한눈에</p>')
# goal card on start guide
a = h.index('        <button class="goal" type="button" data-goto="sec-list">')
h = h[:a] + '        <button class="goal" type="button" data-goto="sum-5"><span class="g-cat">기본 · 2 요약</span><b>떨어질 때 줄이면 나았을까</b><span class="g-d">손실 때 수비로, 신호에 되돌리는 규칙 시험</span></button>\n' + h[a:]
# glossary
rep('      <div><dt>리밸런싱</dt>', '      <div><dt>방어 규칙</dt><dd>손실이 정한 만큼 나면 공격 종목(주식 등) 비중을 줄여 수비 종목(단기국채 등)으로 옮겼다가, 추세나 회복 신호가 오면 원래 비중으로 되돌리는 규칙이에요. 요약 ⑤에서 시험해요.</dd></div>\n      <div><dt>리밸런싱</dt>')

# engine
rep("  function addAsset(t, a) {\n    D.assets[t] = a;", (R / 'src/engine_guard.js').read_text() + "\n  function addAsset(t, a) {\n    D.assets[t] = a;")
rep("sharpeTest, bootstrap, trustScan, trustPick, pboCalc };", "sharpeTest, bootstrap, trustScan, trustPick, pboCalc, guardSim };")
# app
rep("  /* ---------- boot ---------- */", (R / 'src/app_guard.js').read_text() + "\n  /* ---------- boot ---------- */")
rep("renderTrustRes(); renderSum(); drawTrail(); drawTrustRes();\n  }", "renderTrustRes(); renderSum(); drawTrail(); drawTrustRes(); renderGuard();\n  }", 2)
h = h.replace("drawDisp(); drawSum(); drawTrail(); drawTrustRes(); }", "drawDisp(); drawSum(); drawTrail(); drawTrustRes(); drawGuard(); }").replace("drawDisp(); drawSum(); drawTrail(); drawTrustRes(); });", "drawDisp(); drawSum(); drawTrail(); drawTrustRes(); drawGuard(); });")

css9 = """
/* v7.9: defence rule */
.sum-nav { grid-template-columns: repeat(5, minmax(0, 1fr)) !important; }
.g-ctl { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin: 6px 0 12px; }
.g-ctl select { width: 100%; }
.gk-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 6px; }
.gk { border: 1px solid var(--line-2); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.gk-k { font-size: 12px; color: var(--muted); font-weight: 600; }
.gk-v { display: flex; align-items: baseline; gap: 5px; flex-wrap: wrap; font-family: var(--font-mono); }
.gk-v i { font-style: normal; color: var(--muted); font-size: 13px; }
.gk-v em { font-style: normal; color: var(--muted); font-size: 12px; }
.gk-v b { font-size: 18px; color: var(--ink); }
.gk-d { font-size: 12px; font-weight: 600; color: var(--muted); }
.gk-d.up { color: var(--pos); } .gk-d.dn { color: var(--neg); }
.ggrid { border-collapse: separate; border-spacing: 3px; width: 100%; min-width: 520px; }
.ggrid th { font-size: 12px; font-weight: 600; text-align: center; padding: 4px; color: var(--ink-2); border-bottom: 0; white-space: nowrap; }
.ggrid th.cur { color: var(--ink); text-decoration: underline; text-underline-offset: 3px; }
.ggrid tbody th { text-align: left; }
.ggrid td { cursor: pointer; text-align: center; padding: 6px 4px; border-radius: 7px; border: 2px solid transparent; border-bottom: 2px solid transparent;
  background: color-mix(in srgb, var(--pos) calc(var(--g, 0) * 32%), var(--panel)); }
.ggrid td span.neg { color: var(--neg); font-weight: 700; } .ggrid td span.pos { color: var(--pos); }
.ggrid td b { display: block; font-size: 12.5px; font-family: var(--font-mono); color: var(--ink); }
.ggrid td span { display: block; font-size: 11px; font-family: var(--font-mono); color: var(--ink-2); }
.ggrid td.sel { border-color: var(--ink); }
.ggrid td:hover { border-color: var(--ink-2); }
.gev th, .gev td { text-align: left; white-space: nowrap; font-size: 13px; }
.gev td:last-child { text-align: right; font-family: var(--font-mono); }
.g-notes li { margin-bottom: 6px; }
#g-port, #g-att { margin-top: 4px; }
@media (max-width: 640px) {
  .gk-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .g-ctl { grid-template-columns: 1fr 1fr; }
  .sum-nav button { font-size: 10.5px !important; }
}
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css9)
