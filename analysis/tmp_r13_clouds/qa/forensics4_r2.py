#!/usr/bin/env python3
"""Round 4: verify VLM claims — banding regions, streak periodicity, per-billow sun shading."""
import numpy as np
from PIL import Image
import json

def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]

def load(path):
    im = Image.open(path).convert("RGB")
    rgb = np.asarray(im).astype(np.float32)
    return rgb, lum(rgb)

def stripe_check(profile, label):
    """Detect periodic oscillation in 1D profile after detrend."""
    p = profile - np.convolve(profile, np.ones(15)/15, mode="same")
    p = p[7:-7]
    if len(p) < 16: return None
    ac = np.correlate(p, p, mode="full")[len(p)-1:]
    ac = ac / (ac[0] if ac[0] > 0 else 1)
    # find first strong secondary peak (lag 4..len/2)
    half = len(p)//2
    peaks = [(lag, round(float(ac[lag]),3)) for lag in range(4, half)
             if ac[lag] > ac[lag-1] and ac[lag] > ac[lag+1] and ac[lag] > 0.35]
    return {"label": label, "n": len(p), "osc_rms": round(float(np.sqrt((p**2).mean())),2),
            "max_lag_peak": peaks[:4] if peaks else None,
            "ac_at_lags_4_40": [round(float(x),2) for x in ac[4:41:4]]}

out = {}

# ---------- A. cov25 blue-sky banding ----------
rgb, L = load("tune_cov25.png")
R,G,B = rgb[...,0],rgb[...,1],rgb[...,2]
# full-image coords == sky coords (sky = top 172 rows); clip to 172
res = []
# R1: vertical stripes upper-left (cols 10-120, rows 10-60)
reg = L[10:60, 10:120]
res.append(stripe_check(reg.mean(axis=0), "cov25 col-profile x10-120 y10-60 (vert stripes?)"))
# R2: horizontal banding upper-right (rows 10-50, cols 700-940)
reg2 = L[10:50, 700:940]
res.append(stripe_check(reg2.mean(axis=1), "cov25 row-profile x700-940 y10-50 (horiz banding?)"))
# global blue-gap-only column profile (rows 0-60)
blueish = (B - R) > 30
for (y0,y1,tag) in [(0,60,"top60rows"),(0,172,"allrows")]:
    m = blueish[y0:y1,:]
    prof = []
    for c in range(rgb.shape[1]):
        col = L[y0:y1, c][m[:, c]]
        prof.append(col.mean() if col.size else np.nan)
    prof = np.array(prof)
    prof = prof[~np.isnan(prof)]
    if len(prof) > 30:
        res.append(stripe_check(prof, f"cov25 blue-gap col-profile {tag} n={len(prof)}"))
    # row profile of blue gap
    m2 = blueish[:, :]
    prof2 = [L[r, :][m2[r, :]].mean() if m2[r,:].any() else np.nan for r in range(0, 172, 2)]
    prof2 = np.array(prof2); prof2 = prof2[~np.isnan(prof2)]
    if len(prof2) > 20:
        res.append(stripe_check(prof2, f"cov25 blue-gap row-profile {tag} n={len(prof2)}"))
out["cov25_banding_checks"] = res

# ---------- B. cov25 per-billow sun shading ----------
def quadrant_lum_check(box, name):
    x0,x1,y0,y1 = box
    reg = L[y0:y1, x0:x1]
    hh, ww = reg.shape
    q = {"UR": float(reg[:hh//2, ww//2:].mean()), "UL": float(reg[:hh//2, :ww//2].mean()),
         "LR": float(reg[hh//2:, ww//2:].mean()), "LL": float(reg[hh//2:, :ww//2].mean())}
    return {"name": name, "box": box, **{k: round(v,1) for k,v in q.items()},
            "UR_minus_LL": round(q["UR"]-q["LL"],1)}
out["cov25_billow_quadrants"] = [
    quadrant_lum_check((440,520,100,140), "VLM billow A x440-520 y100-140"),
    quadrant_lum_check((580,660,120,160), "VLM billow B x580-660 y120-160"),
    quadrant_lum_check((130,180,110,165), "billow near x150"),
    quadrant_lum_check((590,760,80,170), "right cluster x600-700"),
]

# ---------- C. layered near-horizon streak periodicity ----------
rgb2, L2 = load("tune_layered.png")
res2 = []
strip = L2[130:172, :]
res2.append(stripe_check(strip.mean(axis=0), "layered strip y130-172 col-profile (period?)"))
strip2 = L2[100:140, :]
res2.append(stripe_check(strip2.mean(axis=0), "layered strip y100-140 col-profile"))
# 2D autocorr small offsets in strip
s = strip - strip.mean()
for off in [24, 32, 48, 64, 96, 128]:
    a = s[:, off:]; b = s[:, :-off]
    d = np.sqrt((a**2).sum()*(b**2).sum())
    res2.append({"2D_autocorr_strip_offset": off, "r": round(float((a*b).sum()/d),3)})
out["layered_streak_checks"] = res2

# ---------- D. cov75 dark lobe verification ----------
rgb3, L3 = load("tune_cov75.png")
def boxstat(box):
    x0,x1,y0,y1 = box
    reg = L3[y0:y1, x0:x1]
    return {"box": box, "mean": round(float(reg.mean()),1), "min": round(float(reg.min()),1),
            "p5": round(float(np.percentile(reg,5)),1)}
out["cov75_boxes"] = [
    boxstat((150,250,60,100)),   # VLM dark streak mid-left
    boxstat((450,520,110,130)),  # VLM lobe lower-left flank
    boxstat((700,800,40,70)),    # VLM brighter rims upper right
    boxstat((0,150,60,120)),     # far left
    boxstat((850,950,20,60)),    # near sun/top-right
]

# ---------- E. base: horizontal smear/streak check ----------
rgb4, L4 = load("tune_base.png")
s4 = L4 - L4.mean()
acx = []
for off in [32, 64, 96, 128, 192, 256]:
    a = s4[:, off:]; b = s4[:, :-off]
    d = np.sqrt((a**2).sum()*(b**2).sum())
    acx.append({"x_off": off, "r": round(float((a*b).sum()/d),3)})
for off in [16, 24, 32]:
    a = s4[off:, :]; b = s4[:-off, :]
    d = np.sqrt((a**2).sum()*(b**2).sum())
    acx.append({"y_off": off, "r": round(float((a*b).sum()/d),3)})
out["base_autocorr_aniso"] = acx
# gradient orientation histogram (streak direction)
gy, gx = np.gradient(L4[:172,:])
mag = np.sqrt(gx**2+gy**2)
sel = mag > np.percentile(mag, 97)
ang = (np.degrees(np.arctan2(gy[sel], gx[sel])) + 180) % 180
hist, edges = np.histogram(ang, bins=18, range=(0,180))
out["base_grad_orient_hist_10deg"] = hist.astype(int).tolist()

print(json.dumps(out, indent=1))
