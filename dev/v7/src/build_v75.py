# ================= v7.5: how far to trust a backtest (PSR/DSR, PBO, bootstrap, consistency, weight sensitivity) =================
rep('<dt>v7.4 · 2026.10.27</dt>', """<dt>v7.5 · 2026.10.28</dt>
          <dd><ul>
            <li>결과 › 미래 신뢰도: 내 포트폴리오의 과거 결과가 운이나 특정 시기 덕분일 가능성을 네 가지(통계적 유의성 PSR, 시기 일관성, 비중 민감도, 부트스트랩)로 따져 0~100점. 20년 뒤 연 수익률 범위, 나쁜 경우 MDD, 믿으려면 필요한 기간</li>
            <li>최적화 › 신뢰도 반영 최적화: 분석 기간을 시기별로 나눠 모든 시기에 고르게 좋고, 비중을 조금 바꿔도 비슷한 조합을 추천. 수만 개 조합을 시험한 것을 감안한 유의성(DSR)과, 고르는 방식마다의 과최적화 확률(PBO)</li>
            <li>도움말 › 미래 신뢰도 지표: 각 지표의 뜻·계산·기준과 한계</li>
          </ul></dd>
          <dt>v7.4 · 2026.10.27</dt>""")
rep('<span class="upd-v">v7.4</span><span class="upd-d">2026.10.27</span><span class="upd-t">투자 방식을 맨 앞에서 고르고, 전체 기간 고정 비중의 최적 조합을 더했어요</span>',
    '<span class="upd-v">v7.5</span><span class="upd-d">2026.10.28</span><span class="upd-t">과거 결과를 얼마나 믿을 수 있는지 보여주는 미래 신뢰도 지표를 더했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.4</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.5</span></h1>')

how = """      <details class="vd-crit">
        <summary>지표 읽는 법</summary>
        <ul>
          <li><b>미래 신뢰도</b>: 아래 네 점수(0~100)의 평균이에요. 90 이상 높음, 70~90 보통, 70 미만 낮음. 이 앱이 만든 요약 점수라 학계 표준은 아니고, 수익을 약속하지 않아요.</li>
          <li><b>통계적 유의성 (PSR)</b>: 월 수익률의 평균·흔들림·쏠림(왜도·첨도)과 기간 길이로 볼 때 ‘진짜 샤프 비율이 0보다 클 확률’이에요. 기간이 짧거나 수익이 들쭉날쭉하면 낮아져요. 점수는 50% 이하 0점 ~ 95% 이상 100점.</li>
          <li><b>시기 일관성</b>: 1개월 간격으로 잡은 모든 10년 구간 중 미국 단기국채(현금)보다 연 2%p 이상 더 번 구간의 비율이에요. 한 시기에만 잘 된 포트폴리오는 낮아요.</li>
          <li><b>비중 민감도</b>: 비중을 5%p씩 옮긴 이웃 조합들의 CAGR 중앙값이 지금보다 얼마나 낮은지예요. 0.2%p 이하면 100점, 2%p 이상 떨어지면 0점. 높을수록 ‘딱 이 비중’에 기대지 않아요.</li>
          <li><b>부트스트랩</b>: 과거 월 수익률을 평균 12개월씩 묶어 순서를 섞어 미래 1,000가지를 만든 뒤, 20년(분석 기간이 더 짧으면 그 길이) 동안 현금보다 연 2%p 이상 더 번 비율이에요. 범위는 그중 하위 5%~상위 5% 연 수익률이에요.</li>
          <li><b>믿으려면 필요한 기간</b>: 샤프 비율이 0보다 크다고 95% 확신하려면 필요한 기록 길이(최소 기록 기간)예요. 실제 기간이 이보다 짧으면 빨간색이에요.</li>
        </ul>
      </details>
"""
res_panel = f"""  <section class="panel" aria-labelledby="h-trust" id="sec-trust-res">
    <div class="panel-head"><h2 id="h-trust">미래 신뢰도 — 이 결과를 얼마나 믿을 수 있나</h2><p class="help">미래 수익을 보장하는 지표는 없어요. 대신 과거 결과가 운이나 특정 시기 덕분일 가능성을 네 가지로 따져 0~100점으로 모았어요. 점수가 높을수록 결과가 운에 덜 기대고 여러 시기에 고르게 나왔다는 뜻이에요.</p></div>
    <div class="tbl-wrap"><table id="t-trust" class="trusttbl"></table></div>
    <p class="small muted" id="trust-note"></p>
{how}    <div class="row"><button class="btn ghost sm" type="button" data-goto="m-12">자세한 설명 (도움말)</button><button class="btn ghost sm" type="button" data-goto="sec-trust-opt">신뢰도를 반영한 최적 비중 찾기 (고급)</button></div>
  </section>

"""
rep('  <p class="adv-lead">아래 ‘고급’ 항목은 투자 지표에 익숙한 분을 위한 자세한 숫자예요. 필요할 때 눌러서 펼쳐요.</p>', res_panel + '  <p class="adv-lead">아래 ‘고급’ 항목은 투자 지표에 익숙한 분을 위한 자세한 숫자예요. 필요할 때 눌러서 펼쳐요.</p>')

