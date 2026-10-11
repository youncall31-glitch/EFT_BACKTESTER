"""Build monthly total-return series for the backtester.

Per ETF:  [extension proxy] -> [inception partial year proxy] -> [ETF-era proxy benchmarked to
actual calendar-year TR] -> [actual monthly TR (ChartRow), 2017+, benchmarked to actual annual TR]
"""
import json, sys
import numpy as np, pandas as pd
from scipy.optimize import brentq
sys.path.insert(0, '.')
from trr_load import load_trr

P = lambda s: pd.Period(s, 'M')
REPO = '/tmp/claude-0/-home-claude/e428d1a5-5da7-5c16-ad9d-33b6f0e12c13/scratchpad/repos'
END = P('2026-09')
FIRST = P('1972-01')
CR_START = P('2017-01')

B = pd.read_pickle('series/base.pkl')
CR = pd.read_pickle('series/cr.pkl')
TRR = load_trr()

# ChartRow pages for TLT (as of Sep 2) and EFA (as of Sep 4) were stale: back out Sep-2026 from the
# actual 2026 YTD total return (TotalRealReturns, through ~Oct 5-6) and an estimate of Oct 1-5.
def backout_sep(t, ytd, oct_mtd):
    s = CR[t]
    jan_aug = np.prod([1 + s[pd.Period(f'2026-{m:02d}', 'M')] for m in range(1, 9)])
    sep = (1 + ytd) / (jan_aug * (1 + oct_mtd)) - 1
    CR[t] = pd.concat([s, pd.Series({pd.Period('2026-09', 'M'): sep})]).sort_index()
    print(f'  {t} Sep-2026 backed out: {sep*100:.2f}%')
backout_sep('TLT', TRR['TLT'][2026], 2.2 * CR['IEF'].get(pd.Period('2026-10', 'M'), -0.001))
backout_sep('EFA', TRR['EFA'][2026], 0.007)

def mser(d):
    s = pd.Series(d).sort_index()
    s.index = pd.PeriodIndex(s.index, freq='M')
    return s

# ---------------- base series ----------------
sc = pd.read_csv(f'{REPO}/SteelCerberus_us-market-data/data/us_market_data.csv', parse_dates=['Date']).set_index('Date')
def m_ret(level):
    m = level.groupby(level.index.to_period('M')).last()
    return m.pct_change().dropna()
LASTSC = P('2025-11')
spx_tr = m_ret(sc['Adjusted Close']); spx_tr = spx_tr[spx_tr.index <= LASTSC]
spx_pr = m_ret(sc['Close']); spx_pr = spx_pr[spx_pr.index <= LASTSC]
spx_div = (spx_tr - spx_pr)  # monthly dividend contribution (net of SPY-like fee)
rf = m_ret(sc['Risk Free Return']); rf = rf[rf.index <= LASTSC]
# extend RF with BIL (ChartRow) + BIL fee
bil = CR['BIL']
ext = {p: bil[p] + 0.001356/12 for p in bil.index if p > LASTSC}
rf = pd.concat([rf, mser(ext)]).sort_index()
assert rf.index[-1] >= END, rf.index[-1]
rf = rf[rf.index <= END]

# daily series for leveraged sims
sc_d_tr = sc['Adjusted Close'].pct_change().dropna()
sc_d_rf = sc['Risk Free Return'].pct_change().dropna()
fut = B['fut']; dfut = B['daily']

yc = json.load(open(f'{REPO}/yieldchaser_etf-data/docs/data/market_returns.json'))
def yc_ret(key):
    s = mser({a: b for a, b in yc['assets'][key]['monthly']})
    full = pd.period_range(s.index[0], s.index[-1], freq='M')
    s = s.reindex(full).interpolate()
    return s.pct_change().dropna()
ndx_pr = yc_ret('nasdaq100')
djia_pr = yc_ret('djia')
eem_px = yc_ret('msci_em')
wti = yc_ret('wti_crude')

def futtr(name):
    er = fut[name].copy()
    if name == 'MSCIEAFA':  # glitch in Jan 2010 (bad print, reverses next day)
        er = er[er.index > P('2010-01')]
    c = er.index.intersection(rf.index)
    return (1 + er[c]) * (1 + rf[c]) - 1

