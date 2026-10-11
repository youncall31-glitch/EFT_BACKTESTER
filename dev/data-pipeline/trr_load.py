import pandas as pd, numpy as np, glob
def load_trr():
    out={}
    for f in sorted(glob.glob('trr/multi*.csv')):
        df=pd.read_csv(f, dtype=str)
        for c in df.columns[1:]:
            for y,v in zip(df.YEAR, df[c]):
                v=str(v).strip().replace('−','-').replace('%','')
                if v in ('NA','nan','—',''): continue
                out.setdefault(c,{})[int(y)]=float(v)/100
    # real -> nominal for EWY, TIP using CPI-U Dec/Dec
    cpi=pd.read_csv('/tmp/claude-0/-home-claude/e428d1a5-5da7-5c16-ad9d-33b6f0e12c13/scratchpad/repos/datasets_cpi-us/data/cpiai.csv', parse_dates=['Date'])
    cpi=cpi.set_index(cpi.Date.dt.to_period('M'))['Index']
    df=pd.read_csv('trr/real.csv', dtype=str)
    for c in df.columns[1:]:
        for y,v in zip(df.YEAR, df[c]):
            v=str(v).strip().replace('−','-').replace('%','')
            if v in ('NA','nan',''): continue
            y=int(y)
            if y>=2026: continue
            infl=cpi[pd.Period(f'{y}-12','M')]/cpi[pd.Period(f'{y-1}-12','M')]-1
            out.setdefault(c,{})[y]=(1+float(v)/100)*(1+infl)-1
    return out
if __name__=='__main__':
    t=load_trr()
    for k,v in t.items(): print(k, min(v), max(v), len(v))
    print({y:round(x*100,2) for y,x in t['TIP'].items() if y in (2008,2013,2022)}, {y:round(x*100,2) for y,x in t['EWY'].items() if y in (2008,2017,2022)})
