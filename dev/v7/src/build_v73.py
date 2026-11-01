# ================= v7.3: grouped structure, basic / all-features view, start guide, in-tab jumps, site map =================
rep('<dt>v7.2 · 2026.10.27</dt>', """<dt>v7.3 · 2026.10.27</dt>
          <dd><ul>
            <li>화면을 세 묶음으로 정리: 기본(1 입력 · 2 결과 · 3 적립·인출), 고급(4 점검 · 5 최적화), 도움말. 위쪽 막대에 묶음 이름과 단계 번호</li>
            <li>보기 모드: 처음에는 ‘기본 기능’만 보이고(점검·최적화 탭과 결과의 고급 항목 숨김), 위쪽 ‘모든 기능’ 스위치나 휴대폰 아래쪽 ‘고급 켜기’로 전부 보기. 기기마다 기억</li>
            <li>입력 탭 맨 위 ‘무엇을 알고 싶나요?’: 하고 싶은 일을 고르면 그 결과로 바로 이동</li>
            <li>탭마다 맨 위에 그 탭의 항목 바로가기, 도움말 › 이 계산기의 구성(전체 지도)</li>
          </ul></dd>
          <dt>v7.2 · 2026.10.27</dt>""")
rep('<span class="upd-v">v7.2</span><span class="upd-d">2026.10.27</span><span class="upd-t">매년 초 적립과 ‘적립하면 얼마나 모일까’를 더했어요</span>',
    '<span class="upd-v">v7.3</span><span class="upd-d">2026.10.27</span><span class="upd-t">처음 쓰는 분도 쉽게: 기본·고급으로 나누고 길잡이를 더했어요</span>')
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.2</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v7.3</span></h1>')

# ---- top bar: groups, step numbers, mode switch ----
rep('''    <nav class="tb-nav" id="tb-nav" aria-label="섹션 바로가기">
      <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span>입력</span></a>
      <a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span>결과</span></a>
      <a href="#g-flow" data-g="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span>적립·인출</span></a>
      <a href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>점검</span></a>
      <a href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span>최적화</span></a>
      <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
    </nav>''', '''    <nav class="tb-nav" id="tb-nav" aria-label="섹션 바로가기">
      <span class="nav-grp" aria-hidden="true">기본</span>
      <a href="#g-setup" data-g="g-setup"><svg class="ic" aria-hidden="true"><use href="#i-setup"/></svg><span><i class="n">1</i>입력</span></a>
      <a href="#g-results" data-g="g-results"><svg class="ic" aria-hidden="true"><use href="#i-results"/></svg><span><i class="n">2</i>결과</span></a>
      <a href="#g-flow" data-g="g-flow"><svg class="ic" aria-hidden="true"><use href="#i-flow"/></svg><span><i class="n">3</i>적립·인출</span></a>
      <span class="nav-grp adv-nav" aria-hidden="true">고급</span>
      <a class="adv-nav" href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span><i class="n">4</i>점검</span></a>
      <a class="adv-nav" href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span><i class="n">5</i>최적화</span></a>
      <span class="nav-sep" aria-hidden="true"></span>
      <a href="#g-ref" data-g="g-ref"><svg class="ic" aria-hidden="true"><use href="#i-help"/></svg><span>도움말</span></a>
    </nav>
    <button class="tb-mode" id="tb-mode" type="button" aria-pressed="false" title="점검·최적화 탭과 결과의 고급 항목도 보여요"><span class="sw" aria-hidden="true"></span><span>모든 기능</span></button>''')
rep('''  <a href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>점검</span></a>
  <a href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span>최적화</span></a>''',
    '''  <a class="adv-nav" href="#g-checks" data-g="g-checks"><svg class="ic" aria-hidden="true"><use href="#i-checks"/></svg><span>점검</span></a>
  <a class="adv-nav" href="#g-opt" data-g="g-opt"><svg class="ic" aria-hidden="true"><use href="#i-opt"/></svg><span>최적화</span></a>
  <a class="only-basic bn-more" href="#g-checks" data-g="g-checks" id="bn-more"><svg class="ic" aria-hidden="true"><use href="#i-plus"/></svg><span>고급 켜기</span></a>''')
