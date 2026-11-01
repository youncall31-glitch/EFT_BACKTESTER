  /* ======================================================================================================
     v7 (new app): KRW view, cash-flow plans (monthly saving, withdrawals, Korean taxes), settings strip
     ====================================================================================================== */
  const FLOW_KEY = 'etf-backtester-v7.flow.v1';
  const TAX_TXT = { none: '세금 미반영', us: '미국 상장 ETF 직접 투자', kr: '국내 상장 해외 ETF', pen: '연금저축·IRP' };
  const FL = {
    c: 0, cy: 0, cf: 'N', cg: 0, cm: 'auto', accY: 20, wm: 'none', w: 0, wp: 4, ws: 0, wi: true, tax: 'none',
    td: 15.4, tc: 22, tded: 250, tk: 15.4, tp: 5.5,
    rtY: 30, rtR: 4, port: null, log: false
  };
  const FL_KRW = { c: 1000000, cy: 12000000, w: 3000000 }, FL_USD = { c: 1000, cy: 12000, w: 3000 };   // starting suggestions per currency
  function flowRead() {
    try {
      const o = JSON.parse(window.localStorage.getItem(FLOW_KEY) || 'null'); if (!o || typeof o !== 'object') return null;
      return o;
    } catch (_) { return null; }
  }
  function flowSave() {
    try { window.localStorage.setItem(FLOW_KEY, JSON.stringify({ fl: FL, cur: state.cur, initU: state.cur === 'USD' ? state.initial : state.initU, initK: state.cur === 'KRW' ? state.initial : state.initK })); } catch (_) {}
  }
  /* readable amount next to a number field: '= 1,000만 원' / '= $1.2M' */
  function amtHint(v) {
    if (!(v > 0)) return '';
    return state.cur === 'KRW' ? '= ' + krwTxt(v) : '= $' + Math.round(v).toLocaleString('en-US');
  }
  const curUnit = () => (state.cur === 'KRW' ? '원' : '$');

  /* ---------- currency ---------- */
  function syncCurUI() {
    const k = state.cur === 'KRW';
    document.querySelectorAll('#cur button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.cur ? 'true' : 'false'));
    $('#init-lbl').textContent = `처음 넣는 돈 (${curUnit()})`;
    $('#init').step = k ? '1000000' : '1000';
    $('#init-h').textContent = amtHint(state.initial);
    $('#cur-note').textContent = k
      ? `달러 수익률에 매달 원/달러 환율 변화를 곱해, 원화로 사서 원화로 판 것처럼 계산해요(환헤지 안 함). 환율 ${BT.label(0)} ${Math.round(BT.fxLevel(0))}원 → ${BT.label(BT.NM - 1)} ${Math.round(BT.fxLevel(BT.NM - 1))}원.`
      : '미국 ETF의 달러 수익률 그대로예요. 원화로 투자했다면 어땠는지 보려면 ‘원화’를 고르세요.';
    $('#real-txt').textContent = k
      ? '한국 소비자물가(통계청)를 빼고 ‘지금 돈의 가치’로 계산해요. 은퇴 자금처럼 구매력이 중요하면 켜 두는 편이 안전해요.'
      : '미국 소비자물가(CPI-U)를 빼고 ‘지금 돈의 가치’로 계산해요. 은퇴 자금처럼 구매력이 중요하면 켜 두는 편이 안전해요.';
    const u = curUnit();
    $('#fl-init-l').textContent = `처음 넣는 돈 (${u})`; $('#fl-c-l').textContent = `${FL.cf === 'Y' ? '매년 초' : '매달'} 넣는 돈 (${u})`; $('#fl-w-l').textContent = `매달 빼는 돈 (${u})`;
    ['#fl-init', '#fl-c', '#fl-w'].forEach(id => { $(id).step = k ? '100000' : '100'; });
  }
  function setCurrency(c) {
    c = c === 'KRW' ? 'KRW' : 'USD';
    if (c === state.cur) return;
    const prev = state.cur;
    if (prev === 'KRW') state.initK = state.initial; else state.initU = state.initial;
    // carry the plan amounts across at a round rate so a switch does not leave '1,000' won a month
    const pk = prev === 'KRW' ? FL_KRW : FL_USD, nk = c === 'KRW' ? FL_KRW : FL_USD;
    pk.c = FL.c; pk.cy = FL.cy; pk.w = FL.w; FL.c = nk.c; FL.cy = nk.cy; FL.w = nk.w;
    state.cur = BT.setCur(c);
    state.real = BT.setReal(state.real);
    $('#real').checked = state.real;
    state.initial = state.cur === 'KRW' ? state.initK : state.initU;
    $('#init').value = state.initial;
    syncCurUI(); writeFlowInputs(); flowSave();
    recompute(); clearWalk();
    if (state.opt) { if (optBusy) state.rerun = true; else runOpt(); }
    toast(state.cur === 'KRW' ? '원화 기준으로 다시 계산했어요. 금액도 원화로 바뀌었어요.' : '달러 기준으로 다시 계산했어요.');
  }
  $('#cur').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) setCurrency(b.dataset.v); });

  /* ---------- settings strip: what the numbers on this tab were computed with; each chip jumps to its control ---------- */
  function renderCtx() {
    for (const host of document.querySelectorAll('.ctx')) {
      host.innerHTML = '';
      if (!state.last) continue;
      const { s, e } = state.last;
      host.appendChild(el('span', 'ctx-l', '지금 설정'));
      const chip = (txt, target, title, warn) => {
        const b = el('button', 'ctx-c' + (warn ? ' warn' : ''), txt); b.type = 'button'; b.dataset.to = target; b.title = title + ' — 눌러서 바꾸기'; host.appendChild(b);
      };
      chip(`${BT.label(s)}–${BT.label(e)} · ${monthsTxt(e - s + 1)}`, 'sec-set', '분석 기간');
      chip(`처음 ${money(state.initial)}`, 'init', '처음 넣는 돈');
      chip(`리밸런싱 ${REBAL_TXT[state.rebal]}`, 'rebal', '리밸런싱');
      chip(state.cur === 'KRW' ? '원화 기준' : '달러 기준', 'cur', '통화');
      chip(state.real ? '물가 반영(실질)' : '명목', 'real', '물가 반영');
      chip(state.div ? '배당 현금 수령' : '배당 재투자', 'div-lbl', '배당금 처리');
      if (state.last.adj) chip('추세 보정 데이터', 'dm', '결과 데이터', true);
      chip(styleTxt(), 'sec-style', '투자 방식');
      if (host.id === 'ctx-flow') chip(TAX_TXT[FL.tax], 'fl-tax-lbl', '세금');
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('.ctx-c'); if (!b) return;
    const t = document.getElementById(b.dataset.to); if (!t) return;
    goTo(b.dataset.to, 'center');
    const box = t.closest('.field') || t;
    box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
    setTimeout(() => { const f = t.matches('input, select, button') ? t : t.querySelector('input, select, button'); if (f) f.focus({ preventScroll: true }); }, 350);
  });

  /* ---------- plan inputs ---------- */
  const numIn = (sel, d) => { const v = $(sel).value.trim(); return v === '' || !isFinite(+v) ? d : +v; };
  function writeFlowInputs() {
    $('#fl-init').value = state.initial; $('#fl-c').value = FL.cf === 'Y' ? FL.cy : FL.c; $('#acc-y').value = String(FL.accY);
    document.querySelectorAll('#fl-cf button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === FL.cf ? 'true' : 'false')); $('#fl-cg').value = FL.cg; $('#fl-cm').value = String(FL.cm);
    $('#fl-w').value = FL.w; $('#fl-wp').value = FL.wp; $('#fl-ws').value = String(FL.ws); $('#fl-wi').checked = FL.wi;
    $('#fl-td').value = FL.td; $('#fl-tc').value = FL.tc; $('#fl-tded').value = FL.tded; $('#fl-tk').value = FL.tk; $('#fl-tp').value = FL.tp;
    $('#rt-y').value = String(FL.rtY); $('#rt-r').value = FL.rtR;
    document.querySelectorAll('input[name="flw"]').forEach(r => { r.checked = r.value === FL.wm; r.closest('.opt').classList.toggle('on', r.checked); });
    document.querySelectorAll('input[name="flt"]').forEach(r => { r.checked = r.value === FL.tax; r.closest('.opt').classList.toggle('on', r.checked); });
    syncFlowUI();
  }
  function syncFlowUI() {
    $('#fl-init-h').textContent = amtHint(state.initial);
    $('#fl-c-h').textContent = amtHint(FL.cf === 'Y' ? FL.cy : FL.c) + (FL.cf === 'Y' && FL.cy > 0 ? ` · 한 달에 ${state.cur === 'KRW' ? krwTxt(FL.cy / 12) : '$' + Math.round(FL.cy / 12).toLocaleString('en-US')} 꼴` : '');
    $('#fl-c-l').textContent = `${FL.cf === 'Y' ? '매년 초' : '매달'} 넣는 돈 (${curUnit()})`;
    $('#fl-cf-note').textContent = FL.cf === 'Y' ? '해마다 1월 초에 넣어요. 시작 달이 1월이면 첫해에도 처음 넣는 돈과 함께 넣어요.' : FL.cf === 'N' ? '처음 넣는 돈만 넣어요(거치식).' : '';
    $('#fl-c-f').hidden = FL.cf === 'N'; $('#fl-cg-f').hidden = FL.cf === 'N';
    syncStyleUI();
    $('#fl-w-h').textContent = amtHint(FL.w);
    $('#fl-w-f').hidden = FL.wm !== 'fixed';
    $('#fl-wp-f').hidden = FL.wm !== 'pct';
    $('#fl-ws-f').hidden = FL.wm === 'none';
    $('#fl-wi-f').hidden = FL.wm !== 'fixed';
    $('#fl-wi-txt').textContent = state.real ? '물가 반영을 켜 두어서 금액은 시작 시점 돈의 가치로 고정돼요(매달 물가만큼 자동으로 늘어남).' : '해마다 물가만큼 빼는 돈을 늘려요(같은 생활비를 유지).';
    $('#fl-wi').disabled = state.real;
    $('#fl-rates').hidden = FL.tax === 'none';
    document.querySelectorAll('#fl-rates [data-tax]').forEach(f => { f.hidden = !f.dataset.tax.split(' ').includes(FL.tax); });
  }
  function readFlowInputs() {
    if (FL.cf === 'Y') FL.cy = Math.max(0, numIn('#fl-c', 0)); else FL.c = Math.max(0, numIn('#fl-c', 0)); FL.accY = +$('#acc-y').value || 20; FL.cg = numIn('#fl-cg', 0); FL.cm = $('#fl-cm').value === 'auto' ? 'auto' : +$('#fl-cm').value;
    FL.w = Math.max(0, numIn('#fl-w', 0)); FL.wp = Math.max(0, numIn('#fl-wp', 4)); FL.ws = +$('#fl-ws').value || 0; FL.wi = $('#fl-wi').checked;
    FL.td = numIn('#fl-td', 15.4); FL.tc = numIn('#fl-tc', 22); FL.tded = Math.max(0, numIn('#fl-tded', 250)); FL.tk = numIn('#fl-tk', 15.4); FL.tp = numIn('#fl-tp', 5.5);
    FL.rtY = +$('#rt-y').value || 30; FL.rtR = Math.max(0, numIn('#rt-r', 4));
  }
  let flowT = null;
  function flowChanged(now) { readFlowInputs(); syncFlowUI(); flowSave(); clearTimeout(flowT); flowT = setTimeout(() => { renderFlow(); renderCtx(); }, now ? 0 : 200); }
  ['#fl-c', '#fl-cg', '#fl-w', '#fl-wp', '#fl-td', '#fl-tc', '#fl-tded', '#fl-tk', '#fl-tp', '#rt-r'].forEach(id => $(id).addEventListener('input', () => flowChanged()));
  ['#fl-cm', '#fl-ws', '#fl-wi', '#rt-y', '#acc-y'].forEach(id => $(id).addEventListener('change', () => flowChanged(true)));
  document.querySelectorAll('input[name="flw"]').forEach(r => r.addEventListener('change', () => { if (!r.checked) return; FL.wm = r.value; document.querySelectorAll('input[name="flw"]').forEach(x => x.closest('.opt').classList.toggle('on', x.checked)); flowChanged(true); }));
  document.querySelectorAll('input[name="flt"]').forEach(r => r.addEventListener('change', () => { if (!r.checked) return; FL.tax = r.value; document.querySelectorAll('input[name="flt"]').forEach(x => x.closest('.opt').classList.toggle('on', x.checked)); flowChanged(true); }));
  // the starting amount is shared with the input tab
  function setInitial(v, from) {
    if (!(v > 0)) return;
    state.initial = v;
    if (from !== 'init') $('#init').value = v;
    if (from !== 'fl') $('#fl-init').value = v;
    if (from !== 'st') $('#st-init').value = v;
    $('#init-h').textContent = amtHint(v); $('#fl-init-h').textContent = amtHint(v); $('#st-init-h').textContent = amtHint(v);
    flowSave(); schedule();
  }
  $('#init').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) setInitial(v, 'init'); });
  $('#fl-init').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) setInitial(v, 'fl'); });

  /* example plans, in the current currency */
  const FL_PRESETS = [
    { n: '매달 적립만', f: k => ({ cf: 'M', c: k ? 1000000 : 1000, cg: 0, cm: 'auto', wm: 'none' }) },
    { n: '매년 초 적립', f: k => ({ cf: 'Y', cy: k ? 12000000 : 12000, cg: 0, cm: 'auto', wm: 'none' }) },
    { n: '적립 20년 → 인출', f: k => ({ cf: 'M', c: k ? 1000000 : 1000, cg: 3, cm: 20, wm: 'fixed', w: k ? 3000000 : 3000, ws: 20, wi: true }) },
    { n: '은퇴: 4% 인출', f: () => ({ cf: 'N', cm: 'auto', wm: 'fixed', ws: 0, wi: true, rtR: 4 }), init: k => (k ? 1000000000 : 1000000), w: (v) => v * 0.04 / 12 },
    { n: '은퇴: 평가액의 4%', f: () => ({ cf: 'N', cm: 'auto', wm: 'pct', wp: 4, ws: 0 }), init: k => (k ? 1000000000 : 1000000) }
  ];
  (function buildPresets() {
    const host = $('#fl-presets');
    FL_PRESETS.forEach((p, i) => { const b = el('button', 'chip', p.n); b.type = 'button'; b.dataset.i = i; host.appendChild(b); });
    host.addEventListener('click', e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      const p = FL_PRESETS[+b.dataset.i], k = state.cur === 'KRW';
      Object.assign(FL, p.f(k));
      if (p.init) { const v = p.init(k); setInitial(v); if (p.w) FL.w = Math.round(p.w(v)); }
      writeFlowInputs(); flowSave(); renderFlow(); renderCtx();
      toast(`‘${p.n}’ 예시를 넣었어요. 금액은 바꿔서 쓰세요.`);
    });
  })();

  /* ---------- running the plan ---------- */
  function flowOpts(x, extra) {
    const L = state.last, n = L.e - L.s + 1;
    const wStart = FL.wm === 'none' ? n : Math.min(n, FL.ws * 12);
    const cMonths = FL.cm === 'auto' ? (FL.wm === 'none' ? n : wStart) : FL.cm * 12;
    return Object.assign({
      tickers: x.tickers, weights: x.weights, i0: L.s, i1: L.e, rule: x.bench ? 'N' : state.rebal, adj: !!L.adj, div: state.div,
      cur: state.cur, real: state.real, initial: state.initial,
      contrib: { amt: (FL.cf === 'Y' ? FL.cy : FL.cf === 'M' ? FL.c : 0), freq: FL.cf, grow: FL.cg / 100, months: cMonths },
      wd: { mode: FL.wm, amt: FL.w, pct: FL.wp / 100, start: wStart, index: FL.wi },
      tax: { mode: FL.tax, div: FL.td / 100, cg: FL.tc / 100, ded: FL.tded * 10000, kr: FL.tk / 100, pen: FL.tp / 100 }
    }, extra || {});
  }
  function planTxt() {
    const L = state.last, n = L.e - L.s + 1, parts = [`처음 ${money(state.initial)}`];
    const wStart = FL.wm === 'none' ? n : Math.min(n, FL.ws * 12);
    const cMonths = FL.cm === 'auto' ? (FL.wm === 'none' ? n : wStart) : Math.min(n, FL.cm * 12);
    const cAmt = (FL.cf === 'Y' ? FL.cy : FL.cf === 'M' ? FL.c : 0);
    if (cAmt > 0 && cMonths > 0) parts.push(`${FL.cf === 'Y' ? '매년 초' : '매달'} ${money(cAmt)}${FL.cg ? `(해마다 +${FL.cg}%)` : ''} ${monthsTxt(cMonths)}`);
    if (FL.wm === 'fixed' && FL.w > 0) parts.push(`${wStart ? monthsTxt(wStart) + ' 뒤부터' : '처음부터'} 매달 ${money(FL.w)} 인출${state.real ? '' : FL.wi ? '(물가 연동)' : ''}`);
    if (FL.wm === 'pct') parts.push(`${wStart ? monthsTxt(wStart) + ' 뒤부터' : '처음부터'} 평가액의 연 ${FL.wp}% 인출`);
    parts.push(TAX_TXT[FL.tax]);
    return parts.join(' · ');
  }
  function renderFlow() {
    const cards = $('#fl-cards'); if (!cards) return;
    syncFlowUI(); if (document.activeElement !== $('#fl-init')) $('#fl-init').value = state.initial;
    cards.innerHTML = ''; $('#fl-when').textContent = '';
    const msg = $('#fl-msg'); msg.hidden = true;
    state.flow = null;
    if (!state.last) { cards.appendChild(el('p', 'empty', '비중 합계가 100%인 포트폴리오가 생기면 여기에 결과가 나와요.')); drawFlow(); renderFlowTable(); clearRetire(); renderResFlow(); return; }
    const L = state.last;
    const runs = L.series.map(x => ({ x, r: BT.flowSim(flowOpts(x)) }));
    state.flow = { runs, key: L };
    $('#fl-when').textContent = `${BT.label(L.s)} – ${BT.label(L.e)} · ` + planTxt() + (state.real ? ' · 금액은 시작 시점 돈의 가치' : '');
    const notes = [];
    if (FL.wm !== 'none' && FL.ws * 12 >= L.e - L.s + 1) notes.push(`인출 시작(${FL.ws}년 뒤)이 분석 기간보다 늦어 인출은 계산되지 않았어요. 기간을 늘리거나 시작을 앞당기세요.`);
    if (FL.tax !== 'none' && state.real) notes.push('세금은 명목 금액으로 매기고, 보이는 금액만 물가로 나눴어요.');
    if (notes.length) { msg.hidden = false; msg.textContent = notes.join(' '); }
    for (const { x, r } of runs) {
      const card = el('div', 'hc fl-card' + (x.bench ? ' bench' : ''));
      const top = el('div', 'hc-top'); const kk = el('span', 'key'); kk.style.background = x.color;
      top.append(kk, el('span', 'nm', x.bench ? state.bench : x.name)); if (x.bench) top.appendChild(el('span', 'bt', '비교 기준'));
      card.appendChild(top);
      card.appendChild(el('div', 'fl-lab', FL.tax === 'none' ? '마지막 평가액' : '모두 팔고 세금 낸 뒤 남는 돈'));
      card.appendChild(el('div', 'hc-amt', money(r.finalAfter)));
      const from = el('div', 'hc-from');
      if (r.depleted >= 0) { from.classList.add('neg'); from.append('돈이 바닥남 ', el('b', null, BT.label(L.s + r.depleted)), ` (${monthsTxt(r.depleted + 1)} 만에)`); }
      else if (FL.tax !== 'none') from.append('팔기 전 평가액 ', el('b', null, money(r.final)), ' · 청산 세금 ', el('b', null, money(r.liqTax)));
      else from.append('넣은 돈 합계 ', el('b', null, money(r.totIn)), `의 ${r.totIn > 0 ? (r.finalAfter / r.totIn).toFixed(2) : '–'}배`);
      card.appendChild(from);
      const kv = el('div', 'hc-kv fl-kv');
      const cell = (lab, val, neg, sub) => { const d = el('div'); d.append(el('span', null, lab), el('b', neg ? 'neg' : null, val)); if (sub) d.appendChild(el('i', null, sub)); kv.appendChild(d); };
      cell('넣은 돈', fmtMoneyShort(r.totIn), false, r.totIn > state.initial ? `처음 ${fmtMoneyShort(state.initial)} 포함` : null);
      cell('받은 돈', fmtMoneyShort(r.totOut + r.totInc), false, r.totInc > 0 ? `배당 ${fmtMoneyShort(r.totInc)} 포함` : (r.totOut > 0 ? '인출 합계' : '인출 없음'));
      cell('낸 세금', fmtMoneyShort(r.taxAll), false, !(r.taxAll > 0) ? null : FL.tax === 'pen' ? `받을 때 ${fmtMoneyShort(r.taxWd)} · 마지막 ${fmtMoneyShort(r.liqTax)}` : `배당 ${fmtMoneyShort(r.taxDiv)} · 차익 ${fmtMoneyShort(r.taxCg + r.liqTax)}` + (r.taxWd > 0 ? ` · 인출 ${fmtMoneyShort(r.taxWd)}` : ''));
      cell('내 돈 수익률', r.irr == null ? '–' : pct(r.irr, 1), r.irr != null && r.irr < 0, 'IRR · 연');
      cell('시간가중', pct(r.twrCagr, 1), r.twrCagr < 0, FL.tax === 'none' ? '연 수익률' : '연 · 세후');
      cell('최대 낙폭', mpct1(r.mdd), r.mdd < 0, '시간가중');
      card.appendChild(kv);
      cards.appendChild(card);
    }
    if (!FL.port || !runs.some(q => q.x.key === FL.port)) FL.port = runs[0].x.key;
    drawFlow(); renderFlowTable(); markRetireStale(); renderResFlow();
  }
  function drawFlow() {
    const host = $('#c-fl'); if (!host) return;
    if (!state.flow) { host.innerHTML = ''; $('#lg-fl').innerHTML = ''; return; }
    if (!isShown(host)) return;
    const L = state.last, n = L.e - L.s + 1, runs = state.flow.runs;
    const xLabel = t => t === 0 ? BT.label(L.s - 1) + ' (시작)' : BT.label(L.s + t - 1);
    const series = runs.map(({ x, r }) => ({ name: x.bench ? state.bench : x.name, color: x.color, v: Array.from(r.vals) }));
    // net money in (paid in − taken out), drawn dashed like the benchmark
    series.push({ name: '넣은 돈 − 뺀 돈 (원금)', color: 'var(--bench)', bench: true, v: Array.from(runs[0].r.net, v => Math.max(v, 0)) });
    legend($('#lg-fl'), series, true);
    let lo = Infinity; for (const s of series) for (const v of s.v) if (v > 0 && v < lo) lo = v;
    const log = FL.log && isFinite(lo);
    lineChart(host, {
      n: n + 1, xLabel, log, height: 300, aria: '적립·인출 계획의 평가액 선 차트',
      series: log ? series.map(s => ({ ...s, v: s.v.map(v => Math.max(v, lo)) })) : series,
      yFmt: fmtMoneyShort, tipFmt: v => money(v), yMin: log ? undefined : 0
    });
  }
  $('#fl-ax').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b) return;
    FL.log = b.dataset.v === 'log'; document.querySelectorAll('#fl-ax button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); flowSave(); drawFlow();
  });
  /* yearly table for one portfolio */
  function flowYears(r, i0) {
    const out = []; let cur = null, o = null;
    for (let t = 0; t < r.n; t++) {
      const y = BT.ym(i0 + t)[0];
      if (y !== cur) { if (o) out.push(o); cur = y; o = { y, cin: 0, wout: 0, inc: 0, tax: 0, start: r.twr[t], startV: r.vals[t], months: 0 }; }
      o.cin += r.cin[t]; o.wout += r.wout[t]; o.inc += r.inc[t]; o.tax += r.tax[t]; o.months++; o.end = r.vals[t + 1]; o.endT = r.twr[t + 1]; o.plS = r.pl[t - o.months + 1]; o.plE = r.pl[t + 1];
    }
    if (o) out.push(o);
    for (const a of out) { let g = a.start > 0 ? a.endT / a.start - 1 : null; if (g != null && state.real) g = (1 + g) / (a.plE / a.plS) - 1; a.ret = g; }
    return out;
  }
  function renderFlowTable() {
    const chips = $('#fl-port'), t = $('#t-fl'); chips.innerHTML = ''; t.innerHTML = '';
    if (!state.flow) return;
    for (const { x } of state.flow.runs) {
      const b = el('button', 'chip'); b.type = 'button'; b.dataset.k = x.key; b.setAttribute('aria-pressed', x.key === FL.port ? 'true' : 'false');
      const k = el('span', 'key'); k.style.background = x.color; b.append(k, document.createTextNode(' ' + (x.bench ? state.bench : x.name))); chips.appendChild(b);
    }
    const run = state.flow.runs.find(q => q.x.key === FL.port) || state.flow.runs[0];
    const ys = flowYears(run.r, state.last.s);
    const th = el('thead'), hr = el('tr');
    ['연도', '넣은 돈', '뺀 돈', '받은 배당', '낸 세금', '연말 평가액', '그해 수익률'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const a of ys) {
      const tr = el('tr'); tr.appendChild(el('th', null, a.y + (a.months < 12 ? '*' : '')));
      const td = (v, neg) => { const c = el('td', neg ? 'neg' : null, v); tr.appendChild(c); };
      td(a.cin ? money(a.cin) : '–'); td(a.wout ? money(a.wout) : '–'); td(a.inc ? money(a.inc) : '–'); td(a.tax ? money(a.tax) : '–');
      td(money(a.end), a.end <= 0); td(a.ret == null ? '–' : pct(a.ret, 1), a.ret != null && a.ret < 0);
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    state.flow.years = { name: run.x.bench ? state.bench : run.x.name, ys };
  }
  $('#fl-port').addEventListener('click', e => { const b = e.target.closest('button[data-k]'); if (!b) return; FL.port = b.dataset.k; renderFlowTable(); });
  $('#fl-csv').addEventListener('click', async () => {
    const Y = state.flow && state.flow.years; if (!Y) return;
    const unit = state.cur === 'KRW' ? 'KRW' : 'USD';
    const head = ['연도', `넣은 돈(${unit})`, `뺀 돈(${unit})`, `받은 배당(${unit})`, `낸 세금(${unit})`, `연말 평가액(${unit})`, '그해 수익률(%)'];
    const rows = Y.ys.map(a => [a.y + (a.months < 12 ? '*' : ''), a.cin, a.wout, a.inc, a.tax, a.end].map((v, i) => (i === 0 ? v : Math.round(v))).concat(a.ret == null ? '' : (a.ret * 100).toFixed(2)));
    const meta = `# ${Y.name} · ${planTxt()}${state.real ? ' · 시작 시점 돈의 가치' : ''}`;
    const csv = '﻿' + [meta, head.join(',')].concat(rows.map(r => r.join(','))).join('\n');
    const fn = `적립인출_${Y.name.replace(/[^\w가-힣]+/g, '_')}.csv`;
    try {
      if (SV.dl && typeof SV.dl.save === 'function') { const r = await SV.dl.save({ filename: fn, data: csv }); toast(r && r.status === 'saved' ? 'CSV로 저장했어요.' : '저장을 취소했어요.'); }
      else { await navigator.clipboard.writeText(csv); toast('이 화면에서는 파일 저장이 안 돼서 표를 복사했어요. 스프레드시트에 붙여 넣으세요.'); }
    } catch (_) { toast('저장하지 못했어요. 표를 직접 선택해 복사해 주세요.'); }
  });

  /* ---------- retirement check: the same withdrawal plan started in every past month ---------- */
  let rtTimer = null, rtBusy = false, rtKey = '';
  function clearRetire() { $('#t-rt').innerHTML = ''; $('#c-rt').innerHTML = ''; $('#lg-rt').innerHTML = ''; $('#rt-status').textContent = ''; rtKey = ''; state.rt = null; }
  function retireKey() {
    const L = state.last; if (!L) return '';
    return [L.cs, L.ce, L.adj, state.cur, state.rebal, state.div, state.initial, FL.rtY, FL.rtR, FL.tax, FL.td, FL.tc, FL.tded, FL.tk, FL.tp, L.series.map(x => x.key + x.tickers.join('+') + x.weights.join('+')).join('/')].join('|');
  }
  function retireVisible() { return state.layout !== 'tabs' || state.tab === 'g-flow'; }
  function markRetireStale() { markAccStale(); if (retireKey() === rtKey) return; clearTimeout(rtTimer); if (retireVisible()) rtTimer = setTimeout(runRetire, 250); else $('#rt-status').textContent = '적립·인출 탭을 열면 계산해요.'; }
  async function runRetire() {
    if (!state.last || rtBusy) { if (rtBusy) { clearTimeout(rtTimer); rtTimer = setTimeout(runRetire, 400); } return; }
    const key = retireKey(); if (key === rtKey) return;
    rtBusy = true; rtKey = key;
    const L = state.last, Lm = FL.rtY * 12, st = $('#rt-status');
    if (L.ce - L.cs + 1 < Lm) {
      $('#t-rt').innerHTML = ''; $('#c-rt').innerHTML = ''; $('#lg-rt').innerHTML = ''; state.rt = null;
      st.textContent = `고른 자산의 데이터(${BT.label(L.cs)}~${BT.label(L.ce)})가 ${FL.rtY}년보다 짧아 점검할 수 없어요. 인출 기간을 줄여 보세요.`; rtBusy = false; return;
    }
    st.textContent = '과거 모든 시작 시점으로 계산하는 중…';
    await new Promise(r => setTimeout(r, 20));
    const out = [];
    for (const x of L.series) {
      const base = flowOpts(x, { i0: L.cs, i1: L.cs + Lm - 1, real: true, contrib: { amt: 0 }, wd: { mode: 'fixed', amt: state.initial * FL.rtR / 100 / 12, start: 0, index: true } });
      const runs = BT.flowStarts(base, Lm, L.cs, L.ce);
      const good = runs.filter(q => q.depleted < 0);
      const fins = runs.map(q => q.finalAfter).sort((a, b) => a - b);
      const worst = runs.reduce((a, b) => { const ka = a.depleted < 0 ? Infinity : a.depleted, kb = b.depleted < 0 ? Infinity : b.depleted; return kb < ka || (kb === ka && b.finalAfter < a.finalAfter) ? b : a; });
      await new Promise(r => setTimeout(r, 0));
      const swr = BT.safeRate(base, Lm, L.cs, L.ce, 1), swr90 = BT.safeRate(base, Lm, L.cs, L.ce, 0.9);
      out.push({ x, runs, rate: good.length / runs.length, fail: runs.length - good.length, worst, median: fins[Math.floor(fins.length / 2)], swr, swr90 });
      if (retireKey() !== key) break;
      await new Promise(r => setTimeout(r, 0));
    }
    rtBusy = false;
    if (retireKey() !== key) { rtKey = ''; markRetireStale(); return; }
    state.rt = { out, Lm };
    const runsN = out[0].runs.length;
    st.textContent = `${BT.label(L.cs)}~${BT.label(L.ce - Lm + 1)}에 시작한 ${runsN.toLocaleString()}가지 ${FL.rtY}년 (1개월 간격) · 처음 ${money(state.initial)}에서 첫해 ${FL.rtR}%(매달 ${money(state.initial * FL.rtR / 100 / 12)})를 빼고 해마다 물가만큼 늘림 · ${TAX_TXT[FL.tax]} · 금액은 시작 시점 돈의 가치`;
    renderRetire();
  }
  function renderRetire() {
    const t = $('#t-rt'); t.innerHTML = ''; if (!state.rt) return;
    const { out, Lm } = state.rt, L = state.last;
    const th = el('thead'), hr = el('tr');
    ['포트폴리오', '버틴 비율', '가장 나빴던 시작', `${FL.rtY}년 뒤 남은 돈 (중앙값)`, '모든 시작에서 버틴 인출률', '90%가 버틴 인출률'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const q of out) {
      const tr = el('tr'); tr.appendChild(seriesTh(Object.assign({}, q.x, { name: q.x.bench ? state.bench : q.x.name })));
      const rate = el('td', q.rate < 0.9 ? 'neg' : null, pct(q.rate, 0)); rate.appendChild(el('span', 'sub', q.fail ? `${q.fail}번 바닥` : '한 번도 안 바닥남')); tr.appendChild(rate);
      const w = q.worst, wt = el('td', w.depleted >= 0 ? 'neg' : null, BT.label(w.s));
      wt.appendChild(el('span', 'sub', w.depleted >= 0 ? `${monthsTxt(w.depleted + 1)} 만에 바닥` : `최저 ${fmtMoneyShort(w.minV)}`)); tr.appendChild(wt);
      tr.appendChild(el('td', null, money(q.median)));
      const s1 = el('td', null, pct(q.swr, 1)); s1.appendChild(el('span', 'sub', `첫해 ${fmtMoneyShort(state.initial * q.swr)}`)); tr.appendChild(s1);
      const s2 = el('td', null, pct(q.swr90, 1)); s2.appendChild(el('span', 'sub', `첫해 ${fmtMoneyShort(state.initial * q.swr90)}`)); tr.appendChild(s2);
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    drawRetire();
  }
  function drawRetire() {
    const host = $('#c-rt'); if (!state.rt || !isShown(host)) return;
    const { out } = state.rt; const runs0 = out[0].runs;
    const series = out.map(q => ({ name: q.x.bench ? state.bench : q.x.name, color: q.x.color, bench: q.x.bench, v: q.runs.map(r => r.finalAfter) }));
    legend($('#lg-rt'), series, true);
    lineChart(host, {
      n: runs0.length, xLabel: t => BT.label(runs0[t].s), log: false, height: 240, zeroLine: true, yMin: 0, aria: '시작 시점별 인출 기간 끝에 남은 돈 선 차트',
      series, yFmt: fmtMoneyShort, tipFmt: v => (v <= 0 ? '바닥남' : money(v))
    });
  }

  /* ---------- v7.2: contribution frequency (every month / every January) ---------- */
  $('#fl-cf').addEventListener('click', e => {
    const b = e.target.closest('button[data-v]'); if (!b || b.dataset.v === FL.cf) return;
    readFlowInputs(); FL.cf = b.dataset.v;
    document.querySelectorAll('#fl-cf button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    $('#fl-c').value = FL.cf === 'Y' ? FL.cy : FL.c;
    flowChanged(true);
  });

  /* ---------- v7.2: how much the saving plan gathered, for every past start ---------- */
  let accTimer = null, accBusy = false, accKey = '';
  function accKeyNow() {
    const L = state.last; if (!L) return '';
    return [L.cs, L.ce, L.adj, state.cur, state.real, state.rebal, state.div, state.initial, FL.cf, FL.c, FL.cy, FL.cg, FL.accY, FL.tax, FL.td, FL.tc, FL.tded, FL.tk, FL.tp,
      L.series.map(x => x.key + x.tickers.join('+') + x.weights.join('+')).join('/')].join('|');
  }
  function markAccStale() {
    if (accKeyNow() === accKey) return;
    clearTimeout(accTimer);
    if (retireVisible()) accTimer = setTimeout(runAcc, 300); else $('#acc-status').textContent = '적립·인출 탭을 열면 계산해요.';
  }
  const qAt = (a, q) => a[Math.min(a.length - 1, Math.max(0, Math.round(q * (a.length - 1))))];
  async function runAcc() {
    if (!state.last) return;
    if (accBusy) { clearTimeout(accTimer); accTimer = setTimeout(runAcc, 400); return; }
    const key = accKeyNow(); if (key === accKey) return;
    accBusy = true; accKey = key;
    const L = state.last, Lm = FL.accY * 12, st = $('#acc-status'), yearly = FL.cf === 'Y';
    const amt = (FL.cf === 'Y' ? FL.cy : FL.cf === 'M' ? FL.c : 0);
    $('#acc-help').textContent = `처음 ${money(state.initial)}` + (amt > 0 ? ` + ${yearly ? '매년 초' : '매달'} ${money(amt)}${FL.cg ? `(해마다 +${FL.cg}%)` : ''}` : '') + ` · ${FL.accY}년 동안 넣기만 하고 빼지 않음 · ${TAX_TXT[FL.tax]}` + (state.real ? ' · 금액은 시작 시점 돈의 가치' : '');
    const starts = []; for (let s = L.cs; s + Lm - 1 <= L.ce; s++) if (!yearly || s % 12 === 0) starts.push(s);
    if (!starts.length) {
      $('#t-acc').innerHTML = ''; $('#c-acc').innerHTML = ''; $('#lg-acc').innerHTML = ''; state.acc = null;
      st.textContent = `고른 자산의 데이터(${BT.label(L.cs)}~${BT.label(L.ce)})가 ${FL.accY}년보다 짧아요. 적립 기간을 줄여 보세요.`; accBusy = false; return;
    }
    st.textContent = '과거 모든 시작 시점으로 계산하는 중…';
    await new Promise(r => setTimeout(r, 20));
    const out = [];
    for (const x of L.series) {
      const base = flowOpts(x, { contrib: { amt, freq: FL.cf, grow: FL.cg / 100, months: Lm }, wd: { mode: 'none' } });
      const runs = starts.map(s => Object.assign({ s }, BT.flowSim(Object.assign({}, base, { i0: s, i1: s + Lm - 1, lean: true }))));
      const fins = runs.map(r => r.finalAfter).sort((a, b) => a - b);
      let lo = runs[0], hi = runs[0]; for (const r of runs) { if (r.finalAfter < lo.finalAfter) lo = r; if (r.finalAfter > hi.finalAfter) hi = r; }
      const tin = runs.map(r => r.totIn).sort((a, b) => a - b), totIn = qAt(tin, 0.5);
      out.push({ x, runs, lo, hi, p10: qAt(fins, 0.1), med: qAt(fins, 0.5), p90: qAt(fins, 0.9), totIn, loss: runs.filter(r => r.finalAfter < r.totIn).length / runs.length });
      if (accKeyNow() !== key) break;
      await new Promise(r => setTimeout(r, 0));
    }
    accBusy = false;
    if (accKeyNow() !== key) { accKey = ''; markAccStale(); return; }
    state.acc = { out, Lm };
    st.textContent = `${BT.label(starts[0])}~${BT.label(starts[starts.length - 1])}에 시작한 ${starts.length.toLocaleString()}가지 ${FL.accY}년 (${yearly ? '해마다 1월 시작' : '1개월 간격'})`;
    renderAcc();
  }
  function renderAcc() {
    const t = $('#t-acc'); t.innerHTML = ''; if (!state.acc) return;
    const th = el('thead'), hr = el('tr');
    ['포트폴리오', '넣은 돈', '가장 적게 모인 때', '하위 10%', '중앙값', '상위 10%', '가장 많이 모인 때', '넣은 돈보다 적었던 비율'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const q of state.acc.out) {
      const tr = el('tr'); tr.appendChild(seriesTh(Object.assign({}, q.x, { name: q.x.bench ? state.bench : q.x.name })));
      tr.appendChild(el('td', null, money(q.totIn)));
      const cell = (v, sub) => { const c = el('td', v < q.totIn ? 'neg' : null, money(v)); if (sub) c.appendChild(el('span', 'sub', sub)); tr.appendChild(c); };
      cell(q.lo.finalAfter, `${BT.label(q.lo.s)} 시작`);
      cell(q.p10); cell(q.med, q.totIn > 0 ? `넣은 돈의 ${(q.med / q.totIn).toFixed(2)}배` : null); cell(q.p90);
      cell(q.hi.finalAfter, `${BT.label(q.hi.s)} 시작`);
      tr.appendChild(el('td', q.loss > 0 ? 'neg' : null, pct(q.loss, 0)));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    drawAcc();
  }
  function drawAcc() {
    const host = $('#c-acc'); if (!state.acc || !isShown(host)) return;
    const { out } = state.acc, r0 = out[0].runs;
    const series = out.map(q => ({ name: q.x.bench ? state.bench : q.x.name, color: q.x.color, v: q.runs.map(r => r.finalAfter) }));
    series.push({ name: '넣은 돈', color: 'var(--bench)', bench: true, v: r0.map(r => r.totIn) });
    legend($('#lg-acc'), series, true);
    lineChart(host, { n: r0.length, xLabel: t => BT.label(r0[t].s), log: false, height: 260, yMin: 0, aria: '시작 시점별 적립 기간 끝에 모인 돈 선 차트', series, yFmt: fmtMoneyShort, tipFmt: v => money(v) });
  }

  /* ---------- boot of the v7 parts ---------- */
  (function bootFlow() {
    const saved = flowRead();
    if (saved && saved.fl) for (const k of Object.keys(FL)) if (saved.fl[k] !== undefined && typeof saved.fl[k] === typeof FL[k]) FL[k] = saved.fl[k];
    if (saved && saved.fl && saved.fl.cm !== undefined) FL.cm = saved.fl.cm === 'auto' ? 'auto' : (+saved.fl.cm || 'auto');
    if (!TAX_TXT[FL.tax]) FL.tax = 'none'; if (!['none', 'fixed', 'pct'].includes(FL.wm)) FL.wm = 'none';
    if (saved) { if (saved.initU > 0) state.initU = saved.initU; if (saved.initK > 0) state.initK = saved.initK; }
    if (saved && saved.cur === 'KRW' && BT.hasFX()) {
      state.cur = BT.setCur('KRW'); state.initial = state.initK; $('#init').value = state.initial;
    } else if (saved && saved.initU > 0) { state.initial = saved.initU; $('#init').value = state.initial; }
    if (!saved) { const d = state.cur === 'KRW' ? FL_KRW : FL_USD; FL.c = d.c; FL.w = d.w; }
    if (!(FL.cy > 0)) FL.cy = (state.cur === 'KRW' ? FL_KRW : FL_USD).cy;
    if (!['N', 'M', 'Y'].includes(FL.cf)) FL.cf = 'N';
    if (saved && saved.fl && saved.fl.cf === undefined) FL.cf = FL.c > 0 ? 'M' : 'N';
    if (!BT.hasFX()) $('#cur-field').hidden = true;
    document.querySelectorAll('#fl-ax button').forEach(b => b.setAttribute('aria-pressed', (b.dataset.v === 'log') === FL.log ? 'true' : 'false'));
    syncCurUI(); writeFlowInputs();
  })();
