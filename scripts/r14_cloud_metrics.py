#!/usr/bin/env python3
"""r14 clouds nit metrics — cov75 internal contrast + layered zenith clip.

Cloud-pixel mask: near-neutral + bright (blue sky is high-chroma; floor is low-luma).
Reports luma percentiles INSIDE the cloud mask (shaded lobes = p10/p25, lit tops = p95/p99)
and the >240 clip fraction (layered zenith cap check).

usage: r14_cloud_metrics.py <img.png> [...]
"""
import sys
import numpy as np
from PIL import Image

for p in sys.argv[1:]:
    rgb = np.asarray(Image.open(p).convert('RGB')).astype(np.float32)
    h, w, _ = rgb.shape
    # sky region only: rows 0..60% (below that = floor/haze in the 45°-view harness)
    band = rgb[: int(h * 0.6)]
    lum = band @ [0.299, 0.587, 0.114]
    r, g, b = band[..., 0], band[..., 1], band[..., 2]
    chroma = np.maximum(np.abs(r - g), np.maximum(np.abs(g - b), np.abs(r - b)))
    mask = (lum > 90) & (chroma < 28)          # cloud: bright + near-neutral
    frac = 100 * mask.mean()
    print(f"{p.split('/')[-1]}  {w}x{h}  cloud-mask {frac:5.1f}%")
    if mask.sum() > 100:
        cl = lum[mask]
        p10, p25, p50, p75, p95, p99 = [np.percentile(cl, q) for q in (10, 25, 50, 75, 95, 99)]
        print(f"  cloud luma: p10={p10:.0f} p25={p25:.0f} p50={p50:.0f} p75={p75:.0f} "
              f"p95={p95:.0f} p99={p99:.0f} max={cl.max():.0f}")
        print(f"  contrast p95-p10={p95 - p10:.0f}   clip>240: {100 * (cl > 240).mean():.2f}%  "
              f"clip>248: {100 * (cl > 248).mean():.2f}%")
