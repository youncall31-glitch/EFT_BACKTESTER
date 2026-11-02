# ================= v10.3: realistic numbers made simple — one table (past vs realistic), the how-to folded; the AI pick uses them =================
import re as _re
rep('<dt>v10.2 · 2026.11.02</dt>', """<dt>v10.3 · 2026.11.02</dt>
          <dd><ul>
            <li>3 검증 ‘현실적인 기대치’를 판정 카드 바로 아래로 옮기고 표 하나로 단순화: 포트폴리오마다 과거 백테스트 줄과 현실적으로(지금 금리 기준) 줄 — CAGR · MDD · 회복 기간</li>
            <li>계산 방법 · 가정 바꾸기 · 근거 그래프는 ‘어떻게 계산했나요?’를 눌러 펼쳐 보기. 모의실험 기본 기간 20년</li>
            <li>AI 추천에 ‘고르는 기준’ 추가 — 기본 ‘현실 기대 수익(은퇴용)’: 과거 MDD · 회복 한도를 지킨 조합 중 지금 금리 기준 기대 CAGR이 가장 높은 비중. 추천 카드와 결과 표에 현실적인 CAGR · MDD · 회복 기간, 다음 기간 점검에 ‘고를 때 기대 → 실제’</li>
          </ul></dd>
          <dt>v10.2 · 2026.11.02</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.2</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v10.3</span></h1>')
h = _re.sub(r'<span class="upd-v">v10\.2</span><span class="upd-d">[^<]*</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v10.3</span><span class="upd-d">2026.11.02</span><span class="upd-t">현실적인 CAGR · MDD · 회복 기간을 표 하나로, AI 추천도 그 기준으로</span>', h, count=1)

# ---- the module: swap v10.2 for v10.3 ----
a = h.index('  /* ======================= v10.2: is the past average flattered?')
b = h.index('  /* ---------- boot ---------- */', a)
h = h[:a] + (R / 'src/app_v103.js').read_text() + """  $('#sum-crit').addEventListener('change', e => { state.aiCrit = e.target.value === 'past' ? 'past' : 'real'; sumPick(true); });
""" + h[b:]

# ---- the section: simple table on top, everything else folded; moved right below the verdict card ----
a = h.index('  <section class="panel scard" aria-labelledby="h-real" id="sec-real">')
b = h.index('  <section class="panel scard" aria-labelledby="h-corr" id="sec-corr">')
h = h[:a] + h[b:]
sec = '''  <section class="panel scard" aria-labelledby="h-real" id="sec-real">
    <div class="sc-h"><span class="sc-n">⚖</span><div><h2 id="h-real">현실적인 기대치 — 지금 금리 기준</h2><p class="sc-q">과거 백테스트 숫자와, 지금 조건으로 다시 계산한 현실적인 CAGR · MDD · 회복 기간</p></div></div>
    <div class="rl-say" id="rl-say"></div>
    <div id="rl-tbl"></div>
    <p class="small muted" id="rl-note"></p>
    <details class="more rl-how" id="rl-how"><summary>어떻게 계산했나요? — 자세한 설명 · 가정 바꾸기 · 근거 그래프</summary>
      <h3 class="sc-sub">계산 방법</h3>
      <ol class="rl-steps">
        <li><b>과거 백테스트 줄</b> — 이 계산기의 백테스트 결과 그대로예요. MDD 아래 작은 글씨는 그 하락에서 회복하기까지 걸린 기간, 회복 기간은 고점을 되찾기까지 가장 오래 걸린 때예요.</li>
        <li><b>왜 다시 계산하나</b> — 채권은 ‘살 때 금리’만큼 번다고 보면 거의 맞아요(아래 점 그래프). 1982~2020년에는 미국 10년 국채 금리가 15%대에서 1% 아래까지 내려가 채권 값이 덤으로 올랐는데, 금리가 이미 내려온 지금은 이 덤이 되풀이되기 어려워요. 그래서 채권이 많은 포트폴리오일수록 과거 평균이 앞으로보다 높게 나와요.</li>
        <li><b>현실적인 CAGR</b> — 종목마다 기대 수익률을 정해요. 채권 = 지금 10년 국채 금리, 단기 채권 = 금리와 현금의 중간, 회사채 +1%p, 하이일드 +2.5%p, 주식 7%, 금 · 원자재 3%, 현금 = 지금 단기국채 금리. 이것을 비중대로 섞고, 과거의 출렁임(변동성)과 종목끼리 같이 움직이는 정도(상관)로 분산 효과를 반영해요.<br><span class="mono small">기대 CAGR ≈ Σ 비중 × (종목 기대 + 변동성²/2) − 포트폴리오 변동성²/2</span></li>
        <li><b>현실적인 MDD · 회복 기간</b> — 과거 실제 월별 움직임을 12개월씩 묶어 무작위로 이어 붙여, 앞으로 N년(기본 20년)을 700번 만들어요. 출렁임과 위기의 모양은 과거 그대로이고, 종목마다 평균만 위 기대 수익률로 옮겼어요. 매년 처음 비중으로 리밸런싱해요. 700번 중 가운데가 ‘약’, 나쁜 쪽 10%가 ‘나쁘면’, CAGR의 ‘나쁘면 · 좋으면’은 하위 · 상위 10%예요.</li>
        <li><b>기간 차이</b> — 과거 MDD는 전체 기간(수십 년) 중 최악이고, 현실 MDD는 앞으로 N년 동안의 값이에요. 기간이 짧을수록 큰 위기를 덜 만나 얕게 나오니, 은퇴 자금이라면 20~30년으로 보세요.</li>
        <li><b>한계</b> — 예측이 아니라 가정을 넣은 계산이에요. 주식 7% · 금 3%는 흔히 쓰는 장기 가정이고 아래에서 바꿀 수 있어요. 과거에 없던 종류의 위기는 모의실험에도 없어요. 물가를 뺀 계산(실질)을 켜면 모든 가정에서 물가 2.5%를 빼요.</li>
      </ol>
      <div id="rl-how-x"></div>
      <div class="inbar">
        <div class="in-h"><span class="in-tag">입력</span><b>가정 바꾸기 — 바꾸면 위 표와 AI 추천이 다시 계산돼요</b></div>
        <div class="in-row"><span class="in-l">따라가 볼 포트폴리오</span><div class="chips" id="rl-port" role="group" aria-label="볼 포트폴리오"></div></div>
        <div class="rl-in">
          <div class="field"><label for="rl-bond">채권 기대 (%)</label><input id="rl-bond" type="number" step="0.1" inputmode="decimal"><p class="help">기본값 = 지금 미국 10년 국채 금리</p></div>
          <div class="field"><label for="rl-eq">주식 기대 (%)</label><input id="rl-eq" type="number" step="0.5" inputmode="decimal"><p class="help">연 수익률 가정 · 기본 7%</p></div>
          <div class="field"><label for="rl-gold">금 · 원자재 기대 (%)</label><input id="rl-gold" type="number" step="0.5" inputmode="decimal"><p class="help">기본 3% (물가 수준)</p></div>
          <div class="field"><label for="rl-h">모의실험 기간</label><select id="rl-h"><option value="10">10년</option><option value="20">20년</option><option value="30">30년</option></select><p class="help"><button class="btn ghost sm" type="button" id="rl-reset">기본값으로</button></p></div>
        </div>
        <p class="small muted" id="rl-bond-note"></p>
      </div>
      <h3 class="sc-sub">과거 CAGR vs 현실적인 기대 — 앞으로의 범위</h3>
      <div class="chart-box" id="c-rl-exp"></div>
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
        <p class="help">채권 수익 ≈ 받은 이자(대략 그 시기의 평균 금리) + 금리가 내려 생긴 값 상승(금리가 오르면 값 하락). 10년 국채 금리로 본 근사예요.</p>
        <h3 class="sc-sub">살 때 금리 → 그 뒤 10년 채권 수익</h3>
        <div class="chart-box" id="c-rl-sc"></div>
        <p class="help">점 하나가 시작한 달 하나예요. 점들이 점선(같은 값) 근처에 모일수록 ‘살 때 금리 ≈ 그 뒤 10년 채권 수익’이에요. 세로선은 지금 금리.</p>
      </div>
    </details>
  </section>

'''
a = h.index('  <section class="panel scard" aria-labelledby="h-spread" id="sec-spread">')
h = h[:a] + sec + h[a:]
rep('<button type="button" data-goto="sec-spread"><i>1</i>기간 편차</button><button type="button" data-goto="sec-real"><i>⚖</i>착시·현실</button>',
    '<button type="button" data-goto="sec-real"><i>⚖</i>현실 기대치</button><button type="button" data-goto="sec-spread"><i>1</i>기간 편차</button>')
rep('<li><button type="button" class="map-link" data-goto="sec-spread">정합성: 2·5·10·20·30년 편차</button></li><li><button type="button" class="map-link" data-goto="sec-real">과거 평균의 착시 · 앞으로의 현실적인 범위</button></li>',
    '<li><button type="button" class="map-link" data-goto="sec-real">현실적인 기대치: 지금 금리 기준 CAGR · MDD · 회복</button></li><li><button type="button" class="map-link" data-goto="sec-spread">정합성: 2·5·10·20·30년 편차</button></li>')

# ---- AI: choose by realistic expected return (default) or by the past consistency score ----
rep('<div class="field"><label for="sum-uw">회복 기간 한도</label><select id="sum-uw"></select></div>',
    '<div class="field"><label for="sum-uw">회복 기간 한도</label><select id="sum-uw"></select></div>\n      <div class="field"><label for="sum-crit">고르는 기준</label><select id="sum-crit"><option value="real">현실 기대 (은퇴용)</option><option value="past">과거 일관성</option></select></div>')
rep(""".ai-ctl { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr);""", """.ai-ctl { display: grid; grid-template-columns: minmax(0, 2fr) repeat(3, minmax(0, 1fr));""")
rep("""      const r = BT.trustPick(P, TR.T, { lo: 0, hi: cap >= 1 ? 10 : cap, uw });
      const mk = (p, extra) => p ? Object.assign({ p, tr: trustOf(p.w.map(x => x[0]), p.w.map(x => x[1]), o.s, o.end, o.rule, false, P.evaluated, TR.VSR) }, extra || {}) : null;
      const rec = r ? mk(BT.optPoint(P, r.i), { info: r }) : null;""",
"""      const crit = { lo: 0, hi: cap >= 1 ? 10 : cap, uw }, useReal = state.aiCrit !== 'past';
      const rt = BT.trustPick(P, TR.T, crit), rr = realPick(P, rlAssume(o.end), crit);
      const r = useReal ? rr : rt, r2 = useReal ? rt : rr;
      const mk = (p, extra) => p ? Object.assign({ p, tr: trustOf(p.w.map(x => x[0]), p.w.map(x => x[1]), o.s, o.end, o.rule, false, P.evaluated, TR.VSR) }, extra || {}) : null;
      const rlOf = x => (x ? Object.assign(x, { R: rlSim(x.p.w.map(q => q[0]), x.p.w.map(q => q[1]), o.s, o.end, false, rlAssume(o.end), state.rl.H) }) : x);
      const rec = rlOf(r ? mk(BT.optPoint(P, r.i), { info: r, crit: useReal ? 'real' : 'past' }) : null);
      const other = r2 && (!r || r2.i !== r.i) ? rlOf(mk(BT.optPoint(P, r2.i), { info: r2, crit: useReal ? 'past' : 'real' })) : null;""")
rep("      return { cap, uw, rec, best, pred, mine };", "      return { cap, uw, rec, best, pred, mine, other };")
rep("    $('#sum-cap').value = String(sumCapNow()); $('#sum-uw').value = String(sumUwNow());\n    const chips",
    "    $('#sum-cap').value = String(sumCapNow()); $('#sum-uw').value = String(sumUwNow()); $('#sum-crit').value = state.aiCrit;\n    const chips")
rep("""hd.append(el('span', 'ai-badge', 'AI 추천'), el('h3', null, `MDD ${A.cap >= 1 ? '제한 없음' : Math.round(A.cap * 100) + '% 이내'}${A.uw ? ` · 회복 ${dur(A.uw)} 이내` : ''}에서 오래 들고 갈 비중`));""",
    """hd.append(el('span', 'ai-badge', 'AI 추천'), el('h3', null, `MDD ${A.cap >= 1 ? '제한 없음' : Math.round(A.cap * 100) + '% 이내'}${A.uw ? ` · 회복 ${dur(A.uw)} 이내` : ''}에서 ${A.rec.crit === 'real' ? '현실 기대 수익이 가장 높은' : '오래 들고 갈'} 비중`));""")
a = h.index("    const kv = el('div', 'ai-kv');\n    const cell = (k, v, sub, neg) =>")
b = h.index("    card.appendChild(kv);\n", a) + len("    card.appendChild(kv);\n")
h = h[:a] + """    card.appendChild(realTable([{ name: 'AI 추천 비중', color: 'var(--p3)', st: R.st, R: A.rec.R }]));
    card.appendChild(el('p', 'small muted', rlNote() + ` · 예측 가능성 ${R.score == null ? '–' : `${Math.round(R.score)} · ${gradeOf(R.score)}`}`));
""" + h[b:]
rep("""    li(`분석 기간을 ${o.trust.T.B}개 시기로 나눠 모든 시기에 고르게 좋았고, 비중을 한 칸씩 바꾼 이웃 조합 ${A.rec.info.nb}개도 비슷하게 좋아요. 최고 CAGR만 보고 고르는 것보다 과최적화가 적은 방식이에요(아래 ‘결과와 검증’).`);""",
    """    if (A.rec.crit === 'real') li(`과거 CAGR 대신 ‘지금 금리 기준 기대 CAGR’(3 검증 › 현실적인 기대치와 같은 계산)로 순위를 매겨, 그중 가장 높은 조합이에요. 과거 수익이 금리 하락 덕에 부풀려진 채권 비중을 과대평가하지 않아요. 기대 CAGR은 과거 수익을 맞추는 계산이 아니라서 과최적화 위험도 작아요.`);
    else li(`분석 기간을 ${o.trust.T.B}개 시기로 나눠 모든 시기에 고르게 좋았고, 비중을 한 칸씩 바꾼 이웃 조합 ${A.rec.info.nb}개도 비슷하게 좋아요. 최고 CAGR만 보고 고르는 것보다 과최적화가 적은 방식이에요(아래 ‘결과와 검증’).`);""")
rep("""      const v = el('div', 'alt-v', `CAGR ${pct(x.tr.st.cagr, 1)} · MDD ${mpct1(x.tr.st.mdd)} · 예측 가능성 ${x.tr.score == null ? '–' : Math.round(x.tr.score)}`);""",
    """      const v = el('div', 'alt-v', `과거 CAGR ${pct(x.tr.st.cagr, 1)} · MDD ${mpct1(x.tr.st.mdd)}${x.R ? ` · 현실 CAGR 약 ${pct(x.R.gExp, 1)} · 현실 MDD 약 ${mpct1(x.R.m50)}(나쁘면 ${mpct1(x.R.m10)})` : ''}`);""")
rep("""      alt.appendChild(r);
    };

    if (alt.childNodes.length)""", """      alt.appendChild(r);
    };
    if (A.other) altRow(A.other.crit === 'past' ? '과거 시기별 일관성으로 고르면' : '현실 기대 수익으로 고르면', A.other, A.other.crit === 'past' ? '이전 방식 · 시기마다 고르게 좋았던 조합' : '지금 금리 기준 기대 CAGR이 가장 높은 조합');
    if (alt.childNodes.length)""")
rep("out.push({ name: 'AI 추천', color: 'var(--ink)', ai: true, w: A.rec.p.w, T: A.rec.tr,", "out.push({ name: 'AI 추천', color: 'var(--ink)', ai: true, w: A.rec.p.w, T: A.rec.tr, R: A.rec.R,")
rep("out.push({ name: vp.name, color: PCOL[vp.i], T: trustOf(vp.info.tickers", "out.push({ name: vp.name, color: PCOL[vp.i], R: rlSim(vp.info.tickers, vp.info.weights, o.s, o.end, false, rlAssume(o.end), state.rl.H), T: trustOf(vp.info.tickers")
rep("v.i + ':' + v.info.tickers.join(',') + ':' + v.info.weights.join(',')).join(';');\n    if (aiKey === key",
    "v.i + ':' + v.info.tickers.join(',') + ':' + v.info.weights.join(',')).join(';') + '|' + JSON.stringify(state.rl) + state.aiCrit;\n    if (aiKey === key")
rep("""      $('#ai-say').textContent = `AI 추천은 ‘${me.name}’보다 CAGR ${ppTxt(dc)},""",
    """      if (ai.R && me.R) $('#ai-say').textContent = `현실적으로(지금 금리 기준) AI 추천은 CAGR 약 ${pct(ai.R.gExp, 1)} · MDD 약 ${mpct1(ai.R.m50)}(나쁘면 ${mpct1(ai.R.m10)}) · 회복 약 ${yrTx(ai.R.u50)}(나쁘면 ${yrTx(ai.R.u90)}), ‘${me.name}’은 ${pct(me.R.gExp, 1)} · ${mpct1(me.R.m50)}(${mpct1(me.R.m10)}) · ${yrTx(me.R.u50)}(${yrTx(me.R.u90)})예요. 과거 백테스트로는 CAGR ${ppTxt(dc)}, 정합성 ${Math.round(ai.T.score || 0)} vs ${Math.round(me.T.score || 0)}, 신빙성 ${ai.T.pass}/${ai.T.checks.length} vs ${me.T.pass}/${me.T.checks.length}.`;
      else $('#ai-say').textContent = `AI 추천은 ‘${me.name}’보다 CAGR ${ppTxt(dc)},""")
a = h.index("    // KPI table\n    const t = el('table', 'aikpi')")
b = h.index("$('#ai-kpi').appendChild(tw);\n", a) + len("$('#ai-kpi').appendChild(tw);\n")
h = h[:a] + """    $('#ai-kpi').appendChild(realTable(D.rows.map(r => ({ name: r.name, color: r.color, st: r.T.st, R: r.R }))));
    $('#ai-kpi').appendChild(el('p', 'small muted', rlNote()));