rep('  <symbol id="i-checks"', '  <symbol id="i-plus" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></symbol>\n  <symbol id="i-checks"')

# ---- start guide at the top of the input tab ----
start = '''  <section class="panel start" aria-labelledby="h-start" id="sec-start">
    <div class="start-head">
      <div class="start-tx"><h2 id="h-start">무엇을 알고 싶나요?</h2><p class="help" id="start-lede">모든 탭이 이 ‘입력’ 탭의 포트폴리오와 기간을 함께 써요. 예시 포트폴리오 세 개가 채워져 있어서 바로 골라 봐도 돼요.</p></div>
      <button class="btn ghost sm" type="button" id="start-tog" aria-expanded="true" aria-controls="start-body">접기</button>
    </div>
    <div class="start-body" id="start-body">
      <ol class="steps">
        <li><b>포트폴리오 고르기</b><span>ETF와 비중(%)을 넣거나 ‘예시 불러오기’</span></li>
        <li><b>기간·금액 정하기</b><span>언제부터 얼마로 시작했는지, 달러 또는 원화</span></li>
        <li><b>알고 싶은 것 고르기</b><span>아래에서 누르면 그 결과로 가요</span></li>
      </ol>
      <div class="goals">
        <button class="goal" type="button" data-goto="sec-hero"><span class="g-cat">기본 · 2 결과</span><b>과거에 얼마나 불었을까</b><span class="g-d">연 수익률, 가장 크게 떨어진 폭, 회복까지 걸린 시간</span></button>
        <button class="goal" type="button" data-goto="sec-acc"><span class="g-cat">기본 · 3 적립·인출</span><b>매달·매년 넣으면 얼마나 모일까</b><span class="g-d">적립식으로 모인 돈, 운이 나빴을 때와 좋았을 때</span></button>
        <button class="goal" type="button" data-goto="sec-rt"><span class="g-cat">기본 · 3 적립·인출</span><b>은퇴 후 꺼내 써도 버틸까</b><span class="g-d">과거 모든 시점에서 매달 빼 써 본 결과와 안전한 인출률</span></button>
        <button class="goal" type="button" data-goto="sec-fl-set"><span class="g-cat">기본 · 3 적립·인출</span><b>세금·환율까지 빼면 얼마가 남을까</b><span class="g-d">원화 기준, 일반 계좌·연금 계좌 세금</span></button>
        <button class="goal adv" type="button" data-goto="sec-period"><span class="g-cat">고급 · 4 점검</span><b>시기가 바뀌어도 괜찮았을까</b><span class="g-d">여러 시기로 나눠 결과가 일관됐는지 판정</span></button>
        <button class="goal adv" type="button" data-goto="sec-keep"><span class="g-cat">고급 · 5 최적화</span><b>어떤 비중이 좋았을까</b><span class="g-d">기간별 최적 비중과 오래 유지할 비중</span></button>
        <button class="goal" type="button" data-goto="sec-list"><span class="g-cat">도움말</span><b>이 ETF는 뭘까</b><span class="g-d">ETF 50개의 설명·보수·성과</span></button>
      </div>
    </div>
  </section>

'''
rep('  <section class="panel" aria-labelledby="h-ports" id="sec-ports">', start + '  <section class="panel" aria-labelledby="h-ports" id="sec-ports">')

# ---- pane headers: category eyebrow + in-tab jumps ----
def jump(items):
    out = '  <nav class="jump" aria-label="이 탭 바로가기"><span class="jump-l">바로가기</span>'
    for tid, name, adv in items:
        out += f'<button type="button" class="jchip{" adv" if adv else ""}" data-goto="{tid}">{name}</button>'
    return out + '</nav>\n'