def clip(s, a=None, b=None):
    if a is not None: s = s[s.index >= P(a) if isinstance(a, str) else s.index >= a]
    if b is not None: s = s[s.index <= P(b) if isinstance(b, str) else s.index <= b]
    return s

def beta(base, b):
    c = base.index.intersection(rf.index)
    return rf[c] + b * (base[c] - rf[c])

def blend(*pairs):
    idx = None
    for w, s in pairs:
        idx = s.index if idx is None else idx.intersection(s.index)
    return sum(w * s[idx] for w, s in pairs)

def cat(*parts):
    out = pd.concat(parts)
    out = out[~out.index.duplicated(keep='last')].sort_index()
    return out

# monthly variance of S&P daily returns (for leveraged approximations)
sc_var = (sc_d_tr ** 2).groupby(sc_d_tr.index.to_period('M')).sum()

# ---------------- shapes ----------------
NDXtr = ndx_pr + 0.005 / 12                       # NDX price + ~0.5%/yr dividends
SPX = spx_tr
us2, us5, us10, us20, us30 = (futtr(n) for n in ['US2', 'US5', 'US10', 'US20', 'US30'])
TLT_shape = cat(clip(us20, None, '2010-03'), clip(us30, '2010-04'))
IEF_shape = us10
SHY_shape = cat(clip(beta(us10, 0.30), None, '1989-06'), clip(beta(us5, 0.45), '1989-07', '2000-03'), clip(us2, '2000-04'))
HY = futtr('HIGHYIELD')
GOLD = futtr('GOLD'); SILVER = futtr('SILVER'); BCOM = futtr('BBCOMM')
EAFE_f = futtr('MSCIEAFA'); R2K_f = futtr('RUSSELL'); REIT_f = futtr('US-REALESTATE')

# leveraged daily sims
def lev_daily(r_idx_d, rf_d, L, fee):
    c = r_idx_d.index.intersection(rf_d.index)
    r = L * r_idx_d[c] - (L - 1) * rf_d[c] - fee / 252
    return (1 + r).groupby(r.index.to_period('M')).prod() - 1

UPRO_sim = clip(lev_daily(sc_d_tr, sc_d_rf, 3, 0.0091 - 0.000945 * 3 + 0.015), None, LASTSC)  # +1.5%/yr swap spread (calibrated 2011-24)
def lev_monthly(r_m, var_m, L, fee):
    c = r_m.index.intersection(var_m.index).intersection(rf.index)
    lr = L * np.log1p(r_m[c]) - (L * L - L) / 2 * var_m[c] - (L - 1) * np.log1p(rf[c]) - fee / 12
    return np.expm1(lr)
# Nasdaq-100 monthly realized variance: Nasdaq futures daily data 2000-2016 (validated vs QLD/TQQQ),
# otherwise S&P 500 daily variance scaled by the typical NDX/SPX volatility ratio (1.8 in 1985-99).
nqd = dfut['NASDAQ']
nq_var = (nqd ** 2).groupby(nqd.index.to_period('M')).sum()
ndx_var = sc_var * 1.3 ** 2
ndx_var[ndx_var.index <= P('1999-12')] = sc_var[sc_var.index <= P('1999-12')] * 1.8 ** 2
use = nq_var[(nq_var.index >= P('2000-01')) & (nq_var.index <= P('2016-12'))]
ndx_var.loc[use.index] = use
TQQQ_shape = lev_monthly(NDXtr, ndx_var, 3, 0.0095)

# ---------------- benchmarking ----------------
def bench_year(r, target):
    f = lambda d: np.prod(1 + r + d) - (1 + target)
    try:
        d = brentq(f, -0.3, 0.3)
    except ValueError:
        return r
    return r + d

