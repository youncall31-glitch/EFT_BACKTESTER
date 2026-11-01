# ================= v8.1: default portfolios — 60/40 · balanced (QQQ·IEF·GLD) · retirement (QQQ·SPY·IEF·GLD) =================
import os as _os
rep("    { n: '나스닥 3배 + 헤지', r: [['TQQQ', 30], ['TLT', 40], ['GLD', 30]] },", "    { n: '나스닥 3배 + 헤지', r: [['TQQQ', 30], ['TLT', 40], ['GLD', 30]] },\n    { n: '균형 포트폴리오 (QQQ·IEF·GLD)', r: [['QQQ', 70], ['IEF', 22], ['GLD', 8]] },\n    { n: '노후 포트폴리오 (QQQ·SPY·IEF·GLD)', r: [['QQQ', 35], ['SPY', 35], ['IEF', 22], ['GLD', 8]] },")
if not _os.environ.get('V6DEF'):
    rep("""      { name: '영구 포트폴리오', rows: [['SPY', 25], ['TLT', 25], ['GLD', 25], ['BIL', 25]] },
      { name: '나스닥·장기채·금', rows: [['QQQ', 40], ['TLT', 30], ['GLD', 30]] }
    ].map(""", """      { name: '균형 포트폴리오', rows: [['QQQ', 70], ['IEF', 22], ['GLD', 8]] },
      { name: '노후 포트폴리오', rows: [['QQQ', 35], ['SPY', 35], ['IEF', 22], ['GLD', 8]] }
    ].map(""")
rep('<dt>v8.0 · 2026.10.29</dt>', """<dt>v8.1 · 2026.10.29</dt>
          <dd><ul>
            <li>처음 채워지는 예시 포트폴리오 변경: 60/40 (SPY 60 · IEF 40), 균형 포트폴리오 (QQQ 70 · IEF 22 · GLD 8), 노후 포트폴리오 (QQQ 35 · SPY 35 · IEF 22 · GLD 8). 이전 예시(영구 포트폴리오, 나스닥·장기채·금)는 ‘예시로 채우기’에 그대로 있어요.</li>
          </ul></dd>
          <dt>v8.0 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v8.0</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v8.1</span></h1>')
rep('<span class="upd-v">v8.0</span><span class="upd-d">2026.10.29</span><span class="upd-t">포트폴리오 → 결과 → 검증 → AI 추천, 네 단계로 정리했어요</span>',
    '<span class="upd-v">v8.1</span><span class="upd-d">2026.10.29</span><span class="upd-t">예시 포트폴리오를 60/40 · 균형 · 노후로 바꿨어요</span>')
