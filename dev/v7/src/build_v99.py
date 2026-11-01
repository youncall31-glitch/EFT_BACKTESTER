# ================= v9.9: run the rule at every fall that reaches its trigger, and show each one =================
import re as _re
rep('<dt>v9.8 · 2026.10.30</dt>', """<dt>v9.9 · 2026.10.30</dt>
          <dd><ul><li>하락과 회복: 규칙이 발동하는 모든 하락(작게 끝난 것 포함)마다 그대로 두기보다 얼마나 앞섰는지 · 뒤졌는지를 점 그래프와 표(작게 · 중간 · 크게 끝난 하락별)로 보여줘요. 표의 ‘볼 값’ 기본도 ‘모든 하락’으로.</li></ul></dd>
          <dt>v9.8 · 2026.10.30</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.8</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.9</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.8</span><span class="upd-d">2026\.10\.30</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.9</span><span class="upd-d">2026.10.30</span><span class="upd-t">회복 규칙을 작은 하락까지 모든 하락에 써 본 결과를 보여줘요</span>', h, count=1)
rep('<button type="button" data-m="rec" aria-pressed="true">큰 하락 회복</button>', '<button type="button" data-m="evt" aria-pressed="true">모든 하락</button><button type="button" data-m="rec" aria-pressed="false">큰 하락 회복</button>')
a = h.index('    <h3 class="sc-sub">모든 경우 한눈에')
h = h[:a] + '''    <h3 class="sc-sub">고른 규칙을 모든 하락에 썼다면 <span class="small muted">— 작게 끝날지 크게 갈지 모르는 채로</span></h3>
    <div class="rc-ev" id="rc-ev-say"></div>
    <div class="chart-box" id="c-rc-ev"></div>
    <p class="help">점 하나가 규칙이 발동한 하락 하나예요. 가로는 그대로 뒀을 때 결국 떨어진 폭, 세로는 고점을 되찾았을 때 규칙이 그대로 두기보다 앞선(+) · 뒤진(−) 비율이에요. 점선은 −10% · −20%. 흐린 점은 아직 회복 전인 하락이에요.</p>
    <div class="tbl-wrap" id="rc-ev-tbl"></div>

''' + h[a:]
rep('<h3 class="sc-sub">모든 경우 한눈에 <span class="small muted">— 분석 기간 내내 그 규칙을 썼을 때 CAGR × MDD</span></h3>', '<h3 class="sc-sub">모든 규칙 한눈에 <span class="small muted">— 분석 기간 내내 그 규칙을 썼을 때 CAGR × MDD</span></h3>')
rep("<span class=\"rc-tag\">가장 빨리 회복</span>", "<span class=\"rc-tag\">큰 하락에서 가장 빨리 회복</span>") if '<span class="rc-tag">가장 빨리 회복</span>' in h else None
h = h.replace("el('span', 'rc-tag', '가장 빨리 회복')", "el('span', 'rc-tag', '큰 하락에서 가장 빨리 회복')")
css99 = """
/* v9.9 */
.rc-ev { margin: 4px 0 6px; }
.rc-ev p { margin: 4px 0; font-size: 13.5px; line-height: 1.55; }
.rc-ev-h b { font-size: 14.5px; }
#rc-ev-tbl .rctbl th small { color: var(--muted); font-weight: 400; }
#rc-ev-tbl .rctbl th, #rc-ev-tbl .rctbl td { white-space: nowrap; font-size: 12.5px; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css99)