def build(t, shape, inception, fee, ext_from=None, trr=None, cr=None, alias_of=None):
    """Return (series, labels)."""
    trr = TRR.get(t, {}) if trr is None else trr
    cr = CR.get(t) if cr is None else cr
    inc = pd.Timestamp(inception)
    inc_m = P(inc.strftime('%Y-%m'))
    first_full_year = inc.year + (1 if (inc.month > 1 or inc.day > 7) else 0)
    out = {}; lab = {}
    shape = shape.copy()
    # --- actual monthly (ChartRow) 2017+
    if cr is not None:
        a = cr[(cr.index >= max(CR_START, inc_m + 1)) & (cr.index <= END)]
        for y in sorted(set(a.index.year)):
            seg = a[a.index.year == y]
            if y in trr and len(seg) == 12 and y <= 2025:
                seg = bench_year(seg, trr[y])
            for p, v in seg.items():
                out[p] = v; lab[p] = 'A'
    cr_first = min(out) if out else END + 1
    # --- ETF-era proxy benchmarked to actual annual TR
    for y in range(first_full_year, cr_first.year + (0 if cr_first.month == 1 else 1)):
        months = [p for p in pd.period_range(P(f'{y}-01'), P(f'{y}-12'), freq='M') if p < cr_first and p >= inc_m + 1]
        seg = shape.reindex(months)
        if seg.isna().any():
            continue
        if y in trr and len(months) == 12:
            seg = bench_year(seg.values, trr[y]); seg = pd.Series(seg, index=months); L = 'B'
        elif y in trr and months:  # partial year at the junction with actual data (e.g. 2016 Jan..Oct)
            done = np.prod([1 + out[p] for p in out if p.year == y])
            tgt = (1 + trr[y]) / done - 1
            seg = pd.Series(bench_year(seg.values, tgt), index=months); L = 'B'
        else:
            seg = seg - fee / 12; L = 'S'
        for p, v in seg.items():
            if p not in out: out[p] = v; lab[p] = L
    # --- inception partial year: proxy (benchmarked if stub small)
    months = [p for p in pd.period_range(inc_m + 1, P(f'{first_full_year - 1}-12'), freq='M') if p not in out] if first_full_year > inc.year else []
    if months:
        seg = shape.reindex(months)
        if not seg.isna().any():
            if inc.year in trr and inc.day >= 20:
                seg = pd.Series(bench_year(seg.values, trr[inc.year]), index=months); L = 'B'
            else:
                seg = seg - fee / 12; L = 'S'
            for p, v in seg.items(): out[p] = v; lab[p] = L
    # --- pre-inception extension
    if ext_from is not None:
        months = [p for p in pd.period_range(max(P(ext_from), FIRST), inc_m, freq='M') if p not in out]
        seg = shape.reindex(months).dropna()
        for p, v in seg.items(): out[p] = v - fee / 12; lab[p] = 'P'
    s = pd.Series(out).sort_index(); s.index = pd.PeriodIndex(s.index, freq='M')
    l = pd.Series(lab).sort_index(); l.index = pd.PeriodIndex(l.index, freq='M')
    # keep only the contiguous block ending at the latest month
    full = pd.period_range(s.index[0], s.index[-1], freq='M')
    missing = full.difference(s.index)
    if len(missing):
        cut = missing.max() + 1
        print(f'  {t}: gap before {cut} (dropping {len(s[s.index < cut])} months)')
        s = s[s.index >= cut]; l = l[l.index >= cut]
    return s, l

SER = {}; LAB = {}; META = {}

def add(t, *args, **kw):
    meta = kw.pop('meta')
    meta['inception'] = args[1]; meta['fee'] = args[2]
    s, l = build(t, *args, **kw)
    SER[t] = s; LAB[t] = l; META[t] = meta

def alias(t, base, fee_diff, inception, meta):
    meta['inception'] = inception; meta['fee'] = META[base]['fee'] - fee_diff; meta['twin'] = base
    s = SER[base] + fee_diff / 12
    l = LAB[base].copy()
    inc_m = P(pd.Timestamp(inception).strftime('%Y-%m'))
    l[l.index <= inc_m] = 'P'
    l[(l.index > inc_m) & (l == 'A')] = 'X'   # twin's actual data, fee-adjusted
    l[(l.index > inc_m) & (l == 'B')] = 'X'
    SER[t] = s; LAB[t] = l; META[t] = meta