""" + h[b:]
# walk-forward: pick with the same criterion, with the assumptions of the training end (its 10-year yield then)
rep("    const key = o.key + '|' + A.cap + '|' + A.uw; if (aiwfKey === key) return;", "    const key = o.key + '|' + A.cap + '|' + A.uw + '|' + state.aiCrit + JSON.stringify(state.rl); if (aiwfKey === key) return;")
rep("""          const T = await BT.trustScan(P, f => st(`그 기간을 시기별로 나눠 다시 계산하는 중… ${Math.round(f * 100)}%`));""",
    """          const useReal = state.aiCrit !== 'past';
          const T = useReal ? null : await BT.trustScan(P, f => st(`그 기간을 시기별로 나눠 다시 계산하는 중… ${Math.round(f * 100)}%`));""")
rep("""          const r = T.ok ? BT.trustPick(P, T, { lo: 0, hi, uw: A.uw }) : null;
          if (r) row.rows.push(mk('AI 방식으로 고른 비중', r.i, 'ai'));""",
    """          const r = useReal ? realPick(P, rlAssume(trainEnd), { lo: 0, hi, uw: A.uw }) : (T.ok ? BT.trustPick(P, T, { lo: 0, hi, uw: A.uw }) : null);
          if (r) row.rows.push(Object.assign(mk(useReal ? '현실 기준으로 고른 비중' : 'AI 방식으로 고른 비중', r.i, 'ai'), { g: useReal ? r.g : null, y: useReal ? y10At(trainEnd) : null }));""")
rep("""+ (best ? ` CAGR 최고로 고른 비중은 ${pct(best.a.cagr, 1)} → ${pct(best.b.cagr, 1)}.` : '')));""",
    """+ (ai.g != null ? ` 고를 때(10년 금리 ${ai.y != null ? (ai.y * 100).toFixed(1) + '%' : '–'}) 계산한 현실 기대 CAGR은 ${pct(ai.g, 1)}였어요.` : '') + (best ? ` CAGR 최고로 고른 비중은 ${pct(best.a.cagr, 1)} → ${pct(best.b.cagr, 1)}.` : '')));""")
css103 = """
/* v10.3 */
.rl2 { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 0 !important; }
.rl2 th, .rl2 td { padding: 6px 8px; text-align: right; vertical-align: top; font-size: 13px; white-space: normal !important; font-family: var(--font-sans); overflow-wrap: anywhere; }
.rl2 col.c0 { width: 22%; }
.rl2 thead th { font-size: 12px; color: var(--muted); font-weight: 600; border-bottom: 1px solid var(--line); }
.rl2 .rl2-n th { text-align: left; font-family: var(--font-sans); font-size: 13.5px; padding-top: 12px; border-bottom: 1px dashed var(--line); }
.rl2 .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
.rl2 .rl2-l { text-align: left; color: var(--muted); white-space: nowrap; font-size: 12px; }
.rl2 td small { display: block; white-space: normal; font-size: 11px; color: var(--muted); font-weight: 400; }
.rl2 .rl2-r td { background: color-mix(in srgb, var(--focus) 7%, transparent); }
.rl2 .rl2-r td b { font-size: 14px; }
.rl2 .rl2-r .rl2-l { color: var(--ink); font-weight: 700; }
.rl2-w { margin: 6px 0; }
.rl-how > summary { font-weight: 700; }
.rl-steps { padding-left: 20px; display: grid; gap: 6px; font-size: 13.5px; }
.rl-steps .mono { display: inline-block; margin-top: 4px; }
#rl-how-x { margin: 10px 0; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--focus) 6%, transparent); }
#rl-how-x .rl-h { display: flex; align-items: center; gap: 6px; margin: 0 0 4px; }
#rl-how-x .key { display: inline-block; width: 10px; height: 10px; border-radius: 3px; }
@media (max-width: 520px) { .rl2 th, .rl2 td { padding: 6px 4px; font-size: 12.5px; } .rl2 .rl2-r td b { font-size: 13px; } }
"""
rep("@media (max-width: 640px) { .rl-in { grid-template-columns: 1fr 1fr; } }", "@media (max-width: 640px) { .rl-in { grid-template-columns: 1fr 1fr; } }" + css103)
