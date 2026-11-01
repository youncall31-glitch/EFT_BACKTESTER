# ================= v10.0: recovery next to CAGR and MDD everywhere; one picture for the recovery strategies =================
import re as _re
rep('<dt>v9.9 · 2026.10.30</dt>', """<dt>v10.0 · 2026.10.30</dt>
          <dd><ul>
            <li>CAGR · MDD 옆에 회복 기간을 함께: 성과 한눈에 막대(CAGR · MDD · 최장 회복), 기간 편차의 ‘회복’ 보기, AI 비교표, 추세 보정 비교표, 다음 기간 점검</li>
            <li>MDD마다 그 하락에서 고점을 되찾기까지 걸린 기간을 괄호로</li>
            <li>하락과 회복을 한 그래프로: 시작 시점(−5 · −10 · −15 · −20%)을 고르면 모든 전략의 CAGR · MDD · 최장 회복을 그대로 두기(점선)와 비교 — 초록은 더 좋음, 빨강은 더 나쁨. 나머지는 ‘자세히’로 접고, ‘모든 하락’ 칸 읽는 법을 그림으로 설명</li>
          </ul></dd>
          <dt>v9.9 · 2026.10.30</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.9</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.0</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.9</span><span class="upd-d">2026\.10\.30</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.0</span><span class="upd-d">2026.10.30</span><span class="upd-t">회복 기간을 CAGR · MDD와 함께, 하락과 회복은 그래프 하나로</span>', h, count=1)
# result sentence: the MDD with its own recovery
rep("가장 크게 떨어졌을 때는 ${mpct1(x.st.mdd)}${mi && mi.mdd < 0 ? `(${mi.peakLabel}→${mi.troughLabel})` : ''}, 고점을 되찾기까지 가장 오래 걸린 때는",
    "가장 크게 떨어졌을 때는 ${mpct1(x.st.mdd)}${mi && mi.mdd < 0 ? `(${mi.peakLabel}→${mi.troughLabel}, 그 하락에서 ${mddRecTx(x.st)})` : ''}, 고점을 되찾기까지 가장 오래 걸린 때는")
rep("cell('MDD', mpct1(R.st.mdd), R.st.mddInfo.mdd < 0 ? `${R.st.mddInfo.peakLabel}→${R.st.mddInfo.troughLabel}` : null, true);",
    "cell('MDD', mpct1(R.st.mdd), R.st.mddInfo.mdd < 0 ? `${R.st.mddInfo.peakLabel}→${R.st.mddInfo.troughLabel} · ${mddRecTx(R.st)}` : null, true);")
# 성과 한눈에: three panels
rep("<h2 id=\"h-sum-1\">성과 한눈에 — CAGR · MDD</h2>", "<h2 id=\"h-sum-1\">성과 한눈에 — CAGR · MDD · 회복 기간</h2>")
h = h.replace("drawSumBF(S); scoreBars(", "drawSumTri(S); scoreBars(")
# spread: recovery view
rep('<button type="button" data-m="m" aria-pressed="false">구간 MDD</button></div>', '<button type="button" data-m="m" aria-pressed="false">구간 MDD</button><button type="button" data-m="u" aria-pressed="false">회복 기간</button></div>')
# ---- the recovery section, rebuilt ----
i = h.index('  <section class="panel scard" aria-labelledby="h-recov" id="sec-recov">'); j = h.index('  </section>', i) + len('  </section>\n')
old = h[i:j]
grab = lambda ident: _re.search(rf'<[^>]+id="{ident}"[^>]*>(?:</div>|</table>)?', old) is not None
h = h[:i] + '''  <section class="panel scard" aria-labelledby="h-recov" id="sec-recov">
    <div class="sc-h"><span class="sc-n">2</span><div><h2 id="h-recov">하락과 회복 — 떨어질 때 어떻게 하면 좋았나</h2><p class="sc-q">포트폴리오가 고점에서 정한 만큼 떨어질 때마다(작게 끝난 하락 포함) 전략을 실행했다면 CAGR · MDD · 회복 기간이 어떻게 바뀌었나</p></div></div>
    <div class="inbar">
      <div class="in-h"><span class="in-tag">입력</span><b>고르면 아래 그래프가 바뀌어요</b></div>
      <div class="in-row"><span class="in-l">포트폴리오</span><div class="chips" id="rc-port" role="group" aria-label="시험할 포트폴리오"></div></div>
      <div class="in-row"><span class="in-l">언제 시작</span><div class="seg-toggle" id="rc-t" role="group" aria-label="전략을 시작할 낙폭"><button type="button" data-t="0.05" aria-pressed="false">−5%</button><button type="button" data-t="0.1" aria-pressed="true">−10%</button><button type="button" data-t="0.15" aria-pressed="false">−15%</button><button type="button" data-t="0.2" aria-pressed="false">−20%</button></div><span class="small muted">고점 대비 이만큼 떨어지면 실행</span></div>
    </div>
    <p class="note" id="rc-msg" hidden></p>
    <div class="rc-say" id="rc-say"></div>
    <div class="chart-box" id="c-rc-main"></div>
    <p class="help">점선 = 그대로 두기. 막대가 <b class="pos">초록</b>이면 그대로 두기보다 좋고, <b class="neg">빨강</b>이면 나쁘고, 회색이면 거의 같아요. MDD 옆 괄호는 그 가장 큰 하락에서 고점을 되찾기까지 걸린 기간이에요. 줄을 누르면 아래 ‘자세히’가 그 전략으로 바뀌어요.</p>

    <details class="more" id="rc-d-ev"><summary>고른 전략을 하락마다 보기 — 작게 끝난 하락에서 잃고, 큰 하락에서 얻었나</summary>
      <div class="rc-ev" id="rc-ev-say"></div>
      <div class="chart-box" id="c-rc-ev"></div>
      <p class="help">점 하나가 전략이 실행된 하락 하나예요. 가로 = 그대로 뒀을 때 결국 떨어진 폭, 세로 = 고점을 되찾은 시점에 전략이 그대로 두기보다 평가액이 몇 % 많았나(+) · 적었나(−). 흐린 점은 아직 회복 전.</p>
      <div class="tbl-wrap" id="rc-ev-tbl"></div>
    </details>
    <details class="more" id="rc-d-ep"><summary>하락 하나를 확대해 보기 — 그대로 두기와 고른 전략의 회복 경로</summary>
      <div class="chips" id="rc-ep" role="group" aria-label="볼 하락"></div>
      <p class="small muted" id="rc-ep-say"></p>
      <div class="legend" id="lg-recov"></div>
      <div class="chart-box" id="c-recov"></div>
      <div class="tbl-wrap" id="rc-tbl"></div>
    </details>
    <details class="more" id="rc-d-all"><summary>모든 전략 × 모든 시작 시점 표 (32가지)</summary>
      <div class="rc-how">
        <b>칸 읽는 법 (‘모든 하락’)</b>
        <div class="rc-cell-ex"><div class="ex-cell"><b>+1.5%</b><span>3↑ 1↓ /4</span></div>
          <ul><li><b>+1.5%</b> — 전략이 실행된 하락마다, 고점을 되찾은 시점에 그대로 두기보다 평가액이 평균 1.5% 많았다는 뜻(−면 적었음)</li>
              <li><b>3↑</b> — 그중 도움이 된 하락 3번 · <b>1↓</b> — 손해 본 하락 1번 · <b>/4</b> — 그 % 이상 떨어져 전략이 실행된 하락 4번(나머지는 차이 없음)</li></ul></div>
      </div>
      <div class="sp-ctl"><span class="tog-l">볼 값</span><div class="seg-toggle" id="rc-m" role="group" aria-label="표에 볼 값"><button type="button" data-m="evt" aria-pressed="true">모든 하락</button><button type="button" data-m="rec" aria-pressed="false">큰 하락 회복</button><button type="button" data-m="cagr" aria-pressed="false">CAGR</button><button type="button" data-m="mdd" aria-pressed="false">MDD</button><button type="button" data-m="uw" aria-pressed="false">최장 회복</button></div></div>
      <h3 class="sc-sub" id="rc-gh">방법 × 시기</h3>
      <p class="help" id="rc-help"></p>
      <div class="tbl-wrap" id="rc-grid"></div>
      <h3 class="sc-sub">모든 전략을 점으로 — 전체 기간 CAGR × MDD</h3>
      <div class="legend" id="lg-rc-sc"></div>
      <div class="chart-box" id="c-rc-sc"></div>
      <div class="tbl-wrap" id="rc-all"></div>
    </details>
    <details class="more"><summary>전략 설명과 주의할 점</summary>
      <ul class="small g-notes">
        <li><b>바로 리밸런싱</b>: 떨어진 그 달에 원래 비중으로 맞춰 내린 종목을 더 사요. <b>공격 늘리기</b>: 채권 · 금 같은 수비 종목 절반을 주식 같은 공격 종목으로 옮겨요. <b>수비로</b>: 공격 종목 절반을 현금성(BIL)으로 옮겨요.</li>
        <li><b>원복 기준</b> — 추세 회복: 공격 종목만 묶은 지수의 월말 값이 최근 10개월 평균 위로 올라오면 · 절반 회복: 떨어진 폭의 절반을 되찾으면 · 저점 +10% · 12개월 뒤 · 고점 근처(−5% 이내).</li>
        <li>신호는 월말 기준이고 그 달 말에 사고팔아 다음 달부터 반영돼요. 되돌린 뒤에는 새 고점을 찍거나 직전 저점 아래로 내려갈 때만 다시 실행해요. 수수료 · 세금은 빠져 있어요.</li>
        <li>한 칸만 보고 고르면 과최적화예요. 주변 시작 시점에서도 비슷하게 좋은 전략을 고르세요. 수비 자산이 많아 그대로 둬도 MDD가 −20%보다 얕은 포트폴리오에서는 효과가 거의 없어요.</li>
      </ul>
    </details>
  </section>
''' + h[j:]
h = h.replace("{ id: 'evt' }", "{ id: 'evt' }")
css100 = """
/* v10.0 */
.rc-how { border: 1px solid var(--line-2); border-radius: 10px; padding: 10px 12px; margin: 6px 0 10px; background: var(--panel-2); }
.rc-how > b { font-size: 13px; }
.rc-cell-ex { display: flex; gap: 12px; align-items: flex-start; margin-top: 8px; }
.ex-cell { flex: none; width: 78px; text-align: center; padding: 6px 3px; border-radius: 8px; border: 2px solid var(--line-2); background: color-mix(in srgb, var(--pos) 18%, var(--panel)); }
.ex-cell b { display: block; font-size: 12.5px; } .ex-cell span { display: block; font-size: 10.5px; font-family: var(--font-mono); }
.rc-cell-ex ul { margin: 0; padding-left: 16px; font-size: 12.5px; line-height: 1.5; }
#sec-recov .help b.pos { color: var(--pos); } #sec-recov .help b.neg { color: var(--neg); }
.aikpi td .sub { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css100)

rep("  /* ---------- boot ---------- */", (R / 'src/app_v100.js').read_text() + "\n  /* ---------- boot ---------- */")
