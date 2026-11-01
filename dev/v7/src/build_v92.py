# ================= v9.2: no monthly saving, no withdrawals (one-off or yearly saving only) =================
import re as _re
rep('<dt>v9.1 · 2026.10.29</dt>', """<dt>v9.2 · 2026.10.29</dt>
          <dd><ul>
            <li>매달 적립과 모은 돈 꺼내 쓰기(인출 계획 · 은퇴 인출 점검)를 뺐어요. 투자 방식은 ‘한 번에 넣기’와 ‘매년 초 적립’ 두 가지예요.</li>
            <li>‘적립·인출’ 탭 이름을 ‘적립·세금’으로 바꿨어요(매년 초 적립 · 세금 · 환율 · 얼마나 모일까).</li>
          </ul></dd>
          <dt>v9.1 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.1</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.2</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.1</span><span class="upd-d">2026\.10\.29</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.2</span><span class="upd-d">2026.10.29</span><span class="upd-t">매달 적립과 꺼내 쓰기를 빼고, 한 번에 넣기 · 매년 초 적립만 남겼어요</span>', h, count=1)

def cut_h2(ident):
    global h
    i = h.index(f' id="{ident}"'); s = h.rfind('\n', 0, i) + 1
    tag = _re.match(r'\s*<(\w+)', h[s:]).group(1); depth = 0
    for m in _re.finditer(rf'<{tag}\b|</{tag}>', h[s:]):
        depth += -1 if m.group(0).startswith('</') else 1
        if depth == 0: e = s + m.end(); break
    while e < len(h) and h[e] == '\n': e += 1
    blk = h[s:e]; h = h[:s] + h[e:]; return blk
def to_retired(blk):
    global h
    a = h.index('<div id="retired" hidden aria-hidden="true">\n') + len('<div id="retired" hidden aria-hidden="true">\n')
    h = h[:a] + blk + h[a:]

# style chooser: two ways only
h = _re.sub(r'\s*<label class="sty"><input type="radio" name="sty" value="M">.*?</label>', '', h, count=1)
h = _re.sub(r'\s*<label class="sty"><input type="radio" name="sty" value="wd">.*?</label>', '', h, count=1)
rep('세금과 자세한 계획(해마다 늘리기, 빼기 시작 시점 등)은 ‘3 적립·인출’ 탭에서 정해요.', '세금 · 환율과 해마다 늘리기는 더보기 › ‘적립·세금’ 탭에서 정해요.')
# flow tab
rep('<button type="button" data-v="M" aria-pressed="true">매달</button>', '')
a = h.index('      <fieldset class="fl-box">\n        <legend>빼서 쓰는 돈</legend>'); b = h.index('</fieldset>', a) + len('</fieldset>\n')
wd = h[a:b]; h = h[:a] + h[b:]
to_retired('<div>' + wd + '</div>\n')
to_retired(cut_h2('sec-rt'))
rep('<option value="auto">인출 전까지 (없으면 끝까지)</option>', '<option value="auto">끝까지</option>')
rep('<button type="button" class="jchip" data-goto="sec-rt">④ 은퇴 인출 점검</button>', '')
h = _re.sub(r'\s*<button class="goal" type="button" data-goto="sec-rt">.*?</button>', '', h, count=1)
rep('<b>매달·매년 넣으면 얼마나 모일까</b>', '<b>매년 넣으면 얼마나 모일까</b>')
h = _re.sub(r'<li><button type="button" class="map-link" data-goto="sec-rt">[^<]*</button></li>', '', h)
rep('data-goto="sec-fl-set">넣는 돈 · 빼는 돈 · 세금 · 환율</button>', 'data-goto="sec-fl-set">매년 초 적립 · 세금 · 환율</button>')
rep('<p>꾸준히 넣고 꺼내 쓴다면</p>', '<p>해마다 넣는다면, 세금 · 환율까지</p>')
rep('<small>매달·매년 넣기, 꺼내 쓰기, 세금·환율, 은퇴 인출 점검</small>', '<small>매년 초 적립, 세금, 환율, 얼마나 모일까</small>')
rep('<h2 id="h-fl-set">넣고 빼는 계획</h2>', '<h2 id="h-fl-set">넣는 계획 · 세금</h2>')
h = _re.sub(r'(<div class="gsec" id="g-flow">.*?<p class="grp-d">)[^<]*', r'\g<1>처음 넣는 돈에 더해 해마다 1월에 넣으면 얼마나 모이는지, 세금과 원화 환율까지 빼면 손에 얼마가 남는지 봐요.', h, count=1)
h = _re.sub(r'(<div class="gsec" id="g-flow">.*?<p class="grp-d">)[^<]*', r'\g<1>처음 넣는 돈에 더해 해마다 1월에 넣으면 얼마나 모이는지, 세금과 원화 환율까지 빼면 손에 얼마가 남는지 봐요.', h, count=1)
# rename the tab everywhere outside the change log
a = h.index('<dt>v9.2 · 2026.10.29</dt>'); b = h.index('</dl>', a)
h = h[:a].replace('적립·인출', '적립·세금') + h[a:b] + h[b:].replace('적립·인출', '적립·세금')
# presets: yearly only
rep("""    { n: '매달 적립만', f: k => ({ cf: 'M', c: k ? 1000000 : 1000, cg: 0, cm: 'auto', wm: 'none' }) },
    { n: '매년 초 적립', f: k => ({ cf: 'Y', cy: k ? 12000000 : 12000, cg: 0, cm: 'auto', wm: 'none' }) },
    { n: '적립 20년 → 인출', f: k => ({ cf: 'M', c: k ? 1000000 : 1000, cg: 3, cm: 20, wm: 'fixed', w: k ? 3000000 : 3000, ws: 20, wi: true }) },
    { n: '은퇴: 4% 인출', f: () => ({ cf: 'N', cm: 'auto', wm: 'fixed', ws: 0, wi: true, rtR: 4 }), init: k => (k ? 1000000000 : 1000000), w: (v) => v * 0.04 / 12 },
    { n: '은퇴: 평가액의 4%', f: () => ({ cf: 'N', cm: 'auto', wm: 'pct', wp: 4, ws: 0 }), init: k => (k ? 1000000000 : 1000000) }""",
"""    { n: '한 번에 넣기', f: () => ({ cf: 'N', cm: 'auto', wm: 'none' }) },
    { n: '매년 초 적립', f: k => ({ cf: 'Y', cy: k ? 12000000 : 12000, cg: 0, cm: 'auto', wm: 'none' }) },
    { n: '매년 초 적립 · 해마다 3% 늘리기', f: k => ({ cf: 'Y', cy: k ? 12000000 : 12000, cg: 3, cm: 'auto', wm: 'none' }) },
    { n: '매년 초 적립 20년', f: k => ({ cf: 'Y', cy: k ? 12000000 : 12000, cg: 0, cm: 20, wm: 'none' }) }""")
rep("    if (!['N', 'M', 'Y'].includes(FL.cf)) FL.cf = 'N';", "    if (!['N', 'Y'].includes(FL.cf)) FL.cf = 'N'; FL.wm = 'none';   // v9.2: no monthly saving, no withdrawals")
rep("""  function setStyle(s) {
    readFlowInputs();""", """  function setStyle(s) {
    if (s !== 'lump' && s !== 'Y') s = 'lump';
    readFlowInputs();""")
h += ''
css92 = """
/* v9.2 */
#st-w-f, #st-mix { display: none !important; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css92)
h = h.replace('‘적립·세금’ 탭에서 매달 넣고 빼는 돈과 세금까지 넣어 볼 수 있어요', '‘적립·세금’ 탭에서 매년 초 넣는 돈과 세금까지 넣어 볼 수 있어요')
h = h.replace('위에서 한 번에 / 매달 / 매년 / 꺼내 쓰기', '위에서 한 번에 / 매년 초 적립')
rep("cell('받은 돈', fmtMoneyShort(r.totOut + r.totInc), false, r.totInc > 0 ? `배당 ${fmtMoneyShort(r.totInc)} 포함` : (r.totOut > 0 ? '인출 합계' : '인출 없음'));",
    "cell('현금으로 받은 배당', fmtMoneyShort(r.totInc), false, r.totInc > 0 ? '입력 › 배당을 현금으로 받기' : '배당 재투자 중');")
