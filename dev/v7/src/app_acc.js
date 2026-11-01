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
    const amt = yearly ? FL.cy : FL.c;
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
