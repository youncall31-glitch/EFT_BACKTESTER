  /* ======================= v9.1: inputs on top, AI follows my tickers and recalculates by itself, trend-kept data side by side ======================= */
  /* ---------- AI target tickers: by default the tickers of my portfolios; any change recalculates on its own ---------- */
  state.optAuto = true;
  let aiT = null;
  function aiAuto() {
    if (!state.last || !state.opt || state.opt.key === optKey()) return;
    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;
    clearTimeout(aiT);
    aiT = setTimeout(() => {
      if (!state.opt || state.opt.key === optKey()) return;
      if (optBusy) { aiAuto(); return; }            // something else is computing: try again shortly
      runOpt(); renderSumAI();
    }, optBusy ? 800 : 400);
  }
  function syncOptSel() {
    if (!state.optAuto) return;
    const u = new Set(); validPorts().forEach(p => p.info.tickers.forEach(t => u.add(t)));
    if (!u.size) return;
    const same = u.size === state.optSel.size && [...u].every(t => state.optSel.has(t));
    if (!same) { state.optSel = u; updatePickerState(); }
  }
  function renderAITk(host) {
    host.innerHTML = '';
    for (const t of [...state.optSel].filter(known)) {
      const c = el('span', 'tkx'); const nm = etfBtn(t, 'tkx-n'); const x = el('button', 'tkx-x', '×'); x.type = 'button'; x.title = `${t} 빼기`; x.setAttribute('aria-label', `${t} 빼기`);
      x.addEventListener('click', () => { if (state.optSel.size <= 1) { toast('종목이 1개 이상 있어야 해요.'); return; } state.optAuto = false; state.optSel.delete(t); updatePickerState(); renderSumAI(); });
      c.append(nm, x); host.appendChild(c);
    }
    const sel = el('select', 'tkx-add'); sel.setAttribute('aria-label', '종목 추가');
    const o0 = el('option', null, '+ 종목 추가'); o0.value = ''; sel.appendChild(o0);
    for (const [g, list] of GROUPS) { const og = document.createElement('optgroup'); og.label = g; for (const t of list) { if (!known(t) || state.optSel.has(t)) continue; const o = el('option', null, `${t} · ${DATA.assets[t].c}`); o.value = t; og.appendChild(o); } if (og.childNodes.length) sel.appendChild(og); }
    sel.addEventListener('change', () => { const t = sel.value; if (!t) return; state.optAuto = false; state.optSel.add(t); updatePickerState(); renderSumAI(); });
    host.appendChild(sel);
    if (!state.optAuto) { const r = el('button', 'btn ghost sm', '내 포트폴리오 종목으로'); r.type = 'button'; r.addEventListener('click', () => { state.optAuto = true; syncOptSel(); renderSumAI(); }); host.appendChild(r); }
  }

  /* ---------- results: one switch for the trend-kept data, with a side-by-side view ---------- */
  state.dm3 = 'act';
  (function buildDm3() {
    $('#dm3').addEventListener('click', e => {
      const b = e.target.closest('button[data-v]'); if (!b) return;
      state.dm3 = b.dataset.v;
      if (state.dm3 === 'both' && !state.trend.on) { state.trend.on = true; const c = $('#tr-on'); if (c) c.checked = true; }
      setDataAdj(state.dm3 === 'adj');
    });
  })();
  function renderTcmp() {
    if (state.dm3 === 'adj' && !state.dataAdj) state.dm3 = 'act';
    if (state.dataAdj) state.dm3 = 'adj';
    $('#dm3').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.dm3 ? 'true' : 'false'));
    const I = state.trendInfo, fl = I && state.trend.on ? [...I.flagged] : [];
    const L = state.last, used = L ? new Set(L.series.flatMap(x => x.tickers)) : new Set(), hit = fl.filter(t => used.has(t));
    const st = $('#dm3-st');
    st.className = 'dm3-st ' + (state.dm3 === 'act' ? '' : hit.length ? 'on' : 'same');
    st.textContent = state.dm3 === 'act' ? '지금 결과: 실제 데이터' : hit.length ? `보정된 종목: ${hit.map(t => `${t}(${trendTxt(t)})`).join(', ')}` : '내 종목 중 보정 대상(최근 급등)이 없어 실제와 같아요';
    const sec = $('#sec-tcmp'); sec.hidden = state.dm3 !== 'both';
    const tb = $('#t-tcmp'); tb.innerHTML = ''; state.tcmp = null;
    if (state.dm3 !== 'both' || !L) { drawTcmp(); return; }
    const T = state.trend;
    $('#tcmp-rule').textContent = `보정 기준: 최근 ${T.R / 12}년 연평균 수익률이 그 직전 ${T.L / 12}년 추세보다 연 ${Math.round(T.thr * 100)}%p 이상 높으면, 그 최근 구간의 오르는 속도만 과거 추세로 낮춰요(월별 오르내림은 그대로).`;
    const rows = L.series.filter(x => !x.bench).map(x => {
      const a = BT.backtest(x.tickers, x.weights, L.s, L.e, state.rebal, false, state.div), b = BT.backtest(x.tickers, x.weights, L.s, L.e, state.rebal, true, state.div);
      return { x, a, b, sa: BT.stats(a), sb: BT.stats(b), hit: x.tickers.filter(t => hit.includes(t)) };
    });
    state.tcmp = { rows };
    const th = el('thead'), hr = el('tr'); ['', 'CAGR 실제 → 보정', '차이', 'MDD 실제 → 보정', '최장 회복 실제 → 보정', '최종 금액 실제 → 보정', '보정된 종목'].forEach(s => hr.appendChild(el('th', null, s))); th.appendChild(hr); tb.appendChild(th);
    const bd = el('tbody');
    for (const r of rows) {
      const tr = el('tr'); const h = el('th'); const k = el('span', 'key'); k.style.background = r.x.color; h.append(k, document.createTextNode(' ' + r.x.name)); tr.appendChild(h);
      const dc = r.sb.cagr - r.sa.cagr;
      tr.append(el('td', null, `${pct(r.sa.cagr, 2)} → ${pct(r.sb.cagr, 2)}`), el('td', Math.abs(dc) > 0.00005 ? (dc < 0 ? 'neg' : 'pos') : null, ppTxt(dc)), el('td', null, `${mpct1(r.sa.mdd)} → ${mpct1(r.sb.mdd)}`), el('td', null, `${uwTx(r.sa.uw.months, r.sa.uw.ongoing)} → ${uwTx(r.sb.uw.months, r.sb.uw.ongoing)}`), el('td', null, `${fmtMoneyShort(state.initial * r.sa.final)} → ${fmtMoneyShort(state.initial * r.sb.final)}`), el('td', null, r.hit.length ? r.hit.join(', ') : '없음 (같음)'));
      bd.appendChild(tr);
    }
    tb.appendChild(bd);
    $('#tcmp-say').textContent = hit.length
      ? `${hit.join(', ')}의 최근 급등을 과거 추세 속도로 낮추면 ` + rows.map(r => `${r.x.name} CAGR ${ppTxt(r.sb.cagr - r.sa.cagr)}`).join(' · ') + '. 차이가 클수록 그 포트폴리오의 성과가 최근 급등에 기대고 있다는 뜻이에요.'
      : '내 종목 중 최근 급등으로 보정되는 종목이 없어서 두 결과가 같아요.';
    drawTcmp();
  }
  function drawTcmp() {
    for (const id of ['#c-tcmp', '#c-tcmp-bar', '#c-tcmp-gap', '#lg-tcmp']) { const e = $(id); if (e) e.innerHTML = ''; }
    const S = state.tcmp, host = $('#c-tcmp-bar'); if (!S || !host || !isShown(host)) return;
    const lg = $('#lg-tcmp');
    const key = (cls, txt) => { const sp = el('span', 'tl'); sp.append(el('i', cls), document.createTextNode(txt)); lg.appendChild(sp); };
    key('tl-a', '실제 데이터'); key('tl-b', '추세 보정 데이터');
    // 1) paired bars: CAGR and MDD, actual (solid) vs adjusted (striped), one block per portfolio
    const rows = S.rows, W = Math.max(280, host.clientWidth || 600), narrow = W < 520, lab = narrow ? 0 : 150, bh = 13, gh = narrow ? 2 * bh + 30 : 2 * bh + 14;
    const H = 26 + rows.length * gh + 6, half = (W - lab - 20) / 2, x0c = lab + half + 20, x0m = lab + half;
    let cmax = 0, mmax = 0; for (const r of rows) { cmax = Math.max(cmax, r.sa.cagr, r.sb.cagr); mmax = Math.max(mmax, -r.sa.mdd, -r.sb.mdd); }
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '실제와 추세 보정의 CAGR · MDD' }, host), ax = svg('g', { class: 'axis' }, root);
    const defs = svg('defs', null, root);
    rows.forEach((r, i) => { const pt = svg('pattern', { id: 'tp' + i, width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs); const bg = svg('rect', { width: 6, height: 6 }, pt); bg.style.fill = r.x.color; bg.style.opacity = '0.25'; const ln = svg('rect', { width: 3, height: 6 }, pt); ln.style.fill = r.x.color; });
    const t1 = svg('text', { x: x0m - 4, y: 14, 'text-anchor': 'end' }, ax); t1.textContent = '← MDD';
    const t2 = svg('text', { x: x0c + 4, y: 14 }, ax); t2.textContent = 'CAGR →';
    rows.forEach((r, i) => {
      const y = 26 + i * gh + (narrow ? 16 : 0);
      const nm = svg('text', narrow ? { x: 0, y: y - 4 } : { x: lab - 8, y: y + bh + 4, 'text-anchor': 'end' }, ax); nm.textContent = r.x.name; nm.style.fill = 'var(--ink)'; nm.style.fontFamily = 'var(--font-sans)'; nm.style.fontSize = '12px'; nm.style.fontWeight = '600';
      [[r.sa, false], [r.sb, true]].forEach(([st, adj], k) => {
        const yy = y + k * (bh + 1), fill = adj ? `url(#tp${i})` : r.x.color;
        const wc = Math.max(1, st.cagr / (cmax || 1) * (half - 52)), bc = svg('rect', { x: x0c, y: yy, width: wc, height: bh, rx: 2 }, root); bc.style.fill = fill;
        const vc = svg('text', { x: x0c + wc + 4, y: yy + bh - 2 }, ax); vc.textContent = pct(st.cagr, 1); vc.style.fill = 'var(--ink)'; vc.style.fontWeight = adj ? '700' : '500';
        const wm = Math.max(1, -st.mdd / (mmax || 1) * (half - 52)), bm = svg('rect', { x: x0m - wm, y: yy, width: wm, height: bh, rx: 2 }, root); bm.style.fill = fill; bm.style.opacity = '0.8';
        const vm = svg('text', { x: x0m - wm - 4, y: yy + bh - 2, 'text-anchor': 'end' }, ax); vm.textContent = mpct1(st.mdd); vm.style.fill = 'var(--ink)'; vm.style.fontWeight = adj ? '700' : '500';
      });
    });
    // 2) the gap over time: (adjusted / actual − 1), so a small difference is still visible
    const gHost = $('#c-tcmp-gap'); if (!gHost) return;
    const n = rows[0].a.vals.length - 1, W2 = Math.max(280, gHost.clientWidth || 600), H2 = narrow ? 170 : 190, m = { l: 46, r: 10, t: 10, b: 22 }, iw = W2 - m.l - m.r, ih = H2 - m.t - m.b;
    const gaps = rows.map(r => { const g = new Float64Array(n + 1); for (let t = 0; t <= n; t++) g[t] = r.b.vals[t] / r.a.vals[t] - 1; return g; });
    let lo = 0, hi = 0; for (const g of gaps) for (const v of g) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (hi - lo < 0.01) { lo -= 0.005; hi += 0.005; } const pd = (hi - lo) * 0.08; lo -= pd; hi += pd;
    const X = t => m.l + t / n * iw, Y = v => m.t + (hi - v) / (hi - lo) * ih;
    const r2 = svg('svg', { viewBox: `0 0 ${W2} ${H2}`, width: W2, height: H2, role: 'img', 'aria-label': '추세 보정으로 달라진 평가액(%)' }, gHost), g2 = svg('g', { class: 'grid' }, r2), a2 = svg('g', { class: 'axis' }, r2);
    const T = state.trend, L = state.last, ws = Math.max(0, n - T.R);
    const sh = svg('rect', { x: X(ws), y: m.t, width: X(n) - X(ws), height: ih }, r2); sh.style.fill = 'var(--warn)'; sh.style.opacity = '0.1';
    const st = svg('text', { x: X(ws) - 4, y: m.t + 12, 'text-anchor': 'end' }, a2); st.textContent = `보정 구간 (최근 ${T.R / 12}년)`; st.style.fill = 'var(--warn)'; st.style.fontWeight = '700';
    for (const v of linTicks(lo, hi, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g2); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, a2).textContent = (v * 100).toFixed(Math.abs(hi - lo) < 0.05 ? 1 : 0) + '%'; }
    const z = svg('line', { x1: m.l, x2: m.l + iw, y1: Y(0), y2: Y(0), 'stroke-width': 1.5 }, r2); z.style.stroke = 'var(--ink-2)';
    const years = []; for (let t = 0; t <= n; t++) { const [y, mo] = BT.ym(L.s + t); if (mo === 1) years.push([t, y]); }
    const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(iw / 56))));
    years.forEach(([t, y], i) => { if (i % every) return; svg('text', { x: X(t), y: H2 - 6, 'text-anchor': 'middle' }, a2).textContent = y; });
    gaps.forEach((g, i) => { let d = ''; for (let t = 0; t <= n; t++) d += (t ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(g[t]).toFixed(1); const p = svg('path', { d, fill: 'none', 'stroke-width': 2 }, r2); p.style.stroke = rows[i].x.color; });
  }

