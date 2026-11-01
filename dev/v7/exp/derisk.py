import json, re, math
h = open('/home/claude/v7/v6_original.html').read()
D = json.loads(re.search(r'id="etf-data">(.*?)</script>', h, re.S).group(1))
NM = (int(D['end'][:4]) - 1972) * 12 + int(D['end'][5:7])
def ser(t):
    a = D['assets'][t]; out = [None] * NM
    for i, x in enumerate(a['r']): out[a['s'] + i] = x / 1e6
    return out
R = {t: ser(t) for t in ['SPY', 'IEF', 'QQQ', 'TLT', 'GLD', 'BIL']}
cpi = [0.0] * NM
for i, x in enumerate(D['cpi']['r']): cpi[D['cpi']['s'] + i] = x / 1e6
idx = lambda y, m: (y - 1972) * 12 + m - 1
S0, S1 = idx(1986, 1), NM - 1

def run(base, defn, attack, trig=None, rule=None, i0=S0, i1=S1, lev=None):
    """base/defn: target weights. trig: drawdown (e.g. 0.15) that switches to defn. rule: how to switch back.
       decisions at month end, applied from next month. annual rebalance in December."""
    tk = sorted(set(base) | set(defn)); h = {t: base.get(t, 0) for t in tk}; v = 1.0; peak = 1.0; mode = 'base'
    vals = [1.0]; switches = 0; t_def = 0; lowp = None; trough = None
    # attack-asset price index for trend rule
    px = {t: 1.0 for t in tk}; hist = {t: [] for t in tk}
    for m in range(i0, i1 + 1):
        tot = 0
        for t in tk: h[t] *= 1 + R[t][m]; tot += h[t]
        for t in tk: px[t] *= 1 + R[t][m]; hist[t].append(px[t])
        v = tot; vals.append(v)
        if v > peak: peak = v
        dd = v / peak - 1
        new = mode
        if mode == 'base' and trig is not None and dd <= -trig: new = 'def'; t_def = 0; trough = v
        elif mode == 'def':
            t_def += 1; trough = min(trough, v)
            a = attack; ph = hist[a]
            if rule == 'recover' and dd >= -0.05: new = 'base'
            elif rule == 'halfway' and v >= trough + (peak - trough) * 0.5: new = 'base'
            elif rule == 'sma10' and len(ph) >= 10 and ph[-1] > sum(ph[-10:]) / 10: new = 'base'
            elif rule == 'rebound20' and v >= trough * 1.10: new = 'base'
            elif rule == 'time12' and t_def >= 12: new = 'base'
            elif rule == 'never': pass
        reb = (m % 12 == 11)
        if new != mode: mode = new; switches += 1; reb = True
        if reb:
            tgt = base if mode == 'base' else defn
            for t in tk: h[t] = v * tgt.get(t, 0)
    n = len(vals) - 1
    cagr = vals[-1] ** (12 / n) - 1
    pk = vals[0]; mdd = 0; uw = 0; under = 0; pki = 0
    for i, x in enumerate(vals):
        if x >= pk: pk = x; pki = i
        else: mdd = min(mdd, x / pk - 1); uw = max(uw, i - pki)
    return cagr, mdd, uw, switches

def trend_only(base, defn, attack, i0=S0, i1=S1):
    # classic 10-month moving-average rule on the attack asset, no drawdown trigger
    tk = sorted(set(base) | set(defn)); h = {t: base.get(t, 0) for t in tk}; v = 1; vals = [1]; mode = 'base'; px = 1; hist = []; sw = 0
    for m in range(i0, i1 + 1):
        tot = 0
        for t in tk: h[t] *= 1 + R[t][m]; tot += h[t]
        px *= 1 + R[attack][m]; hist.append(px); v = tot; vals.append(v)
        new = mode
        if len(hist) >= 10:
            sma = sum(hist[-10:]) / 10
            new = 'base' if px > sma else 'def'
        reb = m % 12 == 11
        if new != mode: mode = new; sw += 1; reb = True
        if reb:
            tgt = base if mode == 'base' else defn
            for t in tk: h[t] = v * tgt.get(t, 0)
    n = len(vals) - 1; cagr = vals[-1] ** (12 / n) - 1
    pk = vals[0]; mdd = 0; uw = 0; pki = 0
    for i, x in enumerate(vals):
        if x >= pk: pk = x; pki = i
        else: mdd = min(mdd, x / pk - 1); uw = max(uw, i - pki)
    return cagr, mdd, uw, sw

ports = {
  '60/40 (SPY·IEF)': ({'SPY': .6, 'IEF': .4}, {'SPY': .3, 'IEF': .4, 'BIL': .3}, 'SPY'),
  '80/20 (SPY·IEF)': ({'SPY': .8, 'IEF': .2}, {'SPY': .4, 'IEF': .3, 'BIL': .3}, 'SPY'),
  'QQQ40·TLT30·GLD30': ({'QQQ': .4, 'TLT': .3, 'GLD': .3}, {'QQQ': .2, 'TLT': .3, 'GLD': .3, 'BIL': .2}, 'QQQ'),
}
for name, (b, d, a) in ports.items():
    print('==', name, '공격 비중 절반을 현금·채권으로')
    c, m, u, s = run(b, d, a); print(f'  그대로 보유            CAGR {c*100:5.2f}%  MDD {m*100:6.1f}%  최장회복 {u:3d}개월')
    for trig in [0.10, 0.15, 0.20]:
        for rule, rn in [('recover', '고점 −5% 회복'), ('halfway', '낙폭 절반 회복'), ('rebound20', '저점 대비 +10%'), ('sma10', '10개월 이동평균 위'), ('time12', '12개월 뒤')]:
            c, m, u, s = run(b, d, a, trig, rule)
            print(f'  −{int(trig*100)}%에 줄임 → {rn:12s} CAGR {c*100:5.2f}%  MDD {m*100:6.1f}%  최장회복 {u:3d}개월  전환 {s}회')
    c, m, u, s = trend_only(b, d, a); print(f'  추세만(10개월 이평)      CAGR {c*100:5.2f}%  MDD {m*100:6.1f}%  최장회복 {u:3d}개월  전환 {s}회')
