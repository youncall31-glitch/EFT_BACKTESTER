  /* ======================= v7.9: defence rule — test it on my own portfolio ======================= */
  state.guard = { pi: null, att: null, cut: 0.5, def: 'BIL', trig: 0.10, back: 'sma', stage: 1 };
  const G_TRIGS = [0.05, 0.10, 0.15, 0.20, 0.25];
  const G_BACKS = [['sma', '추세 회복', '공격 종목들이 10개월 이동평균 위로 올라오면'], ['half', '낙폭 절반 회복', '떨어진 폭의 절반을 되찾으면'], ['bounce', '저점 +10%', '저점보다 10% 오르면'], ['time', '12개월 뒤', '줄이고 12개월이 지나면'], ['peak', '고점 −5%', '고점의 5% 안까지 회복하면']];
  const isDefensive = t => { const c = (DATA.assets[t] && DATA.assets[t].c) || ''; return !/하이일드/.test(c) && /채|현금|^금$|^은$|원자재/.test(c); };
  (function buildGuardCtl() {
    const fill = (sel, items, v) => { const s = $(sel); s.innerHTML = ''; for (const [val, txt] of items) { const o = el('option', null, txt); o.value = val; s.appendChild(o); } s.value = String(v); };
    fill('#g-trig', G_TRIGS.map(x => [x, `고점 대비 −${Math.round(x * 100)}%`]).concat([['sma', '추세 이탈 (이동평균 아래)']]), state.guard.trig);
    fill('#g-cut', [[0.25, '공격 비중의 1/4'], [0.5, '공격 비중의 절반'], [0.75, '공격 비중의 3/4'], [1, '공격 비중 전부']], state.guard.cut);
    fill('#g-def', [['BIL', 'BIL (현금성)'], ['SHY', 'SHY (단기채)'], ['IEF', 'IEF (중기채)'], ['GLD', 'GLD (금)']], state.guard.def);
    fill('#g-back', G_BACKS.map(([k, n]) => [k, n]), state.guard.back);
    fill('#g-stage', [[1, '한 번에'], [2, '2개월에 나눠'], [3, '3개월에 나눠']], state.guard.stage);
    const on = () => { const G = state.guard; G.trig = $('#g-trig').value === 'sma' ? 'sma' : +$('#g-trig').value; G.cut = +$('#g-cut').value; G.def = $('#g-def').value; G.back = $('#g-back').value; G.stage = +$('#g-stage').value; renderGuard(); };
    ['#g-trig', '#g-cut', '#g-def', '#g-back', '#g-stage'].forEach(s => $(s).addEventListener('change', on));
    $('#g-port').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.guard.pi = +b.dataset.p; state.guard.att = null; renderGuard(); });
    $('#g-att').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; const s = state.guard.att; if (s.has(b.dataset.t)) s.delete(b.dataset.t); else s.add(b.dataset.t); renderGuard(); });
    $('#g-grid').addEventListener('click', e => { const c = e.target.closest('[data-tr]'); if (!c) return; const G = state.guard; G.trig = c.dataset.tr === 'sma' ? 'sma' : +c.dataset.tr; if (c.dataset.bk) G.back = c.dataset.bk; $('#g-trig').value = String(G.trig); $('#g-back').value = G.back; renderGuard(); });
  })();
  function guardRun(x, G, trig, back) {
    const L = state.last;
    return BT.guardSim({ tickers: x.info.tickers, weights: x.info.weights, attack: x.info.tickers.map(t => G.att.has(t)), def: G.def, cut: G.cut, trig, back, stage: G.stage, i0: L.s, i1: L.e, rule: state.rebal, adj: L.adj });
  }
  function renderGuard() { renderGuard0(); renderRecov(); }
  function renderGuard0() {
    const host = $('#g-kpi'); if (!host) return;
    host.innerHTML = ''; $('#g-grid').innerHTML = ''; $('#g-ev').innerHTML = ''; $('#g-msg').hidden = true; $('#g-port').innerHTML = ''; $('#g-att').innerHTML = '';
    state.guardRes = null;
    const L = state.last, vp = validPorts(); if (!L || !vp.length) { drawGuard(); return; }
    const G = state.guard;
    if (G.pi == null || !vp.find(p => p.i === G.pi)) G.pi = vp[0].i;
    const x = vp.find(p => p.i === G.pi);
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === G.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#g-port').appendChild(b); }
    if (!G.att) G.att = new Set(x.info.tickers.filter(t => !isDefensive(t)));
    for (const t of x.info.tickers) { const b = el('button', 'chip tchip2'); b.type = 'button'; b.dataset.t = t; b.setAttribute('aria-pressed', G.att.has(t) ? 'true' : 'false'); b.textContent = t; b.title = `${DATA.assets[t].c} — 누르면 공격/수비를 바꿔요`; $('#g-att').appendChild(b); }
    const msg = t => { $('#g-msg').hidden = false; $('#g-msg').textContent = t; drawGuard(); };
    if (!G.att.size) return msg('줄일 공격 종목이 없어요. 위에서 줄일 종목을 하나 이상 눌러 주세요.');
    if (x.info.tickers.every(t => G.att.has(t)) && !(G.def)) return msg('옮길 곳을 골라 주세요.');
    const [ds] = BT.avail(G.def, state.ext ? 'ext' : 'etf');
    if (ds > L.s) return msg(`${G.def} 데이터가 ${BT.label(ds)}부터라 분석 시작(${BT.label(L.s)})보다 늦어요. 옮길 곳을 BIL로 바꾸거나 기간을 줄여 주세요.`);
    const baseRes = BT.backtest(x.info.tickers, x.info.weights, L.s, L.e, state.rebal, L.adj), base = BT.stats(baseRes);
    const gRes = guardRun(x, G, G.trig, G.back), gst = BT.stats(gRes);
    const pb = predOf(baseRes, L.s), pg = predOf(gRes, L.s);
    let inDef = 0; for (let t = 1; t <= gRes.n; t++) if (gRes.lv[t] > 0) inDef++;
    state.guardRes = { x, base: baseRes, g: gRes, st: base, gst };
    // KPI pairs
    const pair = (k, a, b, fmt, better, sub) => {
      const d = el('div', 'gk'); const dv = b - a, good = better === 'up' ? dv > 1e-9 : dv < -1e-9, bad = better === 'up' ? dv < -1e-9 : dv > 1e-9;
      d.append(el('span', 'gk-k', k));
      const vv = el('div', 'gk-v'); vv.append(el('i', null, fmt(a)), el('em', null, '→'), el('b', null, fmt(b))); d.appendChild(vv);
      d.appendChild(el('span', 'gk-d ' + (good ? 'up' : bad ? 'dn' : ''), sub(dv)));
      host.appendChild(d);
    };
    pair('CAGR', base.cagr, gst.cagr, v => pct(v, 1), 'up', dv => ppTxt(dv));
    pair('MDD', base.mdd, gst.mdd, v => mpct1(v), 'up', dv => (dv > 0 ? `${(dv * 100).toFixed(1)}%p 얕아짐` : dv < 0 ? `${(-dv * 100).toFixed(1)}%p 깊어짐` : '같음'));
    pair('최장 회복', base.uw.months, gst.uw.months, v => (v ? dur(v) : '없음'), 'down', dv => (dv < 0 ? `${dur(-dv)} 짧아짐` : dv > 0 ? `${dur(dv)} 길어짐` : '같음'));
    pair('예측 가능성', pb.score == null ? 0 : pb.score, pg.score == null ? 0 : pg.score, v => String(Math.round(v)), 'up', dv => (Math.abs(dv) < 0.5 ? '같음' : (dv > 0 ? '+' : '−') + Math.abs(Math.round(dv)) + '점'));
    $('#g-line').textContent = `${x.name} · ${BT.label(L.s)}~${BT.label(L.e)} · 수비로 바꾼 횟수 ${gRes.ev.filter(e => e.type === 'cut').length}번 · 수비 상태였던 기간 ${pct(inDef / gRes.n, 0)} · 리밸런싱 ${REBAL_TXT[state.rebal]} · 분배금 재투자 기준`;
    // sensitivity grid: every trigger × every way back
    const t = el('table', 'ggrid'), th = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '발동 ↓ / 되돌리기 →'));
    for (const [k, n2] of G_BACKS) hr.appendChild(el('th', k === G.back ? 'cur' : null, n2));
    th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    const cell = (tr, trig, back) => {
      const st = BT.stats(guardRun(x, G, trig, back)), dm = st.mdd - base.mdd, dc = st.cagr - base.cagr;
      const td = el('td'); td.dataset.tr = String(trig); if (back) td.dataset.bk = back;
      if ((G.trig === trig) && (trig === 'sma' || G.back === back)) td.classList.add('sel');
      td.style.setProperty('--g', String(Math.max(0, Math.min(1, dm / 0.15))));
      
      td.append(el('b', null, dm > 0.0005 ? `MDD +${(dm * 100).toFixed(1)}` : dm < -0.0005 ? `MDD −${(-dm * 100).toFixed(1)}` : 'MDD 같음'), el('span', dc < -0.005 ? 'neg' : dc > 0.0005 ? 'pos' : null, `CAGR ${ppTxt(dc)}`));
      td.title = `${trig === 'sma' ? '추세 이탈' : '−' + Math.round(trig * 100) + '%'}에 줄이고 ${back ? G_BACKS.find(b => b[0] === back)[1] : '추세 회복'}에 되돌리기 · CAGR ${pct(st.cagr, 2)} · MDD ${mpct1(st.mdd)} · 최장 회복 ${st.uw.months ? dur(st.uw.months) : '없음'} — 눌러서 이 규칙으로 보기`;
      tr.appendChild(td);
    };
    for (const tg of G_TRIGS) { const tr = el('tr'); tr.appendChild(el('th', G.trig === tg ? 'cur' : null, `−${Math.round(tg * 100)}%`)); for (const [k] of G_BACKS) cell(tr, tg, k); tb.appendChild(tr); }
    { const tr = el('tr'); tr.appendChild(el('th', G.trig === 'sma' ? 'cur' : null, '추세 이탈')); cell(tr, 'sma', null); tr.lastChild.colSpan = G_BACKS.length; tb.appendChild(tr); }
    t.appendChild(tb); $('#g-grid').appendChild(t);
    // event list
    const ev = gRes.ev; if (ev.length) {
      const et = el('table', 'gev'), eh = el('thead'), er = el('tr'); ['언제', '무엇을', '그때 낙폭'].forEach(s => er.appendChild(el('th', null, s))); eh.appendChild(er); et.appendChild(eh);
      const eb = el('tbody');
      for (const e of ev) { const tr = el('tr'); tr.appendChild(el('th', null, BT.label(L.s + e.t))); tr.appendChild(el('td', e.type === 'cut' ? 'neg' : 'pos', e.type === 'cut' ? `수비로 (공격 −${Math.round(G.cut * 100)}%)` : (G.stage > 1 ? `되돌리기 시작 (${G.stage}개월에 나눠)` : '원래 비중으로'))); tr.appendChild(el('td', null, mpct1(e.dd))); eb.appendChild(tr); }
      et.appendChild(eb); $('#g-ev').appendChild(et);
    } else $('#g-ev').appendChild(el('p', 'small muted', '분석 기간에 규칙이 한 번도 발동하지 않았어요.'));
    drawGuard();
  }
  /* value (log) of both, shaded while defending, and the drawdown underneath */
  function drawGuard() {
    const host = $('#c-guard'); if (!host) return; host.innerHTML = ''; $('#lg-guard').innerHTML = '';
    const R = state.guardRes; if (!R || !isShown(host)) return;
    const L = state.last, n = R.g.n, W = Math.max(280, host.clientWidth || 600), H1 = W < 520 ? 200 : 240, H2 = W < 520 ? 110 : 130, gap = 16, m = { l: 46, r: 10, t: 8, b: 22 };
    const H = m.t + H1 + gap + H2 + m.b, iw = W - m.l - m.r;
    legend($('#lg-guard'), [{ name: '그대로 보유', color: 'var(--bench)', bench: true }, { name: '방어 규칙 적용', color: 'var(--p3)' }, { name: '수비 상태', color: 'color-mix(in srgb, var(--p3) 30%, transparent)' }], true);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '방어 규칙 적용 전후의 자산 성장과 낙폭' }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    const X = t => m.l + t / n * iw;
    // shading
    let st = -1; for (let t = 1; t <= n + 1; t++) { const on = t <= n && R.g.lv[t] > 0; if (on && st < 0) st = t; if (!on && st >= 0) { const sh = svg('rect', { x: X(st - 1), y: m.t, width: Math.max(1, X(t - 1) - X(st - 1)), height: H1 + gap + H2 }, root); sh.style.fill = 'var(--p3)'; sh.style.opacity = '0.13'; st = -1; } }
    // top: log value
    let lo = Infinity, hi = -Infinity; for (const a of [R.base.vals, R.g.vals]) for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const a0 = Math.log(lo * 0.95), a1 = Math.log(hi * 1.05), Y1 = v => m.t + H1 - (Math.log(v) - a0) / (a1 - a0) * H1;
    for (const v of logTicks(lo * 0.95, hi * 1.05)) { const y = Y1(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = fmtMoneyShort(v * state.initial); }
    // bottom: drawdown
    const d0 = BT.drawdowns(R.base.vals), d1 = BT.drawdowns(R.g.vals); let dmin = 0; for (const a of [d0, d1]) for (const v of a) dmin = Math.min(dmin, v);
    const top2 = m.t + H1 + gap, Y2 = v => top2 + (v / (dmin * 1.05 || -0.01)) * H2;
    for (const v of linTicks(dmin * 1.05, 0, 3)) { const y = Y2(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(0) + '%'; }
    const lab = svg('text', { x: m.l + 4, y: top2 + 11 }, ax); lab.textContent = '고점 대비 낙폭';
    const years = []; for (let t = 0; t <= n; t++) { const [y, mo] = BT.ym(L.s + t); if (mo === 1) years.push([t, y]); }
    const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(iw / 56))));
    years.forEach(([t, y], i) => { if (i % every) return; svg('text', { x: X(t), y: H - 6, 'text-anchor': 'middle' }, ax).textContent = y; });
    const path = (vals, Y, color, dash, wdt) => { let d = ''; for (let t = 0; t < vals.length; t++) d += (t ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(vals[t]).toFixed(1); const p = svg('path', { d, fill: 'none', 'stroke-width': wdt, 'stroke-linejoin': 'round' }, root); p.style.stroke = color; if (dash) p.setAttribute('stroke-dasharray', '5 4'); };
    path(R.base.vals, Y1, 'var(--bench)', true, 1.5); path(R.g.vals, Y1, 'var(--p3)', false, 2);
    path(d0, Y2, 'var(--bench)', true, 1.2); path(d1, Y2, 'var(--p3)', false, 1.6);
  }