opt_panel = """  <section class="panel" aria-labelledby="h-trust-opt" id="sec-trust-opt">
    <div class="panel-head"><h2 id="h-trust-opt">신뢰도 반영 최적화 — 운 좋은 조합을 덜 고르는 추천</h2><p class="help">보통의 최적화는 과거에 가장 좋았던 조합을 골라, 수많은 조합 중 우연히 잘 맞은 조합을 고르기 쉬워요(과최적화). 여기서는 분석 기간을 여러 시기로 나눠 모든 시기에 고르게 좋았고, 비중을 한 칸씩 바꾼 이웃 조합들도 비슷하게 좋은 조합을 골라요. 대상 종목·리밸런싱·전체 기간은 위와 같아요.</p></div>
    <p class="small muted" id="o-trust-status" aria-live="polite"></p>
    <div class="picks" id="o-trust"></div>
    <div id="trust-more" hidden>
      <div class="sub-sec">
        <div class="sub-head"><h3>후보별 미래 신뢰도 비교</h3></div>
        <p class="help">같은 기준(전체 분석 기간, 분배금 재투자)으로 추천 조합과 내 포트폴리오를 비교해요. 최적화로 찾은 조합의 유의성은 시험한 조합 수만큼 운의 몫을 빼고 계산해서(DSR) 내 포트폴리오(PSR)보다 엄격해요.</p>
        <div class="tbl-wrap"><table id="t-trust-cmp" class="trustcmp keeplife"></table></div>
      </div>
      <div class="sub-sec">
        <div class="sub-head"><h3>고르는 방식의 과최적화 확률 (PBO)</h3></div>
        <p class="help">조합 하나가 아니라 ‘고르는 방식’을 점검해요. 과거 절반으로 고른 조합이 나머지 절반에서도 좋았는지를 여러 번 나눠 봐요. 과최적화 확률이 50%를 넘으면 그 방식으로 고른 조합은 처음 보는 시기에 평균보다 못했던 적이 더 많았다는 뜻이에요.</p>
        <div class="tbl-wrap"><table id="t-pbo" class="pbotbl keeplife"></table></div>
        <p class="small muted" id="pbo-note"></p>
      </div>
    </div>
  </section>

"""
rep('  <section class="panel" aria-labelledby="h-hz" id="sec-hz">', opt_panel + '  <section class="panel" aria-labelledby="h-hz" id="sec-hz">')

# navigation
rep('<button type="button" class="jchip" data-goto="sec-mdd">MDD 구분</button>', '<button type="button" class="jchip" data-goto="sec-mdd">MDD 구분</button><button type="button" class="jchip" data-goto="sec-trust-res">미래 신뢰도</button>')
rep('<button type="button" class="jchip" data-goto="sec-fix">전체 기간 고정</button>', '<button type="button" class="jchip" data-goto="sec-fix">전체 기간 고정</button><button type="button" class="jchip" data-goto="sec-trust-opt">신뢰도 반영</button>')
rep("<li><button type=\"button\" class=\"map-link\" data-goto=\"sec-mdd\">MDD 구분</button></li>", "<li><button type=\"button\" class=\"map-link\" data-goto=\"sec-mdd\">MDD 구분</button></li><li><button type=\"button\" class=\"map-link\" data-goto=\"sec-trust-res\">미래 신뢰도: 이 결과를 얼마나 믿을 수 있나</button></li>")
rep('<li><button type="button" class="map-link adv" data-goto="sec-hz">기간별 최적 비중</button></li>', '<li><button type="button" class="map-link adv" data-goto="sec-trust-opt">신뢰도 반영 최적화</button></li><li><button type="button" class="map-link adv" data-goto="sec-hz">기간별 최적 비중</button></li>')
rep('<button class="goal adv" type="button" data-goto="sec-period">', '<button class="goal" type="button" data-goto="sec-trust-res"><span class="g-cat">기본 · 2 결과</span><b>이 결과를 미래에도 믿을 수 있을까</b><span class="g-d">운·특정 시기 덕분일 가능성을 0~100점으로</span></button>\n        <button class="goal adv" type="button" data-goto="sec-period">')

