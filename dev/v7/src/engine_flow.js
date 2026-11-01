  /* ---------- v7 (new app): cash flows — monthly contributions, withdrawals, Korean taxes, KRW ----------
     Runs in nominal money of the chosen currency (taxes are charged on nominal gains, as in real life). With o.real
     every reported amount is divided by that currency's price level (start of the run = 1), so it reads in
     start-date money, and contribution/withdrawal amounts typed in are start-date money too.
     Tax cost bases are kept in KRW: a Korean resident's capital gains are measured in won, so a USD holding's
     gain includes the exchange-rate move between buying and selling. */
  const isK = cur => cur === 'KRW' && !!KFX;
  const unitSet = cur => (isK(cur) ? SETS.kn : SETS.n);
  const adjFor = cur => (isK(cur) ? ADJ.kn : ADJ.n);
  const inflOf = cur => (isK(cur) ? KCPI : CPI);
  function irrOf(cf) {   // monthly cash flows (negative = paid in), annualised internal rate of return
    let pos = false, neg = false; for (const x of cf) { if (x > 1e-9) pos = true; if (x < -1e-9) neg = true; }
    if (!pos || !neg) return null;
    const npv = i => { let s = 0, d = 1; const q = 1 / (1 + i); for (let t = 0; t < cf.length; t++) { s += cf[t] * d; d *= q; } return s; };
    let lo = -0.3, hi = 0.5, flo = npv(lo), fhi = npv(hi);
    if (!(flo * fhi < 0)) return null;
    for (let it = 0; it < 200; it++) { const mid = (lo + hi) / 2, f = npv(mid); if (Math.abs(f) < 1e-10) { lo = hi = mid; break; } if (f * flo < 0) { hi = mid; fhi = f; } else { lo = mid; flo = f; } }
    return Math.pow(1 + (lo + hi) / 2, 12) - 1;
  }
  /* o: {tickers, weights, i0, i1, rule, adj, div, cur, real, initial,
         contrib: {amt, grow, months}, wd: {mode: 'none'|'fixed'|'pct', amt, pct, start, index},
         tax: {mode: 'none'|'us'|'kr'|'pen', div, cg, ded, kr, pen}, lean} */
  function flowSim(o) {
    const set = unitSet(o.cur), A = o.adj ? adjFor(o.cur) : null, infl = inflOf(o.cur), krw = isK(o.cur);
    const k = o.tickers.length, n = o.i1 - o.i0 + 1, lean = !!o.lean;
    const tw = o.weights.reduce((a, b) => a + b, 0), w = o.weights.map(x => x / tw);
    const rets = o.tickers.map(t => (A && A[t]) || set.RET[t]);
    const incs = o.tickers.map(t => set.INC[t] || null);
    const T = o.tax || {}, tm = T.mode || 'none', taxed = tm === 'us' || tm === 'kr';
    const lv = m => (KLV ? KLV[m + 1] : 1);                    // KRW per USD at the end of month m
    const toK = (x, m) => (krw ? x : x * lv(m)), fromK = (x, m) => (krw ? x : x / lv(m));
    const pl = new Float64Array(n + 1); pl[0] = 1;           // price level at the end of month t-1 (start = 1)
    for (let t = 0; t < n; t++) pl[t + 1] = pl[t] * (1 + (infl ? infl[o.i0 + t] : 0));
    const sc = o.real ? pl : null;                           // nominal / sc[t] = start-date money
    const re = (x, t) => (sc ? x / sc[t] : x);
    const h = new Float64Array(k), basis = new Float64Array(k);
    const V0 = o.initial;
    for (let j = 0; j < k; j++) { h[j] = V0 * w[j]; basis[j] = toK(h[j], o.i0 - 1); }
    const C = o.contrib || {}, Wd = o.wd || { mode: 'none' };
    const cAmt = +C.amt || 0, cGrow = +C.grow || 0, cMonths = C.months == null ? n : C.months, cYear = C.freq === 'Y', y0 = Math.floor(o.i0 / 12);
    const wMode = Wd.mode || 'none', wStart = Wd.start || 0;
    const R = lean ? null : {
      vals: new Float64Array(n + 1), net: new Float64Array(n + 1), cin: new Float64Array(n), wout: new Float64Array(n),
      inc: new Float64Array(n), tax: new Float64Array(n), twr: new Float64Array(n + 1), cf: new Float64Array(n + 1)
    };
    let depleted = -1, gainYr = 0, pendK = 0, twr = 1, netIn = V0;
    let sIn = V0, sOut = 0, sInc = 0, tDiv = 0, tCg = 0, tWd = 0, minV = V0, minT = 0;
    if (R) { R.vals[0] = V0; R.net[0] = V0; R.twr[0] = 1; R.cf[0] = -V0; }
    for (let t = 0; t < n; t++) {
      const m = o.i0 + t;
      let V = 0; for (let j = 0; j < k; j++) V += h[j];
      if (depleted < 0) {
        // 1. money in at the start of the month, bought at the target weights
        if (cAmt > 0 && t < cMonths && (!cYear || m % 12 === 0)) {   // yearly: at the start of each January
          const c = cAmt * (sc ? pl[t] : 1) * Math.pow(1 + cGrow, cYear ? Math.floor(m / 12) - y0 : Math.floor(t / 12));
          for (let j = 0; j < k; j++) { const b = c * w[j]; h[j] += b; basis[j] += toK(b, m - 1); }
          V += c; netIn += c; sIn += re(c, t); if (R) { R.cin[t] = re(c, t); R.cf[t] -= re(c, t); }
        }
        // 2. money out, sold pro rata; tax on the sale is added on top so the net amount arrives
        if (wMode !== 'none' && t >= wStart && V > 0) {
          let net = wMode === 'pct' ? V * (+Wd.pct || 0) / 12 : (+Wd.amt || 0) * ((sc || Wd.index) ? pl[t] : 1);
          let rate = 0;
          if (tm === 'kr') { let bs = 0; for (let j = 0; j < k; j++) bs += basis[j]; const VK = toK(V, m - 1); rate = VK > 0 ? (T.kr || 0) * Math.max(0, 1 - bs / VK) : 0; }
          else if (tm === 'pen') rate = T.pen || 0;
          let gross = net / (1 - rate);
          if (gross >= V - 1e-9) { gross = V; net = V * (1 - rate); depleted = t; }
          const f = gross / V; let gK = 0;
          for (let j = 0; j < k; j++) { const sold = h[j] * f; gK += toK(sold, m - 1) - basis[j] * f; basis[j] *= 1 - f; h[j] -= sold; }
          if (depleted === t) for (let j = 0; j < k; j++) { h[j] = 0; basis[j] = 0; }
          if (tm === 'us') gainYr += gK;
          const tx = gross - net; tWd += re(tx, t);
          V -= gross; netIn -= net; sOut += re(net, t);
          if (R) { R.wout[t] = re(net, t); R.tax[t] += re(tx, t); R.cf[t] += re(net, t); }
        }
      }
      const Vs = V;
      // 3. the month's returns; distributions are taxed when paid, then reinvested or paid out
      let tot = 0, cash = 0, dtax = 0;
      if (Vs > 0) for (let j = 0; j < k; j++) {
        const x = h[j]; let d = incs[j] ? incs[j][m] : 0; if (!(d > 0)) d = 0;
        const dist = x * d, dt = taxed ? dist * (T.div || 0) : 0;
        if (o.div) { h[j] = x * (1 + rets[j][m] - d); cash += dist - dt; }
        else { h[j] = x * (1 + rets[j][m]) - dt; if (taxed) basis[j] += toK(dist - dt, m); }
        dtax += dt; tot += h[j];
      }
      let tx = dtax; tDiv += re(dtax, t + 1);
      if (cash > 0) { sInc += re(cash, t + 1); if (R) { R.inc[t] = re(cash, t + 1); R.cf[t + 1] += re(cash, t + 1); } }
      // 4. overseas-stock capital gains tax: settled each December, paid at the end of the following May
      if (tm === 'us' && tot > 0) {
        if (m % 12 === 4 && pendK > 0) {
          const pay = Math.min(fromK(pendK, m), tot), f = pay / tot; let gK = 0;
          for (let j = 0; j < k; j++) { gK += toK(h[j] * f, m) - basis[j] * f; basis[j] *= 1 - f; h[j] *= 1 - f; }
          gainYr += gK; tot -= pay; pendK = 0; tx += pay; tCg += re(pay, t + 1);
        }
        if (m % 12 === 11) { pendK += (T.cg || 0) * Math.max(0, gainYr - (T.ded || 0)); gainYr = 0; }
      }
      // 5. rebalancing, the same rule as the backtest; sells realise gains
      if (tot > 0 && t < n - 1) {
        let reb = false;
        if (o.rule === 'B') { for (let j = 0; j < k; j++) { if (Math.abs(h[j] / tot - w[j]) > Math.min(0.05, 0.25 * w[j]) + 1e-12) { reb = true; break; } } }
        else reb = calRebal(m, o.rule);
        if (reb) {
          let nowK = 0;
          for (let j = 0; j < k; j++) {
            const tg = tot * w[j];
            if (h[j] > tg) { const f = (h[j] - tg) / h[j], gK = toK(h[j] - tg, m) - basis[j] * f; basis[j] *= 1 - f; if (tm === 'us') gainYr += gK; else if (tm === 'kr') nowK += (T.kr || 0) * Math.max(0, gK); }
            else if (taxed) basis[j] += toK(tg - h[j], m);
          }
          const pay = nowK > 0 ? Math.min(fromK(nowK, m), tot) : 0;
          if (pay > 0) { tot -= pay; tx += pay; tCg += re(pay, t + 1); }
          for (let j = 0; j < k; j++) h[j] = tot * w[j];
        }
      }
      if (Vs > 0) twr *= tot / Vs;
      const rv = re(tot, t + 1);
      if (rv < minV) { minV = rv; minT = t + 1; }
      if (R) { R.vals[t + 1] = rv; R.net[t + 1] = re(netIn, t + 1); R.twr[t + 1] = twr; R.tax[t] += re(tx, t + 1); }
    }
    // selling everything at the end
    let V = 0; for (let j = 0; j < k; j++) V += h[j];
    let liq = 0;
    if (V > 0) {
      if (tm === 'us') { let gK = gainYr; for (let j = 0; j < k; j++) gK += toK(h[j], o.i1) - basis[j]; liq = fromK((T.cg || 0) * Math.max(0, gK - (T.ded || 0)) + pendK, o.i1); }
      else if (tm === 'kr') { let s = 0; for (let j = 0; j < k; j++) s += Math.max(0, toK(h[j], o.i1) - basis[j]); liq = fromK((T.kr || 0) * s, o.i1); }
      else if (tm === 'pen') liq = V * (T.pen || 0);
      liq = Math.min(liq, V);
    }
    const fin = re(V, n), finAfter = re(V - liq, n), liqR = re(liq, n);
    if (lean) return { final: fin, finalAfter: finAfter, depleted, minV, minT, totIn: sIn };
    R.cf[n] += finAfter;
    const yrs = n / 12, tw1 = R.twr[n];
    let pk = 1, mdd = 0; for (let t = 0; t <= n; t++) { const v = sc ? R.twr[t] / pl[t] : R.twr[t]; if (v > pk) pk = v; else if (v / pk - 1 < mdd) mdd = v / pk - 1; }
    // time-weighted return in the reported unit (real: divided by the price level over the run)
    const twrU = sc ? tw1 / pl[n] : tw1;
    return Object.assign(R, {
      n, i0: o.i0, i1: o.i1, final: fin, finalAfter: finAfter, liqTax: liqR, totIn: sIn, totOut: sOut, totInc: sInc,
      taxDiv: tDiv, taxCg: tCg, taxWd: tWd, taxAll: tDiv + tCg + tWd + liqR, depleted, minV, minT,
      irr: irrOf(R.cf), twrCagr: twrU > 0 ? Math.pow(twrU, 1 / yrs) - 1 : -1, mdd, pl
    });
  }
  /* the same plan started in every month from s0 (each run L months), lean results */
  function flowStarts(o, L, s0, s1) {
    const out = [];
    for (let s = s0; s + L - 1 <= s1; s++) out.push(Object.assign({ s }, flowSim(Object.assign({}, o, { i0: s, i1: s + L - 1, lean: true }))));
    return out;
  }
  /* highest inflation-linked first-year withdrawal rate (of the starting amount) that every start (q = 1) or the
     share q of starts survived without running out */
  function safeRate(o, L, s0, s1, q) {
    const ok = r => { const runs = flowStarts(Object.assign({}, o, { wd: { mode: 'fixed', amt: o.initial * r / 12, start: 0, index: true } }), L, s0, s1); let good = 0; for (const x of runs) if (x.depleted < 0) good++; return runs.length ? good / runs.length >= q - 1e-9 : false; };
    let lo = 0, hi = 0.25;
    if (ok(hi)) return hi;
    for (let it = 0; it < 16; it++) { const mid = (lo + hi) / 2; if (ok(mid)) lo = mid; else hi = mid; }
    return lo;
  }
  function setCur(c) { CUR = c === 'KRW' && KFX ? 'KRW' : 'USD'; REAL = REAL && !!(CUR === 'KRW' ? KCPI : CPI); activate(); return CUR; }

