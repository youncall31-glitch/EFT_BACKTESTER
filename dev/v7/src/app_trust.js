  /* ======================= v7.6: how predictable a backtest was, luck checks, and an optimizer that uses them =======================
     Predictability score (0–100) = how tightly the outcomes of every 3-, 5- and 10-year holding period (1-month steps) cluster:
     spread of CAGR, spread of MDD, and the bad case (10th-percentile return over cash). Luck checks are shown next to it. */
  const gradeOf = s => (s == null ? '–' : s >= 80 ? '높음' : s >= 60 ? '보통' : '낮음');
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const HZS = [2, 5, 10];
  const PSC = { 2: { c: [0.06, 0.43], e: [-0.12, 0.02] }, 3: { c: [0.05, 0.35], e: [-0.10, 0.02] }, 5: { c: [0.04, 0.25], e: [-0.06, 0.02] }, 10: { c: [0.02, 0.15], e: [-0.03, 0.03] } };
  const MDSC = [0.05, 0.50];
  const lower = (x, good, bad) => 100 * clamp01((bad - x) / (bad - good));   // smaller is better
  const upper = (x, bad, good) => 100 * clamp01((x - bad) / (good - bad));   // larger is better
  const qOf = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(p * (sorted.length - 1))))];
  /* every Y-year holding period inside a run (1-month steps): CAGR, MDD inside it, and CAGR over US T-bills */
  function winStats(res, i0, Y) {
    const L = Y * 12, n = res.n, v = res.vals; if (n < L) return null;
    const RC = BT.rfCum(), k = n - L + 1;
    const cg = new Float64Array(k), md = new Float64Array(k), ex = new Float64Array(k);
    for (let a = 0; a < k; a++) {
      const g = v[a + L] / v[a]; cg[a] = Math.pow(g, 1 / Y) - 1;
      ex[a] = cg[a] - (Math.pow(RC[i0 + a + L] / RC[i0 + a], 1 / Y) - 1);
      let pk = v[a], m = 0; for (let q = a + 1; q <= a + L; q++) { const x = v[q]; if (x > pk) pk = x; else { const d = x / pk - 1; if (d < m) m = d; } }
      md[a] = m;
    }
    const sc = Float64Array.from(cg).sort(), sm = Float64Array.from(md).sort(), se = Float64Array.from(ex).sort();
    let loss = 0; for (const x of cg) if (x < 0) loss++;
    return { Y, k, i0, cg, md, ex, c10: qOf(sc, 0.1), c50: qOf(sc, 0.5), c90: qOf(sc, 0.9), cmin: sc[0], cmax: sc[k - 1],
      m10: qOf(sm, 0.1), m50: qOf(sm, 0.5), m90: qOf(sm, 0.9), mmin: sm[0], mmax: sm[k - 1], e10: qOf(se, 0.1), loss: loss / k };
  }
  function predOf(res, i0) {
    const W = {}; const pr = [], pd = [], pb = [];
    for (const Y of HZS) {
      const w = winStats(res, i0, Y); if (!w) continue; W[Y] = w;
      w.sRet = lower(w.c90 - w.c10, PSC[Y].c[0], PSC[Y].c[1]); w.sDd = lower(w.m90 - w.m10, MDSC[0], MDSC[1]); w.sBad = upper(w.e10, PSC[Y].e[0], PSC[Y].e[1]);
      pr.push(w.sRet); pd.push(w.sDd); pb.push(w.sBad);
    }
    const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
    const sRet = avg(pr), sDd = avg(pd), sBad = avg(pb);
    return { W, sRet, sDd, sBad, score: sRet == null ? null : (sRet + sDd + sBad) / 3, top: W[10] ? 10 : W[5] ? 5 : W[2] ? 2 : null };
  }
  /* one mix: predictability plus luck checks (PSR/DSR, ±5%p weight nudge, minimum track record, block bootstrap).
     Total return (distributions reinvested), in the unit that is active when it is called. */
  function trustOf(tk, ws, i0, i1, rule, adj, N, VSR, light) {
    const res = BT.backtest(tk, ws, i0, i1, rule, adj || false), n = res.n, st = BT.stats(res);
    const P = predOf(res, i0);
    if (light) return Object.assign(P, { st, n });
    const RC = BT.rfCum(), rf = new Float64Array(n), ex = new Float64Array(n);
    for (let t = 0; t < n; t++) { rf[t] = RC[i0 + t + 1] / RC[i0 + t] - 1; ex[t] = res.r[t] - rf[t]; }
    const sh = BT.sharpeTest(ex, N || 1, VSR || 0);
    let nb = null;
    if (tk.length >= 2) {
      const tw = ws.reduce((a, b) => a + b, 0), w = ws.map(x => x / tw), cg = [];
      for (let a = 0; a < w.length; a++) { if (w[a] < 0.05 - 1e-9) continue;
        for (let b = 0; b < w.length; b++) { if (b === a) continue; const w2 = w.slice(); w2[a] -= 0.05; w2[b] += 0.05; const r2 = BT.backtest(tk, w2, i0, i1, rule, adj || false); cg.push(Math.pow(r2.vals[n], 12 / n) - 1); } }
      if (cg.length) { cg.sort((x, y) => x - y); const med = cg[Math.floor(cg.length / 2)]; nb = { med, min: cg[0], max: cg[cg.length - 1], drop: st.cagr - med, n: cg.length }; }
    }
    const H = Math.min(240, n), bs = BT.bootstrap(res.r, rf, H, 1000, 12, 7);
    const sig = sh.dsr != null ? sh.dsr : sh.psr;
    const checksAll = [
      { k: '유의성', ok: sig >= 0.95, txt: `${sh.dsr != null ? 'DSR' : 'PSR'} ${pct(sig, 0)}`, why: '운만으로 이 정도 샤프가 나올 가능성이 5% 넘음' },
      { k: '비중 민감도', ok: nb == null || nb.drop <= 0.005, txt: nb == null ? '종목 1개' : `±5%p → ${ppTxt(-nb.drop)}`, why: '비중을 조금만 바꿔도 CAGR이 0.5%p 넘게 떨어짐', na: nb == null },
      { k: '기록 길이', ok: sh.minTRL <= n, txt: isFinite(sh.minTRL) ? `필요 ${Math.max(1, Math.round(sh.minTRL / 12))}년 / 실제 ${Math.floor(n / 12)}년` : '샤프 0 이하', why: '샤프 비율을 믿기에 기록이 짧음' },
      { k: '부트스트랩', ok: bs.beat >= 0.9, txt: `현금보다 나을 확률 ${pct(bs.beat, 0)}`, why: '섞어 만든 20년 중 현금보다 못한 경우가 10% 넘음' }
    ];
    const checks = checksAll.slice(0, 2);   // v9: significance and the weight nudge; record length and the bootstrap restate the same Sharpe test
    return Object.assign(P, { st, sh, nb, bs, checks, checksAll, pass: checks.filter(c => c.ok).length, n });
  }
  const scoreCell = (td, s) => { td.appendChild(el('span', 'tscore ' + (s == null ? '' : s >= 80 ? 'hi' : s >= 60 ? 'mid' : 'lo'), s == null ? '–' : Math.round(s))); td.appendChild(el('span', 'sub', gradeOf(s))); return td; };
  const partCell = (td, s, sub) => { td.appendChild(el('b', 'pscore', s == null ? '–' : Math.round(s))); if (sub) td.appendChild(el('span', 'sub', sub)); return td; };
  function luckCell(td, T) {
    td.appendChild(el('b', T.pass === T.checks.length ? 'luck ok' : T.pass >= T.checks.length - 1 ? 'luck mid' : 'luck bad', `${T.pass}/${T.checks.length} 통과`));
    const fails = T.checks.filter(c => !c.ok);
    td.appendChild(el('span', 'sub', fails.length ? '주의: ' + fails.map(c => c.k).join(', ') : '유의성·비중 민감도'));
    td.title = T.checks.map(c => `${c.ok ? '통과' : '주의'} · ${c.k}: ${c.txt}${c.ok ? '' : ' — ' + c.why}`).join('\n');
    return td;
  }
  /* results tab: the user's portfolios */
  function renderTrustRes() {
    const t = $('#t-trust'); if (!t) return; t.innerHTML = ''; $('#trust-note').textContent = ''; state.disp = null;
    const L = state.last; if (!L) { renderDisp(); return; }
    const th = el('thead'), hr = el('tr');
    ['포트폴리오', '예측 가능성', '수익 산포', '낙폭 산포', '나쁜 경우', '운 점검', `${monthsTxt(Math.min(240, L.e - L.s + 1))} 뒤 범위 (부트스트랩)`].forEach(h => hr.appendChild(el('th', null, h)));
    th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody'), rows = [];
    for (const x of L.series) {
      const T = trustOf(x.tickers, x.weights, L.s, L.e, x.bench ? 'N' : state.rebal, L.adj, 1, 0);
      rows.push({ x, T });
      const tr = el('tr'); tr.appendChild(seriesTh(Object.assign({}, x, { name: x.bench ? state.bench : x.name })));
      tr.appendChild(scoreCell(el('td'), T.score));
      const w = T.top ? T.W[T.top] : null;
      tr.appendChild(partCell(el('td'), T.sRet, w ? `${T.top}년 CAGR ${pct(w.c10, 1)} ~ ${pct(w.c90, 1)}` : null));
      tr.appendChild(partCell(el('td'), T.sDd, w ? `${T.top}년 MDD ${mpct1(w.m10)} ~ ${mpct1(w.m90)}` : null));
      tr.appendChild(partCell(el('td'), T.sBad, w ? `${T.top}년 하위 10%: 현금 ${ppTxt(w.e10)}` : null));
      tr.appendChild(luckCell(el('td'), T));
      const c = el('td', T.bs.c05 < 0 ? 'neg' : null, `${pct(T.bs.c05, 1)} ~ ${pct(T.bs.c95, 1)}`); c.appendChild(el('span', 'sub', `중앙 ${pct(T.bs.c50, 1)} · 나쁜 경우 MDD ${mpct1(T.bs.m05)}`)); tr.appendChild(c);
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    $('#trust-note').textContent = `${BT.label(L.s)}~${BT.label(L.e)} · ${state.cur === 'KRW' ? '원화' : '달러'} 기준${state.real ? ' · 물가 반영' : ''} · 분배금 재투자 기준 · 산포 점수는 아래 ‘3·5·10년 구간 산포’의 모든 구간으로 계산 · 운 점검 칸에 마우스를 올리면 항목별 값이 보여요` + (L.adj ? ' · 추세 보정 데이터' : '');
    state.disp = { rows };
    renderDisp();
  }

  /* ---------- 3·5·10-year holding periods: how tightly CAGR and MDD cluster ---------- */
  state.dispY = 10; state.dispOff = new Set();
  function renderDisp() {
    const D = state.disp, chips = $('#disp-port'), t = $('#t-disp'); if (!t) return;
    chips.innerHTML = ''; t.innerHTML = ''; $('#disp-n').textContent = '';
    document.querySelectorAll('#disp-y button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.y === state.dispY ? 'true' : 'false'));
    if (!D) { $('#c-disp').innerHTML = ''; $('#c-disp-r').innerHTML = ''; $('#lg-disp').innerHTML = ''; return; }
    for (const { x } of D.rows) {
      const b = el('button', 'chip'); b.type = 'button'; b.dataset.k = x.key; b.setAttribute('aria-pressed', state.dispOff.has(x.key) ? 'false' : 'true');
      const k = el('span', 'key'); k.style.background = x.color; b.append(k, document.createTextNode(' ' + (x.bench ? state.bench : x.name))); chips.appendChild(b);
    }
    const th = el('thead'), hr = el('tr');
    ['포트폴리오', '보유 기간', 'CAGR 하위 10% · 중앙 · 상위 10%', 'CAGR 산포', 'MDD 하위 10% · 중앙 · 상위 10%', 'MDD 산포', '손실 난 구간'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const { x, T } of D.rows) {
      let first = true;
      for (const Y of HZS) {
        const w = T.W[Y]; const tr = el('tr', first ? 'grp-first' : null);
        tr.appendChild(first ? seriesTh(Object.assign({}, x, { name: x.bench ? state.bench : x.name })) : el('th'));
        tr.appendChild(el('td', 'hz', `${Y}년`));
        if (!w) { const c = el('td', 'na', '분석 기간이 짧아요'); c.colSpan = 5; tr.appendChild(c); tb.appendChild(tr); first = false; continue; }
        tr.appendChild(el('td', null, `${pct(w.c10, 1)} · ${pct(w.c50, 1)} · ${pct(w.c90, 1)}`));
        const cs = el('td', 'spr', `${((w.c90 - w.c10) * 100).toFixed(1)}%p`); cs.appendChild(el('i', 'sbar')).style.width = Math.min(100, (w.c90 - w.c10) * 100 / 0.4) + '%'; tr.appendChild(cs);
        tr.appendChild(el('td', null, `${mpct1(w.m10)} · ${mpct1(w.m50)} · ${mpct1(w.m90)}`));
        const ms = el('td', 'spr', `${((w.m90 - w.m10) * 100).toFixed(1)}%p`); ms.appendChild(el('i', 'sbar')).style.width = Math.min(100, (w.m90 - w.m10) * 100 / 0.6) + '%'; tr.appendChild(ms);
        tr.appendChild(el('td', w.loss > 0 ? 'neg' : null, pct(w.loss, 0)));
        tb.appendChild(tr); first = false;
      }
    }
    t.appendChild(tb);
    drawDisp();
  }
  $('#disp-y').addEventListener('click', e => { const b = e.target.closest('button[data-y]'); if (!b) return; state.dispY = +b.dataset.y; renderDisp(); });
  $('#disp-port').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; const k = b.dataset.k; if (state.dispOff.has(k)) state.dispOff.delete(k); else state.dispOff.add(k); renderDisp(); });
  function drawDisp() {
    const D = state.disp, host = $('#c-disp'), hr = $('#c-disp-r'); if (!host) return;
    host.innerHTML = ''; hr.innerHTML = ''; $('#lg-disp').innerHTML = '';
    if (!D || !isShown(host)) return;
    const Y = state.dispY;
    const S = D.rows.filter(r => !state.dispOff.has(r.x.key) && r.T.W[Y]).map(r => ({ name: r.x.bench ? state.bench : r.x.name, color: r.x.color, bench: r.x.bench, w: r.T.W[Y] }));
    if (!S.length) { host.appendChild(el('p', 'empty', `분석 기간이 ${Y}년보다 짧거나 고른 포트폴리오가 없어요.`)); return; }
    $('#disp-n').textContent = `${Y}년 구간 ${S[0].w.k.toLocaleString()}개 · ${BT.label(S[0].w.i0)}~${BT.label(S[0].w.i0 + S[0].w.k - 1)} 시작`;
    legend($('#lg-disp'), S, false, true);
    // scatter: x = depth of the fall inside the period, y = CAGR
    const W = Math.max(300, host.clientWidth || 600), H = 360, m = { l: 54, r: 14, t: 12, b: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    let xmax = 0, ymin = Infinity, ymax = -Infinity;
    for (const s of S) { xmax = Math.max(xmax, -s.w.mmin); ymin = Math.min(ymin, s.w.cmin); ymax = Math.max(ymax, s.w.cmax); }
    const xt = linTicks(0, Math.max(0.02, xmax * 1.04), 6), xm = xt[xt.length - 1] < xmax ? xmax * 1.05 : xt[xt.length - 1];
    const pad = (ymax - ymin) * 0.05 || 0.01, yt = linTicks(ymin - pad, ymax + pad, 6), y0 = Math.min(yt[0], ymin - pad), y1 = Math.max(yt[yt.length - 1], ymax + pad);
    const X = x => m.l + x / xm * iw, Yp = y => m.t + ih - (y - y0) / (y1 - y0) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': `${Y}년 보유 구간별 CAGR과 MDD 산포도` }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of yt) { const y = Yp(v); if (y < m.t - 1 || y > m.t + ih + 1) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 8, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    for (const v of xt) { const x = X(v); if (x > m.l + iw + 1) continue; svg('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih }, g); svg('text', { x, y: H - 22, 'text-anchor': 'middle' }, ax).textContent = v ? '−' + (v * 100).toFixed(0) + '%' : '0%'; }
    svg('text', { x: m.l + iw / 2, y: H - 4, 'text-anchor': 'middle' }, ax).textContent = '구간 안 최대 낙폭 (MDD) →';
    const yl = svg('text', { x: 12, y: m.t + ih / 2, 'text-anchor': 'middle', transform: `rotate(-90 12 ${m.t + ih / 2})` }, ax); yl.textContent = 'CAGR';
    if (y0 < 0 && y1 > 0) { const z = svg('line', { x1: m.l, x2: m.l + iw, y1: Yp(0), y2: Yp(0) }, root); z.style.stroke = 'var(--line-2)'; }
    const pts = [];
    for (const s of S) {
      const gp = svg('g', null, root);
      for (let a = 0; a < s.w.k; a++) { const cx = X(-s.w.md[a]), cy = Yp(s.w.cg[a]); const c = svg('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: 2.4 }, gp); c.style.fill = s.color; c.style.opacity = s.bench ? '0.25' : '0.35'; pts.push([cx, cy, s, a]); }
    }
    for (const s of S) {   // 10th–90th percentile box and the median, drawn above all dots
      const r = svg('rect', { x: X(-s.w.m90), y: Yp(s.w.c90), width: Math.max(1, X(-s.w.m10) - X(-s.w.m90)), height: Math.max(1, Yp(s.w.c10) - Yp(s.w.c90)), fill: 'none', 'stroke-width': 2, rx: 3 }, root);
      r.style.stroke = s.color; if (s.bench) r.setAttribute('stroke-dasharray', '5 4');
      const md = svg('circle', { cx: X(-s.w.m50), cy: Yp(s.w.c50), r: 6, 'stroke-width': 2.5 }, root); md.style.fill = s.color; md.style.stroke = 'var(--panel)';
    }
    const tip = el('div', 'tip'); tip.hidden = true; host.appendChild(tip);
    const hl = svg('circle', { r: 6, fill: 'none', 'stroke-width': 2, visibility: 'hidden' }, root); hl.style.stroke = 'var(--ink)';
    const hit = svg('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, root);
    const show = ev => {
      const rc = root.getBoundingClientRect(), sx = (ev.clientX - rc.left) * (W / rc.width), sy = (ev.clientY - rc.top) * (H / rc.height);
      let best = null, bd = 196; for (const p of pts) { const d = (p[0] - sx) ** 2 + (p[1] - sy) ** 2; if (d < bd) { bd = d; best = p; } }
      if (!best) { tip.hidden = true; hl.setAttribute('visibility', 'hidden'); return; }
      const [cx, cy, s, a] = best; hl.setAttribute('cx', cx); hl.setAttribute('cy', cy); hl.setAttribute('visibility', 'visible');
      tip.innerHTML = ''; tip.appendChild(el('div', 't', `${BT.label(s.w.i0 + a)} – ${BT.label(s.w.i0 + a + Y * 12 - 1)}`));
      const row = el('div', 'r'); const lab = el('span'); const k = el('i'); k.style.background = s.color; lab.append(k, document.createTextNode(s.name)); row.append(lab, el('b', null, `CAGR ${pct(s.w.cg[a], 1)} · MDD ${mpct1(s.w.md[a])}`)); tip.appendChild(row);
      tip.hidden = false; const px = cx * (rc.width / W), tw = tip.offsetWidth; tip.style.left = Math.max(0, px + 14 + tw > rc.width ? px - tw - 14 : px + 14) + 'px'; tip.style.top = Math.max(0, cy * (rc.height / H) - 30) + 'px';
    };
    hit.addEventListener('pointermove', show); hit.addEventListener('pointerdown', show); hit.addEventListener('pointerleave', () => { tip.hidden = true; hl.setAttribute('visibility', 'hidden'); });
    // range bars: min–max line, 10th–90th bar, median tick; CAGR then MDD
    const rangeChart = (title, get, fmt, deeperLeft) => {
      const RW = Math.max(300, hr.clientWidth || 600), rowH = 30, RH = 30 + S.length * rowH + 24, rm = { l: Math.min(150, RW * 0.32), r: 16, t: 26, b: 22 };
      const riw = RW - rm.l - rm.r;
      let lo = Infinity, hi = -Infinity; for (const s of S) { const v = get(s.w); lo = Math.min(lo, v[0]); hi = Math.max(hi, v[4]); }
      const tk = linTicks(lo, hi, 6), a0 = Math.min(tk[0], lo), a1 = Math.max(tk[tk.length - 1], hi);
      const Xr = v => rm.l + (v - a0) / (a1 - a0 || 1) * riw;
      const r2 = svg('svg', { viewBox: `0 0 ${RW} ${RH}`, width: RW, height: RH, role: 'img', 'aria-label': `${Y}년 구간 ${title} 범위` }, hr);
      const g2 = svg('g', { class: 'grid' }, r2), ax2 = svg('g', { class: 'axis' }, r2);
      const ttl = svg('text', { x: 0, y: 14 }, ax2); ttl.textContent = title; ttl.style.fontWeight = '600'; ttl.style.fill = 'var(--ink-2)';
      for (const v of tk) { const x = Xr(v); svg('line', { x1: x, x2: x, y1: rm.t, y2: RH - rm.b }, g2); svg('text', { x, y: RH - 6, 'text-anchor': 'middle' }, ax2).textContent = fmt(v); }
      S.forEach((s, i) => {
        const y = rm.t + i * rowH + rowH / 2, v = get(s.w);
        const lb = svg('text', { x: rm.l - 10, y: y + 4, 'text-anchor': 'end' }, ax2); lb.textContent = s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name; lb.style.fill = 'var(--ink)'; lb.style.fontFamily = 'var(--font-sans)';
        const ln = svg('line', { x1: Xr(v[0]), x2: Xr(v[4]), y1: y, y2: y, 'stroke-width': 1.5 }, r2); ln.style.stroke = s.color;
        const bar = svg('rect', { x: Xr(v[1]), y: y - 7, width: Math.max(2, Xr(v[3]) - Xr(v[1])), height: 14, rx: 3 }, r2); bar.style.fill = s.color; bar.style.opacity = s.bench ? '0.45' : '0.75';
        const md = svg('line', { x1: Xr(v[2]), x2: Xr(v[2]), y1: y - 10, y2: y + 10, 'stroke-width': 3 }, r2); md.style.stroke = 'var(--ink)';
        const tt = svg('title', null, bar); tt.textContent = `${s.name} · 최저 ${fmt(v[0])} · 하위 10% ${fmt(v[1])} · 중앙 ${fmt(v[2])} · 상위 10% ${fmt(v[3])} · 최고 ${fmt(v[4])}`;
      });
    };
    rangeChart(`${Y}년 CAGR`, w => [w.cmin, w.c10, w.c50, w.c90, w.cmax], v => (v * 100).toFixed(0) + '%');
    rangeChart(`${Y}년 구간 안 MDD`, w => [w.mmin, w.m10, w.m50, w.m90, w.mmax], v => (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%');
  }

  /* ---------- optimizer: picks that favour consistency across eras and a flat neighbourhood; predictability shown for each ---------- */
  async function runTrust() {
    const o = state.opt, K = o && o.keep, st = $('#o-trust-status'); if (!K) return;
    if (!K.P.ok) { st.textContent = `분석 기간 전체로 계산할 수 없어 건너뛰었어요: ${K.P.reason}`; return; }
    st.textContent = '시기별로 나눠 모든 조합을 다시 계산하는 중…';
    let T, pbo;
    try {
      T = await BT.trustScan(K.P, f => { st.textContent = `시기별로 나눠 모든 조합을 다시 계산하는 중… ${Math.round(f * 100)}%`; });
      if (state.opt !== o) return;
      if (!T.ok) { o.trust = { T }; renderTrustOpt(); return; }
      pbo = await BT.pboCalc(K.P, T, f => { st.textContent = `과최적화 확률을 계산하는 중… ${Math.round(f * 100)}%`; });
    } catch (err) { st.textContent = '신뢰도 계산 중 문제가 생겼어요: ' + err.message; return; }
    if (state.opt !== o) return;
    let m = 0, v = 0; const S = K.P.store; for (let i = 0; i < S.n; i++) m += S.sh[i] / SQ12_; m /= S.n; for (let i = 0; i < S.n; i++) { const d = S.sh[i] / SQ12_ - m; v += d * d; }
    o.trust = { T, pbo, VSR: v / Math.max(1, S.n - 1) };
    await new Promise(r => setTimeout(r, 0));
    trustPickAll(); renderTrustOpt();
  }
  const SQ12_ = Math.sqrt(12);
  /* the most predictable mix inside the MDD range: candidates = the range's best by consistency, by CAGR and by Sharpe */
  function predPick(P, T, lo, hi, uw, o) {
    const S = P.store, B = T.B, feas = [];
    for (let i = 0; i < S.n; i++) { const dd = -S.mdd[i]; if (dd >= lo && dd < hi && !(uw > 0 && S.uw[i] > uw)) feas.push(i); }
    if (!feas.length) return null;
    const bs = i => { let mm = 0; for (let b = 0; b < B; b++) mm += T.bsr[i * B + b]; mm /= B; let vv = 0; for (let b = 0; b < B; b++) { const d = T.bsr[i * B + b] - mm; vv += d * d; } return mm - 0.5 * Math.sqrt(vv / (B - 1)); };
    const top = (key, k) => feas.slice().sort((a, b) => key(b) - key(a)).slice(0, k);
    const cand = new Set([...top(bs, 300), ...top(i => S.cagr[i], 150), ...top(i => S.sh[i], 150)]);
    let best = null, bv = -Infinity;
    for (const i of cand) {
      const p = BT.optPoint(P, i), res = BT.backtest(p.w.map(x => x[0]), p.w.map(x => x[1]), o.s, o.end, o.rule, false), pr = predOf(res, o.s);
      if (pr.score == null) continue; const v = pr.score + S.cagr[i] * 1e-3;
      if (v > bv) { bv = v; best = Object.assign(p, { info: { of: feas.length, cand: cand.size, score: pr.score } }); }
    }
    return best;
  }
  function trustPickAll() {
    const o = state.opt, K = o && o.keep, TR = o && o.trust; if (!TR || !TR.T || !TR.T.ok) return;
    const P = K.P, uw = +$('#o-uw').value || 0, lo = (+$('#o-lo').value || 0) / 100, hi = fieldNum('#o-hi', 100) / 100;
    const N = P.evaluated, VSR = TR.VSR;
    TR.rows = withUnit(!!o.real, () => {
      const mk = (name, color, w, extra) => { if (!w) return null; const tk = w.map(x => x[0]), ws = w.map(x => x[1]); return Object.assign({ name, color, w, tr: trustOf(tk, ws, o.s, o.end, o.rule, false, N, VSR) }, extra || {}); };
      const pick = crit => { const r = BT.trustPick(P, TR.T, crit); if (!r) return null; const p = BT.optPoint(P, r.i); return Object.assign(p, { info: r }); };
      const a = pick({ hi: null, uw }), b = pick({ lo, hi, uw }), c = predPick(P, TR.T, lo, hi, uw, o);
      TR.picks = { all: a, range: b, pred: c };
      const rows = [];
      rows.push(mk('신뢰도 추천', 'var(--p3)', a && a.w, { kind: 'trust', p: a }));
      if (!(a && b && a.i === b.i)) rows.push(mk(`신뢰도 추천 · MDD ${Math.round(lo * 100)}~${Math.round(hi * 100)}%`, 'var(--p3)', b && b.w, { kind: 'trust', p: b }));
      if (c && !(b && c.i === b.i) && !(a && c.i === a.i)) rows.push(mk(`예측 가능성 최고 · MDD ${Math.round(lo * 100)}~${Math.round(hi * 100)}%`, 'var(--p3)', c.w, { kind: 'trust', p: c }));
      if (K.picks) { rows.push(mk('AI 유지형', 'var(--p1)', K.picks.ai && K.picks.ai.w)); rows.push(mk('내 기준 유지형', 'var(--p2)', K.picks.user && K.picks.user.w)); }
      if (K.picks && K.picks.own) { rows.push(mk('전체 기간 AI 추천', 'var(--p1)', K.picks.own.ai && K.picks.own.ai.w)); rows.push(mk(`전체 기간 내 기준 (MDD ${Math.round(lo * 100)}~${Math.round(hi * 100)}%)`, 'var(--p2)', K.picks.own.user && K.picks.own.user.w)); }
      const top = K.fix && K.fix[K.fix.length - 1]; if (top && top.d) rows.push(mk('전체 기간 최고 CAGR', 'var(--ink-2)', top.d.w));
      for (const vp of validPorts()) {
        const [cs, ce] = BT.commonRange(vp.info.tickers, o.mode); if (cs > o.s || ce < o.end) continue;
        const tw = vp.info.weights.reduce((x, y) => x + y, 0);
        rows.push({ name: vp.name, color: PCOL[vp.i], mine: true, w: vp.info.tickers.map((t, j) => [t, vp.info.weights[j] / tw]), tr: trustOf(vp.info.tickers, vp.info.weights, o.s, o.end, o.rule, false, 1, 0) });
      }
      return rows.filter(Boolean);
    }, o.cur);
  }
  function renderTrustOpt() {
    const st = $('#o-trust-status'), host = $('#o-trust'); if (!host) return;
    host.innerHTML = ''; $('#t-trust-cmp').innerHTML = ''; $('#t-pbo').innerHTML = ''; $('#trust-more').hidden = true;
    const o = state.opt;
    if (!o) { st.textContent = '‘최적 비중 찾기’를 실행하면 이어서 계산해요.'; return; }
    const TR = o.trust;
    if (!TR) { if (!/계산하는 중/.test(st.textContent)) st.textContent = '전체 기간 계산이 끝나면 이어서 계산해요.'; return; }
    if (!TR.T.ok) { st.textContent = TR.T.reason; return; }
    if (!TR.rows) trustPickAll();
    const T = TR.T, yrs = monthsTxt(Math.round(T.n / T.B));
    st.textContent = `${BT.label(o.s)}~${BT.label(o.end)}을 약 ${yrs}씩 ${T.B}개 시기로 나눠 ${T.N.toLocaleString('ko-KR')}개 조합을 다시 계산했어요 · 유의성은 ${o.keep.P.evaluated.toLocaleString('ko-KR')}개 조합을 시험한 것을 감안한 값(DSR)`;
    const lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    const cards = [['all', '신뢰도 추천', '시기 일관성'], ['range', `신뢰도 추천 · MDD ${lo}~${hi}%`, '시기 일관성'], ['pred', `예측 가능성 최고 · MDD ${lo}~${hi}%`, '산포']];
    for (const [key, title] of cards) {
      const p = TR.picks && TR.picks[key];
      const dupOf = p && cards.slice(0, cards.findIndex(c => c[0] === key)).map(c => c[0]).find(k2 => TR.picks[k2] && TR.picks[k2].i === p.i);
      const row = p && TR.rows.find(r => r.kind === 'trust' && r.p && r.p.i === p.i);
      const box = el('div', 'pick');
      const hd = el('div', 'pick-head'); const mk = el('span', 'pick-mark'); mk.style.background = 'var(--p3)'; hd.append(mk, el('h3', null, title)); box.appendChild(hd);
      if (!p || !row) { box.appendChild(el('p', 'empty', key !== 'all' ? `전체 기간 MDD가 ${lo}~${hi}%인 조합이 없어요.` : '조합이 없어요.')); host.appendChild(box); continue; }
      const R = row.tr;
      if (dupOf) box.appendChild(el('p', 'badge', `‘${cards.find(c => c[0] === dupOf)[1]}’과 같은 조합이 뽑혔어요.`));
      box.appendChild(el('p', 'crit', key === 'pred'
        ? `전체 기간 MDD ${lo}% 이상 ${hi}% 미만인 조합 중 후보 ${p.info.cand}개를 3·5·10년 모든 구간으로 다시 계산해, 결과가 가장 좁게 모이고 나쁜 경우도 덜 나빴던(예측 가능성 점수가 가장 높은) 조합이에요.`
        : `${T.B}개 시기 모두에서 샤프 비율이 고르게 높고(시기 일관성), 비중을 한 칸씩 바꾼 이웃 조합 ${p.info.nb}개도 비슷하게 좋은 조합이에요.` + (key === 'range' ? ` 전체 기간 MDD ${lo}% 이상 ${hi}% 미만인 조합 ${p.info.of.toLocaleString('ko-KR')}개 중에서 골랐어요.` : '')));
      const kp = el('div', 'kpis k4');
      kpi(kp, '예측 가능성', `${R.score == null ? '–' : Math.round(R.score)} · ${gradeOf(R.score)}`, `수익 산포 ${Math.round(R.sRet)} · 낙폭 산포 ${Math.round(R.sDd)} · 나쁜 경우 ${Math.round(R.sBad)}`);
      kpi(kp, '전체 CAGR', pct(R.st.cagr), monthsTxt(o.end - o.s + 1));
      kpi(kp, 'MDD', mpct(R.st.mdd), R.st.mddInfo.mdd < 0 ? `${R.st.mddInfo.peakLabel}→${R.st.mddInfo.troughLabel}` : null);
      kpi(kp, '신빙성', `${R.pass}/${R.checks.length} 통과`, R.checks.filter(c => !c.ok).map(c => c.k).join(', ') || '모두 통과');
      box.appendChild(kp);
      box.appendChild(wbars(p.w, 'var(--p3)'));
      box.appendChild(applyRow(p.w, `${title} · ${BT.label(o.s)}~${BT.label(o.end)}`, snapOf({ i0: o.s, i1: o.end, adjMap: null }, R.st, null)));
      host.appendChild(box);
    }
    $('#trust-more').hidden = false;
    const t = $('#t-trust-cmp'), th = el('thead'), hr = el('tr');
    ['조합', '비중', '전체 CAGR', 'MDD', '예측 가능성', '수익 산포', '낙폭 산포', '나쁜 경우', '운 점검'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody'); const best = Math.max(...TR.rows.map(r => r.tr.score || 0));
    for (const r of TR.rows) {
      const R = r.tr, tr = el('tr', r.mine ? 'mine' : r.kind === 'trust' ? 'hl' : null), w = R.top ? R.W[R.top] : null;
      const h = el('th'); const sh = el('span', 'serieshead'); const k = el('span', 'key'); k.style.background = r.color; sh.append(k, document.createTextNode(r.name)); h.appendChild(sh); if (r.mine) h.appendChild(el('span', 'sub', '내 포트폴리오 · 유의성은 PSR')); tr.appendChild(h);
      tr.appendChild(el('td', 'twrap wtxt', wText(r.w)));
      tr.appendChild(el('td', R.st.cagr < 0 ? 'neg' : null, pct(R.st.cagr, 1)));
      tr.appendChild(el('td', 'neg', mpct1(R.st.mdd)));
      const sc = scoreCell(el('td'), R.score); if (R.score === best) sc.classList.add('best'); tr.appendChild(sc);
      tr.appendChild(partCell(el('td'), R.sRet, w ? `${R.top}년 ${pct(w.c10, 1)}~${pct(w.c90, 1)}` : null));
      tr.appendChild(partCell(el('td'), R.sDd, w ? `${R.top}년 ${mpct1(w.m10)}~${mpct1(w.m90)}` : null));
      tr.appendChild(partCell(el('td'), R.sBad, w ? `현금 ${ppTxt(w.e10)}` : null));
      tr.appendChild(luckCell(el('td'), R));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    const pb = TR.pbo, tp = $('#t-pbo'), th2 = el('thead'), hr2 = el('tr');
    ['고르는 방식', '과최적화 확률 (PBO)', '고른 조합의 표본 밖 순위', '표본 안 샤프 → 표본 밖 샤프'].forEach(h => hr2.appendChild(el('th', null, h))); th2.appendChild(hr2); tp.appendChild(th2);
    const tb2 = el('tbody');
    for (const [k, name, sub] of [['sh', '샤프 비율이 가장 높은 조합', 'AI 추천과 비슷한 방식'], ['cagr', 'CAGR이 가장 높은 조합', '수익만 보고 고르기'], ['rob', '시기 일관성이 가장 높은 조합', '신뢰도 추천의 방식(이웃 평균 제외)']]) {
      const R = pb[k], tr = el('tr', k === 'rob' ? 'hl' : null); const h = el('th', null, name); h.appendChild(el('span', 'sub', sub)); tr.appendChild(h);
      const c1 = el('td', R.pbo >= 0.5 ? 'neg' : null, pct(R.pbo, 0)); c1.appendChild(el('span', 'sub', R.pbo < 0.2 ? '낮음' : R.pbo < 0.5 ? '보통' : '높음 — 동전 던지기보다 나쁨')); tr.appendChild(c1);
      const c2 = el('td', R.rank < 0.5 ? 'neg' : null, `${Math.round(R.rank * 100)}`); c2.appendChild(el('span', 'sub', '백분위 중앙값 · 50이 중간, 100이 1등')); tr.appendChild(c2);
      tr.appendChild(el('td', null, R.isSh != null ? `${num(R.isSh)} → ${num(R.oosSh)}` : `→ ${num(R.oosSh)}`));
      tb2.appendChild(tr);
    }
    tp.appendChild(tb2);
    $('#pbo-note').textContent = `${T.B}개 시기를 반씩 나누는 ${pb.splits}가지 방법마다, 한쪽 절반(표본 안)에서 가장 좋았던 조합이 나머지 절반(표본 밖)에서 ${T.N.toLocaleString('ko-KR')}개 조합 중 몇 등이었는지 봤어요. 과최적화 확률은 그 조합이 표본 밖에서 중간보다 못했던 비율이에요.`;
  }