# help: glossary + method
rep('      <div><dt>추세 보정</dt>', '''      <div><dt>미래 신뢰도</dt><dd>과거 결과가 운이나 한 시기 덕분일 가능성을 네 가지로 따져 모은 이 앱의 0~100점이에요. 미래 수익을 약속하지는 않아요.</dd></div>
      <div><dt>과최적화</dt><dd>수많은 조합 중 과거에 우연히 잘 맞은 조합을 골라, 처음 보는 시기에는 기대보다 못한 현상이에요.</dd></div>
      <div><dt>추세 보정</dt>''')
faq = """      <details class="faq-i" data-fold="m-12" id="m-12">
        <summary>미래 신뢰도 지표 — 과거 결과를 얼마나 믿을 수 있나</summary>
        <ul>
          <li><b>먼저 결론</b>: 백테스트 결과가 미래에도 그대로 나온다는 것을 증명하는 지표는 없어요. 시장의 구조(금리 수준, 기업 이익, 세계 경제의 중심)가 바뀌면 과거 통계는 맞지 않을 수 있어요. 아래 지표들은 ‘과거 결과 중 운과 우연한 고르기의 몫이 얼마나 되는지’를 재서, 덜 믿어야 할 결과를 걸러내는 데 써요.</li>
          <li><b>확률적 샤프 비율(PSR)</b> — Bailey & López de Prado(2012). 샤프 비율도 표본에서 구한 추정값이라 오차가 있어요. 기간 길이, 왜도(한쪽으로 쏠림), 첨도(큰 손실이 가끔 나는 정도)를 반영해 진짜 샤프 비율이 0보다 클 확률을 구해요. PSR = Φ(SR·√(T−1) ÷ √(1 − 왜도·SR + (첨도−1)/4·SR²)), SR은 월 단위.</li>
          <li><b>수축 샤프 비율(DSR)</b> — Bailey & López de Prado(2014). 조합을 N개 시험해 가장 좋은 것을 고르면, 아무 실력이 없어도 샤프 비율이 높게 나와요. 시험한 조합들의 샤프 비율 분산으로 ‘운만으로 기대되는 최고 샤프’ SR₀ = √V·((1−γ)Φ⁻¹(1−1/N) + γΦ⁻¹(1−1/(Ne)))를 구해, 진짜 샤프가 그보다 클 확률을 PSR과 같은 식으로 계산해요(γ = 0.5772). 최적화 결과에 이 값을 써요. 비슷한 조합끼리는 서로 닮아 실제로 독립적인 시험 수는 N보다 적으므로, 여기 DSR은 실제보다 낮게(엄격하게) 나와요.</li>
          <li><b>최소 기록 기간(MinTRL)</b>: 샤프 비율이 0보다 크다고 95% 확신하는 데 필요한 개월 수 = 1 + (1 − 왜도·SR + (첨도−1)/4·SR²)·(1.645 ÷ SR)². 결과 › 미래 신뢰도의 ‘믿으려면 필요한 기간’이에요.</li>
          <li><b>과최적화 확률(PBO)</b> — Bailey, Borwein, López de Prado & Zhu(2017)의 조합 대칭 교차검증(CSCV). 분석 기간을 같은 길이의 시기 B개(최대 10개, 시기마다 2년 이상)로 나누고, 그중 절반을 고르는 모든 방법마다 그 절반에서 가장 좋은 조합을 고른 뒤 나머지 절반에서 모든 조합 중 몇 등이었는지 봐요. 중간보다 못했던 비율이 PBO예요. 0%에 가까울수록 그 고르는 방식이 처음 보는 시기에도 통했다는 뜻이고, 50%면 고른 의미가 없는 수준이에요.</li>
          <li><b>부트스트랩</b> — 정상 블록 부트스트랩(Politis & Romano 1994). 과거 월 수익률을 평균 12개월씩 이어 붙여 순서만 섞은 미래 1,000가지를 만들고, 각각의 20년 연 수익률·MDD를 구해 범위를 봐요. 과거에 실제로 있었던 달들만 쓰므로 과거에 없던 종류의 위기는 담지 못해요.</li>
          <li><b>시기 일관성</b>: 모든 10년 구간(1개월 간격) 중 미국 단기국채보다 연 2%p 이상 더 번 비율(위험을 진 대가로 의미 있는 웃돈을 받았는지). <b>비중 민감도</b>: 비중을 5%p 옮긴 이웃 조합 CAGR 중앙값과의 차이(0.2%p 이하 100점 ~ 2%p 이상 0점, 직선). 둘 다 이 앱이 정한 눈금이에요.</li>
          <li><b>미래 신뢰도 점수</b>: 유의성 점수(PSR, 최적화 결과는 DSR이 50% 이하면 0점, 95% 이상이면 100점, 그 사이는 직선), 시기 일관성×100, 비중 민감도 점수, 부트스트랩에서 현금보다 연 2%p 이상 나을 확률×100의 평균이에요(종목이 하나면 비중 민감도 제외, 10년보다 짧으면 시기 일관성 제외). 이 앱이 만든 요약이고 가중치는 같게 두었어요.</li>
          <li><b>신뢰도 반영 최적화</b>: 분석 기간 전체로 계산한 모든 조합을 시기 B개로 나눠 시기마다 샤프 비율을 구하고, 시기 일관성 점수 = 시기별 샤프 평균 − 0.5 × 시기 간 표준편차를 매겨요. 점수 상위 300개 조합마다 비중을 한 칸(비중 단위)씩 옮긴 모든 이웃 조합의 점수까지 평균해, 그 평균이 가장 높은 조합을 추천해요. 혼자 튀는 조합보다 주변이 고르게 좋은 ‘평평한 고원’을 고르는 방식이에요. 기준(MDD 범위, 회복 기간)은 위 최적화 기준을 그대로 써요.</li>
          <li>모든 신뢰도 지표는 분배금 재투자(총수익) 기준이고, 통화·물가 반영·추세 보정 설정을 따라요. 거래 비용·세금은 빠져 있어요.</li>
        </ul>
      </details>
"""
rep('      <details class="faq-i" data-fold="m-8">', faq + '      <details class="faq-i" data-fold="m-8">')

