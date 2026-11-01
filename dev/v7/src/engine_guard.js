  /* ---------- v7.9 (new app): a defence rule — cut the attacking assets after a fall, put them back on a signal ----------
     o: {tickers, weights, attack:[bool per ticker], def: ticker that receives the cut, cut: share of each attacking weight moved (0–1),
         trig: drawdown that switches on (0.10 = −10%; after a way back it re-arms only at a new high or a new low below the last trough, so it does not flip every month) or 'sma' (attacking assets below their 10-month average),
         back: 'sma' | 'half' | 'bounce' | 'time' | 'peak', stage: months to step back (1 = at once), i0, i1, rule, adj,
         mode: 'def' (default: attack → def) | 'lean' (the other holdings → attack, buy the dip) | 'rebal' (rebalance to target once at the trigger)}
     Signals are read at a month end and acted on at that month end, so they apply from the next month (no look-ahead).
     Total return (distributions reinvested). */
  function guardSim(o) {
    const k = o.tickers.length, n = o.i1 - o.i0 + 1;
    const tk = o.tickers.slice(), rets = tk.map(t => retOf(t, o.adj));
    let di = tk.indexOf(o.def); if (di < 0) { tk.push(o.def); rets.push(retOf(o.def, o.adj)); di = tk.length - 1; }
    const K = tk.length, tw = o.weights.reduce((a, b) => a + b, 0);
    const base = new Float64Array(K); for (let j = 0; j < k; j++) base[j] = o.weights[j] / tw;
    let atW = 0; for (let j = 0; j < k; j++) if (o.attack[j]) atW += base[j];
    const mode = o.mode || 'def';
    const target = lvl => {
      const w = Float64Array.from(base); let mv = 0;
      if (mode === 'lean') { if (atW <= 0) return w; for (let j = 0; j < k; j++) if (!o.attack[j]) { const d = w[j] * o.cut * lvl; w[j] -= d; mv += d; } for (let j = 0; j < k; j++) if (o.attack[j]) w[j] += mv * base[j] / atW; return w; }
      for (let j = 0; j < k; j++) if (o.attack[j]) { const d = w[j] * o.cut * lvl; w[j] -= d; mv += d; } w[di] += mv; return w;
    };
    let w = target(0); const h = Float64Array.from(w);
    const vals = new Float64Array(n + 1), r = new Float64Array(n), lv = new Float64Array(n + 1), ev = [];
    vals[0] = 1;
    let v = 1, peak = 1, lvl = 0, goal = 0, trough = 1, tDef = 0, ai = 1, armed = true, lastLow = 0; const aiH = [];
    for (let t = 0; t < n; t++) {
      const m = o.i0 + t; let tot = 0;
      for (let j = 0; j < K; j++) { const x = h[j]; if (x !== 0) h[j] = x * (1 + rets[j][m]); tot += h[j]; }
      if (atW > 0) { let ar = 0; for (let j = 0; j < k; j++) if (o.attack[j]) ar += base[j] * rets[j][m]; ai *= 1 + ar / atW; }
      aiH.push(ai);
      vals[t + 1] = tot; r[t] = tot / v - 1; v = tot; if (v > peak) { peak = v; armed = true; }
      if (!armed && v < lastLow) armed = true;
      const dd = v / peak - 1;
      let sma = null; if (aiH.length >= 10) { let s = 0; for (let q = aiH.length - 10; q < aiH.length; q++) s += aiH[q]; sma = s / 10; }
      const above = sma != null && ai > sma;
      let ng = goal, force = false;
      if (o.trig === 'sma') { if (sma != null) ng = above ? 0 : 1; }
      else if (goal === 0) { if (armed && dd <= -o.trig) { if (mode === 'rebal') { ev.push({ t, type: 'reb', dd }); force = true; armed = false; lastLow = v * (1 - o.trig); } else { ng = 1; trough = v; tDef = 0; } } }
      else {
        tDef++; if (v < trough) trough = v;
        const back = o.back === 'sma' ? above : o.back === 'half' ? v >= trough + (peak - trough) * 0.5 : o.back === 'bounce' ? v >= trough * 1.10 : o.back === 'time' ? tDef >= 12 : dd >= -0.05;
        if (back) { ng = 0; armed = false; lastLow = trough; }
      }
      if (ng !== goal) { ev.push({ t, type: ng ? 'cut' : 'back', dd }); goal = ng; }
      let nl = lvl; if (goal === 1) nl = 1; else if (lvl > 0) nl = Math.max(0, lvl - 1 / (o.stage || 1)); if (nl < 1e-9) nl = 0;
      if (t < n - 1) {
        let reb = false;
        if (nl !== lvl) { lvl = nl; w = target(lvl); reb = true; }
        else if (force) reb = true;
        else if (o.rule === 'B') { for (let j = 0; j < K; j++) if (Math.abs(h[j] / tot - w[j]) > Math.min(0.05, 0.25 * w[j]) + 1e-12) { reb = true; break; } }
        else reb = calRebal(m, o.rule);
        if (reb) for (let j = 0; j < K; j++) h[j] = tot * w[j];
      }
      lv[t + 1] = lvl;
    }
    return { vals, r, n, i0: o.i0, i1: o.i1, inc: null, nReb: 0, lv, ev };
  }

