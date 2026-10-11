"""Monthly income (distribution) returns per asset, aligned with data.json r arrays.

d[i] = cash distributions with ex-date in month i / value at the end of month i-1, so price return p = r - d.
Sources, per asset and period:
  'idx'  S&P 500 index dividends (SteelCerberus TR - PR), net of the fund fee
  'pay'  per-payment history (stockanalysis.com, about the last five years) on a price path rebuilt
         backwards from a recent quoted price through the fund's own total returns
  'lazy' calendar-year distribution yields on the year's starting price (lazyportfolioetf.com),
         spread evenly over the year's months through a price path rebuilt from the total return
  'mdl'  model (bond yields, blends of related funds, ratios to the S&P 500 yield)
  'cash' T-bill funds: all of the return is income
  'zero' no distributions (gold/silver trusts) or negligible and unrecorded (3x funds)
"""
import json, sys, csv, glob, os, re
import numpy as np, pandas as pd

W = os.path.dirname(os.path.abspath(__file__))
SP = os.path.dirname(W)
REPO = f'{SP}/repos'
data = json.load(open(f'{W}/data_v3.json'))       # data without income arrays (built 2026-10-07)
NM = (int(data['end'][:4]) - 1972) * 12 + int(data['end'][5:7])
I = lambda y, m: (y - 1972) * 12 + m - 1
YM = lambda i: (1972 + i // 12, i % 12 + 1)
A = data['assets']
VERB = '-v' in sys.argv

def ret(t):
    a = A[t]; r = np.full(NM, np.nan)
    r[a['s']:a['s'] + len(a['r'])] = np.array(a['r']) / 1e6
    return r
def rng(t):
    a = A[t]; return a['s'], a['s'] + len(a['r']) - 1
def era_start(t):  # first month after the pre-inception proxy
    a = A[t]; s = a['s']
    for sg in a['seg']:
        if sg[0] == 'P': s = max(s, sg[2] + 1)
    return s
FEE = {t: A[t]['fee'] / 100 for t in A}

# ---------- reference series ----------
sc = pd.read_csv(f'{REPO}/SteelCerberus_us-market-data/data/us_market_data.csv', parse_dates=['Date']).set_index('Date')
def mret(level):
    m = level.groupby(level.index.to_period('M')).last(); return m.pct_change()
spx = (mret(sc['Adjusted Close']) - mret(sc['Close']))   # SPY-style distributions (ex-dates Mar/Jun/Sep/Dec)
SPXD = np.full(NM, np.nan)
for p, v in spx.items():
    i = I(p.year, p.month)
    # index dividends (monthly) to Jan 1993, SPY's own distributions (net of its fee) after: add the fee back
    if 0 <= i < NM and p <= pd.Period('2025-12', 'M'): SPXD[i] = v + (0.000945 / 12 if i >= I(1993, 2) else 0)
for i in range(I(2026, 1), NM): SPXD[i] = SPXD[i - 12]                                  # 2026: same months as 2025

y10 = pd.read_csv(f'{REPO}/datasets_bond-yields-us-10y/data/monthly.csv', parse_dates=['Date'])
Y10 = np.full(NM, np.nan)
for d_, v in zip(y10['Date'], y10['Rate']):
    i = I(d_.year, d_.month)
    if 0 <= i < NM: Y10[i] = v / 100
for i in range(NM):
    if np.isnan(Y10[i]): Y10[i] = Y10[i - 1]
RF = np.zeros(NM)
RF[data['rf']['s']:data['rf']['s'] + len(data['rf']['r'])] = np.array(data['rf']['r']) / 1e6
TB = (1 + RF) ** 12 - 1                # T-bill yield, annualised
def trail(x, L):
    out = np.empty(NM)
    for i in range(NM): out[i] = np.mean(x[max(0, i - L + 1):i + 1])
    return out

# ---------- calendar-year yields (lazyportfolioetf) ----------
LAZY = {}
for f in glob.glob(f'{SP}/divdata/*.json'):
    j = json.load(open(f))
    if 'error' in j: continue
    LAZY[j['ticker']] = {int(k): v / 100 for k, v in j['yields'].items()}
# share-split artefacts (SCHD 3:1 and SCHG 4:1 in Oct 2024) and a doubled XLE 2019 value
for t, y in [('SCHD', 2024), ('SCHG', 2024), ('XLE', 2019)]:
    LAZY[t][y] = (LAZY[t][y - 1] + LAZY[t][y + 1]) / 2

def lazy_d(t, r, i0, i1, yields, out):
    """fill out[i0..i1] from calendar-year yields on a price path rebuilt from total returns"""
    inc = pd.Timestamp(A[t]['inc']); first = min(yields); P = 1.0
    y0, _ = YM(i0); y1, _ = YM(i1)
    for Y in range(y0, y1 + 1):
        ms = [i for i in range(max(i0, I(Y, 1)), min(i1, I(Y, 12)) + 1)]
        if not ms: continue
        if Y in yields:
            y = yields[Y]
            partial = (Y == first and inc.year == Y and (inc.month > 1 or inc.day > 7))
            k = len(ms) if partial else 12
        else:
            prev = [k_ for k_ in yields if k_ < Y]
            y = yields[max(prev)] if prev else yields[first]; k = 12
        D = y * P / k
        for i in ms:
            out[i] = D / P
            P = P * (1 + r[i]) - D
            assert P > 0, (t, i)
    return out

# ---------- per-payment histories (stockanalysis) ----------
PAY = {}
for f in glob.glob(f'{SP}/divpay/*.csv'):
    t = os.path.basename(f)[:-4]
    lines = open(f).read().strip().splitlines()
    m = re.search(r'price_anchor:\s*([\d.]+)\s+on\s+(\d{4}-\d{2}-\d{2})', lines[0])
    rows = [(l.split(',')[0], float(l.split(',')[1])) for l in lines[2:] if l.strip()]
    PAY[t] = (rows, float(m.group(1)), m.group(2))

def pay_d(t, r, i1, C, out):
    """amounts by ex-date month on a price path rebuilt backwards from the quoted price; fills out[C..i1]"""
    rows, anc, adate = PAY[t]
    end_date = '%04d-%02d-31' % YM(i1)
    D = np.zeros(NM); post = 0.0
    for d_, a in rows:
        i = I(int(d_[:4]), int(d_[5:7]))
        if i <= i1: D[i] += a
        elif d_ <= adate: post += a          # went ex after the data end but before the quote
    P = anc + post
    path = {}
    for i in range(i1, C - 1, -1):
        Pprev = (P + D[i]) / (1 + r[i])
        out[i] = D[i] / Pprev
        path[i] = P; P = Pprev
    return path

DS, SRC = {}, {}
def put(t, arr, segs):
    s, e = rng(t)
    a = np.full(NM, np.nan); a[s:e + 1] = np.clip(arr[s:e + 1], 0, None)
    assert not np.isnan(a[s:e + 1]).any(), (t, [i for i in range(s, e + 1) if np.isnan(a[i])][:5])
    DS[t] = a; SRC[t] = segs

def cov_start(t):
    """first month taken from the payment history. A calendar-year start keeps a year from mixing an evenly
    spread yearly yield with the actual (lumpy) payments of the same year."""
    if t == 'ARKK': return I(2017, 1)                          # page lists every distribution since 2017
    if t == 'JEPI': return I(2021, 10)                         # flat model before, so no overlap
    if t in ('SCHD', 'VYM', 'VUG', 'VTV'): return I(2024, 1)   # short histories (chartrow / stockscan)
    return I(2022, 1)

def lazy_then_pay(t, before=None):
    """lazy yields (or a given array) before the payment history, payments after"""
    s, e = rng(t); es = era_start(t); C = max(s, cov_start(t)) if t in PAY else e + 1
    arr = np.full(NM, np.nan) if before is None else before.copy()
    segs = []
    if t in LAZY and es < C:
        lazy_d(t, ret(t), es, min(C, e + 1) - 1, LAZY[t], arr); segs.append(['lazy', es, min(C, e + 1) - 1])
    if t in PAY: pay_d(t, ret(t), e, C, arr); segs.append(['pay', C, e])
    return arr, segs, C

# ---------- S&P 500 family ----------
s, e = rng('SPY')
arr = SPXD - FEE['SPY'] / 12
idx_arr = arr.copy()
C = cov_start('SPY'); pay_d('SPY', ret('SPY'), e, C, arr)
put('SPY', arr, [['idx', s, C - 1], ['pay', C, e]])
for t in ['VOO', 'IVV', 'SPLG']:
    put(t, DS['SPY'] + (FEE['SPY'] - FEE[t]) / 12, [['idx', s, C - 1], ['pay', C, e]])
t = 'VTI'; s, e = rng(t); es = era_start(t)
arr, segs, C = lazy_then_pay(t, SPXD - FEE[t] / 12); put(t, arr, [['idx', s, es - 1]] + segs)

# ---------- funds with yearly yields and/or payment histories ----------
for t in ['IWM', 'SCHD', 'VIG', 'VYM', 'VUG', 'VTV', 'SCHG', 'XLK', 'XLE', 'XLF', 'XLV', 'ARKK',
          'EFA', 'EEM', 'EWY', 'LQD', 'TIP', 'DBC', 'VNQ']:
    arr, segs, C = lazy_then_pay(t); put(t, arr, segs)
t = 'QQQ'; s, e = rng(t); es = era_start(t)
base = np.full(NM, np.nan); base[s:es] = (0.005 - FEE[t]) / 12       # proxy assumed ~0.5%/yr index dividends
arr, segs, C = lazy_then_pay(t, base); put(t, arr, [['mdl', s, es - 1]] + segs)
put('QQQM', DS['QQQ'] + (FEE['QQQ'] - FEE['QQQM']) / 12, [list(x) for x in SRC['QQQ']])

# ---------- bonds: yield models for pre-inception proxies, fitted on each fund's own yearly yields ----------
def fit(t, base, Ls=(1, 6, 12, 24, 36)):
    yrs = [Y for Y in LAZY[t] if 2004 <= Y <= 2021]
    best = None
    for L in Ls:
        b = trail(base, L)
        xs = np.array([np.mean(b[I(Y, 1):I(Y, 12) + 1]) for Y in yrs]); ys = np.array([LAZY[t][Y] for Y in yrs])
        a = np.median(ys - xs); err = np.sqrt(np.mean((ys - xs - a) ** 2))
        if best is None or err < best[2]: best = (L, a, err)
    return best
MODEL = {}
for t, base in [('TLT', Y10), ('IEF', Y10), ('SHY', TB), ('HYG', Y10)]:
    L, a, err = fit(t, base); MODEL[t] = (L, a)
    if VERB: print(f'  model {t}: trailing {L}m avg + {a*100:+.2f}%p  (rmse {err*100:.2f}%p)')
def mdl(t, base):
    L, a = MODEL[t]; return np.maximum(trail(base, L) + a, 0) / 12
for t, base in [('TLT', Y10), ('IEF', Y10), ('SHY', TB), ('HYG', Y10)]:
    s, e = rng(t); es = era_start(t)
    pre = np.full(NM, np.nan); pre[s:es] = mdl(t, base)[s:es]
    arr, segs, C = lazy_then_pay(t, pre)
    put(t, arr, ([['mdl', s, es - 1]] if es > s else []) + segs)
# AGG: proxy = 0.7 IEF + 0.3 SHY futures; 2008-2021 follows BND's yearly yields (same index), then its own payments
t = 'AGG'; s, e = rng(t); C = cov_start(t)
arr = np.full(NM, np.nan); arr[s:I(2008, 1)] = (0.7 * mdl('IEF', Y10) + 0.3 * mdl('SHY', TB))[s:I(2008, 1)]
lazy_d(t, ret(t), I(2008, 1), C - 1, {Y: v for Y, v in LAZY['BND'].items() if Y >= 2008}, arr)
pay_d(t, ret(t), e, C, arr)
put(t, arr, [['mdl', s, I(2007, 12)], ['lazy', I(2008, 1), C - 1], ['pay', C, e]])
t = 'BND'; s, e = rng(t); es = era_start(t)
pre = np.full(NM, np.nan); pre[s:es] = DS['AGG'][s:es] - FEE['BND'] / 12
arr, segs, C = lazy_then_pay(t, pre); put(t, arr, [['mdl', s, es - 1]] + segs)

# ---------- cash ----------
for t in ['BIL', 'SGOV']:
    put(t, np.maximum(ret(t), 0), [['cash', *rng(t)]])
# ---------- no distributions ----------
for t in ['GLD', 'IAU', 'GLDM', 'SLV']:
    put(t, np.zeros(NM), [['zero', *rng(t)]])
# 3x funds: distributions only in the recent payment history (none recorded before)
for t in ['UPRO', 'TQQQ', 'SOXL']:
    s, e = rng(t); C = max(s, cov_start(t))
    arr = np.zeros(NM); pay_d(t, ret(t), e, C, arr)
    put(t, arr, [['zero', s, C - 1], ['pay', C, e]])

# ---------- international ----------
t = 'VEA'; s, e = rng(t); es = era_start(t)
pre = np.full(NM, np.nan); pre[s:es] = DS['EFA'][s:es] + (FEE['EFA'] - FEE['VEA']) / 12
arr, segs, C = lazy_then_pay(t, pre); put(t, arr, [['mdl', s, es - 1]] + segs)
t = 'VWO'; s, e = rng(t); es = era_start(t)
pre = np.full(NM, np.nan); pre[s:es] = DS['EEM'][s:es] + (FEE['EEM'] - FEE['VWO']) / 12
arr, segs, C = lazy_then_pay(t, pre); put(t, arr, [['mdl', s, es - 1]] + segs)
xus = 0.78 * DS['EFA'] + 0.22 * DS['EEM']
xus_y = {Y: 0.78 * LAZY['VEA'][Y] + 0.22 * LAZY['VWO'][Y] for Y in range(2008, 2026)}
US = {2008: .43, 2009: .43, 2010: .44, 2011: .45, 2012: .47, 2013: .48, 2014: .50, 2015: .52, 2016: .53, 2017: .53,
      2018: .54, 2019: .55, 2020: .57, 2021: .60, 2022: .60, 2023: .61, 2024: .63, 2025: .64}
vt_y = {Y: US[Y] * LAZY['VTI'][Y] + (1 - US[Y]) * xus_y[Y] for Y in range(2008, 2026)}
for t, pre_arr, yy in [('VXUS', xus - FEE['VXUS'] / 12, xus_y), ('VT', 0.55 * DS['SPY'] + 0.45 * xus - FEE['VT'] / 12, vt_y)]:
    s, e = rng(t); es = era_start(t); C = cov_start(t)
    arr = pre_arr.copy()
    lazy_d(t, ret(t), es, C - 1, yy, arr); pay_d(t, ret(t), e, C, arr)
    put(t, arr, [['mdl', s, C - 1], ['pay', C, e]])

# ---------- funds with a payment history and a model before it ----------
t = 'JEPI'; s, e = rng(t)
# data end in Aug 2026: step the Oct 2 quote back over the Oct 1 ex-date and September (est. total return)
rows, anc, adate = PAY[t]
r_sep = 0.6 * ret('SPY')[I(2026, 9)] + 0.003
PAY[t] = (rows, (anc + 0.34134 + 0.37142) / (1 + r_sep) - 0.37142 - 0.34134, adate)  # anchor + post-end payouts
C = cov_start(t); arr = np.full(NM, np.nan); pay_d(t, ret(t), e, C, arr)
arr[s:C] = np.mean(arr[C:C + 2]); put(t, arr, [['mdl', s, C - 1], ['pay', C, e]])
t = 'JEPQ'; s, e = rng(t); arr = np.full(NM, np.nan); pay_d(t, ret(t), e, s, arr); put(t, arr, [['pay', s, e]])
t = 'DIA'; s, e = rng(t); es = era_start(t); C = cov_start(t)
arr = np.full(NM, np.nan)
arr[s:es] = SPXD[s:es] - FEE[t] / 12                  # the proxy itself used the S&P 500 dividend yield
arr[es:C] = 1.25 * SPXD[es:C] - FEE[t] / 12           # the Dow has paid ~1.2-1.5x the S&P 500 yield
pay_d(t, ret(t), e, C, arr)
put(t, arr, [['idx', s, es - 1], ['mdl', es, C - 1], ['pay', C, e]])
for t in ['SOXX', 'SMH']:
    s, e = rng(t); C = cov_start(t)
    arr = np.full(NM, np.nan); arr[s:C] = DS['XLK'][s:C] - (FEE[t] - FEE['XLK']) / 12   # tech-sector yields before
    pay_d(t, ret(t), e, C, arr); put(t, arr, [['mdl', s, C - 1], ['pay', C, e]])

missing = [t for t in A if t not in DS]
assert not missing, missing

# ---------- report ----------
def ann_y(t, Y, d=None):
    r = ret(t); d = DS[t] if d is None else d; P = 1.0; tot = 0
    for i in range(I(Y, 1), I(Y, 12) + 1):
        if np.isnan(r[i]) or np.isnan(d[i]): return None
        tot += d[i] * P; P = P * (1 + r[i] - d[i])
    return tot
if VERB:
    print('SPY idx vs pay:', ' '.join(f'{Y}:{ann_y("SPY", Y, idx_arr)*100:.2f}/{ann_y("SPY", Y)*100:.2f}' for Y in range(2022, 2026)))
    for t in A:
        ys = [Y for Y in (1985, 1995, 2005, 2015, 2020, 2021, 2022, 2023, 2024, 2025) if ann_y(t, Y) is not None]
        s, e = rng(t); r = ret(t)[s:e + 1]; d = DS[t][s:e + 1]
        n = len(r); tr = np.prod(1 + r) ** (12 / n) - 1; pr = np.prod(1 + r - d) ** (12 / n) - 1
        ttm = DS[t][e - 11:e + 1].sum()
        lz = ' lazy ' + ' '.join(f'{Y}:{LAZY[t][Y]*100:.2f}' for Y in (2022, 2023, 2024, 2025) if Y in LAZY.get(t, {})) if t in LAZY else ''
        print(f'{t:5s} TR {tr*100:5.2f} pr {pr*100:5.2f} ttm {ttm*100:5.2f} |', ' '.join(f'{Y%100:02d}:{ann_y(t, Y)*100:.2f}' for Y in ys), '|', lz, '|', ' '.join(f'{k}{YM(a)[0]%100:02d}-{YM(b)[0]%100:02d}' for k, a, b in SRC[t]))

if '-w' in sys.argv:
    for t in A:
        s, e = rng(t)
        A[t]['d'] = [int(round(x * 1e6)) for x in DS[t][s:e + 1]]
        A[t]['dsrc'] = [[k, a, b] for k, a, b in SRC[t]]
    data['div'] = {'labels': {'idx': 'S&P 500 지수 배당', 'pay': '실제 분배금 내역', 'lazy': '연도별 실제 분배율',
                              'mdl': '추정', 'cash': '수익 전부 분배(현금성)', 'zero': '분배 없음'}}
    json.dump(data, open(f'{W}/data.json', 'w'), separators=(',', ':'), ensure_ascii=False)
    print('written', os.path.getsize(f'{W}/data.json'))
