# ================= v10.7: the conclusion in one picture at the top of 3 검증 =================
import re as _re
rep('<dt>v10.6 · 2026.11.03</dt>', """<dt>v10.7 · 2026.11.03</dt>
          <dd><ul><li>3 검증 맨 위에 ‘결론 한눈에’: 그림 한 장(가로 = 나쁠 때 MDD, 세로 = 현실 CAGR)에 과거 백테스트 → 지금 금리 기준, 채권 비중을 바꾸면, 하락 규칙(−10% → 10개월 평균선 회복)을 붙이면, 감당할 MDD 안의 추천(★)을 함께 보여주고 세 줄로 요약. 지금까지 확인한 근거는 펼쳐 보기.</li></ul></dd>
          <dt>v10.6 · 2026.11.03</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.6</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.7</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.6</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.7</span><span class="upd-d">2026.11.03</span><span class="upd-t">결론을 그림 한 장으로: 현실 CAGR · 나쁠 때 MDD · 추천 비중</span>', h, count=1)
a = h.index("  $('#sum-crit').addEventListener('change'")
h = h[:a] + (R / 'src/app_v107.js').read_text() + h[a:]
rep("  function drawReal() {\n    drawRlBt(); drawRlMix();\n", "  function drawReal() {\n    drawRlBt(); drawRlMix(); drawSu();\n")
rep("    renderRlMix(false);\n    drawReal();\n  }\n  function drawReal() {", "    renderRlMix(false); renderSu(false);\n    drawReal();\n  }\n  function drawReal() {")
rep('<nav class="sum-nav" aria-label="검증 바로가기"><button type="button" data-goto="sec-verdict">', '<nav class="sum-nav" aria-label="검증 바로가기"><button type="button" data-goto="sec-sumup"><i>★</i>결론</button><button type="button" data-goto="sec-verdict">')
rep('  <section class="panel scard" aria-labelledby="h-verdict" id="sec-verdict">', '''  <section class="panel scard su-card" aria-labelledby="h-sumup" id="sec-sumup">
    <div class="sc-h"><span class="sc-n">★</span><div><h2 id="h-sumup">결론 한눈에 — 은퇴 자금이라면</h2><p class="sc-q">지금 금리 기준으로 얼마나 벌고, 나쁠 때 얼마나 빠지나 · 감당할 낙폭 안에서 무엇이 가장 나은가</p></div></div>
    <div class="inbar">
      <div class="in-row"><span class="in-l">포트폴리오</span><div class="chips" id="su-p" role="group" aria-label="볼 포트폴리오"></div></div>
      <div class="in-row"><label class="in-l" for="su-cap">감당할 MDD (나쁠 때)</label><select id="su-cap"><option value="0.15">15%</option><option value="0.2">20%</option><option value="0.25">25%</option><option value="0.3">30%</option><option value="0.35">35%</option><option value="0.4">40%</option><option value="0.5">50%</option></select></div>
    </div>
    <div class="legend" id="lg-su"></div>
    <div class="chart-box" id="c-su"></div>
    <p class="help">왼쪽 위로 갈수록 좋아요(덜 빠지고 더 벌어요). 회색 점선 = 채권 비중만 0~100%로 바꾼 것, 초록 실선 = 같은 비중에 하락 규칙(고점 대비 −10%면 주식을 현금으로, 주식이 10개월 평균선 위로 돌아오면 복귀)을 붙인 것. 빨간 영역은 감당할 낙폭을 넘는 곳.</p>
    <div class="su-say" id="su-say"></div>
    <details class="more"><summary>왜 이렇게 보나요? — 지금까지 확인한 것</summary>
      <ul class="su-why">
        <li><b>과거 CAGR은 높게 나와요.</b> 1982~2020년에 미국 10년 금리가 15%대에서 1% 아래로 내려가 채권이 덤으로 벌었어요. 그래서 채권은 ‘지금 금리’, 주식 · 금은 ‘지금 금리 + 과거에 금리보다 더 번 몫’으로 다시 계산해요.</li>
        <li><b>MDD · 회복 기간은 과거와 비슷해요.</b> 과거의 실제 1년치 움직임을 섞어 앞으로 20년을 수백 번 만들어 ‘가운데’와 ‘나쁠 때(하위 10%)’를 봐요.</li>
        <li><b>나쁠 때 CAGR로 고르면 채권 쪽으로 쏠려요.</b> 그래서 ① 감당할 MDD(나쁠 때)를 정하고 ② 그 안에서 가운데 CAGR이 가장 높은 것을 골라요(★).</li>
        <li><b>예측은 범위예요.</b> 과거 각 시점에서 그때까지의 데이터만으로 예측해 보니 실제 10년 CAGR과 연 3%p 안팎(QQQ가 많으면 5%p) 어긋났어요. 지금과 비슷했던 시기(금리 높고 주가 비쌌던 1998 · 2007년)는 예측보다 CAGR이 1~2%p 낮았어요.</li>
        <li><b>쓰지 않은 방법:</b> 최근 데이터에 무게 주기, 주가 수준(CAPE), 최근 추세, 더 긴 조각 — 과거 검증에서 지금 방식보다 정확하지 않았어요.</li>
        <li><b>채권도 흔들려요.</b> 주식과 채권은 2000~2019년엔 반대로, 1980~90년대와 2020년 이후엔 같이 움직였어요(2022년 둘 다 하락). 금 · 단기채가 그 빈틈을 일부 메워요.</li>
        <li><b>하락 규칙</b>은 1985~2026년 10년 구간의 약 80~90%에서 MDD를 줄이고 CAGR은 거의 유지했어요. 채권이 50% 이상이면 효과가 작아요. 판 뒤 바로 반등하면(2020년) 손해를 볼 수 있고, 세금이 없는 연금 계좌에서 하는 게 좋아요. 2 결과 › 방어 규칙에서 직접 설정해 볼 수 있어요.</li>
      </ul>
    </details>
  </section>

  <section class="panel scard" aria-labelledby="h-verdict" id="sec-verdict">''')
rep("/* v10.6 */", """/* v10.7 */
.su-say { display: grid; gap: 8px; margin: 10px 0; }
.su-l { display: flex; gap: 10px; align-items: flex-start; margin: 0; font-size: 14px; line-height: 1.55; }
.su-n { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--ink); color: var(--panel); display: inline-grid; place-items: center; font-size: 12px; margin-top: 1px; }
.su-why { padding-left: 18px; display: grid; gap: 6px; font-size: 13.5px; }
/* v10.6 */""")
# one number everywhere: the 'about' CAGR is the simulation median (same paths in every section)
rep("c1.append(el('b', null, '약 ' + pct(R.gExp, 1))", "c1.append(el('b', null, '약 ' + pct(R.c50, 1))")
rep("AI 추천은 CAGR 약 ${pct(ai.R.gExp, 1)}", "AI 추천은 CAGR 약 ${pct(ai.R.c50, 1)}")
rep("은 ${pct(me.R.gExp, 1)} · ${mpct1(me.R.m50)}", "은 ${pct(me.R.c50, 1)} · ${mpct1(me.R.m50)}")
rep("· 현실 CAGR 약 ${pct(x.R.gExp, 1)}", "· 현실 CAGR 약 ${pct(x.R.c50, 1)}")
