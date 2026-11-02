  /* ======================= v10.2: is the past average flattered? eras, start date, rates — and a realistic range from today's starting point ======================= */
  const Y10 = JSON.parse(document.getElementById('us10y-data').textContent);
  const y10At = k => { const [y, m] = BT.ym(k); const i = y * 12 + (m - 1) - (Y10.y0 * 12 + Y10.m0 - 1); return i >= 0 && i < Y10.v.length ? Y10.v[i] / 100 : null; };
  const RL_ERAS = [['1972~1981', 1972, 1981, '금리 상승 · 고물가'], ['1982~1999', 1982, 1999, '금리 하락'], ['2000~2009', 2000, 2009, '닷컴 · 금융위기'], ['2010~2020', 2010, 2020, '저금리'], ['2021~', 2021, 2100, '금리 상승']];
  state.rl = { pi: null, eq: 7.0, gold: 3.0, bond: null, H: 10 };
  const mIdx = (y, m) => { for (let k = 0; k < 1200; k++) { const [yy, mm] = BT.ym(k); if (yy === y && mm === m) return k; if (yy > y) return null; } return null; };
  function assetClass(t) {
    const c = (DATA.assets[t] && DATA.assets[t].c) || '';
    if (/현금성/.test(c)) return 'cash';
    if (/레버리지/.test(c)) return 'lev';
    if (/하이일드/.test(c)) return 'hy';
    if (/회사채/.test(c)) return 'ig';
    if (/단기 국채/.test(c)) return 'short';
    if (/채권|국채|물가연동/.test(c)) return 'bond';
    if (/^금$|^은$|원자재/.test(c)) return 'gold';
    if (/커버드콜/.test(c)) return 'cc';
    return 'eq';
  }
  const RL_CLS = { cash: '현금성', short: '단기 채권', bond: '채권', ig: '회사채', hy: '하이일드', gold: '금 · 원자재', eq: '주식', cc: '커버드콜', lev: '3배 레버리지' };
  (function buildRl() {
    $('#rl-port').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.rl.pi = +b.dataset.p; renderReal(); });
    const on = () => { const R = state.rl; R.eq = numIn('#rl-eq', 7); R.gold = numIn('#rl-gold', 3); R.bond = numIn('#rl-bond', R.bond == null ? 4 : R.bond); R.H = +$('#rl-h').value || 10; renderReal(false); };
    ['#rl-eq', '#rl-gold', '#rl-bond'].forEach(s => $(s).addEventListener('change', on));
    $('#rl-h').addEventListener('change', on);
    $('#rl-reset').addEventListener('click', () => { state.rl.bond = null; state.rl.eq = 7; state.rl.gold = 3; renderReal(); });
  })();
  /* geometric mean per year of a monthly return array */
  const geoY = r => { let s = 0; for (const x of r) s += Math.log(1 + x); return Math.exp(s / r.length * 12) - 1; };
  const sdY = r => { const n = r.length, m = r.reduce((a, b) => a + b, 0) / n; let v = 0; for (const x of r) v += (x - m) * (x - m); return Math.sqrt(v / (n - 1) * 12); };
  function rlRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function renderReal(full = true) {
    const host = $('#rl-say'); if (!host) return;
    host.innerHTML = ''; $('#rl-port').innerHTML = ''; $('#rl-exp-tbl').innerHTML = ''; $('#rl-bond-note').textContent = '';
    state.rlRes = null;
    const L = state.last, vp = validPorts(); if (!L || !vp.length) { drawReal(); return; }
    const R = state.rl; if (R.pi == null || !vp.find(p => p.i === R.pi)) R.pi = vp[0].i;
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === R.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#rl-port').appendChild(b); }
    const yNow = y10At(L.e), cash = (() => { const RC = BT.rfCum(); return Math.pow(RC[L.e + 1] / RC[L.e], 12) - 1; })();
    if (R.bond == null) R.bond = yNow != null ? Math.round(yNow * 10000) / 100 : 4;
    $('#rl-eq').value = R.eq; $('#rl-gold').value = R.gold; $('#rl-bond').value = R.bond; $('#rl-h').value = String(R.H);
    $('#rl-bond-note').textContent = yNow != null ? `${BT.label(L.e)} 미국 10년 국채 금리(월평균) ${(yNow * 100).toFixed(2)}% · 현금(미국 단기국채) ${(cash * 100).toFixed(2)}%` : '';
    const series = L.series.filter(x => !x.bench), x = series.find(s => s.key === 'p' + R.pi) || series[0];
    // 1) eras for the chosen portfolio
    const eras = [];
    for (const [nm, y0, y1, why] of RL_ERAS) {
      const a = Math.max(L.s, mIdx(y0, 1) ?? Infinity), b = Math.min(L.e, mIdx(Math.min(y1, 2100), 12) ?? L.e);
      if (!(b - a >= 23)) continue;
      const st = BT.stats(BT.backtest(x.tickers, x.weights, a, b, state.rebal, L.adj));
      const ya = y10At(a), yb = y10At(b);
      eras.push({ nm, why, a, b, st, ya, yb });
    }
    // CAGR without the best era
    let best = null; for (const e of eras) if (!best || e.st.cagr > best.st.cagr) best = e;
    let lg = 0, mo = 0; for (const e of eras) if (e !== best) { const n = e.b - e.a + 1; lg += Math.log(1 + e.st.cagr) * n / 12; mo += n; }
    const exBest = mo ? Math.exp(lg / (mo / 12)) - 1 : null;
    // 2) start date: CAGR from each January to the end
    const starts = [];
    for (const s of series) {
      const res = BT.backtest(s.tickers, s.weights, L.s, L.e, state.rebal, L.adj), v = res.vals, pts = [];
      for (let k = 0; k <= res.n - 60; k++) { const [yy, mm] = BT.ym(L.s + k); if (mm !== 1 && k !== 0) continue; pts.push({ k, y: yy + (mm - 1) / 12, c: Math.pow(v[res.n] / v[k], 12 / (res.n - k)) - 1 }); }
      starts.push({ s, pts });
    }
    // 3) the bond sleeve: income (average 10-year yield) vs the rest (mostly rate changes)
    const bt = x.tickers.map((t, j) => [t, x.weights[j], assetClass(t)]).filter(q => ['bond', 'short', 'ig', 'hy'].includes(q[2]));
    let bond = null;
    if (bt.length) {
      const tw = bt.reduce((a, q) => a + q[1], 0), rets = bt.map(q => BT.backtest([q[0]], [1], L.s, L.e, 'N', L.adj).r), n = rets[0].length;
      const r = new Float64Array(n); for (let t = 0; t < n; t++) { let s = 0; bt.forEach((q, j) => { s += q[1] / tw * rets[j][t]; }); r[t] = s; }
      const be = eras.map(e => { const seg = Array.from(r.slice(e.a - L.s, e.b - L.s + 1)); let ys = 0, yn = 0; for (let k = e.a; k <= e.b; k++) { const y = y10At(k); if (y != null) { ys += y; yn++; } } const g = geoY(seg), inc = yn ? ys / yn : null; return { e, g, inc, rest: inc == null ? null : g - inc }; });
      const pts = []; for (let t = 0; t + 120 <= n; t++) { const y = y10At(L.s + t); if (y == null) continue; let s = 0; for (let q = t; q < t + 120; q++) s += Math.log(1 + r[q]); pts.push({ x: y, y: Math.exp(s / 10) - 1, k: L.s + t }); }
      bond = { names: bt.map(q => q[0]).join(' · '), be, pts };
    }
    // 4) expected return from today's starting point, and a block bootstrap around it
    const H = R.H * 12, exp = [];
    for (const s of series) {
      const rets = s.tickers.map(t => BT.backtest([t], [1], L.s, L.e, 'N', L.adj).r), n = rets[0].length, tw = s.weights.reduce((a, b) => a + b, 0), w = s.weights.map(v => v / tw);
      const sig = rets.map(sdY), gh = rets.map(geoY), eqIdx = s.tickers.findIndex(t => assetClass(t) === 'eq');
      const eqG = R.eq / 100, bondG = R.bond / 100, goldG = R.gold / 100;
      const tgt = s.tickers.map((t, j) => { const c = assetClass(t);
        if (c === 'cash') return cash; if (c === 'short') return (cash + bondG) / 2; if (c === 'bond') return bondG; if (c === 'ig') return bondG + 0.01; if (c === 'hy') return bondG + 0.025; if (c === 'gold') return goldG; if (c === 'cc') return eqG - 0.01;
        if (c === 'lev') { const se = 0.16; return 3 * (eqG + se * se / 2) - 2 * cash - 0.009 - sig[j] * sig[j] / 2; }
        return eqG; });
      const pr = new Float64Array(n); for (let t = 0; t < n; t++) { let q = 0; for (let j = 0; j < w.length; j++) q += w[j] * rets[j][t]; pr[t] = q; }
      const sp = sdY(pr); let ar = 0; for (let j = 0; j < w.length; j++) ar += w[j] * (tgt[j] + sig[j] * sig[j] / 2);
      const gExp = ar - sp * sp / 2;
      // bootstrap: shift each asset to its target geometric mean, keep the joint monthly pattern (12-month blocks)
      const f = tgt.map((g, j) => Math.pow((1 + g) / (1 + gh[j]), 1 / 12)), sh = rets.map((r, j) => Array.from(r, x => (1 + x) * f[j] - 1));
      const P = 700, rnd = rlRng(12345 + s.key.length), cg = [], md = [], uw = [];
      if (n >= 24) for (let p = 0; p < P; p++) {
        let h = w.slice(), v = 1, pk = 1, mdd = 0, cur = 0, mx = 0;
        for (let t = 0; t < H;) {
          const b0 = Math.floor(rnd() * (n - 12));
          for (let q = 0; q < 12 && t < H; q++, t++) {
            let tot = 0; for (let j = 0; j < w.length; j++) { h[j] *= 1 + sh[j][b0 + q]; tot += h[j]; }
            v = tot; if (v >= pk) { pk = v; cur = 0; } else { cur++; if (cur > mx) mx = cur; const d = v / pk - 1; if (d < mdd) mdd = d; }
            if ((t + 1) % 12 === 0) h = w.map(x => x * v);
          }
        }
        cg.push(Math.pow(v, 12 / H) - 1); md.push(mdd); uw.push(mx);
      }
      const q = (a, p) => { const b = a.slice().sort((x, y) => x - y); return b[Math.min(b.length - 1, Math.max(0, Math.round(p * (b.length - 1))))]; };
      exp.push({ s, hist: s.st.cagr, gExp, tgt, cls: s.tickers.map(assetClass), c10: q(cg, 0.1), c50: q(cg, 0.5), c90: q(cg, 0.9), m50: q(md, 0.5), m10: q(md, 0.1), u50: q(uw, 0.5), u90: q(uw, 0.9), loss: cg.filter(c => c < 0).length / Math.max(1, cg.length) });
    }
    state.rlRes = { x, eras, best, exBest, starts, bond, exp, yNow, cash };
    // summary
    const E = exp.find(e => e.s === x);
    const p1 = el('p', 'rl-h'); const k = el('span', 'key'); k.style.background = x.color; p1.append(k, el('b', null, x.name)); host.appendChild(p1);
    if (best && exBest != null) host.appendChild(el('p', null, `과거 전체 CAGR ${pct(x.st.cagr, 1)} — 가장 좋았던 ${best.nm}(${best.why}${best.ya != null ? `, 10년 금리 ${(best.ya * 100).toFixed(1)}% → ${(best.yb * 100).toFixed(1)}%` : ''})에 연 ${pct(best.st.cagr, 1)}를 벌었고, 이 시기를 빼면 연 ${pct(exBest, 1)}예요.`));
    if (E) host.appendChild(el('p', 'rl-big', `지금 조건(10년 금리 ${R.bond.toFixed(2)}%, 주식 ${R.eq}%, 금 · 원자재 ${R.gold}%)으로 보면 기대 CAGR 약 ${pct(E.gExp, 1)} · 앞으로 ${R.H}년 모의실험 하위 10% ${pct(E.c10, 1)} ~ 상위 10% ${pct(E.c90, 1)}`));
    host.appendChild(el('p', 'small muted', '기대 CAGR과 모의실험은 위 가정을 넣은 계산이지 예측이 아니에요. 가정을 바꾸면 결과도 바뀌어요.'));
    // expectation table
    const t = el('table', 'rltbl'), th = el('thead'), hr = el('tr');
    ['', '과거 CAGR', '지금 조건 기대 CAGR', `앞으로 ${R.H}년 CAGR (하위10 · 가운데 · 상위10)`, 'MDD (가운데 · 나쁜 10%)', '최장 회복 (가운데 · 나쁜 10%)', '손실로 끝날 확률'].forEach(s2 => hr.appendChild(el('th', null, s2))); th.appendChild(hr); t.appendChild(th);
    const bd = el('tbody');
    for (const e of exp) {
      const tr = el('tr'); const h = el('th'); const kk = el('span', 'key'); kk.style.background = e.s.color; h.append(kk, document.createTextNode(' ' + e.s.name)); tr.appendChild(h);
      tr.append(el('td', null, pct(e.hist, 1)), el('td', null, pct(e.gExp, 1)), el('td', null, `${pct(e.c10, 1)} · ${pct(e.c50, 1)} · ${pct(e.c90, 1)}`), el('td', null, `${mpct1(e.m50)} · ${mpct1(e.m10)}`), el('td', null, `${e.u50 ? dur(e.u50) : '없음'} · ${e.u90 ? dur(e.u90) : '없음'}`), el('td', e.loss > 0.05 ? 'neg' : null, pct(e.loss, 0)));
      bd.appendChild(tr);
    }
    t.appendChild(bd); $('#rl-exp-tbl').appendChild(t);
    const ex = exp.find(e => e.s === x);
    if (ex) $('#rl-cls').textContent = '종목별 가정: ' + x.tickers.map((tk, j) => `${tk} ${RL_CLS[ex.cls[j]]} ${pct(ex.tgt[j], 1)}`).join(' · ') + ' (채권 = 10년 금리, 단기 채권 = 금리와 현금의 중간, 회사채 +1%p, 하이일드 +2.5%p, 현금 = 지금 단기국채 금리)';
    drawReal();
  }
  function drawReal() {
    for (const id of ['#c-rl-era', '#c-rl-start', '#c-rl-bond', '#c-rl-sc', '#c-rl-exp', '#lg-rl-start']) { const e = $(id); if (e) e.innerHTML = ''; }
    const S = state.rlRes; if (!S) return;
    const L = state.last;
    // eras: CAGR · MDD · recovery
    const he = $('#c-rl-era');
    if (he && isShown(he)) { tripleBars(he, [{ key: 'all', name: '전체 기간', color: 'var(--ink)', st: S.x.st }].concat(S.eras.map(e => ({ key: e.nm, name: e.nm, color: S.x.color, st: e.st }))), { sel: 'all' }); $('#rl-era-cap').textContent = S.eras.map(e => `${e.nm} ${e.why}${e.ya != null ? ` (10년 금리 ${(e.ya * 100).toFixed(1)}→${(e.yb * 100).toFixed(1)}%)` : ''}`).join(' · '); }
    // start date lines
    const hs = $('#c-rl-start');
    if (hs && isShown(hs)) {
      legend($('#lg-rl-start'), S.starts.map(q => ({ name: q.s.name, color: q.s.color })), false);
      const W = Math.max(280, hs.clientWidth || 600), H = W < 520 ? 210 : 240, m = { l: 44, r: 12, t: 12, b: 24 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const q of S.starts) for (const p of q.pts) { x0 = Math.min(x0, p.y); x1 = Math.max(x1, p.y); y0 = Math.min(y0, p.c); y1 = Math.max(y1, p.c); }
      const pd = (y1 - y0) * 0.08 || 0.01; y0 -= pd; y1 += pd;
      const X = v => m.l + (v - x0) / (x1 - x0 || 1) * iw, Y = v => m.t + (y1 - v) / (y1 - y0) * ih;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '시작한 해에 따른 지금까지의 CAGR' }, hs), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(y0, y1, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      const st = Math.max(1, Math.ceil((x1 - x0) / Math.max(2, Math.floor(iw / 50))));
      for (let yv = Math.ceil(x0); yv <= x1; yv += st) svg('text', { x: X(yv), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = yv;
      for (const q of S.starts) { let d = ''; q.pts.forEach((p, i) => { d += (i ? 'L' : 'M') + X(p.y).toFixed(1) + ',' + Y(p.c).toFixed(1); }); const pth = svg('path', { d, fill: 'none', 'stroke-width': 2 }, root); pth.style.stroke = q.s.color; }
      const xl = svg('text', { x: m.l + iw, y: m.t + 10, 'text-anchor': 'end' }, ax); xl.textContent = `시작한 해 → ${BT.label(L.e)}까지 CAGR`;
    }
    // bond sleeve by era: income vs the rest
    const hb = $('#c-rl-bond'), B = S.bond;
    $('#rl-bond-wrap').hidden = !B;
    if (B && hb && isShown(hb)) {
      const rows = B.be.filter(q => q.inc != null), W = Math.max(280, hb.clientWidth || 600), lab = W < 520 ? 80 : 150, rowH = 30, top0 = W < 520 ? 36 : 24, H = top0 + rows.length * rowH + 22, iw = W - lab - 70;
      let lo = 0, hi = 0; for (const q of rows) { lo = Math.min(lo, q.rest, q.g); hi = Math.max(hi, q.inc + Math.max(0, q.rest), q.g); }
      const X = v => lab + (v - lo) / (hi - lo || 1) * iw;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '채권 수익의 출처' }, hb), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(lo, hi, 5)) { const x = X(v); svg('line', { x1: x, x2: x, y1: 18, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      const z = svg('line', { x1: X(0), x2: X(0), y1: 18, y2: H - 20, 'stroke-width': 1.5 }, root); z.style.stroke = 'var(--ink-2)';
      const k1 = svg('text', { x: W < 520 ? 0 : lab, y: 12 }, ax); k1.textContent = '■ 이자 몫(그 시기 평균 10년 금리)'; k1.style.fill = 'var(--focus)'; k1.style.fontWeight = '700';
      const k2 = svg('text', W < 520 ? { x: 0, y: 26 } : { x: lab + 190, y: 12 }, ax); k2.textContent = '■ 금리 변화 몫(나머지)'; k2.style.fill = 'var(--warn)'; k2.style.fontWeight = '700';
      rows.forEach((q, i) => {
        const y = top0 + i * rowH, cy = y + rowH / 2;
        const l = svg('text', { x: lab - 8, y: cy + 4, 'text-anchor': 'end' }, ax); l.textContent = q.e.nm; l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
        const b1 = svg('rect', { x: X(0), y: cy - 8, width: Math.max(1, X(q.inc) - X(0)), height: 16 }, root); b1.style.fill = 'var(--focus)'; b1.style.opacity = '0.75';
        const r0 = q.rest >= 0 ? X(q.inc) : X(q.rest), r1 = q.rest >= 0 ? X(q.inc + q.rest) : X(0);
        const b2 = svg('rect', { x: Math.min(r0, r1), y: q.rest >= 0 ? cy - 8 : cy + 2, width: Math.max(1, Math.abs(r1 - r0)), height: q.rest >= 0 ? 16 : 6 }, root); b2.style.fill = 'var(--warn)'; b2.style.opacity = '0.8';
        const t = svg('text', { x: X(Math.max(q.g, q.inc + Math.max(0, q.rest))) + 6, y: cy + 4 }, ax); t.textContent = `= ${pct(q.g, 1)}`; t.style.fill = 'var(--ink)'; t.style.fontWeight = '700';
      });
      $('#rl-bond-h').textContent = `채권 부분(${B.names})의 수익은 어디서 왔나`;
    }
    // yield at the start vs the next 10 years
    const hc = $('#c-rl-sc');
    if (B && hc && isShown(hc) && B.pts.length) {
      const W = Math.max(280, hc.clientWidth || 600), H = W < 520 ? 230 : 260, m = { l: 44, r: 12, t: 14, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      let x1 = Math.max(...B.pts.map(p => p.x), S.yNow || 0) * 1.05, y0 = Math.min(0, ...B.pts.map(p => p.y)), y1 = Math.max(x1, ...B.pts.map(p => p.y));
      const X = v => m.l + v / x1 * iw, Y = v => m.t + (y1 - v) / (y1 - y0) * ih;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '살 때 금리와 그 뒤 10년 채권 수익' }, hc), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(y0, y1, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      for (const v of linTicks(0, x1, 5)) { const x = X(v); svg('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih }, g); svg('text', { x, y: m.t + ih + 14, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      const dg = svg('line', { x1: X(0), y1: Y(0), x2: X(Math.min(x1, y1)), y2: Y(Math.min(x1, y1)), 'stroke-dasharray': '4 3', 'stroke-width': 1.5 }, root); dg.style.stroke = 'var(--ink-2)';
      for (const p of B.pts) { const c = svg('circle', { cx: X(p.x), cy: Y(p.y), r: 2.6 }, root); c.style.fill = 'var(--focus)'; c.style.opacity = '0.55'; }
      if (S.yNow != null) { const v = svg('line', { x1: X(S.yNow), x2: X(S.yNow), y1: m.t, y2: m.t + ih, 'stroke-width': 2 }, root); v.style.stroke = 'var(--warn)'; const tt = svg('text', { x: X(S.yNow) + 4, y: m.t + 12 }, ax); tt.textContent = `지금 ${(S.yNow * 100).toFixed(2)}%`; tt.style.fill = 'var(--warn)'; tt.style.fontWeight = '700'; }
      const xl = svg('text', { x: m.l + iw, y: H - 2, 'text-anchor': 'end' }, ax); xl.textContent = '살 때 10년 국채 금리 →';
      const yl = svg('text', { x: m.l + 4, y: m.t + 12 }, ax); yl.textContent = '↑ 그 뒤 10년 채권 CAGR'; yl.style.fontWeight = '700';
    }
    // past vs today's starting point, with the simulated range
    const hx = $('#c-rl-exp');
    if (hx && isShown(hx) && S.exp.length) {
      const rows = S.exp, W = Math.max(280, hx.clientWidth || 600), narrow = W < 520, lab = narrow ? 92 : 150, rowH = 44, H = 26 + rows.length * rowH + 22, iw = W - lab - 18;
      let lo = 0, hi = 0.05; for (const e of rows) { lo = Math.min(lo, e.c10); hi = Math.max(hi, e.c90, e.hist); }
      const X = v => lab + (v - lo) / (hi - lo) * iw;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '과거 CAGR과 지금 조건의 기대 범위' }, hx), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(lo, hi, narrow ? 4 : 6)) { const x = X(v); svg('line', { x1: x, x2: x, y1: 20, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      const k1 = svg('text', { x: lab, y: 12 }, ax); k1.textContent = narrow ? '◆ 과거  ● 지금 조건  ━ 앞으로 ' + state.rl.H + '년 범위' : '◆ 과거 CAGR   ● 지금 조건 기대   ━ 앞으로 ' + state.rl.H + '년 하위10~상위10%'; k1.style.fontWeight = '600';
      rows.forEach((e, i) => {
        const y = 26 + i * rowH, cy = y + rowH / 2;
        const l = svg('text', { x: lab - 8, y: cy + 4, 'text-anchor': 'end' }, ax); l.textContent = e.s.name.length > (narrow ? 10 : 18) ? e.s.name.slice(0, narrow ? 9 : 17) + '…' : e.s.name; l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
        const rg = svg('line', { x1: X(e.c10), x2: X(e.c90), y1: cy, y2: cy, 'stroke-width': 6, 'stroke-linecap': 'round' }, root); rg.style.stroke = e.s.color; rg.style.opacity = '0.35';
        const c = svg('circle', { cx: X(e.gExp), cy, r: 7 }, root); c.style.fill = e.s.color;
        const s = 7, d = svg('path', { d: `M${X(e.hist)},${cy - s}L${X(e.hist) + s},${cy}L${X(e.hist)},${cy + s}L${X(e.hist) - s},${cy}Z`, 'stroke-width': 1.5 }, root); d.style.fill = 'var(--panel)'; d.style.stroke = 'var(--ink)';
        const t1 = svg('text', { x: X(e.gExp), y: cy + 20, 'text-anchor': 'middle' }, ax); t1.textContent = pct(e.gExp, 1); t1.style.fill = 'var(--ink)'; t1.style.fontWeight = '700';
        const t2 = svg('text', { x: X(e.hist), y: cy - 11, 'text-anchor': 'middle' }, ax); t2.textContent = pct(e.hist, 1);
      });
    }
  }
