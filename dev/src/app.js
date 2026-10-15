(function () {
  'use strict';
  const DATA = JSON.parse(document.getElementById('etf-data').textContent);
  const NM = BT.init(DATA);
  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs || {}) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  const PCOL = ['var(--p1)', 'var(--p2)', 'var(--p3)'];
  const BCOL = 'var(--bench)';
  const YEARS = [10, 15, 20, 25, 30];
  const HZ = [10, 20, 30];
  const STAGES = [
    { id: 's30', name: '30대', role: '적극 성장', mdd: 40, uw: 7, cagr: 9, desc: '은퇴까지 25년 이상 남아 큰 하락도 시간과 꾸준한 추가 납입으로 메울 수 있는 시기' },
    { id: 's40', name: '40대', role: '성장', mdd: 30, uw: 5, cagr: 8, desc: '자산이 커져 같은 낙폭도 금액 부담이 커지고 교육·주거 같은 큰 지출이 생기는 시기' },
    { id: 's50', name: '50대', role: '균형', mdd: 20, uw: 4, cagr: 7, desc: '은퇴 직전의 큰 손실은 회복할 시간이 부족해 낙폭을 20% 안쪽으로 관리하는 시기' },
    { id: 's60', name: '은퇴 이후', role: '안정 · 인출', mdd: 15, uw: 3, cagr: 5, desc: '돈을 빼 쓰는 중에 하락이 겹치면 원금이 빠르게 줄어 낙폭과 회복 기간을 짧게 잡는 시기' }
  ];
  const REBAL_TXT = { A: '매년', S: '반기', Q: '분기', M: '매월', B: '밴드', N: '안 함' };
  const DIV_TXT = { idx: 'S&P 500 지수 배당', pay: '실제 분배금 내역', lazy: '연도별 실제 분배율', mdl: '추정', cash: '수익 전부 분배(현금성)', zero: '분배 없음', csv: 'CSV 종가·수정종가 차이', none: '배당 데이터 없음(0으로 계산)' };
  const SEG_TXT = { A: '실제 월간 수익률', X: '같은 지수 ETF 데이터(보수 차 반영)', B: 'ETF 연수익률에 맞춘 월간 추정', S: '상장 초기 대용 지수', P: '상장 이전 확장(대용·시뮬레이션)', U: '사용자 데이터' };
  const GROUPS = [
    ['미국 주식', ['SPY', 'VOO', 'IVV', 'SPLG', 'VTI', 'QQQ', 'QQQM', 'DIA', 'IWM', 'SCHD', 'VIG', 'VYM', 'VUG', 'VTV', 'SCHG', 'JEPI', 'JEPQ']],
    ['섹터 · 테마', ['XLK', 'XLE', 'XLF', 'XLV', 'SOXX', 'SMH', 'ARKK']],
    ['레버리지 (3배)', ['UPRO', 'TQQQ', 'SOXL']],
    ['해외 주식', ['VT', 'VXUS', 'EFA', 'VEA', 'EEM', 'VWO', 'EWY']],
    ['채권 · 현금', ['TLT', 'IEF', 'SHY', 'BIL', 'SGOV', 'AGG', 'BND', 'LQD', 'HYG', 'TIP']],
    ['실물 자산 · 리츠', ['GLD', 'IAU', 'GLDM', 'SLV', 'DBC', 'VNQ']]
  ];
  const PRESETS = [
    { n: '60/40 (SPY·IEF)', r: [['SPY', 60], ['IEF', 40]] },
    { n: '영구 포트폴리오', r: [['SPY', 25], ['TLT', 25], ['GLD', 25], ['BIL', 25]] },
    { n: '나스닥·장기채·금', r: [['QQQ', 40], ['TLT', 30], ['GLD', 30]] },
    { n: '올웨더 (근사)', r: [['VTI', 30], ['TLT', 40], ['IEF', 15], ['GLD', 7.5], ['DBC', 7.5]] },
    { n: '3펀드 (미국·해외·채권)', r: [['VTI', 50], ['VXUS', 30], ['BND', 20]] },
    { n: '배당주 + 중기채', r: [['SCHD', 60], ['IEF', 40]] },
    { n: '골든 버터플라이 (근사)', r: [['VTI', 20], ['IWM', 20], ['TLT', 20], ['SHY', 20], ['GLD', 20]] },
    { n: '나스닥 3배 + 헤지', r: [['TQQQ', 30], ['TLT', 40], ['GLD', 30]] },
    { n: 'S&P 500 100%', r: [['SPY', 100]] },
    { n: '나스닥100 100%', r: [['QQQ', 100]] }
  ];
  const state = {
    start: null, end: null, rebal: 'A', initial: 10000, ext: true, bench: 'SPY', log: true,
    ports: [
      { name: '60/40 (SPY·IEF)', rows: [['SPY', 60], ['IEF', 40]] },
      { name: '영구 포트폴리오', rows: [['SPY', 25], ['TLT', 25], ['GLD', 25], ['BIL', 25]] },
      { name: '나스닥·장기채·금', rows: [['QQQ', 40], ['TLT', 30], ['GLD', 30]] }
    ].map(p => ({ name: p.name, rows: p.rows.map(([t, w]) => ({ t, w: String(w) })) })),
    last: null, opt: null, real: false,
    optSel: new Set(), optTab: 0, lifeSel: null, stages: STAGES.map(s => Object.assign({}, s)),
    trend: { on: true, R: 36, L: 120, thr: 0.15, manual: {} }, trendInfo: null, trendAll: false, optView: 'actual',
    div: false,  // false = distributions reinvested (total return), true = paid out as cash
    optPos: 'recent',  // optimizer results shown for the most recent ('recent') or the oldest ('old') 10·20·30 years
    dataAdj: false,    // v7: run my portfolios on the trend-kept data instead of the actual data
    portCur: 0,        // v8: the portfolio card shown on a phone
    trailJ: 0,         // v8: the period shown in the phone 'recent N years' table
    optDeferred: false,
    pc: { key: null, metric: 'cagr', range: null, auto: true },  // v7: period check (portfolio, map metric, chosen window)
    ddKey: null       // v7.1: portfolio shown in the drawdown list
  };
  let optBusy = false, pickerReady = false, lifeTimer = null;

  /* ---------- formatting ---------- */
  /* percent text with a true minus sign; a value that rounds to zero gets no sign */
  const sgnTxt = (x, d, plus) => { const t = Math.abs(x * 100).toFixed(d); return (+t === 0 ? '' : x < 0 ? '−' : plus && x > 0 ? '+' : '') + t + '%'; };
  const pct = (x, d = 2) => (x == null || !isFinite(x) ? '–' : sgnTxt(x, d));
  const spct = (x, d = 1) => (x == null || !isFinite(x) ? '–' : sgnTxt(x, d, true));
  const mpct = x => (x == null || !isFinite(x) ? '–' : sgnTxt(x, 2));
  const money = x => '$' + Math.round(x).toLocaleString('en-US');
  const num = (x, d = 2) => { if (x == null || !isFinite(x)) return '–'; const t = Math.abs(x).toFixed(d); return (x < 0 && +t !== 0 ? '−' : '') + t; };
  const known = t => Object.prototype.hasOwnProperty.call(DATA.assets, t);
  const monthsTxt = n => { const y = Math.floor(n / 12), m = n % 12; return (y ? y + '년' : '') + (m ? (y ? ' ' : '') + m + '개월' : ''); };
  const dur = n => (n > 0 ? monthsTxt(n) : '0개월');
  const SAME = 0.0005;   // differences below 0.05%p show as '같음'
  const ppTxt = d => (Math.abs(d) < SAME ? '0.0%p' : (d > 0 ? '+' : '−') + Math.abs(d * 100).toFixed(1) + '%p');
  const nbsp = t => t.replace(/ /g, '\u00a0');   // keep 'label value' pieces on one line
  /* object particle after a name the user typed: 을 after a final consonant, 를 after a vowel, 을(를) when it does not end in Hangul */
  const eul = w => { const c = String(w || '').trim().slice(-1).charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3 ? ((c - 0xAC00) % 28 ? '을' : '를') : '을(를)'; };
  /* on screen: laid out and not inside a closed fold (a closed <details> may still report boxes for its content) */
  const isShown = e => !!e && e.getClientRects().length > 0 && !e.closest('details:not([open]) > :not(summary)');
  // number field with a default only when it is left empty (a typed 0 stays 0)
  const fieldNum = (sel, d) => { const v = $(sel).value.trim(); return v === '' || !isFinite(+v) ? d : +v; };

  /* ---------- static controls ---------- */
  function fillSelect(sel, items, val) { sel.innerHTML = ''; for (const [v, t] of items) { const o = el('option', null, t); o.value = v; sel.appendChild(o); } if (val != null) sel.value = val; }
  const yearItems = []; for (let y = 1972; y <= BT.ym(NM - 1)[0]; y++) yearItems.push([y, y + '년']);
  const monthItems = []; for (let m = 1; m <= 12; m++) monthItems.push([m, m + '월']);
  fillSelect($('#s-y'), yearItems); fillSelect($('#s-m'), monthItems); fillSelect($('#e-y'), yearItems); fillSelect($('#e-m'), monthItems);
  $('#span-range').textContent = '1972.01 – ' + BT.label(NM - 1);
  $('#n-assets').textContent = Object.keys(DATA.assets).length;

  function refreshTickerLists() {
    const dl = $('#tickers'); dl.innerHTML = '';
    const all = Object.keys(DATA.assets);
    for (const t of all) { const o = el('option'); o.value = t; o.label = DATA.assets[t].n; dl.appendChild(o); }
    const b = $('#bench'); const cur = state.bench;
    fillSelect(b, [['', '없음']].concat(all.map(t => [t, t + ' · ' + DATA.assets[t].c])), cur);
    const g = $('#tick-groups'); g.innerHTML = '';
    const groups = GROUPS.slice();
    const custom = all.filter(t => DATA.assets[t].custom);
    if (custom.length) groups.push(['사용자 추가', custom]);
    for (const [name, list] of groups) {
      const d = el('div'); d.appendChild(el('b', null, name));
      for (const t of list) {
        const a = DATA.assets[t]; if (!a) continue;
        const c = el('code', null, t); c.title = `${a.n} · ${a.c} · 데이터 ${BT.label(BT.avail(t, 'ext')[0])}~`;
        d.appendChild(c);
      }
      g.appendChild(d);
    }
    if (pickerReady) renderPicker();
  }
  refreshTickerLists();

  const QUICK = [['max', '최대'], [30, '30년'], [25, '25년'], [20, '20년'], [15, '15년'], [10, '10년'], [5, '5년']];
  for (const [k, t] of QUICK) {
    // the input tab has every length; the results tab repeats the common ones so the period can change where the numbers are
    for (const host of [$('#quick'), (k === 25 || k === 15) ? null : $('#quick2')]) {
      if (!host) continue;
      const b = el('button', 'chip', t); b.type = 'button'; b.dataset.q = k; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => { applyQuick(k); });
      host.appendChild(b);
    }
  }

  /* ---------- portfolios ---------- */
  function presetSelect() {
    const s = el('select', 'preset'); s.setAttribute('aria-label', '예시 포트폴리오 불러오기');
    const o0 = el('option', null, '예시 불러오기'); o0.value = ''; s.appendChild(o0);
    PRESETS.forEach((p, i) => { const o = el('option', null, p.n); o.value = i; s.appendChild(o); });
    return s;
  }
  function renderPorts() {
    const host = $('#ports'); host.innerHTML = '';
    state.ports.forEach((p, pi) => {
      const card = el('div', 'pcard' + (pi === state.portCur ? ' cur' : '')); card.dataset.p = pi;
      const top = el('div', 'pcard-top');
      const key = el('span', 'key'); key.style.background = PCOL[pi]; top.appendChild(key);
      const nm = el('input', 'pname'); nm.type = 'text'; nm.value = p.name; nm.id = 'pname-' + pi; nm.setAttribute('aria-label', `포트폴리오 ${pi + 1} 이름`); top.appendChild(nm);
      const ps = presetSelect(); ps.id = 'preset-' + pi; top.appendChild(ps);
      card.appendChild(top);
      const cols = el('div', 'pcols'); cols.append(el('span', null, '티커'), el('span', null, '비중 %'), el('span')); card.appendChild(cols);
      p.rows.forEach((r, ri) => {
        const row = el('div', 'prow'); row.dataset.r = ri;
        const tk = el('input', 'tk'); tk.type = 'text'; tk.value = r.t; tk.setAttribute('list', 'tickers'); tk.id = `tk-${pi}-${ri}`;
        tk.setAttribute('aria-label', `포트폴리오 ${pi + 1} 자산 ${ri + 1} 티커`); tk.autocomplete = 'off'; tk.spellcheck = false;
        const wt = el('input', 'wt'); wt.type = 'number'; wt.min = '0'; wt.max = '100'; wt.step = 'any'; wt.value = r.w; wt.id = `wt-${pi}-${ri}`;
        wt.setAttribute('aria-label', `포트폴리오 ${pi + 1} 자산 ${ri + 1} 비중`);
        const del = el('button', 'del', '×'); del.type = 'button'; del.setAttribute('aria-label', '자산 삭제');
        const sub = el('div', 'sub');
        row.append(tk, wt, del, sub); card.appendChild(row);
      });
      const acts = el('div', 'row');
      const add = el('button', 'btn ghost sm add', '+ 자산 추가'); add.type = 'button';
      const eq = el('button', 'btn ghost sm eq', '균등 배분'); eq.type = 'button';
      const clr = el('button', 'btn ghost sm clr', '비우기'); clr.type = 'button';
      const sv = el('button', 'btn ghost sm sv', '저장'); sv.type = 'button'; sv.title = '이 포트폴리오를 저장 목록에 추가';
      acts.append(add, eq, clr, sv); card.appendChild(acts);
      const foot = el('div', 'pfoot');
      foot.append(el('span', 'sum'), el('span', 'small muted prange'));
      card.appendChild(foot);
      host.appendChild(card);
    });
    updatePortStatus();
  }
  function portInfo(p) {
    const rows = p.rows.filter(r => r.t.trim() !== '' || r.w !== '');
    let sum = 0, errs = [], tk = [], w = [];
    const seen = new Set();
    for (const r of rows) {
      const t = r.t.trim().toUpperCase(); const x = parseFloat(r.w);
      if (!t) { errs.push('티커가 비어 있어요'); continue; }
      if (!known(t)) { errs.push(t + ' 미지원'); continue; }
      if (seen.has(t)) { errs.push(t + ' 중복'); continue; }
      seen.add(t);
      if (!isFinite(x) || x < 0) { errs.push(t + ' 비중 확인'); continue; }
      sum += x; if (x > 0) { tk.push(t); w.push(x); }
    }
    const empty = rows.length === 0;
    const ok = !empty && errs.length === 0 && Math.abs(sum - 100) < 0.01 && tk.length > 0;
    return { ok, empty, sum, errs, tickers: tk, weights: w };
  }
  function updatePortStatus() {
    document.querySelectorAll('.pcard').forEach(card => {
      const pi = +card.dataset.p; const p = state.ports[pi]; const info = portInfo(p);
      card.querySelectorAll('.prow').forEach(row => {
        const r = p.rows[+row.dataset.r]; const t = r.t.trim().toUpperCase(); const sub = row.querySelector('.sub');
        sub.classList.remove('err');
        if (!t) { sub.textContent = ''; return; }
        if (!known(t)) { sub.textContent = '지원하지 않는 티커예요. ‘도움말 › 지원 티커’에서 목록을 확인하세요.'; sub.classList.add('err'); return; }
        const a = DATA.assets[t]; const [s0] = BT.avail(t, 'ext'); const [s1] = BT.avail(t, 'etf');
        sub.textContent = state.ext && s1 > s0 ? `${a.c} · ${BT.label(s1)} 상장, 그 전(${BT.label(s0)}~)은 지수 데이터` : `${a.c} · 데이터 ${BT.label(state.ext ? s0 : s1)}~`;
        sub.title = a.n;
      });
      const sumEl = card.querySelector('.sum');
      sumEl.textContent = info.empty ? '자산 없음 (계산 제외)' : `합계 ${+info.sum.toFixed(2)}%`;
      sumEl.className = 'sum ' + (info.empty ? '' : info.ok ? 'ok' : 'bad');
      const pr = card.querySelector('.prange');
      if (info.ok) { const [s, e] = BT.commonRange(info.tickers, state.ext ? 'ext' : 'etf'); pr.textContent = `데이터 ${BT.label(s)} ~ ${BT.label(e)}`; }
      else pr.textContent = info.errs[0] || (info.empty ? '' : '비중 합계를 100%로 맞추세요');
      card.classList.toggle('off', !info.ok);
    });
    renderPortTabs();
  }
  /* phones: a switcher above the one card being edited, with each portfolio's state */
  function renderPortTabs() {
    const host = $('#port-tabs'); host.innerHTML = '';
    state.ports.forEach((p, pi) => {
      const info = portInfo(p);
      const b = el('button', 'pt'); b.type = 'button'; b.dataset.p = pi; b.setAttribute('aria-pressed', pi === state.portCur ? 'true' : 'false');
      const n = el('span', 'pt-n'); const k = el('span', 'key'); k.style.background = PCOL[pi];
      n.append(k, el('span', null, p.name.trim() || `포트폴리오 ${pi + 1}`));
      b.append(n, el('span', 'pt-s ' + (info.empty ? '' : info.ok ? 'ok' : 'bad'), info.empty ? '비어 있음' : info.ok ? `✓ 자산 ${info.tickers.length}개` : info.errs.length ? '입력 확인 필요' : `합계 ${+info.sum.toFixed(2)}%`));
      host.appendChild(b);
    });
  }
  function setPortCur(pi) {
    state.portCur = pi;
    document.querySelectorAll('#ports .pcard').forEach(c => c.classList.toggle('cur', +c.dataset.p === pi));
    renderPortTabs();
  }
  $('#port-tabs').addEventListener('click', e => { const b = e.target.closest('.pt'); if (b) setPortCur(+b.dataset.p); });
  const ports = $('#ports');
  ports.addEventListener('input', e => {
    const card = e.target.closest('.pcard'); if (!card) return; const pi = +card.dataset.p;
    if (e.target.classList.contains('pname')) { state.ports[pi].name = e.target.value; schedule(); return; }
    const row = e.target.closest('.prow'); if (!row) return; const ri = +row.dataset.r;
    if (e.target.classList.contains('tk')) { const pos = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); try { e.target.setSelectionRange(pos, pos); } catch (_) {} state.ports[pi].rows[ri].t = e.target.value; }
    if (e.target.classList.contains('wt')) state.ports[pi].rows[ri].w = e.target.value;
    updatePortStatus(); schedule();
  });
  ports.addEventListener('change', e => {
    if (!e.target.classList.contains('preset')) return;
    const pi = +e.target.closest('.pcard').dataset.p; const v = e.target.value; if (v === '') return;
    const pr = PRESETS[+v]; state.ports[pi] = { name: pr.n, rows: pr.r.map(([t, w]) => ({ t, w: String(w) })) };
    renderPorts(); schedule(true);
  });
  ports.addEventListener('click', e => {
    const card = e.target.closest('.pcard'); if (!card) return; const pi = +card.dataset.p; const p = state.ports[pi];
    if (e.target.classList.contains('del')) { p.rows.splice(+e.target.closest('.prow').dataset.r, 1); renderPorts(); schedule(); }
    else if (e.target.classList.contains('add')) { p.rows.push({ t: '', w: '' }); renderPorts(); const inp = document.getElementById(`tk-${pi}-${p.rows.length - 1}`); inp && inp.focus(); }
    else if (e.target.classList.contains('eq')) { const rows = p.rows.filter(r => r.t.trim()); if (!rows.length) return; const base = Math.floor(10000 / rows.length) / 100; let left = 100 - base * rows.length; rows.forEach((r, i) => { r.w = String(+(base + (i === 0 ? left : 0)).toFixed(2)); }); renderPorts(); schedule(); }
    else if (e.target.classList.contains('sv')) savePortCard(pi, e.target);
    else if (e.target.classList.contains('clr')) { p.rows = []; p.name = `포트폴리오 ${pi + 1}`; renderPorts(); schedule(); }
  });

  /* ---------- settings ---------- */
  function readPeriodSelects() { return [BT.idxOf(+$('#s-y').value, +$('#s-m').value), BT.idxOf(+$('#e-y').value, +$('#e-m').value)]; }
  function writePeriodSelects() { const [sy, sm] = BT.ym(state.start), [ey, em] = BT.ym(state.end); $('#s-y').value = sy; $('#s-m').value = sm; $('#e-y').value = ey; $('#e-m').value = em; }
  ['#s-y', '#s-m', '#e-y', '#e-m'].forEach(id => $(id).addEventListener('change', () => { const [s, e] = readPeriodSelects(); state.start = s; state.end = e; state.quick = null; schedule(true); }));
  $('#rebal').addEventListener('change', e => { state.rebal = e.target.value; schedule(true); });
  $('#init').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) { state.initial = v; schedule(); } });
  $('#bench').addEventListener('change', e => { state.bench = e.target.value; schedule(true); });
  $('#ext').addEventListener('change', e => { state.ext = e.target.checked; updatePortStatus(); schedule(true); });
  $('#real').addEventListener('change', e => {
    state.real = BT.setReal(e.target.checked);
    recompute();
    clearWalk();
    if (state.opt) { if (optBusy) state.rerun = true; else runOpt(); }   // stored optimizer results are in the other unit -> recompute them
  });
  if (!BT.hasCPI()) { $('#real').disabled = true; $('#real').closest('.field').hidden = true; }
  function syncDivUI() {
    document.querySelectorAll('input[name="divm"]').forEach(r => { r.checked = (r.value === 'cash') === state.div; r.closest('.opt').classList.toggle('on', r.checked); });
    $('#trail-div').hidden = !state.div; $('#roll-div').hidden = !state.div; $('#o-div-note').hidden = !state.div; $('#inc-chart').hidden = !state.div;
    $('#ann-title').textContent = state.div ? '연도별 가격 수익률 (배당 제외)' : '연도별 수익률';
  }
  document.querySelectorAll('input[name="divm"]').forEach(r => r.addEventListener('change', () => {
    if (!r.checked) return;
    state.div = r.value === 'cash'; syncDivUI(); recompute();
    if (state.opt) { renderOptResults(); renderAdjCompare(); $('#front-pick').innerHTML = ''; }
  }));
  syncDivUI();
  $('#ax-log').addEventListener('click', () => { state.log = true; $('#ax-log').setAttribute('aria-pressed', 'true'); $('#ax-lin').setAttribute('aria-pressed', 'false'); drawCharts(); });
  $('#ax-lin').addEventListener('click', () => { state.log = false; $('#ax-lin').setAttribute('aria-pressed', 'true'); $('#ax-log').setAttribute('aria-pressed', 'false'); drawCharts(); });

  function applyQuick(k) {
    const rng = currentRange(); if (!rng) return;
    const [cs, ce] = rng;
    state.end = ce;
    state.start = k === 'max' ? cs : Math.max(cs, ce - k * 12 + 1);
    state.quick = k;
    schedule(true);
  }

  let timer = null;
  function schedule(now) { clearTimeout(timer); timer = setTimeout(recompute, now ? 0 : 180); }

  function validPorts() { return state.ports.map((p, i) => ({ i, name: p.name.trim() || `포트폴리오 ${i + 1}`, info: portInfo(p) })).filter(x => x.info.ok); }
  function currentRange() {
    const vp = validPorts(); if (!vp.length) return null;
    const all = new Set(); vp.forEach(p => p.info.tickers.forEach(t => all.add(t))); if (state.bench && known(state.bench)) all.add(state.bench);
    return BT.commonRange([...all], state.ext ? 'ext' : 'etf');
  }

  /* ---------- main computation ---------- */
  function recompute() {
    try { recomputeInner(); }
    catch (err) {
      const msg = $('#msg'); msg.hidden = false; msg.className = 'notice warn';
      msg.textContent = '계산 중 문제가 생겨 결과를 지웠어요. 기간이나 티커를 다시 확인해 주세요. (' + err.message + ')';
      state.last = null; renderEmpty();
    }
  }
  function recomputeInner() {
    const vp = validPorts(); const msg = $('#msg');
    if (!vp.length) {
      msg.hidden = false; msg.className = 'notice warn'; msg.textContent = '계산할 포트폴리오가 없어요. 티커를 지원 목록에서 고르고 비중 합계를 100%로 맞추세요.';
      state.last = null; renderEmpty(); return;
    }
    const [cs, ce] = currentRange();
    const notes = [];
    if (cs > ce - 11) { msg.hidden = false; msg.className = 'notice warn'; msg.textContent = '선택한 자산들의 공통 데이터 기간이 1년이 안 돼 계산할 수 없어요.'; state.last = null; renderEmpty(); return; }
    if (state.start == null) { // first run: start at the first January inside the common range
      const [y, m] = BT.ym(cs); state.start = m === 1 ? cs : BT.idxOf(y + 1, 1); state.end = ce;
    }
    if (state.quick != null) { state.end = ce; state.start = state.quick === 'max' ? cs : Math.max(cs, ce - state.quick * 12 + 1); }
    state.quickShort = state.quick != null && state.quick !== 'max' && ce - state.quick * 12 + 1 < cs ? state.quick : null;
    let s = state.start, e = state.end;
    if (s < cs) { notes.push(`선택한 자산의 데이터가 ${BT.label(cs)}부터라 시작 시점을 맞췄어요.`); s = cs; }
    if (s > ce) s = cs;
    if (e > ce) { notes.push(`데이터가 ${BT.label(ce)}까지라 종료 시점을 맞췄어요.`); e = ce; }
    if (e < cs) { notes.push(`종료 시점이 선택한 자산의 데이터 시작(${BT.label(cs)})보다 앞서 종료 시점을 맞췄어요.`); e = ce; }
    if (e - s < 11) { e = Math.min(ce, s + 11); s = Math.max(cs, e - 11); notes.push('분석 기간은 최소 12개월이라 기간을 늘렸어요.'); }
    state.start = s; state.end = e; writePeriodSelects();
    if (state.quickShort) notes.push(`공통 데이터가 ${state.quickShort}년보다 짧아 가능한 최대 기간으로 계산했어요.`);
    document.querySelectorAll('#quick .chip, #quick2 .chip').forEach(b => {
      const k = b.dataset.q === 'max' ? 'max' : +b.dataset.q;
      const on = k === 'max' ? (s === cs && e === ce) : (e === ce && s === ce - k * 12 + 1);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const benchOk = state.bench && known(state.bench);
    const dv = state.div;
    computeTrend(e);   // the trend-kept data depends on the analysis end, and the results below may run on it
    const adj = !!(state.dataAdj && state.trend.on);
    const benchRes = benchOk ? BT.backtest([state.bench], [1], s, e, 'N', adj, dv) : null;
    const series = vp.map(p => {
      const res = BT.backtest(p.info.tickers, p.info.weights, s, e, state.rebal, adj, dv);
      const st = BT.stats(res, benchRes);
      return { key: 'p' + p.i, name: p.name, color: PCOL[p.i], tickers: p.info.tickers, weights: p.info.weights, res, st,
        trail: BT.trailing(p.info.tickers, p.info.weights, s, e, state.rebal, YEARS, adj, dv), roll: BT.rolling(res, YEARS) };
    });
    if (benchOk) {
      const st = BT.stats(benchRes, benchRes);
      series.push({ key: 'bench', name: `${state.bench} (벤치마크)`, color: BCOL, bench: true, tickers: [state.bench], weights: [1], res: benchRes, st,
        trail: BT.trailing([state.bench], [1], s, e, 'N', YEARS, adj, dv), roll: BT.rolling(benchRes, YEARS) });
    }
    const usesProxy = state.ext && series.some(x => x.tickers.some(t => BT.avail(t, 'etf')[0] > s));
    if (usesProxy) notes.push('분석 기간 일부가 ETF 상장 이전이라 대용 지수·시뮬레이션 데이터를 썼어요. 자세한 내용은 ‘도움말 › 사용한 데이터’에 있어요.');
    if (dv) {
      const noInc = [...new Set(series.flatMap(x => x.tickers))].filter(t => !BT.hasIncome(t));
      if (noInc.length) notes.push(`${noInc.join(', ')}은(는) 배당 데이터가 없어 배당 0으로 계산했어요(총수익이 모두 가격 상승으로 잡힘).`);
    }
    msg.hidden = notes.length === 0; msg.className = 'notice'; msg.textContent = notes.join(' ');
    $('#avail-note').textContent = `선택한 자산의 공통 데이터: ${BT.label(cs)} ~ ${BT.label(ce)}`;
    state.last = { s, e, series, cs, ce, adj };
    renderSummary(); renderHero(); renderQuickRes(); renderRisk(); renderMDD(); renderDD(); renderTrailing(); renderTrend(); drawCharts(); renderRolling(); renderCoverage(); renderDataMode(); renderPeriod(); markOptStale(); markAdjStale();
  }

  function renderEmpty() {
    for (const id of ['#t-summary', '#t-trail', '#t-trail-m', '#t-roll', '#t-mdd']) $(id).innerHTML = '';
    $('#mdd-note').textContent = '';
    for (const id of ['#c-growth', '#c-dd', '#c-ann', '#lg-growth', '#lg-dd', '#lg-ann']) $(id).innerHTML = '';
    for (const id of ['#pc-port', '#pc-verdict', '#pc-table', '#pc-key', '#pc-heat', '#pc-legend', '#pc-custom', '#pc-quick', '#t-risk', '#t-dd', '#dd-port']) $(id).innerHTML = '';
    $('#dd-note').textContent = ''; state.riskData = null; renderQuickRes(); renderHero();
    $('#trail-pick').innerHTML = ''; $('#trail-when').textContent = '';
    $('#pc-heat-note').textContent = ''; $('#pc-tbl-note').textContent = ''; $('#pc-data').textContent = '';
    $('#dm-banner').hidden = true; state.pcHeat = null;
    $('#cov').innerHTML = ''; $('#sum-note').textContent = '';
  }

  function headRow(tr, series, first) {
    const th0 = el('th', null, first || ''); tr.appendChild(th0);
    for (const x of series) {
      const th = el('th'); const sh = el('span', 'serieshead'); const k = el('span', 'key'); k.style.background = x.color;
      if (x.bench) k.style.background = 'var(--bench)';
      sh.append(k, document.createTextNode(x.name)); th.appendChild(sh); tr.appendChild(th);
    }
  }

  function renderSummary() {
    const { s, e, series } = state.last; const t = $('#t-summary'); t.innerHTML = '';
    $('#sum-note').textContent = `${BT.label(s)} ~ ${BT.label(e)} · ${monthsTxt(e - s + 1)} · 리밸런싱 ${REBAL_TXT[state.rebal]}` + (state.real ? ' · 물가 반영(실질)' : ' · 명목(물가 미반영)') +
      (state.div ? ' · 배당 현금 수령(평가액은 가격 기준)' : ' · 배당 재투자') + (state.last.adj ? ' · 추세 보정 데이터' : '');
    const thead = el('thead'); const hr = el('tr'); headRow(hr, series, '지표'); thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody'); t.appendChild(tb);
    const add = (label, fn, opts = {}) => {
      const tr = el('tr'); if (opts.hl) tr.className = 'hl';
      tr.appendChild(el('th', null, label));
      for (const x of series) { const td = cellFor(el('td'), x); const v = fn(x, td); if (typeof v === 'string') td.textContent = v; tr.appendChild(td); }
      tb.appendChild(tr);
    };
    add('초기 금액', () => money(state.initial));
    if (state.div) {
      const I = x => x.st.income;
      add('최종 평가액 (배당 제외)', x => money(state.initial * x.st.final));
      add('받은 배당금 합계', (x, td) => { td.textContent = money(state.initial * I(x).total); td.appendChild(el('span', 'sub', `평가액 + 배당 ${money(state.initial * I(x).wealth)}`)); });
      add('최근 1년 배당금', (x, td) => { td.textContent = money(state.initial * I(x).ttm); td.appendChild(el('span', 'sub', `지금 평가액의 ${pct(I(x).ttmYield)}`)); });
      add('평균 배당률 (연)', (x, td) => { td.textContent = pct(I(x).avgYield); td.appendChild(el('span', 'sub', `첫해 ${money(state.initial * I(x).firstYear)}`)); });
      add('CAGR (평가액, 연복리)', x => pct(x.st.cagr), { hl: true });
      add('CAGR (평가액 + 받은 배당)', (x, td) => { td.textContent = pct(I(x).wealthCagr); td.appendChild(el('span', 'sub', '배당을 현금으로 모아 둔 경우(이자 없음)')); });
    } else {
      add('최종 금액', x => money(state.initial * x.st.final));
      add('CAGR (연복리)', x => pct(x.st.cagr), { hl: true });
    }
    add(state.div ? 'MDD · 전체 기간 (평가액 기준)' : 'MDD · 전체 기간 최대 낙폭', (x, td) => {
      const m = x.st.mddInfo; td.textContent = mpct(m.mdd); if (m.mdd < 0) td.classList.add('neg');
      const sub = el('span', 'sub', m.mdd < 0 ? `${m.peakLabel} → ${m.troughLabel}${m.recLabel ? ' · 회복 ' + m.recLabel : ' · 미회복'}` : '');
      td.appendChild(sub);
    }, { hl: true });
    add('MDD 회복 기간 (저점→회복)', (x, td) => {
      const m = x.st.mddInfo;
      if (!(m.mdd < 0)) { td.textContent = '–'; return; }
      if (m.recMonths != null) { td.textContent = dur(m.recMonths); td.appendChild(el('span', 'sub', `고점부터 ${dur(m.months)} (하락 ${dur(m.fallMonths)})`)); }
      else { td.textContent = '아직 회복 전'; td.classList.add('neg'); td.appendChild(el('span', 'sub', m.sinceTrough > 0 ? `저점 후 ${dur(m.sinceTrough)} 지남` : '마지막 달이 저점')); }
    });
    add('최장 회복 기간 (전고점 회복까지)', (x, td) => {
      const u = x.st.uw;
      if (!u.months) { td.textContent = '없음'; return; }
      td.textContent = dur(u.months) + (u.ongoing ? '+' : '');
      td.appendChild(el('span', 'sub', `${u.startLabel} → ${u.ongoing ? '진행 중' : u.endLabel}`));
    }, { hl: true });
    add('표준편차 (연)', x => pct(x.st.stdev));
    add('최고 연도', x => x.st.best ? `${spct(x.st.best.ret)} (${x.st.best.year})` : '–');
    add('최악 연도', (x, td) => { if (!x.st.worst) return '–'; td.textContent = `${spct(x.st.worst.ret)} (${x.st.worst.year})`; if (x.st.worst.ret < 0) td.classList.add('neg'); });
    add('샤프 비율', x => num(x.st.sharpe));
    add('소르티노 비율', x => num(x.st.sortino));
    add('칼마 비율 (CAGR÷MDD)', x => num(x.st.calmar));
    if (state.bench && known(state.bench)) add(`${state.bench} 상관계수`, x => num(x.st.corr));
    add('상승한 달 비율', x => pct(x.st.posMonths, 1));
  }

  /* ---------- v8: results at a glance ---------- */
  /* the growth line on a log scale, with the worst fall (peak -> trough) drawn in red */
  function sparkline(x) {
    const v = x.res.vals, n = v.length, m = x.st.mddInfo, W = 160, H = 46, pad = 3;
    const step = Math.max(1, Math.floor(n / 150)); const idx = [];
    for (let t = 0; t < n; t += step) idx.push(t);
    if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
    if (m.mdd < 0) for (const k of [m.peak, m.trough]) if (!idx.includes(k)) idx.push(k);
    idx.sort((a, b) => a - b);
    let lo = Infinity, hi = -Infinity; for (const t of idx) { const y = Math.log(v[t]); if (y < lo) lo = y; if (y > hi) hi = y; }
    const X = t => (n <= 1 ? 0 : t / (n - 1) * W), Y = t => pad + (hi - lo < 1e-9 ? (H - 2 * pad) / 2 : (hi - Math.log(v[t])) / (hi - lo) * (H - 2 * pad));
    const pts = ts => ts.map(t => X(t).toFixed(1) + ',' + Y(t).toFixed(1)).join(' ');
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', 'aria-label': `${x.name} 자산 곡선` + (m.mdd < 0 ? `. 빨간 부분이 가장 크게 떨어진 ${m.peakLabel}–${m.troughLabel}` : '') });
    const line = svg('polyline', { points: pts(idx), fill: 'none', 'stroke-width': 1.8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, root);
    line.style.stroke = x.color;
    if (m.mdd < 0) {
      const fall = svg('polyline', { points: pts(idx.filter(t => t >= m.peak && t <= m.trough)), fill: 'none', 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, root);
      fall.style.stroke = 'var(--neg)';
    }
    return root;
  }
  /* one card per portfolio: final amount, CAGR, worst fall, longest time under water, and one plain sentence */
  function renderHero() {
    const host = $('#hero'), when = $('#hero-when'); if (!host) return; host.innerHTML = '';
    if (!state.last) { when.textContent = ''; if ($('#msg').hidden) host.appendChild(el('p', 'empty', '비중 합계가 100%인 포트폴리오가 생기면 여기에 결과가 나와요. ‘입력’ 탭에서 티커와 비중을 넣어 주세요.')); return; }
    const { s, e, series } = state.last, init = state.initial;
    when.textContent = `${BT.label(s)} – ${BT.label(e)} · ${monthsTxt(e - s + 1)} · 처음 ${money(init)}` + (state.div ? ' · 배당은 현금으로 받기' : ' · 배당 재투자') +
      (state.real ? ' · 물가 반영(지금 돈 가치)' : '') + (state.last.adj ? ' · 추세 보정 데이터' : '');
    for (const x of series) {
      const st = x.st, m = st.mddInfo, u = st.uw;
      const card = el('div', 'hc' + (x.bench ? ' bench' : '')); card.dataset.key = x.key;
      const top = el('div', 'hc-top'); const k = el('span', 'key'); k.style.background = x.color;
      top.append(k, el('span', 'nm', x.bench ? state.bench : x.name)); if (x.bench) top.appendChild(el('span', 'bt', '비교 기준'));
      card.appendChild(top);
      const main = el('div', 'hc-main');
      main.appendChild(el('div', 'hc-amt', money(init * st.final)));
      if (!x.bench) { const sp = el('div', 'hc-spark'); sp.appendChild(sparkline(x)); main.appendChild(sp); }
      card.appendChild(main);
      const from = el('div', 'hc-from');
      if (state.div) from.append('평가액(배당 제외) · 받은 배당 ', el('b', null, money(init * st.income.total)), ' 따로');
      else from.append('처음 넣은 돈 ', el('b', null, money(init)), ' 기준');
      card.appendChild(from);
      const kv = el('div', 'hc-kv');
      const cell = (lab, val, neg, sub) => { const d = el('div'); d.append(el('span', null, lab), el('b', neg ? 'neg' : null, val)); if (sub) d.appendChild(el('i', null, sub)); kv.appendChild(d); };
      cell(state.div ? '연 수익률(평가액)' : '연 수익률', pct(st.cagr, 1), st.cagr < 0);
      cell('최대 낙폭', mpct1(st.mdd), st.mdd < 0);
      cell('최장 회복', u.months ? dur(u.months) + (u.ongoing ? '+' : '') : '없음', false, u.months ? `${u.startLabel}–${u.ongoing ? '진행 중' : u.endLabel}` : null);
      card.appendChild(kv);
      if (!x.bench) {
        const note = el('p', 'hc-note');
        if (m.mdd < 0) note.append('가장 크게 떨어진 때 ', el('b', null, `${m.peakLabel} → ${m.troughLabel}`), m.recLabel ? ` · ${m.recLabel}에 고점 회복` : ' · 아직 고점 회복 전');
        else note.textContent = '분석 기간에 고점보다 떨어진 달이 없어요.';
        card.appendChild(note);
      }
      host.appendChild(card);
    }
  }

  /* series name with its colour key (table row header) */
  function seriesTh(x, extra) {
    const th = el('th'); const sh = el('span', 'serieshead'); const k = el('span', 'key'); k.style.background = x.bench ? 'var(--bench)' : x.color;
    sh.append(k, document.createTextNode(x.name)); th.appendChild(sh); if (extra) th.appendChild(extra); return th;
  }
  /* the column a cell belongs to, written above it when a wide table turns into a list on narrower screens */
  function capOf(main, sub) { const d = el('div', 'cell-cap'); d.appendChild(el('b', null, main)); if (sub) d.appendChild(el('span', null, sub.replace(/–/g, '–\u2060'))); return d; }   // no line break inside a date range
  /* label + colour of a value cell, used when a table turns into cards on a phone */
  function cellFor(td, x, label) { td.dataset.label = label || x.name; td.style.setProperty('--k', x.bench ? 'var(--bench)' : x.color); return td; }

  /* trailing N years: a wide grid (periods across, CAGR·MDD pairs) and, for phones, the same numbers grouped by period */
  function renderTrailing() {
    const { s, e, series } = state.last; const t = $('#t-trail'), tm = $('#t-trail-m'); t.innerHTML = ''; tm.innerHTML = '';
    const n = e - s + 1;
    const cols = YEARS.map(Y => ({ Y, ok: Y * 12 <= n, start: BT.label(e - Y * 12 + 1), end: BT.label(e) }));
    cols.push({ Y: 'full', ok: true, start: BT.label(s), end: BT.label(e) });
    const name = c => (c.Y === 'full' ? '전체 기간' : `최근 ${c.Y}년`);
    let maxC = 0.0001, maxM = 0.0001;
    const vals = series.map(x => cols.map((c, j) => {
      if (!c.ok) return null;
      const v = c.Y === 'full' ? { cagr: x.st.cagr, mdd: x.st.mdd, uw: x.st.uw, income: x.st.income } : x.trail[j];
      maxC = Math.max(maxC, Math.abs(v.cagr)); maxM = Math.max(maxM, Math.abs(v.mdd)); return v;
    }));
    const cagrCell = (x, v) => {
      const c1 = el('td'); const b1 = el('div', 'cellbar'); b1.appendChild(el('span', null, pct(v.cagr)));
      const i1 = el('i'); i1.style.width = Math.round(Math.abs(v.cagr) / maxC * 48) + 'px'; i1.style.background = x.bench ? 'var(--bench)' : x.color; b1.appendChild(i1); c1.appendChild(b1);
      if (v.cagr < 0) c1.classList.add('neg');
      if (state.div && v.income) c1.appendChild(el('span', 'sub', `배당 연 ${pct(v.income.avgYield, 1)}`));
      return c1;
    };
    const mddCell = (x, v) => {
      const c2 = el('td'); const b2 = el('div', 'cellbar'); b2.appendChild(el('span', null, mpct(v.mdd)));
      const i2 = el('i'); i2.style.width = Math.round(Math.abs(v.mdd) / maxM * 48) + 'px'; i2.style.background = x.bench ? 'var(--bench)' : x.color; i2.style.opacity = '0.45'; b2.appendChild(i2); c2.appendChild(b2);
      c2.appendChild(el('span', 'sub', v.uw && v.uw.months ? `회복 ${dur(v.uw.months)}${v.uw.ongoing ? '+' : ''}` : '낙폭 없음'));
      return c2;
    };
    // wide grid
    const thead = el('thead');
    const r1 = el('tr'); r1.appendChild(el('th', 'corner', ''));
    cols.forEach((c, j) => {
      const th = el('th', 'grp gs' + (j % 2 ? ' gb' : '')); th.colSpan = 2; th.scope = 'colgroup';
      th.appendChild(el('span', 'gname', name(c)));
      th.appendChild(el('span', 'when', c.ok ? `${c.start}–${c.end}` : '기간 부족')); r1.appendChild(th);
    });
    const r2 = el('tr'); r2.appendChild(el('th', null, '포트폴리오'));
    cols.forEach((c, j) => {
      const yy = c.Y === 'full' ? '전체' : `${c.Y}년`, band = j % 2 ? ' gb' : '';
      const a = el('th', 'gs' + band); a.append(el('span', 'yy', yy), document.createTextNode('CAGR')); a.title = `${name(c)} CAGR`;
      const b = el('th', band.trim() || null); b.append(el('span', 'yy', yy), document.createTextNode('MDD')); b.title = `${name(c)} MDD`;
      r2.append(a, b);
    });
    thead.append(r1, r2); t.appendChild(thead);
    const tb = el('tbody');
    series.forEach((x, i) => {
      const tr = el('tr'); tr.appendChild(seriesTh(x));
      vals[i].forEach((v, j) => {
        const band = j % 2 ? ' gb' : '';
        if (!v) { const td = el('td', 'gs' + band); td.colSpan = 2; td.appendChild(el('span', 'na', '–')); td.style.textAlign = 'center'; tr.appendChild(td); return; }
        const c1 = cagrCell(x, v), c2 = mddCell(x, v); c1.className += ' gs' + band; if (band) c2.classList.add('gb');
        c1.title = `${x.name} · ${name(cols[j])} CAGR`; c2.title = `${x.name} · ${name(cols[j])} MDD`;
        tr.append(c1, c2);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    // phones: pick one period, then every portfolio for it in a table that fits the screen
    if (!cols[state.trailJ] || !cols[state.trailJ].ok) state.trailJ = cols.findIndex(c => c.ok);
    const pick = $('#trail-pick'); pick.innerHTML = '';
    cols.forEach((c, j) => {
      const b = el('button', 'chip', c.Y === 'full' ? '전체' : `${c.Y}년`); b.type = 'button'; b.setAttribute('aria-pressed', j === state.trailJ ? 'true' : 'false');
      if (!c.ok) { b.disabled = true; b.title = '분석 기간이 짧아 계산하지 않았어요'; }
      b.addEventListener('click', () => { state.trailJ = j; renderTrailing(); });
      pick.appendChild(b);
    });
    const j = state.trailJ, c = cols[j];
    $('#trail-when').textContent = `${name(c)} · ${c.start}–${c.end}`;
    const hm = el('thead'), hr = el('tr');
    hr.append(el('th', null, '포트폴리오'), el('th', null, `${c.Y === 'full' ? '전체' : c.Y + '년'} CAGR`), el('th', null, `${c.Y === 'full' ? '전체' : c.Y + '년'} MDD`));
    hm.appendChild(hr); tm.appendChild(hm);
    const tbm = el('tbody');
    series.forEach((x, i) => { const tr = el('tr'); tr.append(seriesTh(x), cagrCell(x, vals[i][j]), mddCell(x, vals[i][j])); tbm.appendChild(tr); });
    tm.appendChild(tbm);
  }

  /* rolling N-year windows: one block per holding period */
  function renderRolling() {
    const { s, e, series } = state.last; const t = $('#t-roll'); t.innerHTML = '';
    const thead = el('thead'); const hr = el('tr');
    ['포트폴리오', '최저 CAGR', '중앙값 CAGR', '최고 CAGR', '플러스 구간', '구간 안 최악 MDD'].forEach(h => hr.appendChild(el('th', null, h)));
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody'); let any = false; const n = e - s + 1;
    YEARS.forEach((Y, j) => {
      const L = series.filter(x => x.roll[j].ok); if (!L.length) return; any = true;
      const cnt = L[0].roll[j].count;
      const g = el('tr', 'ph'); const gh = el('th'); gh.colSpan = 6; gh.scope = 'colgroup';
      gh.append(el('span', 'gname', `${Y}년 보유`), el('span', 'when', `${Y}년 구간 ${cnt}개 · ${BT.label(s)}~${BT.label(e - Y * 12 + 1)}에 시작 (1개월 간격)`));
      g.appendChild(gh); tb.appendChild(g);
      L.forEach(x => {
        const r = x.roll[j]; const tr = el('tr');
        tr.appendChild(seriesTh(x, el('span', 'hzc', `${Y}년`)));
        const tdMin = cellFor(el('td', null, pct(r.min)), x, `${Y}년 최저 CAGR`); if (r.min < 0) tdMin.classList.add('neg'); tdMin.appendChild(el('span', 'sub', `${r.minStart} 시작`)); tr.appendChild(tdMin);
        tr.appendChild(cellFor(el('td', null, pct(r.median)), x, `${Y}년 중앙값`));
        const tdMax = cellFor(el('td', null, pct(r.max)), x, `${Y}년 최고 CAGR`); tdMax.appendChild(el('span', 'sub', `${r.maxStart} 시작`)); tr.appendChild(tdMax);
        tr.appendChild(cellFor(el('td', null, pct(r.pctPositive, 0)), x, '플러스 구간'));
        const tdW = cellFor(el('td', 'neg', mpct(r.worstMDD)), x, `${Y}년 안 최악 MDD`); if (r.worstMDDStart) tdW.appendChild(el('span', 'sub', `${r.worstMDDStart} 시작`)); tr.appendChild(tdW);
        tb.appendChild(tr);
      });
    });
    if (!any) { const tr = el('tr'); const td = el('td', 'na', `분석 기간(${monthsTxt(n)})이 10년보다 짧아 롤링 구간이 없어요.`); td.colSpan = 6; td.style.textAlign = 'left'; tr.appendChild(td); tb.appendChild(tr); }
    t.appendChild(tb);
  }

  /* ---------- charts ---------- */
  function niceStep(span, count) { const raw = span / Math.max(1, count); const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }
  function linTicks(min, max, count) { const st = niceStep(max - min || 1, count); const out = []; for (let v = Math.ceil(min / st) * st; v <= max + 1e-9; v += st) out.push(+v.toFixed(10)); return out; }
  function logTicks(min, max) {
    const out = []; const lo = Math.floor(Math.log10(min)), hi = Math.ceil(Math.log10(max));
    const mult = hi - lo > 3 ? [1] : hi - lo > 1 ? [1, 2, 5] : [1, 1.5, 2, 3, 5, 7];
    for (let k = lo; k <= hi; k++) for (const m of mult) { const v = m * Math.pow(10, k); if (v >= min * 0.999 && v <= max * 1.001) out.push(v); }
    return out.length >= 2 ? out : [min, max];
  }
  const fmtMoneyShort = v => v >= 1e6 ? '$' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1e3 ? '$' + (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'K' : '$' + Math.round(v);
  function legend(host, series, dashBench, square) {
    host.innerHTML = '';
    for (const x of series) { const s = el('span'); const i = el('i', square ? 'sq' : null); i.style.background = x.color; if (x.bench && dashBench) i.className = 'dash'; s.append(i, document.createTextNode(x.name)); host.appendChild(s); }
  }

  function lineChart(host, cfg) {
    // cfg: {n, xLabel(t), series:[{name,color,bench,v:Float64Array}], log, yFmt, tipFmt, height, yMin, yMax, zero}
    host.innerHTML = '';
    const W = Math.max(300, host.clientWidth || 600), H = cfg.height || 300;
    const m = { l: 58, r: 14, t: 10, b: 26 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    let lo = Infinity, hi = -Infinity;
    for (const s of cfg.series) for (const v of s.v) { if (v < lo) lo = v; if (v > hi) hi = v; }
    if (cfg.yMax != null) hi = Math.max(hi, cfg.yMax); if (cfg.yMin != null) lo = Math.min(lo, cfg.yMin);
    let ticks, yv;
    if (cfg.log) { lo = lo * 0.95; hi = hi * 1.05; ticks = logTicks(lo, hi); const a = Math.log(lo), b = Math.log(hi); yv = v => m.t + ih - (Math.log(v) - a) / (b - a) * ih; }
    else { const pad = (hi - lo) * 0.04 || 1; if (cfg.zeroTop) { hi = 0; lo = lo - pad; } else { lo = Math.min(lo, cfg.yMin ?? lo) - (cfg.yMin == null ? pad : 0); hi = hi + pad; } ticks = linTicks(lo, hi, 5); lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]); yv = v => m.t + ih - (v - lo) / (hi - lo) * ih; }
    const N = cfg.n; const xv = t => m.l + (N <= 1 ? 0 : t / (N - 1) * iw);
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': cfg.aria || '' }, host);
    const g = svg('g', { class: 'grid' }, root); const ax = svg('g', { class: 'axis' }, root);
    for (const tv of ticks) { const y = yv(tv); if (y < m.t - 1 || y > m.t + ih + 1) continue; svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); const tx = svg('text', { x: m.l - 8, y: y + 3.5, 'text-anchor': 'end' }, ax); tx.textContent = cfg.yFmt(tv); }
    // x ticks by year
    const years = []; for (let t = 0; t < N; t++) { const lab = cfg.xLabel(t); if (lab.slice(4, 7) === '.01') years.push([t, lab.slice(0, 4)]); }
    if (!years.length || years[0][0] > 6) years.unshift([0, cfg.xLabel(0).slice(0, 4)]);
    const every = Math.max(1, Math.ceil(years.length / Math.max(2, Math.floor(iw / 62))));
    years.forEach(([t, y], i) => { if (i % every) return; const x = xv(t); const tx = svg('text', { x, y: H - 8, 'text-anchor': 'middle' }, ax); tx.textContent = y; svg('line', { x1: x, x2: x, y1: m.t + ih, y2: m.t + ih + 4, stroke: 'var(--line-2)' }, ax).style.stroke = 'var(--line-2)'; });
    const base = svg('line', { x1: m.l, x2: m.l + iw, y1: m.t + ih, y2: m.t + ih }, root); base.style.stroke = 'var(--line-2)';
    if (cfg.zeroLine) { const z = svg('line', { x1: m.l, x2: m.l + iw, y1: yv(0), y2: yv(0) }, root); z.style.stroke = 'var(--line-2)'; }
    // series (draw bench first so portfolios sit on top)
    const order = cfg.series.map((s, i) => i).sort((a, b) => (cfg.series[b].bench ? 1 : 0) - (cfg.series[a].bench ? 1 : 0));
    for (const i of order) {
      const s = cfg.series[i]; let d = '';
      for (let t = 0; t < s.v.length; t++) { d += (t ? 'L' : 'M') + xv(t).toFixed(1) + ',' + yv(s.v[t]).toFixed(1); }
      const p = svg('path', { d, fill: 'none', 'stroke-width': s.bench ? 1.5 : 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, root);
      p.style.stroke = s.color; if (s.bench) p.setAttribute('stroke-dasharray', '5 4');
    }
    // hover layer
    const cross = svg('line', { y1: m.t, y2: m.t + ih, visibility: 'hidden' }, root); cross.style.stroke = 'var(--ink-2)'; cross.style.strokeWidth = '1';
    const dots = cfg.series.map(s => { const c = svg('circle', { r: 4, visibility: 'hidden', 'stroke-width': 2 }, root); c.style.fill = s.color; c.style.stroke = 'var(--panel)'; return c; });
    const hit = svg('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, root);
    const tip = el('div', 'tip'); tip.hidden = true; host.appendChild(tip);
    function show(clientX) {
      const r = root.getBoundingClientRect(); const sx = (clientX - r.left) * (W / r.width);
      const t = Math.max(0, Math.min(N - 1, Math.round((sx - m.l) / iw * (N - 1))));
      const x = xv(t); cross.setAttribute('x1', x); cross.setAttribute('x2', x); cross.setAttribute('visibility', 'visible');
      tip.innerHTML = ''; tip.appendChild(el('div', 't', cfg.xLabel(t)));
      cfg.series.forEach((s, i) => {
        dots[i].setAttribute('cx', x); dots[i].setAttribute('cy', yv(s.v[t])); dots[i].setAttribute('visibility', 'visible');
        const row = el('div', 'r'); const lab = el('span'); const k = el('i'); k.style.background = s.color; lab.append(k, document.createTextNode(s.name));
        row.append(lab, el('b', null, cfg.tipFmt(s.v[t]))); tip.appendChild(row);
      });
      tip.hidden = false;
      const px = x * (r.width / W); const tw = tip.offsetWidth; const left = px + 14 + tw > r.width ? px - tw - 14 : px + 14;
      tip.style.left = Math.max(0, left) + 'px'; tip.style.top = '8px';
    }
    function hide() { cross.setAttribute('visibility', 'hidden'); dots.forEach(d => d.setAttribute('visibility', 'hidden')); tip.hidden = true; }
    hit.addEventListener('pointermove', ev => show(ev.clientX)); hit.addEventListener('pointerdown', ev => show(ev.clientX)); hit.addEventListener('pointerleave', hide);
    hit.setAttribute('tabindex', '0'); hit.addEventListener('focus', () => { const r = root.getBoundingClientRect(); show(r.right - 20); }); hit.addEventListener('blur', hide);
  }

  function barChart(host, cfg) {
    // cfg: {cats:[{label, partial}], series:[{name,color,vals:[]}], yFmt, tipFmt, aria}
    host.innerHTML = '';
    const yFmt = cfg.yFmt || (tv => (tv * 100).toFixed(0) + '%'), tipFmt = cfg.tipFmt || (v => spct(v, 1));
    const nC = cfg.cats.length, nS = cfg.series.length;
    const minW = nC * Math.max(14, nS * 5 + 6);
    const W = Math.max(host.parentElement.clientWidth || 600, minW + 70), H = 280;
    host.style.width = W + 'px';
    const m = { l: 52, r: 10, t: 10, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    let lo = 0, hi = 0; for (const s of cfg.series) for (const v of s.vals) { if (v == null) continue; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const ticks = linTicks(lo, hi, 5); lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
    const yv = v => m.t + ih - (v - lo) / (hi - lo) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': cfg.aria || '연도별 수익률 막대 차트' }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const tv of ticks) { const y = yv(tv); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 8, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = yFmt(tv); }
    const band = iw / nC; const gap = 2; const bw = Math.min(14, Math.max(2, (band - 6) / nS - gap));
    const groupW = nS * bw + (nS - 1) * gap;
    const every = Math.max(1, Math.ceil(nC / Math.floor(iw / 40)));
    const tip = el('div', 'tip'); tip.hidden = true; host.appendChild(tip);
    const zero = yv(0);
    cfg.cats.forEach((c, ci) => {
      const cx = m.l + band * ci + band / 2; const x0 = cx - groupW / 2;
      if (ci % every === 0) svg('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }, ax).textContent = c.label + (c.partial ? '*' : '');
      const hitG = svg('g', null, root);
      cfg.series.forEach((s, si) => {
        const v = s.vals[ci]; if (v == null) return;
        const x = x0 + si * (bw + gap); const y = yv(v); const h = Math.abs(y - zero);
        const r = Math.min(3, bw / 2, h);
        // rounded data-end, square at baseline
        let d;
        if (v >= 0) d = `M${x},${zero}V${y + r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y + r}V${zero}Z`;
        else d = `M${x},${zero}V${y - r}Q${x},${y} ${x + r},${y}H${x + bw - r}Q${x + bw},${y} ${x + bw},${y - r}V${zero}Z`;
        const p = svg('path', { d }, hitG); p.style.fill = s.color; if (s.bench) p.style.opacity = '0.75';
      });
      const hr = svg('rect', { x: m.l + band * ci, y: m.t, width: band, height: ih, fill: 'transparent' }, root);
      hr.addEventListener('pointerenter', () => {
        tip.innerHTML = ''; tip.appendChild(el('div', 't', c.label + (c.partial ? ' (일부 기간)' : '')));
        cfg.series.forEach((s, si) => { const v = s.vals[ci]; if (v == null) return; const row = el('div', 'r'); const lab = el('span'); const k = el('i'); k.style.background = s.color; lab.append(k, document.createTextNode(s.name)); row.append(lab, el('b', null, tipFmt(v, s, ci))); tip.appendChild(row); });
        tip.hidden = false; const px = (m.l + band * ci + band) ; const tw = tip.offsetWidth;
        tip.style.left = (px + tw + 8 > W ? px - band - tw - 8 : px + 8) + 'px'; tip.style.top = '8px';
        hitG.style.opacity = '0.8';
      });
      hr.addEventListener('pointerleave', () => { tip.hidden = true; hitG.style.opacity = '1'; });
    });
    const base = svg('line', { x1: m.l, x2: m.l + iw, y1: zero, y2: zero }, root); base.style.stroke = 'var(--line-2)';
  }

  function drawCharts() {
    if (!state.last) return;
    const { s, e, series } = state.last; const n = e - s + 1;
    const xLabel = t => t === 0 ? BT.label(s - 1) + ' (시작)' : BT.label(s + t - 1);
    $('#growth-sub').textContent = `초기 ${money(state.initial)}` + (state.real ? ' · 물가 반영(현재 구매력)' : '') + (state.div ? ' · 배당 제외 평가액' : '');
    legend($('#lg-growth'), series, true); legend($('#lg-dd'), series, true); legend($('#lg-ann'), series, false, true);
    lineChart($('#c-growth'), {
      n: n + 1, xLabel, log: state.log, height: 320, aria: '포트폴리오 자산 성장 선 차트',
      series: series.map(x => ({ name: x.name, color: x.color, bench: x.bench, v: Array.from(x.res.vals, v => v * state.initial) })),
      yFmt: fmtMoneyShort, tipFmt: v => money(v)
    });
    lineChart($('#c-dd'), {
      n: n + 1, xLabel, log: false, height: 220, zeroTop: true, aria: '최고점 대비 낙폭 선 차트',
      series: series.map(x => ({ name: x.name, color: x.color, bench: x.bench, v: Array.from(BT.drawdowns(x.res.vals)) })),
      yFmt: v => (v * 100).toFixed(0) + '%', tipFmt: v => mpct(v)
    });
    const ann = series.map(x => BT.annual(x.res));
    const cats = ann[0].map(a => ({ label: String(a.year), partial: !a.full }));
    barChart($('#c-ann'), { cats, series: series.map((x, i) => ({ name: x.name, color: x.color, bench: x.bench, vals: ann[i].map(a => a.ret) })) });
    if (state.div) {
      legend($('#lg-inc'), series, false, true);
      $('#inc-sub').textContent = `초기 ${money(state.initial)} 기준` + (state.real ? ' · 물가 반영' : '');
      barChart($('#c-inc'), {
        cats, aria: '연도별 받은 배당금 막대 차트',
        series: series.map((x, i) => ({ name: x.name, color: x.color, bench: x.bench, vals: ann[i].map(a => a.inc * state.initial), y: ann[i].map(a => a.incY) })),
        yFmt: fmtMoneyShort, tipFmt: (v, sr, ci) => `${money(v)}` + (sr.y[ci] != null ? ` · ${pct(sr.y[ci], 1)}` : '')
      });
    }
  }
  let rsTimer = null; let lastW = 0;
  new ResizeObserver(entries => { const w = entries[0].contentRect.width; if (Math.abs(w - lastW) < 8) return; lastW = w; clearTimeout(rsTimer); rsTimer = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); }, 120); }).observe(document.querySelector('.charts'));

  /* ---------- data coverage ---------- */
  function divSrcTxt(t) {
    const a = DATA.assets[t]; if (!a) return '';
    const src = a.dsrc || [[a.d ? 'csv' : 'none', a.s, a.s + a.r.length - 1]];
    const y = i => String(BT.ym(i)[0]);
    return src.filter(([, f, to]) => to >= f).map(([k, f, to]) => `${DIV_TXT[k] || k} ${y(f) === y(to) ? y(f) : y(f) + '~' + y(to)}`).join(' · ');
  }
  function renderCoverage() {
    const lg = $('#cov-legend'); lg.innerHTML = '';
    for (const k of ['A', 'X', 'B', 'S', 'P', 'U']) { const sp = el('span'); const i = el('i', 'c-' + k); sp.append(i, document.createTextNode(SEG_TXT[k])); lg.appendChild(sp); }
    const host = $('#cov'); host.innerHTML = '';
    const { s, e, series } = state.last;
    const ticks = []; for (const x of series) for (const t of x.tickers) if (!ticks.includes(t)) ticks.push(t);
    const total = NM;
    for (const t of ticks) {
      const a = DATA.assets[t]; const row = el('div', 'cov-row');
      const nm = el('div', 'nm'); nm.appendChild(el('b', null, t)); nm.append(' ' + a.c);
      const segTxt = a.seg.map(sg => `${SEG_TXT[sg[0]] || sg[0]} ${BT.label(sg[1])}~${BT.label(sg[2])}`).join(' · ');
      nm.appendChild(el('span', null, a.n + (a.inc ? ` · 상장 ${a.inc}` : '')));
      const divTxt = divSrcTxt(t);
      nm.title = segTxt + '\n배당: ' + divTxt;
      const bar = el('div', 'cov-bar'); bar.title = segTxt; bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', `${t} 데이터 구간: ${segTxt}`);
      for (const sg of a.seg) { const i = el('i', 'c-' + sg[0]); i.style.left = (sg[1] / total * 100) + '%'; i.style.width = ((sg[2] - sg[1] + 1) / total * 100) + '%'; bar.appendChild(i); }
      const win = el('i'); win.style.left = (s / total * 100) + '%'; win.style.width = ((e - s + 1) / total * 100) + '%'; win.style.border = '2px solid var(--p1)'; win.style.borderRadius = '3px'; win.style.background = 'transparent'; bar.appendChild(win);
      row.append(nm, bar);
      if (state.div) row.appendChild(el('div', 'divsrc', '배당 데이터 · ' + divTxt));
      host.appendChild(row);
    }
    const axis = el('div', 'cov-axis');
    [[0, '1972'], [BT.idxOf(1985, 1), '1985'], [BT.idxOf(2000, 1), '2000'], [BT.idxOf(2015, 1), '2015'], [NM, BT.label(NM - 1)]].forEach(([i, y]) => { const sp = el('span', null, y); sp.style.left = (i / NM * 100) + '%'; axis.appendChild(sp); });
    host.appendChild(axis);
    const note = el('p', 'small muted', '파란 테두리가 현재 분석 기간입니다. 막대에 마우스를 올리면 구간별 날짜가 보입니다.'); host.appendChild(note);
  }

  /* ---------- optimizer ---------- */
  const listShort = (arr, n) => (arr.length <= n ? arr.join(', ') : arr.slice(0, n).join(', ') + ` 외 ${arr.length - n}개`);
  const fmtW = w => (w * 100).toFixed(1).replace(/\.0$/, '') + '%';
  const mpct1 = x => (x == null || !isFinite(x) ? '–' : sgnTxt(x, 1));
  const uwTxt = u => (u.months ? dur(u.months) + (u.ongoing ? '+' : '') : '없음');

  function optInputs() {
    const step = +$('#o-step').value, U = Math.round(1 / step);
    const maxW = Math.min(1, Math.max(step, fieldNum('#o-max', 100) / 100));
    const maxU = Math.max(1, Math.min(U, Math.floor(maxW * U + 1e-9)));
    return { step, U, maxW, maxU, mode: state.ext ? 'ext' : 'etf' };
  }
  function currentCrits() {
    const uw = +$('#o-uw').value || 0;
    const lo = (+$('#o-lo').value || 0) / 100, hi = fieldNum('#o-hi', 100) / 100;
    const cr = [{ id: 'ai', kind: 'ai', uw }, { id: 'user', kind: 'range', lo, hi, uw }];
    for (const s of state.stages) cr.push({ id: s.id, kind: 'cap', cap: s.mdd / 100, uw: Math.round(s.uw * 12) });
    return cr;
  }
  function optKey() {
    const l = state.last; if (!l) return '';
    return [l.s, l.e, state.rebal, state.ext, state.real, [...state.optSel].sort().join(','), $('#o-step').value, $('#o-max').value].join('|');
  }

  /* ticker picker: every supported ticker as a toggle chip, grouped like the ticker list */
  function pickerGroups() {
    const groups = GROUPS.map(([n, l]) => [n, l.filter(t => known(t))]);
    const custom = Object.keys(DATA.assets).filter(t => DATA.assets[t].custom);
    if (custom.length) groups.push(['사용자 추가', custom]);
    return groups;
  }
  function renderPicker() {
    pickerReady = true;
    const host = $('#o-picker'); host.innerHTML = '';
    for (const [name, list] of pickerGroups()) {
      const g = el('div', 'tk-group');
      const gb = el('button', 'gname', name); gb.type = 'button'; gb.dataset.group = name; gb.title = `${name} 전체 선택 / 해제`;
      const chips = el('div', 'tk-chips');
      for (const t of list) {
        const a = DATA.assets[t];
        const c = el('button', 'tchip', t); c.type = 'button'; c.dataset.t = t; c.title = `${a.n} · ${a.c}`;
        c.setAttribute('aria-pressed', state.optSel.has(t) ? 'true' : 'false'); chips.appendChild(c);
      }
      g.append(gb, chips); host.appendChild(g);
    }
    updatePickerState();
  }
  function updatePickerState() {
    document.querySelectorAll('#o-picker .tchip').forEach(c => c.setAttribute('aria-pressed', state.optSel.has(c.dataset.t) ? 'true' : 'false'));
    $('#o-count').textContent = `${state.optSel.size}개 / 전체 ${Object.keys(DATA.assets).length}개`;
    const sel = [...state.optSel].filter(known);
    $('#o-sel-sum').textContent = sel.length ? listShort(sel, 10) : '고른 자산이 없어요. 눌러서 고르세요.';
    if (state.last) { computeTrend(); renderTrend(); }
    markOptStale();
  }
  $('#o-picker').addEventListener('click', e => {
    const chip = e.target.closest('.tchip');
    if (chip) { const t = chip.dataset.t; if (state.optSel.has(t)) state.optSel.delete(t); else state.optSel.add(t); updatePickerState(); return; }
    const gb = e.target.closest('.gname'); if (!gb) return;
    const list = (pickerGroups().find(g => g[0] === gb.dataset.group) || [null, []])[1];
    const allOn = list.every(t => state.optSel.has(t));
    list.forEach(t => (allOn ? state.optSel.delete(t) : state.optSel.add(t)));
    updatePickerState();
  });
  $('#o-all').addEventListener('click', () => { state.optSel = new Set(Object.keys(DATA.assets)); updatePickerState(); });
  $('#o-none').addEventListener('click', () => { state.optSel = new Set(); updatePickerState(); });

  function optSrcChips() {
    const host = $('#o-src'); host.innerHTML = '';
    const vp = validPorts();
    const mk = (label, list) => { const b = el('button', 'chip', label); b.type = 'button'; b.addEventListener('click', () => { state.optSel = new Set(list); updatePickerState(); }); host.appendChild(b); };
    vp.forEach(p => mk(`포트폴리오 ${p.i + 1} 자산`, p.info.tickers));
    const all = []; vp.forEach(p => p.info.tickers.forEach(t => { if (!all.includes(t)) all.push(t); }));
    if (vp.length > 1) mk('포트폴리오 자산 모두', all);
    return all;
  }
  function renderElig() {
    const host = $('#o-elig'); host.textContent = '';
    if (!state.last) return;
    const sel = [...state.optSel].filter(known);
    if (!sel.length) { host.textContent = '고른 자산이 없어요. 위 칩을 눌러 자산을 고르세요.'; return; }
    const { U, maxU, mode } = optInputs();
    const plans = optWindows(state.last.s, state.last.e).map(w => BT.optPlanWin(w, sel, mode, U, maxU));
    const part = pos => plans.filter(P => P.pos === pos).map(P => (P.ok ? `${P.years}년 ${P.K}개` : `${P.years}년 계산 불가`)).join(' · ');
    let txt = `구간별 계산에 쓰는 자산 — 최근: ${part('recent')} / 가장 과거(${BT.label(state.last.s)}부터): ${part('old')}.`;
    const ex = plans.filter(P => P.excluded.length).map(P => `${posLab(P)} ${listShort(P.excluded.map(x => x.t), 6)}`);
    if (ex.length) txt += ` 데이터가 그 구간보다 짧아 빠지는 자산 — ${ex.join(' / ')}.`;
    const merged = new Map(); plans.forEach(P => P.merged.forEach(m => merged.set(m.keep, m.drop)));
    if (merged.size) txt += ` 같은 지수를 따르는 ETF는 보수가 가장 낮은 하나로 계산: ${[...merged].map(([k, d]) => `${d.join('·')} → ${k}`).join(', ')}.`;
    if (sel.length > 12) txt += ' 자산이 많으면 휴대폰에서는 계산(최근·가장 과거 구간, 추세 보정까지)에 30초 넘게 걸릴 수 있어요. 최근 구간 결과가 먼저 나옵니다.';
    host.textContent = txt;
  }
  function markOptStale() {
    optSrcChips();
    $('#o-end').textContent = state.last ? `${BT.label(state.last.s)}~${BT.label(state.last.e)}` : '–';
    renderPosNote();
    renderElig();
    if (state.opt && !optBusy && state.opt.key !== optKey()) {
      $('#o-status').textContent = '대상 자산이나 기간·리밸런싱·비중 단위가 바뀌었어요. ‘최적 비중 찾기’를 누르면 새 설정으로 다시 계산합니다.';
      $('#o-run').classList.add('attn');
    } else if (state.opt && !optBusy) { $('#o-run').classList.remove('attn'); updateOptStatus(); }
  }
  ['#o-step', '#o-max'].forEach(id => $(id).addEventListener('change', () => markOptStale()));
  /* the folded optimizer criteria, readable without opening them */
  function renderCritSum() {
    const uw = +$('#o-uw').value || 0, lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    $('#o-crit-sum').textContent = `비중 ${fmtW(+$('#o-step').value)} 단위 · 자산별 최대 ${fieldNum('#o-max', 100)}% · 내 기준 MDD ${lo}~${hi}% · 회복 기간 ${uw ? dur(uw) + ' 이내' : '제한 없음'}`;
  }
  ['#o-step', '#o-max', '#o-lo', '#o-hi', '#o-uw'].forEach(id => { $(id).addEventListener('input', renderCritSum); $(id).addEventListener('change', renderCritSum); });
  $('#o-max').addEventListener('input', () => renderElig());

  async function runOpt() {
    const st = $('#o-status');
    if (optBusy) return;
    if (!state.last) { st.textContent = '분석 기간이 아직 정해지지 않았어요. ‘입력’ 탭의 포트폴리오 중 하나 이상을 비중 합계 100%로 넣어 주세요.'; return; }
    const tickers = [...state.optSel].filter(known);
    if (!tickers.length) { st.textContent = '대상 자산을 1개 이상 골라 주세요.'; return; }
    const lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    if (!(hi > lo)) { st.textContent = '내 기준 MDD 범위의 상한이 하한보다 커야 해요.'; return; }
    const { step, maxW, mode } = optInputs();
    const rule = state.rebal, start = state.last.s, end = state.last.e, key = optKey();
    const btn = $('#o-run'); btn.disabled = true; btn.classList.remove('attn'); optBusy = true;
    const prog = $('#o-prog'); prog.style.width = '0%';
    st.textContent = '계산 준비 중…';
    const t0 = performance.now();
    const base = { tickers, rule, mode, step, maxW, crits: currentCrits() };
    let res;
    try {
      res = await BT.optimizeHorizons(Object.assign({ windows: optWindows(start, end, 'recent') }, base), (f, y) => {
        prog.style.width = (f * 50).toFixed(1) + '%';
        if (y) st.textContent = `최근 ${y}년 구간 계산 중… (전체 ${Math.round(f * 50)}%)`;
      });
    } catch (err) {
      st.textContent = '계산 중 문제가 생겼어요: ' + err.message; btn.disabled = false; optBusy = false; flushCrit(); return;
    }
    state.opt = { res, rule, mode, s: start, end, key, tickers, step, maxW, real: state.real, sec: ((performance.now() - t0) / 1000).toFixed(1), oldDone: false };
    clearWalk();
    state.lifeSel = null; $('#front-pick').innerHTML = '';
    state.opt.resAdj = null; state.opt.adjKey = null; state.optView = 'actual';
    const fixTab = () => { const vp = viewPlans(); if (!vp[state.optTab] || !vp[state.optTab].ok) state.optTab = Math.max(0, vp.findIndex(p => p.ok)); };
    fixTab(); pickAll(); renderOptResults(); renderAdjCompare(); renderEraCompare();
    // the oldest 10·20·30 years of the analysis period, with the same assets and criteria
    if (!state.rerun) {
      try {
        const resO = await BT.optimizeHorizons(Object.assign({ windows: optWindows(start, end, 'old') }, base, { crits: currentCrits() }), (f, y) => {
          prog.style.width = (50 + f * 50).toFixed(1) + '%';
          if (y) st.textContent = `가장 과거 ${y}년 구간 계산 중… (전체 ${Math.round(50 + f * 50)}%)`;
        });
        res.plans.push(...resO.plans);
      } catch (err) { st.textContent = '가장 과거 구간 계산 중 문제가 생겼어요: ' + err.message; }
      state.opt.oldDone = true; state.opt.sec = ((performance.now() - t0) / 1000).toFixed(1);
      fixTab(); pickAll(); renderOptResults(); renderEraCompare();
    }
    prog.style.width = '100%';
    btn.disabled = false; optBusy = false;
    markOptStale();
    if (state.rerun) { state.rerun = false; runOpt(); return; }
    await runOptAdj(true);
    if (state.rerun) { state.rerun = false; runOpt(); return; }
    markOptStale();
    flushCrit();
  }
  $('#o-run').addEventListener('click', runOpt);

  function updateOptStatus() {
    const o = state.opt; if (!o) return;
    const plans = o.res.plans;
    if (!plans.some(P => P.ok)) { $('#o-status').textContent = '계산할 수 있는 구간이 없어요. ' + plans.map(P => `${posLab(P)}: ${P.reason}`).join(' · '); return; }
    const grp = pos => plans.filter(P => P.pos === pos).map(P => (P.ok ? `${P.years}년 ${P.evaluated.toLocaleString('ko-KR')}개(${modeTxt(P)})` : `${P.years}년 계산 불가`)).join(' · ');
    $('#o-status').textContent = `평가한 조합 — 최근: ${grp('recent')} / 가장 과거: ${o.oldDone ? grp('old') : '계산 전'} · ${o.sec}초 · 리밸런싱 ${REBAL_TXT[o.rule]} · ${BT.label(o.s)}~${BT.label(o.end)} · ${o.real ? '물가 반영(실질)' : '명목'}`;
  }

  const modeTxt = P => (P.mode === 'full' ? '전수' : P.mode === 'coarse' ? `${Math.round(100 / P.coarseU)}% 간격 전수 + 주변 탐색` : '표본 + 주변 탐색');
  /* optimisation windows: the last 10·20·30 years of the analysis period ('recent') and its first 10·20·30 years ('old') */
  const POS_TXT = { recent: '최근', old: '가장 과거' };
  const posLab = P => `${POS_TXT[P.pos || 'recent']} ${P.years}년`;
  const posName = P => (P.pos === 'old' ? `과거 ${P.years}년(${BT.label(P.i0)}~)` : `${P.years}년`);
  function optWindows(s, e, pos) {
    const out = [];
    if (!pos || pos === 'recent') for (const Y of HZ) out.push({ id: 'r' + Y, pos: 'recent', years: Y, i0: e - Y * 12 + 1, i1: e });
    if (!pos || pos === 'old') for (const Y of HZ) {
      const w = { id: 'o' + Y, pos: 'old', years: Y, i0: s, i1: s + Y * 12 - 1 };
      if (w.i1 > e) { w.reason = `분석 기간(${BT.label(s)}~${BT.label(e)})이 ${Y}년보다 짧아요. ‘입력 › 기간과 금액’에서 시작 시점을 앞당기면 계산돼요.`; w.i0 = w.i1 = -1; }
      out.push(w);
    }
    return out;
  }
  const planOf = (res, pos, Y) => (res ? res.plans.find(P => (P.pos || 'recent') === pos && P.years === Y) : null) || null;
  const allPlans = () => { const o = state.opt; return o ? [...new Set(o.res.plans.concat(o.resAdj ? o.resAdj.plans : []))] : []; };
  function withUnit(real, fn) {
    const prev = BT.isReal(); if (prev !== real) BT.setReal(real);
    try { return fn(); } finally { if (prev !== real) BT.setReal(prev); }
  }
  /* stats of one mix over a plan's window, in the plan's unit: total return (what the optimizer ranks)
     and the same mix with distributions taken as cash */
  function mixStats(H, w) {
    const tk = w.map(x => x[0]), ws = w.map(x => x[1]), rule = state.opt.rule;
    return withUnit(!!H.real, () => [BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false)), BT.stats(BT.backtest(tk, ws, H.i0, H.i1, rule, H.adjMap || false, true))]);
  }
  function makePick(H, c) {
    const sel = BT.optSelect(H, c); if (!sel) return null;
    const p = BT.optPoint(H, sel.i);
    const [st, stDiv] = mixStats(H, p.w);
    return Object.assign(p, { feasible: sel.feasible, st, stDiv, crit: c });
  }
  /* one line: what the mix looks like when distributions are taken as cash (shown in that mode) */
  function divLine(stDiv) {
    if (!state.div || !stDiv || !stDiv.income) return null;
    const I = stDiv.income;
    return el('p', 'divline', `배당을 현금으로 받으면 · 평가액 CAGR ${pct(stDiv.cagr, 1)} · MDD ${mpct1(stDiv.mdd)} · 최근 1년 배당률 ${pct(I.ttmYield, 1)} · 평균 ${pct(I.avgYield, 1)}`);
  }
  function pickAll(ids) {
    const o = state.opt; if (!o) return;
    const crits = currentCrits().filter(c => !ids || ids.includes(c.id));
    for (const H of allPlans()) {
      if (!H.ok) continue;
      H.picks = H.picks || {};
      for (const c of crits) H.picks[c.id] = makePick(H, c);
    }
  }
  function renderOptResults() { renderHz(); buildLife(); fillLife(); renderLifePick(); renderFrontTabs(); drawFrontier(); }

  /* criteria edits: re-pick from the evaluated mixes at once; where not every mix was evaluated,
     search again around the best ones for the new criteria, then re-pick */
  let critPending = null;
  function renderAfterCrit(ids) { if (ids.includes('ai') || ids.includes('user')) renderHz(); fillLife(); renderLifePick(); drawFrontier(); renderAdjCompare(); renderEraCompare(); }
  async function critChanged(ids) {
    renderCritLine(); markWalkStale();
    if (!state.opt) return;
    if (optBusy) { critPending = new Set([...(critPending || []), ...ids]); return; }
    pickAll(ids); renderAfterCrit(ids);
    const plans = allPlans().filter(P => P.ok && P.refine);
    if (plans.length) {
      const crits = currentCrits().filter(c => ids.includes(c.id));
      const st = $('#o-status'); optBusy = true; $('#o-run').disabled = true;
      st.textContent = '바뀐 기준에 맞춰 주변 조합을 다시 찾는 중…';
      try { for (const P of plans) await P.refine(crits); } catch (_) { /* keep the instant picks */ }
      optBusy = false; $('#o-run').disabled = false;
      pickAll(ids); renderAfterCrit(ids); markOptStale();
    }
    renderAdjCompare();
    if (state.rerun) { state.rerun = false; critPending = null; runOpt(); return; }
    flushCrit();
  }
  /* criteria edited while another run held the optimizer: apply them once it is free */
  function flushCrit() {
    if (optBusy) return;
    if (critPending) { const next = [...critPending]; critPending = null; critChanged(next); return; }
    if (state.walkQueued) { state.walkQueued = false; runWalk(); }   // '점검 실행' pressed while the optimizer was busy
  }
  ['#o-lo', '#o-hi'].forEach(id => $(id).addEventListener('input', () => { clearTimeout(lifeTimer); lifeTimer = setTimeout(() => critChanged(['user']), 250); }));
  $('#o-uw').addEventListener('change', () => critChanged(['ai', 'user']));

  function renderCritLine() {
    const uw = +$('#o-uw').value || 0;
    const lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    const uwT = uw ? ` · 최장 회복 ${dur(uw)} 이내` : '';
    $('#o-crit').textContent = `AI 추천 = 구간 전체와 앞·뒤 절반의 샤프 비율 중 가장 낮은 값이 최대인 조합(현금성 자산 제외${uwT}). 내 기준 = MDD ${lo}% 이상 ${hi}% 미만${uwT}인 조합 중 CAGR 최고.`;
  }

  function kpi(host, k, v, sub) { const d = el('div', 'kpi'); d.append(el('div', 'k', k), el('div', 'v', v)); if (sub) d.appendChild(el('div', 's', sub)); host.appendChild(d); }
  function wbars(items, color) {
    const wb = el('div', 'wbars');
    for (const [t, w] of items) {
      const r = el('div', 'wbar'); const tr = el('div', 'track'); const f = el('div', 'fill'); f.style.width = (w * 100) + '%'; f.style.background = color; tr.appendChild(f);
      const tk = el('span', 'tk', t); if (DATA.assets[t]) tk.title = DATA.assets[t].n;
      r.append(tk, tr, el('span', 'pct', fmtW(w))); wb.appendChild(r);
    }
    return wb;
  }
  function applyRow(items, name, snap) {
    const ap = el('div', 'apply'); ap.appendChild(el('span', 'small muted', '적용:'));
    [0, 1, 2].forEach(pi => {
      const b = el('button', 'btn ghost sm', `포트폴리오 ${pi + 1}`); b.type = 'button';
      b.addEventListener('click', () => {
        state.ports[pi] = { name, rows: items.map(([t, w]) => ({ t, w: String(+(w * 100).toFixed(2)) })) };
        state.portCur = pi; renderPorts(); schedule(true); b.textContent = `포트폴리오 ${pi + 1}에 적용됨`;
        if (state.layout === 'tabs') toast(`‘${name}’${eul(name)} 포트폴리오 ${pi + 1}에 넣었어요. 결과는 ‘결과’ 탭에서 볼 수 있어요.`);
        goTo('h-ports');
      });
      ap.appendChild(b);
    });
    const sv = el('button', 'btn ghost sm save', '저장'); sv.type = 'button'; sv.title = '저장한 포트폴리오 목록에 추가';
    sv.addEventListener('click', async () => {
      sv.disabled = true;
      const ok = await saveItem({ name, rows: items.map(([t, w]) => ({ t, w: +(w * 100).toFixed(2) })), rule: snap && snap.rule ? snap.rule : state.rebal, src: name, snap });
      sv.textContent = ok ? '저장됨' : '저장';
      setTimeout(() => { if (sv.isConnected) { sv.textContent = '저장'; sv.disabled = false; } }, 2000);
    });
    ap.appendChild(sv);
    return ap;
  }
  function pickCard(H, pk, title, color, applyName) {
    const box = el('div', 'pick');
    const hd = el('div', 'pick-head'); const mk = el('span', 'pick-mark'); mk.style.background = color; hd.append(mk, el('h3', null, title)); box.appendChild(hd);
    if (!pk) { box.appendChild(el('p', 'empty', '조합이 없어요.')); return box; }
    if (!pk.feasible) box.appendChild(el('p', 'badge warn', '조건을 모두 만족하는 조합이 없어 가장 가까운 조합을 보여줘요'));
    const st = pk.st; const kp = el('div', 'kpis k4');
    kpi(kp, 'CAGR', pct(st.cagr)); kpi(kp, 'MDD', mpct(st.mdd));
    kpi(kp, '최장 회복', st.uw.months ? dur(st.uw.months) : '없음', st.uw.months ? (st.uw.ongoing ? `${st.uw.startLabel}~ 진행 중` : `${st.uw.startLabel}→${st.uw.endLabel}`) : null);
    kpi(kp, '샤프', num(st.sharpe));
    box.appendChild(kp);
    const dl = divLine(pk.stDiv); if (dl) box.appendChild(dl);
    box.appendChild(wbars(pk.w, color));
    box.appendChild(applyRow(pk.w, applyName || title, snapOf(H, st, pk.stDiv)));
    return box;
  }
  function renderHz() {
    const host = $('#o-hz'); host.innerHTML = '';
    const o = state.opt; renderCritLine(); if (!o) return;
    const lo = +$('#o-lo').value || 0, hi = fieldNum('#o-hi', 100);
    const adjView = state.optView === 'adj' && o.resAdj;
    if (adjView) host.appendChild(el('p', 'notice hz-banner', '추세 보정 데이터로 찾은 결과를 보고 있어요. 급등 종목의 최근 구간을 과거 추세 속도로 바꾼 데이터라, CAGR·MDD도 그 데이터 기준이에요.'));
    for (const H of viewPlans()) {
      const col = el('div', 'hz-col');
      const hd = el('div', 'hz-head');
      hd.appendChild(el('h3', null, posLab(H)));
      hd.appendChild(el('span', 'when', H.i0 >= 0 ? `${BT.label(H.i0)} – ${BT.label(H.i1)}` : ''));
      col.appendChild(hd);
      if (!H.ok) { col.appendChild(el('p', 'notice', H.reason)); host.appendChild(col); continue; }
      hd.appendChild(el('span', 'small muted', `자산 ${H.K}개 · ${H.evaluated.toLocaleString('ko-KR')}개 조합 (${modeTxt(H)})`));
      if (H.excluded.length) hd.appendChild(el('span', 'small muted', `데이터 부족으로 제외: ${listShort(H.excluded.map(x => x.t), 5)}`));
      const sfx = H.adjMap ? ' (추세 보정)' : '';
      col.appendChild(pickCard(H, H.picks.ai, 'AI 추천', 'var(--p1)', `AI 추천 · ${posName(H)}${sfx}`));
      col.appendChild(pickCard(H, H.picks.user, `내 기준 · MDD ${lo}~${hi}%`, 'var(--p2)', `내 기준 · ${posName(H)}${sfx}`));
      host.appendChild(col);
    }
  }

  /* life-stage table: guideline inputs stay in place while results refresh */
  function buildLife() {
    const t = $('#o-life'); t.innerHTML = '';
    const o = state.opt;
    const thead = el('thead'); const hr = el('tr');
    hr.appendChild(el('th', null, '단계')); hr.appendChild(el('th', null, '추천 기준 (수정 가능)'));
    HZ.forEach((Y, h) => {
      const th = el('th', 'grp', `${POS_TXT[state.optPos]} ${Y}년`); const P = o && viewPlans()[h];
      th.appendChild(el('span', 'when', P && P.i0 >= 0 ? `${BT.label(P.i0)}–${BT.label(P.i1)}` : ''));
      hr.appendChild(th);
    });
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody');
    state.stages.forEach((s, si) => {
      const tr = el('tr');
      const th = el('th', 'stage'); th.append(el('b', null, s.name), el('span', 'role', s.role), el('span', 'desc', s.desc)); tr.appendChild(th);
      const tc = el('td', 'crit-in');
      tc.append(critInput(si, 'mdd', 'MDD', '% 이하', 5, 80, 1), critInput(si, 'uw', '회복', '년 이내', 0.5, 25, 0.5), critInput(si, 'cagr', '목표 CAGR', '% 이상', 0, 40, 0.5));
      tr.appendChild(tc);
      HZ.forEach((Y, h) => {
        const td = el('td', 'stage-td'); td.dataset.h = h; td.dataset.s = si;
        const P = o && viewPlans()[h]; td.dataset.label = `${POS_TXT[state.optPos]} ${Y}년` + (P && P.i0 >= 0 ? ` · ${BT.label(P.i0)}–${BT.label(P.i1)}` : '');
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }
  function critInput(si, key, label, unit, min, max, step) {
    const s = state.stages[si];
    const lab = el('label', 'ci'); lab.appendChild(el('span', 'k', label));
    const inp = el('input'); inp.type = 'number'; inp.min = min; inp.max = max; inp.step = step; inp.value = s[key];
    inp.dataset.s = si; inp.dataset.k = key; inp.setAttribute('aria-label', `${s.name} ${label} (${unit})`);
    lab.append(inp, el('span', 'u', unit));
    return lab;
  }
  function fillLife() {
    const o = state.opt;
    document.querySelectorAll('#o-life td.stage-td').forEach(td => {
      td.innerHTML = '';
      const h = +td.dataset.h, si = +td.dataset.s, s = state.stages[si];
      const P = o && viewPlans()[h];
      if (!o) { td.appendChild(el('span', 'na', '실행 전')); return; }
      if (!P || !P.ok) { td.appendChild(el('span', 'na', '계산 불가')); return; }
      const pk = P.picks && P.picks[s.id]; if (!pk) { td.appendChild(el('span', 'na', '–')); return; }
      const st = pk.st;
      const b = el('button', 'stage-cell'); b.type = 'button'; b.dataset.h = h; b.dataset.s = si;
      b.setAttribute('aria-pressed', state.lifeSel && state.lifeSel.h === h && state.lifeSel.s === si ? 'true' : 'false');
      b.setAttribute('aria-label', `${s.name} ${posLab(P)} 추천 조합 자세히 보기`);
      const met = st.cagr >= s.cagr / 100 - 1e-9;
      const c = el('span', 'c'); c.append(el('span', 'cv', pct(st.cagr, 1)), el('span', met ? 'tag ok' : 'tag no', met ? '목표 달성' : '목표 미달'));
      b.appendChild(c);
      b.appendChild(el('span', 'm', `MDD ${mpct1(st.mdd)} · 회복 ${uwTxt(st.uw)}`));
      b.appendChild(el('span', 'w', pk.w.slice(0, 4).map(([t, w]) => `${t} ${fmtW(w)}`).join(' · ') + (pk.w.length > 4 ? ` 외 ${pk.w.length - 4}개` : '')));
      if (!pk.feasible) b.appendChild(el('span', 'badge warn', '한도를 만족하는 조합 없음 · 가장 가까운 조합'));
      td.appendChild(b);
    });
  }
  function renderLifePick() {
    const host = $('#life-pick'); host.innerHTML = '';
    const o = state.opt, ls = state.lifeSel; if (!o || !ls) return;
    const P = viewPlans()[ls.h], s = state.stages[ls.s]; if (!P || !P.ok) return;
    const pk = P.picks[s.id]; if (!pk) return;
    const st = pk.st;
    const box = el('div', 'pick life-detail');
    const hd = el('div', 'pick-head'); const mk = el('span', 'pick-mark diamond'); hd.append(mk, el('h3', null, `${s.name} · ${s.role} — ${posLab(P)} 추천 조합`)); box.appendChild(hd);
    const chk = (ok, txt) => { const sp = el('span', ok ? 'tag ok' : 'tag no', (ok ? '충족 ' : '초과 ') + txt); return sp; };
    const row = el('div', 'row');
    row.append(chk(st.mdd >= -s.mdd / 100 - 1e-9, `MDD ${mpct1(st.mdd)} (한도 ${s.mdd}%)`),
      chk(st.uw.months <= Math.round(s.uw * 12), `최장 회복 ${uwTxt(st.uw)} (한도 ${dur(Math.round(s.uw * 12))})`));
    const met = st.cagr >= s.cagr / 100 - 1e-9;
    const tg = el('span', met ? 'tag ok' : 'tag no', `${met ? '달성' : '미달'} CAGR ${pct(st.cagr, 1)} (목표 ${s.cagr}%)`); row.appendChild(tg);
    box.appendChild(row);
    const kp = el('div', 'kpis k4');
    kpi(kp, 'CAGR', pct(st.cagr)); kpi(kp, 'MDD', mpct(st.mdd));
    kpi(kp, '최장 회복', st.uw.months ? dur(st.uw.months) : '없음', st.uw.months ? (st.uw.ongoing ? `${st.uw.startLabel}~ 진행 중` : `${st.uw.startLabel}→${st.uw.endLabel}`) : null);
    kpi(kp, '샤프', num(st.sharpe));
    box.appendChild(kp);
    const dl = divLine(pk.stDiv); if (dl) box.appendChild(dl);
    box.appendChild(wbars(pk.w, 'var(--ink-2)'));
    box.appendChild(applyRow(pk.w, `${s.name} 추천 · ${posName(P)}` + (P.adjMap ? ' (추세 보정)' : ''), snapOf(P, st, pk.stDiv)));
    host.appendChild(box);
  }
  $('#o-life').addEventListener('click', e => {
    const b = e.target.closest('.stage-cell'); if (!b) return;
    const h = +b.dataset.h, si = +b.dataset.s;
    state.lifeSel = state.lifeSel && state.lifeSel.h === h && state.lifeSel.s === si ? null : { h, s: si };
    fillLife(); renderLifePick();
    const pane = $('#life-pick'); if (state.lifeSel && pane.firstChild) pane.firstChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#o-life').addEventListener('input', e => {
    const inp = e.target; if (!inp.dataset || inp.dataset.k == null) return;
    const v = parseFloat(inp.value); const si = +inp.dataset.s, k = inp.dataset.k;
    if (!isFinite(v) || v < +inp.min || v > +inp.max) { inp.setAttribute('aria-invalid', 'true'); return; }
    inp.removeAttribute('aria-invalid');
    state.stages[si][k] = v;
    clearTimeout(lifeTimer);
    lifeTimer = setTimeout(() => critChanged([state.stages[si].id]), 250);
  });
  $('#life-reset').addEventListener('click', () => { state.stages = STAGES.map(s => Object.assign({}, s)); buildLife(); critChanged(state.stages.map(s => s.id)); });

  /* scatter of every evaluated mix (sampled for drawing) for one horizon */
  function renderFrontTabs() {
    const host = $('#o-ftabs'); host.innerHTML = '';
    const o = state.opt; if (!o) return;
    viewPlans().forEach((P, k) => {
      const b = el('button', null, `${P.years}년`); b.type = 'button'; b.setAttribute('aria-pressed', k === state.optTab ? 'true' : 'false');
      if (!P.ok) { b.disabled = true; b.title = P.reason; }
      b.addEventListener('click', () => { state.optTab = k; $('#front-pick').innerHTML = ''; renderFrontTabs(); drawFrontier(); });
      host.appendChild(b);
    });
  }
  const textW = s => { let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 0x2fff ? 12 : 7; return w; };
  function drawFrontier() {
    const host = $('#c-front'), lg = $('#lg-front'); host.innerHTML = ''; lg.innerHTML = '';
    const o = state.opt; if (!o) return;
    const H = viewPlans()[state.optTab];
    if (!H || !H.ok) { host.appendChild(el('p', 'empty', H ? H.reason : '계산된 구간이 없어요.')); return; }
    const S = H.store;
    const W = Math.max(300, host.clientWidth || 600), HT = 380; const m = { l: 52, r: 16, t: 14, b: 38 };
    const iw = W - m.l - m.r, ih = HT - m.t - m.b;
    const ids = Array.from(new Set(H.sample.concat(H.front)));
    let xmax = 0, ymin = Infinity, ymax = -Infinity;
    const upd = (x, y) => { if (x > xmax) xmax = x; if (y < ymin) ymin = y; if (y > ymax) ymax = y; };
    for (const i of ids) upd(-S.mdd[i], S.cagr[i]);
    const marks = [];
    const pk = H.picks || {};
    state.stages.forEach(s => { const p = pk[s.id]; if (p) marks.push({ p, shape: 'diamond', color: 'var(--ink)', label: s.name }); });
    if (pk.user) marks.push({ p: pk.user, shape: 'circle', color: 'var(--p2)', label: '내 기준' });
    if (pk.ai) marks.push({ p: pk.ai, shape: 'circle', color: 'var(--p1)', label: 'AI 추천' });
    marks.forEach(k => upd(-k.p.st.mdd, k.p.st.cagr));
    const cur = [];
    for (const vp of validPorts()) {
      const [cs, ce] = BT.commonRange(vp.info.tickers, o.mode);
      if (cs > H.i0 || ce < H.i1) continue;
      const st = withUnit(!!H.real, () => BT.stats(BT.backtest(vp.info.tickers, vp.info.weights, H.i0, H.i1, o.rule, H.adjMap || false)));
      cur.push({ name: vp.name, color: PCOL[vp.i], x: -st.mdd, y: st.cagr }); upd(-st.mdd, st.cagr);
    }
    const xt = linTicks(0, Math.max(0.01, xmax * 1.05), 6);
    if (xt.length > 1) { const stp = xt[1] - xt[0]; while (xt[xt.length - 1] < xmax * 1.02) xt.push(+(xt[xt.length - 1] + stp).toFixed(10)); }
    const xm = xt[xt.length - 1];
    const ypad = (ymax - ymin) * 0.06 || 0.01; const yt = linTicks(ymin - ypad, ymax + ypad, 5);
    const y0 = Math.min(yt[0], ymin - ypad), y1 = Math.max(yt[yt.length - 1], ymax + ypad);
    const X = x => m.l + x / xm * iw, Y = y => m.t + ih - (y - y0) / (y1 - y0) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${HT}`, width: W, height: HT, role: 'img', 'aria-label': `${posLab(H)} 비중 조합별 MDD와 CAGR 산점도` }, host);
    const lo = (+$('#o-lo').value || 0) / 100, hi = fieldNum('#o-hi', 100) / 100;
    const bx0 = X(Math.min(lo, xm)), bx1 = X(Math.min(hi, xm));
    if (bx1 > bx0) { const r = svg('rect', { x: bx0, y: m.t, width: bx1 - bx0, height: ih }, root); r.style.fill = 'var(--band)'; }
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    yt.forEach(v => { const y = Y(v); if (y < m.t - 1 || y > m.t + ih + 1) return; svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 8, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(1).replace(/\.0$/, '') + '%'; });
    xt.forEach(v => { const x = X(v); svg('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih }, g); svg('text', { x, y: m.t + ih + 15, 'text-anchor': 'middle' }, ax).textContent = (v * 100).toFixed(0) + '%'; });
    svg('text', { x: m.l + iw, y: HT - 4, 'text-anchor': 'end' }, ax).textContent = `MDD (${posLab(H)}) →`;
    svg('text', { x: m.l + 4, y: m.t + 10 }, ax).textContent = '↑ CAGR';
    let dpath = '';
    for (const i of H.sample) dpath += `M${X(-S.mdd[i]).toFixed(1)},${Y(S.cagr[i]).toFixed(1)}h0.01`;
    const dp = svg('path', { d: dpath, 'stroke-width': 3.2, 'stroke-linecap': 'round' }, root); dp.style.stroke = 'var(--dot)';
    const fd = H.front.map((i, k) => (k ? 'L' : 'M') + X(-S.mdd[i]).toFixed(1) + ',' + Y(S.cagr[i]).toFixed(1)).join('');
    const fp = svg('path', { d: fd, fill: 'none', 'stroke-width': 1.5 }, root); fp.style.stroke = 'var(--ink-2)';
    cur.forEach(c => { const sq = svg('rect', { x: X(c.x) - 5, y: Y(c.y) - 5, width: 10, height: 10, rx: 2, 'stroke-width': 2 }, root); sq.style.fill = c.color; sq.style.stroke = 'var(--panel)'; });
    const pos = marks.map(k => ({ cx: X(-k.p.st.mdd), cy: Y(k.p.st.cagr) }));
    marks.forEach((k, n) => {
      const { cx, cy } = pos[n];
      if (k.shape === 'circle') { const c = svg('circle', { cx, cy, r: 7, 'stroke-width': 2.5 }, root); c.style.fill = k.color; c.style.stroke = 'var(--panel)'; }
      else { const d = svg('path', { d: `M${cx},${cy - 7}L${cx + 7},${cy}L${cx},${cy + 7}L${cx - 7},${cy}Z`, 'stroke-width': 2 }, root); d.style.fill = 'var(--panel)'; d.style.stroke = k.color; }
    });
    // labels: first free spot around each marker, avoiding other labels and markers
    const boxes = pos.map(q => ({ x: q.cx - 8, y: q.cy - 8, w: 16, h: 16 }));
    const hitBox = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const cand = [[11, -9, 'start'], [11, 15, 'start'], [-11, -9, 'end'], [-11, 15, 'end'], [11, -24, 'start'], [-11, -24, 'end'], [11, 30, 'start'], [-11, 30, 'end'], [11, -39, 'start'], [-11, -39, 'end']];
    marks.forEach((k, n) => {
      const { cx, cy } = pos[n]; const w = textW(k.label) + 2;
      let best = null;
      for (const [dx, dy, anchor] of cand) {
        const lx = cx + dx, ly = cy + dy; const bx = { x: anchor === 'start' ? lx : lx - w, y: ly - 11, w, h: 14 };
        if (bx.x < m.l || bx.x + bx.w > m.l + iw || bx.y < 0 || bx.y + bx.h > m.t + ih) continue;
        const clash = boxes.some((o2, q) => (q < pos.length ? q !== n : true) && hitBox(bx, o2));
        if (!best) best = { lx, ly, anchor, bx };
        if (!clash) { best = { lx, ly, anchor, bx }; break; }
      }
      if (!best) best = { lx: cx + 11, ly: cy - 9, anchor: 'start', bx: { x: cx + 11, y: cy - 20, w, h: 14 } };
      boxes.push(best.bx);
      const tx = svg('text', { x: best.lx, y: best.ly, 'text-anchor': best.anchor, 'font-size': 12, 'font-weight': 600 }, root); tx.textContent = k.label;
      tx.style.fill = 'var(--ink)'; tx.style.fontFamily = 'var(--font-sans)'; tx.style.paintOrder = 'stroke'; tx.style.stroke = 'var(--panel)'; tx.style.strokeWidth = '3px';
    });
    const li = (txt, style) => { const s = el('span'); const i = el('i'); Object.assign(i.style, style); s.append(i, document.createTextNode(txt)); lg.appendChild(s); };
    li('조합', { background: 'var(--dot)', height: '6px', width: '6px', borderRadius: '50%' });
    li('효율 경계', { background: 'var(--ink-2)' });
    li('AI 추천', { background: 'var(--p1)', height: '10px', width: '10px', borderRadius: '50%' });
    li('내 기준', { background: 'var(--p2)', height: '10px', width: '10px', borderRadius: '50%' });
    li('생애 주기 추천', { background: 'var(--panel)', height: '8px', width: '8px', border: '2px solid var(--ink)', transform: 'rotate(45deg)' });
    li(`MDD ${Math.round(lo * 100)}~${Math.round(hi * 100)}% 구간`, { background: 'var(--band)', height: '10px', width: '14px', border: '1px solid var(--line-2)' });
    cur.forEach(c => li(c.name, { background: c.color, height: '9px', width: '9px', borderRadius: '2px' }));
    // hover + click on the nearest drawn mix
    const hov = Array.from(new Set(ids.concat(marks.map(k => k.p.i))));
    const tip = el('div', 'tip'); tip.hidden = true; host.appendChild(tip);
    const ring = svg('circle', { r: 6, 'stroke-width': 2, fill: 'none', visibility: 'hidden' }, root); ring.style.stroke = 'var(--ink)';
    const cell = 12, grid = new Map();
    hov.forEach(i => { const k = Math.floor(X(-S.mdd[i]) / cell) + ',' + Math.floor(Y(S.cagr[i]) / cell); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    function nearest(sx, sy, far) {
      const gx = Math.floor(sx / cell), gy = Math.floor(sy / cell), R = far ? 3 : 1; let bi = -1, bd = far ? 1600 : 400;
      for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) {
        const a = grid.get((gx + dx) + ',' + (gy + dy)); if (!a) continue;
        for (const i of a) { const d = (X(-S.mdd[i]) - sx) ** 2 + (Y(S.cagr[i]) - sy) ** 2; if (d < bd) { bd = d; bi = i; } }
      }
      return bi;
    }
    const hit = svg('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent' }, root);
    let cur_i = -1;
    hit.addEventListener('pointermove', ev => {
      const r = root.getBoundingClientRect(); const sx = (ev.clientX - r.left) * (W / r.width), sy = (ev.clientY - r.top) * (HT / r.height);
      const i = nearest(sx, sy); cur_i = i;
      if (i < 0) { tip.hidden = true; ring.setAttribute('visibility', 'hidden'); return; }
      const p = BT.optPoint(H, i); const cx = X(-p.mdd), cy = Y(p.cagr);
      ring.setAttribute('cx', cx); ring.setAttribute('cy', cy); ring.setAttribute('visibility', 'visible');
      tip.innerHTML = ''; tip.appendChild(el('div', 't', `CAGR ${pct(p.cagr)} · MDD ${mpct(p.mdd)} · 최장 회복 ${uwTxt({ months: p.uw, ongoing: p.ong })}`));
      for (const [t, w] of p.w) { const row = el('div', 'r'); row.append(el('span', null, t), el('b', null, fmtW(w))); tip.appendChild(row); }
      tip.hidden = false; const px = cx * (r.width / W), py = cy * (r.height / HT); const tw = tip.offsetWidth;
      tip.style.left = (px + 14 + tw > r.width ? Math.max(0, px - tw - 14) : px + 14) + 'px'; tip.style.top = Math.max(0, py - 20) + 'px';
    });
    hit.addEventListener('pointerleave', () => { tip.hidden = true; ring.setAttribute('visibility', 'hidden'); cur_i = -1; });
    hit.addEventListener('click', ev => {
      const r = root.getBoundingClientRect(); const i = nearest((ev.clientX - r.left) * (W / r.width), (ev.clientY - r.top) * (HT / r.height), true);
      const j = i >= 0 ? i : cur_i; if (j >= 0) showFrontPick(H, j);
    });
  }
  function showFrontPick(H, i) {
    const p = BT.optPoint(H, i); const host = $('#front-pick'); host.innerHTML = '';
    const box = el('div', 'notice'); box.style.display = 'grid'; box.style.gap = '8px';
    box.appendChild(el('div', null, `선택한 조합 (${posLab(H)}) · CAGR ${pct(p.cagr)} · MDD ${mpct(p.mdd)} · 최장 회복 ${uwTxt({ months: p.uw, ongoing: p.ong })} · 샤프 ${num(p.sh)} — ` + p.w.map(([t, w]) => `${t} ${fmtW(w)}`).join(', ')));
    const stDiv = mixStats(H, p.w)[1];
    const dl = divLine(stDiv); if (dl) box.appendChild(dl);
    box.appendChild(applyRow(p.w, `선택한 조합 · ${posName(H)}` + (H.adjMap ? ' (추세 보정)' : ''), { cagr: p.cagr, mdd: p.mdd, uw: p.uw, ong: p.ong, from: BT.label(H.i0), to: BT.label(H.i1), real: state.opt.real, rule: state.opt.rule, adj: !!H.adjMap, dy: stDiv.income ? stDiv.income.ttmYield : null }));
    host.appendChild(box);
  }

  /* ---------- trend-kept check: recent surges replaced by each asset's own earlier trend ---------- */
  const famOf = t => (DATA.assets[t] && DATA.assets[t].tw) || t;
  function trendUniverse() {
    const set = new Set();
    state.ports.forEach(p => p.rows.forEach(r => { const t = r.t.trim().toUpperCase(); if (known(t)) set.add(t); }));
    if (state.bench && known(state.bench)) set.add(state.bench);
    state.optSel.forEach(t => { if (known(t)) set.add(t); });
    [...set].forEach(t => { if (BT.LEV[t]) set.add(BT.LEV[t][0]); });   // 3x funds follow their index
    return [...set];
  }
  function computeTrend(endArg) {
    const T = state.trend;
    const end = endArg != null ? endArg : (state.last ? state.last.e : null);
    if (end == null) { state.trendInfo = null; BT.setTrendAdjust([]); return; }
    const mode = state.ext ? 'ext' : 'etf';
    const scan = BT.trendScan(trendUniverse(), end, T.R, T.L, mode);
    const by = {}; scan.forEach(o => { by[o.t] = o; });
    const flagged = new Set();
    const decide = o => { const m = T.manual[famOf(o.t)]; if (m === true || (m !== false && o.auto)) flagged.add(o.t); };
    for (const o of scan) if (o.ok && !o.lev) { o.auto = o.gap >= T.thr; decide(o); }
    for (const o of scan) if (o.ok && o.lev) { o.auto = flagged.has(o.base); decide(o); }   // 3x funds follow their index
    const specs = [...flagged].map(t => {
      const o = by[t], sp = { t, r0: o.r0, r1: o.r1, l0: o.l0, l1: o.l1 };
      if (o.lev && flagged.has(o.base)) sp.link = { base: o.base, k: o.lev };
      return sp;
    });
    const adjRecent = BT.setTrendAdjust(T.on ? specs : []);
    const sig = {}; specs.forEach(sp => { sig[sp.t] = sp.link ? 'x' + sp.link.k + sp.link.base : 'own'; });
    state.trendInfo = { scan, by, flagged: T.on ? flagged : new Set(), adjRecent, end, sig,
      key: [T.on, end, mode, state.real, T.R, T.L, T.thr, T.on ? [...flagged].sort().join(',') : ''].join('|') };
  }
  const trendActive = () => !!(state.trendInfo && state.trendInfo.flagged.size);
  const usesAdjusted = tickers => tickers.some(t => BT.isAdjusted(t));

  function renderTrend() {
    const T = state.trend, I = state.trendInfo;
    const note = $('#tr-note'), list = $('#t-trend-list'), cmp = $('#t-trend-cmp');
    list.innerHTML = ''; cmp.innerHTML = '';
    $('#tr-cmp-wrap').hidden = !T.on;
    if (!I) { note.textContent = ''; return; }
    const yr = m => `${m / 12}년`;
    note.textContent = `${BT.label(I.end - T.R + 1)}–${BT.label(I.end)}(최근 ${yr(T.R)})의 연평균 수익률을 그 직전 ${yr(T.L)} 추세와 비교했어요. ` +
      (T.on ? (I.flagged.size ? `급등으로 보정하는 종목 ${[...new Set([...I.flagged].map(famOf))].length}개.` : '보정할 급등 종목이 없어요.') : '보정은 꺼져 있어요.') +
      (state.real ? ' 물가 반영 기준으로 비교합니다.' : '');
    // ---- the scan, one row per same-index family, biggest surge first
    const fams = new Map();
    for (const o of I.scan) { const f = famOf(o.t); if (!fams.has(f)) fams.set(f, []); fams.get(f).push(o); }
    const rows = [...fams.entries()].map(([f, os]) => ({ f, os, o: os.find(x => x.ok) || os[0] }))
      .sort((a, b) => (b.o.ok ? b.o.gap : -9) - (a.o.ok ? a.o.gap : -9));
    const shown = state.trendAll ? rows : rows.filter(r => r.o.ok && (I.flagged.has(r.o.t) || r.o.auto || T.manual[r.f] != null)).concat(rows.filter(r => r.o.ok && !I.flagged.has(r.o.t) && !r.o.auto && T.manual[r.f] == null).slice(0, 3));
    const thead = el('thead'), hr = el('tr');
    ['종목', `최근 ${yr(T.R)} 연수익률`, `직전 ${yr(T.L)} 추세`, '차이', '보정 후 최근', '보정'].forEach(h => hr.appendChild(el('th', null, h)));
    thead.appendChild(hr); list.appendChild(thead);
    const tb = el('tbody');
    for (const r of shown) {
      const o = r.o, tr = el('tr');
      const names = r.os.map(x => x.t).join('·');
      const th = el('th'); th.appendChild(el('b', null, names));
      if (DATA.assets[o.t]) th.appendChild(el('span', 'sub', DATA.assets[o.t].c));
      tr.appendChild(th);
      if (!o.ok) { const td = el('td', 'na', o.reason || '–'); td.colSpan = 5; tr.appendChild(td); tb.appendChild(tr); continue; }
      const labs = [`최근 ${yr(T.R)}`, `직전 ${yr(T.L)} 추세`, '차이', '보정 후 최근', '보정'];
      const tdR = el('td', null, spct(o.gR, 1)); tdR.dataset.label = labs[0]; tr.appendChild(tdR);
      const tdL = el('td', null, spct(o.gL, 1)); tdL.dataset.label = labs[1]; tr.appendChild(tdL);
      const dg = el('td', null, (o.gap >= 0 ? '+' : '−') + Math.abs(o.gap * 100).toFixed(1) + '%p'); dg.dataset.label = labs[2]; if (o.gap >= T.thr) dg.classList.add('neg'); tr.appendChild(dg);
      const on = I.flagged.has(o.t);
      const ar = I.adjRecent[o.t];
      const tdA = el('td', null, on && ar != null ? spct(ar, 1) : '–'); tdA.dataset.label = labs[3];
      if (on && o.lev && I.flagged.has(o.base)) tdA.appendChild(el('span', 'sub', `${o.base} 보정의 ${o.lev}배`));
      tr.appendChild(tdA);
      const tdC = el('td'); tdC.dataset.label = labs[4]; const lab = el('label', 'tr-chk'); const cb = el('input'); cb.type = 'checkbox'; cb.checked = on; cb.disabled = !T.on; cb.dataset.fam = r.f;
      cb.setAttribute('aria-label', `${names} 추세 보정`);
      lab.append(cb, el('span', null, on ? (o.auto ? '급등 · 보정' : '직접 선택') : (o.auto ? '제외함' : '보통')));
      tdC.appendChild(lab); tr.appendChild(tdC);
      if (on) tr.classList.add('flag');
      tb.appendChild(tr);
    }
    list.appendChild(tb);
    const okRows = rows.filter(r => r.o.ok).length;
    const more = $('#tr-more'); more.hidden = okRows <= shown.length && !state.trendAll;
    more.textContent = state.trendAll ? '급등 종목만 보기' : `전체 ${okRows}개 보기`;
    // ---- portfolios: actual vs trend-kept
    if (!T.on || !state.last) return;
    const { s, e, series } = state.last;
    const head = el('thead'), h2 = el('tr');
    ['포트폴리오', `최근 ${yr(T.R)} CAGR`, '최근 10년 CAGR', '전체 기간 CAGR', '전체 기간 MDD', '전체 기간 최장 회복'].forEach(h => h2.appendChild(el('th', null, h)));
    head.appendChild(h2); cmp.appendChild(head);
    const body = el('tbody');
    const pair = (td, a, b, fmt, lowerIsWorse) => {
      td.appendChild(el('span', null, fmt(a)));
      if (b == null || Math.abs(b - a) < 1e-9) { td.appendChild(el('span', 'sub', '변화 없음')); return; }
      const s2 = el('span', 'adjv', '→ ' + fmt(b)); if (lowerIsWorse ? b < a : b > a) s2.classList.add('neg'); td.appendChild(s2);
    };
    for (const x of series) {
      const tr = el('tr'); const th = el('th'); const sh = el('span', 'serieshead'); const k = el('span', 'key'); k.style.background = x.color; sh.append(k, document.createTextNode(x.name)); th.appendChild(sh); tr.appendChild(th);
      const hit = x.tickers.filter(t => BT.isAdjusted(t));
      if (!hit.length) { const td = el('td', 'na', '급등 종목이 없어 결과가 같아요'); td.colSpan = 5; td.style.textAlign = 'left'; tr.appendChild(td); body.appendChild(tr); continue; }
      th.appendChild(el('span', 'sub', '보정 종목: ' + hit.join(', ')));
      const rule = x.bench ? 'N' : state.rebal;
      const tA = BT.trailing(x.tickers, x.weights, s, e, rule, [T.R / 12, 10], false, state.div), tB = BT.trailing(x.tickers, x.weights, s, e, rule, [T.R / 12, 10], true, state.div);
      // explicit actual vs trend-kept runs (the results above may already be on the trend-kept data)
      const stA = BT.stats(BT.backtest(x.tickers, x.weights, s, e, rule, false, state.div));
      const stB = BT.stats(BT.backtest(x.tickers, x.weights, s, e, rule, true, state.div));
      const cl = [`최근 ${yr(T.R)} CAGR`, '최근 10년 CAGR', '전체 기간 CAGR', '전체 기간 MDD', '전체 기간 최장 회복'];
      const c1 = el('td'); c1.dataset.label = cl[0]; tA[0].ok ? pair(c1, tA[0].cagr, tB[0].cagr, v => pct(v, 1), true) : c1.appendChild(el('span', 'na', '기간 부족')); tr.appendChild(c1);
      const c2 = el('td'); c2.dataset.label = cl[1]; tA[1].ok ? pair(c2, tA[1].cagr, tB[1].cagr, v => pct(v, 1), true) : c2.appendChild(el('span', 'na', '기간 부족')); tr.appendChild(c2);
      const c3 = el('td'); c3.dataset.label = cl[2]; pair(c3, stA.cagr, stB.cagr, v => pct(v, 2), true); tr.appendChild(c3);
      const c4 = el('td'); c4.dataset.label = cl[3]; pair(c4, stA.mdd, stB.mdd, v => mpct1(v), true); tr.appendChild(c4);
      const c5 = el('td'); c5.dataset.label = cl[4]; pair(c5, stA.uw.months, stB.uw.months, v => (v ? dur(v) : '없음'), false); tr.appendChild(c5);
      body.appendChild(tr);
    }
    cmp.appendChild(body);
  }
  function trendChanged() {
    if (!state.trend.on) state.dataAdj = false;
    // results may run on the trend-kept data and the period check compares both, so redo everything (cheap)
    recompute();
  }
  $('#tr-on').addEventListener('change', e => { state.trend.on = e.target.checked; trendChanged(); });
  $('#tr-r').addEventListener('change', e => { state.trend.R = +e.target.value; state.trend.manual = {}; trendChanged(); });
  $('#tr-l').addEventListener('change', e => { state.trend.L = +e.target.value; trendChanged(); });
  $('#tr-thr').addEventListener('change', e => { state.trend.thr = +e.target.value / 100; state.trend.manual = {}; trendChanged(); });
  $('#tr-more').addEventListener('click', () => { state.trendAll = !state.trendAll; renderTrend(); });
  $('#t-trend-list').addEventListener('change', e => {
    const cb = e.target; if (!cb.dataset || !cb.dataset.fam) return;
    const f = cb.dataset.fam, I = state.trendInfo;
    const o = I && I.scan.find(x => famOf(x.t) === f && x.ok);
    if (o && cb.checked === !!o.auto) delete state.trend.manual[f]; else state.trend.manual[f] = cb.checked;
    trendChanged();
  });

  /* ---------- optimizer on trend-kept data, shown next to the actual-data results ---------- */
  /* the three plans (10·20·30 years) shown below: chosen position, actual or trend-kept data */
  function viewPlans() {
    const o = state.opt; if (!o) return [];
    const src = (state.optView === 'adj' && o.resAdj) ? o.resAdj : o.res;
    return HZ.map(Y => planOf(src, state.optPos, Y) || planOf(o.res, state.optPos, Y) ||
      { years: Y, pos: state.optPos, ok: false, i0: -1, i1: -1, excluded: [], merged: [], reason: state.optPos === 'old' && !o.oldDone ? '가장 과거 구간을 계산하는 중이에요…' : '계산 전이에요' });
  }
  /* the adjusted search only depends on which of the optimizer's own tickers are adjusted, and how */
  function adjKeyNow() {
    const o = state.opt, I = state.trendInfo, T = state.trend;
    if (!o || !I) return '';
    const hit = o.tickers.filter(t => BT.isAdjusted(t)).sort().map(t => t + ':' + (I.sig[t] || ''));
    return [T.on, I.end, o.mode, state.real, T.R, T.L, hit.join(',')].join('|');
  }
  let adjTimer = null;
  function scheduleAdj() {
    clearTimeout(adjTimer);
    adjTimer = setTimeout(function go() {
      const o = state.opt; if (!o || o.key !== optKey()) return;   // the main result is stale too: one run redoes both
      if (optBusy) { adjTimer = setTimeout(go, 500); return; }
      if ((o.adjKey || '') !== adjKeyNow()) runOptAdj();
    }, 700);
  }
  function markAdjStale() {
    const o = state.opt; if (!o) return;
    const stale = (o.adjKey || '') !== adjKeyNow();
    if (!stale) return;
    const hit = o.tickers.some(t => BT.isAdjusted(t));
    if (!state.trend.on || !hit) {
      o.resAdj = null; o.adjKey = adjKeyNow(); state.optView = 'actual';
      $('#o-adj-note').textContent = !state.trend.on ? '추세 보정이 꺼져 있어요. ‘점검 › 추세 유지 보정’에서 켤 수 있어요.' : '대상 자산 중 급등으로 보정한 종목이 없어 보정 전후 결과가 같아요.';
      $('#o-adj-rerun').hidden = true; renderAdjCompare(); renderOptResults(); return;
    }
    if (o.key !== optKey()) {
      $('#o-adj-note').textContent = '설정이 바뀌었어요. ‘최적 비중 찾기’를 누르면 실제 데이터와 추세 보정 결과를 함께 다시 계산합니다.';
      $('#o-adj-rerun').hidden = true; return;
    }
    $('#o-adj-note').textContent = '추세 보정 기준이나 대상 종목이 바뀌어 보정 결과를 다시 계산해요…';
    $('#o-adj-rerun').hidden = false;
    scheduleAdj();
  }
  async function runOptAdj(fromRunOpt) {
    const o = state.opt; if (!o || optBusy) return;
    const st = $('#o-adj-note');
    o.resAdj = null; o.adjKey = adjKeyNow();
    const universeHit = o.tickers.some(t => BT.isAdjusted(t));
    if (!state.trend.on || !universeHit) {
      state.optView = 'actual';
      st.textContent = state.trend.on ? '대상 자산 중 급등으로 보정한 종목이 없어 보정 전후 결과가 같아요.' : '추세 보정이 꺼져 있어요(‘점검 › 추세 유지 보정’).';
      renderAdjCompare(); return;
    }
    optBusy = true; $('#o-run').disabled = true; $('#o-adj-rerun').disabled = true;
    const prog = $('#o-prog');
    try {
      // windows that end before the adjusted (recent) months give the same result, so they are reused as is
      const r0 = state.trendInfo ? state.trendInfo.end - state.trend.R + 1 : o.end - state.trend.R + 1;
      const wins = optWindows(o.s, o.end).filter(w => !w.reason && w.i1 >= r0);
      const r = await BT.optimizeHorizons({ tickers: o.tickers, windows: wins, rule: o.rule, mode: o.mode, step: o.step, maxW: o.maxW, crits: currentCrits(), adj: true }, (f, y, pos) => {
        prog.style.width = (f * 100).toFixed(1) + '%';
        if (y) st.textContent = `추세 보정 데이터로 ${POS_TXT[pos || 'recent']} ${y}년 구간 다시 계산 중… (${Math.round(f * 100)}%)`;
      });
      r.plans = o.res.plans.map(P => r.plans.find(Q => Q.id === P.id) || P);
      o.resAdj = r;
    } catch (err) { st.textContent = '보정 결과 계산 중 문제가 생겼어요: ' + err.message; o.resAdj = null; }
    optBusy = false; $('#o-run').disabled = false; $('#o-adj-rerun').disabled = false; $('#o-adj-rerun').hidden = true;
    if (state.rerun && !fromRunOpt) { state.rerun = false; runOpt(); return; }
    if (o.resAdj) { pickAll(); st.textContent = ''; }
    renderAdjCompare(); renderOptResults();
    flushCrit();
  }
  $('#o-adj-rerun').addEventListener('click', () => { if (state.opt && state.opt.key === optKey()) runOptAdj(); else runOpt(); });
  document.querySelectorAll('#o-view button').forEach(b => b.addEventListener('click', () => {
    state.optView = b.dataset.v; state.lifeSel = null; $('#front-pick').innerHTML = '';
    document.querySelectorAll('#o-view button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    renderOptResults();
  }));
  function renderAdjCompare() {
    const o = state.opt, host = $('#o-adj-cmp'); host.innerHTML = '';
    const has = !!(o && o.resAdj);
    $('#o-view').hidden = !has;
    if (!has) { state.optView = 'actual'; return; }
    document.querySelectorAll('#o-view button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === state.optView ? 'true' : 'false'));
    const adjT = new Set(o.tickers.filter(t => o.resAdj.adj && o.resAdj.adj[t]));
    $('#o-adj-note').textContent = `보정한 종목: ${[...adjT].join(', ')}. 같은 자산·기준으로 두 데이터에서 각각 찾은 최적 비중이에요. 보정 쪽에서 비중이 크게 줄어드는 종목은 최근 급등 덕분에 뽑혔던 것일 수 있어요.`;
    const t = el('table', 'adjcmp'); const thead = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '기준'));
    HZ.forEach(Y => { const th = el('th', 'grp', `${POS_TXT[state.optPos]} ${Y}년`); const P = planOf(o.res, state.optPos, Y); th.appendChild(el('span', 'when', P && P.i0 >= 0 ? `${BT.label(P.i0)}–${BT.label(P.i1)}` : '')); hr.appendChild(th); });
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody');
    for (const c of currentCrits()) {
      const tr = el('tr'); tr.appendChild(el('th', 'wname', critLabel(c)));
      HZ.forEach(Y => {
        const td = el('td');
        const A = planOf(o.res, state.optPos, Y), B = planOf(o.resAdj, state.optPos, Y);
        td.appendChild(capOf(`${POS_TXT[state.optPos]} ${Y}년`, A && A.i0 >= 0 ? `${BT.label(A.i0)}–${BT.label(A.i1)}` : ''));
        if (!A || !A.ok || !B || !B.ok) { td.appendChild(el('span', 'na', A && A.reason && !A.ok ? '계산 불가' : '계산 전')); tr.appendChild(td); return; }
        if (A === B) { td.appendChild(el('span', 'na', '추세 보정 구간(최근 몇 년)과 겹치지 않아 결과가 같아요')); tr.appendChild(td); return; }
        const line = (lab, pk) => {
          const d = el('div', 'ac-l'); d.appendChild(el('span', 'wk', lab));
          if (!pk) { d.appendChild(el('span', 'na', '–')); return d; }
          const v = el('span', 'wv', `CAGR ${pct(pk.st.cagr, 1)} · MDD ${mpct1(pk.st.mdd)}`); d.appendChild(v);
          const w = el('div', 'ac-w');
          pk.w.slice(0, 5).forEach(([tk, x], i) => { if (i) w.appendChild(document.createTextNode(' · ')); const sp = el(adjT.has(tk) ? 'b' : 'span', adjT.has(tk) ? 'hot' : null, `${tk} ${fmtW(x)}`); w.appendChild(sp); });
          if (pk.w.length > 5) w.appendChild(document.createTextNode(` 외 ${pk.w.length - 5}개`));
          d.appendChild(w); if (!pk.feasible) d.appendChild(el('span', 'badge warn', '조건 밖 · 가장 가까운 조합'));
          return d;
        };
        const pa = A.picks && A.picks[c.id], pb = B.picks && B.picks[c.id];
        td.append(line('실제', pa), line('보정', pb));
        if (pa && pb) {
          const hotA = pa.w.filter(([tk]) => adjT.has(tk)).reduce((s2, x) => s2 + x[1], 0), hotB = pb.w.filter(([tk]) => adjT.has(tk)).reduce((s2, x) => s2 + x[1], 0);
          const tags = el('div', 'row');
          const same = pa.w.length === pb.w.length && pa.w.every(([tk, x], i) => pb.w[i][0] === tk && Math.abs(pb.w[i][1] - x) < 1e-9);
          const dc = pb.st.cagr - pa.st.cagr;
          tags.appendChild(same ? el('span', 'tag', '같은 비중') : Math.abs(dc) < SAME ? el('span', 'tag', 'CAGR 같음') : el('span', dc < 0 ? 'tag no' : 'tag ok', `CAGR ${ppTxt(dc)}`));
          if (Math.abs(hotB - hotA) > 1e-9) tags.appendChild(el('span', 'tag hot', `보정 종목 비중 ${fmtW(hotA)} → ${fmtW(hotB)}`));
          td.appendChild(tags);
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
    t.appendChild(tb); const wrap = el('div', 'tbl-wrap'); wrap.appendChild(t); host.appendChild(wrap);
  }

  /* ---------- the oldest vs the most recent 10·20·30 years: does the best mix stay the same? ---------- */
  const famW = w => { const m = new Map(); for (const [t, x] of w) { const f = famOf(t); m.set(f, (m.get(f) || 0) + x); } return m; };
  function overlapW(a, b) { const A = famW(a), B = famW(b); let s2 = 0; for (const [f, x] of A) s2 += Math.min(x, B.get(f) || 0); return s2; }
  function renderEraCompare() {
    const host = $('#o-era'), note = $('#o-era-note'); host.innerHTML = '';
    const o = state.opt;
    if (!o) { note.textContent = '‘최적 비중 찾기’를 실행하면 분석 기간의 가장 과거 구간과 최근 구간에서 찾은 최적 비중을 나란히 비교해요.'; return; }
    if (!o.oldDone) { note.textContent = '가장 과거 구간을 계산하는 중이에요… 최근 구간 결과는 아래에 먼저 나와 있어요.'; return; }
    note.textContent = `같은 자산·기준으로 분석 기간(${BT.label(o.s)}~${BT.label(o.end)})의 맨 앞과 맨 뒤 구간에서 각각 찾은 최적 비중이에요. ‘겹치는 비중’이 낮을수록 최적 비중이 시대에 따라 크게 바뀐다는 뜻이라, 한 구간의 결과만 믿고 정하기 어렵다는 신호예요.`;
    const t = el('table', 'adjcmp eracmp'); const thead = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '기준'));
    HZ.forEach(Y => {
      const A = planOf(o.res, 'recent', Y), B = planOf(o.res, 'old', Y);
      const th = el('th', 'grp', `${Y}년 구간`);
      if (B && B.i0 >= 0 && !B.reason) th.appendChild(el('span', 'when', `과거 ${BT.label(B.i0)}–${BT.label(B.i1)}`));
      if (A && A.i0 >= 0) th.appendChild(el('span', 'when', `최근 ${BT.label(A.i0)}–${BT.label(A.i1)}`));
      hr.appendChild(th);
    });
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody');
    for (const c of currentCrits()) {
      const tr = el('tr'); tr.appendChild(el('th', 'wname', critLabel(c)));
      HZ.forEach(Y => {
        const td = el('td');
        const A = planOf(o.res, 'recent', Y), B = planOf(o.res, 'old', Y);
        td.appendChild(capOf(`${Y}년 구간`, [B && B.i0 >= 0 && !B.reason ? `과거 ${BT.label(B.i0)}–${BT.label(B.i1)}` : '', A && A.i0 >= 0 ? `최근 ${BT.label(A.i0)}–${BT.label(A.i1)}` : ''].filter(Boolean).join(' · ')));
        if (!B || !B.ok) { td.appendChild(el('span', 'na', B && B.reason ? B.reason : '계산 불가')); tr.appendChild(td); return; }
        if (!A || !A.ok) { td.appendChild(el('span', 'na', A && A.reason ? A.reason : '계산 불가')); tr.appendChild(td); return; }
        if (A.i0 === B.i0) { td.appendChild(el('span', 'na', `분석 기간이 ${Y}년이라 두 구간이 같아요`)); tr.appendChild(td); return; }
        const line = (lab, P, pk) => {
          const d = el('div', 'ac-l'); d.appendChild(el('span', 'wk', lab));
          if (!pk) { d.appendChild(el('span', 'na', '–')); return d; }
          d.appendChild(el('span', 'wv', `CAGR ${pct(pk.st.cagr, 1)} · MDD ${mpct1(pk.st.mdd)}`));
          const w = el('div', 'ac-w', pk.w.slice(0, 5).map(([tk, x]) => `${tk} ${fmtW(x)}`).join(' · ') + (pk.w.length > 5 ? ` 외 ${pk.w.length - 5}개` : ''));
          d.appendChild(w); if (!pk.feasible) d.appendChild(el('span', 'badge warn', '조건 밖 · 가장 가까운 조합'));
          return d;
        };
        const pa = A.picks && A.picks[c.id], pb = B.picks && B.picks[c.id];
        td.append(line('과거', B, pb), line('최근', A, pa));
        if (pa && pb) {
          const ov = overlapW(pa.w, pb.w);
          const tags = el('div', 'row');
          tags.appendChild(el('span', ov >= 0.6 ? 'tag ok' : ov < 0.3 ? 'tag no' : 'tag', `겹치는 비중 ${Math.round(ov * 100)}%`));
          const yrs = Math.max(0, B.i1 - A.i0 + 1);
          if (yrs > 0) tags.appendChild(el('span', 'tag', `두 구간 ${monthsTxt(yrs)} 겹침`));
          td.appendChild(tags);
        }
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
    t.appendChild(tb); const wrap = el('div', 'tbl-wrap'); wrap.appendChild(t); host.appendChild(wrap);
  }
  function setOptPos(p) {
    if (state.optPos === p) return;
    state.optPos = p; state.lifeSel = null; $('#front-pick').innerHTML = '';
    document.querySelectorAll('#o-pos button').forEach(b => b.setAttribute('aria-pressed', b.dataset.p === p ? 'true' : 'false'));
    const vp = viewPlans(); if (!vp[state.optTab] || !vp[state.optTab].ok) state.optTab = Math.max(0, vp.findIndex(P => P.ok));
    renderPosNote(); renderOptResults(); renderAdjCompare();
  }
  function renderPosNote() {
    const n = $('#o-pos-note'); if (!n) return;
    n.textContent = state.optPos === 'old' ? `분석 시작(${state.last ? BT.label(state.last.s) : '–'})부터 10·20·30년 구간이에요. 시작 시점은 ‘입력 › 기간과 금액’에서 바꿀 수 있어요.` : `분석 종료(${state.last ? BT.label(state.last.e) : '–'})까지의 10·20·30년 구간이에요.`;
  }
  document.querySelectorAll('#o-pos button').forEach(b => b.addEventListener('click', () => setOptPos(b.dataset.p)));

  /* ---------- walk-forward check: would the same rule have worked on the next period? ---------- */
  const BASES = [['60/40 (SPY·IEF)', ['SPY', 'IEF'], [0.6, 0.4]], ['영구 포트폴리오 (SPY·TLT·GLD·BIL 25%씩)', ['SPY', 'TLT', 'GLD', 'BIL'], [0.25, 0.25, 0.25, 0.25]]];
  function critLabel(c) {
    if (c.kind === 'ai') return 'AI 추천';
    if (c.kind === 'range') return `내 기준 · MDD ${Math.round(c.lo * 100)}~${Math.round(c.hi * 100)}%`;
    const s = state.stages.find(x => x.id === c.id);
    return `${s ? s.name : c.id} · MDD ${Math.round(c.cap * 100)}%·회복 ${+(c.uw / 12).toFixed(1)}년`;
  }
  function overLimits(c, b) {
    const out = [];
    if (c.kind === 'cap' && b.mdd < -c.cap - 1e-9) out.push('MDD 한도 초과');
    if (c.kind === 'range' && b.mdd < -c.hi - 1e-9) out.push('MDD 상한 초과');
    if (c.uw > 0 && b.uw.months > c.uw) out.push('회복 한도 초과');
    return out;
  }
  function clearWalk() { state.walk = null; renderWalk(); }
  function markWalkStale() { if (state.walk) $('#w-status').textContent = '기준이 바뀌었어요. ‘점검 실행’을 다시 누르면 새 기준으로 점검합니다.'; }
  async function runWalk() {
    const st = $('#w-status');
    if (optBusy) { state.walkQueued = true; st.textContent = '최적화 계산이 끝나면 바로 점검할게요…'; return; }
    state.walkQueued = false;
    const o = state.opt;
    if (!o) { st.textContent = '먼저 위에서 ‘최적 비중 찾기’를 실행해 주세요.'; return; }
    if (o.key !== optKey()) { st.textContent = '최적화 설정이 바뀌었어요. ‘최적 비중 찾기’를 먼저 다시 실행해 주세요.'; return; }
    const crits = currentCrits();
    optBusy = true; $('#w-run').disabled = true; $('#o-run').disabled = true;
    const out = [];
    try {
      for (const Y of [10, 20]) {
        const trainEnd = o.end - Y * 12, t0 = trainEnd + 1, t1 = o.end, i0 = trainEnd - Y * 12 + 1;
        const res = await BT.optimizeHorizons({ tickers: o.tickers, end: trainEnd, horizons: [Y], rule: o.rule, mode: o.mode, step: o.step, maxW: o.maxW, crits },
          f => { st.textContent = `직전 ${Y}년(${BT.label(Math.max(0, i0))}–${BT.label(trainEnd)})에서 같은 기준으로 비중을 고르는 중… ${Math.round(f * 100)}%`; });
        const H = res.plans[0];
        const row = { Y, i0, trainEnd, t0, t1, ok: H.ok, reason: H.reason, K: H.K, rows: [], base: [] };
        if (H.ok) {
          for (const c of crits) {
            const sel = BT.optSelect(H, c), p = BT.optPoint(H, sel.i);
            const tk = p.w.map(x => x[0]), w = p.w.map(x => x[1]);
            const a = BT.stats(BT.backtest(tk, w, H.i0, H.i1, o.rule));
            const [cs, ce] = BT.commonRange(tk, o.mode);
            const b = cs <= t0 && ce >= t1 ? BT.stats(BT.backtest(tk, w, t0, t1, o.rule)) : null;
            row.rows.push({ c, feasible: sel.feasible, w: p.w, a, b });
          }
        }
        for (const [nm, tk, w] of BASES) {
          const [cs, ce] = BT.commonRange(tk, o.mode);
          if (i0 < 0 || cs > i0 || ce < t1) continue;
          row.base.push({ nm, a: BT.stats(BT.backtest(tk, w, i0, trainEnd, o.rule)), b: BT.stats(BT.backtest(tk, w, t0, t1, o.rule)) });
        }
        out.push(row);
      }
    } catch (err) { st.textContent = '점검 중 문제가 생겼어요: ' + err.message; }
    finally { optBusy = false; $('#w-run').disabled = false; $('#o-run').disabled = false; }
    if (state.rerun) { state.rerun = false; runOpt(); return; }
    if (out.length) { state.walk = { out }; renderWalk(); }
    flushCrit();
  }
  $('#w-run').addEventListener('click', runWalk);
  function walkCell(td, r) {
    const line = (lab, s, bad) => {
      const d = el('div', 'wl'); d.appendChild(el('span', 'wk', lab));
      const v = el('span', 'wv', [`CAGR ${pct(s.cagr, 1)}`, `MDD ${mpct1(s.mdd)}`, `회복 ${uwTxt(s.uw)}`].map(nbsp).join(' · ')); if (bad) v.classList.add('neg');
      d.appendChild(v); return d;
    };
    td.appendChild(line('고를 때', r.a, false));
    if (!r.b) { td.appendChild(el('div', 'na', '최근 구간 데이터 부족')); return; }
    const over = r.c ? overLimits(r.c, r.b) : [];
    td.appendChild(line('그 뒤', r.b, over.length > 0));
    const d = r.b.cagr - r.a.cagr;
    const tags = el('div', 'row');
    tags.appendChild(Math.abs(d) < SAME ? el('span', 'tag', 'CAGR 같음') : el('span', d < 0 ? 'tag no' : 'tag ok', `CAGR ${ppTxt(d)}`));
    over.forEach(x => tags.appendChild(el('span', 'tag no', x)));
    if (r.c && !r.feasible) tags.appendChild(el('span', 'badge warn', '고를 때도 한도 밖'));
    td.appendChild(tags);
    if (r.w) td.appendChild(el('div', 'ww', r.w.slice(0, 5).map(([t, w]) => `${t} ${fmtW(w)}`).join(' · ') + (r.w.length > 5 ? ` 외 ${r.w.length - 5}개` : '')));
  }
  const walkCap = r => capOf(`${r.Y}년 점검`, r.i0 >= 0 ? `고른 구간 ${BT.label(r.i0)}–${BT.label(r.trainEnd)} → 그 뒤 ${BT.label(r.t0)}–${BT.label(r.t1)}` : '');
  function renderWalk() {
    const t = $('#w-table'), st = $('#w-status'), sm = $('#w-sum'); t.innerHTML = ''; sm.textContent = '';
    const w = state.walk;
    if (!w) { st.textContent = state.walkQueued ? '최적화 계산이 끝나면 바로 점검할게요…' : state.opt ? '‘점검 실행’을 누르면 계산합니다. 몇 초 걸려요.' : ''; return; }
    st.textContent = '';
    const thead = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '기준'));
    w.out.forEach(r => {
      const th = el('th', 'grp', `${r.Y}년 점검`);
      th.appendChild(el('span', 'when', r.i0 >= 0 ? `고른 구간 ${BT.label(r.i0)}–${BT.label(r.trainEnd)} → 그 뒤 ${BT.label(r.t0)}–${BT.label(r.t1)}` : ''));
      hr.appendChild(th);
    });
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody');
    const n = Math.max(...w.out.map(r => r.rows.length));
    for (let k = 0; k < n; k++) {
      const c = (w.out.find(r => r.rows[k]) || {}).rows[k].c;
      const tr = el('tr'); tr.appendChild(el('th', 'wname', critLabel(c)));
      w.out.forEach(r => {
        const td = el('td'); td.appendChild(walkCap(r));
        if (!r.ok) td.appendChild(el('span', 'na', r.reason || '계산 불가'));
        else walkCell(td, r.rows[k]);
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    }
    BASES.forEach(([nm]) => {
      const tr = el('tr', 'base'); tr.appendChild(el('th', 'wname', '비교: ' + nm));
      w.out.forEach(r => {
        const td = el('td'); td.appendChild(walkCap(r));
        const b = r.base.find(x => x.nm === nm);
        if (!b) td.appendChild(el('span', 'na', '데이터 부족')); else walkCell(td, { a: b.a, b: b.b });
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    const parts = []; let dsum = 0, dn = 0;
    w.out.forEach(r => {
      if (!r.ok) return;
      const lim = r.rows.filter(x => x.b && x.feasible && (x.c.kind === 'cap' || x.c.kind === 'range' || x.c.uw > 0));
      const bad = lim.filter(x => overLimits(x.c, x.b).length);
      parts.push(`${r.Y}년 점검 ${bad.length}/${lim.length}개`);
      r.rows.forEach(x => { if (x.b) { dsum += x.b.cagr - x.a.cagr; dn++; } });
    });
    if (parts.length) {
      const avg = dn ? dsum / dn : 0;
      sm.textContent = `고를 때 한도를 지켰던 비중 중 그 뒤 구간에서 한도를 넘은 경우: ${parts.join(', ')}. 그 뒤 구간의 CAGR은 고를 때보다 평균 ${Math.abs(avg * 100).toFixed(1)}%p ${avg < 0 ? '낮았어요' : '높았어요'}. 한도를 넘는 경우가 많다면 최적화 결과의 MDD를 그대로 믿기보다 여유를 두세요.`;
    }
  }

  /* ---------- saved portfolios ---------- */
  const LS_KEY = 'etf-backtester.saved.v1';
  const SV = { mode: 'local', items: [], col: null, unsub: null, canConnect: false, lsOK: true, dl: null };
  const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function lsRead() { try { const s = window.localStorage.getItem(LS_KEY); const a = s ? JSON.parse(s) : []; return Array.isArray(a) ? a : []; } catch (_) { return null; } }
  function lsWrite(a) { try { window.localStorage.setItem(LS_KEY, JSON.stringify(a)); return true; } catch (_) { return false; } }
  const TK_RE = /^[A-Z0-9.\-^=]{1,12}$/;
  function cleanItem(x) {
    if (!x || typeof x !== 'object' || !Array.isArray(x.rows)) return null;
    const rows = x.rows.map(r => (Array.isArray(r) ? { t: r[0], w: r[1] } : r))
      .filter(r => r && typeof r.t === 'string' && TK_RE.test(r.t.toUpperCase()) && isFinite(+r.w) && +r.w > 0)
      .map(r => ({ t: r.t.toUpperCase(), w: Math.round(+r.w * 100) / 100 }));
    const sum = rows.reduce((a, r) => a + r.w, 0);
    if (!rows.length || rows.length > 20 || Math.abs(sum - 100) > 0.5) return null;
    const sn = x.snap && typeof x.snap === 'object' ? x.snap : null;
    const numOr = v => (typeof v === 'number' && isFinite(v) ? v : null);
    return {
      v: 1, kind: 'portfolio', name: String(x.name || '저장한 포트폴리오').slice(0, 60), rows,
      rule: REBAL_TXT[x.rule] ? x.rule : 'A', src: String(x.src || '').slice(0, 60), at: typeof x.at === 'string' ? x.at.slice(0, 40) : new Date().toISOString(),
      snap: sn ? { cagr: numOr(sn.cagr), mdd: numOr(sn.mdd), uw: numOr(sn.uw), ong: !!sn.ong, from: String(sn.from || '').slice(0, 7), to: String(sn.to || '').slice(0, 7), real: !!sn.real, adj: !!sn.adj, rule: REBAL_TXT[sn.rule] ? sn.rule : null, div: !!sn.div, dy: numOr(sn.dy) } : null
    };
  }
  function loadLocal() { const a = lsRead(); if (a === null) { SV.lsOK = false; return; } SV.items = a.map(x => Object.assign(cleanItem(x) || {}, { id: x.id })).filter(x => x.rows); }
  function flashSaved(msg) {
    const m = $('#sv-msg'); m.textContent = msg; clearTimeout(flashSaved.t); flashSaved.t = setTimeout(() => { m.textContent = ''; }, 4000);
    if (!isShown(m)) toast(msg);   // the saved list is folded or on another tab: say it where it can be seen
  }
  function toLocal(note) {
    if (SV.unsub) { try { SV.unsub(); } catch (_) {} }
    SV.unsub = null; SV.col = null; SV.mode = 'local'; loadLocal(); renderSaved(); if (note) flashSaved(note);
  }
  async function saveItem(raw) {
    const item = cleanItem(Object.assign({}, raw, { at: new Date().toISOString() }));
    if (!item) { flashSaved('비중 합계가 100%인 포트폴리오만 저장할 수 있어요.'); return false; }
    if (SV.mode === 'account' && SV.col) {
      for (let tryN = 0; tryN < 2; tryN++) {
        try { await SV.col.doc(newId()).set(item); flashSaved(`‘${item.name}’${eul(item.name)} 내 계정에 저장했어요.`); return true; }
        catch (e) {
          const code = e && e.code;
          if (code === 'quota_exceeded') { flashSaved('저장 공간이 꽉 찼어요. 오래된 항목을 지운 뒤 다시 저장해 주세요.'); return false; }
          if (code === 'unavailable' && tryN === 0) { await new Promise(r => setTimeout(r, 400 + Math.random() * 400)); continue; }
          toLocal('내 계정에 저장할 수 없어 이 기기에 저장해요.'); break;
        }
      }
    }
    item.id = newId(); SV.items.unshift(item);
    if (!lsWrite(SV.items)) SV.lsOK = false;
    renderSaved(); flashSaved(SV.lsOK ? `‘${item.name}’${eul(item.name)} 이 기기에 저장했어요.` : '이 브라우저는 저장을 막고 있어 창을 닫으면 사라져요. 내보내기로 보관하세요.');
    return true;
  }
  async function deleteItem(id) {
    if (SV.mode === 'account' && SV.col) { try { await SV.col.doc(id).delete(); return; } catch (_) { flashSaved('삭제하지 못했어요. 잠시 뒤 다시 해 주세요.'); return; } }
    SV.items = SV.items.filter(x => x.id !== id); lsWrite(SV.items); renderSaved();
  }
  const renameTimers = {};
  function renameItem(id, name) {
    const it = SV.items.find(x => x.id === id); if (!it) return;
    it.name = name.slice(0, 60);
    clearTimeout(renameTimers[id]);
    renameTimers[id] = setTimeout(async () => {
      if (SV.mode === 'account' && SV.col) { try { await SV.col.doc(id).update({ name: it.name }); } catch (_) {} }
      else lsWrite(SV.items);
    }, 600);
  }
  function snapLine(sn) {
    if (!sn || sn.cagr == null) return '';
    return `CAGR ${pct(sn.cagr)} · MDD ${mpct(sn.mdd)} · 최장 회복 ${sn.uw ? dur(sn.uw) + (sn.ong ? '+' : '') : '없음'}` + (sn.dy != null ? ` · 최근 1년 배당률 ${pct(sn.dy, 1)}` : '');
  }
  function renderSaved() {
    const host = $('#sv-list'); host.innerHTML = '';
    $('#sv-count').textContent = SV.items.length ? `${SV.items.length}개` : '';
    $('#sv-where').textContent = SV.mode === 'account'
      ? '저장 위치: 내 claude.ai 계정 — 로그인한 다른 기기(휴대폰·PC)에서 이 페이지를 열어도 같은 목록이 보이고, 다른 사람에게는 보이지 않아요.'
      : SV.lsOK ? '저장 위치: 이 기기의 브라우저 — 다른 사람과 섞이지 않아요. 기기를 바꾸거나 브라우저 기록을 지우기 전에는 ‘내보내기’ 코드로 옮겨 두세요.'
        : '이 브라우저는 저장소를 막고 있어 창을 닫으면 목록이 사라져요. ‘내보내기’ 코드로 보관하세요.';
    const extra = $('#sv-extra'); extra.innerHTML = '';
    if (SV.canConnect && SV.mode === 'local') {
      const b = el('button', 'btn ghost sm', '내 계정에 저장하기 (기기 간 동기화)'); b.type = 'button';
      b.addEventListener('click', () => connectAccount(true)); extra.appendChild(b);
    }
    if (SV.mode === 'account') {
      const loc = (lsRead() || []).filter(x => cleanItem(x));
      if (loc.length) {
        const b = el('button', 'btn ghost sm', `이 기기에만 있는 ${loc.length}개를 계정으로 옮기기`); b.type = 'button';
        b.addEventListener('click', async () => {
          b.disabled = true; let ok = 0;
          for (const x of loc) { try { await SV.col.doc(newId()).set(cleanItem(x)); ok++; } catch (_) { break; } }
          if (ok === loc.length) lsWrite([]);
          flashSaved(`${ok}개를 계정으로 옮겼어요.`); renderSaved();
        });
        extra.appendChild(b);
      }
    }
    if (!SV.items.length) { host.appendChild(el('p', 'empty', '아직 저장한 포트폴리오가 없어요. 포트폴리오 카드나 최적화 결과에 있는 ‘저장’ 버튼을 누르면 여기에 모여요.')); return; }
    for (const it of SV.items) {
      const card = el('div', 'sv-card'); card.dataset.id = it.id;
      const top = el('div', 'sv-top');
      const nm = el('input', 'sv-name'); nm.type = 'text'; nm.value = it.name; nm.maxLength = 60; nm.setAttribute('aria-label', '저장한 포트폴리오 이름');
      const at = new Date(it.at); top.append(nm, el('span', 'sv-date', isNaN(at) ? '' : `${at.getFullYear()}.${String(at.getMonth() + 1).padStart(2, '0')}.${String(at.getDate()).padStart(2, '0')}`));
      card.appendChild(top);
      const unknown = it.rows.filter(r => !known(r.t)).map(r => r.t);
      card.appendChild(el('div', 'sv-w', it.rows.map(r => `${r.t} ${r.w}%`).join(' · ')));
      const sl = snapLine(it.snap); if (sl) card.appendChild(el('div', 'sv-m', sl));
      const meta = [];
      if (it.snap && it.snap.from) meta.push(`${it.snap.from}–${it.snap.to}`);
      meta.push(`리밸런싱 ${REBAL_TXT[(it.snap && it.snap.rule) || it.rule] || ''}`);
      if (it.snap) meta.push((it.snap.real ? '물가 반영' : '명목') + (it.snap.div ? ' · 배당 현금 수령(평가액 기준)' : ' · 배당 재투자') + (it.snap.adj ? ' · 추세 보정 데이터' : ''));
      if (it.src && it.src !== it.name) meta.push(it.src);
      card.appendChild(el('div', 'sv-p', meta.join(' · ')));
      if (unknown.length) card.appendChild(el('div', 'sv-p neg', `${unknown.join(', ')}: 이 기기에 없는 사용자 티커라 다시 추가해야 계산돼요.`));
      const acts = el('div', 'sv-acts');
      acts.appendChild(el('span', 'small muted', '불러오기'));
      [0, 1, 2].forEach(pi => { const b = el('button', 'btn ghost sm', `P${pi + 1}`); b.type = 'button'; b.dataset.act = 'load'; b.dataset.p = pi; b.setAttribute('aria-label', `포트폴리오 ${pi + 1}에 불러오기`); acts.appendChild(b); });
      acts.appendChild(el('span', 'sp'));
      const cb = el('button', 'btn ghost sm', '코드'); cb.type = 'button'; cb.dataset.act = 'code'; cb.setAttribute('aria-label', '이 포트폴리오의 공유 코드 보기');
      const db = el('button', 'btn ghost sm del-btn', '삭제'); db.type = 'button'; db.dataset.act = 'del';
      acts.append(cb, db); card.appendChild(acts);
      host.appendChild(card);
    }
  }
  $('#sv-list').addEventListener('click', e => {
    const b = e.target.closest('button[data-act]'); if (!b) return;
    const id = b.closest('.sv-card').dataset.id; const it = SV.items.find(x => x.id === id); if (!it) return;
    if (b.dataset.act === 'load') {
      const pi = +b.dataset.p;
      state.ports[pi] = { name: it.name, rows: it.rows.map(r => ({ t: r.t, w: String(r.w) })) };
      state.portCur = pi; renderPorts(); schedule(true);
      flashSaved(`‘${it.name}’${eul(it.name)} 포트폴리오 ${pi + 1}에 불러왔어요.` + ((it.snap && it.snap.rule && it.snap.rule !== state.rebal) ? ` 저장할 때 리밸런싱은 ${REBAL_TXT[it.snap.rule]}이었어요.` : '') +
        ((it.snap && it.snap.cagr != null && !!it.snap.div !== state.div) ? ` 저장한 수치는 배당 ${it.snap.div ? '현금 수령' : '재투자'} 기준이에요.` : ''));
      goTo('h-ports');
    } else if (b.dataset.act === 'code') {
      openIO('export', [it]);
    } else if (b.dataset.act === 'del') {
      if (b.dataset.armed) { deleteItem(id); return; }
      b.dataset.armed = '1'; b.textContent = '한 번 더 누르면 삭제';
      setTimeout(() => { if (b.isConnected) { delete b.dataset.armed; b.textContent = '삭제'; } }, 3000);
    }
  });
  $('#sv-list').addEventListener('input', e => { if (e.target.classList.contains('sv-name')) renameItem(e.target.closest('.sv-card').dataset.id, e.target.value); });

  /* export / import as a text code (works between devices and between people) */
  const b64e = s => { const b = new TextEncoder().encode(s); let bin = ''; for (let i = 0; i < b.length; i++) bin += String.fromCharCode(b[i]); return btoa(bin); };
  const b64d = s => { const bin = atob(s); const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return new TextDecoder().decode(b); };
  const exportCode = items => 'ETFBT1:' + b64e(JSON.stringify({ v: 1, items: items.map(x => { const c = cleanItem(x); return c; }).filter(Boolean) }));
  function parseImport(text) {
    let s = (text || '').trim(); if (!s) throw new Error('붙여 넣은 내용이 없어요.');
    let obj = null;
    if (/^ETFBT1:/i.test(s)) s = s.slice(7);
    try { obj = JSON.parse(s); } catch (_) { try { obj = JSON.parse(b64d(s.replace(/\s+/g, ''))); } catch (__) { throw new Error('코드를 읽을 수 없어요. 내보내기에서 받은 코드를 그대로 붙여 넣어 주세요.'); } }
    const arr = Array.isArray(obj) ? obj : Array.isArray(obj.items) ? obj.items : [obj];
    const items = arr.map(cleanItem).filter(Boolean);
    if (!items.length) throw new Error('불러올 수 있는 포트폴리오가 없어요(비중 합계 100%인지 확인해 주세요).');
    return items;
  }
  let ioMode = null;
  function openIO(mode, items) {
    ioMode = mode; const box = $('#sv-io'); box.hidden = false;
    const ta = $('#io-text'), msg = $('#io-msg'); msg.textContent = '';
    $('#io-title').textContent = mode === 'export' ? (items.length === 1 ? `‘${items[0].name}’ 공유 코드` : `저장한 포트폴리오 ${items.length}개 내보내기`) : '포트폴리오 가져오기';
    $('#io-help').textContent = mode === 'export'
      ? '이 코드를 복사해 두거나 다른 사람에게 보내세요. 다른 기기나 다른 사람의 화면에서 ‘가져오기’에 붙여 넣으면 같은 포트폴리오가 저장돼요.'
      : '내보내기에서 받은 코드를 붙여 넣거나, 내보낸 파일(.json)을 고르세요.';
    ta.readOnly = mode === 'export'; ta.value = mode === 'export' ? exportCode(items) : '';
    $('#io-copy').hidden = mode !== 'export'; $('#io-file-save').hidden = mode !== 'export' || !SV.dl;
    $('#io-add').hidden = mode !== 'import'; $('#io-file').closest('label').hidden = mode !== 'import';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (mode === 'import') ta.focus();
  }
  $('#sv-export').addEventListener('click', () => { if (!SV.items.length) { flashSaved('내보낼 포트폴리오가 없어요.'); return; } openIO('export', SV.items); });
  $('#sv-import').addEventListener('click', () => openIO('import'));
  $('#io-close').addEventListener('click', () => { $('#sv-io').hidden = true; });
  $('#io-copy').addEventListener('click', async () => {
    const ta = $('#io-text'), msg = $('#io-msg');
    try { await navigator.clipboard.writeText(ta.value); msg.textContent = '복사했어요.'; }
    catch (_) { ta.focus(); ta.select(); msg.textContent = '자동 복사가 막혀 있어요. 선택된 코드를 길게 눌러(또는 Ctrl+C) 복사하세요.'; }
  });
  $('#io-file-save').addEventListener('click', async () => {
    const msg = $('#io-msg'); if (!SV.dl) return;
    try {
      const items = parseImport($('#io-text').value);
      const r = await SV.dl.save({ filename: 'etf-portfolios.json', data: JSON.stringify({ v: 1, items }, null, 2) });
      msg.textContent = r.status === 'saved' ? '파일로 저장했어요.' : '';
    } catch (e) { msg.textContent = e && e.code === 'declined' ? '' : '파일로 저장하지 못했어요.'; }
  });
  $('#io-file').addEventListener('change', async e => { const f = e.target.files[0]; if (f) $('#io-text').value = await f.text(); });
  $('#io-add').addEventListener('click', async () => {
    const msg = $('#io-msg');
    let items; try { items = parseImport($('#io-text').value); } catch (err) { msg.textContent = err.message; return; }
    let ok = 0; for (const it of items) { if (await saveItem(it)) ok++; }
    msg.textContent = `${ok}개를 추가했어요.`; if (ok) { $('#io-text').value = ''; }
  });

  /* account storage (claude.ai db, private per person) when this view allows it; otherwise this browser */
  async function connectAccount(fromClick) {
    const C = window.claude; if (!C || typeof C.use !== 'function') return false;
    let db = null, user = null;
    try { [db, user] = await Promise.all([C.use('db'), C.use('user')]); } catch (_) {}
    if (!db || !user) { SV.canConnect = false; renderSaved(); if (fromClick) flashSaved('이 화면에서는 계정 저장을 쓸 수 없어 이 기기에 저장해요.'); return false; }
    let uid = null, can = null;
    try { uid = await user.id(); } catch (_) {}
    try { can = await user.can('data.write'); } catch (_) {}
    if (!uid || can === false) { SV.canConnect = false; renderSaved(); if (fromClick) flashSaved('보기 전용으로 공유된 화면이라 이 기기에 저장해요.'); return false; }
    let col;
    try { col = db.collection('data/users/' + uid); } catch (_) { return false; }
    SV.col = col; SV.mode = 'account'; SV.canConnect = false; SV.items = [];
    renderSaved();
    SV.unsub = col.onSnapshot(snap => {
      SV.items = snap.docs.map(d => { const x = cleanItem(d.data()); return x ? Object.assign(x, { id: d.id }) : null; })
        .filter(Boolean).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
      renderSaved();
    }, () => toLocal('계정 저장소에 연결하지 못해 이 기기에 저장해요.'));
    return true;
  }
  async function initSaved() {
    loadLocal(); renderSaved();
    const C = window.claude;
    if (!C || typeof C.use !== 'function') {
      // saved file or installed app (outside claude.ai): a plain browser download for the export file
      SV.dl = { save: async ({ filename, data }) => {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = filename;
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); return { status: 'saved' };
      } };
      return;
    }
    C.use('downloads').then(d => { SV.dl = d || null; }).catch(() => {});
    let perm = null; try { perm = await C.use('permissions'); } catch (_) {}
    let st = 'granted';
    if (perm) { try { st = await perm.state('db'); } catch (_) {} }
    if (st === 'denied' || st === 'unavailable') return;
    if (st === 'prompt') { SV.canConnect = true; renderSaved(); return; }   // ask only when the viewer opts in
    await connectAccount(false);
  }
  function snapOf(H, st, stDiv) {
    return { cagr: st.cagr, mdd: st.mdd, uw: st.uw.months, ong: st.uw.ongoing, from: BT.label(H.i0), to: BT.label(H.i1), real: state.opt ? state.opt.real : state.real, rule: state.opt ? state.opt.rule : state.rebal, adj: !!H.adjMap,
      div: false, dy: stDiv && stDiv.income ? stDiv.income.ttmYield : null };
  }
  function savePortCard(pi, btn) {
    const p = state.ports[pi], info = portInfo(p);
    if (!info.ok) { flashSaved('비중 합계를 100%로 맞춘 뒤 저장할 수 있어요.'); return; }
    const x = state.last && state.last.series.find(s => s.key === 'p' + pi);
    const snap = x ? { cagr: x.st.cagr, mdd: x.st.mdd, uw: x.st.uw.months, ong: x.st.uw.ongoing, from: BT.label(state.last.s), to: BT.label(state.last.e), real: state.real, rule: state.rebal,
      div: state.div, dy: x.st.income ? x.st.income.ttmYield : null, adj: !!(state.last.adj && usesAdjusted(x.tickers)) } : null;
    const tot = info.weights.reduce((a, b) => a + b, 0);
    btn.disabled = true;
    saveItem({ name: p.name.trim() || `포트폴리오 ${pi + 1}`, rows: info.tickers.map((t, j) => ({ t, w: +(info.weights[j] / tot * 100).toFixed(2) })), rule: state.rebal, src: '포트폴리오 카드', snap })
      .then(ok => { btn.textContent = ok ? '저장됨' : '저장'; setTimeout(() => { if (btn.isConnected) { btn.textContent = '저장'; btn.disabled = false; } }, 2000); });
  }

  /* ---------- custom data ---------- */
  function parseCSV(text, unit) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) throw new Error('데이터 줄이 너무 적어요.');
    const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',');
    // split one line, honouring double quotes ("5,762.48" stays one field)
    const split = l => {
      const out = []; let cur = '', q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (ch === delim && !q) { out.push(cur.trim()); cur = ''; }
        else cur += ch;
      }
      out.push(cur.trim()); return out;
    };
    let header = split(lines[0]); let body = lines.slice(1);
    const hasHeader = header.some(h => /[a-zA-Z가-힣]/.test(h) && !/^\d{1,4}[-/.]\d{1,2}/.test(h));
    if (!hasHeader) { body = lines; header = []; }
    const low = header.map(h => h.toLowerCase());
    let di = low.findIndex(h => /date|날짜|일자|time/.test(h)); if (di < 0) di = 0;
    let vi = low.findIndex(h => /adj/.test(h)), mode = 'price';
    // with both 'Close' and 'Adj Close' (Yahoo Finance), the monthly gap between them is the distribution return
    const ci = vi >= 0 ? low.findIndex((h, k) => k !== vi && /^(close|종가)$/.test(h.replace(/[^a-z가-힣]/g, ''))) : -1;
    if (vi < 0) { vi = low.findIndex(h => /return|수익률/.test(h) && !/index|지수|price|close|가격/.test(h)); mode = vi >= 0 ? 'ret' : 'price'; }
    if (vi < 0) { vi = low.findIndex(h => /^close$|종가|price|가격|close/.test(h)); mode = 'price'; }
    if (vi < 0) vi = di === 0 ? 1 : 0;
    const rows = body.map(split);
    // slash dates: decide day/month order from the data (any first field > 12 means DD/MM/YYYY)
    let dmy = false;
    for (const c of rows) { const m = (c[di] || '').match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/); if (m && +m[1] > 12) { dmy = true; break; } }
    const parseDate = s => {
      let m = s.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.](\d{1,2}))?/);
      let y, mo, d;
      if (m) { y = +m[1]; mo = +m[2]; d = m[3] ? +m[3] : 28; }
      else {
        m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/); if (!m) return null;
        y = +m[3]; if (dmy) { d = +m[1]; mo = +m[2]; } else { mo = +m[1]; d = +m[2]; }
      }
      if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return 'bad';
      return [y, mo, d];
    };
    const euro = delim === ';';
    // numbers: "5,762.48" / "5.762,48" / "999,50" / "1,000" / "2.5%"
    const num = s => {
      let x = (s || '').replace(/[\s%$"'₩€£]/g, '');
      if (!x) return NaN;
      const hasC = x.includes(','), hasD = x.includes('.');
      if (hasC && hasD) x = x.lastIndexOf(',') > x.lastIndexOf('.') ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
      else if (hasC) x = /^-?\d{1,3}(,\d{3})+$/.test(x) ? x.replace(/,/g, '') : x.replace(',', '.');
      else if (hasD && euro && /^-?\d{1,3}(\.\d{3})+$/.test(x)) x = x.replace(/\./g, '');
      return parseFloat(x);
    };
    const byMonth = new Map(); let n = 0, bad = 0, pctSign = /%/.test(header[vi] || '');
    const pts = [], closeBy = new Map();
    for (const c of rows) {
      const d = parseDate(c[di] || ''); const v = num(c[vi]);
      if ((c[vi] || '').includes('%')) pctSign = true;
      if (d === 'bad') { bad++; continue; }
      if (!d || !isFinite(v)) continue;
      n++; pts.push([d, v]);
      if (ci >= 0) { const cv = num(c[ci]); const key = (d[0] - 1972) * 12 + (d[1] - 1); const pr = closeBy.get(key); if (isFinite(cv) && cv > 0 && (!pr || d[2] >= pr.day)) closeBy.set(key, { day: d[2], v: cv }); }
    }
    if (bad) throw new Error(`날짜를 읽을 수 없는 줄이 ${bad}개 있어요. 날짜는 2024-01-31, 01/31/2024, 31/01/2024 형식으로 넣어 주세요.`);
    const months = new Set(pts.map(([d]) => d[0] * 12 + d[1]));
    const daily = n > months.size * 3;
    // return columns: '%' in the header or values means percent; otherwise the unit the person chose
    const decimals = mode === 'ret' && !pctSign && unit === 'dec';
    for (const [d, v] of pts) {
      const key = (d[0] - 1972) * 12 + (d[1] - 1);
      const prev = byMonth.get(key);
      if (mode === 'ret') {
        const r = decimals ? v : v / 100;
        // daily or weekly returns compound into the month
        byMonth.set(key, { day: Math.max(d[2], prev ? prev.day : 0), first: Math.min(d[2], prev ? prev.first : 99), v: prev ? (1 + prev.v) * (1 + r) - 1 : r });
      } else if (!prev || d[2] >= prev.day) byMonth.set(key, { day: d[2], v });
    }
    const keys = [...byMonth.keys()].sort((a, b) => a - b);
    if (keys.length < 13) throw new Error('최소 13개월 이상의 데이터가 필요해요.');
    let r = [], s, dInc = null;
    if (mode === 'ret') {
      s = keys[0];
      for (let i = 0; i < keys.length; i++) { if (i && keys[i] !== keys[i - 1] + 1) throw new Error(`${BT.label(keys[i - 1])} 다음 달 데이터가 없어요.`); r.push(byMonth.get(keys[i]).v); }
      if (daily && byMonth.get(keys[keys.length - 1]).day < 25) r.pop();   // incomplete last month
      if (daily && byMonth.get(keys[0]).first > 7) { r.shift(); s++; }     // incomplete first month
    } else {
      s = keys[0] + 1;
      for (let i = 1; i < keys.length; i++) {
        if (keys[i] !== keys[i - 1] + 1) throw new Error(`${BT.label(keys[i - 1])} 다음 달 데이터가 없어요.`);
        const p0 = byMonth.get(keys[i - 1]).v, p1 = byMonth.get(keys[i]).v;
        if (!(p0 > 0) || !(p1 > 0)) throw new Error(`${BT.label(keys[i])} 가격이 0 이하예요. 가격 열을 확인해 주세요.`);
        r.push(p1 / p0 - 1);
      }
      if (daily && byMonth.get(keys[keys.length - 1]).day < 25) r.pop(); // incomplete last month
      if (ci >= 0 && keys.every(k => closeBy.has(k))) {
        dInc = r.map((x, i) => { const c0 = closeBy.get(keys[i]).v, c1 = closeBy.get(keys[i + 1]).v; return Math.max(0, x - (c1 / c0 - 1)); });
        if (!dInc.some(x => x > 1e-6)) dInc = null;   // identical columns: no distributions recorded
      }
    }
    if (r.some(x => !isFinite(x) || x <= -0.95 || x >= 5)) throw new Error('월간 수익률이 비정상이에요(−95% 이하이거나 +500% 이상인 달이 있어요). 숫자 형식(소수점·천 단위 구분)이나 수익률 단위를 확인해 주세요.');
    if (s < 0) { r = r.slice(-s); if (dInc) dInc = dInc.slice(-s); s = 0; }
    if (s + r.length > NM) { r = r.slice(0, NM - s); if (dInc) dInc = dInc.slice(0, NM - s); }
    if (r.length < 12) throw new Error('1972년 이후 2026년 9월까지 구간에 12개월 이상이 있어야 해요.');
    const absMax = Math.max(...r.map(Math.abs));
    let hint = '';
    if (mode === 'ret' && !decimals && absMax < 0.01) hint = '월 수익률이 모두 1%보다 작아요. 현금성 자산이 아니라면 값이 0.025 같은 소수일 수 있으니 단위를 ‘소수’로 바꿔 다시 추가해 보세요.';
    if (mode === 'ret' && decimals && absMax > 1) hint = '월 수익률이 100%를 넘는 달이 있어요. 값이 2.5 같은 %라면 단위를 ‘%’로 바꿔 다시 추가하세요.';
    return { s, r, d: dInc, mode, daily, decimals, dmy, hint };
  }
  async function addCustom() {
    const msgEl = $('#cu-msg'); msgEl.style.color = '';
    const t = $('#cu-tk').value.trim().toUpperCase();
    if (!/^[A-Z0-9.\-^=]{1,12}$/.test(t)) { msgEl.textContent = '티커는 영문·숫자로 1~12자로 입력하세요.'; msgEl.style.color = 'var(--neg)'; return; }
    if (known(t) && !DATA.assets[t].custom) { msgEl.textContent = `${t}는 이미 지원 목록에 있어요.`; msgEl.style.color = 'var(--neg)'; return; }
    let text = $('#cu-text').value;
    const f = $('#cu-file').files[0]; if (!text.trim() && f) text = await f.text();
    try {
      const p = parseCSV(text, $('#cu-unit').value);
      const e1 = p.s + p.r.length - 1;
      BT.addAsset(t, { n: `${t} (사용자 데이터)`, c: '사용자 추가', inc: '', fee: 0, s: p.s, r: p.r.map(x => Math.round(x * 1e6)), seg: [['U', p.s, e1]], custom: true,
        d: p.d ? p.d.map(x => Math.round(x * 1e6)) : undefined, dsrc: [[p.d ? 'csv' : 'none', p.s, e1]] });
      refreshTickerLists(); updatePortStatus(); schedule(true);
      const how = p.mode === 'ret' ? (p.decimals ? '수익률(소수, 0.02 = 2%)' : '수익률(%)') + (p.daily ? ' 일간 값을 월별로 복리 합산' : '') : '가격' + (p.daily ? ' 일간 값의 월말 기준' : '');
      msgEl.textContent = `${t} 추가됨 · ${BT.label(p.s)} ~ ${BT.label(p.s + p.r.length - 1)} (${p.r.length}개월, ${how}${p.dmy ? ', 날짜는 일/월/연 순서로 읽음' : ''}) · 첫 달 수익률 ${p.r.slice(0, 3).map(x => spct(x, 2)).join(', ')}` +
        (p.d ? ` · 배당: 종가·수정종가 차이로 계산(연 ${pct(p.d.reduce((a, b) => a + b, 0) / p.d.length * 12, 1)})` : ' · 배당 데이터 없음(‘현금으로 받기’에서는 배당 0)') + (p.hint ? ' · ' + p.hint : '');
    } catch (err) { msgEl.textContent = err.message; msgEl.style.color = 'var(--neg)'; }
  }
  $('#cu-add').addEventListener('click', addCustom);

  /* ================= v7 ================= */
  const pctm = (x, d = 2) => (x == null || !isFinite(x) ? '–' : sgnTxt(x, d));   // percent with a true minus sign
  /* ---------- my portfolios on actual or trend-kept data ---------- */
  function adjHits() {
    if (!state.last) return [];
    const set = new Set(); state.last.series.forEach(x => x.tickers.forEach(t => { if (BT.isAdjusted(t)) set.add(t); }));
    return [...set];
  }
  function trendTxt(t) {   // "최근 3년 연 +30.5% → +3.0%"
    const I = state.trendInfo, o = I && I.by[t], ar = I && I.adjRecent[t];
    return o && o.ok && ar != null ? `최근 ${state.trend.R / 12}년 연 ${spct(o.gR, 1)} → ${spct(ar, 1)}` : '';
  }
  function renderDataMode() {
    const on = !!state.dataAdj, T = state.trend, I = state.trendInfo;
    document.querySelectorAll('#dm button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === 'adj') === on ? 'true' : 'false'));
    $('#dm').dataset.adj = on ? 'true' : 'false';
    const note = $('#dm-note'); note.textContent = '';
    const own = I ? [...I.flagged].filter(t => !(I.by[t] && I.by[t].lev)) : [];
    const fams = [...new Set(own.map(famOf))];
    if (!T.on) note.textContent = '추세 보정이 꺼져 있어요. ‘추세 보정 데이터’를 누르면 다시 켜고 계산해요.';
    else if (!fams.length) note.textContent = `지금은 최근 ${T.R / 12}년 수익률이 직전 추세보다 연 ${Math.round(T.thr * 100)}%p 넘게 높은 종목이 없어 두 데이터가 같아요.`;
    else {
      note.append('보정 종목 ');
      fams.forEach((f, i) => { if (i) note.append(', '); const t = own.find(x => famOf(x) === f) || f; note.append(el('b', null, f), ' ' + trendTxt(t)); });
      note.append(` (직전 ${T.L / 12}년 추세 속도로 낮춤). 기준은 ‘점검 › 추세 유지 보정’에서 바꿔요.`);
    }
    const hits = adjHits(), show = on && !!state.last;
    $('#dm-banner').hidden = !show;
    if (show) $('#dm-banner-txt').textContent = hits.length ? `보정 종목 ${hits.map(t => `${t} ${trendTxt(t)}`).join(', ')}. 성과 요약·차트·기간별 표·롤링·구간별 점검이 모두 이 데이터 기준이에요.` : '포트폴리오에 보정한 종목이 없어 결과가 실제 데이터와 같아요.';
    for (const id of ['h-hero', 'h-sum', 'h-risk', 'h-charts', 'h-trail', 'h-mdd', 'h-roll', 'h-annual', 'h-period']) {
      const h = document.getElementById(id); if (!h) continue;
      let m = h.querySelector('.adj-mark');
      if (show && hits.length) { if (!m) { m = el('span', 'adj-mark', '보정 데이터'); m.style.marginLeft = '8px'; h.appendChild(m); } }
      else if (m) m.remove();
    }
    // what the folded 'advanced settings' are set to, readable without opening it
    $('#adv-sum').textContent = `벤치마크 ${state.bench && known(state.bench) ? state.bench : '없음'} · ${on ? '추세 보정 데이터' : '실제 데이터'} · ${state.ext ? '상장 전 확장' : 'ETF 상장 이후만'} · ${state.real ? '물가 반영' : '물가 미반영'} · 배당 ${state.div ? '현금으로 받기' : '재투자'}`;
  }
  function setDataAdj(on) {
    if (on && !state.trend.on) { state.trend.on = true; $('#tr-on').checked = true; }
    state.dataAdj = !!on;
    recompute();
  }
  document.querySelectorAll('#dm button').forEach(b => b.addEventListener('click', () => setDataAdj(b.dataset.v === 'adj')));
  $('#dm-off').addEventListener('click', () => setDataAdj(false));

  /* ---------- v7.1: return and risk beyond the single worst drop ---------- */
  /* drawdowns as episodes: from a peak until that peak is regained (or the end); a further fall before recovery is the same episode */
  function ddEpisodes(v) {
    const out = []; let pk = 0, tr = 0, inDD = false;
    for (let t = 1; t < v.length; t++) {
      if (v[t] >= v[pk]) { if (inDD) out.push({ pk, tr, rec: t }); inDD = false; pk = t; tr = t; }
      else if (!inDD) { inDD = true; tr = t; }
      else if (v[t] < v[tr]) tr = t;
    }
    if (inDD) out.push({ pk, tr, rec: -1 });
    return out.map(e => Object.assign(e, { depth: v[e.tr] / v[e.pk] - 1 }));
  }
  function riskOf(x) {
    const v = x.res.vals, n = x.res.n, i0 = x.res.i0, dd = new Float64Array(n + 1);
    let pk = v[0], sq = 0, ab = 0, deep = 0;
    for (let t = 0; t <= n; t++) { if (v[t] > pk) pk = v[t]; dd[t] = v[t] / pk - 1; }
    for (let t = 1; t <= n; t++) { sq += dd[t] * dd[t]; ab -= dd[t]; if (dd[t] < -0.10) deep++; }
    const lab = t => (t === 0 ? '시작' : BT.label(i0 + t - 1));
    const eps = ddEpisodes(v).sort((a, b) => a.depth - b.depth);
    for (const e of eps) {
      const end = e.rec < 0 ? n : e.rec; let s2 = 0; for (let t = e.pk + 1; t <= end; t++) s2 += dd[t] * dd[t];
      Object.assign(e, { share: sq > 0 ? s2 / sq : 0, fall: e.tr - e.pk, recM: e.rec < 0 ? null : e.rec - e.tr, len: end - e.pk, since: n - e.tr, pkL: lab(e.pk), trL: lab(e.tr), recL: e.rec < 0 ? null : lab(e.rec) });
    }
    const top = eps.filter(e => e.depth <= -0.05).slice(0, 5);
    let r10 = null;
    if (n >= 120) {   // every 10-year window, 1-month steps (sliced from this run, like the rolling table)
      const c = [], m = [];
      for (let a = 0; a + 120 <= n; a++) {
        c.push(Math.pow(v[a + 120] / v[a], 0.1) - 1);
        let p2 = v[a], d2 = 0; for (let t = a + 1; t <= a + 120; t++) { const y = v[t]; if (y > p2) p2 = y; else if (y / p2 - 1 < d2) d2 = y / p2 - 1; }
        m.push(d2);
      }
      const srt = arr => arr.slice().sort((a2, b2) => a2 - b2);
      const qs = (z, q) => z[Math.min(z.length - 1, Math.floor(q * (z.length - 1) + 0.5))];
      const med = z => { const L = z.length; return L % 2 ? z[(L - 1) / 2] : (z[L / 2 - 1] + z[L / 2]) / 2; };   // the same median as the rolling table
      const cs = srt(c), ms = srt(m);
      let wI = 0; m.forEach((d, k) => { if (d < m[wI]) wI = k; });
      r10 = { med: med(cs), p10: qs(cs, 0.1), mddMed: med(ms), mddWorst: m[wI], mddWorstWin: `${BT.label(i0 + wI)}–${BT.label(i0 + wI + 119)}` };
    }
    const ui = Math.sqrt(sq / n);
    return { ui, martin: ui > 1e-9 ? (x.st.cagr - x.st.cash) / ui : null, calmar: x.st.calmar, pain: ab / n, deep: deep / n,
      n10: eps.filter(e => e.depth <= -0.10).length, years: n / 12, eps, top, top5: top.length ? top.reduce((a, e) => a + e.depth, 0) / top.length : null, r10, n };
  }
  const shareTag = v => (v >= 0.7 ? ['tag no', '한 번에 집중'] : v >= 0.4 ? ['tag', '보통'] : ['tag ok', '여러 번에 나뉨']);
  function renderRisk() {
    const t = $('#t-risk'); t.innerHTML = ''; if (!state.last) return;
    const { series } = state.last, R = series.map(riskOf); state.riskData = R;
    const thead = el('thead'), hr = el('tr'); headRow(hr, series, '지표'); thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody'); t.appendChild(tb);
    const sep = txt => { const tr = el('tr', 'sep'); const th = el('th', null, txt); th.colSpan = series.length + 1; tr.appendChild(th); tb.appendChild(tr); };
    const row = (label, hint, vals, fmt, better, opts = {}) => {
      const tr = el('tr'); if (opts.hl) tr.className = 'hl';
      const th = el('th', null, label); if (hint) th.appendChild(el('span', 'hint', hint)); tr.appendChild(th);
      const ok = vals.filter(v => v != null && isFinite(v));
      const best = better && ok.length > 1 ? (better === 'hi' ? Math.max(...ok) : Math.min(...ok)) : null;
      vals.forEach((v, i) => {
        const td = cellFor(el('td'), series[i]);
        if (v == null || !isFinite(v)) td.appendChild(el('span', 'na', opts.na || '–')); else fmt(td, v, i);
        if (best != null && v != null && Math.abs(v - best) < 1e-9 && !ok.every(z => Math.abs(z - best) < 1e-9)) td.classList.add('best');
        tr.appendChild(td);
      });
      tb.appendChild(tr);
    };
    const P1 = (td, v) => { td.textContent = pctm(v, 1); if (v < 0) td.classList.add('neg'); };
    const M1 = (td, v) => { td.textContent = mpct1(v); if (v < 0) td.classList.add('neg'); };
    const has10 = R.some(r => r.r10);
    sep('수익 — 시작·끝 시점에 덜 좌우되는 10년 구간 성적');
    row('보통의 10년 CAGR', '10년 구간 중앙값', R.map(r => r.r10 ? r.r10.med : null), P1, 'hi', { na: '기간 부족' });
    row('나쁜 10년 CAGR', '10년 구간 하위 10%', R.map(r => r.r10 ? r.r10.p10 : null), P1, 'hi', { na: '기간 부족' });
    sep('위험 — 모든 하락의 깊이·기간·횟수');
    row('보통의 10년 MDD', '모든 10년 구간 MDD의 중앙값', R.map(r => r.r10 ? r.r10.mddMed : null), M1, 'hi', { na: '기간 부족' });
    row('평균 낙폭', '매달 고점 대비 평균', R.map(r => -r.pain), M1, 'hi');
    row('울서 지수', '낙폭의 깊이 × 기간, 낮을수록 좋음', R.map(r => r.ui), (td, v) => { td.textContent = (v * 100).toFixed(1) + '%'; }, 'lo');
    row('고점보다 10% 넘게 빠져 있던 기간', '전체 기간 중', R.map(r => r.deep), (td, v, i) => { td.textContent = pctm(v, 0); td.appendChild(el('span', 'sub', `${monthsTxt(Math.round(v * R[i].n))}`)); }, 'lo');
    row('10% 넘는 하락', '횟수', R.map(r => r.n10), (td, v, i) => { td.textContent = `${v}번`; td.appendChild(el('span', 'sub', `10년에 ${(v / R[i].years * 10).toFixed(1)}번`)); }, 'lo');
    sep('수익 ÷ 위험');
    row('마틴 비율', '(CAGR − 현금 수익) ÷ 울서 지수', R.map(r => r.martin), (td, v) => { td.textContent = num(v); }, 'hi', { hl: true });
    row('(참고) 샤프 비율', '오르내림(변동성) 기준', series.map(x => x.st.sharpe), (td, v) => { td.textContent = num(v); }, 'hi');
    row('(참고) 칼마 비율', 'CAGR ÷ MDD, 가장 큰 한 번 기준', R.map(r => r.calmar), (td, v) => { td.textContent = num(v); }, 'hi');
    sep('한 번의 폭락에 얼마나 좌우되나');
    row('가장 큰 하락', '= 전체 기간 MDD', R.map(r => r.eps[0] ? r.eps[0].depth : null), (td, v, i) => { M1(td, v); const e = R[i].eps[0]; td.appendChild(el('span', 'sub', `${e.pkL} → ${e.trL}`)); }, 'hi', { na: '하락 없음' });
    row('두 번째로 큰 하락', '따로 일어난 하락', R.map(r => r.eps[1] ? r.eps[1].depth : null), (td, v, i) => { M1(td, v); const e = R[i].eps[1]; td.appendChild(el('span', 'sub', `${e.pkL} → ${e.trL}`)); }, 'hi', { na: '없음' });
    row('큰 하락 5개 평균', '−5% 넘는 하락 중 깊은 순', R.map(r => r.top5), (td, v, i) => { M1(td, v); td.appendChild(el('span', 'sub', `${R[i].top.length}개 평균`)); }, 'hi', { na: '−5% 넘는 하락 없음' });
    row('가장 큰 하락의 비중', '전체 낙폭(울서 지수) 중', R.map(r => r.eps[0] ? r.eps[0].share : null), (td, v) => { td.textContent = pctm(v, 0); const [c, txt] = shareTag(v); const w = el('span', 'tagrow'); w.appendChild(el('span', c, txt)); td.appendChild(w); }, null, { na: '하락 없음' });
    if (!has10) { const tr = el('tr'); const td = el('td', 'na', '분석 기간이 10년보다 짧아 ‘10년 구간’ 지표는 비워 뒀어요.'); td.colSpan = series.length + 1; td.style.textAlign = 'left'; tr.appendChild(td); tb.appendChild(tr); }
  }
  function renderDD() {
    const host = $('#t-dd'), chips = $('#dd-port'); host.innerHTML = ''; chips.innerHTML = ''; $('#dd-note').textContent = '';
    if (!state.last || !state.riskData) return;
    const L = state.last.series; let i = L.findIndex(x => x.key === state.ddKey); if (i < 0) i = 0;
    L.forEach((x, k) => {
      const b = el('button', 'chip'); b.type = 'button'; b.setAttribute('aria-pressed', k === i ? 'true' : 'false');
      const key = el('span', 'key'); key.style.background = x.color; b.append(key, document.createTextNode(x.name));
      b.addEventListener('click', () => { state.ddKey = x.key; renderDD(); }); chips.appendChild(b);
    });
    const r = state.riskData[i], x = L[i], eps = r.eps.filter(e => e.depth < -0.005).slice(0, 5);
    if (!eps.length) { host.appendChild(el('caption', null, '0.5% 넘게 떨어진 적이 없어요.')); return; }
    const thead = el('thead'), hr = el('tr');
    ['순위', '고점 → 저점', '낙폭', '하락 기간', '회복 기간', '고점 회복까지', '전체 낙폭 중 비중'].forEach(h => hr.appendChild(el('th', null, h)));
    thead.appendChild(hr); host.appendChild(thead);
    const tb = el('tbody');
    const lb = (td, t) => { td.dataset.label = t; return td; };
    eps.forEach((e, k) => {
      const tr = el('tr');
      tr.appendChild(el('th', null, `${k + 1}위`));
      const c1 = lb(el('td', 'when-c', `${e.pkL} → ${e.trL}`), '고점 → 저점'); c1.appendChild(el('span', 'sub', e.recL ? `회복 ${e.recL}` : '아직 회복 전')); tr.appendChild(c1);
      tr.appendChild(lb(el('td', 'neg', mpct1(e.depth)), '낙폭'));
      tr.appendChild(lb(el('td', null, dur(e.fall)), '하락 기간'));
      const c4 = lb(el('td', null, e.recM != null ? dur(e.recM) : '회복 중'), '회복 기간'); if (e.recM == null) c4.appendChild(el('span', 'sub', `저점 후 ${dur(e.since)}`)); tr.appendChild(c4);
      tr.appendChild(lb(el('td', null, dur(e.len) + (e.rec < 0 ? '+' : '')), '고점 회복까지'));
      const c6 = lb(el('td'), '전체 낙폭 중 비중'); const g = el('div', 'dd-share'); const b = el('div', 'mbar'); const f = el('i'); f.style.left = '0'; f.style.width = Math.max(1, e.share * 100) + '%'; b.appendChild(f); b.setAttribute('aria-hidden', 'true');
      g.append(el('span', null, pctm(e.share, 0)), b); c6.appendChild(g); tr.appendChild(c6);
      tb.appendChild(tr);
    });
    host.appendChild(tb);
    const e0 = r.eps[0], [, tagTxt] = shareTag(e0.share);
    $('#dd-note').textContent = `${x.name}: 10% 넘는 하락 ${r.n10}번(10년에 ${(r.n10 / r.years * 10).toFixed(1)}번). 가장 큰 하락(${e0.pkL}–${e0.recL || '회복 전'})이 전체 낙폭의 ${pctm(e0.share, 0)}를 차지해요 — ${tagTxt}.` + (r.eps[1] ? ` 그 한 번을 빼면 가장 깊은 하락은 ${mpct1(r.eps[1].depth)}예요.` : '');
  }

  /* ---------- v7.3: which MDD is which — every drawdown figure used in the app, side by side ---------- */
  function renderMDD() {
    const t = $('#t-mdd'), note = $('#mdd-note'); t.innerHTML = ''; note.textContent = '';
    if (!state.last || !state.riskData) return;
    const { s, e, series } = state.last, R = state.riskData, n = e - s + 1;
    const thead = el('thead'), hr = el('tr'); headRow(hr, series, 'MDD 종류 · 잰 구간'); thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody'); t.appendChild(tb);
    /* label, the window it was measured over (always shown), and a longer note (hidden on a phone) */
    const row = (label, win, hint, fill, opts = {}) => {
      const tr = el('tr'); if (opts.hl) tr.className = 'hl';
      const th = el('th'); th.appendChild(el('span', 'ml', label)); if (win) th.appendChild(el('span', 'mw', win)); if (hint) th.appendChild(el('span', 'hint', hint)); tr.appendChild(th);
      series.forEach((x, i) => { const td = cellFor(el('td'), x); fill(td, x, i); tr.appendChild(td); });
      tb.appendChild(tr);
    };
    const M = (td, v, sub) => {
      if (v == null || !isFinite(v)) { td.appendChild(el('span', 'na', '기간 부족')); return; }
      td.appendChild(document.createTextNode(mpct1(v))); if (v < 0) td.classList.add('neg');
      if (sub) td.appendChild(el('span', 'sub', sub));
    };
    const when = m => (m.mdd < 0 ? `${m.peakLabel} → ${m.troughLabel}` : '낙폭 없음');
    row('전체 기간 MDD', `${BT.label(s)}–${BT.label(e)}`, '분석 기간 전체에서 가장 크게 떨어진 한 번 · 한눈에 보기의 최대 낙폭', (td, x) => M(td, x.st.mddInfo.mdd, when(x.st.mddInfo)), { hl: true });
    const rec = [10, 20].map(Y => ({ Y, j: YEARS.indexOf(Y), ok: Y * 12 <= n }));
    rec.forEach(({ Y, j, ok }) => row(`최근 ${Y}년 MDD`, ok ? `${BT.label(e - Y * 12 + 1)}–${BT.label(e)}` : '기간 부족', ok ? `그 ${Y}년만 새로 시작해 계산 · 최근 N년 성과 표` : `분석 기간이 ${Y}년보다 짧아 계산하지 않았어요`, (td, x) => {
      const v = ok ? x.trail[j] : null; if (!v || !v.ok) { M(td, null); return; }
      M(td, v.mdd, when(v.mddInfo));
    }));
    row('10년 보유 시 최악', '모든 10년 구간 중', '1개월 간격으로 잡은 모든 10년 구간의 MDD 중 가장 깊은 값 · 롤링 CAGR 표', (td, x, i) => { const r = R[i].r10; if (!r) { M(td, null); return; } M(td, r.mddWorst, `${r.mddWorstWin} 구간`); });
    row('보통의 10년 MDD', '10년 구간 중앙값', '모든 10년 구간 MDD의 중앙값 · 수익과 위험', (td, x, i) => { const r = R[i].r10; M(td, r ? r.mddMed : null); });
    row('평균 낙폭', '매달의 평균', '매달 직전 고점보다 얼마나 아래 있었나의 평균 · 수익과 위험', (td, x, i) => M(td, -R[i].pain));
    // one plain sentence for the first portfolio
    const x = series[0], m = x.st.mddInfo, R0 = R[0];
    if (!(m.mdd < 0)) { note.textContent = `${x.name}: 분석 기간에 떨어진 달이 없어 MDD가 0%예요.`; return; }
    const parts = rec.filter(r => r.ok && x.trail[r.j] && x.trail[r.j].ok).map(r => {
      const v = x.trail[r.j], same = Math.abs(v.mdd - m.mdd) < SAME && v.mddInfo.troughLabel === m.troughLabel;
      return `최근 ${r.Y}년 ${mpct1(v.mdd)}${same ? '(전체와 같은 하락)' : ''}`;
    });
    note.append(el('b', null, x.name + ': '), `전체 기간 MDD ${mpct1(m.mdd)}는 ${m.peakLabel}→${m.troughLabel} 한 번의 하락에서 나온 값이에요.` +
      (parts.length ? ` 구간을 좁혀 보면 ${parts.join(', ')}` + (R0.r10 ? `이고, 10년 구간의 보통 MDD는 ${mpct1(R0.r10.mddMed)}예요.` : '이에요.') : '') +
      ' 표마다 어느 구간의 MDD인지 이름을 붙여 뒀어요.');
  }

  /* ---------- period check: does the same mix hold up in other periods? ---------- */
  const PCT = { ret: [0.05, 0.10], risk: [0.15, 0.30], era20: [0.02, 0.05], era10: [0.03, 0.06], surge: [0.01, 0.03] };
  const ST_IC = { good: '✓', warn: '!', bad: '✕', na: '–' };
  const stIcon = k => { const i = el('span', 'st-ic ' + k, ST_IC[k]); i.setAttribute('aria-hidden', 'true'); return i; };
  const bnum = t => el('b', null, t);
  /* the portfolio picked in the chips; until one is picked (or while the picked one is incomplete) the first one */
  function pcCur() {
    const L = state.last ? state.last.series : []; if (!L.length) return null;
    return (state.pc.key && L.find(v => v.key === state.pc.key)) || L[0];
  }
  /* a fresh run of x on [a, b] with the current rules (and data, unless adj is given) */
  function pcRun(x, a, b, adj) {
    return BT.backtest(x.tickers, x.weights, a, b, x.bench ? 'N' : state.rebal, adj === undefined ? state.last.adj : adj, state.div);
  }
  /* CAGR, MDD (and where), longest underwater; same rules as the summary table */
  function quickM(vals) {
    const n = vals.length - 1; let pk = vals[0], pkI = 0, mdd = 0, mPk = 0, mTr = 0, under = false, uw = 0, ong = false;
    for (let t = 1; t <= n; t++) {
      const v = vals[t];
      if (v >= pk) { if (under) { if (t - pkI > uw) { uw = t - pkI; ong = false; } under = false; } pk = v; pkI = t; }
      else { under = true; const d = v / pk - 1; if (d < mdd) { mdd = d; mPk = pkI; mTr = t; } }
    }
    if (under && n - pkI > uw) { uw = n - pkI; ong = true; }
    return { cagr: Math.pow(vals[n], 12 / n) - 1, mdd, mPk, mTr, uw, ong, n };
  }
  function pcCompute(x) {
    const { s, e } = state.last, n = e - s + 1;
    const win = (a, b) => Object.assign(quickM(pcRun(x, a, b).vals), { a, b });
    const full = win(s, e);
    const eras = HZ.map(Y => { const L = Y * 12; if (L > n) return { Y, ok: false }; return { Y, ok: true, same: L === n, old: win(s, s + L - 1), rec: win(e - L + 1, e) }; });
    const decades = [];
    for (let d = Math.floor(BT.ym(s)[0] / 10) * 10; d <= BT.ym(e)[0]; d += 10) {
      const a = Math.max(s, BT.idxOf(d, 1)), b = Math.min(e, BT.idxOf(d + 9, 12));
      if (b - a + 1 >= 36) decades.push(Object.assign(win(a, b), { d, partial: b - a + 1 < 120 }));
    }
    let roll = null;
    if (n >= 120) {   // every 10-year window (1-month steps), sliced from one run like the rolling table
      const v = pcRun(x, s, e).vals, c = [], m = [];
      for (let a = 0; a + 120 <= n; a++) {
        c.push(Math.pow(v[a + 120] / v[a], 0.1) - 1);
        let pk = v[a], dd = 0; for (let t = a + 1; t <= a + 120; t++) { const y = v[t]; if (y > pk) pk = y; else if (y / pk - 1 < dd) dd = y / pk - 1; }
        m.push(dd);
      }
      const cs = c.slice().sort((p, q) => p - q), ms = m.slice().sort((p, q) => p - q);
      const qq = (arr, pp) => arr[Math.min(arr.length - 1, Math.floor(pp * (arr.length - 1) + 0.5))];
      let minI = 0, maxI = 0; c.forEach((y, i) => { if (y < c[minI]) minI = i; if (y > c[maxI]) maxI = i; });
      roll = { c, m, count: c.length, p10: qq(cs, 0.1), p90: qq(cs, 0.9), min: cs[0], max: cs[cs.length - 1], minS: s + minI, maxS: s + maxI,
        mP10: qq(ms, 0.1), mP90: qq(ms, 0.9), mWorst: ms[0], mBest: ms[ms.length - 1] };
    }
    const hit = x.tickers.filter(t => BT.isAdjusted(t));
    let surge = null;
    if (hit.length && state.trend.on) {
      const L = Math.min(120, n), a = e - L + 1;
      surge = { hit, months: L, A: quickM(pcRun(x, a, e, false).vals), B: quickM(pcRun(x, a, e, true).vals), FA: quickM(pcRun(x, s, e, false).vals), FB: quickM(pcRun(x, s, e, true).vals) };
    }
    return { x, s, e, n, full, eras, decades, roll, surge };
  }
  function pcVerdict(P) {
    const lv = (v, th) => (v <= th[0] + 1e-9 ? 'good' : v <= th[1] + 1e-9 ? 'warn' : 'bad');
    const L3 = { good: '안정', warn: '보통', bad: '큼', na: '판단 보류' };
    const rows = [], R = P.roll, crit = (+$('#o-hi').value || 0) / 100;
    if (R) {
      const sp = R.p90 - R.p10; let st = lv(sp, PCT.ret); if (R.min < 0 && st === 'good') st = 'warn';
      rows.push({ dim: '수익 일관성', sub: '10년 구간 CAGR', st, label: L3[st], why: [
        `10년 구간 ${R.count}개(1개월 간격)의 CAGR이 하위 10% `, bnum(pctm(R.p10, 1)), ' ~ 상위 10% ', bnum(pctm(R.p90, 1)), `로 폭 ${(sp * 100).toFixed(1)}%p예요. 가장 나빴던 10년은 `, bnum(pctm(R.min, 1)),
        ` (${BT.label(R.minS)}–${BT.label(R.minS + 119)})` + (R.min < 0 ? '로, 10년을 들고 있어도 손실이었어요.' : '이에요.')] });
      const ms = R.mP90 - R.mP10, st2 = lv(ms, PCT.risk);
      const E10 = P.eras[0], r10 = E10 && E10.ok && !E10.same ? E10.rec : null;
      const ratio = r10 && P.full.mdd < -0.005 ? r10.mdd / P.full.mdd : null;
      const over = crit > 0 && crit < 1 ? R.m.filter(v => -v > crit + 1e-9).length / R.m.length : 0;
      const why2 = ['10년 구간 MDD는 하위 10% ', bnum(mpct1(R.mP10)), ' ~ 상위 10% ', bnum(mpct1(R.mP90)), `로 폭 ${(ms * 100).toFixed(1)}%p예요 (가장 깊을 때 ${mpct1(R.mWorst)}, 가장 얕을 때 ${mpct1(R.mBest)}).`];
      if (ratio != null && ratio < 0.6) why2.push(` 최근 10년 MDD ${mpct1(r10.mdd)}는 전체 기간 ${mpct1(P.full.mdd)}의 ${Math.round(ratio * 100)}%뿐이라, 최근 구간만 보면 위험을 낮게 볼 수 있어요.`);
      if (over > 0) why2.push(` 10년 구간의 ${Math.round(over * 100)}%에서 MDD가 내 기준 상한 ${Math.round(crit * 100)}%보다 깊었어요.`);
      rows.push({ dim: '위험 일관성', sub: '10년 구간 MDD', st: st2, label: L3[st2], why: why2 });
    } else rows.push({ dim: '수익·위험 일관성', sub: '10년 구간', st: 'na', label: L3.na, why: ['분석 기간이 10년보다 짧아 10년 구간끼리 비교할 수 없어요. 기간을 늘려 보세요.'] });
    const E20 = P.eras[1], E10b = P.eras[0];
    const E = E20 && E20.ok && !E20.same ? E20 : (E10b && E10b.ok && !E10b.same ? E10b : null);
    if (E) {
      const d = E.rec.cagr - E.old.cagr, st = lv(Math.abs(d), E.Y === 20 ? PCT.era20 : PCT.era10);
      rows.push({ dim: '가장 과거 vs 최근', sub: `${E.Y}년 구간`, st, label: L3[st], why: [
        'CAGR이 가장 과거 ', bnum(pctm(E.old.cagr, 1)), ` (${BT.label(E.old.a)}–${BT.label(E.old.b)}) → 최근 `, bnum(pctm(E.rec.cagr, 1)), ` (${BT.label(E.rec.a)}–${BT.label(E.rec.b)}), 차이 ${ppTxt(d)}. MDD는 ${mpct1(E.old.mdd)} → ${mpct1(E.rec.mdd)}.` +
        (E.old.b >= E.rec.a ? ' 두 구간이 일부 겹쳐요.' : '')] });
    } else rows.push({ dim: '가장 과거 vs 최근', sub: '', st: 'na', label: L3.na, why: ['분석 기간이 짧아 맨 앞과 맨 뒤 구간이 같아요.'] });
    const S = P.surge;
    if (S) {
      const d = S.B.cagr - S.A.cagr, st = lv(Math.abs(d), PCT.surge);
      rows.push({ dim: '최근 급등 의존', sub: '보정 종목 ' + S.hit.join(', '), st, label: { good: '낮음', warn: '보통', bad: '높음' }[st], why: [
        `추세 보정 데이터로 바꾸면 최근 ${monthsTxt(S.months)} CAGR이 `, bnum(pctm(S.A.cagr, 1)), ' → ', bnum(pctm(S.B.cagr, 1)), ` (${ppTxt(d)}), 전체 기간은 ${pctm(S.FA.cagr, 1)} → ${pctm(S.FB.cagr, 1)}이에요.`] });
    } else rows.push({ dim: '최근 급등 의존', sub: '', st: 'na', label: '해당 없음', why: [state.trend.on ? '이 포트폴리오에는 급등으로 보정한 종목이 없어요.' : '추세 보정이 꺼져 있어요 (점검 › 추세 유지 보정).'] });
    const nb = rows.filter(r => r.st === 'bad').length, nw = rows.filter(r => r.st === 'warn').length, nk = rows.filter(r => r.st !== 'na').length;
    const overall = !nk ? 'na' : nb ? 'bad' : nw >= 2 ? 'warn' : 'good';
    return { rows, overall, title: { good: '시기와 관계없이 비교적 일관돼요', warn: '시기에 따라 차이가 있어요', bad: '시기에 따라 크게 달라요', na: '판단하기에 기간이 짧아요' }[overall] };
  }
  function renderVerdict(P, V) {
    const host = $('#pc-verdict'); host.innerHTML = '';
    const head = el('div', 'vd-head');
    const badge = el('div', 'vd-badge ' + V.overall); badge.append(stIcon(V.overall), document.createTextNode(V.title)); head.appendChild(badge);
    head.appendChild(el('span', 'vd-sub', `${P.x.name} · ${BT.label(P.s)}–${BT.label(P.e)} (${monthsTxt(P.n)})` + (state.last.adj ? ' · 추세 보정 데이터' : '')));
    host.appendChild(head);
    const box = el('div', 'vd-rows');
    for (const r of V.rows) {
      const row = el('div', 'vd-row');
      const dim = el('div', 'dim', r.dim); if (r.sub) dim.appendChild(el('small', null, r.sub));
      const st = el('div', 'st'); st.append(stIcon(r.st), document.createTextNode(r.label));
      const why = el('div', 'why'); for (const w of r.why) why.append(typeof w === 'string' ? document.createTextNode(w) : w);
      row.append(dim, st, why); box.appendChild(row);
    }
    host.appendChild(box);
    const d = el('details', 'vd-crit'); d.appendChild(el('summary', null, '판정 기준 보기'));
    const ul = el('ul');
    ['수익 일관성: 10년 구간 CAGR의 하위·상위 10% 차이가 5%p 이하면 안정, 10%p 이하면 보통, 넘으면 큼 (손실 난 10년이 있으면 최소 보통)',
      '위험 일관성: 10년 구간 MDD의 하위·상위 10% 차이가 15%p 이하면 안정, 30%p 이하면 보통, 넘으면 큼',
      '가장 과거 vs 최근: 20년 구간 CAGR 차이가 2%p 이하면 안정, 5%p 이하면 보통 (분석 기간이 20년보다 짧으면 10년 구간으로 3%p·6%p)',
      '최근 급등 의존: 추세 보정 데이터에서 최근 10년 CAGR 변화가 1%p 미만이면 낮음, 3%p 이하면 보통, 넘으면 높음',
      '종합: 큼·높음이 하나라도 있으면 ‘크게 달라요’, 보통이 둘 이상이면 ‘차이가 있어요’, 그 밖에는 ‘비교적 일관돼요’. 판단을 돕는 눈금이지 합격선은 아니고, MDD 수준을 감당할 수 있는지는 따로 봐야 해요.'
    ].forEach(t => ul.appendChild(el('li', null, t)));
    d.appendChild(ul); host.appendChild(d);
  }
  function renderPcTable(P) {
    const t = $('#pc-table'); t.innerHTML = '';
    const rows = [{ sep: '전체' }, { lab: '전체 기간', w: P.full, full: true }];
    const eras = P.eras.filter(E => E.ok && !E.same);
    if (eras.length) { rows.push({ sep: '길이별 · 가장 과거 ↔ 최근' }); eras.forEach(E => { rows.push({ lab: `가장 과거 ${E.Y}년`, w: E.old }); rows.push({ lab: `최근 ${E.Y}년`, w: E.rec, end: true }); }); }
    if (P.decades.length) { rows.push({ sep: '연대별' }); P.decades.forEach(D => rows.push({ lab: `${D.d}년대` + (D.partial ? ' (일부)' : ''), w: D })); }
    const ws = rows.filter(r => r.w).map(r => r.w);
    const cLo = Math.min(0, ...ws.map(w => w.cagr)), cHi = Math.max(0.0001, ...ws.map(w => w.cagr)), mLo = Math.min(-0.01, ...ws.map(w => w.mdd));
    const thead = el('thead'), hr = el('tr');
    ['구간', 'CAGR', 'MDD (구간 안)', '최장 회복', '전체 기간 대비 CAGR'].forEach(h => hr.appendChild(el('th', null, h)));
    thead.appendChild(hr); t.appendChild(thead);
    const bar = (v, lo, hi, ref) => {
      const b = el('div', 'mbar'), span = hi - lo || 1, z = (0 - lo) / span * 100, p = (v - lo) / span * 100;
      const f = el('i'); f.style.left = Math.min(z, p) + '%'; f.style.width = Math.max(0.5, Math.abs(p - z)) + '%'; f.style.background = v < 0 ? 'var(--hm-neg)' : 'var(--hm-pos)'; b.appendChild(f);
      if (lo < 0 && hi > 0) { const u = el('u'); u.style.left = z + '%'; b.appendChild(u); }
      if (ref != null) { const r = el('s'); r.style.left = ((ref - lo) / span * 100) + '%'; b.appendChild(r); }
      b.setAttribute('aria-hidden', 'true');
      return b;
    };
    const tb = el('tbody');
    for (const r of rows) {
      const tr = el('tr');
      if (r.sep) { tr.className = 'sep'; const th = el('th', null, r.sep); th.colSpan = 5; tr.appendChild(th); tb.appendChild(tr); continue; }
      if (r.full) tr.classList.add('full'); if (r.end) tr.classList.add('pair-end');
      const w = r.w, lab = k => (k === 0 ? '시작' : BT.label(w.a + k - 1));
      const th = el('th', null, r.lab); th.appendChild(el('span', 'when', `${BT.label(w.a)}–${BT.label(w.b)}`)); tr.appendChild(th);
      const c1 = el('td'); c1.dataset.label = 'CAGR (이 구간)'; const v1 = el('div', 'mval'); v1.append(el('span', null, pctm(w.cagr, 1)), bar(w.cagr, cLo, cHi, r.full ? null : P.full.cagr)); c1.appendChild(v1); if (w.cagr < 0) c1.classList.add('neg'); tr.appendChild(c1);
      const c2 = el('td'); c2.dataset.label = 'MDD (이 구간)'; const v2 = el('div', 'mval'); v2.append(el('span', null, mpct1(w.mdd)), bar(w.mdd, mLo, 0, r.full ? null : P.full.mdd)); c2.appendChild(v2);
      if (w.mdd < 0) c2.title = `${lab(w.mPk)} → ${lab(w.mTr)}`; tr.appendChild(c2);
      const c3 = el('td', null, w.uw ? dur(w.uw) + (w.ong ? '+' : '') : '없음'); c3.dataset.label = '최장 회복'; tr.appendChild(c3);
      const c4 = el('td', 'dlt'); c4.dataset.label = '전체 기간 대비 CAGR';
      const d = w.cagr - P.full.cagr;
      if (r.full) c4.appendChild(el('span', 'na', '기준'));
      else if (Math.abs(d) < 0.0005) c4.appendChild(el('span', 'na', '같음'));
      else c4.appendChild(el('span', d > 0 ? 'up' : 'dn', (d > 0 ? '▲ ' : '▼ ') + ppTxt(d)));
      tr.appendChild(c4); tb.appendChild(tr);
    }
    t.appendChild(tb);
    $('#pc-tbl-note').textContent = '구간마다 목표 비중으로 새로 시작해 계산했어요.';
    const key = $('#pc-key'); key.innerHTML = '';
    const k1 = el('span'); k1.append(el('s'), document.createTextNode('세로선 = 전체 기간 값')); key.append(k1, el('span', null, '막대 = 0에서 그 구간 값까지'), el('span', null, '+ = 구간 끝까지 아직 회복 전'));
  }
  /* ---- start year × end year map ---- */
  const HEAT = { cagr: { edges: [-0.12, -0.09, -0.06, -0.03, 0, 0.03, 0.06, 0.09, 0.12], ttl: 'CAGR (연복리)' }, mdd: { edges: [-0.5, -0.4, -0.3, -0.2, -0.1], ttl: 'MDD (최대 낙폭)' } };
  const heatBin = (metric, v) => { const E = HEAT[metric].edges; let k = 0; while (k < E.length && v >= E[k] - 1e-12) k++; return k; };
  function heatFill(metric, k) {
    if (metric === 'cagr') { const p = [100, 78, 58, 40, 22, 22, 40, 58, 78, 100][k]; return `color-mix(in oklab, ${k < 5 ? 'var(--hm-neg)' : 'var(--hm-pos)'} ${p}%, var(--hm-mid))`; }
    return `color-mix(in oklab, var(--hm-neg) ${[100, 82, 64, 46, 30, 14][k]}%, var(--hm-mid))`;
  }
  function heatLabel(metric, k) {
    const E = HEAT[metric].edges, f = v => (v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) + '%';
    if (metric === 'mdd') { if (k === 0) return `${f(E[0])}보다 깊음`; if (k === E.length) return `${f(E[E.length - 1])} ~ 0%`; return `${f(E[k - 1])} ~ ${f(E[k])}`; }
    if (k === 0) return `${f(E[0])} 미만`; if (k === E.length) return `${f(E[E.length - 1])} 이상`; return `${f(E[k - 1])} ~ ${f(E[k])}`;
  }
  function pcHeat(x) {
    const { s, e } = state.last, y0 = BT.ym(s)[0], y1 = BT.ym(e)[0];
    const ys = []; for (let y = y0; y <= y1; y++) ys.push(y);
    const cells = [], at = new Map();
    for (let i = 0; i < ys.length; i++) {
      const a = Math.max(s, BT.idxOf(ys[i], 1));
      for (let j = i; j < ys.length; j++) {
        const b = Math.min(e, BT.idxOf(ys[j], 12)); if (b - a + 1 < 12) continue;
        const c = Object.assign(quickM(pcRun(x, a, b).vals), { a, b, i, j }); cells.push(c); at.set(i * ys.length + j, c);
      }
    }
    return { ys, cells, at };
  }
  function drawHeat() {
    const host = $('#pc-heat'), lg = $('#pc-legend'); if (!host) return;
    host.innerHTML = ''; lg.innerHTML = '';
    const H = state.pcHeat; if (!H) return;
    const metric = state.pc.metric, nY = H.ys.length;
    document.querySelectorAll('#pc-metric button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === metric ? 'true' : 'false'));
    if (!H.cells.length) { host.appendChild(el('p', 'empty', '12개월 이상인 구간이 없어요.')); return; }
    const W = Math.max(260, host.clientWidth || 640), m = { l: 40, r: 8, t: 20, b: 32 };
    const cw = Math.max(4, Math.min(18, (W - m.l - m.r) / nY)), ch = Math.max(4, Math.min(13, cw));
    const Wd = Math.ceil(m.l + cw * nY + m.r), Hd = Math.ceil(m.t + ch * nY + m.b);
    const root = svg('svg', { viewBox: `0 0 ${Wd} ${Hd}`, width: Wd, height: Hd, role: 'img', 'aria-label': `시작 연도(세로)와 끝 연도(가로)별 ${HEAT[metric].ttl} 지도. 칸을 누르면 그 구간을 자세히 볼 수 있어요.` }, host);
    const gap = cw >= 8 ? 1.5 : 0.75;
    for (const c of H.cells) {
      const r = svg('rect', { x: (m.l + c.j * cw + gap / 2).toFixed(2), y: (m.t + c.i * ch + gap / 2).toFixed(2), width: Math.max(1, cw - gap).toFixed(2), height: Math.max(1, ch - gap).toFixed(2), rx: cw >= 10 ? 2 : 0.6 }, root);
      r.style.fill = heatFill(metric, heatBin(metric, metric === 'cagr' ? c.cagr : c.mdd));
    }
    // year labels: keep a minimum gap so they never collide
    const pick = (minGap, size) => { const out = []; let last = -1e9; H.ys.forEach((y, k) => { const pos = k * size; const want = k === 0 || y % 5 === 0 || (nY <= 12); if (want && pos - last >= minGap) { out.push(k); last = pos; } }); return out; };
    for (const k of pick(12, ch)) { const tx = svg('text', { x: m.l - 6, y: (m.t + k * ch + ch / 2 + 3.5).toFixed(1), 'text-anchor': 'end' }, root); tx.textContent = H.ys[k]; }
    for (const k of pick(30, cw)) { const tx = svg('text', { x: (m.l + k * cw + cw / 2).toFixed(1), y: Hd - 14, 'text-anchor': 'middle' }, root); tx.textContent = H.ys[k]; }
    const t1 = svg('text', { x: m.l, y: 12, class: 'ax-t' }, root); t1.textContent = '↓ 시작 연도';
    const t2 = svg('text', { x: Wd - m.r, y: Hd - 1, 'text-anchor': 'end', class: 'ax-t' }, root); t2.textContent = '끝 연도 →';
    // the window chosen below, when it lines up with a cell
    const R = state.pc.range, selC = R ? H.cells.find(c => c.a === R[0] && c.b === R[1]) : null;
    if (selC) { const o = svg('rect', { x: (m.l + selC.j * cw - 1).toFixed(2), y: (m.t + selC.i * ch - 1).toFixed(2), width: (cw + 2).toFixed(2), height: (ch + 2).toFixed(2), fill: 'none', 'stroke-width': 2, rx: 2 }, root); o.style.stroke = 'var(--ink)'; }
    const hl = svg('rect', { fill: 'none', 'stroke-width': 1.5, visibility: 'hidden', rx: 2 }, root); hl.style.stroke = 'var(--ink)';
    const tip = el('div', 'tip'); tip.hidden = true; host.appendChild(tip);
    const cellAt = ev => { const r = root.getBoundingClientRect(); const sx = (ev.clientX - r.left) * (Wd / r.width), sy = (ev.clientY - r.top) * (Hd / r.height); const j = Math.floor((sx - m.l) / cw), i = Math.floor((sy - m.t) / ch); return i >= 0 && j >= 0 && i < nY && j < nY ? H.at.get(i * nY + j) || null : null; };
    const hide = () => { tip.hidden = true; hl.setAttribute('visibility', 'hidden'); };
    const show = (c, ev) => {
      hl.setAttribute('x', (m.l + c.j * cw).toFixed(2)); hl.setAttribute('y', (m.t + c.i * ch).toFixed(2)); hl.setAttribute('width', cw.toFixed(2)); hl.setAttribute('height', ch.toFixed(2)); hl.setAttribute('visibility', 'visible');
      tip.innerHTML = ''; tip.appendChild(el('div', 't', `${BT.label(c.a)} – ${BT.label(c.b)} · ${monthsTxt(c.n)}`));
      for (const [k, v] of [['CAGR', pctm(c.cagr, 1)], ['MDD', mpct1(c.mdd)], ['최장 회복', c.uw ? dur(c.uw) + (c.ong ? '+' : '') : '없음']]) { const row = el('div', 'r'); row.append(el('span', null, k), el('b', null, v)); tip.appendChild(row); }
      tip.hidden = false;
      const hr = host.getBoundingClientRect(), px = ev.clientX - hr.left, py = ev.clientY - hr.top, tw = tip.offsetWidth, th = tip.offsetHeight;
      tip.style.left = Math.max(0, px + 14 + tw > hr.width ? px - tw - 14 : px + 14) + 'px';
      tip.style.top = Math.max(0, Math.min(py - th / 2, hr.height - th)) + 'px';
    };
    root.addEventListener('pointermove', ev => { const c = cellAt(ev); if (c) show(c, ev); else hide(); });
    root.addEventListener('pointerleave', hide);
    root.addEventListener('click', ev => { const c = cellAt(ev); if (!c) return; setPcRange(c.a, c.b, true); goTo('pc-custom-sec', 'nearest'); });
    root.style.cursor = 'pointer';
    // legend: swatches from best to worst
    lg.appendChild(el('div', 'ttl', HEAT[metric].ttl));
    const nB = HEAT[metric].edges.length + 1, counts = new Array(nB).fill(0);
    for (const c of H.cells) counts[heatBin(metric, metric === 'cagr' ? c.cagr : c.mdd)]++;
    for (let k = nB - 1; k >= 0; k--) { const row = el('div', 'hl-row'); const i = el('i'); i.style.background = heatFill(metric, k); row.append(i, el('span', null, heatLabel(metric, k))); if (!counts[k]) { row.style.opacity = '0.45'; row.title = '이 색에 해당하는 구간이 없어요'; } lg.appendChild(row); }
    $('#pc-heat-note').textContent = '칸 하나 = 시작 연도 1월부터 끝 연도 12월까지 보유한 결과. 대각선은 그해 1년, 오른쪽 위 끝은 전체 기간이에요. 칸을 누르면 아래 ‘직접 고른 구간’에서 그 구간을 따로 계산해요.' + (metric === 'mdd' ? ` 내 기준 MDD 상한은 ${Math.round(+$('#o-hi').value || 30)}%예요.` : '');
  }
  document.querySelectorAll('#pc-metric button').forEach(b => b.addEventListener('click', () => { state.pc.metric = b.dataset.m; drawHeat(); }));
  /* ---- a window of your choice ---- */
  function pcDefaultRange(P) { return P.roll ? [P.roll.minS, P.roll.minS + 119] : [P.s, P.e]; }
  function setPcRange(a, b, user) { state.pc.range = [a, b]; if (user) state.pc.auto = false; renderPcCustom(); drawHeat(); }
  function renderPcQuick(P) {
    const host = $('#pc-quick'); host.innerHTML = '';
    const items = [];
    if (P.roll) { items.push(['가장 나빴던 10년', P.roll.minS, P.roll.minS + 119], ['가장 좋았던 10년', P.roll.maxS, P.roll.maxS + 119], ['최근 10년', P.e - 119, P.e], ['가장 과거 10년', P.s, P.s + 119]); }
    items.push(['전체 기간', P.s, P.e]);
    const R = state.pc.range;
    for (const [txt, a, b] of items) {
      const btn = el('button', 'chip', txt); btn.type = 'button'; btn.setAttribute('aria-pressed', R && R[0] === a && R[1] === b ? 'true' : 'false');
      btn.addEventListener('click', () => setPcRange(a, b, true)); host.appendChild(btn);
    }
  }
  function renderPcCustom() {
    const P = state.pcP, host = $('#pc-custom'); host.innerHTML = ''; if (!P) return;
    let [a, b] = state.pc.range || pcDefaultRange(P);
    a = Math.max(P.s, Math.min(a, P.e)); b = Math.max(P.s, Math.min(b, P.e)); state.pc.range = [a, b];
    const [ay, am] = BT.ym(a), [by, bm] = BT.ym(b);
    $('#pc-sy').value = ay; $('#pc-sm').value = am; $('#pc-ey').value = by; $('#pc-em').value = bm;
    renderPcQuick(P);
    if (b - a + 1 < 12) { host.appendChild(el('p', 'notice warn', '12개월 이상인 구간을 골라 주세요(시작이 종료보다 12개월 이상 앞서야 해요).')); return; }
    const x = P.x, sA = BT.stats(pcRun(x, a, b)), sF = state.pcFullStats, n = b - a + 1;
    const dC = sA.cagr - sF.cagr, dM = sA.mdd - sF.mdd;
    host.appendChild(el('p', 'pc-title', `${x.name} · ${BT.label(a)}–${BT.label(b)} (${monthsTxt(n)})`));
    const cTxt = Math.abs(dC) < 0.0005 ? 'CAGR이 전체 기간과 같고' : `전체 기간보다 CAGR이 ${Math.abs(dC * 100).toFixed(1)}%p ${dC > 0 ? '높고' : '낮고'}`;
    const mTxt = Math.abs(dM) < 0.0005 ? `MDD는 ${mpct1(sA.mdd)}로 전체 기간과 같았어요` : `MDD는 ${mpct1(sA.mdd)}로 전체(${mpct1(sF.mdd)})보다 ${dM > 0 ? '얕았어요' : '깊었어요'}`;
    host.appendChild(el('p', 'small', `이 구간은 ${cTxt}, ${mTxt}.`));
    const t = el('table', 'pccmp'), thead = el('thead'), hr = el('tr');
    ['지표', `선택 구간 (${BT.label(a)}–${BT.label(b)})`, `전체 기간 (${BT.label(P.s)}–${BT.label(P.e)})`, '차이'].forEach(h => hr.appendChild(el('th', null, h)));
    thead.appendChild(hr); t.appendChild(thead);
    const tb = el('tbody');
    const row = (lab, va, vf, diff, good, subA, subF) => {
      const tr = el('tr'); tr.appendChild(el('th', null, lab));
      const ta = el('td', null, va); ta.dataset.label = '선택 구간'; if (subA) ta.appendChild(el('span', 'sub', subA)); tr.appendChild(ta);
      const tf = el('td', null, vf); tf.dataset.label = '전체 기간'; if (subF) tf.appendChild(el('span', 'sub', subF)); tr.appendChild(tf);
      const td = el('td', 'dlt'); td.dataset.label = '차이'; if (diff) td.appendChild(el('span', good == null ? null : good ? 'up' : 'dn', diff)); tr.appendChild(td);
      tb.appendChild(tr);
    };
    const mi = s2 => { const m2 = s2.mddInfo; return m2.mdd < 0 ? `${m2.peakLabel} → ${m2.troughLabel}` : ''; };
    row('CAGR', pctm(sA.cagr), pctm(sF.cagr), Math.abs(dC) < SAME ? '같음' : (dC > 0 ? '▲ ' : '▼ ') + ppTxt(dC), Math.abs(dC) < SAME ? null : dC > 0);
    row(`최종 금액 (초기 ${money(state.initial)})`, money(state.initial * sA.final), money(state.initial * sF.final), '', null);
    row('MDD (구간 안 최대 낙폭)', mpct(sA.mdd), mpct(sF.mdd), Math.abs(dM) < SAME ? '같음' : (dM > 0 ? '▲ ' : '▼ ') + `${Math.abs(dM * 100).toFixed(1)}%p ${dM > 0 ? '얕음' : '깊음'}`, Math.abs(dM) < SAME ? null : dM > 0, mi(sA), mi(sF));
    const uA = sA.uw.months, uF = sF.uw.months, dU = uA - uF;
    row('최장 회복 기간', uA ? dur(uA) + (sA.uw.ongoing ? '+' : '') : '없음', uF ? dur(uF) + (sF.uw.ongoing ? '+' : '') : '없음', dU ? (dU < 0 ? '▲ ' : '▼ ') + `${dur(Math.abs(dU))} ${dU < 0 ? '짧음' : '김'}` : '같음', dU ? dU < 0 : null);
    const dS = sA.stdev - sF.stdev;
    row('표준편차 (연)', pctm(sA.stdev), pctm(sF.stdev), Math.abs(dS) < SAME ? '같음' : (dS < 0 ? '▲ ' : '▼ ') + `${Math.abs(dS * 100).toFixed(1)}%p ${dS < 0 ? '낮음' : '높음'}`, Math.abs(dS) < SAME ? null : dS < 0);
    const dSh = (sA.sharpe != null && sF.sharpe != null) ? sA.sharpe - sF.sharpe : null;
    row('샤프 비율', num(sA.sharpe), num(sF.sharpe), dSh == null ? '' : Math.abs(dSh) < 0.005 ? '같음' : (dSh > 0 ? '▲ +' : '▼ −') + Math.abs(dSh).toFixed(2), dSh == null || Math.abs(dSh) < 0.005 ? null : dSh > 0);
    row('최악 연도', sA.worst ? `${spct(sA.worst.ret)} (${sA.worst.year})` : '–', sF.worst ? `${spct(sF.worst.ret)} (${sF.worst.year})` : '–', '', null);
    t.appendChild(tb); const wrap = el('div', 'tbl-wrap'); wrap.appendChild(t); host.appendChild(wrap);
  }
  ['#pc-sy', '#pc-sm', '#pc-ey', '#pc-em'].forEach(id => $(id).addEventListener('change', () => {
    setPcRange(BT.idxOf(+$('#pc-sy').value, +$('#pc-sm').value), BT.idxOf(+$('#pc-ey').value, +$('#pc-em').value), true);
  }));
  function renderPeriod() {
    if (!state.last) return;
    const x = pcCur(); if (!x) return;
    const pick = $('#pc-port'); pick.innerHTML = '';
    for (const s2 of state.last.series) {
      const b = el('button', 'chip'); b.type = 'button'; b.setAttribute('aria-pressed', s2.key === x.key ? 'true' : 'false');
      const k = el('span', 'key'); k.style.background = s2.color; b.append(k, document.createTextNode(s2.name));
      b.addEventListener('click', () => { if (state.pc.key === s2.key) return; state.pc.key = s2.key; state.pc.auto = true; renderPeriod(); });
      pick.appendChild(b);
    }
    $('#pc-data').textContent = `리밸런싱 ${x.bench ? '안 함(벤치마크)' : REBAL_TXT[state.rebal]} · 배당 ${state.div ? '현금 수령' : '재투자'} · ${state.real ? '실질' : '명목'}` + (state.last.adj ? ' · 추세 보정 데이터' : ' · 실제 데이터');
    const P = pcCompute(x); state.pcP = P; state.pcFullStats = BT.stats(pcRun(x, P.s, P.e));
    renderVerdict(P, pcVerdict(P));
    renderPcTable(P);
    state.pcHeat = pcHeat(x);
    const ys = []; for (let y = BT.ym(P.s)[0]; y <= BT.ym(P.e)[0]; y++) ys.push([y, y + '년']);
    fillSelect($('#pc-sy'), ys); fillSelect($('#pc-ey'), ys); fillSelect($('#pc-sm'), monthItems); fillSelect($('#pc-em'), monthItems);
    const r = state.pc.range;   // keep a chosen window while it still fits, otherwise show the default
    if (state.pc.auto || !r || r[0] < P.s || r[1] > P.e || r[1] - r[0] + 1 < 12) { state.pc.range = pcDefaultRange(P); state.pc.auto = true; }
    renderPcCustom(); drawHeat();
  }
  $('#o-hi').addEventListener('change', () => { if (state.last) renderPeriod(); });

  /* ---------- v8: folded sections ('고급' and the like), each remembered per device ---------- */
  const FOLD_KEY = 'etf-backtester.folds.v1';
  const foldEls = () => [...document.querySelectorAll('details[data-fold]')];
  function foldsRead() { try { const o = JSON.parse(window.localStorage.getItem(FOLD_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (_) { return {}; } }
  function foldsSave() { const o = {}; foldEls().forEach(d => { if (d.open) o[d.dataset.fold] = 1; }); try { window.localStorage.setItem(FOLD_KEY, JSON.stringify(o)); } catch (_) {} }
  let foldRedrawT = null;
  function initFolds() {
    const saved = foldsRead();
    foldEls().forEach(d => {
      d.open = !!saved[d.dataset.fold];
      d.addEventListener('toggle', () => {
        // charts drawn while folded had no width
        if (d.open && d.querySelector('.chart-box')) { clearTimeout(foldRedrawT); foldRedrawT = setTimeout(() => { drawCharts(); drawFrontier(); drawHeat(); }, 30); }
        foldsSave();
      });
    });
    try { window.localStorage.removeItem('etf-backtester.view.v1'); } catch (_) {}   // the v7 simple/full switch is gone
  }
  /* open every fold around an element (a jump target inside a closed fold would be invisible) */
  function openFoldsAround(t) { for (let d = t && t.closest('details'); d; d = d.parentElement ? d.parentElement.closest('details') : null) d.open = true; }
  $('#fold-open-all').addEventListener('click', () => { document.querySelectorAll('details.fold').forEach(d => { d.open = true; }); toast('접힌 항목을 모두 펼쳤어요.'); });
  $('#fold-close-all').addEventListener('click', () => { document.querySelectorAll('details.fold').forEach(d => { d.open = false; }); toast('접힌 항목을 모두 접었어요.'); });
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('#tb-nav a, #bnav a').forEach(a => a.addEventListener('click', ev => {
    ev.preventDefault();
    if (state.layout === 'tabs') { showTab(a.dataset.g, { user: true }); return; }
    const g = document.getElementById(a.dataset.g); if (g) g.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
  }));
  function markNav() {
    let cur = 'g-setup';
    if (state.layout === 'tabs') cur = state.tab;
    else {
      const bar = document.getElementById('topbar'); const y = (bar ? bar.getBoundingClientRect().bottom : 56) + 30;
      for (const id of TAB_IDS) { const g = document.getElementById(id); if (!g || !g.getClientRects().length) continue; if (g.getBoundingClientRect().top <= y) cur = id; }
    }
    document.querySelectorAll('#tb-nav a, #bnav a').forEach(a => {
      const on = a.dataset.g === cur; a.classList.toggle('on', on);
      if (state.layout === 'tabs') { a.setAttribute('role', 'tab'); a.setAttribute('aria-selected', on ? 'true' : 'false'); a.removeAttribute('aria-current'); }
      else { a.removeAttribute('role'); a.removeAttribute('aria-selected'); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }
    });
  }

  /* ---------- v7.2: tabs (default) or one long page (the v7.1 layout), remembered per device ---------- */
  const TAB_IDS = ['g-setup', 'g-results', 'g-checks', 'g-opt', 'g-ref'];
  const LAYOUT_KEY = 'etf-backtester.layout.v1';
  function readLayout() { try { return window.localStorage.getItem(LAYOUT_KEY) === 'page' ? 'page' : 'tabs'; } catch (_) { return 'tabs'; } }
  const paneOf = g => document.querySelector(`.pane[data-g="${g}"]`);
  const redrawVisible = () => requestAnimationFrame(() => { drawCharts(); drawFrontier(); drawHeat(); });
  /* the optimizer is heavy: run it once its tab is open (or at once on the one-page layout) */
  function maybeRunDeferredOpt() {
    if (!state.optDeferred) return;
    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;
    state.optDeferred = false; setTimeout(runOpt, 60);
  }
  function showTab(g, opts = {}) {
    if (!TAB_IDS.includes(g)) g = 'g-setup';
    state.tab = g;
    document.documentElement.dataset.tab = g;
    if (state.layout === 'tabs') {
      TAB_IDS.forEach(id => { const p = paneOf(id); if (p) p.classList.toggle('on', id === g); });
      if (!opts.keepScroll) window.scrollTo(0, 0);
      if (opts.user) { try { history.replaceState(null, '', '#' + g); } catch (_) {} }   // not during load: the browser would scroll to the anchor
      redrawVisible();
    }
    markNav();
    maybeRunDeferredOpt();
  }
  function setLayout(mode, save) {
    state.layout = mode === 'page' ? 'page' : 'tabs';
    document.documentElement.classList.toggle('tabs', state.layout === 'tabs');
    $('#lay-tabs').setAttribute('aria-pressed', state.layout === 'tabs' ? 'true' : 'false');
    $('#lay-page').setAttribute('aria-pressed', state.layout === 'page' ? 'true' : 'false');
    $('#tb-nav').setAttribute('role', state.layout === 'tabs' ? 'tablist' : 'navigation');
    if (save) { try { window.localStorage.setItem(LAYOUT_KEY, state.layout); } catch (_) {} }
    $('#bnav').setAttribute('role', state.layout === 'tabs' ? 'tablist' : 'navigation');
    if (state.layout === 'tabs') showTab(state.tab || 'g-setup');
    else { TAB_IDS.forEach(id => { const p = paneOf(id); if (p) p.classList.add('on'); }); redrawVisible(); markNav(); maybeRunDeferredOpt(); }
  }
  $('#lay-tabs').addEventListener('click', () => setLayout('tabs', true));
  $('#lay-page').addEventListener('click', () => setLayout('page', true));
  document.addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) showTab(b.dataset.go, { user: true }); });
  /* jump to an element, opening its tab and any fold around it first */
  function goTo(id, block) {
    const t = document.getElementById(id); if (!t) return;
    if (state.layout === 'tabs') { const p = t.closest('.pane'); if (p && !p.classList.contains('on')) showTab(p.dataset.g, { keepScroll: true }); }
    openFoldsAround(t);
    requestAnimationFrame(() => t.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: block || 'start' }));
  }
  let toastT = null;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4200); }
  /* a small table of the results right under the portfolio cards (tabs), so edits show their effect at once */
  function renderQuickRes() {
    const host = $('#qr-body'); if (!host) return; host.innerHTML = '';
    if (!state.last) { $('#qr-when').textContent = ''; host.appendChild(el('p', 'small muted', '비중 합계가 100%인 포트폴리오가 생기면 여기에서 바로 결과를 보여줘요.')); return; }
    const { s, e, series } = state.last;
    $('#qr-when').textContent = `${BT.label(s)} – ${BT.label(e)} · ${monthsTxt(e - s + 1)} · 처음 ${money(state.initial)}` + (state.last.adj ? ' · 추세 보정 데이터' : '');
    const t = el('table', 'qr-t'), th = el('thead'), hr = el('tr');
    ['포트폴리오', '연 수익률', '최대 낙폭', '최종 금액'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const x of series) {
      const tr = el('tr'); tr.appendChild(seriesTh(x));
      tr.append(el('td', x.st.cagr < 0 ? 'neg' : null, pct(x.st.cagr, 1)), el('td', x.st.mdd < 0 ? 'neg' : null, mpct1(x.st.mdd)), el('td', null, fmtMoneyShort(state.initial * x.st.final)));
      tb.appendChild(tr);
    }
    t.appendChild(tb); const w = el('div', 'tbl-wrap'); w.appendChild(t); host.appendChild(w);
  }
  let navRaf = 0;
  window.addEventListener('scroll', () => { if (navRaf) return; navRaf = requestAnimationFrame(() => { navRaf = 0; markNav(); }); }, { passive: true });

  /* ---------- boot ---------- */
  state.optDeferred = true;   // runs once its panel can be seen (see maybeRunDeferredOpt)
  state.layout = readLayout();
  { const h = (location.hash || '').slice(1); state.tab = TAB_IDS.includes(h) ? h : 'g-setup'; }
  initFolds();
  setLayout(state.layout, false);
  renderPorts();
  recompute();
  validPorts().forEach(p => p.info.tickers.forEach(t => state.optSel.add(t)));
  renderPicker(); buildLife(); fillLife(); renderCritLine(); renderCritSum(); renderWalk(); renderEraCompare();
  initSaved();
  maybeRunDeferredOpt();
  markNav();
})();
