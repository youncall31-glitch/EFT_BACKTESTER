import json, re, itertools, numpy as np
h = open('/home/claude/v7/v6_original.html').read()
D = json.loads(re.search(r'id="etf-data">(.*?)</script>', h, re.S).group(1))
NM = (int(D['end'][:4]) - 1972) * 12 + int(D['end'][5:7])
def ser(t):
    a = D['assets'][t]; out = np.full(NM, np.nan)
    out[a['s']:a['s'] + len(a['r'])] = np.array(a['r']) / 1e6; return out
T = ['SPY', 'QQQ', 'IEF', 'TLT', 'GLD', 'BIL']
cpi = np.zeros(NM); c = D['cpi']; cpi[c['s']:c['s'] + len(c['r'])] = np.array(c['r']) / 1e6
s0 = (1986 - 1972) * 12
R = np.stack([(1 + ser(t)[s0:]) / (1 + cpi[s0:]) - 1 for t in T])   # real monthly returns
n = R.shape[1]
combos = [w for w in itertools.product(range(11), repeat=6) if sum(w) == 10]
H = 360; starts = np.arange(0, n - H + 1)
rows = []
for w in combos:
    wv = np.array(w) / 10
    r = wv @ R                                  # monthly rebalanced
    v = np.cumprod(1 + r); v = np.concatenate([[1], v])
    pk = np.maximum.accumulate(v); dd = v / pk - 1
    mdd = dd.min(); ulcer = np.sqrt((dd ** 2).mean())
    # longest underwater
    uw = 0; cur = 0
    for x in dd[1:]:
        cur = cur + 1 if x < 0 else 0; uw = max(uw, cur)
    cagr = v[-1] ** (12 / n) - 1
    # 30-year withdrawals of 4.5% of the start (real), every start month in parallel
    W = np.ones(len(starts)); dead = np.zeros(len(starts), bool); low = np.ones(len(starts))
    for t in range(H):
        W = W - 0.045 / 12; dead |= W <= 0; W = np.where(dead, 0, W * (1 + r[starts + t])); low = np.minimum(low, W)
    rows.append((w, cagr, mdd, uw, ulcer, (~dead).mean(), np.median(W), W.min(), low.min()))
A = np.array([[r[1], r[2], r[3], r[4], r[5], r[6], r[7]] for r in rows])
from scipy.stats import spearmanr
cagr, mdd, uw, ulc, succ, medW, minW = A.T
print('combos', len(rows), 'starts', len(starts))
for nm, x in [('CAGR', cagr), ('MDD(깊이, 얕을수록 +)', mdd), ('최장 회복(짧을수록 +)', -uw), ('울서 지수(낮을수록 +)', -ulc)]:
    print(f'{nm:24s} vs 성공률 ρ={spearmanr(x, succ)[0]:.2f}  vs 최악 잔액 ρ={spearmanr(x, minW)[0]:.2f}  vs 중앙 잔액 ρ={spearmanr(x, medW)[0]:.2f}')
# same MDD band: does recovery time still separate outcomes?
for lo, hi in [(-0.20, -0.15), (-0.25, -0.20), (-0.30, -0.25)]:
    m = (mdd >= lo) & (mdd < hi)
    if m.sum() < 20: continue
    q = np.median(uw[m])
    a, b = m & (uw <= q), m & (uw > q)
    print(f'MDD {int(-hi*100)}~{int(-lo*100)}% ({m.sum()}개): 회복 짧은 절반 성공률 {succ[a].mean():.0%} 최악잔액 {minW[a].mean():.2f} | 긴 절반 성공률 {succ[b].mean():.0%} 최악잔액 {minW[b].mean():.2f}  (회복 중앙 {q:.0f}개월)')
for lo, hi in [(30, 50), (50, 80), (80, 140)]:
    m = (uw >= lo) & (uw < hi)
    if m.sum() < 20: continue
    q = np.median(mdd[m]); a, b = m & (mdd >= q), m & (mdd < q)
    print(f'회복 {lo}~{hi}개월 ({m.sum()}개): MDD 얕은 절반 성공률 {succ[a].mean():.0%} 최악잔액 {minW[a].mean():.2f} | 깊은 절반 성공률 {succ[b].mean():.0%} 최악잔액 {minW[b].mean():.2f}')
