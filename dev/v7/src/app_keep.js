  /* ======================================================================================================
     v7.1 (new app): ETF descriptions (one dialog, opened from any ticker) and one mix kept for every horizon
     ====================================================================================================== */
  let etfReturn = null;
  function openEtf(t) {
    const a = DATA.assets[t]; if (!a) return;
    const I = ETF_INFO[t];
    $('#etf-t').textContent = t; $('#etf-c').textContent = a.c || ''; $('#etf-n').textContent = a.n || '';
    const body = $('#etf-body'); body.innerHTML = '';
    body.appendChild(el('p', 'etf-d', I ? I[2] : a.custom ? 'CSV로 직접 추가한 데이터예요. 이 앱에 설명이 없어요.' : ''));
    const dl = el('dl', 'etf-facts');
    const fact = (k, v) => { const d = el('div'); d.append(el('dt', null, k), el('dd', null, v)); dl.appendChild(d); };
    if (I) { fact('운용사', I[0]); fact('따라가는 지수·전략', I[1]); }
    if (a.inc) fact('상장일', a.inc.replace(/-/g, '.'));
    if (a.fee != null) fact('총보수 (연)', `${+a.fee.toFixed(4)}% · ${DATA.built || ''} 기준`);
    const fam = a.tw || t;
    const twins = Object.keys(DATA.assets).filter(x => x !== t && (DATA.assets[x].tw || x) === fam);
    if (twins.length) fact('같은 지수 ETF', twins.join(' · '));
    const [s0, e0] = BT.avail(t, 'ext'), s1 = BT.avail(t, 'etf')[0];
    fact('이 앱의 데이터', s1 > s0 ? `${BT.label(s0)}~${BT.label(e0)} · ${BT.label(s1)} 이전은 ${a.x || '대용 지수·시뮬레이션'}` : `${BT.label(s0)}~${BT.label(e0)}`);
    body.appendChild(dl);
    if (I && I[3]) { const n = el('p', 'etf-warn'); n.append(el('b', null, '알아 둘 점'), document.createTextNode(' ' + I[3])); body.appendChild(n); }
    // the app's own numbers for this ETF alone, in the unit the results use (actual data, distributions reinvested)
    const s = state.ext ? s0 : s1, e = e0;
    if (e - s >= 11) {
      const st = BT.stats(BT.backtest([t], [1], s, e, 'N'));
      const tr = BT.trailing([t], [1], s, e, 'N', [10, 20, 30]);
      const sec = el('div', 'etf-num');
      sec.appendChild(el('h3', null, '이 앱의 데이터로 본 성과'));
      sec.appendChild(el('p', 'small muted', `${state.cur === 'KRW' ? '원화' : '달러'} 기준${state.real ? ' · 물가 반영' : ''} · 분배금 재투자 · 월말 기준${state.ext && s1 > s0 ? ' · 상장 이전 대용 데이터 포함' : ''}`));
      const tb = el('table', 'etf-tbl'), th = el('thead'), hr = el('tr');
      ['구간', 'CAGR', 'MDD'].forEach(x => hr.appendChild(el('th', null, x))); th.appendChild(hr); tb.appendChild(th);
      const body2 = el('tbody');
      const row = (lab, sub, c, m) => { const r = el('tr'); const h = el('th', null, lab); if (sub) h.appendChild(el('span', 'sub', sub)); r.append(h, el('td', c < 0 ? 'neg' : null, pct(c, 1)), el('td', m < 0 ? 'neg' : null, mpct1(m))); body2.appendChild(r); };
      row('데이터 전체', `${BT.label(s)}~${BT.label(e)}`, st.cagr, st.mdd);
      for (const x of tr) if (x.ok) row(`최근 ${x.years}년`, `${x.start}~${x.end}`, x.cagr, x.mdd);
      tb.appendChild(body2); const w = el('div', 'tbl-wrap'); w.appendChild(tb); sec.appendChild(w);
      const more = [`변동성(연) ${pct(st.stdev, 1)}`];
      if (st.best) more.push(`최고의 해 ${st.best.year}년 ${spct(st.best.ret, 1)}`);
      if (st.worst) more.push(`최악의 해 ${st.worst.year}년 ${spct(st.worst.ret, 1)}`);
      if (BT.hasIncome(t)) { const sd = BT.stats(BT.backtest([t], [1], Math.max(s, e - 11), e, 'N', false, true)); if (sd.income && sd.income.ttmYield != null) more.push(`최근 1년 분배율 ${pct(sd.income.ttmYield, 1)}`); }
      sec.appendChild(el('p', 'small etf-more', more.join(' · ')));
      body.appendChild(sec);
    }
    const add = $('#etf-add'); add.innerHTML = '';
    add.appendChild(el('span', 'small muted', '포트폴리오에 넣기'));
    state.ports.forEach((p, pi) => {
      const b = el('button', 'btn ghost sm', `${pi + 1}. ${(p.name.trim() || `포트폴리오 ${pi + 1}`).slice(0, 16)}`); b.type = 'button';
      b.addEventListener('click', () => {
        let ri = p.rows.findIndex(r => r.t.trim().toUpperCase() === t);
        if (ri >= 0) { closeEtf(); toast(`${t}는 이미 포트폴리오 ${pi + 1}에 있어요.`); return; }
        ri = p.rows.findIndex(r => !r.t.trim());
        if (ri >= 0) p.rows[ri].t = t; else { p.rows.push({ t, w: '' }); ri = p.rows.length - 1; }
        closeEtf(); state.portCur = pi; renderPorts(); schedule(true);
        goTo('h-ports');
        setTimeout(() => { const i = document.getElementById(`wt-${pi}-${ri}`); if (i) i.focus({ preventScroll: true }); }, 400);
        toast(`${t}를 포트폴리오 ${pi + 1}에 넣었어요. 비중을 넣어 합계를 100%로 맞추세요.`);
      });
      add.appendChild(b);
    });
    etfReturn = document.activeElement;
    $('#etf-dlg').hidden = false; document.documentElement.classList.add('dlg-open');
    $('#etf-box').scrollTop = 0; $('#etf-x').focus({ preventScroll: true });
  }
  function closeEtf() {
    if ($('#etf-dlg').hidden) return;
    $('#etf-dlg').hidden = true; document.documentElement.classList.remove('dlg-open');
    if (etfReturn && etfReturn.isConnected) { try { etfReturn.focus({ preventScroll: true }); } catch (_) {} }
  }
  document.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { closeEtf(); return; }
    const b = e.target.closest('[data-etf]'); if (b) { e.preventDefault(); openEtf(b.dataset.etf); }
  });
  document.addEventListener('keydown', e => {
    if ($('#etf-dlg').hidden) return;
    if (e.key === 'Escape') { closeEtf(); return; }
    if (e.key === 'Tab') {   // keep focus inside the dialog
      const f = [...$('#etf-box').querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])')].filter(x => !x.disabled);
      if (!f.length) return; const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  const etfBtn = (t, cls) => { const b = el('button', cls || 'etf-link', t); b.type = 'button'; b.dataset.etf = t; b.title = `${DATA.assets[t] ? DATA.assets[t].n : t} — 눌러서 설명 보기`; return b; };

  /* ---------- one mix kept unchanged for every horizon ---------- */
  state.keepC = 'ai'; state.keepLife = null;
  function keepWins(o) {
    return optWindows(o.s, o.end).filter(w => w.i0 >= 0 && !w.reason)
      .map(w => ({ id: w.id, i0: w.i0, i1: w.i1, pos: w.pos, years: w.years, name: `${POS_TXT[w.pos]} ${w.years}년` }));
  }
  const keepAllName = o => `전체 ${monthsTxt(o.end - o.s + 1)}`;
  function keepWinName(id) { const o = state.opt; if (!o || !o.keep) return ''; if (id === 'all') return keepAllName(o); const w = o.keep.wins.find(x => x.id === id); return w ? w.name : id; }
  async function runKeep() {
    const o = state.opt; if (!o) return;
    const st = $('#o-keep-status');
    st.textContent = `분석 기간 전체(${BT.label(o.s)}~${BT.label(o.end)})로 비중 조합을 계산하는 중…`;
    let P;
    try {
      P = await BT.keepPlan({ tickers: o.tickers, rule: o.rule, mode: o.mode, step: o.step, maxW: o.maxW, crits: currentCrits(), i0: o.s, i1: o.end },
        f => { st.textContent = `분석 기간 전체로 비중 조합을 계산하는 중… ${Math.round(f * 100)}%`; });
    } catch (err) { st.textContent = '장기 유지 추천 계산 중 문제가 생겼어요: ' + err.message; return; }
    if (state.opt !== o) return;
    o.keep = { P, wins: keepWins(o) };
    await new Promise(r => setTimeout(r, 0));
    keepPickAll(); renderKeep();
  }
  function keepPickAll() {
    const o = state.opt, K = o && o.keep; if (!K) return;
    if (!K.P.ok) { K.picks = null; return; }
    const crits = currentCrits();
    K.fix = null;
    K.picks = withUnit(!!o.real, () => {
      const R = BT.keepPick(K.P, K.wins, crits);
      const out = { own: {} };
      for (const c of crits) {
        const r = R[c.id]; if (!r) { out[c.id] = null; continue; }
        const p = BT.optPoint(K.P, r.i);
        const tk = p.w.map(x => x[0]), ws = p.w.map(x => x[1]);
        const full = BT.backtest(tk, ws, o.s, o.end, o.rule, false);
        const st = BT.stats(full), stDiv = BT.stats(BT.backtest(tk, ws, o.s, o.end, o.rule, false, true));
        const per = K.wins.map(w => ({ w, st: BT.stats(BT.backtest(tk, ws, w.i0, w.i1, o.rule, false)) }));
        out[c.id] = Object.assign(p, { feasible: r.feasible, pool: r.pool, of: r.of, wS: r.wS, wC: r.wC, st, stDiv, per, roll: BT.rolling(full, [10])[0], crit: c });
        const s = BT.optSelect(K.P, c); if (s) out.own[c.id] = BT.optPoint(K.P, s.i);   // the best mix for the whole period alone
      }
      return out;
    }, o.cur);
    K.P.picks = {}; for (const c of crits) K.P.picks[c.id] = makePick(K.P, c);   // the whole period's own best mixes (frontier chart)
    keepFixAll();
  }
  const wText = w => w.map(([t, x]) => `${t} ${fmtW(x)}`).join(' · ');
  function worstOf(pk) { let m = { c: pk.st.cagr, id: 'all' }; for (const q of pk.per) if (q.st.cagr < m.c) m = { c: q.st.cagr, id: q.w.id }; return m; }
  function keepCard(pk, title, color, note) {
    const o = state.opt, box = el('div', 'pick');
    const hd = el('div', 'pick-head'); const mk = el('span', 'pick-mark'); mk.style.background = color; hd.append(mk, el('h3', null, title)); box.appendChild(hd);
    if (!pk) { box.appendChild(el('p', 'empty', '조합이 없어요.')); return box; }
    if (!pk.feasible) box.appendChild(el('p', 'badge warn', '전체 기간에 조건을 만족하는 조합이 없어 가장 가까운 조합을 보여줘요'));
    const wo = worstOf(pk);
    box.appendChild(el('p', 'crit', note ? note : pk.crit.kind === 'ai'
      ? `전체 기간과 모든 10·20·30년 구간 중 샤프 비율이 가장 낮았던 구간에서도 가장 좋았던 조합 (그 구간: ${keepWinName(pk.wS)})`
      : `전체 기간 MDD가 기준 안인 조합 중, 가장 나빴던 구간의 CAGR이 가장 높은 조합 (그 구간: ${keepWinName(pk.wC)})`));
    const kp = el('div', 'kpis k4');
    kpi(kp, `전체 CAGR`, pct(pk.st.cagr), monthsTxt(o.end - o.s + 1));
    kpi(kp, 'MDD', mpct(pk.st.mdd), pk.st.mddInfo.mdd < 0 ? `${pk.st.mddInfo.peakLabel}→${pk.st.mddInfo.troughLabel}` : null);
    kpi(kp, '가장 나쁜 구간 CAGR', pct(wo.c), keepWinName(wo.id));
    kpi(kp, '아무 10년 최저 CAGR', pk.roll && pk.roll.ok ? pct(pk.roll.min) : '–', pk.roll && pk.roll.ok ? `중앙값 ${pct(pk.roll.median)}` : '분석 기간이 10년 미만');
    box.appendChild(kp);
    const dl = divLine(pk.stDiv); if (dl) box.appendChild(dl);
    box.appendChild(wbars(pk.w, color));
    box.appendChild(applyRow(pk.w, `${title} · ${BT.label(o.s)}~${BT.label(o.end)}`, snapOf({ i0: o.s, i1: o.end, adjMap: null }, pk.st, pk.stDiv)));
    return box;
  }
  function renderKeep() {
    const host = $('#o-keep'), st = $('#o-keep-status'); if (!host) return;
    host.innerHTML = ''; ['#t-keep', '#t-keep-w', '#t-keep-life'].forEach(id => { $(id).innerHTML = ''; }); $('#keep-life-pick').innerHTML = '';
    $('#keep-more').hidden = true;
    renderFix(); renderFrontTabs();
    const o = state.opt;
    if (!o) { st.textContent = '위 ‘최적 비중 찾기’를 실행하면 이어서 계산해요.'; return; }
    const K = o.keep;
    if (!K) { st.textContent = '최근·가장 과거 구간 계산이 끝나면 이어서 계산해요.'; return; }
    const P = K.P;
    if (!P.ok) { st.textContent = `분석 기간 전체로는 계산할 수 없어요: ${P.reason}`; return; }
    st.textContent = `${BT.label(o.s)}~${BT.label(o.end)} (${monthsTxt(o.end - o.s + 1)}) 전체 데이터가 있는 자산 ${P.K}개 · ${P.evaluated.toLocaleString('ko-KR')}개 조합 (${modeTxt(P)}) · 비교한 구간: ${K.wins.map(w => w.name).join(', ') || '없음'}` +
      (P.excluded.length ? ` · 분석 기간 전체 데이터가 없어 제외: ${listShort(P.excluded.map(x => x.t), 6)}` : '') + (o.real ? ' · 물가 반영' : '') + (o.cur === 'KRW' ? ' · 원화 기준' : '');
    if (!K.picks) return;
    const lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    host.appendChild(keepCard(K.picks.ai, 'AI 유지형', 'var(--p1)'));
    host.appendChild(keepCard(K.picks.user, `내 기준 유지형 · MDD ${lo}~${hi}%`, 'var(--p2)'));
    $('#keep-more').hidden = false;
    document.querySelectorAll('#o-keep-c button').forEach(b => b.setAttribute('aria-pressed', b.dataset.c === state.keepC ? 'true' : 'false'));
    renderKeepTable(); renderKeepWeights(); renderKeepLife();
  }
  /* the kept mix in each window vs the mix picked for that window alone */
  function renderKeepTable() {
    const o = state.opt, K = o.keep, c = state.keepC, pk = K.picks[c], t = $('#t-keep'); t.innerHTML = '';
    if (!pk) return;
    const th = el('thead'), hr = el('tr');
    ['구간', '유지형 CAGR', '유지형 MDD', '그 구간만의 최적 CAGR', '그 구간만의 최적 MDD', 'CAGR 차이', '같은 비중'].forEach(x => hr.appendChild(el('th', null, x))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    const row = (name, when, ks, own, hl) => {
      const tr = el('tr', hl ? 'hl' : null); const h = el('th', null, name); h.appendChild(el('span', 'sub', when)); tr.appendChild(h);
      const td = (v, neg, sub) => { const c2 = el('td', neg ? 'neg' : null, v); if (sub) c2.appendChild(el('span', 'sub', sub)); tr.appendChild(c2); };
      td(pct(ks.cagr, 1), ks.cagr < 0); td(mpct1(ks.mdd), ks.mdd < 0);
      if (own) {
        td(pct(own.cagr, 1), own.cagr < 0, wText(own.w)); td(mpct1(own.mdd), own.mdd < 0);
        const d = ks.cagr - own.cagr; td(ppTxt(d), d < -0.0005); td(fmtW(overlapW(pk.w, own.w)));
      } else { td('–'); td('–'); td('–'); td('–'); }
      tb.appendChild(tr);
    };
    const ownFull = K.picks.own[c];
    row(keepAllName(o), `${BT.label(o.s)}–${BT.label(o.end)}`, pk.st, ownFull ? { cagr: ownFull.cagr, mdd: ownFull.mdd, w: ownFull.w } : null, true);
    for (const q of pk.per) {
      const H = planOf(o.res, q.w.pos, q.w.years), op = H && H.ok && H.picks ? H.picks[c] : null;
      row(q.w.name, `${BT.label(q.w.i0)}–${BT.label(q.w.i1)}`, q.st, op ? { cagr: op.st.cagr, mdd: op.st.mdd, w: op.w } : null);
    }
    t.appendChild(tb);
  }
  /* which tickers and weights each window picked, next to the kept mix */
  function renderKeepWeights() {
    const o = state.opt, K = o.keep, c = state.keepC, pk = K.picks[c], t = $('#t-keep-w'); t.innerHTML = '';
    if (!pk) return;
    const cols = [];
    for (const w of K.wins) { const H = planOf(o.res, w.pos, w.years), op = H && H.ok && H.picks ? H.picks[c] : null; cols.push({ name: w.name, w: op ? op.w : null }); }
    const own = K.picks.own[c]; cols.push({ name: `${keepAllName(o)}만의 최적`, w: own ? own.w : null });
    const keepCol = { name: '유지형', w: pk.w, keep: true };
    const all = new Map();
    const wm = list => { const m = new Map(); if (list) for (const [tk, x] of list) m.set(tk, x); return m; };
    const maps = cols.map(cl => wm(cl.w)), km = wm(pk.w);
    for (const m of maps.concat([km])) for (const tk of m.keys()) all.set(tk, 1);
    const count = tk => maps.reduce((a, m) => a + ((m.get(tk) || 0) > 0 ? 1 : 0), 0);
    const tks = [...all.keys()].sort((a, b) => (km.get(b) || 0) - (km.get(a) || 0) || count(b) - count(a) || (a < b ? -1 : 1));
    const th = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '종목'));
    for (const cl of cols) hr.appendChild(el('th', null, cl.name));
    hr.appendChild(el('th', 'keepcol', keepCol.name)); hr.appendChild(el('th', null, '뽑힌 구간'));
    th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    const nCols = cols.filter(cl => cl.w).length;
    for (const tk of tks) {
      const tr = el('tr'); const h = el('th'); h.appendChild(etfBtn(tk)); tr.appendChild(h);
      maps.forEach(m => { const x = m.get(tk) || 0; tr.appendChild(el('td', x > 0 ? 'wcell on' : 'wcell', x > 0 ? fmtW(x) : '·')); });
      const kx = km.get(tk) || 0; tr.appendChild(el('td', 'wcell keepcol' + (kx > 0 ? ' on' : ''), kx > 0 ? fmtW(kx) : '·'));
      const n = count(tk); tr.appendChild(el('td', null, `${n}/${nCols}`));
      tb.appendChild(tr);
    }
    const tr = el('tr', 'hl'); tr.appendChild(el('th', null, '유지형과 같은 비중'));
    cols.forEach(cl => tr.appendChild(el('td', null, cl.w ? fmtW(overlapW(pk.w, cl.w)) : '–')));
    tr.appendChild(el('td', 'keepcol', '100%')); tr.appendChild(el('td', null, ''));
    tb.appendChild(tr);
    t.appendChild(tb);
  }
  /* life stages: the same limits, one mix for every window */
  function renderKeepLife() {
    const o = state.opt, K = o.keep, t = $('#t-keep-life'); t.innerHTML = '';
    const th = el('thead'), hr = el('tr');
    ['단계', '기준', '유지형 비중', '전체 CAGR', '전체 MDD', '가장 나쁜 구간 CAGR', '목표 CAGR'].forEach(x => hr.appendChild(el('th', null, x))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const s of state.stages) {
      const pk = K.picks[s.id]; const tr = el('tr', 'life-row' + (state.keepLife === s.id ? ' sel' : '')); tr.dataset.id = s.id; tr.tabIndex = 0;
      tr.setAttribute('role', 'button'); tr.setAttribute('aria-label', `${s.name} 유지형 비중 보기`);
      const h = el('th'); h.append(el('b', null, s.name), el('span', 'sub', s.role)); tr.appendChild(h);
      tr.appendChild(el('td', 'twrap', `MDD ${s.mdd}% 이하 · 회복 ${s.uw}년 이내`));
      if (!pk) { tr.appendChild(el('td', null, '–')); tb.appendChild(tr); continue; }
      const wc = el('td', 'twrap wtxt', wText(pk.w)); if (!pk.feasible) wc.appendChild(el('span', 'sub', '기준을 만족하는 조합이 없어 가장 가까운 조합')); tr.appendChild(wc);
      tr.appendChild(el('td', pk.st.cagr < 0 ? 'neg' : null, pct(pk.st.cagr, 1)));
      tr.appendChild(el('td', 'neg', mpct1(pk.st.mdd)));
      const wo = worstOf(pk); const wd = el('td', wo.c < 0 ? 'neg' : null, pct(wo.c, 1)); wd.appendChild(el('span', 'sub', keepWinName(wo.id))); tr.appendChild(wd);
      const goal = s.cagr / 100;
      tr.appendChild(el('td', wo.c >= goal ? 'ok' : pk.st.cagr >= goal ? null : 'neg', wo.c >= goal ? `${s.cagr}% · 모든 구간 달성` : pk.st.cagr >= goal ? `${s.cagr}% · 전체 기간만 달성` : `${s.cagr}% · 미달`));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    const box = $('#keep-life-pick'); box.innerHTML = '';
    const sel = state.stages.find(s => s.id === state.keepLife); const pk = sel && K.picks[sel.id];
    if (pk) box.appendChild(keepCard(pk, `${sel.name} 유지형 · MDD ${sel.mdd}% 이하`, 'var(--p3)'));
  }
  $('#t-keep-life').addEventListener('click', e => { const r = e.target.closest('tr.life-row'); if (!r) return; state.keepLife = state.keepLife === r.dataset.id ? null : r.dataset.id; renderKeepLife(); });
  $('#t-keep-life').addEventListener('keydown', e => { if (e.key !== 'Enter' && e.key !== ' ') return; const r = e.target.closest('tr.life-row'); if (!r) return; e.preventDefault(); state.keepLife = state.keepLife === r.dataset.id ? null : r.dataset.id; renderKeepLife(); });
  $('#o-keep-c').addEventListener('click', e => { const b = e.target.closest('button[data-c]'); if (!b) return; state.keepC = b.dataset.c; renderKeep(); });
