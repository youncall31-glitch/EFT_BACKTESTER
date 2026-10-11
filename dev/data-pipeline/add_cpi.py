# Add monthly CPI-U inflation (BLS CPI-U NSA, via datasets/cpi-us) to data.json, and fix JEPQ's inception date.
import json, numpy as np, pandas as pd
REPO = '/tmp/claude-0/-home-claude/e428d1a5-5da7-5c16-ad9d-33b6f0e12c13/scratchpad/repos'
c = pd.read_csv(f'{REPO}/datasets_cpi-us/data/cpiai.csv', parse_dates=['Date']).set_index('Date')['Index']
c.index = c.index.to_period('M')
full = pd.period_range(pd.Period('1971-12', 'M'), pd.Period('2026-09', 'M'), freq='M')
c = c.reindex(full)
est = []
# Oct 2025 was never published (US government shutdown): split Sep->Nov geometrically
p = pd.Period('2025-10', 'M')
if np.isnan(c[p]):
    c[p] = np.sqrt(c[p - 1] * c[p + 1]); est.append(str(p))
# Sep 2026 is not released yet: use the average monthly change of the last 12 months
p = pd.Period('2026-09', 'M')
if np.isnan(c[p]):
    last = c[pd.Period('2025-08', 'M'):pd.Period('2026-08', 'M')]
    g = (last.iloc[-1] / last.iloc[0]) ** (1 / 12)
    c[p] = c[p - 1] * g; est.append(str(p))
assert not c.isna().any(), c[c.isna()]
infl = (c / c.shift(1) - 1).iloc[1:]
D = json.load(open('data.json', encoding='utf-8'))
assert len(infl) == (2026 - 1972) * 12 + 9
D['cpi'] = dict(s=0, r=[int(round(v * 1e6)) for v in infl.values], est=est, src='BLS CPI-U (NSA)')
D['assets']['JEPQ']['inc'] = '2022-05-03'
json.dump(D, open('data.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('cpi months', len(infl), 'estimated', est, 'avg 1972-2026 %/yr', round(((c.iloc[-1] / c.iloc[0]) ** (12 / len(infl)) - 1) * 100, 2),
      '30y', round(((c.iloc[-1] / c[pd.Period('1996-09', 'M')]) ** (1 / 30) - 1) * 100, 2))
