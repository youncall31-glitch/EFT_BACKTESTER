  /* ======================= v10.5: was the realistic method right? — at each past quarter, predict with only the data up to then, compare with the next 10 years ======================= */
  state.rlbt = { m: 'c', off: {}, hist: true };
  let rlBtKey = null, rlBtRes = null, rlBtWait = false;
  const rlBtKeyNow = () => { const L = state.last; if (!L) return null; return JSON.stringify([L.series.filter(x => !x.bench).map(s => [s.key, s.tickers, s.weights]), L.s, L.e, state.rebal, !!L.adj, BT.isReal()]); };
  function rlBtCompute() {
    const L = state.last, H = 120, out = [];
    for (const s of L.series.filter(x => !x.bench)) {
      const pts = [];
      for (let k = L.s + 60; k + H <= L.e; k += 3) {
        const R = rlSim(s.tickers, s.weights, L.s, k, L.adj, rlAssume(k), 10, 200);
        const past = BT.stats(BT.backtest(s.tickers, s.weights, L.s, k, state.rebal, L.adj));
        const act = BT.stats(BT.backtest(s.tickers, s.weights, k + 1, k + H, state.rebal, L.adj));
        pts.push({ k, R, past, act });
      }
      out.push({ s, pts });
    }
    rlBtKey = rlBtKeyNow(); rlBtRes = out;
  }
  const yrsTx = m => (Math.abs(m) < 0.5 ? '0' : (m / 12).toFixed(1) + '년');
  const RLBT = {
    c: { t: 'CAGR', j: '과', ax: '그 뒤 10년 CAGR', pr: p => p.R.gExp, ac: p => p.act.cagr, hi: p => p.past.cagr, ok: p => p.act.cagr >= p.R.c10 && p.act.cagr <= p.R.c90, exp: 0.8, rng: '하위 10% ~ 상위 10%', f: v => pct(v, 1), d: v => `${(v * 100).toFixed(1)}%p`, band: 0.02 },
    m: { t: 'MDD', j: '와', ax: '그 뒤 10년 MDD', pr: p => p.R.m50, ac: p => p.act.mdd, hi: p => p.past.mdd, ok: p => p.act.mdd >= p.R.m10 - 1e-9, exp: 0.9, rng: '나쁜 10%보다 덜 빠짐', f: v => mpct1(v), d: v => `${(v * 100).toFixed(1)}%p`, band: 0.05 },
    u: { t: '회복 기간', j: '과', ax: '그 뒤 10년 안 최장 회복', pr: p => p.R.u50, ac: p => p.act.uw.months, hi: p => p.past.uw.months, ok: p => p.act.uw.months <= p.R.u90, exp: 0.9, rng: '나쁜 10%보다 짧음', f: v => yrsTx(v), d: v => yrsTx(v), band: 12 }
  };
  function rlBtStats(pts, M, which) {
    const P = pts.map(p => [which === 'hist' ? M.hi(p) : M.pr(p), M.ac(p)]), n = P.length; if (!n) return null;
    let b = 0, a = 0; for (const [x, y] of P) { b += y - x; a += Math.abs(y - x); }
    const mx = P.reduce((s, q) => s + q[0], 0) / n, my = P.reduce((s, q) => s + q[1], 0) / n; let sxy = 0, sxx = 0, syy = 0; for (const [x, y] of P) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
    return { n, bias: b / n, mae: a / n, r: sxx && syy ? sxy / Math.sqrt(sxx * syy) : null, hit: which === 'hist' ? null : pts.filter(M.ok).length / n };
  }
  (function buildRlBt() {
    $('#rl-bt').addEventListener('toggle', () => { if ($('#rl-bt').open) drawRlBt(); });
    $('#rl-bt-m').addEventListener('click', e => { const b = e.target.closest('button[data-m]'); if (!b) return; state.rlbt.m = b.dataset.m; drawRlBt(); });
    $('#rl-bt-p').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; state.rlbt.off[b.dataset.k] = !state.rlbt.off[b.dataset.k]; drawRlBt(); });
    $('#rl-bt-h').addEventListener('change', e => { state.rlbt.hist = e.target.checked; drawRlBt(); });
  })();
  function drawRlBt() {
    const host = $('#c-rl-bt'), st = $('#rl-bt-st'); if (!host) return;
    host.innerHTML = ''; $('#rl-bt-tbl').innerHTML = ''; $('#rl-bt-say').textContent = ''; $('#rl-bt-p').innerHTML = '';
    if (!state.last || !$('#rl-bt').open || !isShown(host)) return;
    if (rlBtKey !== rlBtKeyNow()) {
      st.textContent = '그 시점까지의 데이터만으로 분기마다 다시 계산하는 중… (몇 초 걸려요)';
      if (!rlBtWait) { rlBtWait = true; setTimeout(() => { try { rlBtCompute(); } finally { rlBtWait = false; } drawRlBt(); }, 30); }
      return;
    }
    const D = rlBtRes, S = state.rlbt, M = RLBT[S.m];
    $('#rl-bt-h').checked = S.hist;
    [...$('#rl-bt-m').querySelectorAll('button')].forEach(b => b.setAttribute('aria-pressed', b.dataset.m === S.m ? 'true' : 'false'));
    for (const g of D) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.k = g.s.key; b.setAttribute('aria-pressed', S.off[g.s.key] ? 'false' : 'true'); const k = el('span', 'key'); k.style.background = g.s.color; b.append(k, document.createTextNode(' ' + g.s.name)); $('#rl-bt-p').appendChild(b); }
    const vis = D.filter(g => !S.off[g.s.key] && g.pts.length);
    const first = D.find(g => g.pts.length);
    st.textContent = first ? `예측한 시점 ${BT.label(first.pts[0].k)} ~ ${BT.label(first.pts[first.pts.length - 1].k)} · 분기마다 · 각 점 = 그 시점의 예측과 실제 그 뒤 10년` : '분석 기간이 15년보다 짧아 점검할 수 없어요. 1 포트폴리오에서 기간을 늘려 보세요.';
    if (!vis.length) return;
    // summary for the first visible portfolio
    const g0 = vis[0], a = rlBtStats(g0.pts, M, 'real'), h = rlBtStats(g0.pts, M, 'hist');
    $('#rl-bt-say').textContent = `${g0.s.name}: 현실 기대치는 실제 ${M.t}${M.j} 평균 ${M.d(a.mae)} 어긋났어요(과거 백테스트 숫자를 그대로 믿었다면 ${M.d(h.mae)}). 실제가 예측 범위(${M.rng}) 안에 든 비율은 ${pct(a.hit, 0)}로, 범위가 정확하다면 ${pct(M.exp, 0)}여야 해요.`;
    // scatter
    const W = Math.max(280, host.clientWidth || 600), Hh = Math.min(W, W < 520 ? 320 : 420), m = { l: 50, r: 12, t: 14, b: 34 }, iw = W - m.l - m.r, ih = Hh - m.t - m.b;
    let lo = Infinity, hi = -Infinity;
    for (const g of vis) for (const p of g.pts) { for (const v of [M.pr(p), M.ac(p)].concat(S.hist ? [M.hi(p)] : [])) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
    const pad = (hi - lo) * 0.06 || 1; lo -= pad; hi += pad;
    const X = v => m.l + (v - lo) / (hi - lo) * iw, Y = v => m.t + (hi - v) / (hi - lo) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, role: 'img', 'aria-label': `예측한 ${M.t}와 실제 ${M.t}` }, host), gr = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const tk = S.m === 'u' ? linTicks(lo / 12, hi / 12, 5).map(v => v * 12) : linTicks(lo, hi, 5);
    for (const v of tk) { if (v < lo || v > hi) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: Y(v), y2: Y(v) }, gr); svg('line', { x1: X(v), x2: X(v), y1: m.t, y2: m.t + ih }, gr); const tx = S.m === 'u' ? (v / 12).toFixed(0) + '년' : (v * 100).toFixed(0) + '%'; svg('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, ax).textContent = tx; svg('text', { x: X(v), y: m.t + ih + 14, 'text-anchor': 'middle' }, ax).textContent = tx; }
    const bd = M.band, poly = svg('path', { d: `M${X(lo)},${Y(lo + bd)}L${X(hi - bd)},${Y(hi)}L${X(hi)},${Y(hi)}L${X(hi)},${Y(hi - bd)}L${X(lo + bd)},${Y(lo)}L${X(lo)},${Y(lo)}Z` }, root); poly.style.fill = 'color-mix(in srgb, var(--pos) 12%, transparent)';
    const dg = svg('line', { x1: X(lo), y1: Y(lo), x2: X(hi), y2: Y(hi), 'stroke-dasharray': '4 3', 'stroke-width': 1.5 }, root); dg.style.stroke = 'var(--ink-2)';
    if (S.hist) for (const g of vis) for (const p of g.pts) { const c = svg('circle', { cx: X(M.hi(p)), cy: Y(M.ac(p)), r: 2.6, 'stroke-width': 1 }, root); c.style.fill = 'none'; c.style.stroke = 'var(--muted)'; c.style.opacity = '0.6'; svg('title', null, c).textContent = `${g.s.name} · ${BT.label(p.k)} 과거 백테스트 ${M.f(M.hi(p))} → 실제 ${M.f(M.ac(p))}`; }
    for (const g of vis) for (const p of g.pts) { const c = svg('circle', { cx: X(M.pr(p)), cy: Y(M.ac(p)), r: 3.2 }, root); c.style.fill = g.s.color; c.style.opacity = '0.75'; svg('title', null, c).textContent = `${g.s.name} · ${BT.label(p.k)}에 예측 ${M.f(M.pr(p))} → 실제 그 뒤 10년 ${M.f(M.ac(p))}`; }
    const xl = svg('text', { x: m.l + iw, y: Hh - 3, 'text-anchor': 'end' }, ax); xl.textContent = '그 시점의 예측 →'; xl.style.fontWeight = '700';
    const yl = svg('text', { x: m.l + 4, y: m.t + 12 }, ax); yl.textContent = `↑ 실제 ${M.ax}`; yl.style.fontWeight = '700';
    // table: per portfolio, the realistic method vs taking the past backtest at face value
    const t = el('table', 'rl2'), th = el('thead'), hr = el('tr'), cg = el('colgroup'); ['c0', 'c1', 'c2', 'c3'].forEach(c => cg.appendChild(el('col', c))); t.appendChild(cg);
    ['', '평균 오차', '치우침 (실제 − 예측)', `범위 적중 (기대 ${pct(M.exp, 0)})`].forEach(x => hr.appendChild(el('th', null, x))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const g of vis) {
      const nr = el('tr', 'rl2-n'), nh = el('th'); nh.colSpan = 4; const k = el('span', 'key'); k.style.background = g.s.color; nh.append(k, document.createTextNode(` ${g.s.name} · 점 ${g.pts.length}개`)); nr.appendChild(nh); tb.appendChild(nr);
      for (const [lab, wh, cls] of [['현실 기대치', 'real', 'rl2-r'], ['과거 백테스트 그대로', 'hist', 'rl2-p']]) {
        const z = rlBtStats(g.pts, M, wh), tr = el('tr', cls); tr.appendChild(el('td', 'rl2-l', lab));
        const sg = v => { const t = M.d(Math.abs(v)); return t === '0' || /^0\.0/.test(t) ? '0' : (v > 0 ? '+' : '−') + t; };
        tr.append(el('td', null, M.d(z.mae)), el('td', null, sg(z.bias)), el('td', null, z.hit == null ? '–' : pct(z.hit, 0)));
        tb.appendChild(tr);
      }
    }
    t.appendChild(tb); const w = el('div', 'tbl-wrap rl2-w'); w.appendChild(t); $('#rl-bt-tbl').appendChild(w);
  }
