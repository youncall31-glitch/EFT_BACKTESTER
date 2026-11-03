  /* ======================= v10.7: the conclusion in one picture — realistic CAGR vs bad-case MDD, bond share sweep, with/without the fall rule ======================= */
  state.su = { pi: null, cap: 0.3 };
  const isAtk = c => c === 'eq' || c === 'lev' || c === 'cc';
  /* realistic simulation with an optional fall rule: −10% from the peak → stocks to cash; back when the stock part is above its 10-month average (re-arms at a new high or below the last trough) */
  function rlSimRule(tickers, weights, s, e, adj, A, Hy, PATHS, RULE) {
    const rets = tickers.map(t => BT.backtest([t], [1], s, e, 'N', adj).r), n = rets[0].length, tw = weights.reduce((a, b) => a + b, 0), w = weights.map(v => v / tw), K = w.length;
    const sig = rets.map(sdY), gh = rets.map(geoY), cls = tickers.map(assetClass), tgt = cls.map((c, j) => rlTarget(c, sig[j], A));
    const f = tgt.map((g, j) => Math.pow((1 + g) / (1 + gh[j]), 1 / 12)), sh = rets.map((r, j) => Array.from(r, x => (1 + x) * f[j] - 1));
    const att = cls.map(isAtk), atW = w.reduce((a, v, j) => a + (att[j] ? v : 0), 0), rc = Math.pow(1 + A.cash, 1 / 12) - 1, H = Hy * 12;
    const P = PATHS || 400, rnd = rlRng(12345 + tickers.join('').length * 7 + Math.round(w[0] * 100)), cg = [], md = [], uw = [];
    const target = g => w.map((v, j) => (att[j] ? v * (1 - g) : v));
    if (n >= 24) for (let p = 0; p < P; p++) {
      let h = w.slice(), hc = 0, v = 1, pk = 1, mdd = 0, cur = 0, mx = 0, ai = 1, goal = 0, armed = true, trough = 1, lastLow = 0; const aiH = [];
      for (let t = 0; t < H;) {
        const b0 = Math.floor(rnd() * (n - 12));
        for (let q = 0; q < 12 && t < H; q++, t++) {
          let tot = 0, ar = 0; for (let j = 0; j < K; j++) { const x = sh[j][b0 + q]; h[j] *= 1 + x; tot += h[j]; if (att[j]) ar += w[j] * x; }
          hc *= 1 + rc; tot += hc;
          if (atW > 0) { ai *= 1 + ar / atW; aiH.push(ai); }
          if (tot > pk) armed = true;
          if (!armed && tot < lastLow) armed = true;
          v = tot; if (v >= pk) { pk = v; cur = 0; } else { cur++; if (cur > mx) mx = cur; const d = v / pk - 1; if (d < mdd) mdd = d; }
          let ng = goal;
          if (RULE && atW > 0) {
            let sma = null; if (aiH.length >= 10) { let sm = 0; for (let z = aiH.length - 10; z < aiH.length; z++) sm += aiH[z]; sma = sm / 10; }
            if (goal === 0) { if (armed && v / pk - 1 <= -0.10) { ng = 1; trough = v; } }
            else { if (v < trough) trough = v; if (sma != null && ai > sma) { ng = 0; armed = false; lastLow = trough; } }
          }
          const sw = ng !== goal; goal = ng;
          if (sw || (t + 1) % 12 === 0) { const tg2 = target(goal); h = tg2.map(x => x * v); hc = atW * goal * v; }
        }
      }
      cg.push(Math.pow(v, 12 / H) - 1); md.push(mdd); uw.push(mx);
    }
    const qq = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.max(0, Math.round(p * (b.length - 1))))]; };
    return { c50: qq(cg, 0.5), c10: qq(cg, 0.1), c90: qq(cg, 0.9), m50: qq(md, 0.5), m10: qq(md, 0.1), u50: qq(uw, 0.5), u90: qq(uw, 0.9), atW };
  }
  (function buildSu() {
    $('#su-p').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.su.pi = +b.dataset.p; renderSu(); });
    $('#su-cap').addEventListener('change', e => { state.su.cap = +e.target.value; renderSu(false); });
  })();
  let suKey = null;
  function suCompute(x, L) {
    const cls = x.tickers.map(assetClass), tw = x.weights.reduce((a, b) => a + b, 0), w = x.weights.map(v => v / tw), A = rlAssume(L.e), H = state.rl.H;
    const bw = w.reduce((a, v, j) => a + (isBondC(cls[j]) ? v : 0), 0), hasAtk = cls.some(isAtk);
    const one = ww => { const tk = x.tickers.filter((_, j) => ww[j] > 1e-9), wk = ww.filter(v => v > 1e-9); return { plain: rlSim(tk, wk, L.s, L.e, L.adj, A, H, 700), rule: hasAtk ? rlSimRule(tk, wk, L.s, L.e, L.adj, A, H, 700, true) : null }; };
    const cur = Object.assign({ b: bw }, one(w)), rows = [];
    if (bw > 0 && bw < 1) for (const b of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
      if (Math.abs(b - bw) < 0.005) { rows.push(cur); continue; }
      rows.push(Object.assign({ b }, one(w.map((v, j) => (isBondC(cls[j]) ? v / bw * b : v / (1 - bw) * (1 - b))))));
    }
    if (rows.length && !rows.includes(cur)) { rows.push(cur); rows.sort((a, b) => a.b - b.b); }
    return { x, cur, rows, hasAtk, bonds: x.tickers.filter((_, j) => isBondC(cls[j])) };
  }
  function renderSu(full = true) {
    const S = state.su, L = state.last; $('#su-p').innerHTML = ''; $('#su-say').innerHTML = '';
    if (!L) { drawSu(); return; }
    const vp = validPorts(); if (!vp.length) return;
    if (S.pi == null || !vp.find(p => p.i === S.pi)) S.pi = vp.find(p => /노후/.test(p.name)) ? vp.find(p => /노후/.test(p.name)).i : vp[0].i;
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === S.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#su-p').appendChild(b); }
    $('#su-cap').value = String(S.cap);
    const x = L.series.find(s => s.key === 'p' + S.pi); if (!x) return;
    const key = JSON.stringify([x.tickers, x.weights, L.s, L.e, state.rebal, !!L.adj, BT.isReal(), state.rl.H]);
    if (full || key !== suKey || !state.suRes) { state.suRes = suCompute(x, L); suKey = key; }
    const D = state.suRes, cap = S.cap;
    // the pick: highest median CAGR with bad-case MDD inside the limit, among both lines
    const cands = []; for (const r of (D.rows.length ? D.rows : [D.cur])) { cands.push({ r, k: 'plain', v: r.plain }); if (r.rule) cands.push({ r, k: 'rule', v: r.rule }); }
    let pick = null; for (const c of cands) { if (c.v.m10 < -cap - 1e-9) continue; if (!pick || c.v.c50 > pick.v.c50 + 0.0005 || (Math.abs(c.v.c50 - pick.v.c50) <= 0.0005 && c.k === 'plain' && pick.k === 'rule')) pick = c; }
    D.pick = pick;
    const bt = D.bonds.join(' · ') || '채권', cp = D.cur.plain, st = x.st;
    const li = (n, html) => { const p = el('p', 'su-l'); p.append(el('b', 'su-n', n)); const s = el('span'); s.innerHTML = html; p.appendChild(s); $('#su-say').appendChild(p); };
    li('1', `<b>과거 숫자는 부풀려져 있어요.</b> ‘${x.name}’ 과거 CAGR ${pct(st.cagr, 1)} → 지금 금리로 다시 보면 약 <b>${pct(cp.c50, 1)}</b>. MDD는 과거 ${mpct1(st.mdd)}, 앞으로 나쁘면 ${mpct1(cp.m10)}로 비슷해요.`);
    if (pick) li('2', `<b>감당할 MDD ${Math.round(cap * 100)}% 안에서 가장 높은 건</b> ${D.rows.length ? `${bt} ${Math.round(pick.r.b * 100)}%` : '지금 비중'}${pick.k === 'rule' ? ' <b>+ 하락 규칙</b>' : ''} — CAGR 약 <b>${pct(pick.v.c50, 1)}</b>, 나쁘면 MDD ${mpct1(pick.v.m10)} · 회복 ${dur(pick.v.u90)}.`);
    else li('2', `<b>감당할 MDD ${Math.round(cap * 100)}% 안에 드는 조합이 없어요.</b> 한도를 늘리거나 채권 · 현금성 종목을 넣어 보세요.`);
    li('3', `<b>숫자는 범위로 보세요.</b> 과거 검증에서 예측은 실제와 연 3%p 안팎 어긋났어요. 계획에는 ‘나쁘면’ CAGR(${pick ? pct(pick.v.c10, 1) : pct(cp.c10, 1)})을 쓰는 게 안전해요.`);
    drawSu();
  }
  function drawSu() {
    const host = $('#c-su'); if (!host) return; host.innerHTML = ''; $('#lg-su').innerHTML = '';
    const D = state.suRes, S = state.su; if (!D || !isShown(host)) return;
    const rows = D.rows.length ? D.rows : [D.cur], x = D.x, st = x.st;
    const W = Math.max(280, host.clientWidth || 600), narrow = W < 520, Hh = narrow ? 300 : 360, m = { l: 44, r: 14, t: 16, b: 36 }, iw = W - m.l - m.r, ih = Hh - m.t - m.b;
    const xs = [], ys = []; for (const r of rows) for (const v of [r.plain, r.rule]) if (v) { xs.push(-v.m10); ys.push(v.c50); }
    xs.push(-st.mdd, S.cap); ys.push(st.cagr);
    const x1 = Math.max(...xs) * 1.08, y0 = Math.max(0, Math.min(...ys) - 0.01), y1 = Math.max(...ys) + 0.01;
    const X = v => m.l + v / x1 * iw, Y = v => m.t + (y1 - v) / (y1 - y0) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, width: W, height: Hh, role: 'img', 'aria-label': '현실 CAGR과 나쁠 때 MDD' }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const zone = svg('rect', { x: X(S.cap), y: m.t, width: Math.max(0, m.l + iw - X(S.cap)), height: ih }, root); zone.style.fill = 'color-mix(in srgb, var(--neg) 8%, transparent)';
    for (const v of linTicks(0, x1, narrow ? 4 : 6)) { if (v > x1) continue; svg('line', { x1: X(v), x2: X(v), y1: m.t, y2: m.t + ih }, g); svg('text', { x: X(v), y: m.t + ih + 14, 'text-anchor': 'middle' }, ax).textContent = (v ? '−' : '') + (v * 100).toFixed(0) + '%'; }
    for (const v of linTicks(y0, y1, 5)) { if (v < y0 || v > y1) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: Y(v), y2: Y(v) }, g); svg('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    const cl = svg('line', { x1: X(S.cap), x2: X(S.cap), y1: m.t, y2: m.t + ih, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, root); cl.style.stroke = 'var(--neg)';
    const ct = svg('text', { x: X(S.cap) + 4, y: m.t + ih - 6 }, ax); ct.textContent = `감당 한도 ${Math.round(S.cap * 100)}%`; ct.style.fill = 'var(--neg)'; ct.style.fontWeight = '700';
    const lineOf = (f, col, dash, lab) => { const pts = rows.filter(r => f(r)); if (pts.length < 2) return; let d = ''; pts.forEach((r, i) => { d += (i ? 'L' : 'M') + X(-f(r).m10).toFixed(1) + ',' + Y(f(r).c50).toFixed(1); }); const p = svg('path', Object.assign({ d, fill: 'none', 'stroke-width': 2.4 }, dash ? { 'stroke-dasharray': '5 4' } : {}), root); p.style.stroke = col; pts.forEach(r => { const c = svg('circle', { cx: X(-f(r).m10), cy: Y(f(r).c50), r: 3 }, root); c.style.fill = col; svg('title', null, c).textContent = `채권 ${Math.round(r.b * 100)}%${lab || ''} · CAGR 약 ${pct(f(r).c50, 1)} · 나쁘면 MDD ${mpct1(f(r).m10)}`; }); };
    const fP = r => r.plain, fR = r => r.rule;
    lineOf(fP, 'var(--muted)', true, ''); if (D.hasAtk) lineOf(fR, 'var(--pos)', false, ' + 하락 규칙');
    // bond % labels on the plain line ends
    if (D.rows.length) for (const r of [rows[0], rows[rows.length - 1]]) { const t = svg('text', { x: X(-r.plain.m10), y: Y(r.plain.c50) + 15, 'text-anchor': 'middle' }, ax); t.textContent = `채권 ${Math.round(r.b * 100)}%`; }
    // past backtest (hollow) → today (filled) for the current mix
    const px = X(-st.mdd), py = Y(st.cagr), cx = X(-D.cur.plain.m10), cy = Y(D.cur.plain.c50);
    const ar = svg('line', { x1: px, y1: py, x2: cx, y2: cy, 'stroke-width': 1.5, 'stroke-dasharray': '2 3' }, root); ar.style.stroke = 'var(--ink-2)';
    const ph = svg('circle', { cx: px, cy: py, r: 6, 'stroke-width': 2 }, root); ph.style.fill = 'var(--panel)'; ph.style.stroke = x.color;
    const pt = svg('text', { x: px, y: py - 10, 'text-anchor': 'middle' }, ax); pt.textContent = '과거 백테스트'; pt.style.fill = 'var(--ink-2)';
    const cc = svg('circle', { cx, cy, r: 7 }, root); cc.style.fill = x.color;
    const ctx = svg('text', { x: cx, y: cy - 11, 'text-anchor': 'middle' }, ax); ctx.textContent = '지금 비중'; ctx.style.fill = 'var(--ink)'; ctx.style.fontWeight = '700';
    // the pick
    if (D.pick) { const v = D.pick.v, sx = X(-v.m10), sy = Y(v.c50), R = 9; let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; d += (i ? 'L' : 'M') + (sx + rr * Math.cos(a)).toFixed(1) + ',' + (sy + rr * Math.sin(a)).toFixed(1); } const s = svg('path', { d: d + 'Z', 'stroke-width': 1.2 }, root); s.style.fill = 'var(--warn)'; s.style.stroke = 'var(--ink)';
      const t = svg('text', { x: sx, y: sy + 22, 'text-anchor': 'middle' }, ax); t.textContent = '추천'; t.style.fill = 'var(--ink)'; t.style.fontWeight = '800'; }
    const xl = svg('text', { x: m.l + iw, y: Hh - 4, 'text-anchor': 'end' }, ax); xl.textContent = '나쁠 때 MDD (더 크게 빠짐) →'; xl.style.fontWeight = '700';
    const yl = svg('text', { x: m.l + 4, y: m.t + 12 }, ax); yl.textContent = '↑ 현실 CAGR (가운데)'; yl.style.fontWeight = '700';
    legend($('#lg-su'), [{ name: '채권 비중만 바꾸면', color: 'var(--muted)' }].concat(D.hasAtk ? [{ name: '+ 하락 규칙', color: 'var(--pos)' }] : []).concat([{ name: '○ 과거 백테스트 → ● 지금 비중(현실)', color: x.color }, { name: '★ 추천', color: 'var(--warn)' }]), false);
  }
