# ================= v10.5: back-check of the realistic method — predicted (only data up to then) vs what happened in the next 10 years =================
import re as _re
rep('<dt>v10.4 · 2026.11.02</dt>', """<dt>v10.5 · 2026.11.03</dt>
          <dd><ul><li>3 검증 › 현실적인 기대치에 ‘이 방법은 과거에 얼마나 맞았나’: 1980년대 후반부터 분기마다 그 시점까지의 데이터만으로 현실 기대치(CAGR · MDD · 회복 기간)를 계산하고, 실제 그 뒤 10년과 비교한 산점도 · 오차 표. 과거 백테스트 숫자를 그대로 믿었을 때와도 비교해요.</li></ul></dd>
          <dt>v10.4 · 2026.11.02</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.4</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.5</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.4</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.5</span><span class="upd-d">2026.11.03</span><span class="upd-t">현실 기대치가 과거에 얼마나 맞았는지 예측 vs 실제로 봐요</span>', h, count=1)
rep("  function rlSim(tickers, weights, s, e, adj, A, Hy) {", "  function rlSim(tickers, weights, s, e, adj, A, Hy, PATHS) {")
rep("    const P = 700, rnd = rlRng(", "    const P = PATHS || 700, rnd = rlRng(")
rep("  function drawReal() {\n", "  function drawReal() {\n    drawRlBt();\n")
a = h.index("  $('#sum-crit').addEventListener('change'")
h = h[:a] + (R / 'src/app_v105.js').read_text() + h[a:]
rep('    <p class="small muted" id="rl-note"></p>\n', '''    <p class="small muted" id="rl-note"></p>
    <details class="more rl-bt" id="rl-bt"><summary>이 방법은 과거에 얼마나 맞았나? — 예측 vs 실제 (미래를 안 보고)</summary>
      <p class="help">과거의 분기마다 <b>그 시점까지의 데이터만으로</b> ‘현실적으로’ 숫자를 계산했어요(그때의 10년 금리, 그때까지 주식 · 금이 금리보다 더 번 몫, 그때까지의 출렁임). 그리고 실제로 그 뒤 10년에 일어난 일과 비교해요. 점이 점선(예측 = 실제)에 가까울수록, 초록 띠 안에 많을수록 잘 맞은 거예요.</p>
      <div class="inbar">
        <div class="in-row"><span class="in-l">볼 값</span><div class="seg-toggle" id="rl-bt-m" role="group" aria-label="볼 값"><button type="button" data-m="c" aria-pressed="true">CAGR</button><button type="button" data-m="m" aria-pressed="false">MDD</button><button type="button" data-m="u" aria-pressed="false">회복 기간</button></div></div>
        <div class="in-row"><span class="in-l">포트폴리오</span><div class="chips" id="rl-bt-p" role="group" aria-label="볼 포트폴리오"></div></div>
        <label class="toggle" for="rl-bt-h"><input id="rl-bt-h" type="checkbox" checked><span>과거 백테스트 숫자를 그대로 믿었다면(회색 빈 원)도 같이 보기</span></label>
      </div>
      <p class="small muted" id="rl-bt-st" aria-live="polite"></p>
      <p class="rl-bt-say" id="rl-bt-say"></p>
      <div class="chart-box" id="c-rl-bt"></div>
      <div id="rl-bt-tbl"></div>
      <p class="help"><b>평균 오차</b> = 예측과 실제가 평균 얼마나 달랐나(작을수록 좋아요). <b>치우침</b> = 실제가 예측보다 평균 얼마나 높았나(+)·낮았나(−). <b>범위 적중</b> = 실제가 예측 범위 안에 든 비율(CAGR은 하위~상위 10%, MDD · 회복은 나쁜 10%보다 나음) — 기대치와 비슷하면 범위가 믿을 만해요.</p>
      <p class="help">주의: 10년 구간이 서로 겹쳐서 점이 많아 보여도, 겹치지 않는 10년은 3~4번뿐이에요. 1990년대 · 2010년대처럼 주식이 특히 좋았던 시기가 섞여 있어 치우침이 한쪽으로 나올 수 있어요.</p>
    </details>
''')
rep("/* v10.4 */", """/* v10.5 */
.rl-bt > summary { font-weight: 700; }
.rl-bt-say { font-weight: 600; }
/* v10.4 */""")