# ---- US equity
add('SPY', SPX, '1993-01-29', 0.000945, ext_from='1972-01', meta=dict(name='SPDR S&P 500 ETF', cls='미국 대형주 (S&P 500)', ext='S&P 500 총수익 지수'))
alias('VOO', 'SPY', 0.000945 - 0.0003, '2010-09-07', dict(name='Vanguard S&P 500 ETF', cls='미국 대형주 (S&P 500)', ext='SPY 데이터 + 보수 차이'))
alias('IVV', 'SPY', 0.000945 - 0.0003, '2000-05-15', dict(name='iShares Core S&P 500 ETF', cls='미국 대형주 (S&P 500)', ext='SPY 데이터 + 보수 차이'))
alias('SPLG', 'SPY', 0.000945 - 0.0002, '2005-11-08', dict(name='SPDR Portfolio S&P 500 ETF', cls='미국 대형주 (S&P 500)', ext='SPY 데이터 + 보수 차이'))
add('VTI', SPX, '2001-05-31', 0.0003, ext_from='1972-01', meta=dict(name='Vanguard Total Stock Market ETF', cls='미국 전체 주식', ext='S&P 500 총수익 지수 (대용)'))
QQQ_shape = cat(clip(NDXtr, None, '1999-12'), clip(futtr('NASDAQ'), '2000-01'))
add('QQQ', QQQ_shape, '1999-03-10', 0.0020, ext_from='1985-11', meta=dict(name='Invesco QQQ Trust', cls='나스닥 100', ext='나스닥100 지수(가격+추정배당), 이후 나스닥100 선물'))
alias('QQQM', 'QQQ', 0.0005, '2020-10-13', dict(name='Invesco NASDAQ 100 ETF', cls='나스닥 100', ext='QQQ 데이터 + 보수 차이'))
DIA_shape = blend((1, djia_pr), (1, spx_div))
add('DIA', DIA_shape, '1998-01-20', 0.0016, ext_from='1972-01', meta=dict(name='SPDR Dow Jones Industrial Average ETF', cls='다우존스 30', ext='다우존스 지수(가격) + S&P500 배당률'))
IWM_shape = cat(clip(beta(SPX, 1.25), None, '2015-03'), clip(R2K_f, '2015-04'))
add('IWM', IWM_shape, '2000-05-26', 0.0019, meta=dict(name='iShares Russell 2000 ETF', cls='미국 소형주', ext=None))
add('SCHD', beta(SPX, 0.9), '2011-10-20', 0.0006, meta=dict(name='Schwab U.S. Dividend Equity ETF', cls='미국 배당주', ext=None))
add('VIG', beta(SPX, 0.9), '2006-04-27', 0.0005, meta=dict(name='Vanguard Dividend Appreciation ETF', cls='미국 배당성장주', ext=None))
add('VYM', beta(SPX, 0.9), '2006-11-16', 0.0006, meta=dict(name='Vanguard High Dividend Yield ETF', cls='미국 고배당주', ext=None))
GROW = blend((0.5, SPX), (0.5, NDXtr))
add('VUG', GROW, '2004-01-30', 0.0004, meta=dict(name='Vanguard Growth ETF', cls='미국 대형 성장주', ext=None))
add('VTV', beta(SPX, 0.95), '2004-01-30', 0.0004, meta=dict(name='Vanguard Value ETF', cls='미국 대형 가치주', ext=None))
add('SCHG', GROW, '2010-09-09', 0.0004, meta=dict(name='Schwab U.S. Large-Cap Growth ETF', cls='미국 대형 성장주', ext=None))
add('XLK', NDXtr, '1998-12-22', 0.0008, meta=dict(name='Technology Select Sector SPDR', cls='미국 기술 섹터', ext=None))
add('XLE', blend((0.7, SPX), (0.3, wti)), '1998-12-22', 0.0008, meta=dict(name='Energy Select Sector SPDR', cls='미국 에너지 섹터', ext=None))
add('XLF', beta(SPX, 1.2), '1998-12-22', 0.0008, meta=dict(name='Financial Select Sector SPDR', cls='미국 금융 섹터', ext=None))
add('XLV', beta(SPX, 0.75), '1998-12-22', 0.0008, meta=dict(name='Health Care Select Sector SPDR', cls='미국 헬스케어 섹터', ext=None))
SEMI = beta(NDXtr, 1.5)
add('SOXX', SEMI, '2001-07-13', 0.0035, meta=dict(name='iShares Semiconductor ETF', cls='반도체', ext=None))
add('SMH', SEMI, '2000-06-05', 0.0035, meta=dict(name='VanEck Semiconductor ETF', cls='반도체', ext=None))
add('ARKK', beta(NDXtr, 1.5), '2014-10-31', 0.0075, meta=dict(name='ARK Innovation ETF', cls='혁신 성장주(액티브)', ext=None))
add('JEPI', pd.Series(dtype=float), '2020-05-20', 0.0035, meta=dict(name='JPMorgan Equity Premium Income ETF', cls='커버드콜(S&P)', ext=None))
add('JEPQ', pd.Series(dtype=float), '2022-12-25', 0.0035, meta=dict(name='JPMorgan Nasdaq Equity Premium Income ETF', cls='커버드콜(나스닥)', ext=None))
# ---- leveraged
add('UPRO', UPRO_sim, '2009-06-25', 0.0091, ext_from='1972-01', meta=dict(name='ProShares UltraPro S&P500 (3x)', cls='레버리지 3배 S&P 500', ext='S&P 500 일간 3배 시뮬레이션'))
add('TQQQ', TQQQ_shape, '2010-02-11', 0.0084, ext_from='1985-11', meta=dict(name='ProShares UltraPro QQQ (3x)', cls='레버리지 3배 나스닥100', ext='나스닥100 일간 3배 시뮬레이션(2000~), 이전은 월간 근사'))
SOXX_tmp = SER['SOXX']
soxl_shape = lev_monthly(SOXX_tmp, sc_var * 2.0 ** 2, 3, 0.0075)
add('SOXL', soxl_shape, '2010-03-11', 0.0075, meta=dict(name='Direxion Daily Semiconductor Bull 3x', cls='레버리지 3배 반도체', ext=None))
# ---- international
EAFE_shape = cat(clip(beta(SPX, 1.0), None, '2003-04'), clip(blend((0.5, SPX), (0.5, eem_px)), '2003-05', '2010-01'), clip(EAFE_f, '2010-02'))
add('EFA', EAFE_shape, '2001-08-17', 0.0033, meta=dict(name='iShares MSCI EAFE ETF', cls='선진국 주식(미국 제외)', ext=None))
add('VEA', SER['EFA'] + (0.0033 - 0.0003) / 12, '2007-07-26', 0.0003, ext_from='2001-09', meta=dict(name='Vanguard FTSE Developed Markets ETF', cls='선진국 주식(미국 제외)', ext='EFA 데이터'))
add('EEM', eem_px, '2003-04-11', 0.0070, meta=dict(name='iShares MSCI Emerging Markets ETF', cls='신흥국 주식', ext=None))
add('VWO', SER['EEM'] + (0.0070 - 0.0007) / 12, '2005-03-10', 0.0007, ext_from='2003-05', meta=dict(name='Vanguard FTSE Emerging Markets ETF', cls='신흥국 주식', ext='EEM 데이터'))
XUS = blend((0.78, SER['EFA']), (0.22, SER['EEM']))
add('VXUS', XUS, '2011-01-28', 0.0005, ext_from='2003-05', meta=dict(name='Vanguard Total International Stock ETF', cls='미국 제외 전세계 주식', ext='EFA·EEM 혼합'))
add('VT', blend((0.55, SER['SPY']), (0.45, XUS)), '2008-06-26', 0.0006, ext_from='2003-05', meta=dict(name='Vanguard Total World Stock ETF', cls='전세계 주식', ext='SPY·EFA·EEM 혼합'))
EWY_shape = cat(clip(beta(SPX, 1.5), None, '2003-04'), clip(beta(eem_px, 1.3), '2003-05'))
add('EWY', EWY_shape, '2000-05-12', 0.0059, meta=dict(name='iShares MSCI South Korea ETF', cls='한국 주식', ext=None))
# ---- bonds / cash
add('TLT', TLT_shape, '2002-07-26', 0.0015, ext_from='1978-08', meta=dict(name='iShares 20+ Year Treasury Bond ETF', cls='미국 장기 국채', ext='미 국채 선물(T-Bond/Ultra) + T-bill'))
add('IEF', IEF_shape, '2002-07-26', 0.0015, ext_from='1982-10', meta=dict(name='iShares 7-10 Year Treasury Bond ETF', cls='미국 중기 국채', ext='미 10년 국채 선물 + T-bill'))
add('SHY', SHY_shape, '2002-07-26', 0.0015, ext_from='1982-10', meta=dict(name='iShares 1-3 Year Treasury Bond ETF', cls='미국 단기 국채', ext='미 2·5년 국채 선물 + T-bill'))
add('BIL', rf, '2007-05-30', 0.001356, ext_from='1972-01', meta=dict(name='SPDR Bloomberg 1-3 Month T-Bill ETF', cls='현금성(초단기 국채)', ext='미 국채 3개월물 수익률'))
alias('SGOV', 'BIL', 0.001356 - 0.0009, '2020-05-26', dict(name='iShares 0-3 Month Treasury Bond ETF', cls='현금성(초단기 국채)', ext='BIL 데이터 + 보수 차이'))
AGG_shape = blend((0.7, IEF_shape), (0.3, SHY_shape))
add('AGG', AGG_shape, '2003-09-29', 0.0003, ext_from='1982-10', cr=CR['BND'], meta=dict(name='iShares Core U.S. Aggregate Bond ETF', cls='미국 종합 채권', ext='미 국채 선물 혼합(대용)'))
add('BND', SER['AGG'], '2007-04-10', 0.0003, ext_from='1982-10', meta=dict(name='Vanguard Total Bond Market ETF', cls='미국 종합 채권', ext='AGG 데이터'))
LQD_shape = cat(clip(IEF_shape, None, '2000-10'), clip(blend((0.6, IEF_shape), (0.4, HY)), '2000-11'))
add('LQD', LQD_shape, '2002-07-26', 0.0014, meta=dict(name='iShares iBoxx $ Investment Grade Corporate Bond ETF', cls='미국 투자등급 회사채', ext=None))
add('HYG', HY, '2007-04-11', 0.0049, ext_from='2000-11', meta=dict(name='iShares iBoxx $ High Yield Corporate Bond ETF', cls='미국 하이일드 채권', ext='iBoxx 하이일드 지수 선물'))
add('TIP', beta(IEF_shape, 0.8), '2003-12-05', 0.0018, meta=dict(name='iShares TIPS Bond ETF', cls='미국 물가연동채', ext=None))
# ---- real assets
add('GLD', GOLD, '2004-11-18', 0.0040, ext_from='1975-05', meta=dict(name='SPDR Gold Shares', cls='금', ext='금 선물 + T-bill (≈ 금 현물)'))
alias('IAU', 'GLD', 0.0015, '2005-01-28', dict(name='iShares Gold Trust', cls='금', ext='GLD 데이터 + 보수 차이'))
alias('GLDM', 'GLD', 0.0030, '2018-06-25', dict(name='SPDR Gold MiniShares', cls='금', ext='GLD 데이터 + 보수 차이'))
add('SLV', SILVER, '2006-04-28', 0.0050, ext_from='1972-01', meta=dict(name='iShares Silver Trust', cls='은', ext='은 선물 + T-bill'))
add('DBC', BCOM, '2006-02-03', 0.0085, meta=dict(name='Invesco DB Commodity Index Tracking', cls='원자재', ext=None))
VNQ_shape = cat(clip(beta(SPX, 1.3), None, '2014-06'), clip(REIT_f, '2014-07'))
add('VNQ', VNQ_shape, '2004-09-29', 0.0013, meta=dict(name='Vanguard Real Estate ETF', cls='미국 리츠(부동산)', ext=None))

pd.to_pickle({'SER': SER, 'LAB': LAB, 'META': META, 'RF': rf}, 'series/final.pkl')
for t in SER:
    s = SER[t]; l = LAB[t]
    cnt = l.value_counts().to_dict()
    print(f'{t:5s} {s.index[0]}..{s.index[-1]} n={len(s)} {cnt}')