rep('<h2 class="grp-t">결과</h2><p class="grp-d">얼마나 불었고, 얼마나 떨어졌는지부터 봐요.</p></div></div>\n',
    '<span class="g-eye">기본 · 2단계</span><h2 class="grp-t">결과</h2><p class="grp-d">처음 넣은 돈이 얼마나 불었고, 가장 크게 얼마나 떨어졌는지 봐요.</p></div></div>\n' +
    jump([('sec-hero', '한눈에 보기', 0), ('h-charts', '차트', 0), ('sec-trail', '최근 10~30년', 0), ('sec-mdd', 'MDD 구분', 0),
          ('sec-sum', '자세한 지표', 1), ('sec-risk', '수익과 위험', 1), ('sec-annual', '연도별 수익률', 1), ('sec-roll', '롤링 CAGR', 1)]))
rep('<h2 class="grp-t">적립·인출</h2><p class="grp-d">매달 넣고 빼는 돈과 세금까지 넣어, 실제로 손에 남는 돈을 봐요.</p></div></div>\n',
    '<span class="g-eye">기본 · 3단계</span><h2 class="grp-t">적립·인출</h2><p class="grp-d">한 번에 넣고 끝이 아니라, 꾸준히 넣고 꺼내 쓸 때 실제로 손에 남는 돈을 봐요.</p></div></div>\n' +
    jump([('sec-fl-set', '① 계획 세우기', 0), ('sec-fl-res', '② 계획대로 했다면', 0), ('sec-fl-years', '연도별 표', 0), ('sec-acc', '③ 얼마나 모일까', 0), ('sec-rt', '④ 은퇴 인출 점검', 0)]))
rep('<h2 class="grp-t">점검</h2><p class="grp-d">같은 비중이 시기가 바뀌어도 비슷했는지 확인해요.</p></div></div>\n',
    '<span class="g-eye">고급 · 4단계</span><h2 class="grp-t">점검</h2><p class="grp-d">같은 비중이 시기가 바뀌어도 비슷했는지, 운이 좋았던 것뿐인지 확인해요.</p></div></div>\n' +
    jump([('sec-period', '판정', 0), ('pc-table-sec', '가장 과거 vs 최근', 0), ('pc-heat-sec', '모든 구간 지도', 0), ('pc-custom-sec', '직접 고른 구간', 0), ('sec-trend', '추세 보정', 0)]))
rep('<h2 class="grp-t">최적화 <span class="adv-b">고급</span></h2>', '<span class="g-eye">고급 · 5단계</span><h2 class="grp-t">최적화</h2>')
rep('지나간 구간에 맞춘 결과라 앞으로도 그렇다는 보장은 없어요.</p></div></div>\n',
    '지나간 구간에 맞춘 결과라 앞으로도 그렇다는 보장은 없어요.</p></div></div>\n' +
    jump([('sec-opt', '실행', 0), ('sec-hz', '기간별 최적 비중', 0), ('sec-keep', '장기 유지 추천', 0), ('o-era-sec', '가장 과거 vs 최근', 0), ('o-adj-sec', '실제 vs 추세 보정', 0),
          ('o-life-sec', '생애 주기', 0), ('o-walk-sec', '과최적화 점검', 0), ('o-front-sec', '모든 조합', 0)]))
rep('<h2 class="grp-t">도움말</h2><p class="grp-d">용어 풀이, 화면 설정, 사용한 데이터와 계산 방식.</p></div></div>\n',
    '<h2 class="grp-t">도움말</h2><p class="grp-d">계산기의 구성, 용어 풀이, 화면 설정, ETF 설명, 데이터와 계산 방식.</p></div></div>\n' +
    jump([('sec-map', '이 계산기의 구성', 0), ('sec-terms', '용어 풀이', 0), ('sec-view', '화면 설정', 0), ('sec-list', 'ETF 설명', 0), ('sec-cov', '사용한 데이터', 0), ('sec-method', '계산 방식', 0)]))

# ---- site map in help ----
def ml(tid, name, adv=False):
    return f'<li><button type="button" class="map-link{" adv" if adv else ""}" data-goto="{tid}">{name}</button></li>'
