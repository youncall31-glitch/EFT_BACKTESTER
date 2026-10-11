/* Backtest engine - Portfolio Visualizer-style monthly backtests.
   Returns are monthly total returns (dividends reinvested). Each asset can also carry its monthly income
   (distribution) return d, so a run can pay distributions out as cash instead: price return p = r - d. */
(function (root) {
  'use strict';
  const BASE_YEAR = 1972;
  let D = null, NM = 0, RET = {}, INC = {}, RF = null, RFCUM = null;
  // nominal and inflation-adjusted copies; RET/RF/RFCUM point at the active set
  let REAL = false, CPI = null;
  const SETS = { n: { RET: {}, INC: {}, RF: null, RFCUM: null }, r: { RET: {}, INC: {}, RF: null, RFCUM: null } };
  const deflate = arr => { const o = new Float64Array(arr.length); for (let i = 0; i < arr.length; i++) o[i] = (1 + arr[i]) / (1 + CPI[i]) - 1; return o; };
  function cumOf(rf) { const c = new Float64Array(NM + 1); c[0] = 1; for (let i = 0; i < NM; i++) c[i + 1] = c[i] * (1 + rf[i]); return c; }
  function activate() { const s = REAL && CPI ? SETS.r : SETS.n; RET = s.RET; INC = s.INC; RF = s.RF; RFCUM = s.RFCUM; }

  function init(data) {
    D = data;
    const [ey, em] = data.end.split('-').map(Number);
    NM = (ey - BASE_YEAR) * 12 + em; // months 1972-01..end inclusive
    CPI = null;
    if (data.cpi) { CPI = new Float64Array(NM).fill(0); for (let i = 0; i < data.cpi.r.length && data.cpi.s + i < NM; i++) CPI[data.cpi.s + i] = data.cpi.r[i] / 1e6; }
    SETS.n.RET = {}; SETS.r.RET = {}; SETS.n.INC = {}; SETS.r.INC = {};
    for (const t of Object.keys(data.assets)) addSeries(t, data.assets[t]);
    const rf = new Float64Array(NM).fill(0);
    for (let i = 0; i < data.rf.r.length; i++) rf[data.rf.s + i] = data.rf.r[i] / 1e6;
    SETS.n.RF = rf; SETS.n.RFCUM = cumOf(rf);
    if (CPI) { SETS.r.RF = deflate(rf); SETS.r.RFCUM = cumOf(SETS.r.RF); }
    activate();
    return NM;
  }
  function addSeries(t, a) {
    const arr = new Float64Array(NM).fill(NaN);
    for (let i = 0; i < a.r.length; i++) if (a.s + i < NM && a.s + i >= 0) arr[a.s + i] = a.r[i] / 1e6;
    SETS.n.RET[t] = arr;
    if (CPI) SETS.r.RET[t] = deflate(arr);
    // income return: nominal d, real d/(1+inflation) (so real price return = real total return - real income)
    delete SETS.n.INC[t]; delete SETS.r.INC[t];
    if (Array.isArray(a.d) && a.d.length === a.r.length) {
      const inc = new Float64Array(NM).fill(NaN);
      for (let i = 0; i < a.d.length; i++) if (a.s + i < NM && a.s + i >= 0) inc[a.s + i] = Math.max(0, a.d[i] / 1e6);
      SETS.n.INC[t] = inc;
      if (CPI) { const ir = new Float64Array(NM); for (let i = 0; i < NM; i++) ir[i] = inc[i] / (1 + CPI[i]); SETS.r.INC[t] = ir; }
    }
  }
  const hasIncome = t => !!SETS.n.INC[t];
  /* ---------- trend-kept data: a recent surge replaced by the asset's own earlier trend ----------
     For each adjusted ticker every month of the recent window loses the same log drift, so the window
     grows at the earlier trend instead; month-to-month swings (and so volatility and drawdown shape)
     stay as they were. 3x funds follow their index: 3 x the index's drift is removed. */
  const LEV = { UPRO: ['SPY', 3], TQQQ: ['QQQ', 3], SOXL: ['SOXX', 3] };
  let ADJ = { n: {}, r: {} };
  const adjSet = () => (REAL && CPI ? ADJ.r : ADJ.n);
  function retOf(t, adj) {
    if (adj) { const a = (adj === true ? adjSet() : adj)[t]; if (a) return a; }
    return RET[t];
  }
  const adjSnapshot = () => Object.assign({}, adjSet());
  function lgrowth(arr, i0, i1) { let s = 0; for (let i = i0; i <= i1; i++) s += Math.log1p(arr[i]); return s * 12 / (i1 - i0 + 1); }
  /* recent R months vs the L months before them, per ticker, in the active unit (nominal or real) */
  function trendScan(tickers, end, R, L, mode) {
    const r0 = end - R + 1, l1 = r0 - 1;
    return tickers.filter(has).map(t => {
      const [s, e] = avail(t, mode || 'ext');
      const o = { t, r0, r1: end, ok: false, lev: LEV[t] ? LEV[t][1] : 0, base: LEV[t] ? LEV[t][0] : null };
      if (e < end || s > r0) { o.reason = '최근 구간 데이터 없음'; return o; }
      const l0 = Math.max(s, l1 - L + 1);
      if (l1 - l0 + 1 < 60) { o.reason = '과거 추세를 볼 데이터가 5년 미만'; return o; }
      o.l0 = l0; o.l1 = l1;
      o.gR = Math.expm1(lgrowth(RET[t], r0, end)); o.gL = Math.expm1(lgrowth(RET[t], l0, l1));
      o.gap = o.gR - o.gL; o.ok = true;
      return o;
    });
  }
  /* specs: [{t, r0, r1, l0, l1, link?: {base, k}}]; returns the adjusted recent CAGR per ticker (active unit) */
  function setTrendAdjust(specs) {
    ADJ = { n: {}, r: {} };
    const by = {}; for (const sp of specs) by[sp.t] = sp;
    for (const u of ['n', 'r']) {
      const set = SETS[u]; if (!set.RF) continue;
      const drift = sp => { const a = set.RET[sp.t]; return a ? Math.max(0, (lgrowth(a, sp.r0, sp.r1) - lgrowth(a, sp.l0, sp.l1)) / 12) : 0; };
      for (const sp of specs) {
        const src = set.RET[sp.t]; if (!src) continue;
        const d = sp.link && by[sp.link.base] ? sp.link.k * drift(by[sp.link.base]) : drift(sp);
        const out = src.slice();
        for (let i = sp.r0; i <= sp.r1; i++) out[i] = Math.expm1(Math.log1p(src[i]) - d);
        ADJ[u][sp.t] = out;
      }
    }
    const res = {}; const cur = adjSet();
    for (const sp of specs) if (cur[sp.t]) res[sp.t] = Math.expm1(lgrowth(cur[sp.t], sp.r0, sp.r1));
    return res;
  }
  const isAdjusted = t => !!adjSet()[t];

  /* switch every calculation between nominal and inflation-adjusted (real) returns */
  function setReal(on) { REAL = !!on && !!CPI; activate(); return REAL; }

  const ym = i => { const y = Math.floor(i / 12); return [BASE_YEAR + y, i - y * 12 + 1]; };
  const label = i => { const [y, m] = ym(i); return `${y}.${String(m).padStart(2, '0')}`; };
  const idxOf = (y, m) => (y - BASE_YEAR) * 12 + (m - 1);
  const has = t => Object.prototype.hasOwnProperty.call(RET, t);

  /* data range for a ticker. mode 'ext' = everything incl. pre-inception proxies,
     'etf' = only months after the ETF's inception month */
  function avail(t, mode) {
    const a = D.assets[t];
    let s = a.s; const e = a.s + a.r.length - 1;
    if (mode === 'etf') for (const sg of a.seg) if (sg[0] === 'P') s = Math.max(s, sg[2] + 1);
    return [s, e];
  }
  function commonRange(tickers, mode) {
    let s = 0, e = NM - 1;
    for (const t of tickers) { const [a, b] = avail(t, mode); s = Math.max(s, a); e = Math.min(e, b); }
    return [s, e];
  }

  /* rebalance after month index m (global) ? */
  function calRebal(m, rule) {
    const mo = m % 12; // 0 = Jan
    switch (rule) {
      case 'M': return true;
      case 'Q': return mo === 2 || mo === 5 || mo === 8 || mo === 11;
      case 'S': return mo === 5 || mo === 11;
      case 'A': return mo === 11;
      default: return false;
    }
  }

  /* core simulation. rets: array of Float64Array (global index), w: weights summing to 1.
     incs (optional, one income array or null per asset): distributions are paid out instead of reinvested.
     Each holding then grows by its price return (r - d) and pays h x d in cash; vals is the invested value
     (without the cash), inc[t] the cash paid in month t, both in units of the starting value. */
  function simulate(rets, w, i0, i1, rule, incs) {
    const n = i1 - i0 + 1, k = w.length;
    const h = w.slice();
    const vals = new Float64Array(n + 1); vals[0] = 1;
    const r = new Float64Array(n);
    const inc = incs ? new Float64Array(n) : null;
    let nReb = 0;
    for (let t = 0; t < n; t++) {
      const m = i0 + t;
      let tot = 0;
      if (incs) {
        let cash = 0;
        for (let j = 0; j < k; j++) {
          let d = incs[j] ? incs[j][m] : 0; if (!(d > 0)) d = 0;
          const x = h[j]; cash += x * d; h[j] = x * (1 + rets[j][m] - d); tot += h[j];
        }
        inc[t] = cash;
      } else for (let j = 0; j < k; j++) { h[j] *= 1 + rets[j][m]; tot += h[j]; }
      vals[t + 1] = tot; r[t] = tot / vals[t] - 1;
      let reb = false;
      if (rule === 'B') {
        for (let j = 0; j < k; j++) {
          const dev = Math.abs(h[j] / tot - w[j]);
          if (dev > Math.min(0.05, 0.25 * w[j]) + 1e-12) { reb = true; break; }
        }
      } else reb = calRebal(m, rule);
      if (reb && t < n - 1) { for (let j = 0; j < k; j++) h[j] = tot * w[j]; nReb++; }
    }
    return { vals, r, n, i0, i1, nReb, inc };
  }

  /* div: true = distributions paid out as cash (not reinvested); default reinvests (total return).
     With a trend-kept series the adjusted total return keeps the same income, so only the price part slows. */
  function backtest(tickers, weights, i0, i1, rule, adj, div) {
    const rets = tickers.map(t => retOf(t, adj));
    const tw = weights.reduce((a, b) => a + b, 0);
    const w = weights.map(x => x / tw);
    const incs = div ? tickers.map(t => INC[t] || null) : null;
    return simulate(rets, w, i0, i1, rule, incs);
  }
  /* income summary of a cash-paying run: totals in units of the starting value */
  function incomeInfo(res) {
    const { inc, vals, n } = res; if (!inc) return null;
    let tot = 0, vsum = 0; for (let t = 0; t < n; t++) { tot += inc[t]; vsum += vals[t]; }
    const L = Math.min(12, n); let ttm = 0; for (let t = n - L; t < n; t++) ttm += inc[t];
    const F = Math.min(12, n); let first = 0; for (let t = 0; t < F; t++) first += inc[t];
    return {
      total: tot, ttm, ttmMonths: L, ttmYield: vals[n] > 0 ? ttm / vals[n] * (12 / L) : null,
      firstYear: first * (12 / F), avgYield: vsum > 0 ? tot / vsum * 12 : 0,
      wealth: vals[n] + tot, wealthCagr: Math.pow(vals[n] + tot, 12 / n) - 1
    };
  }

  function mddInfo(vals, i0) {
    let peak = vals[0], pk = 0, best = 0, bPk = 0, bTr = 0;
    for (let t = 1; t < vals.length; t++) {
      if (vals[t] >= peak) { peak = vals[t]; pk = t; }
      const dd = vals[t] / peak - 1;
      if (dd < best) { best = dd; bPk = pk; bTr = t; }
    }
    let rec = -1;
    if (best < 0) for (let t = bTr + 1; t < vals.length; t++) if (vals[t] >= vals[bPk]) { rec = t; break; }
    // vals index t corresponds to end of month i0+t-1 (t=0 -> start, before first month)
    const n = vals.length - 1;
    return { mdd: best, peak: bPk, trough: bTr, recovery: rec,
      peakLabel: bPk === 0 ? '시작' : label(i0 + bPk - 1), troughLabel: label(i0 + bTr - 1),
      recLabel: rec < 0 ? null : label(i0 + rec - 1),
      months: (rec < 0 ? n : rec) - bPk,          // peak -> recovery (underwater period)
      fallMonths: bTr - bPk,                        // peak -> trough
      recMonths: rec < 0 ? null : rec - bTr,        // trough -> recovery
      sinceTrough: n - bTr };
  }
  /* longest underwater period over all drawdowns: months from a peak until the value first gets back to it.
     If the last drawdown has not recovered by the end, its length so far counts and it is marked ongoing. */
  function uwInfo(vals, i0) {
    const n = vals.length - 1;
    let peak = vals[0], pk = 0, under = false, best = 0, bS = 0, bE = -1, ongoing = false;
    for (let t = 1; t <= n; t++) {
      if (vals[t] >= peak) {
        if (under) { const L = t - pk; if (L > best) { best = L; bS = pk; bE = t; ongoing = false; } under = false; }
        peak = vals[t]; pk = t;
      } else under = true;
    }
    if (under) { const L = n - pk; if (L > best) { best = L; bS = pk; bE = -1; ongoing = true; } }
    return { months: best, ongoing, start: bS, end: bE,
      startLabel: bS === 0 ? '시작' : label(i0 + bS - 1), endLabel: bE < 0 ? null : label(i0 + bE - 1) };
  }
  function maxDD(vals, s, e) { // over vals[s..e]
    let peak = vals[s], m = 0;
    for (let t = s + 1; t <= e; t++) { const v = vals[t]; if (v > peak) peak = v; else { const dd = v / peak - 1; if (dd < m) m = dd; } }
    return m;
  }
  function drawdowns(vals) {
    const out = new Float64Array(vals.length); let peak = vals[0];
    for (let t = 0; t < vals.length; t++) { if (vals[t] > peak) peak = vals[t]; out[t] = vals[t] / peak - 1; }
    return out;
  }
  const mean = a => { let s = 0; for (const x of a) s += x; return s / a.length; };
  function sd(a) { const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); }

  function annual(res) {
    const out = []; // {year, ret, full} (+ inc: cash paid that year, incY: inc / value at the start of the year)
    let cur = null, acc = 1, cnt = 0, ic = 0, v0 = res.vals[0];
    const push = () => { const o = { year: cur, ret: acc - 1, full: cnt === 12 }; if (res.inc) { o.inc = ic; o.incY = v0 > 0 ? ic / v0 : null; } out.push(o); };
    for (let t = 0; t < res.n; t++) {
      const [y] = ym(res.i0 + t);
      if (cur !== null && y !== cur) { push(); acc = 1; cnt = 0; ic = 0; v0 = res.vals[t]; }
      cur = y; acc *= 1 + res.r[t]; cnt++; if (res.inc) ic += res.inc[t];
    }
    if (cur !== null) push();
    return out;
  }

  function stats(res, benchRes) {
    const { vals, r, n, i0, i1 } = res;
    const cagr = Math.pow(vals[n], 12 / n) - 1;
    const ex = new Float64Array(n);
    for (let t = 0; t < n; t++) ex[t] = r[t] - RF[i0 + t];
    const sdm = sd(r);
    const exm = mean(ex), exsd = sd(ex);
    let dsum = 0; for (const x of ex) if (x < 0) dsum += x * x;
    const ddev = Math.sqrt(dsum / n);
    const md = mddInfo(vals, i0);
    const ann = annual(res);
    const full = ann.filter(a => a.full);
    const best = full.length ? full.reduce((a, b) => (b.ret > a.ret ? b : a)) : null;
    const worst = full.length ? full.reduce((a, b) => (b.ret < a.ret ? b : a)) : null;
    const dd = drawdowns(vals);
    let ui = 0; for (const x of dd) ui += x * x; ui = Math.sqrt(ui / dd.length);
    const cash = Math.pow(RFCUM[i1 + 1] / RFCUM[i0], 12 / n) - 1;
    let corr = null;
    if (benchRes) {
      const b = benchRes.r, ma = mean(r), mb = mean(b);
      let sab = 0, saa = 0, sbb = 0;
      for (let t = 0; t < n; t++) { const x = r[t] - ma, y = b[t] - mb; sab += x * y; saa += x * x; sbb += y * y; }
      corr = sab / Math.sqrt(saa * sbb);
    }
    let pos = 0; for (const x of r) if (x > 0) pos++;
    return {
      cagr, final: vals[n], stdev: sdm * Math.sqrt(12),
      sharpe: exsd > 0 ? (exm / exsd) * Math.sqrt(12) : null,
      sortino: ddev > 0 ? (exm * 12) / (ddev * Math.sqrt(12)) : null,
      mdd: md.mdd, mddInfo: md, calmar: md.mdd < 0 ? cagr / -md.mdd : null, uw: uwInfo(vals, i0),
      best, worst, annual: ann, ulcer: ui, cash, corr, posMonths: pos / n,
      martin: ui > 0 ? (cagr - cash) / ui : null, income: incomeInfo(res)
    };
  }

  /* fresh backtest for each trailing window ending at i1 */
  function trailing(tickers, weights, i0, i1, rule, years, adj, div) {
    const n = i1 - i0 + 1;
    return years.map(Y => {
      const len = Y * 12;
      if (len > n) return { years: Y, ok: false };
      const s0 = i1 - len + 1;
      const res = backtest(tickers, weights, s0, i1, rule, adj, div);
      const cagr = Math.pow(res.vals[len], 1 / Y) - 1;
      const md = mddInfo(res.vals, s0);
      return { years: Y, ok: true, cagr, mdd: md.mdd, start: label(s0), end: label(i1), mddInfo: md, uw: uwInfo(res.vals, s0), income: incomeInfo(res) };
    });
  }

  /* rolling windows from one full run (sliced, like PV rolling returns) */
  function rolling(res, years) {
    return years.map(Y => {
      const len = Y * 12; const n = res.n;
      if (len > n) return { years: Y, ok: false };
      const c = [];
      let worstDD = 0, worstDDStart = 0;
      for (let s = 0; s + len <= n; s++) {
        c.push(Math.pow(res.vals[s + len] / res.vals[s], 1 / Y) - 1);
      }
      const sorted = c.slice().sort((a, b) => a - b);
      const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1) + 0.5))];
      let minI = 0, maxI = 0; c.forEach((v, i) => { if (v < c[minI]) minI = i; if (v > c[maxI]) maxI = i; });
      // worst max drawdown experienced inside any window
      for (let s = 0; s + len <= n; s += 1) {
        const m = maxDD(res.vals, s, s + len);
        if (m < worstDD) { worstDD = m; worstDDStart = s; }
      }
      const L = sorted.length, med = L % 2 ? sorted[(L - 1) / 2] : (sorted[L / 2 - 1] + sorted[L / 2]) / 2;
      return { years: Y, ok: true, count: c.length, min: sorted[0], median: med, max: sorted[sorted.length - 1],
        minStart: label(res.i0 + minI), maxStart: label(res.i0 + maxI), pctPositive: c.filter(v => v > 0).length / c.length,
        worstMDD: worstDD, worstMDDStart: label(res.i0 + worstDDStart), series: c };
    });
  }

  /* ================= optimizer: best weights for each horizon (last 10·20·30 years up to the analysis end) ================= */
  const SQ12 = Math.sqrt(12);
  function countCompositions(units, k, maxU) {
    // number of k-tuples of ints in [0,maxU] summing to units
    let dp = new Float64Array(units + 1); dp[0] = 1;
    for (let j = 0; j < k; j++) {
      const nd = new Float64Array(units + 1);
      for (let s = 0; s <= units; s++) if (dp[s]) for (let x = 0; x <= maxU && s + x <= units; x++) nd[s + x] += dp[s];
      dp = nd;
    }
    return dp[units];
  }
  function* compositions(units, k, maxU) {
    const cur = new Array(k).fill(0);
    function* rec(j, left) {
      if (j === k - 1) { if (left <= maxU) { cur[j] = left; yield cur; } return; }
      const lo = Math.max(0, left - maxU * (k - 1 - j)), hi = Math.min(maxU, left);
      for (let x = lo; x <= hi; x++) { cur[j] = x; yield* rec(j + 1, left - x); }
    }
    yield* rec(0, units);
  }
  function mulberry(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let mc = null; const mcQ = [];
  function yieldUI() {
    if (typeof window !== 'undefined' && typeof MessageChannel !== 'undefined') {
      if (!mc) { mc = new MessageChannel(); mc.port1.onmessage = () => { const f = mcQ.shift(); if (f) f(); }; }
      return new Promise(r => { mcQ.push(r); mc.port2.postMessage(0); });
    }
    return new Promise(r => setTimeout(r, 0));
  }

  /* evaluated points live in typed arrays; weights are stored sparse (asset index + units, ascending index) */
  function newStore(M, cap, U) {
    return { M, U, n: 0, cap, cw: new Uint8Array(cap), cagr: new Float32Array(cap), mdd: new Float32Array(cap), score: new Float32Array(cap), sh: new Float32Array(cap),
      uw: new Uint16Array(cap), ong: new Uint8Array(cap), wm: new Uint8Array(cap), wi: new Uint8Array(cap * M), wu: new Uint8Array(cap * M) };
  }
  function growStore(S) {
    const cap = S.cap * 2;
    const g = (a, len) => { const b = new a.constructor(len); b.set(a); return b; };
    S.cagr = g(S.cagr, cap); S.mdd = g(S.mdd, cap); S.score = g(S.score, cap); S.sh = g(S.sh, cap);
    S.uw = g(S.uw, cap); S.ong = g(S.ong, cap); S.wm = g(S.wm, cap); S.cw = g(S.cw, cap); S.wi = g(S.wi, cap * S.M); S.wu = g(S.wu, cap * S.M);
    S.cap = cap;
  }

  /* fast evaluator for one window. Same rules as simulate(); also tracks MDD, longest underwater period and
     Sharpe over the whole window and over each half (AI score = the smallest of the three). */
  function makeEvaluator(tickers, i0, i1, rule, adj, retSet, rfSet) {
    const K = tickers.length, n = i1 - i0 + 1, half = n >> 1;
    const base = retSet || RET, rfs = rfSet || RF;
    const R = new Float64Array(K * n);
    for (let j = 0; j < K; j++) {
      const a = adj ? (adj === true ? adjSet() : adj)[tickers[j]] : null;
      const src = a || base[tickers[j]];
      for (let t = 0; t < n; t++) R[j * n + t] = src[i0 + t];
    }
    const rf = new Float64Array(n); for (let t = 0; t < n; t++) rf[t] = rfs[i0 + t];
    const reb = new Uint8Array(n); for (let t = 0; t < n; t++) reb[t] = calRebal(i0 + t, rule) ? 1 : 0;
    const band = rule === 'B';
    const cash = new Uint8Array(K);
    for (let j = 0; j < K; j++) {
      let s1 = 0, s2 = 0;
      for (let t = 0; t < n; t++) { const x = R[j * n + t] - rf[t]; s1 += x; s2 += x * x; }
      const m = s1 / n, sdA = Math.sqrt(Math.max(0, (s2 - n * m * m) / (n - 1)) * 12);
      cash[j] = sdA < 0.01 ? 1 : 0;
    }
    const h = new Float64Array(64), w = new Float64Array(64), lim = new Float64Array(64), off = new Int32Array(64);
    const o = { cagr: 0, mdd: 0, uw: 0, ong: 0, score: 0, sh: 0 };
    const VFLOOR = 0.01 * 0.01 / 12; // 1% annual volatility floor so near-riskless mixes don't get an arbitrary huge ratio
    const sharpe = (s1, s2, c) => {
      if (c < 2) return 0;
      const m = s1 / c, v = (s2 - c * m * m) / (c - 1);
      return v > 0 ? m / Math.sqrt(v) * SQ12 : 0;
    };
    // ratio used for ranking: Sharpe, but when the excess return is negative use excess × volatility
    // (Israelsen's refinement) so that, among losing mixes, the steadier one ranks higher
    const rankRatio = (s1, s2, c) => {
      if (c < 2) return 0;
      const m = s1 / c, sd = Math.sqrt(Math.max((s2 - c * m * m) / (c - 1), VFLOOR));
      return m >= 0 ? m / sd * SQ12 : m * 12 * sd * SQ12;
    };
    function ev(idx, un, m, U) {
      for (let j = 0; j < m; j++) { const wj = un[j] / U; w[j] = wj; h[j] = wj; off[j] = idx[j] * n; lim[j] = Math.min(0.05, 0.25 * wj) + 1e-12; }
      let prev = 1, peak = 1, pk = 0, under = false, uw = 0, ong = 0, mdd = 0, a1 = 0, a2 = 0, b1 = 0, b2 = 0;
      for (let t = 0; t < n; t++) {
        let tot = 0;
        for (let j = 0; j < m; j++) { const v = h[j] * (1 + R[off[j] + t]); h[j] = v; tot += v; }
        const ex = tot / prev - 1 - rf[t];
        if (t < half) { a1 += ex; a2 += ex * ex; } else { b1 += ex; b2 += ex * ex; }
        if (tot >= peak) { if (under) { const L = t + 1 - pk; if (L > uw) uw = L; under = false; } peak = tot; pk = t + 1; }
        else { under = true; const dd = tot / peak - 1; if (dd < mdd) mdd = dd; }
        prev = tot;
        if (t < n - 1) {
          if (band) { for (let j = 0; j < m; j++) if (Math.abs(h[j] / tot - w[j]) > lim[j]) { for (let q = 0; q < m; q++) h[q] = tot * w[q]; break; } }
          else if (reb[t] === 1) for (let j = 0; j < m; j++) h[j] = tot * w[j];
        }
      }
      if (under) { const L = n - pk; if (L > uw) { uw = L; ong = 1; } }
      o.cagr = Math.pow(prev, 12 / n) - 1; o.mdd = mdd; o.uw = uw; o.ong = ong; o.sh = sharpe(a1 + b1, a2 + b2, n);
      o.score = Math.min(rankRatio(a1 + b1, a2 + b2, n), rankRatio(a1, a2, half), rankRatio(b1, b2, n - half));
      return o;
    }
    return { K, n, ev, cash };
  }

  /* criterion -> scalar fitness (bigger is better). Feasible points score 1e6 + objective;
     infeasible ones score minus their (normalised) constraint violation, so the closest one wins as a fallback.
     c = {kind:'ai'|'range'|'cap', uw: months limit (0 = none), lo/hi: MDD range, cap: MDD limit} */
  function fitness(S, i, c) {
    const dd = -S.mdd[i], uw = S.uw[i], cagr = S.cagr[i];
    const uwEx = c.uw > 0 && uw > c.uw ? (uw - c.uw) / Math.max(c.uw, 12) : 0;
    if (c.kind === 'ai') {
      const cash = S.cashOK ? 0 : S.cw[i] / S.U;
      return uwEx === 0 && cash === 0 ? 1e6 + S.score[i] + cagr * 1e-6 : -(uwEx + cash) + S.score[i] * 1e-6;
    }
    if (c.kind === 'range') {
      const dist = dd < c.lo ? c.lo - dd : dd >= c.hi ? dd - c.hi + 1e-6 : 0;
      if (dist === 0 && uwEx === 0) return 1e6 + cagr - dd * 1e-6;
      return -(dist / Math.max(c.hi, 0.05) + uwEx) + cagr * 1e-6;
    }
    const over = dd > c.cap ? (dd - c.cap) / Math.max(c.cap, 0.02) : 0;
    if (over === 0 && uwEx === 0) return 1e6 + cagr - dd * 1e-6;
    return -(over + uwEx) + cagr * 1e-6;
  }
  function optSelect(H, c) {
    const S = H.store; let bi = -1, bf = -Infinity;
    for (let i = 0; i < S.n; i++) { const f = fitness(S, i, c); if (f > bf) { bf = f; bi = i; } }
    return bi < 0 ? null : { i: bi, feasible: bf > 5e5 };
  }
  function optPoint(H, i) {
    const S = H.store, m = S.wm[i], b = i * S.M, w = [];
    for (let j = 0; j < m; j++) w.push([H.tickers[S.wi[b + j]], S.wu[b + j] / H.U]);
    w.sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1));
    return { i, cagr: S.cagr[i], mdd: S.mdd[i], uw: S.uw[i], ong: S.ong[i] === 1, score: S.score[i], sh: S.sh[i], w };
  }
  function optFront(H) { // indices on the CAGR-vs-MDD efficient frontier, low MDD first
    const S = H.store, N = S.n, ord = new Uint32Array(N);
    for (let i = 0; i < N; i++) ord[i] = i;
    ord.sort((a, b) => (S.mdd[b] - S.mdd[a]) || (S.cagr[b] - S.cagr[a]));
    const out = []; let best = -Infinity;
    for (let k = 0; k < N; k++) { const i = ord[k]; if (S.cagr[i] > best + 1e-7) { out.push(i); best = S.cagr[i]; } }
    return out;
  }

  /* which tickers can join a window: full data over the window; same-index twins (VOO/IVV/SPLG…) are merged
     into the cheapest one, because they hold the same index and only fees differ.
     win = {id, pos: 'recent' (ends at the analysis end) | 'old' (starts at the analysis start), years, i0, i1, reason?} */
  function planWindow(win, tickers, mode, U, maxU) {
    const Y = win.years, i0 = win.i0, i1 = win.i1;
    const P = { id: win.id || 'r' + Y, pos: win.pos || 'recent', years: Y, i0, i1, ok: false, excluded: [], merged: [], tickers: [], U, maxU };
    if (win.reason) { P.reason = win.reason; return P; }
    if (i0 < 0) { P.reason = '1972년 이전 구간이라 데이터가 없어요'; return P; }
    if (i1 > NM - 1 || i1 < i0) { P.reason = '데이터 범위를 벗어난 구간이에요'; return P; }
    const fam = new Map();
    for (const t of tickers) {
      if (!has(t)) continue;
      const [s, e] = avail(t, mode);
      if (s > i0 || e < i1) { P.excluded.push({ t, from: label(s), to: label(e) }); continue; }
      const key = (D.assets[t] && D.assets[t].tw) || t;
      if (!fam.has(key)) fam.set(key, []);
      fam.get(key).push(t);
    }
    for (const list of fam.values()) {
      if (list.length > 1) {
        list.sort((a, b) => (D.assets[a].fee || 0) - (D.assets[b].fee || 0));
        P.merged.push({ keep: list[0], drop: list.slice(1) });
      }
      P.tickers.push(list[0]);
    }
    P.K = P.tickers.length;
    if (P.K === 0) { P.reason = '이 기간 전체를 덮는 데이터가 있는 자산이 없어요'; return P; }
    if (P.K * maxU < U) { P.reason = `이 기간에 쓸 수 있는 자산이 ${P.K}개뿐이라 자산별 최대 비중으로 100%를 채울 수 없어요`; return P; }
    if (P.K > 250) { P.reason = '자산이 너무 많아요'; return P; }
    P.total = countCompositions(U, P.K, maxU); P.ok = true;
    return P;
  }
  function planHorizon(Y, tickers, end, mode, U, maxU) {
    return planWindow({ id: 'r' + Y, pos: 'recent', years: Y, i0: end - Y * 12 + 1, i1: end }, tickers, mode, U, maxU);
  }

  async function runHorizon(P, opts, prog) {
    const { U, maxU, K } = P;
    const LIMIT = opts.limit || 120000, SAMPLES = opts.samples || 40000;
    const E = makeEvaluator(P.tickers, P.i0, P.i1, opts.rule, opts.adj, opts._ret, opts._rf);
    P.adjMap = opts.adj || null; P.real = !!opts._real;
    // search mode: every combination ('full'); every combination on a coarser grid, then refined
    // around the best ones ('coarse'); or a broad sample, then refined ('sample')
    let mode = P.total <= LIMIT ? 'full' : 'sample', f = 1, Uc = U, maxUc = maxU, coarseTotal = 0;
    if (mode === 'sample') {
      for (let ff = 2; U % ff === 0 && U / ff >= 10; ff *= 2) {
        const uc = U / ff, mc = Math.floor(maxU / ff);
        if (mc < 1 || K * mc < uc) break;
        const tot = countCompositions(uc, K, mc);
        if (tot <= LIMIT) { mode = 'coarse'; f = ff; Uc = uc; maxUc = mc; coarseTotal = tot; break; }
      }
    }
    const M = mode === 'sample' ? Math.min(K, U, Math.max(opts.mMax || 8, Math.ceil(U / maxU))) : Math.min(K, U);
    const S = newStore(M, mode === 'full' ? Math.max(16, P.total) : mode === 'coarse' ? coarseTotal + 8192 : 65536, U);
    P.cash = P.tickers.filter((t, j) => E.cash[j]);
    S.cashOK = (K - P.cash.length) * maxU < U; // nothing but cash could fill it -> allow cash in the AI pick
    const seen = mode === 'full' ? null : new Map();
    const idx = new Uint8Array(64), un = new Uint8Array(64);
    let lastY = nowMs(), progFn = prog;
    const maybeYield = async frac => { if (nowMs() - lastY > 28) { progFn(frac); await yieldUI(); lastY = nowMs(); } };
    function addPoint(m) {
      const o = E.ev(idx, un, m, U);
      if (S.n >= S.cap) growStore(S);
      const i = S.n++;
      S.cagr[i] = o.cagr; S.mdd[i] = o.mdd; S.score[i] = o.score; S.sh[i] = o.sh; S.uw[i] = Math.min(65535, o.uw); S.ong[i] = o.ong; S.wm[i] = m;
      const b = i * M; let cw = 0;
      for (let j = 0; j < m; j++) { S.wi[b + j] = idx[j]; S.wu[b + j] = un[j]; if (E.cash[idx[j]]) cw += un[j]; }
      S.cw[i] = cw;
      return i;
    }
    function addUnique(m) {
      let k = ''; for (let j = 0; j < m; j++) k += idx[j] + ':' + un[j] + ',';
      const g = seen.get(k); if (g !== undefined) return g;
      const i = addPoint(m); seen.set(k, i); return i;
    }
    if (mode === 'full') {
      const it = compositions(U, K, maxU); let done = 0;
      for (;;) {
        const nx = it.next(); if (nx.done) break;
        const c = nx.value; let m = 0;
        for (let j = 0; j < K; j++) if (c[j] > 0) { idx[m] = j; un[m] = c[j]; m++; }
        addPoint(m); done++;
        if ((done & 511) === 0) await maybeYield(done / P.total);
      }
    } else if (mode === 'coarse') {
      const it = compositions(Uc, K, maxUc); let done = 0;
      for (;;) {
        const nx = it.next(); if (nx.done) break;
        const c = nx.value; let m = 0;
        for (let j = 0; j < K; j++) if (c[j] > 0) { idx[m] = j; un[m] = c[j] * f; m++; }
        addUnique(m); done++;
        if ((done & 511) === 0) await maybeYield(0.6 * done / coarseTotal);
      }
    } else {
      const rand = mulberry(0x9e3779b9 ^ (P.years * 7919) ^ (K * 104729) ^ (P.pos === 'old' ? (P.i0 + 1) * 40503 : 0));
      // 1) every single asset, 2) every pair on a 10% grid, 3) random sparse mixes
      if (maxU === U) for (let a = 0; a < K; a++) { idx[0] = a; un[0] = U; addUnique(1); }
      const g = Math.max(1, Math.round(U / 10));
      for (let a = 0; a < K; a++) {
        for (let b = a + 1; b < K; b++) for (let x = g; x < U; x += g) {
          const y = U - x; if (x > maxU || y > maxU) continue;
          idx[0] = a; un[0] = x; idx[1] = b; un[1] = y; addUnique(2);
        }
        await maybeYield(0.1 * a / K);
      }
      const mMin = Math.max(2, Math.ceil(U / maxU)), mHi = Math.min(M, K, U);
      const mW = []; let mWs = 0;
      for (let m = mMin; m <= mHi; m++) { const wgt = m <= 2 ? 0.6 : m === 3 ? 1 : m === 4 ? 0.9 : m === 5 ? 0.6 : 0.35; mW.push([m, wgt]); mWs += wgt; }
      const perm = new Uint8Array(K); for (let j = 0; j < K; j++) perm[j] = j;
      const cuts = new Int32Array(64), pick = new Uint8Array(64);
      const target = Math.max(S.n + 4000, SAMPLES);
      let tries = 0;
      while (S.n < target && tries < target * 4) {
        tries++;
        let r = rand() * mWs, m = mW[mW.length - 1][0];
        for (const [mm, wgt] of mW) { if (r < wgt) { m = mm; break; } r -= wgt; }
        for (let j = 0; j < m; j++) { const q = j + Math.floor(rand() * (K - j)); const tmp = perm[j]; perm[j] = perm[q]; perm[q] = tmp; pick[j] = perm[j]; }
        // m-1 distinct cut points in 1..U-1 -> a uniformly random composition with positive parts
        let c = 0;
        while (c < m - 1) { const x = 1 + Math.floor(rand() * (U - 1)); let dup = false; for (let q = 0; q < c; q++) if (cuts[q] === x) { dup = true; break; } if (!dup) cuts[c++] = x; }
        const cs = Array.from(cuts.subarray(0, m - 1)).sort((a, b) => a - b);
        let prevC = 0, ok = true; const parts = [];
        for (let q = 0; q <= m - 1; q++) { const nxt = q < m - 1 ? cs[q] : U; const p = nxt - prevC; if (p > maxU) { ok = false; break; } parts.push(p); prevC = nxt; }
        if (!ok) continue;
        const order = Array.from(pick.subarray(0, m)).map((a, q) => [a, parts[q]]).sort((x, y) => x[0] - y[0]);
        for (let q = 0; q < m; q++) { idx[q] = order[q][0]; un[q] = order[q][1]; }
        addUnique(m);
        if ((tries & 255) === 0) await maybeYield(0.1 + 0.5 * (S.n / target));
      }
    }
    // local search from the best few starts of each criterion: move s units from one asset to another
    const scales = [];
    for (let s = mode === 'coarse' ? f : Math.max(1, Math.round(U / 5)); s >= 1; s = Math.floor(s / 2)) { scales.push(s); if (s === 1) break; }
    const NSTART = opts.nstart || (mode === 'coarse' ? 10 : 5);
    const CSC = U >= 20 ? [1, 2] : [1];   // compound move sizes
    const ci = new Uint8Array(64), cu = new Uint8Array(64), dense = new Int16Array(K);
    // write `dense` into idx/un (ascending asset index); false if it breaks a limit
    function packDense() {
      let m = 0;
      for (let j = 0; j < K; j++) { const u = dense[j]; if (u < 0 || u > maxU) return -1; if (u > 0) { if (m >= M) return -1; idx[m] = j; un[m] = u; m++; } }
      return m;
    }
    // single moves: s units from one held asset to any other asset (best improvement, repeated)
    async function singleMoves(cur, curF, c, s, fr) {
      for (let round = 0; round < 60; round++) {
        let bestI = -1, bestF = curF;
        const m0 = S.wm[cur], base = cur * M;
        for (let j = 0; j < m0; j++) { ci[j] = S.wi[base + j]; cu[j] = S.wu[base + j]; }
        for (let ja = 0; ja < m0; ja++) {
          if (cu[ja] < s) continue;
          const a = ci[ja];
          for (let bb = 0; bb < K; bb++) {
            if (bb === a) continue;
            let m = 0, placed = false, ok = true;
            for (let j = 0; j < m0; j++) {
              const x = ci[j];
              if (!placed && bb < x) { idx[m] = bb; un[m] = s; m++; placed = true; }
              let u = cu[j];
              if (x === a) u -= s;
              if (x === bb) { u += s; placed = true; }
              if (u > 0) { idx[m] = x; un[m] = u; m++; }
            }
            if (!placed) { idx[m] = bb; un[m] = s; m++; }
            if (m > M) continue;
            for (let j = 0; j < m; j++) if (un[j] > maxU) { ok = false; break; }
            if (!ok) continue;
            const i = addUnique(m);
            const fi = fitness(S, i, c);
            if (fi > bestF + 1e-12) { bestF = fi; bestI = i; }
          }
        }
        if (bestI < 0) break;
        cur = bestI; curF = bestF;
        await maybeYield(fr);
      }
      return [cur, curF];
    }
    // compound moves: two s-unit moves at once (lets the search slide along an MDD / recovery limit)
    function compoundMove(cur, curF, c, s, cand) {
      const m0 = S.wm[cur], base = cur * M;
      const sup = [], su = [];
      for (let j = 0; j < m0; j++) { sup.push(S.wi[base + j]); su.push(S.wu[base + j]); }
      let bestI = -1, bestF = curF;
      for (let p = 0; p < m0; p++) for (let q = p; q < m0; q++) {
        if (p === q ? su[p] < 2 * s : (su[p] < s || su[q] < s)) continue;
        const a = sup[p], a2 = sup[q];
        for (let x = 0; x < cand.length; x++) for (let y = x; y < cand.length; y++) {
          const b = cand[x], b2 = cand[y];
          if (b === a || b === a2 || b2 === a || b2 === a2) continue;
          dense.fill(0);
          for (let j = 0; j < m0; j++) dense[sup[j]] = su[j];
          dense[a] -= s; dense[a2] -= s; dense[b] += s; dense[b2] += s;
          const m = packDense(); if (m < 0) continue;
          const i = addUnique(m);
          const fi = fitness(S, i, c);
          if (fi > bestF + 1e-12) { bestF = fi; bestI = i; }
        }
      }
      return [bestI, bestF];
    }
    async function localSearch(crits, f0, f1) {
      for (let q = 0; q < crits.length; q++) {
        const c = crits[q], fr = f0 + (f1 - f0) * (q / crits.length);
        const fv = new Float64Array(S.n); for (let i = 0; i < S.n; i++) fv[i] = fitness(S, i, c);
        const ord = new Uint32Array(S.n); for (let i = 0; i < S.n; i++) ord[i] = i;
        ord.sort((a, b) => fv[b] - fv[a]);
        const starts = [], sigs = new Set(), candSet = new Set();
        for (let k = 0; k < ord.length && (starts.length < NSTART || k < 40); k++) {
          const i = ord[k], b = i * M; let sg = '';
          for (let j = 0; j < S.wm[i]; j++) { sg += S.wi[b + j] + ','; if (k < 40) candSet.add(S.wi[b + j]); }
          if (starts.length < NSTART && !sigs.has(sg)) { sigs.add(sg); starts.push(i); }
        }
        // compound moves pick receiving assets among those held by the best mixes (all assets when few)
        const cand = K <= 12 ? Array.from({ length: K }, (_, j) => j) : Array.from(candSet).slice(0, 14);
        for (const st of starts) {
          let cur = st, curF = fitness(S, cur, c);
          for (let outer = 0; outer < 10; outer++) {
            for (const s of scales) [cur, curF] = await singleMoves(cur, curF, c, s, fr);
            const cc = K <= 12 ? cand : Array.from(new Set(cand.concat(Array.from(S.wi.subarray(cur * M, cur * M + S.wm[cur])))));
            let moved = false;
            for (const s2 of CSC) {
              const [ni, nf] = compoundMove(cur, curF, c, s2, cc);
              if (ni >= 0) { cur = ni; curF = nf; moved = true; break; }
            }
            if (!moved) break;
            await maybeYield(fr);
          }
        }
      }
    }
    function finish() {
      P.evaluated = S.n;
      P.front = optFront(P);
      const NS = 6000; const sample = [];
      if (S.n <= NS) for (let i = 0; i < S.n; i++) sample.push(i);
      else { const st = S.n / NS; for (let k = 0; k < NS; k++) sample.push(Math.floor(k * st)); }
      P.sample = sample;
    }
    if (mode !== 'full') await localSearch(opts.crits || [], 0.6, 1);
    progFn(1);
    P.mode = mode; P.exhaustive = mode === 'full'; P.coarseU = Uc; P.store = S; P.M = M;
    finish();
    // re-search around the best mixes for criteria edited after the run (no-op when every mix was evaluated)
    P.refine = mode === 'full' ? null : async (crits, pg) => { progFn = pg || (() => {}); lastY = nowMs(); await localSearch(crits, 0, 1); finish(); progFn(1); };
    return P;
  }

  /* opts: {tickers, windows:[{id,pos,years,i0,i1}] | (end, horizons:[10,20,30]), rule, mode:'ext'|'etf', step, maxW,
     crits:[...], limit, samples, mMax}. onProgress(frac, years, pos) */
  async function optimizeHorizons(opts, onProgress) {
    const t0 = nowMs();
    opts = Object.assign({}, opts, { _ret: RET, _rf: RF, _real: REAL && !!CPI });
    if (opts.adj === true) opts.adj = adjSnapshot();
    const U = Math.round(1 / opts.step), maxU = Math.max(1, Math.min(U, Math.floor(opts.maxW * U + 1e-9)));
    const wins = opts.windows || opts.horizons.map(Y => ({ id: 'r' + Y, pos: 'recent', years: Y, i0: opts.end - Y * 12 + 1, i1: opts.end }));
    const plans = wins.map(w => planWindow(w, opts.tickers, opts.mode, U, maxU));
    const live = plans.filter(p => p.ok);
    for (let q = 0; q < live.length; q++) {
      const P = live[q];
      await runHorizon(P, opts, f => onProgress && onProgress((q + f) / live.length, P.years, P.pos));
    }
    onProgress && onProgress(1);
    return { U, maxU, plans, ms: nowMs() - t0, adj: opts.adj || null };
  }

  function addAsset(t, a) {
    D.assets[t] = a;
    addSeries(t, a);
    activate();
  }

  root.BT = { init, addAsset, label, ym, idxOf, avail, commonRange, backtest, stats, trailing, rolling, drawdowns, annual, hasIncome,
    uwInfo, setReal, trendScan, setTrendAdjust, isAdjusted, adjSnapshot, LEV, hasCPI: () => !!CPI, isReal: () => REAL, cpiAt: i => (CPI ? CPI[i] : 0), optimizeHorizons, optSelect, optPoint, optFront, optPlan: planHorizon, optPlanWin: planWindow, countCompositions, has, get NM() { return NM; }, get D() { return D; }, rfCum: () => RFCUM };
})(typeof window !== 'undefined' ? window : globalThis);
if (typeof module !== 'undefined') module.exports = globalThis.BT;
