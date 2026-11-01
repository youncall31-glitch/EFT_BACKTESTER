  /* ---------- v7.1 (new app): one mix kept unchanged for every horizon ----------
     The whole analysis period is searched like any other window. Its best candidates are then run, unchanged,
     on every 10·20·30-year window. Any fall or underwater spell inside a window also happens over the whole
     period, so the whole-period MDD and recovery time bound every window; returns are judged by the worst window. */
  async function keepPlan(opts, onProgress) {
    opts = Object.assign({}, opts, { _ret: RET, _rf: RF, _real: REAL && !!(CUR === 'KRW' ? KCPI : CPI), _cur: CUR });
    if (opts.adj === true) opts.adj = adjSnapshot();
    const U = Math.round(1 / opts.step), maxU = Math.max(1, Math.min(U, Math.floor(opts.maxW * U + 1e-9)));
    const P = planWindow({ id: 'all', pos: 'all', years: Math.floor((opts.i1 - opts.i0 + 1) / 12), i0: opts.i0, i1: opts.i1 }, opts.tickers, opts.mode, U, maxU);
    if (!P.ok) return P;
    await runHorizon(P, opts, f => onProgress && onProgress(f));
    P.ctx = { ret: opts._ret, rf: opts._rf, rule: opts.rule };
    return P;
  }
  /* wins: [{id, i0, i1}] inside the plan's period. crits: the optimizer's criteria. LIM candidates per criterion. */
  function keepPick(P, wins, crits, LIM) {
    LIM = LIM || 3000;
    const S = P.store, N = S.n, M = S.M;
    const evs = wins.filter(w => w.i0 >= P.i0 && w.i1 <= P.i1 && w.i1 > w.i0)
      .map(w => ({ id: w.id, E: makeEvaluator(P.tickers, w.i0, w.i1, P.ctx.rule, P.adjMap, P.ctx.ret, P.ctx.rf) }));
    const idx = new Int32Array(M), un = new Int32Array(M), memo = new Map();
    const evalI = i => {
      let r = memo.get(i); if (r) return r;
      const m = S.wm[i], b = i * M; for (let j = 0; j < m; j++) { idx[j] = S.wi[b + j]; un[j] = S.wu[b + j]; }
      r = { minS: S.score[i], minC: S.cagr[i], wS: 'all', wC: 'all' };
      for (const { id, E } of evs) { const o = E.ev(idx, un, m, P.U); if (o.score < r.minS) { r.minS = o.score; r.wS = id; } if (o.cagr < r.minC) { r.minC = o.cagr; r.wC = id; } }
      memo.set(i, r); return r;
    };
    const out = {};
    for (const c of crits) {
      const feas = [];
      for (let i = 0; i < N; i++) if (fitness(S, i, c) > 5e5) feas.push(i);
      if (!feas.length) { const s = optSelect(P, c); out[c.id] = s ? Object.assign({ i: s.i, feasible: false, pool: 0 }, evalI(s.i)) : null; continue; }
      const key = c.kind === 'ai' ? S.score : S.cagr;
      feas.sort((a, b) => key[b] - key[a]);
      const pool = feas.slice(0, LIM);
      let best = -1, bv = -Infinity;
      for (const i of pool) {
        const r = evalI(i);
        const v = c.kind === 'ai' ? r.minS + r.minC * 1e-6 : r.minC + S.mdd[i] * 1e-6;
        if (v > bv) { bv = v; best = i; }
      }
      out[c.id] = Object.assign({ i: best, feasible: true, pool: pool.length, of: feas.length }, evalI(best));
    }
    return out;
  }

