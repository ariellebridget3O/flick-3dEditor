#!/usr/bin/env python3
"""Round 5: identify the fixed white blob (UI sphere vs sun), layered texture by region."""
import numpy as np
from PIL import Image
import json

def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
out = {}

# --- blob anatomy (same in all four images) ---
rgb = np.asarray(Image.open("tune_cov25.png").convert("RGB")).astype(np.float32)
L = lum(rgb)
reg = rgb[10:65, 940:1010]
Lr = L[10:65, 940:1010]
mask = Lr >= 250
ys, xs = np.where(mask)
blob = {
  "mask_h": int(ys.max()-ys.min()+1), "mask_w": int(xs.max()-xs.min()+1),
  "fill_ratio": round(float(mask.sum()/((ys.max()-ys.min()+1)*(xs.max()-xs.min()+1))), 2),
}
# edge hardness: gradient at blob boundary
gy, gx = np.gradient(Lr)
edge_vals = []
for y, x in zip(ys, xs):
    for dy, dx in ((0,1),(0,-1),(1,0),(-1,0)):
        yy, xx = y+dy, x+dx
        if 0 <= yy < Lr.shape[0] and 0 <= xx < Lr.shape[1] and not mask[yy, xx]:
            edge_vals.append(abs(Lr[yy,xx]-Lr[y,x]))
blob["boundary_step_median"] = round(float(np.median(edge_vals)), 1) if edge_vals else None
blob["boundary_step_max"] = round(float(np.max(edge_vals)), 1) if edge_vals else None
# halo: mean lum in ring around blob
from scipy import ndimage
dil = ndimage.binary_dilation(mask, np.ones((9,9)))
ring = dil & ~mask
blob["ring_mean_lum"] = round(float(Lr[ring].mean()), 1) if ring.any() else None
# sample colors: center pixel + outside
cy, cx = int(ys.mean()), int(xs.mean())
blob["center_rgb"] = [int(v) for v in rgb[10+cy, 940+cx]]
blob["outside_rgb_20px_below"] = [int(v) for v in rgb[10+cy+25, 940+cx]]
out["white_blob_anatomy"] = blob

# --- layered: texture by horizontal band ---
rgbl = np.asarray(Image.open("tune_layered.png").convert("RGB")).astype(np.float32)
Ll = lum(rgbl[:172])
def band_stats(y0, y1):
    r = Ll[y0:y1]
    lap = np.abs(4*r[1:-1,1:-1]-r[:-2,1:-1]-r[2:,1:-1]-r[1:-1,:-2]-r[1:-1,2:])
    return {"band": f"y{y0}-{y1}", "lum_std": round(float(r.std()),1),
            "lap_mean": round(float(lap.mean()),2), "lum_p5_p95": [round(float(np.percentile(r,5)),1), round(float(np.percentile(r,95)),1)]}
out["layered_bands"] = [band_stats(0,60), band_stats(60,110), band_stats(110,145), band_stats(145,172)]

# --- cov75: dark lobe / bright rim populations in spec ranges ---
rgbc = np.asarray(Image.open("tune_cov75.png").convert("RGB")).astype(np.float32)
Lc = lum(rgbc[:172])
m = Lc > 180
out["cov75_spec_populations_pct_of_deck"] = {
  "lobes_190_205": round(100*float(((Lc>=190)&(Lc<=205)).sum()/m.sum()),1),
  "mid_205_220":   round(100*float(((Lc>205)&(Lc<220)).sum()/m.sum()),1),
  "rims_220_235":  round(100*float(((Lc>=220)&(Lc<=235)).sum()/m.sum()),1),
  "above_235":     round(100*float((Lc>235).sum()/m.sum()),1),
}

# --- base: what little blue exists, where? ---
rgbb = np.asarray(Image.open("tune_base.png").convert("RGB")).astype(np.float32)
Lb = lum(rgbb[:172]); Rb,Gb,Bb = rgbb[:172,0],rgbb[:172,1],rgbb[:172,2]
bluem = (Bb-Rb) > 30
out["base_blue_BR30_pct"] = round(100*float(bluem.mean()),1)
if bluem.any():
    ys2, xs2 = np.where(bluem)
    out["base_blue_locations_rows"] = sorted(set((ys2//10*10).tolist()))
    out["base_blue_extent"] = {"x_range": [int(xs2.min()), int(xs2.max())], "y_range": [int(ys2.min()), int(ys2.max())]}

print(json.dumps(out, indent=1))
