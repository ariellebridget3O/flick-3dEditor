#!/usr/bin/env python3
"""lens_forensics.py — discriminate the m1/m5 lens divergence hypotheses from pixels.

Hypotheses:
  H1 DOM veil / additive overlay:  live = a*ours + b, a<1, b>0
  H2 exposure multiplier:          live = a*ours, a~1.39, b~0
  H3 tonemap/gamma curve:          live = ours^g (per-channel power law)
  H4 spatial overlay (rect UI):    ratio modes cluster in rectangular bboxes
"""
import numpy as np
from PIL import Image
import os, sys

HERE = os.path.dirname(os.path.abspath(__file__))

def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)

def fit_linear(ours, live):
    # least squares over all pixels(+channels): live = a*ours + b
    x = ours.reshape(-1); y = live.reshape(-1)
    a, b = np.polyfit(x.ravel(), y.ravel(), 1)
    resid = y.ravel() - (a * x.ravel() + b)
    return a, b, np.abs(resid).mean()

def fit_power(ours, live):
    # live = ours^g  =>  log(live) = g*log(ours), skip saturated/dark
    m = (ours > 8) & (ours < 250) & (live > 8) & (live < 250)
    if m.sum() < 1000: return None, None
    g = np.polyfit(np.log(ours[m]), np.log(live[m]), 1)[0]
    pred = np.clip(ours, 0, 255) ** g
    return g, np.abs(pred - np.clip(live, 0, 255))[m].mean()

def lum(img):
    return img.mean(axis=2)

def ratio_modes(ours, live):
    lo = lum(ours); ll = lum(live)
    m = lo > 20  # avoid divide noise
    r = np.zeros_like(lo); r[m] = ll[m] / lo[m]
    return r, m

def report(case):
    live = load(os.path.join(HERE, "golden", f"{case}_live.png"))
    ours = load(os.path.join(HERE, "out", f"ours_{case}.png"))
    print(f"\n===== {case}  live{live.shape[1]}x{live.shape[0]} ours{ours.shape[1]}x{ours.shape[0]} =====")
    h = min(live.shape[0], ours.shape[0]); w = min(live.shape[1], ours.shape[1])
    live = live[:h, :w]; ours = ours[:h, :w]
    lo, ll = lum(ours), lum(live)
    print(f"ours  lum: min {lo.min():.0f} mean {lo.mean():.1f} max {lo.max():.0f}  px<30: {(lo<30).mean()*100:.2f}%")
    print(f"live  lum: min {ll.min():.0f} mean {ll.mean():.1f} max {ll.max():.0f}  px<30: {(ll<30).mean()*100:.2f}%  sat: {(ll>253).mean()*100:.2f}%")
    a, b, res = fit_linear(ours, live)
    print(f"H1/H2 linear fit: live = {a:.4f}*ours + {b:.2f}   mean|resid| {res:.2f}")
    g, gres = fit_power(ours, live)
    if g: print(f"H3 power fit: live = ours^{g:.4f}   mean|resid| {gres:.2f}")

    r, m = ratio_modes(ours, live)
    if not m.any(): return
    # histogram of ratio
    hist, edges = np.histogram(r[m], bins=32, range=(0.5, 2.5))
    top = np.argsort(hist)[::-1][:6]
    print("ratio histogram peaks:")
    for i in top:
        if hist[i] == 0: continue
        print(f"  r {edges[i]:.2f}-{edges[i+1]:.2f}: {hist[i]} px ({hist[i]/m.sum()*100:.1f}%)")
    # spatial map of the two hypothesized modes
    for name, sel in [("r~1.0", (r > 0.92) & (r < 1.10) & m),
                      ("r~1.67", (r > 1.55) & (r < 1.80) & m),
                      ("r>2.0", (r > 2.0) & m)]:
        if sel.sum() < 100:
            print(f"  mode {name}: {sel.sum()} px (skip)"); continue
        ys, xs = np.nonzero(sel)
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        # detect rectangularity: fill ratio of the bbox
        fill = sel[y0:y1+1, x0:x1+1].mean()
        print(f"  mode {name}: {sel.sum()} px bbox x{x0}-{x1} y{y0}-{y1} fill {fill*100:.0f}%  mean-ours-lum {lo[sel].mean():.0f}")
    # column/row profiles of the ratio (detect veil bands)
    rm = np.where(m, r, np.nan)
    with np.errstate(invalid="ignore"):
        colmean = np.nanmean(rm, axis=0)
        rowmean = np.nanmean(rm, axis=1)
    colmean = np.nan_to_num(colmean); rowmean = np.nan_to_num(rowmean)
    print(f"  ratio col profile: left-edge {colmean[:40].mean():.2f} mid {colmean[w//2-40:w//2+40].mean():.2f} right-edge {colmean[-40:].mean():.2f}")
    print(f"  ratio row profile: top {rowmean[:40].mean():.2f} mid {rowmean[h//2-40:h//2+40].mean():.2f} bottom {rowmean[-40:].mean():.2f}")

    # channel-wise: a pure luma op preserves channel ratios; a tonemap may not
    for ch, nm in enumerate("RGB"):
        ac, bc, _ = fit_linear(ours[:, :, ch], live[:, :, ch])
        print(f"  ch {nm}: a {ac:.4f} b {bc:.2f}")

if __name__ == "__main__":
    for case in (sys.argv[1:] or ["m1_lens", "m5_cam_path"]):
        report(case)
