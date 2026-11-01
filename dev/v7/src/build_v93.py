# ================= v9.3: no 'what do you want to know' guide — the four steps already lead the way =================
import re as _re
rep('<dt>v9.2 · 2026.10.29</dt>', """<dt>v9.3 · 2026.10.29</dt>
          <dd><ul><li>‘무엇을 알고 싶나요?’ 안내 칸을 뺐어요. 1 포트폴리오 → 2 결과 → 3 검증 → 4 AI 추천 순서로 넘어가며 보면 돼요.</li></ul></dd>
          <dt>v9.2 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.2</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.3</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.2</span><span class="upd-d">2026\.10\.29</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.3</span><span class="upd-d">2026.10.29</span><span class="upd-t">‘무엇을 알고 싶나요?’ 칸을 빼고 네 단계 순서대로 보게 했어요</span>', h, count=1)
blk = cut_h2('sec-start'); to_retired(blk)
a = h.index('id="start-show"'); s = h.rfind('<div class="row">', 0, a); e = h.index('</div>', a) + len('</div>')
to_retired(h[s:e] + '\n'); h = h[:s] + h[e:]
# settings rows that no longer do anything visible: view mode (one view since v9.0) and the start guide
for lab in ['<span class="lbl" id="vm-lbl">보기 모드</span>', '<span class="lbl">시작 안내</span>']:
    i = h.index(lab); s = h.rfind('      <div class="vs-row">', 0, i)
    depth = 0
    for m in _re.finditer(r'<div\b|</div>', h[s:]):
        depth += -1 if m.group(0) == '</div>' else 1
        if depth == 0: e = s + m.end(); break
    if h[e] == '\n': e += 1
    to_retired('<div>' + h[s:e] + '</div>\n'); h = h[:s] + h[e:]
