  /* ---------- v7.5 (new app): will a backtest hold up? ----------
     No statistic can promise future returns. These estimate how much of a backtest is likely luck or search:
     - Probabilistic / Deflated Sharpe Ratio (Bailey & López de Prado 2012, 2014)
     - Probability of Backtest Overfitting by combinatorially symmetric cross-validation (Bailey, Borwein, López de Prado & Zhu 2017)
     - stationary block bootstrap of the monthly returns (Politis & Romano 1994)
     - the app's own: block-consistency score and weight-neighbourhood (plateau) averaging */
  function Phi(x) {   // standard normal CDF, Abramowitz–Stegun 7.1.26
    const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.3275911 * z);
    const e = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
    return x >= 0 ? (1 + e) / 2 : (1 - e) / 2;
  }
  function PhiInv(p) {   // inverse normal CDF (Acklam)
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pl = 0.02425;
    if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  /* ex: monthly excess returns. N: how many mixes were tried before this one was picked (1 = none), VSR: variance of the
     tried mixes' monthly Sharpe ratios. Returns annualised Sharpe, PSR (P[true Sharpe > 0]), DSR (P[true Sharpe > what the
     best of N lucky tries would show]) and the minimum track record for 95% confidence that the Sharpe is above zero. */
  function sharpeTest(ex, N, VSR) {
    const T = ex.length; let m = 0; for (const x of ex) m += x; m /= T;
    let v = 0, s3 = 0, s4 = 0; for (const x of ex) { const d = x - m; v += d * d; s3 += d * d * d; s4 += d * d * d * d; }
    const pv = v / T, sd = Math.sqrt(v / (T - 1));
    const g3 = pv > 0 ? (s3 / T) / Math.pow(pv, 1.5) : 0, g4 = pv > 0 ? (s4 / T) / (pv * pv) : 3;
    const sr = sd > 0 ? m / sd : 0;
    const k = Math.max(1e-9, 1 - g3 * sr + (g4 - 1) / 4 * sr * sr);
    const psrAt = s0 => Phi((sr - s0) * Math.sqrt(T - 1) / Math.sqrt(k));
    let sr0 = 0;
    if (N > 1 && VSR > 0) { const g = 0.5772156649; sr0 = Math.sqrt(VSR) * ((1 - g) * PhiInv(1 - 1 / N) + g * PhiInv(1 - 1 / (N * Math.E))); }
    const z95 = 1.6448536;
    const minTRL = sr > 0 ? 1 + k * (z95 / sr) * (z95 / sr) : Infinity;   // months
    return { sr: sr * SQ12, sr0: sr0 * SQ12, psr: psrAt(0), dsr: N > 1 ? psrAt(sr0) : null, skew: g3, kurt: g4, T, minTRL };
  }
  /* stationary block bootstrap: H-month paths glued from runs of consecutive past months (mean run length blk) */
  function bootstrap(r, rf, H, paths, blk, seed) {
    const n = r.length, rand = mulberry(seed || 20261028), p = 1 / (blk || 12);
    const cg = new Float64Array(paths), md = new Float64Array(paths); let beat = 0, beat2 = 0;
    for (let k = 0; k < paths; k++) {
      let v = 1, c = 1, peak = 1, mdd = 0, j = Math.floor(rand() * n);
      for (let t = 0; t < H; t++) {
        if (t > 0) j = rand() < p ? Math.floor(rand() * n) : (j + 1) % n;
        v *= 1 + r[j]; c *= 1 + rf[j];
        if (v > peak) peak = v; else { const d = v / peak - 1; if (d < mdd) mdd = d; }
      }
      cg[k] = v > 0 ? Math.pow(v, 12 / H) - 1 : -1; md[k] = mdd; if (v > c) beat++; if (cg[k] - (Math.pow(c, 12 / H) - 1) >= 0.02) beat2++;
    }
    cg.sort(); md.sort();
    const q = (a, x) => a[Math.min(a.length - 1, Math.max(0, Math.round(x * (a.length - 1))))];
    return { H, paths, c05: q(cg, 0.05), c50: q(cg, 0.5), c95: q(cg, 0.95), m50: q(md, 0.5), m05: q(md, 0.05), beat: beat / paths, beat2: beat2 / paths };
  }
  /* every mix of a searched plan, re-run with its months split into B equal blocks: per-block excess-return sums and log growth */
  async function trustScan(P, onProgress) {
    const S = P.store, N = S.n, M = S.M, n = P.i1 - P.i0 + 1;
    let B = Math.min(10, Math.floor(n / 24)); if (B % 2) B--;
    if (B < 4) return { ok: false, reason: '분석 기간이 8년보다 짧아 시기별로 나눠 볼 수 없어요' };
    const edges = []; for (let b = 0; b <= B; b++) edges.push(Math.round(b * n / B));
    const blkOf = new Uint8Array(n); for (let b = 0; b < B; b++) for (let t = edges[b]; t < edges[b + 1]; t++) blkOf[t] = b;
    const bn = new Float64Array(B); for (let b = 0; b < B; b++) bn[b] = edges[b + 1] - edges[b];
    const K = P.tickers.length, ctx = P.ctx, adj = P.adjMap;
    const R = new Float64Array(K * n);
    for (let j = 0; j < K; j++) { const t = P.tickers[j]; const src = (adj && adj[t]) || ctx.ret[t]; for (let i = 0; i < n; i++) R[j * n + i] = src[P.i0 + i]; }
    const rf = new Float64Array(n); for (let t = 0; t < n; t++) rf[t] = ctx.rf[P.i0 + t];
    const reb = new Uint8Array(n); for (let t = 0; t < n; t++) reb[t] = calRebal(P.i0 + t, ctx.rule) ? 1 : 0;
    const band = ctx.rule === 'B';
    const h = new Float64Array(K + 1), w = new Float64Array(K + 1), lim = new Float64Array(K + 1), off = new Int32Array(K + 1);
    function sim(idx, un, m, U, A1, A2, AL, o) {
      for (let j = 0; j < m; j++) { const wj = un[j] / U; w[j] = wj; h[j] = wj; off[j] = idx[j] * n; lim[j] = Math.min(0.05, 0.25 * wj) + 1e-12; }
      let prev = 1;
      for (let t = 0; t < n; t++) {
        let tot = 0;
        for (let j = 0; j < m; j++) { const v = h[j] * (1 + R[off[j] + t]); h[j] = v; tot += v; }
        const g = tot / prev, ex = g - 1 - rf[t], b = o + blkOf[t];
        A1[b] += ex; A2[b] += ex * ex; AL[b] += Math.log(g);
        prev = tot;
        if (t < n - 1) {
          if (band) { for (let j = 0; j < m; j++) if (Math.abs(h[j] / tot - w[j]) > lim[j]) { for (let q = 0; q < m; q++) h[q] = tot * w[q]; break; } }
          else if (reb[t] === 1) for (let j = 0; j < m; j++) h[j] = tot * w[j];
        }
      }
    }
    const s1 = new Float64Array(N * B), s2 = new Float64Array(N * B), lg = new Float64Array(N * B);
    const idx = new Int32Array(M), un = new Int32Array(M);
    let lastY = nowMs();
    for (let i = 0; i < N; i++) {
      const m = S.wm[i], bb = i * M; for (let j = 0; j < m; j++) { idx[j] = S.wi[bb + j]; un[j] = S.wu[bb + j]; }
      sim(idx, un, m, P.U, s1, s2, lg, i * B);
      if (nowMs() - lastY > 28) { onProgress && onProgress(i / N * 0.6); await yieldUI(); lastY = nowMs(); }
    }
    const VF = 0.01 * 0.01 / 12;
    const bsr = new Float64Array(N * B);
    for (let k = 0; k < N * B; k++) { const c = bn[k % B], mm = s1[k] / c, v = Math.max((s2[k] - c * mm * mm) / (c - 1), VF); bsr[k] = mm / Math.sqrt(v) * SQ12; }
    return { ok: true, B, bn, edges, s1, s2, lg, bsr, sim, n, N, K };
  }
  /* the app's consistency score: mean block Sharpe minus half their spread (a mix that only worked in one era scores low) */
  function blockScore(bsr, o, B) { let m = 0; for (let b = 0; b < B; b++) m += bsr[o + b]; m /= B; let v = 0; for (let b = 0; b < B; b++) { const d = bsr[o + b] - m; v += d * d; } return m - 0.5 * Math.sqrt(v / (B - 1)); }
  /* pick the mix whose consistency score, averaged with every mix one weight step away, is highest (a plateau, not a spike).
     crit: {lo, hi, uw} limits on the whole-period MDD and recovery (lo = hi = null: none) */
  function trustPick(P, T, crit, TOP) {
    TOP = TOP || 300;
    const S = P.store, B = T.B, M = S.M, U = P.U, maxU = P.maxU, K = P.tickers.length;
    const sc = new Float64Array(T.N); for (let i = 0; i < T.N; i++) sc[i] = blockScore(T.bsr, i * B, B);
    const ok = i => { const dd = -S.mdd[i]; if (crit.hi != null && !(dd >= (crit.lo || 0) && dd < crit.hi)) return false; if (crit.uw > 0 && S.uw[i] > crit.uw) return false; return true; };
    const feas = []; for (let i = 0; i < T.N; i++) if (ok(i)) feas.push(i);
    if (!feas.length) return null;
    feas.sort((a, b) => sc[b] - sc[a]);
    if (!T.map) { T.map = new Map(); for (let i = 0; i < T.N; i++) { const m = S.wm[i], bb = i * M, p = []; for (let j = 0; j < m; j++) if (S.wu[bb + j] > 0) p.push(S.wi[bb + j] * 1000 + S.wu[bb + j]); p.sort((x, y) => x - y); T.map.set(p.join(','), i); } }
    const extra = new Map();   // neighbours that were never evaluated in the search
    const A1 = new Float64Array(B), A2 = new Float64Array(B), AL = new Float64Array(B), bs = new Float64Array(B);
    const scoreOf = u => {
      const p = []; for (let j = 0; j < K; j++) if (u[j] > 0) p.push(j * 1000 + u[j]);
      const key = p.join(','); const i = T.map.get(key); if (i != null) return sc[i];
      if (extra.has(key)) return extra.get(key);
      A1.fill(0); A2.fill(0); AL.fill(0);
      const idx = [], un = []; for (let j = 0; j < K; j++) if (u[j] > 0) { idx.push(j); un.push(u[j]); }
      T.sim(idx, un, idx.length, U, A1, A2, AL, 0);
      for (let b = 0; b < B; b++) { const c = T.bn[b], mm = A1[b] / c, v = Math.max((A2[b] - c * mm * mm) / (c - 1), 0.01 * 0.01 / 12); bs[b] = mm / Math.sqrt(v) * SQ12; }
      const s = blockScore(bs, 0, B); extra.set(key, s); return s;
    };
    let best = -1, bv = -Infinity, bInfo = null;
    const u = new Int32Array(K);
    for (const i of feas.slice(0, TOP)) {
      u.fill(0); const m = S.wm[i], bb = i * M; for (let j = 0; j < m; j++) u[S.wi[bb + j]] = S.wu[bb + j];
      let sum = sc[i], cnt = 1, worst = sc[i];
      for (let a = 0; a < K; a++) { if (u[a] < 1) continue;
        for (let b = 0; b < K; b++) { if (b === a || u[b] + 1 > maxU) continue;
          u[a]--; u[b]++; const s = scoreOf(u); u[a]++; u[b]--; sum += s; cnt++; if (s < worst) worst = s; } }
      const v = sum / cnt;
      if (v > bv) { bv = v; best = i; bInfo = { self: sc[i], plateau: v, nb: cnt - 1, worstNb: worst }; }
    }
    return Object.assign({ i: best, feasible: true, of: feas.length }, bInfo);
  }
  /* Probability of Backtest Overfitting by CSCV: for every way to split the B blocks into two halves, pick the best mix on one
     half by a rule and see where it ranks among all mixes on the other half. PBO = share of splits where it lands below the median. */
  async function pboCalc(P, T, onProgress) {
    const B = T.B, N = T.N, H = B / 2, bn = T.bn, s1 = T.s1, s2 = T.s2, lg = T.lg, bsr = T.bsr;
    const masks = []; for (let mk = 0; mk < (1 << B); mk++) { let c = 0; for (let b = 0; b < B; b++) if (mk >> b & 1) c++; if (c === H) masks.push(mk); }
    const RULES = ['sh', 'cagr', 'rob'];
    const out = {}; for (const r of RULES) out[r] = { below: 0, isS: [], oosS: [], rank: [] };
    const oos = new Float64Array(N), VF = 0.01 * 0.01 / 12;
    let lastY = nowMs();
    for (let q = 0; q < masks.length; q++) {
      const mk = masks[q];
      let bSh = -1, vSh = -Infinity, bCg = -1, vCg = -Infinity, bRb = -1, vRb = -Infinity;
      for (let i = 0; i < N; i++) {
        const o = i * B; let a1 = 0, a2 = 0, an = 0, c1 = 0, c2 = 0, cn = 0, gl = 0, rm = 0, rv = 0;
        for (let b = 0; b < B; b++) {
          if (mk >> b & 1) { a1 += s1[o + b]; a2 += s2[o + b]; an += bn[b]; gl += lg[o + b]; rm += bsr[o + b]; }
          else { c1 += s1[o + b]; c2 += s2[o + b]; cn += bn[b]; }
        }
        const am = a1 / an, ash = am / Math.sqrt(Math.max((a2 - an * am * am) / (an - 1), VF));
        const cm = c1 / cn; oos[i] = cm / Math.sqrt(Math.max((c2 - cn * cm * cm) / (cn - 1), VF));
        rm /= H; for (let b = 0; b < B; b++) if (mk >> b & 1) { const d = bsr[o + b] - rm; rv += d * d; }
        const rob = rm - 0.5 * Math.sqrt(rv / (H - 1));
        const cg = gl / an;
        if (ash > vSh) { vSh = ash; bSh = i; } if (cg > vCg) { vCg = cg; bCg = i; } if (rob > vRb) { vRb = rob; bRb = i; }
      }
      const rankOf = i => { const x = oos[i]; let lo = 0; for (let k = 0; k < N; k++) if (oos[k] < x) lo++; return (lo + 0.5) / N; };
      for (const [r, i, isv] of [['sh', bSh, vSh], ['cagr', bCg, null], ['rob', bRb, null]]) {
        const w = rankOf(i); const O = out[r];
        if (w <= 0.5) O.below++;
        O.rank.push(w); O.oosS.push(oos[i] * SQ12);
        if (isv != null) O.isS.push(isv * SQ12);
      }
      if (nowMs() - lastY > 28) { onProgress && onProgress(0.6 + 0.4 * q / masks.length); await yieldUI(); lastY = nowMs(); }
    }
    const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
    const res = { splits: masks.length, B };
    for (const r of RULES) { const O = out[r]; res[r] = { pbo: O.below / masks.length, rank: med(O.rank), oosSh: med(O.oosS), isSh: med(O.isS) }; }
    return res;
  }