smap = f'''  <section class="panel" aria-labelledby="h-map" id="sec-map">
    <div class="panel-head"><h2 id="h-map">이 계산기의 구성</h2><p class="help">‘1 입력’에서 정한 포트폴리오·기간·처음 넣는 돈·통화·물가·배당 설정을 다른 모든 탭이 함께 써요. 항목을 누르면 그곳으로 가요.</p></div>
    <div class="map">
      <div class="map-col"><span class="map-cat">준비</span>
        <div class="map-card"><h3><i class="n">1</i>입력</h3><p>무엇을, 언제부터, 얼마로</p><ul>{ml('sec-ports', '포트폴리오 3개와 예시')}{ml('sec-set', '기간 · 처음 넣는 돈 · 통화(달러/원화) · 리밸런싱')}{ml('fold-set', '고급 설정: 비교 기준 · 물가 · 배당 · 데이터 범위')}{ml('fold-saved', '저장한 포트폴리오')}</ul></div>
      </div>
      <div class="map-col"><span class="map-cat">기본 — 결과 보기</span>
        <div class="map-card"><h3><i class="n">2</i>결과</h3><p>한 번에 넣고 그대로 뒀다면</p><ul>{ml('sec-hero', '한눈에 보기: 최종 금액 · 연 수익률 · 최대 낙폭')}{ml('h-charts', '자산 성장 · 낙폭 차트')}{ml('sec-trail', '최근 10·15·20·25·30년 성과')}{ml('sec-mdd', 'MDD 구분')}{ml('sec-sum', '고급: 자세한 지표 · 수익과 위험 · 연도별 · 롤링', True)}</ul></div>
        <div class="map-card"><h3><i class="n">3</i>적립·인출</h3><p>꾸준히 넣고 꺼내 쓴다면</p><ul>{ml('sec-fl-set', '계획: 넣는 돈(매달·매년 초) · 빼는 돈 · 세금')}{ml('sec-fl-res', '계획대로 했다면: 남는 돈 · 내 돈 수익률')}{ml('sec-acc', '적립하면 얼마나 모일까')}{ml('sec-rt', '은퇴 인출 점검')}</ul></div>
      </div>
      <div class="map-col"><span class="map-cat">고급 — 깊이 분석</span>
        <div class="map-card"><h3><i class="n">4</i>점검</h3><p>운이 좋았던 것뿐일까</p><ul>{ml('sec-period', '구간별 판정', True)}{ml('pc-heat-sec', '시작 연도 × 끝 연도 지도', True)}{ml('sec-trend', '추세 유지 보정', True)}</ul></div>
        <div class="map-card"><h3><i class="n">5</i>최적화</h3><p>어떤 비중이 좋았을까</p><ul>{ml('sec-hz', '기간별 최적 비중', True)}{ml('sec-keep', '장기 유지 추천', True)}{ml('o-life-sec', '생애 주기별 추천', True)}{ml('o-walk-sec', '과최적화 점검', True)}</ul></div>
      </div>
    </div>
    <p class="small muted">기본 보기에서는 점검·최적화 탭과 결과의 고급 항목이 숨겨져 있어요. 고급 항목을 누르면 모든 기능이 켜져요.</p>
  </section>

'''
rep('  <section class="panel" aria-labelledby="h-terms" id="sec-terms">', smap + '  <section class="panel" aria-labelledby="h-terms" id="sec-terms">')
rep('''      <div class="vs-row">
        <span class="lbl" id="lay-lbl">화면 배치</span>''', '''      <div class="vs-row">
        <span class="lbl" id="vm-lbl">보기 모드</span>
        <div class="seg-toggle" id="vm" role="group" aria-labelledby="vm-lbl"><button type="button" data-v="basic" aria-pressed="true">기본 기능만</button><button type="button" data-v="full" aria-pressed="false">모든 기능</button></div>
        <p class="help">기본 기능만 고르면 1 입력 · 2 결과 · 3 적립·인출과 도움말만 보여요. 점검·최적화와 결과의 고급 항목은 ‘모든 기능’에서 보여요.</p>
      </div>
      <div class="vs-row">
        <span class="lbl">시작 안내</span>
        <div class="row"><button class="btn ghost sm" type="button" id="start-show">‘무엇을 알고 싶나요?’ 다시 펼치기</button></div>
      </div>
      <div class="vs-row">
        <span class="lbl" id="lay-lbl">화면 배치</span>''')

