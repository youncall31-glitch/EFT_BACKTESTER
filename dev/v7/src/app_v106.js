  /* ======================= v10.6: bond share sweep — same source, same yardstick (median vs bad 10%), and past 5-year windows instead of the single worst ======================= */
  state.rlmix = { pi: null, view: 'f', cap: 0.3 };
  const RLMIX_Y = 5;
  const isBondC = c => c === 'bond' || c === 'short' || c === 'ig';
  const q10 = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.max(0, Math.round(p * (b.length - 1))))]; };
  (function buildRlMix() {
    $('#rl-mix-p').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.rlmix.pi = +b.dataset.p; renderRlMix(); });
    $('#rl-mix-v').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; state.rlmix.view = b.dataset.v; renderRlMix(false); });
    $('#rl-mix-cap').addEventListener('change', e => { state.rlmix.cap = +e.target.value; renderRlMix(false); });
  })();
  let rlMixKey = null;
  function rlMixCompute(x, L) {
    const cls = x.tickers.map(assetClass), tw = x.weights.reduce((a, b) => a + b, 0), w = x.weights.map(v => v / tw);
    const bw = w.reduce((a, v, j) => a + (isBondC(cls[j]) ? v : 0), 0);
    if (!(bw > 0) || bw >= 1) return { none: true };
    const A = rlAssume(L.e), shares = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => v / 100);
    const cur = Math.round(bw * 1000) / 1000; if (!shares.some(s => Math.abs(s - cur) < 0.005)) shares.push(cur);
    shares.sort((a, b) => a - b);
    const rows = shares.map(b => {
      const ww = w.map((v, j) => (isBondC(cls[j]) ? v / bw * b : v / (1 - bw) * (1 - b)));
      const tk = x.tickers.filter((_, j) => ww[j] > 1e-9), wk = ww.filter(v => v > 1e-9);
      const R = rlSim(tk, wk, L.s, L.e, L.adj, A, state.rl.H, 500);
      const res = BT.backtest(tk, wk, L.s, L.e, state.rebal, L.adj), v = res.vals, n = res.n, Wm = RLMIX_Y * 12, cg = [], md = [];
      for (let k = 0; k + Wm <= n; k++) { cg.push(Math.pow(v[k + Wm] / v[k], 1 / RLMIX_Y) - 1); let pk = v[k], m = 0; for (let q = k + 1; q <= k + Wm; q++) { if (v[q] > pk) pk = v[q]; else { const d = v[q] / pk - 1; if (d < m) m = d; } } md.push(m); }
      const st = BT.stats(res);
      return { b, cur: Math.abs(b - cur) < 0.005, R, st, p: cg.length ? { c50: q10(cg, 0.5), c10: q10(cg, 0.1), m50: q10(md, 0.5), m10: q10(md, 0.1), n: cg.length } : null };
    });
    return { rows, bw: cur, bonds: x.tickers.filter((_, j) => isBondC(cls[j])), rest: x.tickers.filter((_, j) => !isBondC(cls[j])) };
  }
  function renderRlMix(full = true) {
    const S = state.rlmix, L = state.last; $('#rl-mix-p').innerHTML = ''; $('#rl-mix-tbl').innerHTML = ''; $('#rl-mix-say').textContent = '';
    if (!L) { drawRlMix(); return; }
    const vp = validPorts(); if (!vp.length) return;
    if (S.pi == null || !vp.find(p => p.i === S.pi)) S.pi = vp[0].i;
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === S.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#rl-mix-p').appendChild(b); }
    [...$('#rl-mix-v').querySelectorAll('button')].forEach(b => { b.setAttribute('aria-pressed', b.dataset.v === S.view ? 'true' : 'false'); if (b.dataset.v === 'f') b.textContent = `앞으로 ${state.rl.H}년 (현실 기대)`; });
    $('#rl-mix-cap').value = String(S.cap);
    const x = L.series.find(s => s.key === 'p' + S.pi); if (!x) return;
    const key = JSON.stringify([x.tickers, x.weights, L.s, L.e, state.rebal, !!L.adj, BT.isReal(), state.rl.H]);
    if (full || key !== rlMixKey || !state.rlMix) { state.rlMix = rlMixCompute(x, L); rlMixKey = key; }
    const D = state.rlMix;
    if (D.none) { $('#rl-mix-say').textContent = `‘${x.name}’에는 채권 종목이 없어서(또는 채권만 있어서) 채권 비중을 바꿔 볼 수 없어요. 1 포트폴리오에서 IEF 같은 채권을 넣으면 볼 수 있어요.`; drawRlMix(); return; }
    const F = S.view === 'f', cap = S.cap;
    const cv = r => (F ? r.R.c50 : r.p && r.p.c50), cb = r => (F ? r.R.c10 : r.p && r.p.c10), mv = r => (F ? r.R.m50 : r.p && r.p.m50), mb = r => (F ? r.R.m10 : r.p && r.p.m10);
    let pick = null; for (const r of D.rows) { if (mb(r) == null || mb(r) < -cap - 1e-9) continue; if (!pick || cv(r) > cv(pick) + 1e-9) pick = r; }
    D.pick = pick;
    const cr = D.rows.find(r => r.cur), bt = D.bonds.join(' · ');
    $('#rl-mix-say').textContent = pick
      ? `${F ? `앞으로 ${state.rl.H}년 모의실험` : `과거 ${RLMIX_Y}년 구간`} 기준으로 나쁘면 MDD ${Math.round(cap * 100)}% 안에서 가운데 CAGR이 가장 높은 건 채권(${bt}) ${Math.round(pick.b * 100)}%예요 — CAGR 가운데 ${pct(cv(pick), 1)} · 나쁘면 ${pct(cb(pick), 1)}, MDD 가운데 ${mpct1(mv(pick))} · 나쁘면 ${mpct1(mb(pick))}.` + (cr && cr !== pick ? ` 지금 비중(채권 ${Math.round(cr.b * 100)}%)은 CAGR 가운데 ${pct(cv(cr), 1)} · MDD 나쁘면 ${mpct1(mb(cr))}.` : cr ? ' 지금 비중이 바로 이 비중이에요.' : '')
      : `나쁘면 MDD가 ${Math.round(cap * 100)}% 안인 비중이 없어요. 한도를 늘려 보세요.`;
    // table
    const t = el('table', 'rlmix'), th = el('thead'), hr = el('tr');
    const heads = F ? ['채권', 'CAGR 가운데', 'CAGR 나쁘면', 'MDD 가운데', 'MDD 나쁘면', '회복 가운데'] : ['채권', `${RLMIX_Y}년 CAGR 가운데`, `${RLMIX_Y}년 CAGR 나쁜 10%`, `${RLMIX_Y}년 MDD 가운데`, `${RLMIX_Y}년 MDD 나쁜 10%`, '전체 기간 최악 MDD'];
    heads.forEach(s => hr.appendChild(el('th', null, s))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const r of D.rows) {
      const tr = el('tr', (r === pick ? 'mx-pick ' : '') + (r.cur ? 'mx-cur' : '')); const h0 = el('th', null, `${Math.round(r.b * 100)}%`); if (r.cur) h0.appendChild(el('small', null, '지금')); if (r === pick) h0.appendChild(el('small', 'pk', '추천')); tr.appendChild(h0);
      const over = mb(r) != null && mb(r) < -cap - 1e-9;
      tr.append(el('td', null, cv(r) == null ? '–' : pct(cv(r), 1)), el('td', 'muted', cb(r) == null ? '–' : pct(cb(r), 1)), el('td', null, mv(r) == null ? '–' : mpct1(mv(r))), el('td', over ? 'neg' : null, mb(r) == null ? '–' : mpct1(mb(r))));
      tr.appendChild(el('td', null, F ? (r.R.u50 ? dur(r.R.u50) : '없음') : mpct1(r.st.mdd)));
      tb.appendChild(tr);
    }
    t.appendChild(tb); const tw = el('div', 'tbl-wrap'); tw.appendChild(t); $('#rl-mix-tbl').appendChild(tw);
    $('#rl-mix-note').textContent = `채권(${bt})만 비중을 바꾸고, 나머지(${D.rest.join(' · ')})는 원래 비율대로 함께 늘리거나 줄였어요. ` + (F ? `‘가운데’ · ‘나쁘면’ = 앞으로 ${state.rl.H}년 모의실험 500번의 가운데 · 나쁜 10%.` : `과거 데이터를 ${RLMIX_Y}년씩 끊은 모든 구간(매달 시작, ${D.rows[0].p ? D.rows[0].p.n : 0}개)의 가운데 · 나쁜 10%. 가장 나빴던 한 번 대신 여러 구간의 분포라 한 번의 폭락에 덜 좌우돼요.`);
    drawRlMix();
  }
  function drawRlMix() {
    const host = $('#c-rl-mix'); if (!host) return; host.innerHTML = '';
    const D = state.rlMix, S = state.rlmix; if (!D || D.none || !isShown(host)) return;
    const F = S.view === 'f', rows = D.rows.filter(r => F || r.p);
    if (!rows.length) return;
    const cv = r => (F ? r.R.c50 : r.p.c50), cb = r => (F ? r.R.c10 : r.p.c10), mv = r => (F ? r.R.m50 : r.p.m50), mb = r => (F ? r.R.m10 : r.p.m10);
    const W = Math.max(280, host.clientWidth || 600), narrow = W < 520, ph = narrow ? 150 : 170, gap = 34, m = { l: 46, r: 12, t: 22, b: 24 }, iw = W - m.l - m.r, H = m.t + ph + gap + ph + m.b;
    const X = b => m.l + b * iw;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '채권 비중에 따른 CAGR과 MDD' }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const panel = (y0, vals, lo, hi, fmt, title) => {
      const Y = v => y0 + (hi - v) / (hi - lo) * ph;
      for (const v of linTicks(lo, hi, 4)) { if (v < lo - 1e-9 || v > hi + 1e-9) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: Y(v), y2: Y(v) }, g); svg('text', { x: m.l - 6, y: Y(v) + 3.5, 'text-anchor': 'end' }, ax).textContent = fmt(v); }
      const tt = svg('text', { x: m.l, y: y0 - 7 }, ax); tt.textContent = title; tt.style.fill = 'var(--ink)'; tt.style.fontWeight = '700'; tt.style.fontFamily = 'var(--font-sans)'; tt.style.fontSize = '12.5px';
      return Y;
    };
    const line = (Y, f, col, dash) => { let d = ''; rows.forEach((r, i) => { d += (i ? 'L' : 'M') + X(r.b).toFixed(1) + ',' + Y(f(r)).toFixed(1); }); const p = svg('path', Object.assign({ d, fill: 'none', 'stroke-width': 2.2 }, dash ? { 'stroke-dasharray': '5 4' } : {}), root); p.style.stroke = col; rows.forEach(r => { const c = svg('circle', { cx: X(r.b), cy: Y(f(r)), r: r.cur ? 4.5 : 2.6 }, root); c.style.fill = col; }); };
    // CAGR panel
    let lo = Math.min(...rows.map(cb)), hi = Math.max(...rows.map(cv)); const pd = (hi - lo) * 0.1 || 0.01; lo = Math.min(0, lo - pd); hi += pd;
    const Y1 = panel(m.t, null, lo, hi, v => (v * 100).toFixed(0) + '%', 'CAGR — 실선 가운데 · 점선 나쁘면');
    // MDD panel
    let lo2 = Math.min(...rows.map(mb), -S.cap) * 1.08, hi2 = 0;
    const y2 = m.t + ph + gap, Y2 = panel(y2, null, lo2, hi2, v => (v * 100).toFixed(0) + '%', `MDD — 빨간 선 = 감당할 한도 ${Math.round(S.cap * 100)}%`);
    if (D.pick && rows.includes(D.pick)) { const r = svg('rect', { x: X(D.pick.b) - 9, y: m.t - 2, width: 18, height: y2 + ph - m.t + 2, rx: 6 }, root); r.style.fill = 'color-mix(in srgb, var(--pos) 16%, transparent)'; root.insertBefore(r, g); }
    const cl = svg('line', { x1: m.l, x2: m.l + iw, y1: Y2(-S.cap), y2: Y2(-S.cap), 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, root); cl.style.stroke = 'var(--neg)';
    line(Y1, cv, 'var(--focus)'); line(Y1, cb, 'var(--focus)', true);
    line(Y2, mv, 'var(--warn)'); line(Y2, mb, 'var(--warn)', true);
    for (const b of [0, 0.2, 0.4, 0.6, 0.8, 1]) svg('text', { x: X(b), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = Math.round(b * 100) + '%';
    const xl = svg('text', { x: m.l + iw, y: H - 6 - 12, 'text-anchor': 'end' }, ax); xl.textContent = '채권 비중 →';
    const cr = rows.find(r => r.cur); if (cr) { const t = svg('text', { x: X(cr.b), y: Y1(cv(cr)) - 9, 'text-anchor': 'middle' }, ax); t.textContent = '지금'; t.style.fill = 'var(--ink)'; t.style.fontWeight = '700'; }
    if (D.pick && rows.includes(D.pick)) { const t = svg('text', { x: X(D.pick.b), y: y2 + 12, 'text-anchor': 'middle' }, ax); t.textContent = '추천'; t.style.fill = 'var(--pos)'; t.style.fontWeight = '700'; }
  }
