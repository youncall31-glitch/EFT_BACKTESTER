  /* ======================= v10.0: CAGR · MDD · recovery side by side; the MDD always with its own recovery ======================= */
  const uwTx = (m, on) => (m ? dur(m) + (on ? '+' : '') : '없음');
  const mddRecTx = st => { const mi = st.mddInfo; if (!mi || !(mi.mdd < 0)) return ''; return mi.recovery < 0 ? `회복 ${dur(mi.months)}+ (아직)` : `회복 ${dur(mi.months)}`; };
  /* three bar panels — CAGR, MDD (with that fall's recovery), longest recovery — one row per item.
     rows: [{name, color, st, ref, faded, key}] ; opts: {ref: row used as the dashed reference, judge: colour bars better/worse than ref, onPick(key), sel} */
  function tripleBars(host, rows, opts) {
    host.innerHTML = ''; if (!rows.length) return;
    opts = opts || {};
    const W = Math.max(280, host.clientWidth || 600), wide = W >= 760, rowH = wide ? 30 : 26, lab = wide ? 150 : 96, gap = 18;
    const P = [
      { k: 'c', t: 'CAGR', s: '길수록 좋아요', v: st => st.cagr, f: st => pct(st.cagr, 1), up: true },
      { k: 'm', t: 'MDD', s: '짧을수록 좋아요 · 괄호는 그 하락의 회복 기간', v: st => -st.mdd, f: st => `${mpct1(st.mdd)}${st.mddInfo && st.mddInfo.mdd < 0 ? ` (${mddRecTx(st).replace('회복 ', '')})` : ''}`, up: false },
      { k: 'u', t: '최장 회복', s: '짧을수록 좋아요 · 고점 되찾기까지 가장 긴 기간', v: st => st.uw.months, f: st => uwTx(st.uw.months, st.uw.ongoing), up: false }
    ];
    const cols = wide ? 3 : 1, pw = wide ? (W - lab - gap * 2) / 3 : W - lab, ph = 34 + rows.length * rowH + 6;
    const H = wide ? ph : ph * 3 + 10;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'CAGR, MDD, 최장 회복 비교' }, host), ax = svg('g', { class: 'axis' }, root);
    const ref = opts.ref ? rows.find(r => r.key === opts.ref) : null;
    P.forEach((p, pi) => {
      const ox = wide ? lab + pi * (pw + gap) : lab, oy = wide ? 0 : pi * (ph + 5);
      const max = Math.max(1e-9, ...rows.map(r => p.v(r.st)));
      const tt = svg('text', { x: wide ? ox : 0, y: oy + 13 }, ax); tt.textContent = p.t; tt.style.fill = 'var(--ink)'; tt.style.fontWeight = '700'; tt.style.fontFamily = 'var(--font-sans)'; tt.style.fontSize = '13px';
      const ts = svg('text', { x: (wide ? ox : 0) + (p.t.length * 9 + 16), y: oy + 13 }, ax); ts.textContent = p.s; ts.style.fontSize = '10.5px';
      if (!wide && pi) { const sep = svg('line', { x1: 0, x2: W, y1: oy - 2, y2: oy - 2 }, root); sep.style.stroke = 'var(--line)'; }
      const bw = pw - (wide ? 8 : 4), X = v => ox + v / max * bw * (wide ? 0.6 : (p.k === 'm' ? 0.42 : 0.5));
      const refX = ref ? X(p.v(ref.st)) : 0;
      rows.forEach((r, i) => {
        const y = oy + 24 + i * rowH, cy = y + rowH / 2;
        if (pi === 0 || !wide) {
          const l = svg('text', { x: lab - 8, y: cy + 4, 'text-anchor': 'end' }, ax); l.textContent = r.name.length > (wide ? 18 : 11) ? r.name.slice(0, wide ? 17 : 10) + '…' : r.name;
          l.style.fill = 'var(--ink)'; l.style.fontFamily = 'var(--font-sans)'; l.style.fontSize = wide ? '12px' : '11.5px'; if (r.key === opts.sel || r.key === opts.ref) l.style.fontWeight = '700';
        }
        if (opts.sel && r.key === opts.sel) { const hl = svg('rect', { x: wide ? 0 : 0, y: y + 1, width: W, height: rowH - 2, rx: 6 }, root); hl.style.fill = 'color-mix(in srgb, var(--focus) 10%, transparent)'; root.insertBefore(hl, ax); }
        const v = p.v(r.st);
        let col = r.color;
        if (opts.judge && ref && r !== ref) { const d = v - p.v(ref.st), eps = p.k === 'c' ? 0.0005 : p.k === 'm' ? 0.002 : 0.5; col = Math.abs(d) <= eps ? 'var(--muted)' : (p.up ? d > 0 : d < 0) ? 'var(--pos)' : 'var(--neg)'; }
        const b = svg('rect', { x: ox, y: cy - (rowH * 0.32), width: Math.max(2, X(v) - ox), height: rowH * 0.64, rx: 3 }, root); b.style.fill = col; b.style.opacity = r.faded ? '0.45' : '0.88';
        const t = svg('text', { x: Math.max(X(v), refX) + 5, y: cy + 4 }, ax); let tx = p.f(r.st);
        if (ref && r !== ref && p.k !== 'm') { const d = p.v(r.st) - p.v(ref.st); tx += p.k === 'c' ? (Math.abs(d) < 0.0005 ? '' : ` (${d > 0 ? '+' : '−'}${Math.abs(d * 100).toFixed(1)})`) : (Math.abs(d) < 0.5 ? '' : ` (${d > 0 ? '+' : '−'}${Math.abs(Math.round(d))}개월)`); }
        t.textContent = tx; t.style.fill = 'var(--ink)'; t.style.fontSize = '11.5px'; if (r.key === opts.ref) t.style.fontWeight = '700';
        if (opts.onPick) { const hit = svg('rect', { x: 0, y, width: W, height: rowH }, root); hit.style.fill = 'transparent'; hit.style.cursor = 'pointer'; hit.addEventListener('click', () => opts.onPick(r.key)); svg('title', null, hit).textContent = `${r.name}\nCAGR ${pct(r.st.cagr, 2)} · MDD ${mpct1(r.st.mdd)} (${mddRecTx(r.st)}) · 최장 회복 ${uwTx(r.st.uw.months, r.st.uw.ongoing)}`; }
      });
      if (ref) { const x = X(p.v(ref.st)), l = svg('line', { x1: x, x2: x, y1: oy + 22, y2: oy + 24 + rows.length * rowH, 'stroke-dasharray': '3 3', 'stroke-width': 1.5 }, root); l.style.stroke = 'var(--ink)'; }
    });
  }
  /* 2 results › 성과 한눈에: CAGR, MDD and recovery for each portfolio */
  function drawSumTri(S) {
    const host = $('#c-sum-bf'); if (!host) return;
    tripleBars(host, S.rows.map(({ x }) => ({ key: x.key, name: sumName(x), color: x.color, st: x.st, faded: x.bench })));
  }
