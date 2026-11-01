# ================= v7.6: predictability from 3·5·10-year holding periods; luck checks kept apart =================
rep('<dt>v7.5 · 2026.10.28</dt>', """<dt>v7.6 · 2026.10.28</dt>
          <dd><ul>
            <li>결과 › 3·5·10년 구간 산포: 아무 달에 시작해 3·5·10년 들고 있었을 때의 CAGR·MDD를 가능한 모든 시작 달로 계산해 산포도와 범위 막대로 보여줘요(하위 10%~상위 10%, 중앙값, 최저~최고, 손실 난 구간 비율)</li>
            <li>미래 신뢰도 점수를 ‘예측 가능성’으로 바꿈: 이전 점수는 거의 모든 분산 포트폴리오가 90점 이상이라 구별이 안 됐어요. 이제 3·5·10년 구간의 수익 산포·낙폭 산포·나쁜 경우로 매겨요. 유의성·비중 민감도·기록 길이·부트스트랩은 ‘운 점검’으로 따로 표시</li>
            <li>최적화 › 신뢰도 반영 최적화에 ‘예측 가능성 최고’ 추천 추가</li>
          </ul></dd>
          <dt>v7.5 · 2026.10.28</dt>""")
rep('<span class="upd-v">v7.5</span><span class="upd-d">2026.10.28</span><span class="upd-t">과거 결과를 얼마나 믿을 수 있는지 보여주는 미래 신뢰도 지표를 더했어요</span>',
    '<span class="upd-v">v7.6</span><span class="upd-d">2026.10.28</span><span class="upd-t">3·5·10년 구간 산포를 보여주고, 신뢰도를 예측 가능성 점수로 바꿨어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.5</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.6</span></h1>')

# results: the trust panel's text
rep('<h2 id="h-trust">미래 신뢰도 — 이 결과를 얼마나 믿을 수 있나</h2><p class="help">미래 수익을 보장하는 지표는 없어요. 대신 과거 결과가 운이나 특정 시기 덕분일 가능성을 네 가지로 따져 0~100점으로 모았어요. 점수가 높을수록 결과가 운에 덜 기대고 여러 시기에 고르게 나왔다는 뜻이에요.</p>',
    '<h2 id="h-trust">미래 신뢰도 — 예측 가능성과 운 점검</h2><p class="help">미래 수익을 보장하는 지표는 없어요. 대신 ‘언제 시작했어도 결과가 비슷했나’(예측 가능성, 0~100점)와 ‘운으로 나온 결과는 아닌가’(운 점검 4가지)를 따로 보여줘요. 예측 가능성은 얼마나 일정했는지이지 얼마나 벌었는지가 아니에요. 현금은 예측 가능성이 높지만 수익이 낮아요.</p>')
a = h.index('<li><b>미래 신뢰도</b>: 아래 네 점수'); b = h.index('</ul>', a)
h = h[:a] + """<li><b>예측 가능성 (0~100)</b>: 아래 세 점수의 평균이에요. 80 이상 높음, 60~80 보통, 60 미만 낮음. 3·5·10년 구간마다 매긴 뒤 평균해요(분석 기간보다 긴 구간은 빼요).</li>
          <li><b>수익 산포</b>: 모든 구간 CAGR의 상위 10%와 하위 10%의 차이. 10년은 2%p 이하 100점 ~ 15%p 이상 0점, 5년은 4~25%p, 3년은 5~35%p.</li>
          <li><b>낙폭 산포</b>: 구간 안 MDD의 상위 10%와 하위 10%의 차이. 5%p 이하 100점 ~ 50%p 이상 0점.</li>
          <li><b>나쁜 경우</b>: 하위 10% 구간에서 현금(미국 단기국채)보다 연 몇 %p 더(덜) 벌었나. 10년은 −3%p 0점 ~ +3%p 100점, 5년은 −6~+2%p, 3년은 −10~+2%p.</li>
          <li><b>운 점검</b>: ① 유의성(PSR 95% 이상 — 운만으로 이 샤프가 나올 확률 5% 미만), ② 비중 민감도(비중 ±5%p에 CAGR이 0.5%p 넘게 안 떨어짐), ③ 기록 길이(샤프를 믿는 데 필요한 기간보다 길게 기록됨), ④ 부트스트랩(섞어 만든 20년 중 90% 이상에서 현금보다 나음). 칸에 마우스를 올리면 값이 보여요.</li>
          <li><b>부트스트랩 범위</b>: 과거 월 수익률을 평균 12개월씩 묶어 섞어 만든 미래 1,000가지의 하위 5%~상위 5% 연 수익률과, 그중 하위 5%의 MDD예요.</li>
        """ + h[b:]

