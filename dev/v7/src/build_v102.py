# ================= v10.2: is the past average flattered? — eras, start date, the bond rate tailwind, and a realistic range from today =================
import re as _re
rep('<dt>v10.1 · 2026.11.02</dt>', """<dt>v10.2 · 2026.11.02</dt>
          <dd><ul>
            <li>3 검증에 ‘과거 평균의 착시 · 앞으로의 현실적인 범위’: 시기별 CAGR · MDD · 회복(금리 변화와 함께), 가장 좋았던 시기를 뺀 CAGR, 시작한 해에 따른 CAGR</li>
            <li>채권 수익을 이자 몫(그 시기 평균 10년 금리)과 금리 변화 몫으로 나눠 보기, 살 때 금리와 그 뒤 10년 채권 수익 점 그래프 — 미국 10년 국채 금리(연준 H.15 월평균, 1953.04~2026.09) 추가</li>
            <li>지금 조건 기대 CAGR(채권 = 지금 10년 금리, 주식 · 금 기대치는 직접 입력)과, 과거 출렁임은 그대로 두고 평균만 그 가정으로 옮긴 10 · 20 · 30년 모의실험(CAGR · MDD · 최장 회복 범위, 손실 확률)</li>
          </ul></dd>
          <dt>v10.1 · 2026.11.02</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.1</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.2</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.1</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.2</span><span class="upd-d">2026.11.02</span><span class="upd-t">과거 평균이 부풀려졌는지, 지금 조건이면 현실적으로 얼마인지 봐요</span>', h, count=1)
us = (R / 'data/us10y.json').read_text()
a = h.index('<script type="application/json" id="kr-data">')
h = h[:a] + '<script type="application/json" id="us10y-data">' + us + '</script>\n' + h[a:]
sec = '''  <section class="panel scard" aria-labelledby="h-real" id="sec-real">
    <div class="sc-h"><span class="sc-n">⚖</span><div><h2 id="h-real">과거 평균의 착시 · 앞으로의 현실적인 범위</h2><p class="sc-q">과거 CAGR이 특별히 좋았던 시기 덕분은 아닌가, 지금 조건이면 현실적으로 얼마쯤인가</p></div></div>
    <div class="inbar">
      <div class="in-h"><span class="in-tag">입력</span><b>바꾸면 아래가 다시 계산돼요</b></div>
      <div class="in-row"><span class="in-l">포트폴리오</span><div class="chips" id="rl-port" role="group" aria-label="볼 포트폴리오"></div></div>
      <div class="rl-in">
        <div class="field"><label for="rl-bond">채권 기대 (%)</label><input id="rl-bond" type="number" step="0.1" inputmode="decimal"><p class="help">기본값 = 지금 미국 10년 국채 금리</p></div>
        <div class="field"><label for="rl-eq">주식 기대 (%)</label><input id="rl-eq" type="number" step="0.5" inputmode="decimal"><p class="help">연 수익률 가정 · 기본 7%</p></div>
        <div class="field"><label for="rl-gold">금 · 원자재 기대 (%)</label><input id="rl-gold" type="number" step="0.5" inputmode="decimal"><p class="help">기본 3% (물가 수준)</p></div>
        <div class="field"><label for="rl-h">모의실험 기간</label><select id="rl-h"><option value="10">10년</option><option value="20">20년</option><option value="30">30년</option></select><p class="help"><button class="btn ghost sm" type="button" id="rl-reset">기본값으로</button></p></div>
      </div>
      <p class="small muted" id="rl-bond-note"></p>
    </div>
    <div class="rc-say rl-say" id="rl-say"></div>
    <h3 class="sc-sub">과거 CAGR vs 지금 조건 — 앞으로의 범위</h3>
    <div class="chart-box" id="c-rl-exp"></div>
    <details class="more"><summary>숫자 표 (CAGR · MDD · 최장 회복 · 손실 확률)</summary><div class="tbl-wrap" id="rl-exp-tbl"></div><p class="small muted" id="rl-cls"></p>
      <p class="small muted">기대 CAGR = 종목별 가정 수익률을 비중대로 섞고, 과거 변동성 · 상관으로 분산 효과를 반영한 값이에요. 모의실험은 과거의 월별 움직임(12개월 묶음)을 섞어 700번 만든 가상의 미래인데, 종목마다 평균만 위 가정으로 옮겼어요. 매년 처음 비중으로 리밸런싱해요.</p></details>
    <h3 class="sc-sub">시기별로 보면</h3>
    <p class="help" id="rl-era-cap"></p>
    <div class="chart-box" id="c-rl-era"></div>
    <p class="help">시기마다 길이가 달라서 MDD · 회복 기간은 긴 시기일수록 커지기 쉬워요. CAGR이 시기마다 얼마나 다른지를 먼저 보세요.</p>
    <h3 class="sc-sub">언제 시작했느냐에 따라 <span class="small muted">— 그해 1월에 시작해 지금까지 들고 있었다면</span></h3>
    <div class="legend" id="lg-rl-start"></div>
    <div class="chart-box" id="c-rl-start"></div>
    <p class="help">선이 왼쪽에서만 높고 오른쪽으로 갈수록 낮아지면, 과거 CAGR이 유리한 시작 시점 덕분이라는 뜻이에요.</p>
    <div id="rl-bond-wrap">
      <h3 class="sc-sub" id="rl-bond-h">채권 부분의 수익은 어디서 왔나</h3>
      <div class="chart-box" id="c-rl-bond"></div>
      <p class="help">채권 수익 ≈ 받은 이자(대략 그 시기의 평균 금리) + 금리가 내려 생긴 값 상승(금리가 오르면 값 하락). 1982~2020년의 금리 하락 몫은 금리가 이미 낮아진 지금은 되풀이되기 어려워요. 10년 국채 금리로 본 근사예요.</p>
      <details class="more"><summary>살 때 금리 → 그 뒤 10년 채권 수익</summary>
        <div class="chart-box" id="c-rl-sc"></div>
        <p class="help">점 하나가 시작한 달 하나예요. 점들이 점선(같은 값) 근처에 모일수록 ‘살 때 금리 ≈ 그 뒤 10년 채권 수익’이에요. 세로선은 지금 금리.</p>
      </details>
    </div>
  </section>

'''
a = h.index('  <section class="panel scard" aria-labelledby="h-corr" id="sec-corr">')
h = h[:a] + sec + h[a:]
h = h.replace('<button type="button" data-goto="sec-corr"><i>2</i>상관성</button>', '<button type="button" data-goto="sec-real"><i>⚖</i>착시·현실</button><button type="button" data-goto="sec-corr"><i>2</i>상관성</button>')
h = h.replace(L_('sec-spread', '정합성: 2·5·10·20·30년 편차') if False else "data-goto=\"sec-spread\">정합성: 2·5·10·20·30년 편차</button></li>", "data-goto=\"sec-spread\">정합성: 2·5·10·20·30년 편차</button></li><li><button type=\"button\" class=\"map-link\" data-goto=\"sec-real\">과거 평균의 착시 · 앞으로의 현실적인 범위</button></li>")
rep("  /* ---------- boot ---------- */", (R / 'src/app_v102.js').read_text() + "\n  /* ---------- boot ---------- */")
assert h.count("renderTcmp(); syncOptSel(); renderExtCmp();") == 2
h = h.replace("renderTcmp(); syncOptSel(); renderExtCmp();", "renderTcmp(); syncOptSel(); renderExtCmp(); renderReal();")
h = h.replace("drawSpread(); drawCorr(); drawTcmp(); }", "drawSpread(); drawCorr(); drawTcmp(); drawReal(); }").replace("drawSpread(); drawCorr(); drawTcmp(); });", "drawSpread(); drawCorr(); drawTcmp(); drawReal(); });")
css102 = """
/* v10.2 */
.rl-in { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.rl-in input, .rl-in select { width: 100%; }
.rl-say .rl-h { display: flex; align-items: center; gap: 6px; } .rl-say .rl-h b { font-size: 15px; }
.rl-say .rl-big { font-weight: 700; font-size: 14.5px; }
.rl-say .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.rltbl th, .rltbl td { white-space: nowrap; font-size: 12.5px; }
.rltbl tbody th { text-align: left; font-family: var(--font-sans); }
.rltbl .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
@media (max-width: 640px) { .rl-in { grid-template-columns: 1fr 1fr; } }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css102)
