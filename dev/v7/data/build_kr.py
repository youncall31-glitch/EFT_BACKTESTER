import json
# FX levels 1971-12 .. 2026-09 (month index -1 .. NM-1 where 0 = 1972-01)
pre = {}
for line in open('fx_oecd_1971_1981.txt'):
    k, v = line.split(); pre[k] = float(v)
months = []
y, m = 1971, 12
while (y, m) <= (2026, 9):
    months.append(f'{y}-{m:02d}'); m += 1
    if m == 13: y += 1; m = 1
ex = [float(x) for x in open('exkous_1981_04.txt').read().split()]
assert len(ex) == 546, len(ex)
fx = []; last = None; j = 0
for k in months:
    if k >= '1981-04': v = ex[j]; j += 1
    elif k in pre: v = pre[k]
    else: v = last  # 1975-02..1979-12 fixed at 484
    fx.append(v); last = v
assert j == 546
# KR CPI: 2015-base levels 1971-12..2023-11, then 2020-base levels relative to 2023-11 = 112.74
c15 = [float(x) for x in open('krcpi_2015base_1971_12.txt').read().split()]
assert len(c15) == months.index('2023-11') + 1, (len(c15), months.index('2023-11') + 1)
lv20 = [112.74, 112.73, 113.17, 113.78, 113.95, 114.01, 114.10, 113.84, 114.13, 114.54, 114.65, 114.69, 114.40, 114.91,
        115.71, 116.08, 116.29, 116.38, 116.27, 116.31, 116.52, 116.45, 117.06, 117.42, 117.20, 117.57,
        118.03, 118.40, 118.80, 119.37, 119.92, 119.99, 119.77, 120.05, 120.43]  # 2023-11 .. 2026-09
cpi = c15[:] 
for i in range(1, len(lv20)): cpi.append(cpi[-1] * lv20[i] / lv20[i - 1])
assert len(cpi) == len(months), (len(cpi), len(months))
# monthly changes as integers x1e6 (same encoding as the app's cpi/rf arrays), aligned to month 0 = 1972-01
fxr = [round((fx[i] / fx[i - 1] - 1) * 1e6) for i in range(1, len(fx))]
kcr = [round((cpi[i] / cpi[i - 1] - 1) * 1e6) for i in range(1, len(cpi))]
out = {'kfx': {'s': 0, 'r': fxr, 'lv0': fx[0], 'last': fx[-1]}, 'kcpi': {'s': 0, 'r': kcr}}
json.dump(out, open('kr.json', 'w'), separators=(',', ':'))
import math
yrs = (len(fx) - 1) / 12
print('months', len(fxr), 'fx', fx[0], '->', fx[-1], 'ann %.2f%%' % ((fx[-1] / fx[0]) ** (1 / yrs) * 100 - 100))
print('krcpi ann %.2f%%' % ((cpi[-1] / cpi[0]) ** (1 / yrs) * 100 - 100))
for k in ['1997-11', '1997-12', '1998-01', '2008-10', '2026-09']:
    i = months.index(k); print(k, fx[i])
# 30y KR CPI
i0 = months.index('1996-09'); print('KR cpi 30y %.2f%%' % ((cpi[-1] / cpi[i0]) ** (1 / 30) * 100 - 100))