disp = """  <section class="panel" aria-labelledby="h-disp" id="sec-disp">
    <div class="panel-head"><h2 id="h-disp">3·5·10년 구간 산포 — 언제 시작했느냐에 따라 얼마나 달랐나</h2><p class="help">분석 기간 안에서 아무 달에 시작해 3·5·10년 들고 있었다면 CAGR과 MDD가 어땠는지, 가능한 모든 시작 달(1개월 간격)로 계산했어요. 무작위로 몇 번 뽑아 보는 대신 뽑힐 수 있는 모든 구간을 빠짐없이 본 거예요. 점과 막대가 좁게 모일수록 언제 시작해도 결과가 비슷했다는 뜻이에요.</p></div>
    <div class="disp-ctl"><div class="seg-toggle big" id="disp-y" role="group" aria-label="보유 기간"><button type="button" data-y="3" aria-pressed="false">3년</button><button type="button" data-y="5" aria-pressed="false">5년</button><button type="button" data-y="10" aria-pressed="true">10년</button></div><div class="chips" id="disp-port" role="group" aria-label="보여줄 포트폴리오"></div></div>
    <p class="small muted" id="disp-n"></p>
    <div class="disp-grid">
      <div class="disp-sc">
        <div class="chart-title"><h3>구간마다 CAGR과 MDD</h3></div>
        <p class="help">점 하나가 시작 달 하나예요. 위로 갈수록 많이 벌었고, 오른쪽으로 갈수록 구간 안에서 크게 떨어졌어요. 네모는 하위 10%~상위 10% 범위, 큰 점은 중앙값이에요.</p>
        <div class="legend" id="lg-disp"></div>
        <div class="chart-box" id="c-disp"></div>
      </div>
      <div class="disp-rg">
        <div class="chart-title"><h3>범위 비교</h3></div>
        <p class="help">가는 선은 최저~최고, 굵은 막대는 하위 10%~상위 10%, 검은 눈금은 중앙값이에요.</p>
        <div class="chart-box" id="c-disp-r"></div>
      </div>
    </div>
    <div class="tbl-wrap"><table id="t-disp" class="disptbl"></table></div>
    <p class="small muted">분배금 재투자 기준이고 통화·물가·추세 보정 설정을 따라요. 손실 난 구간은 그 기간 CAGR이 0보다 작았던 시작 달의 비율이에요.</p>
  </section>

"""
rep('  <section class="panel" aria-labelledby="h-trust" id="sec-trust-res">', disp + '  <section class="panel" aria-labelledby="h-trust" id="sec-trust-res">')
rep('<button type="button" class="jchip" data-goto="sec-trust-res">미래 신뢰도</button>', '<button type="button" class="jchip" data-goto="sec-disp">3·5·10년 산포</button><button type="button" class="jchip" data-goto="sec-trust-res">미래 신뢰도</button>')
rep('<li><button type="button" class="map-link" data-goto="sec-trust-res">미래 신뢰도: 이 결과를 얼마나 믿을 수 있나</button></li>',
    '<li><button type="button" class="map-link" data-goto="sec-disp">3·5·10년 구간 산포</button></li><li><button type="button" class="map-link" data-goto="sec-trust-res">미래 신뢰도: 예측 가능성과 운 점검</button></li>')
rep('<b>이 결과를 미래에도 믿을 수 있을까</b><span class="g-d">운·특정 시기 덕분일 가능성을 0~100점으로</span>', '<b>이 결과를 미래에도 믿을 수 있을까</b><span class="g-d">3·5·10년 구간마다 결과가 얼마나 달랐나, 운 점검</span>')

