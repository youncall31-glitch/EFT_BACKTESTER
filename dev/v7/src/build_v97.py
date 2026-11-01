# ================= v9.7: trend-kept vs actual you can tell apart =================
import re as _re
rep('<dt>v9.6 · 2026.10.30</dt>', """<dt>v9.7 · 2026.10.30</dt>
          <dd><ul><li>‘둘 다 비교’를 다시 그림: 포트폴리오마다 실제(채운 막대)와 추세 보정(빗금 막대)의 CAGR · MDD를 나란히, 보정으로 달라진 평가액(%)을 시간에 따라 선으로, 표에는 CAGR 차이 칸. 겹쳐 그린 성장 그래프는 차이가 작으면 구분이 안 돼서 뺐어요.</li></ul></dd>
          <dt>v9.6 · 2026.10.30</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.6</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.7</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.6</span><span class="upd-d">2026\.10\.30</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.7</span><span class="upd-d">2026.10.30</span><span class="upd-t">실제와 추세 보정을 막대 · 차이 그래프 · 표로 구분해 보여줘요</span>', h, count=1)
rep('''    <div class="legend" id="lg-tcmp"></div>
    <div class="chart-box" id="c-tcmp"></div>''', '''    <div class="legend" id="lg-tcmp"></div>
    <h3 class="sc-sub">CAGR · MDD — 실제 vs 추세 보정</h3>
    <div class="chart-box" id="c-tcmp-bar"></div>
    <h3 class="sc-sub">보정으로 달라진 평가액 <span class="small muted">— 보정 ÷ 실제 − 1</span></h3>
    <p class="help">0%선 위면 보정 후가 더 많고, 아래면 더 적어요. 노란 구간이 급등을 낮춘 최근 구간이에요. 선이 0%에 붙어 있으면 보정 영향이 거의 없다는 뜻이에요.</p>
    <div class="chart-box" id="c-tcmp-gap"></div>
    <div hidden><div id="c-tcmp"></div></div>''')
rep('<p class="sc-q">최근 급등한 종목이 결과를 부풀리지 않았나 — 실선 = 실제 데이터, 점선 = 추세 보정 데이터</p>', '<p class="sc-q">최근 급등한 종목이 결과를 부풀리지 않았나 — 채운 막대 = 실제, 빗금 막대 = 추세 보정</p>')
css97 = """
/* v9.7 */
#lg-tcmp .tl { display: inline-flex; align-items: center; gap: 6px; margin-right: 14px; font-size: 12.5px; }
#lg-tcmp .tl i { width: 22px; height: 12px; border-radius: 2px; display: inline-block; }
#lg-tcmp .tl-a { background: var(--ink-2); }
#lg-tcmp .tl-b { background: repeating-linear-gradient(45deg, var(--ink-2) 0 3px, color-mix(in srgb, var(--ink-2) 25%, transparent) 3px 6px); }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css97)