# ---- next-step buttons depend on the view mode ----
rep('<button class="btn ghost" type="button" data-go="g-results">← 결과</button><button class="btn" type="button" data-go="g-checks">점검 보기 →</button></nav>\n  </div>',
    '<button class="btn ghost" type="button" data-go="g-results">← 결과</button><button class="btn only-full" type="button" data-go="g-checks">점검 보기 →</button><button class="btn ghost only-basic" type="button" id="more-on">고급 기능(점검·최적화) 켜기 →</button></nav>\n  </div>')
rep('<button class="btn ghost" type="button" data-go="g-opt">← 최적화</button>', '<button class="btn ghost only-full" type="button" data-go="g-opt">← 최적화</button><button class="btn ghost only-basic" type="button" data-go="g-flow">← 적립·인출</button>')

# ---- script ----
ui = r'''
  /* ======================= v7.3: view mode, start guide, jumps ======================= */
  const MODE_KEY = 'etf-backtester-v7.mode', START_KEY = 'etf-backtester-v7.start';
  const ADV_TABS = ['g-checks', 'g-opt'];
  function setMode(m, save, quiet) {
    state.mode = m === 'full' ? 'full' : 'basic';
    document.documentElement.dataset.mode = state.mode;
    $('#tb-mode').setAttribute('aria-pressed', state.mode === 'full' ? 'true' : 'false');
    document.querySelectorAll('#vm button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === state.mode ? 'true' : 'false'));
    if (save) { try { window.localStorage.setItem(MODE_KEY, state.mode); } catch (_) {} }
    if (quiet) return;
    if (state.mode === 'basic' && ADV_TABS.includes(state.tab) && state.layout === 'tabs') showTab('g-flow', { user: true });
    else { markNav(); redrawVisible(); maybeRunDeferredOpt(); }
  }
  function fullOn(msg) { if (state.mode === 'full') return; setMode('full', true); toast(msg || '점검·최적화도 보이도록 모든 기능을 켰어요. 위쪽 스위치나 도움말 › 화면 설정에서 끌 수 있어요.'); }
  $('#tb-mode').addEventListener('click', () => { const on = state.mode !== 'full'; setMode(on ? 'full' : 'basic', true); toast(on ? '모든 기능을 켰어요. 4 점검 · 5 최적화 탭이 보여요.' : '기본 기능만 보여요. 점검·최적화는 다시 켜면 그대로 있어요.'); });
  $('#vm').addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (b) setMode(b.dataset.v, true); });
  $('#more-on').addEventListener('click', () => { fullOn(); showTab('g-checks', { user: true }); });
  $('#bn-more').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); fullOn(); showTab('g-checks', { user: true }); }, true);
  function inAdv(t) { const p = t && t.closest('.pane'); return !!(p && ADV_TABS.includes(p.dataset.g)) || !!(t && t.closest('details.adv') && t.closest('.pane[data-g="g-results"]')); }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-goto]'); if (!b) return;
    const t = document.getElementById(b.dataset.goto); if (!t) return;
    if (state.mode === 'basic' && inAdv(t)) fullOn();
    if (b.closest('#sec-start') && state.layout === 'tabs' && !t.closest('.pane[data-g="g-setup"]')) showTab(t.closest('.pane').dataset.g, { user: true });
    goTo(b.dataset.goto);
    const box = t.matches('section, details') ? t : (t.closest('section, details') || t);
    box.classList.remove('flash'); void box.offsetWidth; box.classList.add('flash');
  });
  function setStart(open, save) {
    const s = $('#sec-start'); s.classList.toggle('min', !open);
    $('#start-body').hidden = !open; $('#start-tog').textContent = open ? '접기' : '펼치기'; $('#start-tog').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('#start-lede').textContent = open ? '모든 탭이 이 ‘입력’ 탭의 포트폴리오와 기간을 함께 써요. 예시 포트폴리오 세 개가 채워져 있어서 바로 골라 봐도 돼요.' : '하고 싶은 일을 고르면 그 결과로 바로 가요.';
    if (save) { try { window.localStorage.setItem(START_KEY, open ? 'open' : 'min'); } catch (_) {} }
  }
  $('#start-tog').addEventListener('click', () => setStart($('#start-body').hidden, true));
  $('#start-show').addEventListener('click', () => { setStart(true, true); showTab('g-setup', { user: true }); goTo('sec-start'); });
  function initUI() {
    let m = null; try { m = window.localStorage.getItem(MODE_KEY); } catch (_) {}
    if (m !== 'full' && m !== 'basic') m = 'basic';
    if (ADV_TABS.includes(state.tab)) m = 'full';   // opened from a link to an advanced tab
    setMode(m, false, true);
    let st = null; try { st = window.localStorage.getItem(START_KEY); } catch (_) {}
    setStart(st !== 'min', false);
  }
'''
rep("  /* ---------- boot ---------- */", ui + "\n  /* ---------- boot ---------- */")
rep("  { const h = (location.hash || '').slice(1); state.tab = TAB_IDS.includes(h) ? h : 'g-setup'; }",
    "  { const h = (location.hash || '').slice(1); state.tab = TAB_IDS.includes(h) ? h : 'g-setup'; }\n  initUI();")
