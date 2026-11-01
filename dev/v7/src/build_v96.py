# ================= v9.6: show the period with and without the pre-launch extension =================
import re as _re
rep('<dt>v9.5 · 2026.10.29</dt>', """<dt>v9.6 · 2026.10.30</dt>
          <dd><ul><li>‘데이터 범위’ 옆에 켰을 때와 껐을 때의 분석 기간을 함께 보여줘요(가장 늦게 상장한 종목도 표시). 쓸 수 있는 기간보다 긴 기간 버튼은 눌리지 않게 했어요.</li></ul></dd>
          <dt>v9.5 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.5</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.6</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.5</span><span class="upd-d">2026\.10\.29</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.6</span><span class="upd-d">2026.10.30</span><span class="upd-t">데이터 범위를 켜고 끌 때 분석 기간이 어떻게 바뀌는지 보여줘요</span>', h, count=1)
a = h.index('<label class="toggle" for="ext">'); b = h.index('</label>', a) + len('</label>')
h = h[:a] + h[a:b] + '\n        <div class="ext-cmp" id="ext-cmp"></div>' + h[b:]
rep("${state.ext ? '상장 전 확장' : 'ETF 상장 이후만'}", "${state.ext ? '상장 전 확장' : 'ETF 상장 이후만'}${state.last ? ` (${BT.label(state.last.cs)}~)` : ''}")
js = r'''
  /* v9.6: what the period is with and without the pre-launch extension, for the tickers in use */
  function renderExtCmp() {
    const host = $('#ext-cmp'); if (!host) return; host.innerHTML = '';
    const tk = []; validPorts().forEach(p => p.info.tickers.forEach(t => { if (!tk.includes(t)) tk.push(t); }));
    if (state.bench && known(state.bench) && !tk.includes(state.bench)) tk.push(state.bench);
    if (!tk.length) return;
    const row = (on, mode) => {
      const [s, e] = BT.commonRange(tk, mode), late = tk.reduce((a, t) => (BT.avail(t, mode)[0] > BT.avail(a, mode)[0] ? t : a), tk[0]);
      const d = el('div', 'ext-r' + (state.ext === on ? ' cur' : ''));
      d.append(el('b', null, on ? '켜면' : '끄면'), el('span', 'mono', `${BT.label(s)} ~ ${BT.label(e)}`), el('span', null, `${monthsTxt(e - s + 1)}`), el('small', null, on ? '상장 전은 지수 · 시뮬레이션 데이터' : `${late} 실제 데이터가 ${BT.label(BT.avail(late, 'etf')[0])}부터라`));
      if (state.ext === on) d.appendChild(el('i', null, '지금'));
      return d;
    };
    host.append(row(true, 'ext'), row(false, 'etf'));
    // period buttons longer than what the data allows cannot be pressed
    const L = state.last; if (!L) return;
    const span = L.ce - L.cs + 1;
    document.querySelectorAll('#quick .chip, #quick3 .chip').forEach(c => {
      const q = c.dataset.q; if (!q || q === 'max') return;
      const no = +q * 12 > span; c.disabled = no; c.title = no ? `데이터가 ${monthsTxt(span)}뿐이라 고를 수 없어요` : '';
    });
  }
'''
rep("  /* ---------- boot ---------- */", js + "\n  /* ---------- boot ---------- */")
assert h.count("renderTcmp(); syncOptSel();") == 2
h = h.replace("renderTcmp(); syncOptSel();", "renderTcmp(); syncOptSel(); renderExtCmp();")
css96 = """
/* v9.6 */
.ext-cmp { display: grid; gap: 6px; margin-top: 8px; }
.ext-r { display: grid; grid-template-columns: auto auto 1fr auto; align-items: baseline; gap: 2px 10px; padding: 8px 10px; border: 1px solid var(--line-2); border-radius: 10px; font-size: 13px; }
.ext-r b { font-size: 13px; } .ext-r .mono { font-weight: 700; }
.ext-r small { grid-column: 1 / -1; color: var(--muted); font-size: 11.5px; }
.ext-r i { font-style: normal; font-size: 11px; font-weight: 800; background: var(--focus); color: #fff; border-radius: 999px; padding: 1px 8px; grid-row: 1; grid-column: 4; }
.ext-r.cur { border-color: var(--focus); background: color-mix(in srgb, var(--focus) 6%, var(--panel)); }
#quick .chip:disabled, #quick3 .chip:disabled { opacity: 0.35; cursor: not-allowed; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css96)
