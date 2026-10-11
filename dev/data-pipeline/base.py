import pandas as pd, numpy as np, json, os
R='/tmp/claude-0/-home-claude/e428d1a5-5da7-5c16-ad9d-33b6f0e12c13/scratchpad/repos'
OUT='/tmp/claude-0/-home-claude/e428d1a5-5da7-5c16-ad9d-33b6f0e12c13/scratchpad/work/series'
os.makedirs(OUT, exist_ok=True)

def month_end_ratio(s):
    """daily level series -> monthly returns using last obs of each month"""
    m = s.groupby(s.index.to_period('M')).last()
    r = m.pct_change().dropna()
    return r

# --- SteelCerberus: S&P500 TR (SPY-like) and risk-free
sc = pd.read_csv(f'{R}/SteelCerberus_us-market-data/data/us_market_data.csv', parse_dates=['Date']).set_index('Date')
spx_tr = month_end_ratio(sc['Adjusted Close'])
rf = month_end_ratio(sc['Risk Free Return'])
# drop the incomplete last month (data ends 2025-12-19)
last_full = pd.Period('2025-11','M')
spx_tr = spx_tr[spx_tr.index<=last_full]; rf = rf[rf.index<=last_full]
print('SC spx_tr', spx_tr.index[0], spx_tr.index[-1], 'rf', rf.index[0], rf.index[-1])

# --- futures excess returns
def fut_er(name):
    adj = pd.read_csv(f'{R}/pst/data/futures/adjusted_prices_csv/{name}.csv', parse_dates=['DATETIME'])
    mp = pd.read_csv(f'{R}/pst/data/futures/multiple_prices_csv/{name}.csv', parse_dates=['DATETIME'])
    adj['d']=adj.DATETIME.dt.normalize(); mp['d']=mp.DATETIME.dt.normalize()
    a = adj.groupby('d')['price'].last()
    p = mp.groupby('d')['PRICE'].last()
    df = pd.concat([a.rename('adj'), p.rename('px')], axis=1).sort_index()
    df['px'] = df['px'].ffill()
    df = df.dropna(subset=['adj'])
    df['px'] = df['px'].ffill()
    dret = df['adj'].diff() / df['px'].shift(1)
    dret = dret.dropna()
    # guard against silly values
    bad = dret.abs()>0.25
    if bad.any(): print(name,'large daily moves', dret[bad].head())
    m = (1+dret).groupby(dret.index.to_period('M')).prod()-1
    # drop partial first and last month
    m = m.iloc[1:]
    last = df.index[-1]
    if last.day < 25: m = m.iloc[:-1]
    return m, dret

fut = {}
daily = {}
for n in ['SP500','NASDAQ','US2','US5','US10','US20','US30','GOLD','SILVER','BBCOMM','MSCIEAFA','RUSSELL','US-REALESTATE','SP400','HIGHYIELD','IG']:
    try:
        fut[n], daily[n] = fut_er(n)
        print(n, fut[n].index[0], fut[n].index[-1], len(fut[n]))
    except Exception as e:
        print('ERR', n, e)

pd.to_pickle({'spx_tr':spx_tr,'rf':rf,'fut':fut,'daily':daily}, f'{OUT}/base.pkl')

# validation: SP500 futures ER + RF vs SC S&P TR
er = fut['SP500']; common = er.index.intersection(spx_tr.index).intersection(rf.index)
tr_f = (1+er[common])*(1+rf[common])-1
d = pd.DataFrame({'fut':tr_f, 'sc':spx_tr[common]})
print('monthly corr', d.corr().iloc[0,1], 'mean diff (bp/mo)', (d.fut-d.sc).mean()*1e4, 'te (ann)', (d.fut-d.sc).std()*np.sqrt(12))
ann = (1+d).groupby(d.index.year).prod()-1
ann['diff']=ann.fut-ann.sc
print(ann.round(4).to_string())
