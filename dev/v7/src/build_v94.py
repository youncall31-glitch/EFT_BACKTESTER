# ================= v9.4: one input card on top — way of investing, amount, period, currency, rebalancing =================
import re as _re
rep('<dt>v9.3 · 2026.10.29</dt>', """<dt>v9.4 · 2026.10.29</dt>
          <dd><ul><li>‘기간과 금액’을 맨 위 투자 방식 칸과 합쳤어요(처음 넣는 돈은 한 곳에서만 넣어요).</li></ul></dd>
          <dt>v9.3 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.3</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.4</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.3</span><span class="upd-d">2026\.10\.29</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.4</span><span class="upd-d">2026.10.29</span><span class="upd-t">투자 방식 · 금액 · 기간을 맨 위 한 칸에서 정해요</span>', h, count=1)
blk = cut_h2('sec-set')
avail = _re.search(r'<p id="avail-note">.*?</p>', blk).group(0)
a = blk.index('    <div class="settings">'); b = blk.rindex('  </section>')
settings = blk[a:b]
i = settings.index('<label for="init" id="init-lbl">'); s = settings.rfind('      <div class="field">', 0, i); e = settings.index('      </div>\n', i) + len('      </div>\n')
to_retired('<div>' + settings[s:e] + '</div>\n'); settings = settings[:s] + settings[e:]
newset = ('    <div class="sty-set" id="sec-set">\n      <h3 class="sc-sub" id="h-set">기간 · 통화 · 리밸런싱</h3>\n      ' + avail.replace('<p id="avail-note">', '<p class="small muted" id="avail-note">') + '\n' + settings + '    </div>\n')
a = h.index('    <p class="notice" id="st-mix"')
h = h[:a] + newset + h[a:]
rep('<h2 id="h-style">어떻게 투자하나요?</h2><p class="help">먼저 투자 방식을 고르세요. 결과 탭과 적립·세금 탭이 이 방식으로 계산해요. 언제든 바꿀 수 있어요.</p>',
    '<h2 id="h-style">투자 방식 · 금액 · 기간</h2><p class="help">어떻게, 얼마로, 언제부터 투자했다고 볼지 정해요. 모든 탭이 이 설정으로 계산해요.</p>')
h = _re.sub(r'<p class="small muted">기간·통화·리밸런싱은 아래 ‘기간과 금액’에서, [^<]*</p>', '<p class="small muted">세금과 해마다 늘리기는 더보기 › ‘적립·세금’ 탭에서 정해요.</p>', h, count=1)
css94 = """
/* v9.4 */
.sty-set { border-top: 1px dashed var(--line-2); margin-top: 14px; padding-top: 12px; }
.sty-set .settings { margin-top: 8px; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css94)
