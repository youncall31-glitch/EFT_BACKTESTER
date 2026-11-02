  /* ======================= v10.4: realistic CAGR · MDD · recovery — assumptions set from the data (no typing): bond = the yield now, stocks · gold = the yield now + their past premium over it ======================= */
  const Y10 = JSON.parse(document.getElementById('us10y-data').textContent);
  const y10At = k => { const [y, m] = BT.ym(k); const i = y * 12 + (m - 1) - (Y10.y0 * 12 + Y10.m0 - 1); return i >= 0 && i < Y10.v.length ? Y10.v[i] / 100 : null; };
  const RL_ERAS = [['1972~1981', 1972, 1981, '금리 상승 · 고물가'], ['1982~1999', 1982, 1999, '금리 하락'], ['2000~2009', 2000, 2009, '닷컴 · 금융위기'], ['2010~2020', 2010, 2020, '저금리'], ['2021~', 2021, 2100, '금리 상승']];
  state.rl = { pi: null, H: 20 };
  state.aiCrit = 'real';
  const RL_INFL = 0.025;
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
  const geoY = r => { let s = 0; for (const x of r) s += Math.log(1 + x); return Math.exp(s / r.length * 12) - 1; };
  const sdY = r => { const n = r.length, m = r.reduce((a, b) => a + b, 0) / n; let v = 0; for (const x of r) v += (x - m) * (x - m); return Math.sqrt(v / (n - 1) * 12); };
  function rlRng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rfAt = k => { const RC = BT.rfCum(); return RC[k + 1] && RC[k] ? Math.pow(RC[k + 1] / RC[k], 12) - 1 : 0.03; };
  /* the assumptions at month k: bond = the 10-year yield then (or what the user typed, for the last month), stocks · gold as typed, cash = the T-bill rate then */
  /* premiums over the 10-year yield, measured only on data up to month k (so the walk-forward check never peeks), in nominal dollars */
  const premCache = new Map();
  function rlPrem(k) {
    if (premCache.has(k)) return premCache.get(k);
    const one = t => withUnit(false, () => {
      let s, e; try { [s, e] = BT.commonRange([t], 'full'); } catch (err) { return null; }
      e = Math.min(e, k); if (!(e - s >= 120)) return null;
      const res = BT.backtest([t], [1], s, e, 'N', false), cg = Math.pow(res.vals[res.n] / res.vals[0], 12 / res.n) - 1;
      let ys = 0, yn = 0; for (let q = s; q <= e; q++) { const y = y10At(q); if (y != null) { ys += y; yn++; } }
      if (!yn) return null;
      const out = { t, s, e, cg, y: ys / yn, p: cg - ys / yn };
      if (t === 'IEF') { const v = res.vals; let d = 0, c = 0; for (let q = 0; q + 120 <= res.n; q++) { const y = y10At(s + q); if (y == null) continue; d += Math.pow(v[q + 120] / v[q], 0.1) - 1 - y; c++; } out.gap = c ? d / c : null; out.nGap = c; }
      return out;
    }, 'USD');
    const out = { eq: one('SPY'), gold: one('GLD'), bond: one('IEF') };
    premCache.set(k, out); return out;
  }
  function rlAssume(k) {
    const y0 = y10At(k), y = y0 != null ? y0 : 0.04, P = rlPrem(k), infl = BT.isReal() ? RL_INFL : 0;
    return { eq: y + (P.eq ? P.eq.p : 0.05) - infl, gold: y + (P.gold ? P.gold.p : 0) - infl, bond: y - infl, cash: rfAt(k) - infl, y: y0, P };
  }
  const ppS = v => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(1)}%p`;
  function rlTarget(c, sig, A) {
    if (c === 'cash') return A.cash; if (c === 'short') return (A.cash + A.bond) / 2; if (c === 'bond') return A.bond; if (c === 'ig') return A.bond + 0.01; if (c === 'hy') return A.bond + 0.025; if (c === 'gold') return A.gold; if (c === 'cc') return A.eq - 0.01;
    if (c === 'lev') { const se = 0.16; return 3 * (A.eq + se * se / 2) - 2 * A.cash - 0.009 - sig * sig / 2; }
    return A.eq;
  }
  /* realistic numbers for one mix: expected CAGR from the assumptions, and a 700-path block bootstrap (past monthly moves, means moved to the assumptions) */
  function rlSim(tickers, weights, s, e, adj, A, Hy) {
    const rets = tickers.map(t => BT.backtest([t], [1], s, e, 'N', adj).r), n = rets[0].length, tw = weights.reduce((a, b) => a + b, 0), w = weights.map(v => v / tw);
    const sig = rets.map(sdY), gh = rets.map(geoY), cls = tickers.map(assetClass), tgt = cls.map((c, j) => rlTarget(c, sig[j], A));
    const pr = new Float64Array(n); for (let t = 0; t < n; t++) { let q = 0; for (let j = 0; j < w.length; j++) q += w[j] * rets[j][t]; pr[t] = q; }
    const sp = sdY(pr); let ar = 0; for (let j = 0; j < w.length; j++) ar += w[j] * (tgt[j] + sig[j] * sig[j] / 2);
    const gExp = ar - sp * sp / 2, H = Hy * 12;
    const f = tgt.map((g, j) => Math.pow((1 + g) / (1 + gh[j]), 1 / 12)), sh = rets.map((r, j) => Array.from(r, x => (1 + x) * f[j] - 1));
    const P = 700, rnd = rlRng(12345 + tickers.join('').length * 7 + Math.round(w[0] * 100)), cg = [], md = [], uw = [];
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
    return { gExp, tgt, cls, sig, H: Hy, c10: q(cg, 0.1), c50: q(cg, 0.5), c90: q(cg, 0.9), m50: q(md, 0.5), m10: q(md, 0.1), u50: q(uw, 0.5), u90: q(uw, 0.9), loss: cg.filter(c => c < 0).length / Math.max(1, cg.length) };
  }
  /* AI · realistic: among every searched mix that kept the past MDD and recovery limits, the highest expected CAGR under the assumptions at month k */
  function realPick(P, A, crit) {
    const S = P.store, N = S.n, M = S.M, K = P.tickers.length, n = P.i1 - P.i0 + 1, ctx = P.ctx, adj = P.adjMap;
    const R = P.tickers.map(t => { const src = (adj && adj[t]) || ctx.ret[t], r = new Float64Array(n); for (let i = 0; i < n; i++) r[i] = src[P.i0 + i]; return r; });
    const mu = R.map(r => r.reduce((a, b) => a + b, 0) / n);
    const C = []; for (let a = 0; a < K; a++) { C.push(new Float64Array(K)); }
    for (let a = 0; a < K; a++) for (let b = a; b < K; b++) { let s = 0; for (let t = 0; t < n; t++) s += (R[a][t] - mu[a]) * (R[b][t] - mu[b]); C[a][b] = C[b][a] = s / (n - 1) * 12; }
    const tg = P.tickers.map((t, j) => rlTarget(assetClass(t), Math.sqrt(C[j][j]), A));
    const ok = i => { const dd = -S.mdd[i]; if (crit.hi != null && !(dd >= (crit.lo || 0) && dd < crit.hi)) return false; if (crit.uw > 0 && S.uw[i] > crit.uw) return false; return true; };
    let best = -1, bv = -Infinity, of = 0;
    const ix = new Int32Array(M), wv = new Float64Array(M);
    for (let i = 0; i < N; i++) {
      if (!ok(i)) continue; of++;
      const m = S.wm[i], bb = i * M; let ar = 0, vp = 0;
      for (let a = 0; a < m; a++) { ix[a] = S.wi[bb + a]; wv[a] = S.wu[bb + a] / P.U; ar += wv[a] * (tg[ix[a]] + C[ix[a]][ix[a]] / 2); }
      for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) vp += wv[a] * wv[b] * C[ix[a]][ix[b]];
      const g = ar - vp / 2;
      if (g > bv + 1e-9 || (Math.abs(g - bv) <= 1e-9 && best >= 0 && S.mdd[i] > S.mdd[best])) { bv = g; best = i; }
    }
    return best < 0 ? null : { i: best, g: bv, of };
  }
  /* the simple table: for each row, the past backtest line and the realistic line */
  const yrTx = m => (m ? dur(m) : '없음');
  function realTable(rows) {
    const t = el('table', 'rl2'), th = el('thead'), hr = el('tr'), cg = el('colgroup'); ['c0', 'c1', 'c2', 'c3'].forEach(c => cg.appendChild(el('col', c))); t.appendChild(cg);
    ['', 'CAGR', 'MDD', '회복 기간'].forEach(s => hr.appendChild(el('th', null, s))); th.appendChild(hr); t.appendChild(th);
    const bd = el('tbody');
    for (const r of rows) {
      const nr = el('tr', 'rl2-n'), nh = el('th'); nh.colSpan = 4; const k = el('span', 'key'); k.style.background = r.color; nh.append(k, document.createTextNode(' ' + r.name)); nr.appendChild(nh); bd.appendChild(nr);
      const st = r.st, R = r.R;
      const p = el('tr', 'rl2-p'); p.appendChild(el('td', 'rl2-l', '과거 백테스트'));
      p.appendChild(el('td', null, pct(st.cagr, 1)));
      const md = el('td', null, mpct1(st.mdd)); const mt = mddRecTx(st); if (mt) md.appendChild(el('small', null, mt)); p.appendChild(md);
      const uw = el('td', null, uwTx(st.uw.months, st.uw.ongoing)); uw.appendChild(el('small', null, '가장 길었던 때')); p.appendChild(uw);
      bd.appendChild(p);
      const q = el('tr', 'rl2-r'); q.appendChild(el('td', 'rl2-l', '현실적으로'));
      if (R) {
        const c1 = el('td'); c1.append(el('b', null, '약 ' + pct(R.gExp, 1)), el('small', null, `나쁘면 ${pct(R.c10, 1)}`), el('small', null, `좋으면 ${pct(R.c90, 1)}`)); q.appendChild(c1);
        const c2 = el('td'); c2.append(el('b', null, '약 ' + mpct1(R.m50)), el('small', null, `나쁘면 ${mpct1(R.m10)}`)); q.appendChild(c2);
        const c3 = el('td'); c3.append(el('b', null, '약 ' + yrTx(R.u50)), el('small', null, `나쁘면 ${yrTx(R.u90)}`)); q.appendChild(c3);
      } else { const c = el('td', 'muted', '계산할 수 없어요'); c.colSpan = 3; q.appendChild(c); }
      bd.appendChild(q);
    }
    t.appendChild(bd); const w = el('div', 'tbl-wrap rl2-w'); w.appendChild(t); return w;
  }
  const rlNote = () => { const A = rlAssume(state.last ? state.last.e : 0); return `현실적으로 = 지금 10년 국채 금리 ${((A.y || 0.04) * 100).toFixed(2)}%에서 과거 데이터로 정한 기대 수익률(채권 ${pct(A.bond, 1)} · 주식 ${pct(A.eq, 1)} · 금 ${pct(A.gold, 1)}${BT.isReal() ? `, 물가 ${RL_INFL * 100}% 뺌` : ''})로 앞으로 ${state.rl.H}년을 700번 모의실험 — ‘약’ = 가운데, ‘나쁘면’ = 나쁜 10%`; };
  /* how each assumption was set, from the data */
  function rlAssumeTable(A, L) {
    const P = A.P, t = el('table', 'rl-as'), hd = el('tr'); ['', '기대 수익률', '어떻게 정했나'].forEach(x => hd.appendChild(el('th', null, x))); const th = el('thead'); th.appendChild(hd); t.appendChild(th);
    const bd = el('tbody'), row = (k, v, how) => { const tr = el('tr'); tr.append(el('th', null, k), el('td', 'num', v), el('td', null, how)); bd.appendChild(tr); };
    const yTx = ((A.y || 0.04) * 100).toFixed(2) + '%';
    row('채권', pct(A.bond, 1), `지금 10년 국채 금리 ${yTx} 그대로.` + (P.bond && P.bond.gap != null ? ` 과거 ${P.bond.nGap}개 시작 달에서 IEF의 그 뒤 10년 수익은 살 때 금리보다 평균 ${ppS(P.bond.gap)}였는데, 이건 금리가 계속 내려간 시기의 덤이라 빼요.` : ''));
    row('주식', pct(A.eq, 1), P.eq ? `지금 금리 ${yTx} + 과거 미국 주식(SPY ${BT.label(P.eq.s)}~${BT.label(P.eq.e)} CAGR ${pct(P.eq.cg, 1)})이 같은 기간 평균 10년 금리(${pct(P.eq.y, 1)})보다 해마다 더 번 몫 ${ppS(P.eq.p)}. 모든 주식 ETF에 같이 써요(한 종목의 짧은 과거는 운이 크게 섞여서).` : '데이터 없음 → 금리 + 5%p');
    row('금 · 원자재', pct(A.gold, 1), P.gold ? `지금 금리 + 과거 금(GLD ${BT.label(P.gold.s)}~${BT.label(P.gold.e)} CAGR ${pct(P.gold.cg, 1)})이 평균 10년 금리(${pct(P.gold.y, 1)})보다 더 번 몫 ${ppS(P.gold.p)}` : '데이터 없음 → 금리와 같게');
    row('현금', pct(A.cash, 1), '지금 미국 단기국채 금리');
    row('그 밖', '', `단기 채권 = 금리와 현금의 중간 · 회사채 = 채권 +1%p · 하이일드 = 채권 +2.5%p · 커버드콜 = 주식 −1%p · 3배 레버리지 = 주식 기대의 3배에서 빌린 돈 비용 · 보수 · 출렁임 손실을 뺀 값` + (BT.isReal() ? ` · 물가를 뺀 계산이라 모두 ${RL_INFL * 100}%를 뺐어요` : ''));
    t.appendChild(bd); const w = el('div', 'tbl-wrap'); w.appendChild(t); return w;
  }
  (function buildRl() {
    $('#rl-port').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.rl.pi = +b.dataset.p; renderReal(); });
    $('#rl-h').addEventListener('change', () => { state.rl.H = +$('#rl-h').value || 20; renderReal(false); rlAI(); });
  })();
  const rlAI = () => { if (state.opt && state.opt.trust && typeof sumPick === 'function') sumPick(true); };
  function renderReal(full = true) {
    const host = $('#rl-say'); if (!host) return;
    host.innerHTML = ''; $('#rl-port').innerHTML = ''; $('#rl-tbl').innerHTML = ''; $('#rl-bond-note').textContent = ''; $('#rl-how-x').innerHTML = ''; $('#rl-assume').innerHTML = '';
    state.rlRes = null;
    const L = state.last, vp = validPorts(); if (!L || !vp.length) { drawReal(); return; }
    const R = state.rl; if (R.pi == null || !vp.find(p => p.i === R.pi)) R.pi = vp[0].i;
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === R.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#rl-port').appendChild(b); }
    const yNow = y10At(L.e), cash = rfAt(L.e);
    $('#rl-h').value = String(R.H);
    $('#rl-bond-note').textContent = yNow != null ? `${BT.label(L.e)} 미국 10년 국채 금리(월평균) ${(yNow * 100).toFixed(2)}% · 현금(미국 단기국채) ${(cash * 100).toFixed(2)}%` : '';
    const A = rlAssume(L.e);
    $('#rl-assume').appendChild(rlAssumeTable(A, L));
    const series = L.series.filter(x => !x.bench), x = series.find(s => s.key === 'p' + R.pi) || series[0];
    // the realistic line for every portfolio
    const exp = series.map(s => Object.assign({ s, hist: s.st.cagr }, rlSim(s.tickers, s.weights, L.s, L.e, L.adj, A, R.H)));
    // eras for the chosen portfolio, and its CAGR without the best one
    const eras = [];
    for (const [nm, y0, y1, why] of RL_ERAS) {
      const a = Math.max(L.s, mIdx(y0, 1) ?? Infinity), b = Math.min(L.e, mIdx(Math.min(y1, 2100), 12) ?? L.e);
      if (!(b - a >= 23)) continue;
      eras.push({ nm, why, a, b, st: BT.stats(BT.backtest(x.tickers, x.weights, a, b, state.rebal, L.adj)), ya: y10At(a), yb: y10At(b) });
    }
    let best = null; for (const e of eras) if (!best || e.st.cagr > best.st.cagr) best = e;
    let lg = 0, mo = 0; for (const e of eras) if (e !== best) { const n = e.b - e.a + 1; lg += Math.log(1 + e.st.cagr) * n / 12; mo += n; }
    const exBest = mo ? Math.exp(lg / (mo / 12)) - 1 : null;
    // start date: CAGR from each January to the end
    const starts = [];
    for (const s of series) {
      const res = BT.backtest(s.tickers, s.weights, L.s, L.e, state.rebal, L.adj), v = res.vals, pts = [];
      for (let k = 0; k <= res.n - 60; k++) { const [yy, mm] = BT.ym(L.s + k); if (mm !== 1 && k !== 0) continue; pts.push({ k, y: yy + (mm - 1) / 12, c: Math.pow(v[res.n] / v[k], 12 / (res.n - k)) - 1 }); }
      starts.push({ s, pts });
    }
    // the bond sleeve: income vs the rest
    const bt = x.tickers.map((t, j) => [t, x.weights[j], assetClass(t)]).filter(q => ['bond', 'short', 'ig', 'hy'].includes(q[2]));
    let bond = null;
    if (bt.length) {
      const tw = bt.reduce((a, q) => a + q[1], 0), rets = bt.map(q => BT.backtest([q[0]], [1], L.s, L.e, 'N', L.adj).r), n = rets[0].length;
      const r = new Float64Array(n); for (let t = 0; t < n; t++) { let s = 0; bt.forEach((q, j) => { s += q[1] / tw * rets[j][t]; }); r[t] = s; }
      const be = eras.map(e => { const seg = Array.from(r.slice(e.a - L.s, e.b - L.s + 1)); let ys = 0, yn = 0; for (let k = e.a; k <= e.b; k++) { const y = y10At(k); if (y != null) { ys += y; yn++; } } const g = geoY(seg), inc = yn ? ys / yn : null; return { e, g, inc, rest: inc == null ? null : g - inc }; });
      const pts = []; for (let t = 0; t + 120 <= n; t++) { const y = y10At(L.s + t); if (y == null) continue; let s = 0; for (let q = t; q < t + 120; q++) s += Math.log(1 + r[q]); pts.push({ x: y, y: Math.exp(s / 10) - 1, k: L.s + t }); }
      bond = { names: bt.map(q => q[0]).join(' · '), be, pts };
    }
    state.rlRes = { x, eras, best, exBest, starts, bond, exp, yNow, cash };
    // the simple part: one line + the table
    host.appendChild(el('p', null, `과거 숫자는 금리가 크게 내린 1982~2020년의 채권 덕을 봤어요. 지금 금리에서 다시 계산한 ‘현실적으로’ 줄을 기준으로 보세요.`));
    $('#rl-tbl').appendChild(realTable(exp.map(e => ({ name: e.s.name, color: e.s.color, st: e.s.st, R: e }))));
    $('#rl-note').textContent = rlNote();
    // the folded how-to: worked example for the chosen portfolio
    const E = exp.find(e => e.s === x), hx = $('#rl-how-x');
    if (E) {
      const p1 = el('p', 'rl-h'); const k = el('span', 'key'); k.style.background = x.color; p1.append(k, el('b', null, `${x.name}로 따라가 보기`)); hx.appendChild(p1);
      const ol = el('ol', 'rl-steps');
      ol.appendChild(el('li', null, `종목별 기대 수익률: ${x.tickers.map((tk, j) => `${tk}(${RL_CLS[E.cls[j]]}) ${pct(E.tgt[j], 1)}`).join(' · ')}`));
      ol.appendChild(el('li', null, `비중대로 섞으면 ${pct(x.tickers.reduce((a, tk, j) => a + x.weights[j] / x.weights.reduce((p, q) => p + q, 0) * E.tgt[j], 0), 1)} → 출렁임과 분산 효과를 반영하면 기대 CAGR 약 ${pct(E.gExp, 1)}`));
      ol.appendChild(el('li', null, `앞으로 ${R.H}년 모의실험 700번: CAGR 하위 10% ${pct(E.c10, 1)} · 가운데 ${pct(E.c50, 1)} · 상위 10% ${pct(E.c90, 1)}, MDD 가운데 ${mpct1(E.m50)} · 나쁜 10% ${mpct1(E.m10)}, 회복 가운데 ${yrTx(E.u50)} · 나쁜 10% ${yrTx(E.u90)}, 손실로 끝날 확률 ${pct(E.loss, 0)}`));
      if (best && exBest != null) ol.appendChild(el('li', null, `확인용: 과거 전체 CAGR ${pct(x.st.cagr, 1)} 중 가장 좋았던 ${best.nm}(${best.why}${best.ya != null ? `, 10년 금리 ${(best.ya * 100).toFixed(1)}% → ${(best.yb * 100).toFixed(1)}%` : ''})에 연 ${pct(best.st.cagr, 1)}. 이 시기를 빼면 연 ${pct(exBest, 1)}예요(현실 기대치 ${pct(E.gExp, 1)}와 견줘 보세요).`));
      hx.appendChild(ol);
    }
    drawReal();
  }
  function drawReal() {
    for (const id of ['#c-rl-era', '#c-rl-start', '#c-rl-bond', '#c-rl-sc', '#c-rl-exp', '#lg-rl-start']) { const e = $(id); if (e) e.innerHTML = ''; }
    const S = state.rlRes; if (!S) return;
    const L = state.last;
    const he = $('#c-rl-era');
    if (he && isShown(he)) { tripleBars(he, [{ key: 'all', name: '전체 기간', color: 'var(--ink)', st: S.x.st }].concat(S.eras.map(e => ({ key: e.nm, name: e.nm, color: S.x.color, st: e.st }))), { sel: 'all' }); $('#rl-era-cap').textContent = S.eras.map(e => `${e.nm} ${e.why}${e.ya != null ? ` (10년 금리 ${(e.ya * 100).toFixed(1)}→${(e.yb * 100).toFixed(1)}%)` : ''}`).join(' · '); }
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
    const hx = $('#c-rl-exp');
    if (hx && isShown(hx) && S.exp.length) {
      const rows = S.exp, W = Math.max(280, hx.clientWidth || 600), narrow = W < 520, lab = narrow ? 92 : 150, rowH = 44, H = 26 + rows.length * rowH + 22, iw = W - lab - 18;
      let lo = 0, hi = 0.05; for (const e of rows) { lo = Math.min(lo, e.c10); hi = Math.max(hi, e.c90, e.hist); }
      const X = v => lab + (v - lo) / (hi - lo) * iw;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '과거 CAGR과 현실적인 기대 범위' }, hx), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(lo, hi, narrow ? 4 : 6)) { const x = X(v); svg('line', { x1: x, x2: x, y1: 20, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
      const k1 = svg('text', { x: lab, y: 12 }, ax); k1.textContent = narrow ? '◆ 과거  ● 현실  ━ 앞으로 ' + state.rl.H + '년 범위' : '◆ 과거 CAGR   ● 현실적인 기대   ━ 앞으로 ' + state.rl.H + '년 하위10~상위10%'; k1.style.fontWeight = '600';
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
