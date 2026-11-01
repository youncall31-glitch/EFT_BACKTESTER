  /* ======================= v8.0: loss and recovery — when and how to act after a fall ======================= */
  state.recov = { trig: 0.10, sel: null, ep: null, metric: 'evt' };
  const RC_SHORT = { hold: '그대로 두기', reb: '바로 리밸런싱', 'lean-half': '공격↑ · 절반 회복', 'lean-peak': '공격↑ · 고점 근처', 'def-sma': '수비 · 추세 회복', 'def-half': '수비 · 절반 회복', 'def-bounce': '수비 · 저점+10%', 'def-time': '수비 · 12개월', 'def-peak': '수비 · 고점 근처' };
  const RC_MET = { evt: '모든 하락에서 평균 득실', rec: '큰 하락 평균 회복 기간', cagr: '전체 기간 CAGR', mdd: '전체 기간 MDD', uw: '전체 기간 최장 회복' };
  const RC_TRIGS = [0.05, 0.10, 0.15, 0.20];
  const RC_METHODS = [
    { id: 'hold', name: '그대로 두기', d: '평소 리밸런싱만 하고 아무것도 안 함' },
    { id: 'reb', name: '바로 리밸런싱', d: '떨어진 그 달에 원래 비중으로 맞춤(내린 종목을 더 삼)', mode: 'rebal' },
    { id: 'lean-half', name: '공격 늘리기 → 절반 회복 때 원복', d: '수비 종목 절반을 공격 종목으로 옮겼다가, 낙폭의 절반을 되찾으면 원래 비중으로', mode: 'lean', back: 'half' },
    { id: 'lean-peak', name: '공격 늘리기 → 고점 근처에서 원복', d: '수비 종목 절반을 공격 종목으로 옮겼다가, 고점 −5% 안으로 돌아오면 원래 비중으로', mode: 'lean', back: 'peak' },
    { id: 'def-sma', name: '수비로 → 추세 회복 때 원복', d: '공격 종목 절반을 수비 종목으로 옮겼다가, 공격 종목이 10개월 이동평균 위로 올라오면 원래 비중으로', mode: 'def', back: 'sma' },
    { id: 'def-half', name: '수비로 → 절반 회복 때 원복', d: '공격 종목 절반을 수비 종목으로 옮겼다가, 낙폭의 절반을 되찾으면 원래 비중으로', mode: 'def', back: 'half' },
    { id: 'def-bounce', name: '수비로 → 저점 +10% 때 원복', d: '공격 종목 절반을 수비 종목으로 옮겼다가, 저점보다 10% 오르면 원래 비중으로', mode: 'def', back: 'bounce' },
    { id: 'def-time', name: '수비로 → 12개월 뒤 원복', d: '공격 종목 절반을 수비 종목으로 옮겼다가, 12개월이 지나면 원래 비중으로', mode: 'def', back: 'time' },
    { id: 'def-peak', name: '수비로 → 고점 근처에서 원복', d: '공격 종목 절반을 수비 종목으로 옮겼다가, 고점 −5% 안으로 돌아오면 원래 비중으로', mode: 'def', back: 'peak' }
  ];
  const durC = m => (m == null ? '–' : m < 12 ? Math.round(m) + '개월' : (m / 12).toFixed(1).replace(/\.0$/, '') + '년');
  const durS = m => (m == null ? '–' : m === 0 ? '0개월' : dur(Math.round(m)));
  /* big falls of the plain portfolio: peak → (trough) → back above the peak */
  function recovEpisodes(vals, thr) {
    const out = []; let pk = 0, tr = 0, deep = false;
    for (let t = 1; t < vals.length; t++) {
      if (vals[t] >= vals[pk]) { if (deep) out.push({ p: pk, tr, r: t, depth: vals[tr] / vals[pk] - 1 }); pk = t; tr = t; deep = false; }
      else { if (vals[t] < vals[tr] || tr < pk) tr = t; if (vals[t] / vals[pk] - 1 <= -thr) deep = true; }
    }
    if (deep) out.push({ p: pk, tr, r: null, depth: vals[tr] / vals[pk] - 1 });
    return out;
  }
  /* months from the same peak date until this path is back at its own value on that date */
  function recovOf(vals, ep) {
    const v0 = vals[ep.p]; let lo = 0;
    for (let t = ep.p + 1; t < vals.length; t++) { lo = Math.min(lo, vals[t] / v0 - 1); if (vals[t] >= v0 * (1 - 1e-12)) return { m: t - ep.p, on: false, depth: lo, at: t }; }
    return { m: vals.length - 1 - ep.p, on: true, depth: lo, at: null };
  }
  (function buildRecovCtl() {
    $('#rc-port').addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (!b) return; state.guard.pi = +b.dataset.p; state.guard.att = null; state.recov.ep = null; renderGuard(); });
    $('#rc-grid').addEventListener('click', e => { const c = e.target.closest('[data-m]'); if (!c) return; state.recov.sel = c.dataset.m; if (c.dataset.tr) state.recov.trig = +c.dataset.tr; renderRecov(); });
    $('#rc-t').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (!b) return; state.recov.trig = +b.dataset.t; renderRecov(); });
    $('#rc-m').addEventListener('click', e => { const b = e.target.closest('button[data-m]'); if (!b) return; state.recov.metric = b.dataset.m; renderRecov(); });
    $('#rc-ep').addEventListener('click', e => { const b = e.target.closest('button[data-e]'); if (!b) return; state.recov.ep = +b.dataset.e; renderRecov(); });
  })();
  function renderRecov() {
    const host = $('#rc-grid'); if (!host) return;
    host.innerHTML = ''; $('#rc-port').innerHTML = ''; $('#rc-ep').innerHTML = ''; $('#rc-say').innerHTML = ''; $('#rc-tbl').innerHTML = ''; $('#rc-msg').hidden = true;
    state.recovRes = null;
    const L = state.last, vp = validPorts(); if (!L || !vp.length) { drawRecov(); return; }
    const G = state.guard; if (G.pi == null || !vp.find(p => p.i === G.pi)) G.pi = vp[0].i;
    const x = vp.find(p => p.i === G.pi);
    for (const p of vp) { const b = el('button', 'chip'); b.type = 'button'; b.dataset.p = p.i; b.setAttribute('aria-pressed', p.i === G.pi ? 'true' : 'false'); const k = el('span', 'key'); k.style.background = PCOL[p.i]; b.append(k, document.createTextNode(' ' + p.name)); $('#rc-port').appendChild(b); }
    if (!G.att) G.att = new Set(x.info.tickers.filter(t => !isDefensive(t)));
    const msg = t => { $('#rc-msg').hidden = false; $('#rc-msg').textContent = t; drawRecov(); };
    const [ds] = BT.avail(G.def, state.ext ? 'ext' : 'etf');
    if (ds > L.s) return msg(`수비 종목 ${G.def}의 데이터가 ${BT.label(ds)}부터라 이 기간에는 시험할 수 없어요. 아래 방어 규칙에서 옮길 곳을 BIL로 바꿔 주세요.`);
    const base = BT.backtest(x.info.tickers, x.info.weights, L.s, L.e, state.rebal, L.adj), bst = BT.stats(base);
    let thr = 0.15, eps = recovEpisodes(base.vals, thr); if (eps.length < 2) { thr = 0.10; eps = recovEpisodes(base.vals, thr); }
    if (!eps.length) return msg('분석 기간에 10% 넘게 떨어진 적이 없어서 비교할 하락이 없어요.');
    const attack = x.info.tickers.map(t => G.att.has(t)), hasAtt = attack.some(Boolean), hasOther = attack.some(a => !a);
    const usable = RC_METHODS.filter(m => m.mode !== 'def' || hasAtt).filter(m => m.mode !== 'lean' || (hasAtt && hasOther));
    const sim = (m, trig) => {
      const res = m.id === 'hold' ? base : BT.guardSim({ tickers: x.info.tickers, weights: x.info.weights, attack, def: G.def, cut: 0.5, trig, back: m.back || 'sma', stage: 1, mode: m.mode, i0: L.s, i1: L.e, rule: state.rebal, adj: L.adj });
      const st = m.id === 'hold' ? bst : BT.stats(res), rec = eps.map(ep => recovOf(res.vals, ep));
      return { m, trig, res, st, rec, avg: rec.reduce((a, r) => a + r.m, 0) / rec.length, max: Math.max(...rec.map(r => r.m)), on: rec.some(r => r.on) };
    };
    const hold = sim(usable[0], null), cells = {};
    for (const m of usable.slice(1)) for (const tg of RC_TRIGS) cells[m.id + '@' + tg] = sim(m, tg);
    const all = Object.values(cells);
    // every fall that reached the trigger, small or large: what the rule gained or lost by the time the plain portfolio was back at its peak
    const epsBy = {}; for (const tg of RC_TRIGS) epsBy[tg] = recovEpisodes(base.vals, tg);
    const H = base.vals;
    for (const c of all) {
      const list = epsBy[c.trig].map(ep => {
        const r = ep.r == null ? H.length - 1 : ep.r, S = c.res.vals;
        let lo = 0; for (let t = ep.p; t <= r; t++) lo = Math.min(lo, S[t] / S[ep.p] - 1);
        return { ep, gain: (S[r] / S[ep.p]) / (H[r] / H[ep.p]) - 1, depth: ep.depth, sDepth: lo, recH: recovOf(H, ep), recS: recovOf(S, ep), open: ep.r == null };
      });
      const win = list.filter(e => e.gain > 0.001).length, loss = list.filter(e => e.gain < -0.001).length;
      c.evt = { list, n: list.length, win, loss, avg: list.length ? list.reduce((a, e) => a + e.gain, 0) / list.length : 0 };
    }
    // best: fastest average recovery that costs at most 0.5%p of CAGR (fall back to fastest)
    const okC = all.filter(c => c.st.cagr - bst.cagr >= -0.005), pool = okC.length ? okC : all;
    const best = pool.reduce((a, b) => (b.avg < a.avg - 1e-9 || (Math.abs(b.avg - a.avg) < 1e-9 && b.st.cagr > a.st.cagr) ? b : a), pool[0]);
    const S = state.recov;
    // balanced pick at the chosen trigger: keeps CAGR (≥ −0.3%p) and makes MDD shallowest
    const atT = all.filter(c => c.trig === S.trig), keep = atT.filter(c => c.st.cagr - bst.cagr >= -0.003 && c.st.mdd - bst.mdd > 0.002);
    const bal = keep.length ? keep.reduce((a, b) => (b.st.mdd > a.st.mdd + 0.002 || (Math.abs(b.st.mdd - a.st.mdd) <= 0.002 && b.st.cagr > a.st.cagr) ? b : a), keep[0]) : null;
    if (!S.sel || (S.sel !== 'hold' && !cells[S.sel + '@' + S.trig])) S.sel = bal ? bal.m.id : (cells['def-sma@' + S.trig] ? 'def-sma' : usable[1].id);
    const cur = S.sel === 'hold' ? hold : cells[S.sel + '@' + S.trig];
    if (S.ep == null || S.ep >= eps.length) { let k = 0; eps.forEach((e, i) => { if (e.depth < eps[k].depth) k = i; }); S.ep = k; }
    state.recovRes = { x, eps, hold, cur, best, thr, all: [hold].concat(all), bst };
    renderRecovEvt(cur, hold);
    const MT = S.metric || 'rec';
    $('#rc-m').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.m === MT ? 'true' : 'false'));
    $('#rc-gh').textContent = `방법 × 시기 — ${RC_MET[MT]}`;
    $('#rc-help').textContent = MT === 'evt' ? '포트폴리오가 고점에서 그 % 이상 떨어진 모든 때(작게 끝난 하락 포함)에 규칙을 실행하고, 고점을 되찾았을 때 그대로 두기보다 몇 % 앞섰는지(+) 뒤졌는지(−)의 평균이에요. 칸 아래는 도움 된 횟수 ↑ · 손해 본 횟수 ↓.' : MT === 'rec' ? `${eps.length}번의 큰 하락(${Math.round(thr * 100)}% 이상)에서 고점을 되찾기까지 걸린 평균 기간이에요. 칸 아래 작은 숫자는 그대로 두기 대비 전체 CAGR 변화(%p).` : MT === 'cagr' ? '하락 때만이 아니라 분석 기간 전체에 그 방법을 계속 썼을 때의 연 수익률이에요. 칸 아래 작은 숫자는 그대로 두기 대비 변화(%p).' : MT === 'mdd' ? '분석 기간 전체에서 가장 크게 떨어진 폭이에요. 칸 아래 작은 숫자는 그대로 두기보다 얼마나 얕아졌는지(+면 얕아짐, %p).' : '분석 기간 전체에서 고점을 되찾기까지 가장 오래 걸린 기간이에요. 칸 아래 작은 숫자는 그대로 두기 대비 차이(개월, −면 짧아짐).';
    const mval = c => MT === 'evt' ? (c.evt ? c.evt.avg : 0) : MT === 'rec' ? c.avg : MT === 'cagr' ? c.st.cagr : MT === 'mdd' ? c.st.mdd : c.st.uw.months;
    const better = (a, b) => MT === 'cagr' || MT === 'mdd' || MT === 'evt' ? mval(a) > mval(b) : mval(a) < mval(b);
    const bestM = MT === 'rec' ? best : all.reduce((a, b) => (better(b, a) ? b : a), all[0]);
    // verdict at the chosen trigger
    const say = $('#rc-say'); const tgp = Math.round(S.trig * 100);
    $('#rc-t').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.t === S.trig ? 'true' : 'false'));
    if (bal) {
      const h3 = el('p', 'rc-best'); h3.append(el('span', 'rc-tag', `−${tgp}%에서 가장 균형 잡힌 전략`), el('b', null, bal.m.name)); say.appendChild(h3);
      say.appendChild(el('p', null, `그대로 두기와 비교해 CAGR ${ppTxt(bal.st.cagr - bst.cagr)} · MDD ${mpct1(bst.mdd)} → ${mpct1(bal.st.mdd)} · 최장 회복 ${uwTx(bst.uw.months, bst.uw.ongoing)} → ${uwTx(bal.st.uw.months, bal.st.uw.ongoing)}. CAGR을 0.3%p 넘게 잃지 않은 전략 중 MDD가 가장 얕아요.`));
    } else say.appendChild(el('p', null, `−${tgp}%에서 시작하면 CAGR을 지키면서(손해 0.3%p 이내) MDD를 줄인 전략이 없어요. 다른 시작 시점을 골라 보거나, 그대로 두는 것이 답일 수 있어요.`));
    say.appendChild(el('p', 'small muted', `모든 전략은 하락이 시작될 때마다(작게 끝난 하락 포함) 분석 기간 내내 실행한 결과예요. 공격·수비 종목과 옮길 곳(${G.def})은 아래 ‘방어 규칙 직접 설정해 보기’ 설정을 같이 써요.`));
    // grid: methods × when to act
    const t = el('table', 'rgrid'), th = el('thead'), hr = el('tr'); hr.appendChild(el('th', null, '방법 ↓ / 언제 →'));
    for (const tg of RC_TRIGS) hr.appendChild(el('th', null, `−${Math.round(tg * 100)}%`)); th.appendChild(hr); t.appendChild(th);
    const tb = el('tbody');
    const cellTd = (c, mid, tg) => {
      const td = el('td'); td.dataset.m = mid; if (tg != null) td.dataset.tr = tg;
      const gain = MT === 'evt' ? (c.evt ? c.evt.avg / 0.03 * 0.5 : 0) : MT === 'rec' ? (hold.avg - c.avg) / Math.max(1, hold.avg) : MT === 'cagr' ? (c.st.cagr - bst.cagr) / 0.02 * 0.5 : MT === 'mdd' ? (c.st.mdd - bst.mdd) / 0.2 * 0.5 : (hold.st.uw.months - c.st.uw.months) / Math.max(1, hold.st.uw.months);
      td.style.setProperty('--g', String(Math.max(0, Math.min(1, gain / 0.5)))); td.style.setProperty('--r', String(Math.max(0, Math.min(1, -gain / 0.3))));
      if (cur === c) td.classList.add('sel'); if (bestM === c) td.classList.add('best');
      td.append(el('b', null, MT === 'evt' ? (c === hold ? '기준' : `${c.evt.avg >= 0 ? '+' : '−'}${Math.abs(c.evt.avg * 100).toFixed(1)}%`) : MT === 'rec' ? durC(c.avg) + (c.on ? '+' : '') : MT === 'cagr' ? pct(c.st.cagr, 1) : MT === 'mdd' ? mpct1(c.st.mdd) : (c.st.uw.months ? durC(c.st.uw.months) : '없음')));
      if (c !== hold) {
        if (MT === 'evt') { td.append(el('span', c.evt.win > c.evt.loss ? 'pos' : c.evt.loss > c.evt.win ? 'neg' : null, `${c.evt.win}↑ ${c.evt.loss}↓ /${c.evt.n}`)); }
        else if (MT === 'rec' || MT === 'cagr') { const dc = c.st.cagr - bst.cagr; td.append(el('span', dc < -0.005 ? 'neg' : dc > 0.0005 && MT === 'cagr' ? 'pos' : null, ppTxt(dc).replace('%p', ''))); }
        else if (MT === 'mdd') { const dm = c.st.mdd - bst.mdd; td.append(el('span', dm < -0.0005 ? 'neg' : dm > 0.0005 ? 'pos' : null, (dm >= 0 ? '+' : '−') + Math.abs(dm * 100).toFixed(1))); }
        else { const du = c.st.uw.months - hold.st.uw.months; td.append(el('span', du > 0 ? 'neg' : du < 0 ? 'pos' : null, (du > 0 ? '+' : du < 0 ? '−' : '') + Math.abs(du))); }
      }
      td.title = `${c.m.name}${tg != null ? ` · −${Math.round(tg * 100)}%에서 시작` : ''}\n큰 하락 평균 회복 ${durS(c.avg)} · 가장 길었던 회복 ${durS(c.max)}\n전체 CAGR ${pct(c.st.cagr, 2)} · MDD ${mpct1(c.st.mdd)} · 최장 회복 ${c.st.uw.months ? durS(c.st.uw.months) : '없음'}`;
      return td;
    };
    { const tr = el('tr', 'hold'); const h = el('th'); h.append(el('b', null, hold.m.name), el('small', null, hold.m.d)); tr.appendChild(h); const td = cellTd(hold, 'hold', null); td.colSpan = RC_TRIGS.length; tr.appendChild(td); tb.appendChild(tr); }
    for (const m of usable.slice(1)) {
      const tr = el('tr'); const h = el('th'); h.append(el('b', null, m.name), el('small', null, m.d)); tr.appendChild(h);
      for (const tg of RC_TRIGS) tr.appendChild(cellTd(cells[m.id + '@' + tg], m.id, tg));
      tb.appendChild(tr);
    }
    t.appendChild(tb); host.appendChild(t);
    // episode chips
    eps.forEach((e, i) => { const b = el('button', 'chip'); b.type = 'button'; b.dataset.e = i; b.setAttribute('aria-pressed', i === S.ep ? 'true' : 'false'); b.textContent = `${BT.label(L.s + e.p).slice(0, 4)}년 ${mpct1(e.depth).replace('.0%', '%')}`; $('#rc-ep').appendChild(b); });
    // table of every fall
    const et = el('table', 'rctbl'), eh = el('thead'), er = el('tr');
    ['하락', '깊이', '그대로', '고른 방법', '가장 빠른 방법'].forEach(s => er.appendChild(el('th', null, s))); eh.appendChild(er); et.appendChild(eh);
    const eb = el('tbody');
    eps.forEach((e, i) => {
      const tr = el('tr'); tr.appendChild(el('th', null, `${BT.label(L.s + e.p)}~`)); tr.appendChild(el('td', 'neg', mpct1(e.depth)));
      const h = hold.rec[i], c = cur.rec[i]; tr.appendChild(el('td', null, durS(h.m) + (h.on ? '+' : '')));
      tr.appendChild(el('td', c.m < h.m ? 'pos' : c.m > h.m ? 'neg' : null, durS(c.m) + (c.on ? '+' : '')));
      let bm = null; for (const c2 of all) if (!bm || c2.rec[i].m < bm.rec[i].m) bm = c2;
      tr.appendChild(el('td', null, `${durS(bm.rec[i].m)} · −${Math.round(bm.trig * 100)}% ${bm.m.name}`));
      eb.appendChild(tr);
    });
    et.appendChild(eb); $('#rc-tbl').appendChild(et);
    // every case: whole-period CAGR, MDD, longest recovery, and the big-fall average
    const at = el('table', 'rctbl'), ah = el('thead'), ar = el('tr');
    ['방법', '시작', 'CAGR', 'MDD', '최장 회복', '큰 하락 평균 회복'].forEach(s2 => ar.appendChild(el('th', null, s2))); ah.appendChild(ar); at.appendChild(ah);
    const ab = el('tbody');
    for (const c of state.recovRes.all.slice().sort((a, b) => b.st.cagr - a.st.cagr)) {
      const tr = el('tr', c === hold ? 'hold' : null); tr.append(el('th', null, RC_SHORT[c.m.id] || c.m.name), el('td', null, c.trig == null ? '–' : `−${Math.round(c.trig * 100)}%`));
      const dc = c.st.cagr - bst.cagr, dm = c.st.mdd - bst.mdd, du = c.st.uw.months - hold.st.uw.months;
      tr.append(el('td', c === hold ? null : dc > 0.0005 ? 'pos' : dc < -0.0005 ? 'neg' : null, pct(c.st.cagr, 2)), el('td', c === hold ? null : dm > 0.0005 ? 'pos' : dm < -0.0005 ? 'neg' : null, mpct1(c.st.mdd)), el('td', c === hold ? null : du < 0 ? 'pos' : du > 0 ? 'neg' : null, c.st.uw.months ? durS(c.st.uw.months) + (c.st.uw.ongoing ? '+' : '') : '없음'), el('td', null, durS(c.avg) + (c.on ? '+' : '')));
      ab.appendChild(tr);
    }
    at.appendChild(ab); $('#rc-all').innerHTML = ''; $('#rc-all').appendChild(at);
    drawRecov();
  }
  /* one fall up close: the plain portfolio and the chosen method, 100 = the peak before the fall */
  function drawRecov() {
    drawRecovSc(); drawRecovEvt(); drawRecovMain();
    const host = $('#c-recov'); if (!host) return; host.innerHTML = ''; $('#lg-recov').innerHTML = '';
    const R = state.recovRes; if (!R || !isShown(host)) return;
    const L = state.last, ep = R.eps[state.recov.ep], h = R.hold, c = R.cur;
    const hr = h.rec[state.recov.ep], cr = c.rec[state.recov.ep];
    const span = Math.min(h.res.vals.length - 1 - ep.p, Math.max(hr.m, cr.m, 12) + 6);
    const W = Math.max(280, host.clientWidth || 600), H = W < 520 ? 230 : 260, m = { l: 40, r: 12, t: 14, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    legend($('#lg-recov'), [{ name: '그대로 두기', color: 'var(--bench)', bench: true }].concat(c === h ? [] : [{ name: `−${Math.round(c.trig * 100)}% ${c.m.name}`, color: 'var(--p3)' }]), true);
    const line = (res) => { const a = []; for (let t = 0; t <= span; t++) a.push(res.vals[ep.p + t] / res.vals[ep.p] * 100); return a; };
    const A = line(h.res), B = c === h ? null : line(c.res);
    let lo = 100, hi = 100; for (const a of [A, B]) if (a) for (const v of a) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const pad = (hi - lo) * 0.08 || 2; lo -= pad; hi += pad;
    const X = t => m.l + t / span * iw, Y = v => m.t + (hi - v) / (hi - lo) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '하락 한 번을 확대한 회복 경로' }, host);
    const g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    if (B && c.res.lv) { let st = -1; for (let t = 1; t <= span + 1; t++) { const on = t <= span && c.res.lv[ep.p + t] > 0; if (on && st < 0) st = t; if (!on && st >= 0) { const sh = svg('rect', { x: X(st - 1), y: m.t, width: Math.max(1, X(t - 1) - X(st - 1)), height: ih }, root); sh.style.fill = 'var(--p3)'; sh.style.opacity = '0.12'; st = -1; } } }
    for (const v of linTicks(lo, hi, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = Math.round(v); }
    const pk = svg('line', { x1: m.l, x2: m.l + iw, y1: Y(100), y2: Y(100), 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, root); pk.style.stroke = 'var(--ink-2)';
    const pt = svg('text', { x: m.l + 4, y: Y(100) - 5 }, ax); pt.textContent = '하락 전 고점 = 100';
    const every = span > 72 ? 24 : span > 36 ? 12 : 6;
    for (let t = 0; t <= span; t += every) svg('text', { x: X(t), y: H - 8, 'text-anchor': 'middle' }, ax).textContent = t ? `+${t >= 12 && t % 12 === 0 ? t / 12 + '년' : t + '개월'}` : BT.label(L.s + ep.p);
    const path = (a, color, dash, wd) => { let d = ''; a.forEach((v, t) => { d += (t ? 'L' : 'M') + X(t).toFixed(1) + ',' + Y(v).toFixed(1); }); const p = svg('path', { d, fill: 'none', 'stroke-width': wd, 'stroke-linejoin': 'round' }, root); p.style.stroke = color; if (dash) p.setAttribute('stroke-dasharray', '5 4'); };
    path(A, 'var(--bench)', true, 1.8); if (B) path(B, 'var(--p3)', false, 2.4);
    const mark = (r, color, up) => { if (r.on || r.m > span) return; const cx = X(r.m), cy = Y(100); const c0 = svg('circle', { cx, cy, r: 5, 'stroke-width': 2 }, root); c0.style.fill = color; c0.style.stroke = 'var(--panel)'; const tx = svg('text', { x: Math.min(cx, m.l + iw - 4), y: cy + (up ? -10 : 18), 'text-anchor': cx > m.l + iw - 70 ? 'end' : 'middle' }, ax); tx.textContent = `회복 ${durS(r.m)}`; tx.style.fill = color; tx.style.fontWeight = '700'; tx.style.fontFamily = 'var(--font-sans)'; };
    mark(hr, 'var(--ink-2)', false); if (B) mark(cr, 'var(--p3)', true);
    $('#rc-ep-say').textContent = `${BT.label(L.s + ep.p)}에 시작된 하락 (최대 ${mpct1(ep.depth)}) — 그대로 두기 ${durS(hr.m)}${hr.on ? '+ (아직 회복 전)' : ''}` + (B ? ` · 고른 방법 ${durS(cr.m)}${cr.on ? '+ (아직 회복 전)' : ''}, 가장 깊을 때 ${mpct1(cr.depth)}` : '');
  }

  /* every case on one chart: whole-period MDD (x) vs CAGR (y); the plain portfolio is the black diamond */
  function drawRecovSc() {
    const host = $('#c-rc-sc'); if (!host) return; host.innerHTML = ''; $('#lg-rc-sc').innerHTML = '';
    const R = state.recovRes; if (!R || !isShown(host)) return;
    const FAM = { reb: ['바로 리밸런싱', 'var(--ink-2)'], lean: ['공격 늘리기', 'var(--warn)'], def: ['수비로 옮기기', 'var(--focus)'] };
    const famOf = c => (c.m.mode === 'rebal' ? 'reb' : c.m.mode === 'lean' ? 'lean' : c.m.mode === 'def' ? 'def' : 'hold');
    const lg = $('#lg-rc-sc');
    const key = (txt, col, dia) => { const sp = el('span', 'tl'); const i = el('i', dia ? 'dia' : 'dot'); i.style.background = col; sp.append(i, document.createTextNode(txt)); lg.appendChild(sp); };
    key('그대로 두기', 'var(--ink)', true); for (const k of ['reb', 'lean', 'def']) if (R.all.some(c => famOf(c) === k)) key(FAM[k][0], FAM[k][1]);
    const W = Math.max(280, host.clientWidth || 600), H = W < 520 ? 240 : 280, m = { l: 46, r: 14, t: 12, b: 34 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of R.all) { x0 = Math.min(x0, c.st.mdd); x1 = Math.max(x1, c.st.mdd); y0 = Math.min(y0, c.st.cagr); y1 = Math.max(y1, c.st.cagr); }
    const px = (x1 - x0) * 0.08 || 0.01, py = (y1 - y0) * 0.1 || 0.002; x0 -= px; x1 += px; y0 -= py; y1 += py;
    const X = v => m.l + (x1 - v) / (x1 - x0) * iw, Y = v => m.t + (y1 - v) / (y1 - y0) * ih;   // shallower MDD to the left
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '모든 회복 전략의 전체 기간 CAGR과 MDD' }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of linTicks(y0, y1, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v * 100).toFixed(1) + '%'; }
    for (const v of linTicks(x0, x1, W < 520 ? 4 : 6)) { const x = X(v); svg('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih }, g); svg('text', { x, y: m.t + ih + 14, 'text-anchor': 'middle' }, ax).textContent = Math.round(v * 100) + '%'; }
    const xl = svg('text', { x: m.l + iw, y: H - 4, 'text-anchor': 'end' }, ax); xl.textContent = '← 얕은 MDD · 전체 기간 MDD · 깊은 MDD →';
    const h = R.hold;
    const hx = svg('line', { x1: X(h.st.mdd), x2: X(h.st.mdd), y1: m.t, y2: m.t + ih, 'stroke-dasharray': '3 3' }, root); hx.style.stroke = 'var(--ink-2)';
    const hy = svg('line', { x1: m.l, x2: m.l + iw, y1: Y(h.st.cagr), y2: Y(h.st.cagr), 'stroke-dasharray': '3 3' }, root); hy.style.stroke = 'var(--ink-2)';
    const q = svg('text', { x: m.l + 4, y: m.t + 12 }, ax); q.textContent = '↖ 더 벌고 덜 떨어짐'; q.style.fill = 'var(--pos)'; q.style.fontWeight = '700';
    for (const c of R.all) {
      if (c === h) continue;
      const f = famOf(c), cx = X(c.st.mdd), cy = Y(c.st.cagr), sel = c === R.cur;
      const d = svg('circle', { cx, cy, r: sel ? 7 : 5, 'stroke-width': sel ? 2.5 : 1 }, root); d.style.fill = FAM[f][1]; d.style.opacity = sel ? '1' : '0.75'; d.style.stroke = sel ? 'var(--ink)' : 'var(--panel)'; d.style.cursor = 'pointer';
      svg('title', null, d).textContent = `${c.m.name} · −${Math.round(c.trig * 100)}%에서 시작\nCAGR ${pct(c.st.cagr, 2)} · MDD ${mpct1(c.st.mdd)} · 최장 회복 ${c.st.uw.months ? durS(c.st.uw.months) : '없음'}\n큰 하락 평균 회복 ${durS(c.avg)}`;
      d.addEventListener('click', () => { state.recov.sel = c.m.id; state.recov.trig = c.trig; renderRecov(); });
    }
    const s = 7, dx = X(h.st.mdd), dy = Y(h.st.cagr), dia = svg('path', { d: `M${dx},${dy - s}L${dx + s},${dy}L${dx},${dy + s}L${dx - s},${dy}Z`, 'stroke-width': 1.5 }, root); dia.style.fill = 'var(--ink)'; dia.style.stroke = 'var(--panel)';
    svg('title', null, dia).textContent = `그대로 두기\nCAGR ${pct(h.st.cagr, 2)} · MDD ${mpct1(h.st.mdd)} · 최장 회복 ${h.st.uw.months ? durS(h.st.uw.months) : '없음'}`;
    const ht = svg('text', { x: dx + 9, y: dy - 7 }, ax); ht.textContent = '그대로'; ht.style.fill = 'var(--ink)'; ht.style.fontWeight = '700';
  }

  /* the chosen rule at every fall that reached its trigger: small falls cost a little, big ones may pay — you do not know which one it is when it starts */
  function renderRecovEvt(c, hold) {
    const say = $('#rc-ev-say'), tb = $('#rc-ev-tbl'); if (!say) return; say.innerHTML = ''; tb.innerHTML = '';
    if (!c || c === hold || !c.evt) { say.appendChild(el('p', 'small muted', '위 표에서 ‘그대로 두기’가 아닌 칸을 고르면, 그 규칙을 모든 하락에 썼을 때의 결과가 여기 나와요.')); state.recovEv = null; return; }
    const E = c.evt, tg = Math.round(c.trig * 100);
    const B = [['작게 끝난 하락', e => e.depth > -0.10, `−${tg}% ~ −10%`], ['중간 하락', e => e.depth <= -0.10 && e.depth > -0.20, '−10% ~ −20%'], ['큰 하락', e => e.depth <= -0.20, '−20%보다 깊게']];
    const p1 = el('p', 'rc-ev-h'); p1.append(el('b', null, `고점 대비 −${tg}%에서 ${c.m.name}`), document.createTextNode(` — 이 규칙이 발동했을 ${E.n}번의 하락 전부`)); say.appendChild(p1);
    const parts = B.map(([nm, f]) => { const l = E.list.filter(f); if (!l.length) return null; const a = l.reduce((x, e) => x + e.gain, 0) / l.length; return `${nm} ${l.length}번 평균 ${a >= 0 ? '+' : '−'}${Math.abs(a * 100).toFixed(1)}%`; }).filter(Boolean);
    say.appendChild(el('p', null, `떨어지기 시작할 때는 작게 끝날지 크게 갈지 몰라요. 이 규칙은 ${E.n}번 중 ${E.win}번 도움이 됐고 ${E.loss}번 손해였어요 (${parts.join(' · ')}). 고점을 되찾은 시점에 그대로 두기보다 앞선(+) · 뒤진(−) 비율이에요.`));
    const t = el('table', 'rctbl'), th = el('thead'), hr = el('tr');
    ['결국 얼마나 떨어졌나', '횟수', '도움 ↑ / 손해 ↓', '평균 득실', '가장 나빴던 때', '평균 회복 (그대로 → 규칙)'].forEach(x => hr.appendChild(el('th', null, x))); th.appendChild(hr); t.appendChild(th);
    const bd = el('tbody');
    for (const [nm, f, rng] of B.concat([['전체', () => true, '']])) {
      const l = E.list.filter(f); if (!l.length) continue;
      const a = l.reduce((x, e) => x + e.gain, 0) / l.length, w = l.reduce((x, e) => (e.gain < x.gain ? e : x), l[0]);
      const rh = l.reduce((x, e) => x + e.recH.m, 0) / l.length, rs = l.reduce((x, e) => x + e.recS.m, 0) / l.length;
      const tr = el('tr', nm === '전체' ? 'hold' : null); const h = el('th'); h.append(el('b', null, nm)); if (rng) h.append(el('small', null, ' ' + rng)); tr.appendChild(h);
      tr.append(el('td', null, String(l.length)), el('td', null, `${l.filter(e => e.gain > 0.001).length} / ${l.filter(e => e.gain < -0.001).length}`), el('td', a > 0.0005 ? 'pos' : a < -0.0005 ? 'neg' : null, `${a >= 0 ? '+' : '−'}${Math.abs(a * 100).toFixed(1)}%`), el('td', w.gain < 0 ? 'neg' : null, `${w.gain >= 0 ? '+' : '−'}${Math.abs(w.gain * 100).toFixed(1)}% (${BT.label(state.last.s + w.ep.p)})`), el('td', rs < rh ? 'pos' : rs > rh ? 'neg' : null, `${durS(rh)} → ${durS(rs)}`));
      bd.appendChild(tr);
    }
    t.appendChild(bd); tb.appendChild(t);
    state.recovEv = { c };
  }
  /* each fall as a dot: how deep it finally went (x) and what the rule gained or lost by the recovery (y) */
  function drawRecovEvt() {
    const host = $('#c-rc-ev'); if (!host) return; host.innerHTML = '';
    const R = state.recovEv; if (!R || !isShown(host)) return;
    const L = R.c.evt.list; if (!L.length) return;
    const W = Math.max(280, host.clientWidth || 600), H = W < 520 ? 230 : 260, m = { l: 46, r: 14, t: 14, b: 34 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    let x0 = Math.min(...L.map(e => e.depth)), x1 = -R.c.trig + 0.01, y0 = Math.min(0, ...L.map(e => e.gain)), y1 = Math.max(0, ...L.map(e => e.gain));
    const px = (x1 - x0) * 0.05, py = (y1 - y0) * 0.1 || 0.01; x0 -= px; y0 -= py; y1 += py;
    const X = v => m.l + (x1 - v) / (x1 - x0) * iw, Y = v => m.t + (y1 - v) / (y1 - y0) * ih;
    const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': '하락마다 규칙이 얻거나 잃은 비율' }, host), g = svg('g', { class: 'grid' }, root), ax = svg('g', { class: 'axis' }, root);
    for (const v of linTicks(y0, y1, 4)) { const y = Y(v); svg('line', { x1: m.l, x2: m.l + iw, y1: y, y2: y }, g); svg('text', { x: m.l - 6, y: y + 3.5, 'text-anchor': 'end' }, ax).textContent = (v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%'; }
    for (const v of linTicks(x0, x1, W < 520 ? 4 : 6)) { const x = X(v); svg('line', { x1: x, x2: x, y1: m.t, y2: m.t + ih }, g); svg('text', { x, y: m.t + ih + 14, 'text-anchor': 'middle' }, ax).textContent = Math.round(v * 100) + '%'; }
    for (const b of [-0.10, -0.20]) if (b < x1 && b > x0) { const l = svg('line', { x1: X(b), x2: X(b), y1: m.t, y2: m.t + ih, 'stroke-dasharray': '3 3' }, root); l.style.stroke = 'var(--muted)'; }
    const z = svg('line', { x1: m.l, x2: m.l + iw, y1: Y(0), y2: Y(0), 'stroke-width': 1.5 }, root); z.style.stroke = 'var(--ink-2)';
    const xl = svg('text', { x: m.l + iw, y: H - 4, 'text-anchor': 'end' }, ax); xl.textContent = '그대로 뒀을 때 결국 떨어진 폭 →';
    const t1 = svg('text', { x: m.l + 4, y: m.t + 10 }, ax); t1.textContent = '↑ 규칙이 이득'; t1.style.fill = 'var(--pos)'; t1.style.fontWeight = '700';
    const t2 = svg('text', { x: m.l + 4, y: m.t + ih - 4 }, ax); t2.textContent = '↓ 규칙이 손해'; t2.style.fill = 'var(--neg)'; t2.style.fontWeight = '700';
    for (const e of L) {
      const d = svg('circle', { cx: X(e.depth), cy: Y(e.gain), r: 5.5, 'stroke-width': 1 }, root);
      d.style.fill = e.gain > 0.001 ? 'var(--pos)' : e.gain < -0.001 ? 'var(--neg)' : 'var(--muted)'; d.style.stroke = 'var(--panel)'; d.style.opacity = e.open ? '0.5' : '0.85';
      svg('title', null, d).textContent = `${BT.label(state.last.s + e.ep.p)}에 시작한 하락 · 결국 ${mpct1(e.depth)}${e.open ? ' (아직 회복 전)' : ''}\n규칙 ${e.gain >= 0 ? '+' : '−'}${Math.abs(e.gain * 100).toFixed(1)}% · 규칙의 가장 깊은 낙폭 ${mpct1(e.sDepth)}\n회복: 그대로 ${durS(e.recH.m)} → 규칙 ${durS(e.recS.m)}`;
    }
  }

  /* the main picture: every strategy at the chosen trigger, CAGR · MDD · longest recovery, against the plain portfolio */
  function drawRecovMain() {
    const host = $('#c-rc-main'); if (!host) return; host.innerHTML = '';
    const R = state.recovRes; if (!R || !isShown(host)) return;
    const tg = state.recov.trig, rows = [{ key: 'hold', name: '그대로 두기', color: 'var(--ink)', st: R.hold.st }];
    for (const c of R.all) if (c !== R.hold && c.trig === tg) rows.push({ key: c.m.id, name: RC_SHORT[c.m.id] || c.m.name, color: 'var(--ink-2)', st: c.st });
    tripleBars(host, rows, { ref: 'hold', judge: true, sel: state.recov.sel, onPick: k => { state.recov.sel = k; renderRecov(); } });
  }
