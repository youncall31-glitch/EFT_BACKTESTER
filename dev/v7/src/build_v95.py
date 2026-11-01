# ================= v9.5: other settings inside the top card; no results preview on the input tab =================
import re as _re
rep('<dt>v9.4 · 2026.10.29</dt>', """<dt>v9.5 · 2026.10.29</dt>
          <dd><ul><li>‘고급 설정’(벤치마크 · 결과 데이터 · 데이터 범위 · 물가 · 배당)을 맨 위 칸 안의 ‘그 밖의 설정’으로 합쳤어요.</li><li>1 포트폴리오 탭의 ‘결과 미리보기’를 뺐어요 — 결과는 2 결과 탭에서 봐요.</li></ul></dd>
          <dt>v9.4 · 2026.10.29</dt>""")
rep('<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.4</span></h1>', '<h1>ETF 포트폴리오 백테스터 <span class="h1-v">v9.5</span></h1>')
h = _re.sub(r'<span class="upd-v">v9\.4</span><span class="upd-d">2026\.10\.29</span><span class="upd-t">[^<]*</span>',
            '<span class="upd-v">v9.5</span><span class="upd-d">2026.10.29</span><span class="upd-t">설정은 모두 맨 위 한 칸에서, 결과는 2 결과 탭에서 봐요</span>', h, count=1)
to_retired(cut_h2('sec-qr'))
blk = cut_h2('fold-set')
sm = _re.search(r'<span class="fold-d" id="adv-sum">.*?</span>', blk)
a = blk.index('<div class="fold-body settings">') + len('<div class="fold-body settings">'); b = blk.rindex('    </div>\n  </details>')
body = blk[a:b].replace('<p class="help field wide">처음이라면 그대로 두어도 돼요. 여기서 바꾼 설정은 모든 결과에 적용돼요.</p>', '<p class="help field wide">처음이라면 그대로 두어도 돼요.</p>')
adv = ('    <details class="more" id="fold-set"><summary><span class="fs-t" id="h-adv-set">그 밖의 설정</span>' + (sm.group(0).replace('class="fold-d"', 'class="fs-d"') if sm else '<span class="fs-d" id="adv-sum"></span>') + '</summary>\n'
       '      <div class="settings">' + body + '      </div>\n    </details>\n')
a = h.index('    <p class="notice" id="st-mix"')
h = h[:a] + adv + h[a:]
css95 = """
/* v9.5 */
#fold-set { margin-top: 14px; }
#fold-set > summary { flex-wrap: wrap; row-gap: 2px; }
#fold-set .fs-t { margin-right: 8px; }
#fold-set .fs-d { font-size: 12px; font-weight: 500; color: var(--muted); flex: 1 1 160px; }
#fold-set .settings { margin-top: 10px; }
"""
rep("@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }", "@media (max-width: 380px) { .sk-grid { grid-template-columns: 1fr; } }" + css95)
h = h.replace("추세 보정이 꺼져 있어요. ‘점검 › 추세 유지 보정’에서 켤 수 있어요.", "추세 보정이 꺼져 있어요. ‘추세 보정 데이터’를 누르면 켜져요.")
h = h.replace("추세 보정이 꺼져 있어요(‘점검 › 추세 유지 보정’).", "추세 보정이 꺼져 있어요.")
h = h.replace(" 기준은 ‘점검 › 추세 유지 보정’에서 바꿔요.", " 실제와 나란히 보려면 2 결과 탭 맨 위에서 ‘둘 다 비교’를 골라요.")
h = h.replace("추세 보정이 꺼져 있어요 (점검 › 추세 유지 보정).", "추세 보정이 꺼져 있어요.")