rep("    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;", "    if (state.layout === 'tabs' && state.tab !== 'g-opt') return;\n    if (state.mode === 'basic') return;")
# a tab hidden in the basic view opens the full view when someone goes there (e.g. the '점검 보기' button)
rep("  function showTab(g, opts = {}) {\n    if (!TAB_IDS.includes(g)) g = 'g-setup';",
    "  function showTab(g, opts = {}) {\n    if (!TAB_IDS.includes(g)) g = 'g-setup';\n    if (state.mode === 'basic' && ADV_TABS.includes(g)) setMode('full', true, true);")

css3 = """
/* v7.3: groups, view mode, start guide, jumps, map */
.nav-grp { align-self: center; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; color: var(--muted); padding: 0 2px 0 8px; white-space: nowrap; }
.nav-grp:first-child { padding-left: 0; }
.nav-sep { flex: none; width: 1px; align-self: stretch; margin: 4px 6px; background: var(--line-2); }
.tb-nav a .n, .map-card h3 .n { font-style: normal; font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; display: inline-grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; border: 1px solid currentColor; margin-right: 5px; opacity: 0.75; vertical-align: 1px; }
.tb-mode { flex: none; font: inherit; font-size: 12.5px; font-weight: 600; color: var(--ink-2); background: var(--panel); border: 1px solid var(--line-2); border-radius: 999px; padding: 4px 11px 4px 6px; display: inline-flex; align-items: center; gap: 7px; cursor: pointer; white-space: nowrap; min-height: 32px; }
.tb-mode .sw { width: 28px; height: 16px; border-radius: 999px; background: var(--line-2); position: relative; transition: background 0.15s; }
.tb-mode .sw::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--panel); transition: transform 0.15s; }
.tb-mode[aria-pressed="true"] { color: var(--ink); border-color: var(--ink-2); }
.tb-mode[aria-pressed="true"] .sw { background: var(--ink); }
.tb-mode[aria-pressed="true"] .sw::after { transform: translateX(12px); }
:root[data-mode="basic"] .adv-nav,
:root[data-mode="basic"] .pane[data-g="g-checks"],
:root[data-mode="basic"] .pane[data-g="g-opt"],
:root[data-mode="basic"] .pane[data-g="g-results"] details.adv,
:root[data-mode="basic"] .pane[data-g="g-results"] .adv-lead,
:root[data-mode="basic"] .jchip.adv,
:root:not([data-mode="basic"]) .only-basic,
:root[data-mode="basic"] .only-full { display: none !important; }
.g-eye { font-size: 11.5px; font-weight: 700; letter-spacing: 0.04em; color: var(--muted); }
.jump { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.jump-l { font-size: 12px; font-weight: 600; color: var(--muted); margin-right: 2px; }
.jchip { font: inherit; font-size: 12.5px; color: var(--ink-2); background: transparent; border: 1px dashed var(--line-2); border-radius: 999px; padding: 3px 10px; cursor: pointer; min-height: 28px; }
.jchip:hover { color: var(--ink); border-style: solid; border-color: var(--ink-2); }
.jchip.adv::after { content: "고급"; font-size: 10px; font-weight: 700; color: var(--muted); margin-left: 5px; }
.start { display: grid; gap: 14px; }
.start-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.start-tx { display: grid; gap: 4px; min-width: 0; }
.start-tx h2 { font-size: 19px; }
.start.min { padding-block: 12px; }
.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; counter-reset: st; }
.steps li { counter-increment: st; display: grid; grid-template-columns: 26px minmax(0, 1fr); gap: 0 8px; align-items: start; padding: 10px 12px; border-radius: 10px; background: var(--panel-2); }
.steps li::before { content: counter(st); grid-row: span 2; width: 24px; height: 24px; border-radius: 50%; background: var(--ink); color: var(--panel); font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; display: grid; place-items: center; }
.steps b { font-size: 13.5px; }
.steps span { font-size: 12px; color: var(--muted); }
.goals { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 10px; }
.goal { font: inherit; text-align: left; display: grid; gap: 3px; align-content: start; padding: 12px 14px; border: 1px solid var(--line-2); border-radius: 12px; background: var(--panel); color: var(--ink); cursor: pointer; min-width: 0; }
.goal:hover { border-color: var(--ink-2); box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06); }
.goal b { font-size: 15px; letter-spacing: -0.01em; }
.goal .g-d { font-size: 12.5px; color: var(--ink-2); line-height: 1.45; }
.goal .g-cat { font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: 0.02em; }
.goal.adv { background: var(--panel-2); border-style: dashed; }
:root[data-mode="basic"] .goal.adv .g-cat::after { content: " · 누르면 고급 기능이 켜져요"; font-weight: 500; }
.map { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.map-col { display: grid; gap: 10px; align-content: start; min-width: 0; }
.map-cat { font-size: 12px; font-weight: 700; letter-spacing: 0.03em; color: var(--muted); }
.map-card { border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; display: grid; gap: 4px; background: var(--panel); min-width: 0; }
.map-card h3 { font-size: 15px; display: flex; align-items: center; }
.map-card > p { font-size: 12.5px; color: var(--muted); }
.map-card ul { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 2px; }
.map-link { font: inherit; font-size: 13px; color: var(--ink-2); background: none; border: 0; padding: 3px 0; text-align: left; cursor: pointer; }
.map-link::before { content: "→ "; color: var(--muted); }
.map-link:hover { color: var(--focus); text-decoration: underline; text-underline-offset: 3px; }
.map-link.adv::after { content: " 고급"; font-size: 10.5px; font-weight: 700; color: var(--muted); }
.bnav a.bn-more .ic { opacity: 0.8; }
@media (max-width: 900px) { .map { grid-template-columns: 1fr 1fr; } .map-col:first-child { grid-column: 1 / -1; } .nav-grp { display: none; } }
@media (max-width: 640px) {
  .steps { grid-template-columns: 1fr; }
  .map { grid-template-columns: 1fr; }
  .goals { grid-template-columns: 1fr 1fr; }
  .goal { padding: 10px 12px; }
  .goal b { font-size: 14px; }
  .goal .g-d { display: none; }
  .jump { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-inline: calc(-1 * max(16px, env(safe-area-inset-left, 0px))); padding-inline: max(16px, env(safe-area-inset-left, 0px)); }
  .jump::-webkit-scrollbar { display: none; }
  .jchip { white-space: nowrap; }
}
@media (max-width: 560px) { .tb-mode span:last-child { display: none; } .tb-nav a .n { display: none; } }
"""
rep("@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }", "@media (prefers-reduced-motion: reduce) { .flash { animation: none; } }" + css3)
