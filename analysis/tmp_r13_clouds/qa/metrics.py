#!/usr/bin/env python3
"""Cloud QA metrics: coverage %, cloud luma stats, h-std bands, horizon blowout.
usage: metrics.py <on.png> <off.png> [band_top band_bot]"""
import sys
import numpy as np
from PIL import Image

def load(p):
    return np.asarray(Image.open(p).convert('RGB')).astype(np.float32)

on = load(sys.argv[1])
off = load(sys.argv[2])
assert on.shape == off.shape, f'shape mismatch {on.shape} vs {off.shape}'
h, w, _ = on.shape
t = int(sys.argv[3]) if len(sys.argv) > 3 else 0
b = int(sys.argv[4]) if len(sys.argv) > 4 else h
lum = on @ [0.299, 0.587, 0.114]
offlum = off @ [0.299, 0.587, 0.114]

onb, offb = on[t:b], off[t:b]
diff = np.abs(onb - offb).max(axis=2)
mask = diff > 2
cov = 100 * mask.mean()

cl = lum[t:b][mask]
print(f'image {w}x{h} band rows [{t},{b}) ({b-t} rows)')
print(f'coverage (diff>2 vs off): {cov:.1f}%')
if mask.sum() > 50:
    print(f'cloud-pixel luma: p50={np.percentile(cl,50):.0f} p90={np.percentile(cl,90):.0f} '
          f'p99={np.percentile(cl,99):.0f} max={cl.max():.0f}  (0-255; >=217 => luma>=0.85)')
    white = 100 * (cl > 240).mean()
    print(f'cloud pixels >240 luma: {white:.1f}%')
# h-std per 40-row band (structure)
print('h-std bands (on / off):')
for r0 in range(0, h, 40):
    r1 = min(h, r0 + 40)
    s_on = lum[r0:r1].std(axis=1).mean()
    s_off = offlum[r0:r1].std(axis=1).mean()
    print(f'  rows {r0:3d}-{r1:3d}: on {s_on:6.2f}  off {s_off:6.2f}  luma_on {lum[r0:r1].mean():6.1f}')
# horizon blowout: per-row max luma + row-mean in the 120-200 zone
rows = lum.mean(axis=1)
print('brightest rows (mean luma):', [(int(i), round(float(v))) for i, v in enumerate(rows) if v > 235][:12])
print('max row-mean luma:', round(float(rows.max()), 1), 'at row', int(rows.argmax()))
