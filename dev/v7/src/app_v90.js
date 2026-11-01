  /* ======================= v9.0: spread over 2·5·10·20·30-year holds, correlation, AI checked on the period it did not see ======================= */
  const SP_YS = [2, 5, 10, 20, 30];
  state.spM = 'c'; state.crP = 'all'; state.crRef = null;
  $('#sp-m').addEventListener('click', e => { const b = e.target.closest('button[data-m]'); if (!b) return; state.spM = b.dataset.m; $('#sp-m').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); drawSpread(); });
  /* longest time under water inside every window (months), for the recovery view */
  function addUw(w, v, Y) {
    const Ln = Y * 12, u = new Float64Array(w.k);
    for (let a = 0; a < w.k; a++) { let pk = v[a], cur = 0, mx = 0; for (let q = a + 1; q <= a + Ln; q++) { if (v[q] >= pk) { pk = v[q]; cur = 0; } else { cur++; if (cur > mx) mx = cur; } } u[a] = mx; }
    const su = Float64Array.from(u).sort(), q = p => su[Math.min(su.length - 1, Math.max(0, Math.round(p * (su.length - 1))))];
    Object.assign(w, { uw: u, u10: q(0.1), u50: q(0.5), u90: q(0.9), umin: su[0], umax: su[su.length - 1] });
  }
  function renderSpread() {
    const tb = $('#t-spread'); if (!tb) return; tb.innerHTML = ''; state.spread = null;
    const L = state.last; if (!L) { drawSpread(); return; }
    const rows = L.series.map(x => {
      const res = BT.backtest(x.tickers, x.weights, L.s, L.e, x.bench ? 'N' : state.rebal, L.adj);
      const W = {}; for (const Y of SP_YS) { const w = winStats(res, L.s, Y); if (w) { W[Y] = w; addUw(w, res.vals, Y); } }
      return { x, n: res.n, W };
    });
    state.spread = { rows, n: L.e - L.s + 1 };
    // number table
    const th = el('thead'), hr = el('tr');
    ['', '보유', 'CAGR 80% 범위', '가운데', '최저 ~ 최고', '가장 최근', '손실로 끝남', '구간 MDD 80% 범위', '구간 안 최장 회복 80% 범위'].forEach(s => hr.appendChild(el('th', null, s))); th.appendChild(hr); tb.appendChild(th);
    const bd = el('tbody');
    for (const r of rows) for (const Y of SP_YS) {
      const w = r.W[Y]; if (!w) continue;
      const tr = el('tr'); const h = el('th'); const k = el('span', 'key'); k.style.background = r.x.color; h.append(k, document.createTextNode(' ' + sumName(r.x))); tr.appendChild(h);
      tr.append(el('td', null, `${Y}년`), el('td', null, `${pct(w.c10, 1)} ~ ${pct(w.c90, 1)}`), el('td', null, pct(w.c50, 1)), el('td', null, `${pct(w.cmin, 1)} ~ ${pct(w.cmax, 1)}`), el('td', null, pct(w.cg[w.k - 1], 1)), el('td', w.loss > 0 ? 'neg' : null, pct(w.loss, 0)), el('td', null, `${mpct1(w.m10)} ~ ${mpct1(w.m90)}`), el('td', null, `${w.u10 ? dur(w.u10) : '없음'} ~ ${w.u90 ? dur(w.u90) : '없음'}`));
      bd.appendChild(tr);
    }
    tb.appendChild(bd);
    $('#sp-when').textContent = `${BT.label(L.s)}~${BT.label(L.e)} 안에서 매달 시작한 모든 구간 · 분배금 재투자 기준`;
    drawSpread();
  }
  function drawSpread() {
    const host = $('#c-spread'); if (!host) return; host.innerHTML = ''; $('#lg-spread').innerHTML = '';
    const S = state.spread; if (!S || !isShown(host)) return;
    const M = state.spM, rows = S.rows;
    const G = M === 'm' ? { a: w => w.mmin, b: w => w.mmax, p10: w => w.m10, p90: w => w.m90, md: w => w.m50, last: w => w.md[w.k - 1], f: v => mpct1(v), ax: v => Math.round(v * 100) + '%', t: '구간 MDD' }
      : M === 'u' ? { a: w => w.umin, b: w => w.umax, p10: w => w.u10, p90: w => w.u90, md: w => w.u50, last: w => w.uw[w.k - 1], f: v => (v ? dur(Math.round(v)) : '없음'), ax: v => (v >= 12 ? (v / 12).toFixed(v % 12 ? 1 : 0) + '년' : Math.round(v) + '개월'), t: '구간 안 최장 회복' }
      : { a: w => w.cmin, b: w => w.cmax, p10: w => w.c10, p90: w => w.c90, md: w => w.c50, last: w => w.cg[w.k - 1], f: v => pct(v, 1), ax: v => Math.round(v * 100) + '%', t: 'CAGR' };
    legend($('#lg-spread'), rows.map(r => ({ name: sumName(r.x), color: r.x.color, bench: r.x.bench })).concat([{ name: '◆ 가장 최근 구간', color: 'transparent' }]), true);
    const ys = SP_YS.filter(Y => rows.some(r => r.W[Y]));
    const W = Math.max(280, host.clientWidth || 600), narrow = W < 520, lab = narrow ? 64 : 120, rowH = narrow ? 13 : 14, gapG = 16, top = 8;
    const H = top + ys.reduce((a, Y) => a + rows.filter(r => r.W[Y]).length * rowH + gapG, 0) + 22, iw = W - lab - 14;
    let lo = 0, hi = 0; for (const r of rows) for (const Y of ys) { const w = r.W[Y]; if (!w) continue; lo = Math.min(lo, G.a(w)); hi = Math.max(hi, G.b(w)); }
    if (M === 'u') lo = 0;
    const pad = (hi - lo) * 0.04 || 1; lo -= M === 'u' ? 0 : pad; hi += pad;
    const X = v => lab + (v - lo) / (hi - lo) * iw;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `보유 기간별 ${G.t} 범위` }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const ticks = M === 'u' ? (() => { const st = hi > 120 ? 36 : hi > 48 ? 12 : 6, a = []; for (let v = 0; v <= hi; v += st) a.push(v); return a; })() : linTicks(lo, hi, narrow ? 4 : 7);
    for (const v of ticks) { const x = X(v); svg('line', { x1: x, x2: x, y1: top, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = G.ax(v); }
    if (M !== 'u' && lo < 0 && hi > 0) { const z = svg('line', { x1: X(0), x2: X(0), y1: top, y2: H - 20, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, root); z.style.stroke = 'var(--ink-2)'; }
    let y = top;
    for (const Y of ys) {
      const rs = rows.filter(r => r.W[Y]), gh = rs.length * rowH;
      const bg = svg('rect', { x: 0, y: y - 3, width: W, height: gh + 6, rx: 6 }, root); bg.style.fill = ys.indexOf(Y) % 2 ? 'transparent' : 'var(--panel-2)'; root.insertBefore(bg, g);
      const t1 = svg('text', { x: 4, y: y + gh / 2 + (narrow ? 0 : 4) }, ax); t1.textContent = `${Y}년`; t1.style.fill = 'var(--ink)'; t1.style.fontWeight = '700'; t1.style.fontFamily = 'var(--font-sans)'; t1.style.fontSize = '13px';
      const ind = S.n / (Y * 12), t2 = svg('text', { x: narrow ? 4 : 40, y: y + gh / 2 + (narrow ? 13 : 4) }, ax); t2.textContent = ind < 2 ? `독립 ${ind.toFixed(1)}개` : `독립 ${Math.floor(ind)}개`; if (ind < 3) t2.style.fill = 'var(--warn)';
      rs.forEach((r, i) => {
        const w = r.W[Y], cy = y + i * rowH + rowH / 2, c = r.x.color;
        const a = G.a(w), b = G.b(w), p10 = G.p10(w), p90 = G.p90(w), md = G.md(w), last = G.last(w);
        const ln = svg('line', { x1: X(a), x2: X(b), y1: cy, y2: cy, 'stroke-width': 1.5 }, root); ln.style.stroke = c; ln.style.opacity = r.x.bench ? '0.45' : '0.8';
        const bar = svg('rect', { x: X(p10), y: cy - rowH * 0.32, width: Math.max(2, X(p90) - X(p10)), height: rowH * 0.64, rx: 2 }, root); bar.style.fill = c; bar.style.opacity = r.x.bench ? '0.35' : '0.75';
        const mk = svg('line', { x1: X(md), x2: X(md), y1: cy - rowH * 0.45, y2: cy + rowH * 0.45, 'stroke-width': 2 }, root); mk.style.stroke = 'var(--ink)';
        const s2 = 4, d = svg('path', { d: `M${X(last)},${cy - s2}L${X(last) + s2},${cy}L${X(last)},${cy + s2}L${X(last) - s2},${cy}Z`, 'stroke-width': 1.2 }, root); d.style.fill = 'var(--panel)'; d.style.stroke = 'var(--ink)';
        svg('title', null, bar).textContent = `${sumName(r.x)} · ${Y}년 보유 ${w.k}개 구간\n${G.t} 하위 10% ${G.f(p10)} · 가운데 ${G.f(md)} · 상위 10% ${G.f(p90)}\n가장 최근 구간 ${G.f(last)}`;
      });
      y += gh + gapG;
    }
  }


  /* ---------- correlation ---------- */
  const CR_P = { all: '분석 기간 전체', e1: '2000~2020', e2: '2021~' };
  $('#cr-p').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.crP = b.dataset.p; renderCorr(); });
  $('#cr-ref').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; state.crRef = b.dataset.t; renderCorr(); });
  const corrOf = (a, b) => { const n = a.length; let ma = 0, mb = 0; for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { const x = a[i] - ma, y = b[i] - mb; c += x * y; va += x * x; vb += y * y; } return va && vb ? c / Math.sqrt(va * vb) : 0; };
  function renderCorr() {
    const host = $('#c-corr'); if (!host) return; host.innerHTML = ''; $('#cr-port').innerHTML = ''; $('#cr-ref').innerHTML = ''; $('#c-corr-dn').innerHTML = ''; $('#cr-msg').hidden = true;
    $('#cr-p').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x.dataset.p === state.crP ? 'true' : 'false'));
    const L = state.last, vp = validPorts(); if (!L || !vp.length) return;
    const tk = []; for (const p of vp) for (const t of p.info.tickers) if (!tk.includes(t)) tk.push(t);
    const refs = ['QQQ', 'SPY'].filter(t => !tk.includes(t)); const all = tk.concat(refs);
    const yIdx = y => { for (let k = L.s; k <= L.e; k++) { const [yy, mm] = BT.ym(k); if (yy === y && mm === 1) return k; } return null; };
    let a = L.s, b = L.e;
    if (state.crP === 'e1') { a = Math.max(L.s, yIdx(2000) ?? Infinity); b = Math.min(L.e, (yIdx(2021) ?? L.e + 1) - 1); }
    if (state.crP === 'e2') { a = Math.max(L.s, yIdx(2021) ?? Infinity); }
    if (!(b - a >= 23)) { $('#cr-msg').hidden = false; $('#cr-msg').textContent = `분석 기간(${BT.label(L.s)}~${BT.label(L.e)})에 ${CR_P[state.crP]} 데이터가 2년이 안 돼요. 다른 기간을 골라 주세요.`; return; }
    const ok = all.filter(t => { const [s, e] = BT.avail(t, state.ext ? 'ext' : 'etf'); return s <= a && e >= b; });
    const R = {}; for (const t of ok) R[t] = BT.backtest([t], [1], a, b, 'N', L.adj).r;
    const C = {}; for (const x of ok) { C[x] = {}; for (const y of ok) C[x][y] = x === y ? 1 : corrOf(R[x], R[y]); }
    $('#cr-when').textContent = `${BT.label(a)}~${BT.label(b)} · 월간 수익률 · ${state.ext ? '상장 전은 대용 데이터 포함' : '실제 ETF 데이터'}`;
    // per portfolio: weighted average correlation between its holdings
    for (const p of vp) {
      const t = p.info.tickers, tw = p.info.weights.reduce((x, y) => x + y, 0), w = p.info.weights.map(x => x / tw); let s = 0, d = 0;
      for (let i = 0; i < t.length; i++) for (let j = 0; j < t.length; j++) if (i !== j && C[t[i]] && C[t[i]][t[j]] != null) { s += w[i] * w[j] * C[t[i]][t[j]]; d += w[i] * w[j]; }
      const v = d ? s / d : null, r = el('div', 'cr-pt'); const k = el('span', 'key'); k.style.background = PCOL[p.i];
      r.append(k, el('b', null, p.name), el('span', 'cr-v ' + (v == null ? '' : v < 0.2 ? 'good' : v < 0.5 ? 'mid' : 'bad'), v == null ? '종목 1개' : `종목 간 평균 상관 ${v.toFixed(2)} · ${v < 0.2 ? '분산 잘 됨' : v < 0.5 ? '어느 정도 분산' : '같이 움직임'}`));
      $('#cr-port').appendChild(r);
    }
    // matrix
    const t = el('table', 'cgrid'), th = el('thead'), hr = el('tr'); hr.appendChild(el('th'));
    for (const y of ok) hr.appendChild(el('th', refs.includes(y) ? 'ref' : null, y)); th.appendChild(hr); t.appendChild(th);
    const bd = el('tbody');
    for (const x of ok) {
      const tr = el('tr'); tr.appendChild(el('th', refs.includes(x) ? 'ref' : null, x));
      for (const y of ok) {
        const v = C[x][y], td = el('td', x === y ? 'diag' : null, x === y ? '' : v.toFixed(2).replace('-0.00', '0.00'));
        if (x !== y) { td.style.setProperty('--p', String(Math.max(0, v))); td.style.setProperty('--n', String(Math.max(0, -v))); td.title = `${x} ↔ ${y} 상관계수 ${v.toFixed(2)}`; }
        tr.appendChild(td);
      }
      bd.appendChild(tr);
    }
    t.appendChild(bd); host.appendChild(t);
    if (ok.length < all.length) host.appendChild(el('p', 'small muted', `이 기간 데이터가 없어 뺀 종목: ${all.filter(x => !ok.includes(x)).join(', ')}`));
    // when the reference fell hard
    if (!state.crRef || !ok.includes(state.crRef)) state.crRef = ok.includes('QQQ') ? 'QQQ' : ok[0];
    for (const x of ok) { const c = el('button', 'chip'); c.type = 'button'; c.dataset.t = x; c.textContent = x; c.setAttribute('aria-pressed', x === state.crRef ? 'true' : 'false'); $('#cr-ref').appendChild(c); }
    const ref = state.crRef, rr = R[ref], months = []; for (let i = 0; i < rr.length; i++) if (rr[i] < -0.05) months.push(i);
    state.corrDn = { ref, n: months.length, rows: ok.filter(x => x !== ref).map(x => ({ t: x, c: C[ref][x], avg: months.length ? months.reduce((s, i) => s + R[x][i], 0) / months.length : null, ref: refs.includes(x) })) };
    $('#cr-dn-say').textContent = months.length ? `${ref}가 한 달에 5% 넘게 떨어진 ${months.length}개월 동안 각 종목의 평균 월 수익률 (그 달 ${ref} 평균 ${pct(months.reduce((s, i) => s + rr[i], 0) / months.length, 1)})` : `이 기간에 ${ref}가 한 달에 5% 넘게 떨어진 적이 없어요.`;
    drawCorr();
  }
  function drawCorr() {
    const host = $('#c-corr-dn'); if (!host) return; host.innerHTML = '';
    const D = state.corrDn; if (!D || !D.n || !isShown(host)) return;
    const rows = D.rows.filter(r => r.avg != null).sort((x, y) => y.avg - x.avg);
    const W = Math.max(280, host.clientWidth || 600), lab = 60, val = W < 520 ? 104 : 150, rowH = 24, H = 8 + rows.length * rowH + 20, iw = W - lab - val - 8;
    let lo = Math.min(0, ...rows.map(r => r.avg)), hi = Math.max(0, ...rows.map(r => r.avg)); const pad = (hi - lo) * 0.06 || 0.01; lo -= pad; hi += pad;
    const X = v => lab + (v - lo) / (hi - lo) * iw;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `${D.ref} 급락 달의 종목별 평균 수익률` }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of linTicks(lo, hi, 4)) { const x = X(v); svg('line', { x1: x, x2: x, y1: 4, y2: H - 18 }, g); svg('text', { x, y: H - 4, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    const z = svg('line', { x1: X(0), x2: X(0), y1: 4, y2: H - 18, 'stroke-width': 1.5 }, root); z.style.stroke = 'var(--ink-2)';
    rows.forEach((r, i) => {
      const y = 8 + i * rowH + rowH / 2;
      const l = svg('text', { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = r.t; l.style.fill = 'var(--ink)'; l.style.fontWeight = '600';
      const x0 = X(Math.min(0, r.avg)), x1 = X(Math.max(0, r.avg)), b = svg('rect', { x: x0, y: y - 7, width: Math.max(2, x1 - x0), height: 14, rx: 3 }, root); b.style.fill = r.avg >= 0 ? 'var(--pos)' : 'var(--neg)'; b.style.opacity = r.ref ? '0.45' : '0.85';
      const t = svg('text', { x: lab + iw + 8, y: y + 4 }, ax); t.textContent = `${r.avg >= 0 ? '+' : ''}${(r.avg * 100).toFixed(1)}% · 상관 ${r.c.toFixed(2)}`; t.style.fill = 'var(--ink)';
    });
  }

  /* ---------- AI method on the period it did not see (walk-forward) ---------- */
  let aiwfBusy = false, aiwfKey = null; state.aiwf = null;
  async function runAIWF() {
    const o = state.opt, A = state.sumAI; if (!o || !A || !A.rec || !o.trust || aiwfBusy || optBusy || o.key !== optKey()) return;
    const key = o.key + '|' + A.cap + '|' + A.uw; if (aiwfKey === key) return;
    aiwfKey = key; aiwfBusy = true; state.aiwf = { busy: true, out: [] }; renderAIWF();
    const st = t => { const e = $('#ai-wf-st'); if (e) e.textContent = t; };
    const hi = A.cap >= 1 ? 10 : A.cap, crits = currentCrits(), out = [];
    try {
      for (const Y of [10, 20]) {
        const trainEnd = o.end - Y * 12; if (trainEnd - o.s + 1 < 120) continue;
        const P = await BT.keepPlan({ tickers: o.tickers, rule: o.rule, mode: o.mode, step: o.step, maxW: o.maxW, crits, i0: o.s, i1: trainEnd }, f => st(`${BT.label(o.s)}~${BT.label(trainEnd)}만으로 모든 비중 조합을 계산하는 중… ${Math.round(f * 100)}%`));
        const row = { Y, t0: o.s, t1: trainEnd, s0: trainEnd + 1, s1: o.end, rows: [], ok: !!P.ok, reason: P.reason };
        if (P.ok) {
          const T = await BT.trustScan(P, f => st(`그 기간을 시기별로 나눠 다시 계산하는 중… ${Math.round(f * 100)}%`));
          const mk = (name, i, kind) => { const p = BT.optPoint(P, i), tk = p.w.map(x => x[0]), w = p.w.map(x => x[1]); return { name, kind, w: p.w, a: BT.stats(BT.backtest(tk, w, o.s, trainEnd, o.rule, false)), b: BT.stats(BT.backtest(tk, w, trainEnd + 1, o.end, o.rule, false)) }; };
          const r = T.ok ? BT.trustPick(P, T, { lo: 0, hi, uw: A.uw }) : null;
          if (r) row.rows.push(mk('AI 방식으로 고른 비중', r.i, 'ai'));
          const sb = BT.optSelect(P, { kind: 'cap', cap: hi, uw: A.uw });
          if (sb && sb.feasible && (!r || sb.i !== r.i)) row.rows.push(mk('CAGR 최고로 고른 비중', sb.i, 'best'));
          for (const vp of validPorts()) {
            const [cs, ce] = BT.commonRange(vp.info.tickers, o.mode); if (cs > o.s || ce < o.end) continue;
            const tk = vp.info.tickers, w = vp.info.weights;
            row.rows.push({ name: vp.name, kind: 'mine', color: PCOL[vp.i], w: null, a: BT.stats(BT.backtest(tk, w, o.s, trainEnd, o.rule, false)), b: BT.stats(BT.backtest(tk, w, trainEnd + 1, o.end, o.rule, false)) });
          }
        }
        out.push(row);
      }
    } catch (err) { st('점검 중 문제가 생겼어요: ' + err.message); }
    finally { aiwfBusy = false; }
    state.aiwf = { out, cap: A.cap };
    renderAIWF();
  }
  function renderAIWF() {
    const host = $('#ai-wf'); if (!host) return; host.innerHTML = '';
    const W = state.aiwf; const st = $('#ai-wf-st');
    if (!W) { st.textContent = state.sumAI && state.sumAI.rec ? '잠시 뒤 자동으로 계산해요.' : ''; return; }
    if (W.busy) return;
    st.textContent = '';
    for (const r of W.out) {
      const box = el('div', 'wf');
      box.appendChild(el('h4', null, `${BT.label(r.t0)}~${BT.label(r.t1)}만 보고 골라서 → 그 뒤 ${r.Y}년 (${BT.label(r.s0)}~${BT.label(r.s1)})`));
      if (!r.ok || !r.rows.length) { box.appendChild(el('p', 'small muted', r.reason || '고를 수 있는 조합이 없었어요.')); host.appendChild(box); continue; }
      const ai = r.rows.find(x => x.kind === 'ai'), best = r.rows.find(x => x.kind === 'best');
      if (ai) {
        const over = W.cap < 1 && ai.b.mdd < -W.cap - 1e-9;
        box.appendChild(el('p', 'wf-say', `AI 방식으로 고른 비중은 고를 때 CAGR ${pct(ai.a.cagr, 1)} → 그 뒤 ${pct(ai.b.cagr, 1)}, MDD ${mpct1(ai.a.mdd)} → ${mpct1(ai.b.mdd)}, 최장 회복 ${uwTx(ai.a.uw.months, ai.a.uw.ongoing)} → ${uwTx(ai.b.uw.months, ai.b.uw.ongoing)}` + (W.cap < 1 ? (over ? ` — MDD 한도 ${Math.round(W.cap * 100)}%를 넘었어요.` : ` — MDD 한도 ${Math.round(W.cap * 100)}% 안이에요.`) : '.') + (best ? ` CAGR 최고로 고른 비중은 ${pct(best.a.cagr, 1)} → ${pct(best.b.cagr, 1)}.` : '')));
        box.appendChild(el('p', 'small muted wf-w', 'AI가 고른 비중: ' + ai.w.map(([t, w]) => `${t} ${fmtW(w)}`).join(' · ')));
      }
      const c = el('div', 'chart-box wf-c'); c.dataset.y = r.Y; box.appendChild(c);
      host.appendChild(box);
    }
    drawAIWF();
  }
  /* dumbbell: CAGR when chosen (hollow) → in the period after (filled) */
  function drawAIWF() {
    const W0 = state.aiwf; if (!W0 || W0.busy) return;
    for (const r of W0.out) {
      const host = document.querySelector(`.wf-c[data-y="${r.Y}"]`); if (!host) continue; host.innerHTML = ''; if (!isShown(host) || !r.rows.length) continue;
      const W = Math.max(280, host.clientWidth || 600), narrow = W < 520, lab = narrow ? 92 : 170, rowH = 30, H = 8 + r.rows.length * rowH + 22, iw = W - lab - 16;
      let lo = Infinity, hi = -Infinity; for (const x of r.rows) for (const v of [x.a.cagr, x.b.cagr]) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      const pad = (hi - lo) * 0.1 || 0.01; lo = Math.min(lo - pad, 0); hi += pad;
      const X = v => lab + (v - lo) / (hi - lo) * iw;
      const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '고를 때와 그 뒤의 CAGR' }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
      for (const v of linTicks(lo, hi, narrow ? 4 : 6)) { const x = X(v); svg('line', { x1: x, x2: x, y1: 4, y2: H - 18 }, g); svg('text', { x, y: H - 4, 'text-anchor': 'middle' }, ax).textContent = Math.round(v * 100) + '%'; }
      r.rows.forEach((x, i) => {
        const y = 8 + i * rowH + rowH / 2, col = x.kind === 'ai' ? 'var(--ink)' : x.kind === 'best' ? 'var(--warn)' : x.color;
        const l = svg('text', { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = x.kind === 'ai' ? 'AI 방식' : x.kind === 'best' ? 'CAGR 최고' : (x.name.length > (narrow ? 8 : 16) ? x.name.slice(0, narrow ? 7 : 15) + '…' : x.name); l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px'; if (x.kind !== 'mine') l.style.fontWeight = '700';
        const ln = svg('line', { x1: X(x.a.cagr), x2: X(x.b.cagr), y1: y, y2: y, 'stroke-width': 2.5 }, root); ln.style.stroke = col; ln.style.opacity = '0.5';
        const c0 = svg('circle', { cx: X(x.a.cagr), cy: y, r: 5, 'stroke-width': 2 }, root); c0.style.fill = 'var(--panel)'; c0.style.stroke = col;
        const c1 = svg('circle', { cx: X(x.b.cagr), cy: y, r: 6 }, root); c1.style.fill = col;
        svg('title', null, c1).textContent = `${x.name}\n고를 때 CAGR ${pct(x.a.cagr, 1)} · MDD ${mpct1(x.a.mdd)}\n그 뒤 CAGR ${pct(x.b.cagr, 1)} · MDD ${mpct1(x.b.mdd)}`;
      });
    }
  }
