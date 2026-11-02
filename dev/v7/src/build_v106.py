# ================= v10.6: bond-share sweep table/graph (median vs bad 10%, one source) + past 5-year windows instead of the single worst =================
import re as _re
rep('<dt>v10.5 · 2026.11.03</dt>', """<dt>v10.6 · 2026.11.03</dt>
          <dd><ul>
            <li>3 검증 › 현실적인 기대치에 ‘채권 비중을 바꾸면’: 채권 0~100%(10% 단위 + 지금 비중)마다 CAGR · MDD의 가운데와 나쁘면을 같은 출처(모의실험)로 나란히 — 감당할 MDD(나쁘면 기준) 안에서 가운데 CAGR이 가장 높은 비중을 추천으로 표시</li>
            <li>같은 표를 ‘과거 5년 구간’으로도: 가장 나빴던 한 번 대신, 과거를 5년씩 끊은 모든 구간의 가운데 · 나쁜 10%</li>
          </ul></dd>
          <dt>v10.5 · 2026.11.03</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.5</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.6</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.5</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.6</span><span class="upd-d">2026.11.03</span><span class="upd-t">채권 비중별 CAGR · MDD를 같은 기준(가운데 · 나쁘면)으로 비교해요</span>', h, count=1)
a = h.index("  $('#sum-crit').addEventListener('change'")
h = h[:a] + (R / 'src/app_v106.js').read_text() + h[a:]
rep("  function drawReal() {\n    drawRlBt();\n", "  function drawReal() {\n    drawRlBt(); drawRlMix();\n")
rep("    drawReal();\n  }\n  function drawReal() {", "    renderRlMix(false);\n    drawReal();\n  }\n  function drawReal() {")
rep('    <details class="more rl-bt" id="rl-bt">', '''    <h3 class="sc-sub" id="h-rl-mix">채권 비중을 바꾸면 — 같은 기준(가운데 · 나쁘면)으로 비교</h3>
    <div class="inbar">
      <div class="in-h"><span class="in-tag">입력</span><b>고르면 표와 그래프가 바뀌어요</b></div>
      <div class="in-row"><span class="in-l">포트폴리오</span><div class="chips" id="rl-mix-p" role="group" aria-label="볼 포트폴리오"></div></div>
      <div class="in-row"><span class="in-l">기준</span><div class="seg-toggle" id="rl-mix-v" role="group" aria-label="기준"><button type="button" data-v="f" aria-pressed="true">앞으로 20년 (현실 기대)</button><button type="button" data-v="p" aria-pressed="false">과거 5년 구간</button></div></div>
      <div class="in-row"><label class="in-l" for="rl-mix-cap">감당할 MDD (나쁘면)</label><select id="rl-mix-cap"><option value="0.15">15%</option><option value="0.2">20%</option><option value="0.25">25%</option><option value="0.3">30%</option><option value="0.35">35%</option><option value="0.4">40%</option><option value="0.5">50%</option></select></div>
    </div>
    <p class="rl-mix-say" id="rl-mix-say"></p>
    <div class="chart-box" id="c-rl-mix"></div>
    <div id="rl-mix-tbl"></div>
    <p class="small muted" id="rl-mix-note"></p>
    <p class="help">고르는 법: ① 감당할 MDD를 ‘나쁘면’ 기준으로 정하고 ② 그 안에서 ‘가운데 CAGR’이 가장 높은 비중(초록)을 봐요. ‘나쁘면 CAGR’은 채권이 적당히 섞이면 어디서나 비슷해서(대개 채권 금리 근처) 고르는 기준으로 쓰면 채권 쪽으로 쏠려요 — 운이 나빠도 꺼내 쓸 만큼은 되는지 확인하는 용도로만 보세요.</p>
    <details class="more rl-bt" id="rl-bt">''')
rep("/* v10.5 */", """/* v10.6 */
.rl-mix-say { font-weight: 600; }
.rlmix { width: 100%; table-layout: fixed; min-width: 0 !important; border-collapse: collapse; }
.rlmix th, .rlmix td { white-space: normal !important; font-size: 12.5px; padding: 5px 6px; text-align: right; font-family: var(--font-sans); }
.rlmix thead th { font-size: 11.5px; color: var(--muted); font-weight: 600; vertical-align: bottom; border-bottom: 1px solid var(--line); }
.rlmix tbody th { text-align: left; }
.rlmix tbody th small { display: inline-block; margin-left: 4px; font-size: 10.5px; padding: 0 5px; border-radius: 6px; background: var(--line); color: var(--ink); font-weight: 600; }
.rlmix tbody th small.pk { background: var(--pos); color: var(--panel); }
.rlmix tr.mx-pick td, .rlmix tr.mx-pick th { background: color-mix(in srgb, var(--pos) 12%, transparent); }
.rlmix tr.mx-cur th { font-weight: 800; }
@media (max-width: 520px) { .rlmix th, .rlmix td { font-size: 11.5px; padding: 5px 3px; } .rlmix thead th { font-size: 10.5px; } }
/* v10.5 */""")
