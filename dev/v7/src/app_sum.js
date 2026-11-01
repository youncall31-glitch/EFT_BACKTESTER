  /* ======================= v7.7: the summary tab — CAGR·MDD, consistency across periods, overfitting, AI pick ======================= */
  state.sumY = 10; state.sumCap = null; state.sumUw = null;
  const SUM_CAPS = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 1];
  function sumSvg(host, W, H, label) { return svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': label }, host); }
  const sumName = x => (x.bench ? state.bench : x.name);
  const shortName = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  /* periods for one series: whole, latest 10·20·30 years, oldest 10·20·30 years (same settings as the results tab) */
  function sumPeriods(x) {
    const L = state.last, rule = x.bench ? 'N' : state.rebal, out = [{ id: 'all', name: '전체', sub: `${BT.label(L.s)}~${BT.label(L.e)}`, cagr: x.st.cagr, mdd: x.st.mdd }];
    for (const Y of [10, 20, 30]) { const t = x.trail.find(q => q.years === Y); if (t && t.ok) out.push({ id: 'r' + Y, name: `최근 ${Y}년`, sub: `${t.start}~${t.end}`, cagr: t.cagr, mdd: t.mdd }); }
    for (const Y of [10, 20, 30]) {
      const i1 = L.s + Y * 12 - 1; if (i1 > L.e) continue;
      const st = BT.stats(BT.backtest(x.tickers, x.weights, L.s, i1, rule, L.adj, state.div));
      out.push({ id: 'o' + Y, name: `과거 ${Y}년`, sub: `${BT.label(L.s)}~${BT.label(i1)}`, cagr: st.cagr, mdd: st.mdd });
    }
    return out;
  }
  function renderSum() {
    const L = state.last, kp = $('#sum-kpi'); if (!kp) return;
    kp.innerHTML = ''; $('#sum-cons').innerHTML = ''; $('#sum-luck').innerHTML = '';
    if (!L) { kp.appendChild(el('p', 'empty', '비중 합계가 100%인 포트폴리오가 생기면 여기에 요약이 나와요. ‘입력’ 탭에서 티커와 비중을 넣어 주세요.')); state.sum = null; drawSum(); renderSumAI(); return; }
    $('#sum-when').textContent = `${BT.label(L.s)} – ${BT.label(L.e)} · ${monthsTxt(L.e - L.s + 1)} · 처음 ${money(state.initial)} · ${state.div ? '배당 현금 수령(평가액)' : '배당 재투자'}` + (state.real ? ' · 물가 반영' : '') + (state.cur === 'KRW' ? ' · 원화' : '') + (L.adj ? ' · 추세 보정 데이터' : '');
    const D = state.disp, Tof = k => (D ? (D.rows.find(r => r.x.key === k) || {}).T : null);
    const rows = L.series.map(x => ({ x, T: Tof(x.key), per: sumPeriods(x) }));
    state.sum = { rows };
    // ① cards
    for (const { x } of rows) {
      const c = el('div', 'sk' + (x.bench ? ' bench' : ''));
      const top = el('div', 'sk-n'); const k = el('span', 'key'); k.style.background = x.color; top.append(k, el('span', null, sumName(x))); if (x.bench) top.appendChild(el('i', null, '비교 기준'));
      const v = el('div', 'sk-v');
      const a = el('div'); a.append(el('span', null, 'CAGR'), el('b', x.st.cagr < 0 ? 'neg' : null, pct(x.st.cagr, 1)));
      const b = el('div'); b.append(el('span', null, 'MDD'), el('b', 'neg', mpct1(x.st.mdd)));
      v.append(a, b);
      c.append(top, v, el('p', 'sk-f', `${money(state.initial * x.st.final)} · 최장 회복 ${x.st.uw.months ? dur(x.st.uw.months) + (x.st.uw.ongoing ? '+' : '') : '없음'}`));
      kp.appendChild(c);
    }
    // ② verdict per portfolio
    for (const { x, T, per } of rows) {
      const cg = per.map(p => p.cagr), md = per.map(p => p.mdd);
      const hiP = per[cg.indexOf(Math.max(...cg))], loP = per[cg.indexOf(Math.min(...cg))];
      const r = el('div', 'sv');
      const n = el('div', 'sv-n'); const k = el('span', 'key'); k.style.background = x.color; n.append(k, el('b', null, sumName(x)));
      const sc = el('span', 'tscore ' + (T && T.score != null ? (T.score >= 80 ? 'hi' : T.score >= 60 ? 'mid' : 'lo') : ''), T && T.score != null ? Math.round(T.score) : '–');
      n.append(sc, el('span', 'sv-g', T ? `예측 가능성 ${gradeOf(T.score)}` : ''));
      r.appendChild(n);
      const w = T && T.top ? T.W[T.top] : null;
      const lines = [`기간별 CAGR 차이 ${((Math.max(...cg) - Math.min(...cg)) * 100).toFixed(1)}%p (${loP.name} ${pct(loP.cagr, 1)} ↔ ${hiP.name} ${pct(hiP.cagr, 1)}) · MDD ${mpct1(Math.min(...md))} ~ ${mpct1(Math.max(...md))}`];
      if (w) lines.push(`아무 때나 ${T.top}년 보유: CAGR ${pct(w.c10, 1)} ~ ${pct(w.c90, 1)}, MDD ${mpct1(w.m10)} ~ ${mpct1(w.m90)} (하위 10%~상위 10%)`);
      for (const l of lines) r.appendChild(el('p', null, l));
      $('#sum-cons').appendChild(r);
    }
    // ③ luck checks per portfolio
    for (const { x, T } of rows) {
      if (!T || !T.checks) continue;
      const r = el('div', 'sl');
      const n = el('div', 'sv-n'); const k = el('span', 'key'); k.style.background = x.color; n.append(k, el('b', null, sumName(x)), el('span', T.pass === T.checks.length ? 'luck ok' : T.pass >= T.checks.length - 1 ? 'luck mid' : 'luck bad', `${T.pass}/${T.checks.length} 통과`));
      r.appendChild(n);
      const bd = el('div', 'badges');
      for (const c of T.checks) { const s = el('span', 'bdg ' + (c.na ? 'na' : c.ok ? 'ok' : 'warn'), `${c.ok ? '✓' : '!'} ${c.k}`); s.title = `${c.txt}${c.ok ? '' : ' — ' + c.why}`; bd.appendChild(s); }
      r.appendChild(bd);
      const bad = T.checks.filter(c => !c.ok);
      r.appendChild(el('p', null, bad.length ? bad.map(c => `${c.k}: ${c.why} (${c.txt})`).join(' · ') : `운으로 나온 결과로 볼 근거는 없어요 · ${T.checks.map(c => c.txt).join(" · ")}`));
      $('#sum-luck').appendChild(r);
    }
    drawSum(); renderSumAI();
  }
  function drawSum() {
    const S = state.sum;
    for (const id of ['#c-sum-bf', '#c-sum-per', '#c-sum-rng', '#lg-sum-per', '#c-sum-score', '#sum-luck-grid']) { const e = $(id); if (e) e.innerHTML = ''; }
    if (!S || !isShown($('#c-sum-bf'))) { drawSumAI(); return; }
    const sr = S.rows.map(r => ({ name: sumName(r.x), color: r.x.color, bench: r.x.bench, score: r.T ? r.T.score : null, T: r.T }));
    drawSumBF(S); scoreBars($('#c-sum-score'), sr); drawSumPer(S); drawSumRng(S); luckGrid($('#sum-luck-grid'), sr); drawSumAI();
  }
  /* ① butterfly: MDD to the left, CAGR to the right, one row per portfolio */
  function drawSumBF(S) {
    const host = $('#c-sum-bf'), W = Math.max(280, host.clientWidth || 600), rowH = 34, H = 26 + S.rows.length * rowH + 22;
    const narrow = W < 520, lab = narrow ? 0 : Math.min(150, W * 0.26), mid = lab + (W - lab) * 0.5;
    let mdMax = 0.05, cgMax = 0.05, cgMin = 0;
    for (const { x } of S.rows) { mdMax = Math.max(mdMax, -x.st.mdd); cgMax = Math.max(cgMax, x.st.cagr); cgMin = Math.min(cgMin, x.st.cagr); }
    const halfL = mid - lab - 6, halfR = W - mid - 50;
    const XL = v => mid - 4 - v / mdMax * halfL, XR = v => mid + 4 + v / cgMax * halfR;
    const root = sumSvg(host, W, H, 'CAGR와 MDD 비교 막대');
    const ax = svg('g', { class: 'axis' }, root);
    const t1 = svg('text', { x: mid - 8, y: 14, 'text-anchor': 'end' }, ax); t1.textContent = '← MDD (최대 낙폭)';
    const t2 = svg('text', { x: mid + 8, y: 14 }, ax); t2.textContent = 'CAGR (연 수익률) →';
    const ln = svg('line', { x1: mid, x2: mid, y1: 20, y2: H - 18 }, root); ln.style.stroke = 'var(--line-2)';
    S.rows.forEach(({ x }, i) => {
      const y = 26 + i * rowH, cy = y + rowH / 2 - 2;
      if (!narrow) { const l = svg('text', { x: lab - 8, y: cy + 4, 'text-anchor': 'end' }, ax); l.textContent = shortName(sumName(x), 16); l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px'; }
      const md = svg('rect', { x: XL(-x.st.mdd), y: cy - 9, width: Math.max(1, mid - 4 - XL(-x.st.mdd)), height: 18, rx: 3 }, root); md.style.fill = 'var(--neg)'; md.style.opacity = x.bench ? '0.35' : '0.6';
      const cw = Math.max(1, Math.abs(XR(Math.max(0, x.st.cagr)) - (mid + 4)));
      const cg = svg('rect', { x: mid + 4, y: cy - 9, width: x.st.cagr > 0 ? cw : 1, height: 18, rx: 3 }, root); cg.style.fill = x.color; cg.style.opacity = x.bench ? '0.5' : '0.9';
      const mt = svg('text', { x: XL(-x.st.mdd) - 4, y: cy + 4, 'text-anchor': 'end' }, ax); mt.textContent = mpct1(x.st.mdd);
      if (XL(-x.st.mdd) - 44 < 0) { mt.setAttribute('x', XL(-x.st.mdd) + 4); mt.setAttribute('text-anchor', 'start'); mt.style.fill = 'var(--panel)'; }
      const ct = svg('text', { x: mid + 8 + (x.st.cagr > 0 ? cw : 0), y: cy + 4 }, ax); ct.textContent = pct(x.st.cagr, 1); ct.style.fill = 'var(--ink)'; ct.style.fontWeight = '600';
      if (narrow) { const l = svg('text', { x: mid + 8, y: cy - 12 }, ax); l.textContent = shortName(sumName(x), 22); l.style.fontSize = '10px'; l.style.fontFamily = 'var(--font-sans)'; }
    });
  }
  /* ② dot strip: one row per period, CAGR panel and MDD panel; a dot per portfolio */
  function drawSumPer(S) {
    const host = $('#c-sum-per');
    const ids = []; for (const r of S.rows) for (const p of r.per) if (!ids.find(q => q.id === p.id)) ids.push({ id: p.id, name: p.name, sub: p.sub });
    const order = ['all', 'r10', 'r20', 'r30', 'o10', 'o20', 'o30']; ids.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const rows = S.rows.map(r => ({ name: sumName(r.x), color: r.x.color, bench: r.x.bench, per: r.per }));
    legend($('#lg-sum-per'), rows, false, true);
    const get = k => (r, pid) => { const p = r.per.find(q => q.id === pid); return p ? p[k] : null; };
    dotStrip(host, 'CAGR', ids, rows, get('cagr'), v => (v * 100).toFixed(0) + '%');
    dotStrip(host, 'MDD', ids, rows, get('mdd'), v => (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%');
  }
  /* ② range bars for any 3·5·10-year holding period */
  function drawSumRng(S) {
    const host = $('#c-sum-rng'), Y = state.sumY; document.querySelectorAll('#sum-y button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === Y ? 'true' : 'false'));
    const R = S.rows.filter(r => r.T && r.T.W[Y]).map(r => ({ name: sumName(r.x), color: r.x.color, bench: r.x.bench, w: r.T.W[Y] }));
    if (!R.length) { host.appendChild(el('p', 'empty', `분석 기간이 ${Y}년보다 짧아요.`)); return; }
    const W = Math.max(280, host.clientWidth || 600);
    const one = (title, get, fmt) => {
      const rowH = 30, lab = W < 520 ? 92 : 150, H = 30 + R.length * rowH + 22, iw = W - lab - 18;
      let lo = Infinity, hi = -Infinity; for (const s of R) { const v = get(s.w); lo = Math.min(lo, v[0]); hi = Math.max(hi, v[4]); }
      const tk = linTicks(lo, hi, W < 520 ? 4 : 6), a0 = Math.min(tk[0], lo), a1 = Math.max(tk[tk.length - 1], hi), X = v => lab + (v - a0) / (a1 - a0 || 1) * iw;
      const root = sumSvg(host, W, H, title), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      const tt = svg('text', { x: 0, y: 14 }, ax); tt.textContent = title; tt.style.fontWeight = '600'; tt.style.fill = 'var(--ink-2)';
      for (const v of tk) { const x = X(v); svg('line', { x1: x, x2: x, y1: 24, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = fmt(v); }
      R.forEach((s, i) => {
        const y = 30 + i * rowH + rowH / 2, v = get(s.w);
        const l = svg('text', { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = shortName(s.name, W < 520 ? 9 : 16); l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
        const ln = svg('line', { x1: X(v[0]), x2: X(v[4]), y1: y, y2: y, 'stroke-width': 1.5 }, root); ln.style.stroke = s.color;
        const bar = svg('rect', { x: X(v[1]), y: y - 7, width: Math.max(2, X(v[3]) - X(v[1])), height: 14, rx: 3 }, root); bar.style.fill = s.color; bar.style.opacity = s.bench ? '0.45' : '0.8';
        const md = svg('line', { x1: X(v[2]), x2: X(v[2]), y1: y - 10, y2: y + 10, 'stroke-width': 3 }, root); md.style.stroke = 'var(--ink)';
        svg('title', null, bar).textContent = `${s.name} · 최저 ${fmt(v[0])} · 하위 10% ${fmt(v[1])} · 중앙 ${fmt(v[2])} · 상위 10% ${fmt(v[3])} · 최고 ${fmt(v[4])}`;
      });
    };
    one(`아무 때나 ${Y}년 보유 — CAGR`, w => [w.cmin, w.c10, w.c50, w.c90, w.cmax], v => (v * 100).toFixed(0) + '%');
    one(`아무 때나 ${Y}년 보유 — 그 안의 MDD`, w => [w.mmin, w.m10, w.m50, w.m90, w.mmax], v => (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%');
  }
  $('#sum-y').addEventListener('click', e => { const b = e.target.closest('button[data-y]'); if (!b) return; state.sumY = +b.dataset.y; if (state.sum) { $('#c-sum-rng').innerHTML = ''; drawSumRng(state.sum); } });

  /* ④ AI pick: my tickers, my MDD and recovery limits, one mix kept for the whole period */
  function sumCapNow() { if (state.sumCap == null) { const hi = fieldNum('#o-hi', 30) / 100; state.sumCap = SUM_CAPS.reduce((a, b) => (Math.abs(b - hi) < Math.abs(a - hi) ? b : a), 0.3); } return state.sumCap; }
  function sumUwNow() { if (state.sumUw == null) state.sumUw = +$('#o-uw').value || 0; return state.sumUw; }
  (function buildSumCtl() {
    const c = $('#sum-cap'); SUM_CAPS.forEach(v => { const o = el('option', null, v >= 1 ? '제한 없음' : `${Math.round(v * 100)}% 까지`); o.value = v; c.appendChild(o); });
    const u = $('#sum-uw'); [...$('#o-uw').options].forEach(op => { const o = el('option', null, op.textContent); o.value = op.value; u.appendChild(o); });
    c.addEventListener('change', () => { state.sumCap = +c.value; sumPick(true); });
    u.addEventListener('change', () => { state.sumUw = +u.value; sumPick(true); });
  })();
  function sumPick(render) {
    const o = state.opt, K = o && o.keep, TR = o && o.trust; state.sumAI = null;
    if (!TR || !TR.T || !TR.T.ok) { if (render) renderSumAI(); return; }
    const cap = sumCapNow(), uw = sumUwNow(), P = K.P;
    state.sumAI = withUnit(!!o.real, () => {
      const r = BT.trustPick(P, TR.T, { lo: 0, hi: cap >= 1 ? 10 : cap, uw });
      const mk = (p, extra) => p ? Object.assign({ p, tr: trustOf(p.w.map(x => x[0]), p.w.map(x => x[1]), o.s, o.end, o.rule, false, P.evaluated, TR.VSR) }, extra || {}) : null;
      const rec = r ? mk(BT.optPoint(P, r.i), { info: r }) : null;
      const sb = BT.optSelect(P, { kind: 'cap', cap: cap >= 1 ? 10 : cap, uw });
      const best = sb && sb.feasible && (!r || sb.i !== r.i) ? mk(BT.optPoint(P, sb.i)) : null;
      const pp = predPick(P, TR.T, 0, cap >= 1 ? 10 : cap, uw, o);
      const pred = pp && (!r || pp.i !== r.i) && (!sb || pp.i !== sb.i) ? mk(pp) : null;
      const mine = validPorts().map(vp => { const [cs, ce] = BT.commonRange(vp.info.tickers, o.mode); if (cs > o.s || ce < o.end) return null; const st = BT.stats(BT.backtest(vp.info.tickers, vp.info.weights, o.s, o.end, o.rule, false)); return { name: vp.name, color: PCOL[vp.i], x: -st.mdd, y: st.cagr }; }).filter(Boolean);
      return { cap, uw, rec, best, pred, mine };
    }, o.cur);
    if (render) renderSumAI();
  }
  let sumTick = null;
  function renderSumAI() {
    const host = $('#sum-ai'), st = $('#sum-ai-st'); if (!host) return;
    host.innerHTML = '';
    $('#sum-cap').value = String(sumCapNow()); $('#sum-uw').value = String(sumUwNow());
    const chips = $('#sum-tk'); chips.innerHTML = '';
    for (const t of [...state.optSel]) chips.appendChild(etfBtn(t, 'chip fix-chip'));
    const o = state.opt; clearInterval(sumTick); sumTick = null;
    const stale = o && state.last && o.key !== optKey();
    $('#sum-run').hidden = !(!o && !optBusy) && !stale;
    $('#sum-run').textContent = stale ? '바뀐 설정으로 다시 계산' : 'AI 추천 계산하기';
    if (optBusy || (o && !o.trust)) {
      st.textContent = '계산 중… ' + ($('#o-status').textContent || '');
      $('#sum-prog').hidden = false; $('#sum-prog i').style.width = $('#o-prog').style.width || '0%';
      sumTick = setInterval(() => { if (!optBusy && state.opt && state.opt.trust) { clearInterval(sumTick); sumPick(true); return; } st.textContent = '계산 중… ' + ($('#o-status').textContent || ''); $('#sum-prog i').style.width = $('#o-prog').style.width || '0%'; }, 400);
      drawSumAI(); return;
    }
    $('#sum-prog').hidden = true;
    if (!o) { st.textContent = state.last ? '이 탭을 열면 고른 종목의 모든 비중 조합을 계산해 추천해요(몇 초 걸려요).' : ''; drawSumAI(); return; }
    if (!o.trust || !o.trust.T || !o.trust.T.ok) { st.textContent = o.keep && o.keep.P && !o.keep.P.ok ? `추천할 수 없어요: ${o.keep.P.reason}` : (o.trust && o.trust.T && o.trust.T.reason) || '분석 기간 전체로 계산할 수 없어요.'; drawSumAI(); return; }
    if (!state.sumAI) sumPick(false);
    const A = state.sumAI, K = o.keep;
    st.textContent = `${BT.label(o.s)}~${BT.label(o.end)} (${monthsTxt(o.end - o.s + 1)}) · 고른 종목 ${K.P.K}개로 만든 ${K.P.evaluated.toLocaleString('ko-KR')}개 비중 조합 · ${o.step * 100}% 단위 · 리밸런싱 ${REBAL_TXT[o.rule]}` + (stale ? ' · 설정이 바뀌어 다시 계산이 필요해요' : '') + (K.P.excluded.length ? ` · 전체 기간 데이터가 없어 제외: ${listShort(K.P.excluded.map(x => x.t), 4)}` : '');
    if (!A || !A.rec) { host.appendChild(el('p', 'notice warn', `전체 기간 MDD ${A && A.cap < 1 ? Math.round(A.cap * 100) + '% 이내' : ''}${A && A.uw ? `, 최장 회복 ${dur(A.uw)} 이내` : ''}를 지킨 조합이 없어요. 감당할 낙폭을 늘리거나 채권·현금성 종목을 대상에 넣어 보세요.`)); drawSumAI(); return; }
    const R = A.rec.tr, p = A.rec.p, w10 = R.W[10] || R.W[R.top];
    const card = el('div', 'ai-rec');
    const hd = el('div', 'ai-h'); hd.append(el('span', 'ai-badge', 'AI 추천'), el('h3', null, `MDD ${A.cap >= 1 ? '제한 없음' : Math.round(A.cap * 100) + '% 이내'}${A.uw ? ` · 회복 ${dur(A.uw)} 이내` : ''}에서 오래 들고 갈 비중`));
    card.appendChild(hd);
    const kv = el('div', 'ai-kv');
    const cell = (k, v, sub, neg) => { const d = el('div'); d.append(el('span', null, k), el('b', neg ? 'neg' : null, v)); if (sub) d.appendChild(el('i', null, sub)); kv.appendChild(d); };
    cell('CAGR', pct(R.st.cagr, 1), `전체 ${monthsTxt(o.end - o.s + 1)}`);
    cell('MDD', mpct1(R.st.mdd), R.st.mddInfo.mdd < 0 ? `${R.st.mddInfo.peakLabel}→${R.st.mddInfo.troughLabel}` : null, true);
    cell('최장 회복', R.st.uw.months ? dur(R.st.uw.months) + (R.st.uw.ongoing ? '+' : '') : '없음');
    cell('예측 가능성', R.score == null ? '–' : `${Math.round(R.score)} · ${gradeOf(R.score)}`, w10 ? `${w10.Y}년 CAGR ${pct(w10.c10, 1)}~${pct(w10.c90, 1)}` : null);
    card.appendChild(kv);
    card.appendChild(wbars(p.w, 'var(--p3)'));
    const why = el('ul', 'ai-why');
    const li = t => why.appendChild(el('li', null, t));
    li(`전체 기간 MDD ${mpct1(R.st.mdd)}로 감당할 한도 안이에요. 같은 한도를 지킨 조합 ${A.rec.info.of.toLocaleString('ko-KR')}개 중에서 골랐어요.`);
    li(`분석 기간을 ${o.trust.T.B}개 시기로 나눠 모든 시기에 고르게 좋았고, 비중을 한 칸씩 바꾼 이웃 조합 ${A.rec.info.nb}개도 비슷하게 좋아요. 최고 CAGR만 보고 고르는 것보다 과최적화가 적은 방식이에요(아래 ‘결과와 검증’).`);
    li(`신빙성 점검 ${R.pass}/${R.checks.length} 통과 (${R.checks.map(c => (c.ok ? '✓ ' : '! ') + c.k).join(' · ')}). 유의성은 ${K.P.evaluated.toLocaleString('ko-KR')}개 조합을 시험한 것을 감안한 DSR ${pct(R.sh.dsr, 0)}예요.`);
    const wd = el('details', 'more in'); wd.append(el('summary', null, '추천 이유 보기'), why); card.appendChild(wd);
    card.appendChild(applyRow(p.w, `AI 추천 · MDD ${A.cap >= 1 ? '무제한' : Math.round(A.cap * 100) + '%'} · ${BT.label(o.s)}~${BT.label(o.end)}`, snapOf({ i0: o.s, i1: o.end, adjMap: null }, R.st, null)));
    host.appendChild(card);
    const alt = el('div', 'ai-alt');
    const altRow = (name, x, note) => {
      if (!x) return; const r = el('div', 'alt-r');
      const n = el('div', 'alt-n'); n.append(el('b', null, name), el('span', null, note));
      const v = el('div', 'alt-v', `CAGR ${pct(x.tr.st.cagr, 1)} · MDD ${mpct1(x.tr.st.mdd)} · 예측 가능성 ${x.tr.score == null ? '–' : Math.round(x.tr.score)}`);
      r.append(n, v, el('p', 'alt-w', wText(x.p.w)), applyRow(x.p.w, `${name} · MDD ${A.cap >= 1 ? '무제한' : Math.round(A.cap * 100) + '%'}`, snapOf({ i0: o.s, i1: o.end, adjMap: null }, x.tr.st, null)));
      alt.appendChild(r);
    };

    if (alt.childNodes.length) { const d = el('details', 'more'); d.append(el('summary', null, `같은 조건의 다른 선택 ${alt.childNodes.length}개 보기`), alt); host.appendChild(d); }
    drawSumAI(); renderSumPbo();
  }
  function renderSumPbo() {
    const host = $('#sum-pbo'); if (!host) return; host.innerHTML = '';
    const o = state.opt, pb = o && o.trust && o.trust.pbo; if (!pb) return;
    host.appendChild(el('h4', null, '고르는 방식의 과최적화 확률 (PBO)'));
    host.appendChild(el('p', 'help', '낮을수록 좋아요. 빨간 점선(50%)을 넘으면 그 방식으로 고른 조합은 믿기 어려워요.'));
    const W = Math.max(280, host.clientWidth || 600), rows = [['rob', 'AI 추천 방식 (시기 일관성)'], ['sh', '샤프 비율 최고 고르기'], ['cagr', 'CAGR 최고 고르기']];
    const lab = W < 520 ? 0 : 200, rowH = W < 520 ? 44 : 30, H = 10 + rows.length * rowH + 22, iw = W - lab - 50;
    const X = v => lab + v * iw;
    const root = sumSvg(host, W, H, '고르는 방식별 과최적화 확률'), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of [0, 0.25, 0.5, 0.75, 1]) { const x = X(v); svg('line', { x1: x, x2: x, y1: 6, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = Math.round(v * 100) + '%'; }
    const half = svg('line', { x1: X(0.5), x2: X(0.5), y1: 4, y2: H - 18, 'stroke-width': 2, 'stroke-dasharray': '4 3' }, root); half.style.stroke = 'var(--neg)';
    rows.forEach(([k, name], i) => {
      const R = pb[k], y = 10 + i * rowH + (W < 520 ? 26 : rowH / 2);
      const l = svg('text', W < 520 ? { x: 0, y: y - 14 } : { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = name; l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
      const b = svg('rect', { x: lab, y: y - 8, width: Math.max(2, X(R.pbo) - lab), height: 16, rx: 3 }, root); b.style.fill = R.pbo >= 0.5 ? 'var(--neg)' : k === 'rob' ? 'var(--p3)' : 'var(--bench)';
      const t = svg('text', { x: X(R.pbo) + 6, y: y + 4 }, ax); t.textContent = pct(R.pbo, 0); t.style.fill = 'var(--ink)'; t.style.fontWeight = '600';
    });
  }
  /* ④ map: every whole-period mix as a dot (CAGR vs MDD), the limit, the AI pick and my portfolios */
  function drawSumAI() {
    const host = $('#c-sum-map'); if (!host) return; host.innerHTML = ''; $('#lg-sum-map').innerHTML = '';
    const o = state.opt, A = state.sumAI, ok = !!(o && o.keep && o.keep.P.ok && A && A.rec);
    $('#sum-map-wrap').hidden = !ok; if (!ok || !isShown(host)) return;
    const P = o.keep.P, S = P.store, ids = Array.from(new Set(P.sample.concat(P.front)));
    const W = Math.max(280, host.clientWidth || 600), H = W < 520 ? 300 : 340, m = { l: 46, r: 12, t: 12, b: 34 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    let xmax = 0.05, ymin = Infinity, ymax = -Infinity; for (const i of ids) { xmax = Math.max(xmax, -S.mdd[i]); ymin = Math.min(ymin, S.cagr[i]); ymax = Math.max(ymax, S.cagr[i]); }
    for (const q of A.mine) { xmax = Math.max(xmax, q.x); ymin = Math.min(ymin, q.y); ymax = Math.max(ymax, q.y); }
    const xt = linTicks(0, xmax * 1.03, W < 520 ? 4 : 6), xm = Math.max(xt[xt.length - 1], xmax * 1.03);
    const pad = (ymax - ymin) * 0.06 || 0.01, yt = linTicks(ymin - pad, ymax + pad, 5), y0 = Math.min(yt[0], ymin - pad), y1 = Math.max(yt[yt.length - 1], ymax + pad);
    const X = v => m.l + v / xm * iw, Y = v => m.t + ih - (v - y0) / (y1 - y0) * ih;
    const root = sumSvg(host, W, H, '모든 비중 조합의 CAGR과 MDD, AI 추천 위치'), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of yt) { const y = Y(v); if (y < m.t - 1 || y > m.t + ih + 1) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    for (const v of xt) { const x = X(v); if (x > m.l + iw + 1) continue; svg('text', { x, y: H - 18, 'text-anchor': 'middle' }, ax).textContent = v ? '−' + (v * 100).toFixed(0) + '%' : '0%'; }
    svg('text', { x: m.l + iw / 2, y: H - 3, 'text-anchor': 'middle' }, ax).textContent = '전체 기간 MDD →';
    if (A.cap < 1 && A.cap < xm) { const sh = svg('rect', { x: X(A.cap), y: m.t, width: m.l + iw - X(A.cap), height: ih }, root); sh.style.fill = 'var(--neg)'; sh.style.opacity = '0.07';
      const cl = svg('line', { x1: X(A.cap), x2: X(A.cap), y1: m.t, y2: m.t + ih, 'stroke-width': 1.5, 'stroke-dasharray': '5 4' }, root); cl.style.stroke = 'var(--neg)';
      const ct = svg('text', { x: X(A.cap) + 4, y: m.t + 12 }, ax); ct.textContent = `감당 한도 ${Math.round(A.cap * 100)}%`; ct.style.fill = 'var(--neg)'; }
    const gp = svg('g', null, root);
    for (const i of ids) { const c = svg('circle', { cx: X(-S.mdd[i]).toFixed(1), cy: Y(S.cagr[i]).toFixed(1), r: 1.8 }, gp); c.style.fill = 'var(--bench)'; c.style.opacity = '0.35'; }
    let fd = ''; for (const i of P.front) fd += (fd ? 'L' : 'M') + X(-S.mdd[i]).toFixed(1) + ',' + Y(S.cagr[i]).toFixed(1);
    const fr = svg('path', { d: fd, fill: 'none', 'stroke-width': 1.5 }, root); fr.style.stroke = 'var(--ink-2)';
    const items = [{ name: '모든 조합', color: 'var(--bench)' }, { name: '같은 MDD에서 가장 높은 CAGR', color: 'var(--ink-2)' }];
    for (const q of A.mine) { const r = svg('rect', { x: X(q.x) - 5, y: Y(q.y) - 5, width: 10, height: 10, 'stroke-width': 2 }, root); r.style.fill = q.color; r.style.stroke = 'var(--panel)'; svg('title', null, r).textContent = `${q.name} · CAGR ${pct(q.y, 1)} · MDD −${(q.x * 100).toFixed(1)}%`; items.push({ name: q.name, color: q.color }); }
    const mark = (x, color, label, big) => { if (!x) return; const st = x.tr.st; const c = svg(big ? 'path' : 'circle', big ? { d: `M${X(-st.mdd)},${Y(st.cagr) - 10}L${X(-st.mdd) + 10},${Y(st.cagr)}L${X(-st.mdd)},${Y(st.cagr) + 10}L${X(-st.mdd) - 10},${Y(st.cagr)}Z`, 'stroke-width': 2.5 } : { cx: X(-st.mdd), cy: Y(st.cagr), r: 6, 'stroke-width': 2.5 }, root); c.style.fill = color; c.style.stroke = 'var(--panel)'; svg('title', null, c).textContent = `${label} · CAGR ${pct(st.cagr, 1)} · MDD ${mpct1(st.mdd)}`; items.push({ name: label, color }); };
    mark(A.best, 'var(--warn)', '최고 CAGR'); mark(A.pred, 'var(--focus)', '가장 일정함'); mark(A.rec, 'var(--ink)', 'AI 추천', true);
    if (A.rec) { const st = A.rec.tr.st, tx = svg('text', { x: X(-st.mdd) - 12, y: Y(st.cagr) - 12, 'text-anchor': 'end', 'stroke-width': 4, 'paint-order': 'stroke' }, root); tx.textContent = 'AI 추천'; tx.style.fill = 'var(--ink)'; tx.style.stroke = 'var(--panel)'; tx.style.fontWeight = '700'; tx.style.fontFamily = 'var(--font-sans)'; tx.style.fontSize = '12px'; }
    legend($('#lg-sum-map'), items, false, true);
  }
