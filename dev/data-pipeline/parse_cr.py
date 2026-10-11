import pandas as pd, numpy as np, glob, re, os, json
from datetime import datetime
def parse(path):
    asof=None; rows={}
    for line in open(path, encoding='utf-8'):
        line=line.strip().replace('−','-')
        if line.upper().startswith('ASOF'):
            s=line.split(',',1)[1].strip()
            for fmt in ('%b %d, %Y','%B %d, %Y','%b %d %Y'):
                try: asof=datetime.strptime(s,fmt); break
                except: pass
            continue
        m=re.match(r'^(\d{4}):\s*(.*)$', line)
        if not m: continue
        y=int(m.group(1)); vals=m.group(2).split('|')
        assert len(vals)==12, (path,y,len(vals))
        for i,v in enumerate(vals):
            v=v.strip()
            if v.upper()=='NA': continue
            rows[pd.Period(f'{y}-{i+1:02d}','M')]=float(v.replace('%',''))/100
    s=pd.Series(rows).sort_index()
    # drop partial last month based on as-of date
    if asof is not None:
        lastfull = pd.Period(asof,'M') if asof.day>=28 else pd.Period(asof,'M')-1
        s=s[s.index<=lastfull]
    return s, asof
if __name__=='__main__':
    out={}
    for p in sorted(glob.glob('cr/*.grid')):
        t=os.path.basename(p)[:-5]
        s,asof=parse(p)
        out[t]=s
        ann=(1+s).groupby(s.index.year).prod()-1
        n=s.groupby(s.index.year).size()
        print(f'{t:5s} asof={asof:%Y-%m-%d} {s.index[0]}..{s.index[-1]} n={len(s)}  ' + ' '.join(f'{y}:{ann[y]*100:.1f}' for y in ann.index if n[y]==12))
    pd.to_pickle(out,'series/cr.pkl')
