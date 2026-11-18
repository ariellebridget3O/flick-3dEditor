#!/usr/bin/env python3
"""r13 cloud QA metrics from backbuffer PNGs.

Usage: metrics.py NAME=on.png [NAME_OFF=off.png ...]
Each NAME is a config; if NAME_OFF given, computes cloud-diff metrics against it.
Prints a JSON dict.
"""
import sys, json
import numpy as np
from PIL import Image

def load(p):
    im = Image.open(p).convert('RGB')
    a = np.asarray(im, dtype=np.float32) / 255.0
    return a

def luma(a):
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

def band_hstd(L, nbands=10):
    h, w = L.shape
    rows = []
    for b in range(nbands):
        seg = L[b*h//nbands:(b+1)*h//nbands, :]
        rows.append(float(np.mean(np.std(seg, axis=1))))
    return [round(r, 2) for r in rows]

def analyze(on_path, off_path=None):
    a = load(on_path)
    L = luma(a)
    out = {}
    out['size'] = f'{a.shape[1]}x{a.shape[0]}'
    out['luma_mean'] = round(float(L.mean()), 4)
    out['luma_p99'] = round(float(np.percentile(L, 99)), 4)
    out['luma_max'] = round(float(L.max()), 4)
    out['blowout_pct'] = round(float((L > 0.95).mean() * 100), 2)  # near-white pixels
    out['hstd_bands'] = band_hstd(L)
    out['hstd_mean'] = round(float(np.mean(np.std(L, axis=1))), 3)
    # vertical profile: row-mean luma every 5% height, to spot seam steps
    h = L.shape[0]
    prof = [round(float(L[i*h//20:(i+1)*h//20, :].mean()), 3) for i in range(20)]
    out['row_profile'] = prof
    # max row-to-row step in row means (seam detector)
    rowm = L.mean(axis=1)
    out['max_row_step'] = round(float(np.abs(np.diff(rowm)).max()), 4)
    if off_path:
        o = load(off_path)
        d = np.abs(a - o).max(axis=2)
        mask = d > 30.0 / 255.0
        tot = mask.size
        out['cloud_cov_pct'] = round(float(mask.sum()) / tot * 100, 2)
        out['cloud_cov_pct_soft'] = round(float((d > 8.0/255.0).sum()) / tot * 100, 2)
        if mask.sum() > 100:
            cl = L[mask]
            out['cloud_luma_mean'] = round(float(cl.mean()), 4)
            out['cloud_luma_p90'] = round(float(np.percentile(cl, 90)), 4)
            out['cloud_luma_p99'] = round(float(np.percentile(cl, 99)), 4)
            out['cloud_luma_max'] = round(float(cl.max()), 4)
            out['cloud_luma_p05'] = round(float(np.percentile(cl, 5)), 4)
            # structure inside cloud areas: local contrast
            out['cloud_hstd'] = round(float(np.std(L[mask])), 4)
        else:
            out['cloud_luma_mean'] = None
    return out

if __name__ == '__main__':
    res = {}
    args = sys.argv[1:]
    pairs = []
    i = 0
    while i < len(args):
        if i + 1 < len(args) and '=' in args[i+1] and args[i+1].split('=')[0].endswith('_OFF'):
            k = args[i].split('=')[0]
            pairs.append((k, args[i].split('=')[1], args[i+1].split('=', 1)[1]))
            i += 2
        else:
            k, v = args[i].split('=', 1)
            pairs.append((k, v, None))
            i += 1
    for k, on, off in pairs:
        res[k] = analyze(on, off)
    print(json.dumps(res, indent=1))
