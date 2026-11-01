  /* ======================= v7.8: graph-first helpers ======================= */
  /* dot strip: one row per period, one dot per series; get(row, pid) -> value or null */
  function dotStrip(host, title, periods, rows, get, fmt) {
    const W = Math.max(280, host.clientWidth || 600), rowH = 28, lab = W < 520 ? 86 : 140, H = 30 + periods.length * rowH + 22, iw = W - lab - 18;
    let lo = Infinity, hi = -Infinity; for (const r of rows) for (const p of periods) { const v = get(r, p.id); if (v == null) continue; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    if (!isFinite(lo)) return;
    const pad = (hi - lo) * 0.08 || 0.01, tk = linTicks(lo - pad, hi + pad, W < 520 ? 4 : 6), a0 = Math.min(tk[0], lo - pad), a1 = Math.max(tk[tk.length - 1], hi + pad);
    const X = v => lab + (v - a0) / (a1 - a0) * iw;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': title }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const tt = svg('text', { x: 0, y: 14 }, ax); tt.textContent = title; tt.style.fontWeight = '600'; tt.style.fill = 'var(--ink-2)';
    for (const v of tk) { const x = X(v); svg('line', { x1: x, x2: x, y1: 24, y2: H - 20 }, g); svg('text', { x, y: H - 5, 'text-anchor': 'middle' }, ax).textContent = fmt(v); }
    periods.forEach((p, i) => {
      const y = 30 + i * rowH + rowH / 2;
      if (i % 2 === 0) { const b = svg('rect', { x: lab - 4, y: y - rowH / 2, width: iw + 8, height: rowH }, root); b.style.fill = 'var(--panel-2)'; root.insertBefore(b, g); }
      const l = svg('text', { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = p.name; l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
      const vals = rows.map(r => get(r, p.id)).filter(v => v != null);
      if (vals.length > 1) { const sp = svg('line', { x1: X(Math.min(...vals)), x2: X(Math.max(...vals)), y1: y, y2: y }, root); sp.style.stroke = 'var(--line-2)'; }
      for (const r of rows) {
        const v = get(r, p.id); if (v == null) continue;
        const c = svg('circle', { cx: X(v), cy: y, r: r.bench ? 5 : 6, 'stroke-width': 2 }, root); c.style.fill = r.color; c.style.stroke = 'var(--panel)'; if (r.bench) c.style.opacity = '0.7';
        svg('title', null, c).textContent = `${r.name} · ${p.name}${p.sub ? ` (${p.sub})` : ''} · ${fmt(v)}`;
      }
    });
  }
  /* 0–100 score bars with the grade bands behind */
  function scoreBars(host, rows) {
    host.innerHTML = '';
    const R = rows.filter(r => r.score != null); if (!R.length) return;
    const W = Math.max(280, host.clientWidth || 600), rowH = 30, lab = W < 520 ? 86 : 140, H = 8 + R.length * rowH + 22, iw = W - lab - 40;
    const X = v => lab + v / 100 * iw;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '예측 가능성 점수' }, host), ax = svg('g', { class: 'axis' }, root);
    for (const [a, b, c, t] of [[0, 60, 'var(--neg)', '낮음'], [60, 80, 'var(--warn)', '보통'], [80, 100, 'var(--pos)', '높음']]) {
      const z = svg('rect', { x: X(a), y: 4, width: X(b) - X(a), height: H - 26 }, root); z.style.fill = c; z.style.opacity = '0.08';
      const zt = svg('text', { x: (X(a) + X(b)) / 2, y: H - 5, 'text-anchor': 'middle' }, ax); zt.textContent = t;
    }
    R.forEach((r, i) => {
      const y = 8 + i * rowH + rowH / 2 - 2;
      const l = svg('text', { x: lab - 8, y: y + 4, 'text-anchor': 'end' }, ax); l.textContent = r.name.length > 12 ? r.name.slice(0, 11) + '…' : r.name; l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = '12px';
      const b = svg('rect', { x: lab, y: y - 8, width: Math.max(2, X(r.score) - lab), height: 16, rx: 3 }, root); b.style.fill = r.color; b.style.opacity = r.bench ? '0.5' : '0.85';
      const t = svg('text', { x: X(r.score) + 6, y: y + 4 }, ax); t.textContent = Math.round(r.score); t.style.fill = 'var(--ink)'; t.style.fontWeight = '700';
    });
  }
  /* luck checks as a grid of marks */
  function luckGrid(host, rows) {
    host.innerHTML = '';
    const R = rows.filter(r => r.T && r.T.checks); if (!R.length) return;
    const t = el('table', 'lgrid'), th = el('thead'), hr = el('tr'); hr.appendChild(el('th'));
    for (const c of R[0].T.checks) hr.appendChild(el('th', null, c.k)); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const r of R) {
      const tr = el('tr'); const h = el('th'); const k = el('span', 'key'); k.style.background = r.color; h.append(k, document.createTextNode(' ' + r.name)); tr.appendChild(h);
      for (const c of r.T.checks) { const td = el('td', c.na ? 'na' : c.ok ? 'ok' : 'warn', c.na ? '–' : c.ok ? '✓' : '!'); td.title = `${c.k}: ${c.txt}${c.ok ? '' : ' — ' + c.why}`; tr.appendChild(td); }
      tb.appendChild(tr);
    }
    t.appendChild(tb); host.appendChild(t);
  }
  /* results tab: latest 10·15·20·25·30 years and the whole period as a dot strip */
  function drawTrail() {
    const host = $('#c-trail'); if (!host) return; host.innerHTML = ''; $('#lg-trail').innerHTML = '';
    const L = state.last; if (!L || !isShown(host)) return;
    const periods = [{ id: 'all', name: '전체' }].concat(YEARS.map(Y => ({ id: Y, name: `최근 ${Y}년` })));
    const rows = L.series.map(x => ({ name: x.bench ? state.bench : x.name, color: x.color, bench: x.bench, x }));
    legend($('#lg-trail'), rows, false, true);
    const val = (r, pid, k) => { if (pid === 'all') return r.x.st[k]; const t = r.x.trail.find(q => q.years === pid); return t && t.ok ? t[k] : null; };
    dotStrip(host, 'CAGR', periods, rows, (r, p) => val(r, p, 'cagr'), v => (v * 100).toFixed(0) + '%');
    dotStrip(host, 'MDD', periods, rows, (r, p) => val(r, p, 'mdd'), v => (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%');
  }
  function drawTrustRes() {
    const host = $('#c-trust-score'); if (!host) return;
    const D = state.disp; host.innerHTML = ''; $('#trust-luck').innerHTML = '';
    if (!D || !isShown(host)) return;
    const rows = D.rows.map(r => ({ name: r.x.bench ? state.bench : r.x.name, color: r.x.color, bench: r.x.bench, score: r.T.score, T: r.T }));
    scoreBars(host, rows); luckGrid($('#trust-luck'), rows);
  }