# help FAQ: the score bullets
a = h.index('          <li><b>시기 일관성</b>: 모든 10년 구간(1개월 간격) 중'); b = h.index('<li><b>신뢰도 반영 최적화</b>', a)
h = h[:a] + """          <li><b>예측 가능성 점수 (이 앱이 만든 지표)</b>: 분석 기간 안 모든 3·5·10년 보유 구간(1개월 간격)에서 ① 수익 산포(CAGR 상위 10% − 하위 10%), ② 낙폭 산포(구간 MDD 상위 10% − 하위 10%), ③ 나쁜 경우(하위 10% 구간의 현금 대비 초과 연수익)를 각각 0~100으로 바꿔 평균해요. 눈금은 1986~2026년 여러 자산(현금·채권·금·주식·나스닥·3배 레버리지)이 고르게 퍼지도록 정했어요. 예를 들어 10년 수익 산포는 영구 포트폴리오 2.6%p, 60/40 8.3%p, S&amp;P 500 14.0%p, 나스닥100 18.2%p였어요. 과거에 결과가 좁게 모였다고 미래에도 그렇다는 보장은 없지만, 넓게 퍼졌던 포트폴리오는 백테스트의 한 숫자(CAGR)를 믿기 어렵다는 것은 분명해요.</li>
          <li><b>이전 점수(v7.5)를 바꾼 이유</b>: 유의성·10년 구간이 현금을 이긴 비율·부트스트랩은 ‘현금보다 나았나, 운이었나’를 묻는 항목이라 40년 기록이 있는 분산 포트폴리오는 거의 다 통과해 90점 이상이 나왔어요. 그래서 이 항목들은 통과·주의로 보는 ‘운 점검’으로 옮기고, 점수는 포트폴리오마다 크게 다른 구간 산포로 매겨요.</li>
          """ + h[b:]
rep("<li><b>신뢰도 반영 최적화</b>: 분석 기간 전체로 계산한 모든 조합을", "<li><b>신뢰도 반영 최적화</b>: ‘예측 가능성 최고’는 MDD 범위 안 조합 중 시기 일관성·CAGR·샤프 상위 후보(최대 600개)를 3·5·10년 모든 구간으로 다시 계산해 예측 가능성 점수가 가장 높은 조합이에요. ‘신뢰도 추천’은 분석 기간 전체로 계산한 모든 조합을")

# redraw on resize / fold / tab
h = h.replace("drawRetire(); drawAcc(); }", "drawRetire(); drawAcc(); drawDisp(); }").replace("drawRetire(); drawAcc(); });", "drawRetire(); drawAcc(); drawDisp(); });")

css6 = """
/* v7.6: dispersion of 3·5·10-year periods, predictability parts */
.disp-ctl { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-bottom: 4px; }
.disp-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 20px; margin-top: 8px; align-items: start; }
.disp-grid > div { display: grid; gap: 6px; min-width: 0; }
#c-disp-r svg { display: block; width: 100%; overflow: visible; margin-bottom: 10px; }
.disptbl td.hz { font-family: var(--font-sans); color: var(--ink-2); }
.disptbl tr.grp-first th, .disptbl tr.grp-first td { border-top: 1px solid var(--line-2); }
.disptbl td.spr { position: relative; min-width: 96px; }
.disptbl td.spr .sbar { display: block; height: 4px; border-radius: 2px; background: var(--ink-2); opacity: 0.45; margin: 3px 0 0 auto; }
.pscore { font-family: var(--font-mono); font-size: 14px; }
.luck { font-family: var(--font-sans); font-size: 13px; }
.luck.ok { color: var(--pos); } .luck.mid { color: var(--warn); } .luck.bad { color: var(--neg); }
.trusttbl td[title], .trustcmp td[title] { cursor: help; }
@media (max-width: 900px) { .disp-grid { grid-template-columns: 1fr; } }
"""
rep("@media (max-width: 900px) { .styles { grid-template-columns: 1fr 1fr; } }", "@media (max-width: 900px) { .styles { grid-template-columns: 1fr 1fr; } }" + css6)
