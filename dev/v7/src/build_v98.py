# ================= v9.8: every recovery rule over the whole period — CAGR, MDD, longest recovery =================
import re as _re
rep('<dt>v9.7 · 2026.10.30</dt>', """<dt>v9.8 · 2026.10.30</dt>
          <dd><ul><li>하락과 회복: 큰 하락 때의 회복 기간뿐 아니라, 모든 방법 × 시작 시점을 분석 기간 내내 썼을 때의 전체 CAGR · MDD · 최장 회복을 보여줘요(표의 ‘볼 값’ 전환, CAGR × MDD 점 그래프, 숫자 표).</li></ul></dd>
          <dt>v9.7 · 2026.10.30</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.7</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.8</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.7</span><span class="upd-d">2026\.10\.30</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.8</span><span class="upd-d">2026.10.30</span><span class="upd-t">회복 전략마다 전체 기간 CAGR · MDD · 최장 회복을 봐요</span>', h, count=1)
a = h.index('    <h3 class="sc-sub">방법 × 시기 — 고점을 되찾기까지 평균 기간</h3>'); b = h.index('    <div class="tbl-wrap" id="rc-grid"></div>\n') + len('    <div class="tbl-wrap" id="rc-grid"></div>\n')
h = h[:a] + '''    <div class="sp-ctl"><span class="tog-l">볼 값</span><div class="seg-toggle" id="rc-m" role="group" aria-label="표에 볼 값"><button type="button" data-m="rec" aria-pressed="true">큰 하락 회복</button><button type="button" data-m="cagr" aria-pressed="false">CAGR</button><button type="button" data-m="mdd" aria-pressed="false">MDD</button><button type="button" data-m="uw" aria-pressed="false">최장 회복</button></div></div>
    <h3 class="sc-sub" id="rc-gh">방법 × 시기</h3>
    <p class="help">가로는 ‘고점에서 몇 % 떨어졌을 때 시작했나’예요. 초록 = 그대로 두기보다 나음, 빨강 = 나쁨, ★ = 그 값이 가장 좋은 칸. 칸을 누르면 아래 그래프가 바뀌어요.</p>
    <p class="help" id="rc-help"></p>
    <div class="tbl-wrap" id="rc-grid"></div>
    <h3 class="sc-sub">모든 경우 한눈에 <span class="small muted">— 분석 기간 내내 그 규칙을 썼을 때 CAGR × MDD</span></h3>
    <p class="help">점 하나가 ‘방법 × 시작 시점’ 하나예요. 검은 마름모(그대로 두기)보다 왼쪽 위에 있으면 더 벌고 덜 떨어졌어요. 점을 누르면 그 방법으로 바뀌어요.</p>
    <div class="legend" id="lg-rc-sc"></div>
    <div class="chart-box" id="c-rc-sc"></div>
    <details class="more"><summary>모든 경우 숫자 표 (CAGR · MDD · 최장 회복 · 큰 하락 회복)</summary><div class="tbl-wrap" id="rc-all"></div></details>
''' + h[b:]
css98 = """
/* v9.8 */
#lg-rc-sc .tl { display: inline-flex; align-items: center; gap: 6px; margin-right: 14px; font-size: 12.5px; }
#lg-rc-sc .tl i { width: 10px; height: 10px; display: inline-block; border-radius: 50%; }
#lg-rc-sc .tl i.dia { border-radius: 1px; transform: rotate(45deg); }
.rctbl tr.hold th, .rctbl tr.hold td { font-weight: 700; background: var(--panel-2); }
#rc-m { flex-wrap: wrap; }
#rc-all .rctbl th, #rc-all .rctbl td { white-space: nowrap; font-size: 12px; padding: 6px 8px; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css98)
