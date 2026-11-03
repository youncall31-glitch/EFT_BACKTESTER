# ================= v10.8: every tab opens with a short summary; the rest folded. Crisis-response rules folded at the end of 2 결과 =================
import re as _re
rep('<dt>v10.7 · 2026.11.03</dt>', """<dt>v10.8 · 2026.11.03</dt>
          <dd><ul><li>탭마다 간단 요약을 맨 처음에, 자세한 내용은 그 아래 접힌 칸을 눌러 펼쳐 보기 — 2 결과(성과 한눈에 → 차트 · 연도별), 3 검증(결론 한눈에 → 판정 · 현실 기대치 · 기간 편차 · 상관성), 4 AI 추천(추천 비중 → 결과와 검증), 적립·세금(계획 · 결과 → 얼마나 모일까)</li><li>‘하락과 회복’ · ‘방어 규칙 직접 설정’은 참고용으로 2 결과 맨 끝 한 칸에 접어 두었어요(핵심 결론은 3 검증 › 결론 한눈에의 ‘하락 규칙’).</li></ul></dd>
          <dt>v10.7 · 2026.11.03</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.7</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.8</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.7</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.8</span><span class="upd-d">2026.11.03</span><span class="upd-t">탭마다 요약이 먼저, 자세한 내용은 펼쳐서</span>', h, count=1)

def sec_span(id_):
    a = h.index(f'id="{id_}">')
    a = h.rindex('<section', 0, a)
    b = h.index('</section>', a) + len('</section>')
    return a, b
def fold(id_, key, title, desc):
    global h
    a, b = sec_span(id_)
    body = h[a:b]
    h = h[:a] + f'<details class="panel fold xfold" data-fold="{key}" id="xf-{id_}"><summary><span class="fold-h"><span class="fold-t">{title}</span></span><span class="fold-d">{desc}</span></summary><div class="fold-body">\n  ' + body + '\n  </div></details>' + h[b:]

# ---- 2 결과: summary (성과 한눈에) first; charts folded; crisis rules → one folded box at the very end
fold('sec-charts', 'x-charts', '자산 성장 · 낙폭 차트', '돈이 어떻게 불었고, 고점에서 얼마나 떨어졌나 — 기간 전체 그래프')
a, b = sec_span('sec-recov')
g0 = h.index('<details class="evid" id="guard-fold">', b)
g1 = h.index('\n  </details>\n', g0) + len('\n  </details>\n')
assert h[b:g0].strip() == '', repr(h[b:g0][:80])
crisis = h[a:g1]
h = h[:a] + h[g1:]
an = h.index('id="sec-annual"'); an1 = h.index('\n  </details>\n', an) + len('\n  </details>\n')
h = h[:an1] + '''
  <details class="panel fold xfold" data-fold="x-crisis" id="xf-crisis"><summary><span class="fold-h"><span class="fold-t">위기 때 대응 규칙 (참고용)</span></span><span class="fold-d">떨어질 때 전략별 비교 · 방어 규칙 직접 시험 — 핵심 결론은 3 검증 › 결론 한눈에의 ‘하락 규칙’에 반영했어요</span></summary><div class="fold-body">
  ''' + crisis + '''
  </div></details>
''' + h[an1:]
rep('<nav class="sum-nav" aria-label="결과 바로가기"><button type="button" data-goto="sum-1"><i>1</i>성과</button><button type="button" data-goto="h-charts"><i>↗</i>차트</button><button type="button" data-goto="sec-recov"><i>2</i>하락·회복</button><button type="button" data-goto="sec-annual"><i>▦</i>연도별</button></nav>',
    '<nav class="sum-nav" aria-label="결과 바로가기"><button type="button" data-goto="sum-1"><i>1</i>요약</button><button type="button" data-goto="xf-sec-charts"><i>↗</i>차트</button><button type="button" data-goto="sec-annual"><i>▦</i>연도별</button><button type="button" data-goto="xf-crisis"><i>+</i>위기 대응</button></nav>')
rep('<h2 id="h-sum-1">성과 한눈에 — CAGR · MDD · 회복 기간</h2>', '<h2 id="h-sum-1">요약 — 과거에 얼마나 벌고, 얼마나 떨어지고, 얼마나 걸려 회복했나</h2>')

# ---- 3 검증: 결론 한눈에 first (summary lines on top), everything else folded
a, b = sec_span('sec-sumup'); body = h[a:b]
say = '    <div class="su-say" id="su-say"></div>\n'
assert body.count(say) == 1
body = body.replace(say, '')
hd_end = body.index('</div></div>\n', body.index('class="sc-h"')) + len('</div></div>\n')
body = body[:hd_end] + say + body[hd_end:]
body = _re.sub(r'<p class="help">왼쪽 위로 갈수록 좋아요[^<]*</p>', '<p class="help">왼쪽 위로 갈수록 좋아요(덜 빠지고 더 벌어요). 회색 점선 = 채권 비중만 바꾼 것, 초록 실선 = 여기에 하락 규칙을 붙인 것, 빨간 영역 = 감당할 낙폭 밖.</p>', body)
body = body.replace('<h2 id="h-sumup">결론 한눈에 — 은퇴 자금이라면</h2>', '<h2 id="h-sumup">요약 — 은퇴 자금이라면</h2>')
h = h[:a] + body + h[b:]
fold('sec-verdict', 'x-verdict', '판정 카드 — 정합성 · 신빙성', '이 백테스트 결과를 어느 정도 믿을 수 있나')
fold('sec-real', 'x-real', '현실적인 기대치 — 표 · 채권 비중별 비교 · 과거에 얼마나 맞았나', '과거 숫자 vs 지금 금리 기준 숫자, 어떻게 계산했는지')
fold('sec-spread', 'x-spread', '기간 편차 — 언제 시작했느냐에 따라', '2 · 5 · 10 · 20 · 30년을 들고 있었다면 결과가 얼마나 벌어졌나')
fold('sec-corr', 'x-corr', '상관성 — 종목끼리 같이 움직이나', '분산이 실제로 되고 있는지')
rep('<nav class="sum-nav" aria-label="검증 바로가기"><button type="button" data-goto="sec-sumup"><i>★</i>결론</button><button type="button" data-goto="sec-verdict"><i>✓</i>한눈에</button><button type="button" data-goto="sec-real"><i>⚖</i>현실 기대치</button><button type="button" data-goto="sec-spread"><i>1</i>기간 편차</button><button type="button" data-goto="sec-corr"><i>2</i>상관성</button><button type="button" data-goto="evid"><i>+</i>근거</button></nav>',
    '<nav class="sum-nav" aria-label="검증 바로가기"><button type="button" data-goto="sec-sumup"><i>★</i>요약</button><button type="button" data-goto="xf-sec-verdict"><i>✓</i>판정</button><button type="button" data-goto="xf-sec-real"><i>⚖</i>현실 기대치</button><button type="button" data-goto="xf-sec-spread"><i>1</i>기간 편차</button><button type="button" data-goto="xf-sec-corr"><i>2</i>상관성</button><button type="button" data-goto="evid"><i>+</i>근거</button></nav>')

# ---- 4 AI 추천: the pick first; results & checks folded
fold('sec-ai-check', 'x-aichk', '추천 비중의 결과와 검증', '같은 기간 백테스트 · 현실 기대치 · 고를 때 안 쓴 기간에서도 통했나')
rep('<button type="button" data-goto="sec-ai-check"><i>2</i>결과·검증</button>', '<button type="button" data-goto="xf-sec-ai-check"><i>2</i>결과·검증</button>')
rep('<h2 id="h-sum-4">AI가 추천하는 비중 — 내 종목 · 내 조건으로</h2>', '<h2 id="h-sum-4">요약 — AI가 추천하는 비중 (내 종목 · 내 조건)</h2>')

# ---- 적립·세금: plan + result first; the range of outcomes folded
fold('sec-acc', 'x-acc', '적립하면 얼마나 모일까 — 운이 나빴을 때 · 좋았을 때', '과거의 모든 시작 시점에서 같은 계획으로 넣었다면')
rep('<button type="button" class="jchip" data-goto="sec-acc">③ 얼마나 모일까</button>', '<button type="button" class="jchip" data-goto="xf-sec-acc">③ 얼마나 모일까</button>')

rep("/* v10.7 */", """/* v10.8 */
details.xfold > .fold-body > section.panel { box-shadow: none; border: 0; margin: 0; padding: 4px 0 0; background: transparent; }
details.xfold > summary .fold-t { font-size: 15px; font-weight: 700; }
/* v10.7 */""")
