  /* ======================= v7.4: investment style chosen first ======================= */
  function styleOf() {
    if (FL.wm !== 'none') return FL.cf === 'N' && !FL.ws ? 'wd' : 'mix';
    return FL.cf === 'N' ? 'lump' : FL.cf;
  }
  function styleTxt() {
    const s = styleOf();
    if (s === 'lump') return '한 번에 넣기';
    if (s === 'M') return `매달 ${money(FL.c)} 적립`;
    if (s === 'Y') return `매년 초 ${money(FL.cy)} 적립`;
    if (s === 'wd') return FL.wm === 'pct' ? `평가액의 연 ${FL.wp}% 꺼내 쓰기` : `매달 ${money(FL.w)} 꺼내 쓰기`;
    return '직접 정한 적립·인출 계획';
  }
  function syncStyleUI() {
    const s = styleOf(), u = curUnit();
    document.querySelectorAll('input[name="sty"]').forEach(r => { r.checked = r.value === s; r.closest('.sty').classList.toggle('on', r.checked); });
    $('#st-mix').hidden = s !== 'mix';
    $('#st-init-l').textContent = `처음 넣는 돈 (${u})`;
    const showC = s === 'M' || s === 'Y';
    $('#st-c-f').hidden = !showC; $('#st-w-f').hidden = !(s === 'wd' && FL.wm === 'fixed');
    $('#st-c-l').textContent = `${s === 'Y' ? '매년 초' : '매달'} 넣는 돈 (${u})`; $('#st-w-l').textContent = `매달 빼는 돈 (${u})`;
    const cv = s === 'Y' ? FL.cy : FL.c;
    if (document.activeElement !== $('#st-c')) $('#st-c').value = cv;
    if (document.activeElement !== $('#st-w')) $('#st-w').value = FL.w;
    if (document.activeElement !== $('#st-init')) $('#st-init').value = state.initial;
    $('#st-init-h').textContent = amtHint(state.initial); $('#st-c-h').textContent = amtHint(cv); $('#st-w-h').textContent = amtHint(FL.w);
    ['#st-init', '#st-c', '#st-w'].forEach(id => { $(id).step = state.cur === 'KRW' ? '100000' : '100'; });
    $('#st-note').textContent = s === 'lump' ? '처음에 한 번 넣고 그대로 두는 방식이에요. 결과 탭의 숫자가 이 방식이에요.'
      : s === 'M' ? '처음 넣는 돈에 더해 매달 초에 넣어요. 결과 탭 맨 위와 적립·인출 탭에서 모인 돈을 보여줘요.'
      : s === 'Y' ? '처음 넣는 돈에 더해 해마다 1월 초에 넣어요. 결과 탭 맨 위와 적립·인출 탭에서 모인 돈을 보여줘요.'
      : s === 'wd' ? (FL.wm === 'pct' ? `처음 넣는 돈에서 해마다 평가액의 ${FL.wp}%를 나눠 빼요. 비율은 적립·인출 탭에서 바꿔요.` : '처음 넣는 돈에서 매달 빼 쓰고, 해마다 물가만큼 늘려요. 은퇴 인출 점검도 함께 봐요.')
      : '세부 계획은 적립·인출 탭에서 바꿔요.';
  }
  function setStyle(s) {
    readFlowInputs();
    const d = state.cur === 'KRW' ? FL_KRW : FL_USD;
    if (s === 'lump') { FL.cf = 'N'; FL.wm = 'none'; }
    else if (s === 'M' || s === 'Y') { FL.cf = s; FL.wm = 'none'; FL.cm = 'auto'; if (s === 'M' && !(FL.c > 0)) FL.c = d.c; if (s === 'Y' && !(FL.cy > 0)) FL.cy = d.cy; }
    else if (s === 'wd') { FL.cf = 'N'; if (FL.wm === 'none') FL.wm = 'fixed'; FL.ws = 0; FL.wi = true; if (!(FL.w > 0)) FL.w = Math.round(state.initial * 0.04 / 12); }
    writeFlowInputs(); flowSave(); renderFlow(); renderCtx();
  }
  document.querySelectorAll('input[name="sty"]').forEach(r => r.addEventListener('change', () => { if (r.checked) setStyle(r.value); }));
  $('#st-init').addEventListener('input', e => { const v = parseFloat(e.target.value); if (v > 0) setInitial(v, 'st'); });
  $('#st-c').addEventListener('input', e => {
    const v = Math.max(0, parseFloat(e.target.value) || 0);
    if (styleOf() === 'Y') FL.cy = v; else FL.c = v;
    $('#fl-c').value = v; flowChanged();
  });
  $('#st-w').addEventListener('input', e => { FL.w = Math.max(0, parseFloat(e.target.value) || 0); $('#fl-w').value = FL.w; flowChanged(); });
  /* results tab: the chosen style's outcome above the lump-sum numbers */
  function rfTable(host, compact) {
    host.innerHTML = '';
    if (!state.flow) return;
    const s = styleOf(), wd = s === 'wd' || s === 'mix';
    const t = el('table', 'rftbl'), th = el('thead'), hr = el('tr');
    const cols = compact ? ['포트폴리오', '넣은 돈', wd ? '받은 돈' : null, '마지막 평가액', '내 돈 수익률'] : ['포트폴리오', '넣은 돈', wd ? '받은 돈' : null, FL.tax === 'none' ? '마지막 평가액' : '세금 낸 뒤 남는 돈', '넣은 돈의 몇 배', '내 돈 수익률 (IRR)', wd ? '바닥난 때' : null];
    cols.filter(Boolean).forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    for (const { x, r } of state.flow.runs) {
      const tr = el('tr'); tr.appendChild(seriesTh(Object.assign({}, x, { name: x.bench ? state.bench : x.name })));
      const td = (v, neg) => tr.appendChild(el('td', neg ? 'neg' : null, v));
      td(compact ? fmtMoneyShort(r.totIn) : money(r.totIn));
      if (wd) td(compact ? fmtMoneyShort(r.totOut + r.totInc) : money(r.totOut + r.totInc));
      td(compact ? fmtMoneyShort(r.finalAfter) : money(r.finalAfter), r.finalAfter <= 0);
      if (!compact) td(r.totIn > 0 ? (r.finalAfter / r.totIn).toFixed(2) + '배' : '–');
      td(r.irr == null ? '–' : pct(r.irr, 1), r.irr != null && r.irr < 0);
      if (!compact && wd) td(r.depleted >= 0 ? BT.label(state.last.s + r.depleted) : '버팀', r.depleted >= 0);
      tb.appendChild(tr);
    }
    t.appendChild(tb); const w = el('div', 'tbl-wrap'); w.appendChild(t); host.appendChild(w);
  }
  function renderResFlow() {
    const s = styleOf(), on = s !== 'lump' && !!state.flow;
    $('#sec-res-flow').hidden = !on; $('#qr-flow').hidden = !on; $('#hero-mode').hidden = s === 'lump';
    if (!on) { $('#t-rf').innerHTML = ''; $('#qr-flow-t').innerHTML = ''; return; }
    const L = state.last;
    $('#rf-when').textContent = `${styleTxt()} · 처음 ${money(state.initial)} · ${BT.label(L.s)} – ${BT.label(L.e)} · ${TAX_TXT[FL.tax]}` + (state.real ? ' · 시작 시점 돈의 가치' : '');
    $('#qr-flow-h').textContent = `${styleTxt()}으로 했다면`;
    rfTable($('#t-rf'), false); rfTable($('#qr-flow-t'), true);
  }

  /* ======================= v7.4: my tickers, one mix for the whole period — best CAGR for each MDD limit ======================= */
  const FIX_CAPS = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, null];
  state.fixSel = null;
  function keepFixAll() {
    const o = state.opt, K = o && o.keep; if (!K || !K.P.ok) return;
    const P = K.P, S = P.store, uw = +$('#o-uw').value || 0;
    K.fix = withUnit(!!o.real, () => {
      const rows = FIX_CAPS.map(cap => { const s = BT.optSelect(P, { kind: 'cap', cap: cap == null ? 10 : cap, uw }); return { cap, i: s ? s.i : -1, feasible: !!(s && s.feasible) }; });
      const memo = new Map();
      for (const r of rows) {
        if (r.i < 0) continue;
        if (!memo.has(r.i)) {
          const p = BT.optPoint(P, r.i), tk = p.w.map(x => x[0]), ws = p.w.map(x => x[1]);
          const full = BT.backtest(tk, ws, o.s, o.end, o.rule, false);
          const st = BT.stats(full), stDiv = BT.stats(BT.backtest(tk, ws, o.s, o.end, o.rule, false, true));
          const per = K.wins.map(w => ({ w, st: BT.stats(BT.backtest(tk, ws, w.i0, w.i1, o.rule, false)) }));
          memo.set(r.i, Object.assign(p, { st, stDiv, per, roll: BT.rolling(full, [10])[0], feasible: true, crit: { kind: 'cap' } }));
        }
        r.d = memo.get(r.i);
      }
      return rows;
    }, o.cur);
  }
  const capTxt = r => (r.calmar ? '낙폭 대비 수익 최고' : r.cap == null ? '제한 없음 (최고 CAGR)' : `MDD ${Math.round(r.cap * 100)}% 이내`);
  function renderFix() {
    const st = $('#fix-status'), t = $('#t-fix'), chips = $('#fix-tk'); if (!t) return;
    t.innerHTML = ''; $('#fix-pick').innerHTML = ''; chips.innerHTML = '';
    const sel = state.opt ? state.opt.tickers : [...state.optSel];
    const ex = state.opt && state.opt.keep && state.opt.keep.P ? new Set((state.opt.keep.P.excluded || []).map(x => x.t)) : new Set();
    for (const tk of sel) { const b = etfBtn(tk, 'chip fix-chip' + (ex.has(tk) ? ' out' : '')); if (ex.has(tk)) b.title += ' · 분석 기간 전체 데이터가 없어 제외'; chips.appendChild(b); }
    const o = state.opt;
    if (!o) { st.textContent = '‘최적 비중 찾기’를 실행하면 계산해요.'; return; }
    const K = o.keep;
    if (!K) { st.textContent = '분석 기간 전체로 계산하는 중이에요. 최근·가장 과거 구간 계산이 끝나면 이어서 나와요.'; return; }
    if (!K.P.ok) { st.textContent = `분석 기간 전체로는 계산할 수 없어요: ${K.P.reason}`; return; }
    if (!K.fix) keepFixAll();
    const uw = +$('#o-uw').value || 0;
    st.textContent = `${BT.label(o.s)}~${BT.label(o.end)} (${monthsTxt(o.end - o.s + 1)}) · 자산 ${K.P.K}개로 만든 ${K.P.evaluated.toLocaleString('ko-KR')}개 조합 (${modeTxt(K.P)}) · 리밸런싱 ${REBAL_TXT[o.rule]}` +
      (uw ? ` · 최장 회복 ${dur(uw)} 이내만` : '') + (ex.size ? ` · 줄 그은 종목은 분석 기간 전체 데이터가 없어 빠졌어요` : '') + (o.real ? ' · 물가 반영' : '') + (o.cur === 'KRW' ? ' · 원화 기준' : '');
    const th = el('thead'), hr = el('tr');
    ['MDD 한도', '비중 (전체 기간 고정)', '전체 CAGR', '전체 MDD', '최장 회복', '가장 나쁜 구간 CAGR', '아무 10년 최저 CAGR'].forEach(h => hr.appendChild(el('th', null, h))); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody'); let prev = -2;
    for (const [k, r] of K.fix.entries()) {
      const tr = el('tr', 'fix-row' + (r.calmar ? ' hl' : '') + (state.fixSel === k ? ' sel' : '')); tr.dataset.k = k; tr.tabIndex = 0; tr.setAttribute('role', 'button');
      tr.appendChild(el('th', null, capTxt(r)));
      if (!r.d) { tr.appendChild(el('td', 'twrap', '조합 없음')); tb.appendChild(tr); continue; }
      const d = r.d, same = r.i === prev && !r.calmar; prev = r.calmar ? prev : r.i;
      const wc = el('td', 'twrap wtxt', same ? '위와 같은 조합' : wText(d.w));
      if (!r.feasible) wc.appendChild(el('span', 'sub', '한도를 지키는 조합이 없어 가장 가까운 조합'));
      tr.appendChild(wc);
      tr.appendChild(el('td', d.st.cagr < 0 ? 'neg' : null, pct(d.st.cagr, 1)));
      tr.appendChild(el('td', 'neg', mpct1(d.st.mdd)));
      tr.appendChild(el('td', null, d.st.uw.months ? dur(d.st.uw.months) + (d.st.uw.ongoing ? '+' : '') : '없음'));
      const wo = worstOf(d); const w1 = el('td', wo.c < 0 ? 'neg' : null, pct(wo.c, 1)); w1.appendChild(el('span', 'sub', keepWinName(wo.id))); tr.appendChild(w1);
      tr.appendChild(el('td', d.roll && d.roll.ok && d.roll.min < 0 ? 'neg' : null, d.roll && d.roll.ok ? pct(d.roll.min, 1) : '–'));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    const r = state.fixSel != null ? K.fix[state.fixSel] : null;
    if (r && r.d) $('#fix-pick').appendChild(keepCard(r.d, `${capTxt(r)} · 전체 기간 고정`, 'var(--p3)', `분석 기간 전체(${monthsTxt(o.end - o.s + 1)})에서 ${r.calmar ? '(CAGR − 같은 기간 미국 단기국채 수익률) ÷ MDD가 가장 큰' : r.cap == null ? 'CAGR이 가장 높은' : `MDD가 ${Math.round(r.cap * 100)}% 이내인 조합 중 CAGR이 가장 높은`} 조합이에요. 같은 비중을 각 구간에 새로 시작했을 때 가장 나빴던 구간: ${keepWinName(worstOf(r.d).id)}`));
  }
  function pickFix(e) { const r = e.target.closest('tr.fix-row'); if (!r) return; const k = +r.dataset.k; state.fixSel = state.fixSel === k ? null : k; renderFix(); }
  $('#t-fix').addEventListener('click', pickFix);
  $('#t-fix').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickFix(e); } });
  $('#fix-edit').addEventListener('click', () => { const d = $('#fold-assets'); d.open = true; goTo('fold-assets'); });