# engine + app
rep("  function addAsset(t, a) {\n    D.assets[t] = a;", (R / 'src/engine_trust.js').read_text() + "  function addAsset(t, a) {\n    D.assets[t] = a;")
rep("keepPlan, keepPick };", "keepPlan, keepPick, sharpeTest, bootstrap, trustScan, trustPick, pboCalc };")
rep("  /* ---------- boot ---------- */", (R / 'src/app_trust.js').read_text() + "\n  /* ---------- boot ---------- */")
rep("    if (!state.rerun) await runKeep();", "    if (!state.rerun) await runKeep();\n    if (!state.rerun) await runTrust();")
rep("renderEraCompare(); keepPickAll(); renderKeep(); }", "renderEraCompare(); keepPickAll(); renderKeep(); if (state.opt && state.opt.trust) { state.opt.trust.rows = null; trustPickAll(); } renderTrustOpt(); }")
rep("renderFrontTabs(); drawFrontier(); renderKeep(); }", "renderFrontTabs(); drawFrontier(); renderKeep(); renderTrustOpt(); }")
rep("markOptStale(); markAdjStale();\n    renderCtx(); renderFlow();\n  }", "markOptStale(); markAdjStale();\n    renderCtx(); renderFlow(); renderTrustRes();\n  }")
rep("    $('#cov').innerHTML = ''; $('#sum-note').textContent = '';\n    renderCtx(); renderFlow();\n  }", "    $('#cov').innerHTML = ''; $('#sum-note').textContent = '';\n    renderCtx(); renderFlow(); renderTrustRes();\n  }")

css5 = """
/* v7.5: trust scores */
.tscore { display: inline-grid; place-items: center; min-width: 38px; height: 26px; padding: 0 8px; border-radius: 999px; font-family: var(--font-mono); font-weight: 700; font-size: 13.5px; }
.tscore.hi { background: color-mix(in srgb, var(--pos) 16%, transparent); color: var(--pos); }
.tscore.mid { background: color-mix(in srgb, var(--warn) 16%, transparent); color: var(--warn); }
.tscore.lo { background: color-mix(in srgb, var(--neg) 14%, transparent); color: var(--neg); }
td.best .tscore { box-shadow: 0 0 0 2px currentColor; }
.trusttbl td .sub, .trustcmp td .sub, .pbotbl td .sub, .trustcmp th .sub, .pbotbl th .sub { display: block; font-size: 11px; color: var(--muted); font-family: var(--font-sans); font-weight: 400; white-space: normal; }
.trusttbl td, .trustcmp td { vertical-align: top; }
.trustcmp tr.mine th, .trustcmp tr.mine td { background: color-mix(in srgb, var(--panel-2) 60%, transparent); }
#sec-trust-res .vd-crit { margin-top: 4px; }
#sec-trust-res > .row { margin-top: 10px; }
"""
rep("@media (max-width: 900px) { .styles { grid-template-columns: 1fr 1fr; } }", "@media (max-width: 900px) { .styles { grid-template-columns: 1fr 1fr; } }" + css5)
