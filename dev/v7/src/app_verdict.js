  /* ======================= v8.0: plain verdicts — how far to trust the backtest, and the AI pick checked the same way ======================= */
  const lvOf = (s, p) => { const a = s == null ? 0 : s >= 80 ? 2 : s >= 60 ? 1 : 0, b = p == null ? 0 : p >= 2 ? 2 : p >= 1 ? 1 : 0, t = a + b; return t >= 4 ? ['hi', '믿을 만해요'] : t >= 2 ? ['mid', '어느 정도 믿을 만해요'] : ['lo', '조심해서 보세요']; };
  const luckGrade = p => (p == null ? '–' : p >= 2 ? '높음' : p >= 1 ? '보통' : '낮음');
  /* a small meter: 0–100 with the grade bands */
  function meter(v, cls) { const m = el('div', 'vm ' + (cls || '')); const f = el('i'); f.style.width = Math.max(2, Math.min(100, v || 0)) + '%'; m.appendChild(f); return m; }
  function dots(n, of) { const d = el('div', 'vd4'); for (let i = 0; i < of; i++) d.appendChild(el('i', i < n ? 'on' : null)); return d; }
  /* range bar for "if I hold it Y years from any month": 10th–90th percentile, median, 0 */
  function rangeLine(w, lo, hi) {
    const r = el('div', 'vr'), X = v => ((v - lo) / (hi - lo) * 100).toFixed(2) + '%';
    const z = el('i', 'vr-0'); z.style.left = X(0); r.appendChild(z);
    const b = el('i', 'vr-b' + (w.c10 < 0 ? ' neg' : '')); b.style.left = X(w.c10); b.style.width = `calc(${X(w.c90)} - ${X(w.c10)})`; r.appendChild(b);
    const m = el('i', 'vr-m'); m.style.left = X(w.c50); r.appendChild(m);
    const a = el('span', 'vr-a', pct(w.c10, 1)); a.style.left = X(w.c10); const c = el('span', 'vr-c', pct(w.c90, 1)); c.style.left = X(w.c90);
    r.append(a, c); return r;
  }
  function verdictCard(name, color, T, extra) {
    const card = el('div', 'vcard');
    const [lv, txt] = lvOf(T.score, T.pass);
    const hd = el('div', 'vc-h'); const k = el('span', 'key'); k.style.background = color; hd.append(k, el('b', null, name), el('span', 'vbadge ' + lv, txt)); card.appendChild(hd);
    const row = (lab, sub, right, body) => { const r = el('div', 'vc-r'); const l = el('div', 'vc-l'); l.append(el('b', null, lab), el('small', null, sub)); r.append(l, right); if (body) r.appendChild(body); card.appendChild(r); };
    const w = T.top ? T.W[T.top] : null;
    const r1 = el('div', 'vc-m'); r1.append(meter(T.score, T.score >= 80 ? 'hi' : T.score >= 60 ? 'mid' : 'lo'), el('em', null, T.score == null ? '–' : `${Math.round(T.score)} · ${gradeOf(T.score)}`));
    row('정합성', '언제 시작해도 비슷했나', r1, el('p', 'vc-p', w ? `${T.top}년씩 들고 있었다면 시작한 달에 따라 CAGR ${pct(w.c10, 1)} ~ ${pct(w.c90, 1)} (차이 ${((w.c90 - w.c10) * 100).toFixed(1)}%p), 구간 MDD ${mpct1(w.m10)} ~ ${mpct1(w.m90)}` : '3년보다 짧아 판단할 수 없어요'));
    const r2 = el('div', 'vc-m'); r2.append(dots(T.pass || 0, T.checks ? T.checks.length : 2), el('em', null, T.checks ? `${T.pass}/${T.checks.length} · ${luckGrade(T.pass)}` : '–'));
    const bad = T.checks ? T.checks.filter(c => !c.ok) : [];
    row('신빙성', '운이나 우연은 아닌가', r2, el('p', 'vc-p', !T.checks ? '' : bad.length ? '주의: ' + bad.map(c => `${c.k}(${c.why})`).join(' · ') : '운으로 나온 결과로 볼 근거가 없어요 — 유의성 · 비중 민감도 모두 통과'));
    if (w) {
      const lo = Math.min(-0.02, w.c10 - 0.02), hi = Math.max(0.12, w.c90 + 0.02);
      const f = el('div', 'vc-f'); f.append(el('b', null, `앞으로 ${T.top}년을 과거에 비춰 보면`), rangeLine(w, lo, hi));
      f.appendChild(el('p', 'vc-p', `과거에 아무 달에나 시작한 ${T.top}년 중 80%가 연 ${pct(w.c10, 1)} ~ ${pct(w.c90, 1)} 사이였어요(가운데 ${pct(w.c50, 1)}). ` + (w.loss > 0 ? `${pct(w.loss, 0)}의 구간은 ${T.top}년 뒤에도 손실이었어요.` : `${T.top}년 뒤 손실이었던 구간은 없었어요.`) + ' 미래를 보장하지는 않아요.'));
      card.appendChild(f);
    }
    if (extra) card.appendChild(extra);
    return card;
  }
  function renderVerdict() {
    const host = $('#vd-cards'); if (!host) return; host.innerHTML = '';
    const S = state.sum; if (!S || !S.rows) { host.appendChild(el('p', 'empty', '비중 합계가 100%인 포트폴리오가 생기면 여기에 판정이 나와요.')); return; }
    const rows = S.rows.filter(r => !r.x.bench && r.T);
    if (!rows.length) { host.appendChild(el('p', 'empty', '판정을 계산하는 중이에요…')); return; }
    for (const r of rows) host.appendChild(verdictCard(sumName(r.x), r.x.color, r.T));
  }

  /* ---------- AI pick: its own backtest and the same checks, next to my portfolios ---------- */
  let aiKey = null;
  function aiCheckData() {
    const o = state.opt, A = state.sumAI; if (!o || !A || !A.rec) return null;
    const key = o.key + '|' + JSON.stringify(A.rec.p.w) + '|' + validPorts().map(v => v.i + ':' + v.info.tickers.join(',') + ':' + v.info.weights.join(',')).join(';');
    if (aiKey === key && state.aiChk) return state.aiChk;
    aiKey = key;
    state.aiChk = withUnit(!!o.real, () => {
      const out = [];
      const tk = A.rec.p.w.map(x => x[0]), ws = A.rec.p.w.map(x => x[1]);
      out.push({ name: 'AI 추천', color: 'var(--ink)', ai: true, w: A.rec.p.w, T: A.rec.tr, res: BT.backtest(tk, ws, o.s, o.end, o.rule, false) });
      for (const vp of validPorts()) {
        const [cs, ce] = BT.commonRange(vp.info.tickers, o.mode); if (cs > o.s || ce < o.end) continue;
        out.push({ name: vp.name, color: PCOL[vp.i], T: trustOf(vp.info.tickers, vp.info.weights, o.s, o.end, o.rule, false, 1, 0), res: BT.backtest(vp.info.tickers, vp.info.weights, o.s, o.end, o.rule, false) });
      }
      return { rows: out, s: o.s, e: o.end, N: A.rec.info ? A.rec.info.of : null };
    }, o.cur);
    return state.aiChk;
  }
  function renderAICheck() {
    const host = $('#ai-cards'); if (!host) return;
    host.innerHTML = ''; $('#ai-kpi').innerHTML = ''; $('#ai-say').textContent = '';
    const D = aiCheckData(); $('#sec-ai-check').classList.toggle('empty-sec', !D);
    if (!D) { $('#ai-say').textContent = 'AI 추천이 계산되면 그 비중의 백테스트 결과와 검증을 내 포트폴리오와 나란히 보여줘요.'; drawAICheck(); return; }
    const ai = D.rows[0], me = D.rows.find(r => !r.ai);
    $('#ai-when').textContent = `${BT.label(D.s)}~${BT.label(D.e)} · 같은 기간, 같은 리밸런싱으로 비교`;
    if (me) {
      const dc = ai.T.st.cagr - me.T.st.cagr, dm = ai.T.st.mdd - me.T.st.mdd;
      $('#ai-say').textContent = `AI 추천은 ‘${me.name}’보다 CAGR ${ppTxt(dc)}, MDD ${dm > 0.0005 ? (dm * 100).toFixed(1) + '%p 얕음' : dm < -0.0005 ? (-dm * 100).toFixed(1) + '%p 깊음' : '같음'}, 정합성 ${Math.round(ai.T.score || 0)} vs ${Math.round(me.T.score || 0)}, 신빙성 ${ai.T.pass}/${ai.T.checks.length} vs ${me.T.pass}/${me.T.checks.length}예요.`;
    }
    // KPI table
    const t = el('table', 'aikpi'), th = el('thead'), hr = el('tr');
    ['', 'CAGR', 'MDD', '최장 회복', '정합성', '신빙성'].forEach(s => hr.appendChild(el('th', null, s))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const r of D.rows) {
      const tr = el('tr', r.ai ? 'ai' : null); const h = el('th'); const k = el('span', 'key'); k.style.background = r.color; h.append(k, document.createTextNode(' ' + r.name)); tr.appendChild(h);
      const st = r.T.st;
      tr.append(el('td', null, pct(st.cagr, 1)), (() => { const td = el('td', 'neg', mpct1(st.mdd)); const t2 = mddRecTx(st); if (t2) td.appendChild(el('small', 'sub', ' ' + t2)); return td; })(), el('td', null, st.uw.months ? dur(st.uw.months) + (st.uw.ongoing ? '+' : '') : '없음'), el('td', null, r.T.score == null ? '–' : `${Math.round(r.T.score)} ${gradeOf(r.T.score)}`), el('td', null, `${r.T.pass}/${r.T.checks.length}`));
      tb.appendChild(tr);
    }
    t.appendChild(tb); const tw = el('div', 'tbl-wrap'); tw.appendChild(t); $('#ai-kpi').appendChild(tw);
    // verdict cards: AI first
    const ex = el('div', 'vc-x');
    const pb = state.opt && state.opt.trust && state.opt.trust.pbo && state.opt.trust.pbo.rob;
    if (pb) { const r = el('div', 'vc-r'); const l = el('div', 'vc-l'); l.append(el('b', null, '과최적화 확률'), el('small', null, 'AI가 고르는 방식 자체')); const m = el('div', 'vc-m'); m.append(meter(100 - pb.pbo * 100, pb.pbo < 0.25 ? 'hi' : pb.pbo < 0.5 ? 'mid' : 'lo'), el('em', null, `${pct(pb.pbo, 0)} · ${pb.pbo < 0.25 ? '낮음' : pb.pbo < 0.5 ? '보통' : '높음'}`)); r.append(l, m, el('p', 'vc-p', `분석 기간을 시기별로 나눠 ‘한쪽 시기로 고른 조합이 다른 시기에서 하위 절반으로 떨어진 비율’이에요. 50%를 넘으면 그 방식으로 고른 비중은 믿기 어려워요. (참고: CAGR 최고만 고르는 방식은 ${pct(state.opt.trust.pbo.cagr.pbo, 0)})`)); ex.appendChild(r); }
    ex.appendChild(el('p', 'small muted vc-n', `유의성은 ${D.N ? D.N.toLocaleString('ko-KR') + '개 ' : ''}조합 중에서 고른 것을 감안해(DSR) 내 포트폴리오보다 더 엄격하게 따져요.`));
    host.appendChild(verdictCard('AI 추천', 'var(--ink)', ai.T, ex));
    renderAIWF(); if (state.layout !== 'tabs' || state.tab === 'g-opt') setTimeout(runAIWF, 150);
    drawAICheck();
  }
  function drawAICheck() {
    const host = $('#c-ai'); if (!host) return; host.innerHTML = ''; $('#lg-ai').innerHTML = '';
    const D = state.aiChk && aiKey ? state.aiChk : null; if (!D || !$('#ai-kpi').childNodes.length || !isShown(host)) return;
    valDdChart(host, $('#lg-ai'), D.s, D.rows.map(r => ({ name: r.name, color: r.color, vals: r.res.vals, wide: r.ai })));
    drawAIWF();
  }
  /* value (log) over drawdown, several series */
  function valDdChart(host, lgHost, i0, series) {
    const n = series[0].vals.length - 1, W = Math.max(280, host.clientWidth || 600), H1 = W < 520 ? 190 : 230, H2 = W < 520 ? 100 : 120, gap = 16, m = { l: 46, r: 10, t: 8, b: 22 };
    const H = m.t + H1 + gap + H2 + m.b, iw = W - m.l - m.r;
    legend(lgHost, series.map(s => ({ name: s.name, color: s.color, bench: !!s.dash })), true);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '자산 성장과 고점 대비 낙폭' }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root), X = t => m.l + t / n * iw;
    let lo = Infinity, hi = -Infinity; for (const s of series) for (const v of s.vals) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const a0 = Math.log(lo * 0.95), a1 = Math.log(hi * 1.05), Y1 = v => m.t + H1 - (Math.log(v) - a0) / (a1 - a0) * H1;
    for (const v of logTicks(lo * 0.95, hi * 1.05)) { const y = Y1(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = fmtMoneyShort(v * state.initial); }
    const dds = series.map(s => BT.drawdowns(s.vals)); let dmin = 0; for (const a of dds) for (const v of a) dmin = Math.min(dmin, v);
    const top2 = m.t + H1 + gap, Y2 = v => top2 + (v / (dmin * 1.05 || -0.01)) * H2;
    for (const v of linTicks(dmin * 1.05, 0, 3)) { const y = Y2(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    const lab = svg('text', { x: m.l + 4, y: top2 + 11 }, ax); lab.textContent = '고점 대비 낙폭';
    const years = []; for (let t = 0; t <= n; t++) { const [y, mo] = BT.ym(i0 + t); if (mo === 1) years.push([t, y]); }
    const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(iw / 56))));
    years.forEach(([t, y], i) => { if (i % every) return; svg('text', { x: X(t), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = y; });
    const path = (vals, Y, color, wd, dash) => { let d = ''; for (let t = 0; t < vals.length; t++) d += (t ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(vals[t]).toFixed(1); const p = svg('path', { d, fill: 'none', 'stroke-width': wd, 'stroke-linejoin': 'round' }, root); p.style.stroke = color; if (dash) p.setAttribute('stroke-dasharray', '5 4'); };
    series.slice().reverse().forEach((s, k) => { const i = series.length - 1 - k; path(s.vals, Y1, s.color, s.wide ? 2.4 : 1.6, s.dash); path(dds[i], Y2, s.color, s.wide ? 1.8 : 1.2, s.dash); });
  }
