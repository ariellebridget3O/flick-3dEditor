#!/usr/bin/env python3
"""Forensics round 2: sun blob location, blue-gap recheck, per-blob underside shading,
posterization, cloud-only chroma blotches."""
import numpy as np
from PIL import Image
from scipy import ndimage
import json

FILES = ["tune_cov25.png", "tune_cov75.png", "tune_base.png", "tune_layered.png"]
FLOOR_CUT = 0.45

def luminance(a):
    return 0.2126*a[...,0] + 0.7152*a[...,1] + 0.0722*a[...,2]

def analyze(path):
    im = Image.open(path)
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    H, W, _ = rgb.shape
    h = int(H*(1-FLOOR_CUT))
    sky = rgb[:h, :, :]
    L = luminance(sky)
    R, G, B = sky[...,0], sky[...,1], sky[...,2]
    out = {}

    # 1) locate pure-white blob(s)
    white = L >= 250
    if white.any():
        lab, n = ndimage.label(white)
        sizes = ndimage.sum(white, lab, range(1, n+1))
        for i in np.argsort(sizes)[::-1][:3]:
            if sizes[i] < 20: continue
            ys, xs = np.where(lab == i+1)
            out[f"white_blob_{int(sizes[i])}px"] = {
                "cx": int(xs.mean()), "cy": int(ys.mean()),
                "bbox": [int(xs.min()), int(ys.max()), int(ys.min()), int(ys.max())],
                "rel_x": round(float(xs.mean())/W, 2), "rel_y_in_sky": round(float(ys.mean())/h, 2)}

    # 2) blue gap fraction with several thresholds + gap color stats
    for margin, tag in [(15, "strict"), (5, "loose"), (-10, "any_b_r")]:
        gap = (B > R + margin) & (B > 90)
        out[f"bluegap_{tag}_pct"] = round(100*gap.mean(), 1)
    gap = (B > R + 5) & (B > 90)
    if gap.any():
        out["gap_color"] = {"R": round(float(R[gap].mean()),1), "G": round(float(G[gap].mean()),1),
                            "B": round(float(B[gap].mean()),1)}
    # strongest blue (zenith-ish) color: 90th pct of B-R
    br = B - R
    out["blue_strength_p90"] = round(float(np.percentile(br, 90)), 1)
    out["sky_top_row_color"] = {"R": round(float(R[0:5,:].mean()),1), "G": round(float(G[0:5,:].mean()),1), "B": round(float(B[0:5,:].mean()),1)}

    # 3) posterization: luminance histogram spikes/gaps in sky
    hist, _ = np.histogram(L, bins=256, range=(0,256))
    nz = hist[hist > 0]
    # count empty levels inside [min,max] active range
    active = np.where(hist > 0)[0]
    lo, hi = active.min(), active.max()
    empty_inside = int((hist[lo:hi+1] == 0).sum())
    spikes = int((hist[lo:hi+1] > 5*np.median(nz)).sum())
    out["lum_hist"] = {"active_range": [int(lo), int(hi)], "empty_levels_inside": empty_inside, "spike_levels": spikes}

    # 4) cloud mask (loose) & per-blob top-vs-bottom shading
    cloud = ~(B > R + 5) | (L > 200)
    cloud = ndimage.binary_closing(cloud, np.ones((3,3)))
    lab, n = ndimage.label(cloud)
    stats = []
    min_area = 150
    for i in range(1, n+1):
        ys, xs = np.where(lab == i)
        if len(ys) < min_area: continue
        sel = lab == i
        ymid = ys.mean()
        top = sel & (np.arange(h)[:, None] < ymid)
        bot = sel & (np.arange(h)[:, None] >= ymid)
        lt = L[top].mean() if top.any() else None
        lb = L[bot].mean() if bot.any() else None
        if lt and lb:
            stats.append({"area": int(len(ys)), "lum_top": round(float(lt),1), "lum_bot": round(float(lb),1),
                          "top_minus_bot": round(float(lt-lb),1)})
    stats.sort(key=lambda s: -s["area"])
    out["blobs"] = stats[:8]
    if stats:
        d = [s["top_minus_bot"] for s in stats]
        out["blob_top_minus_bot_mean"] = round(float(np.mean(d)), 1)
        out["n_blobs"] = len(stats)

    # 5) cloud-only chroma blotches: dilate cloud, blur R-B, std within
    cmask = ndimage.binary_dilation(cloud, np.ones((5,5)))
    rb = R - B
    k = 25
    cum = np.cumsum(np.cumsum(np.pad(rb, k//2, mode="edge"), axis=0), axis=1)
    blur = (cum[k:, k:] - cum[:-k, k:] - cum[k:, :-k] + cum[:-k, :-k]) / (k*k)
    blur = blur[:h, :W] if blur.shape[0] >= h else blur
    m = cmask[:blur.shape[0], :blur.shape[1]]
    if m.any():
        out["cloud_chroma_blur_std"] = round(float(blur[m].std()), 2)
        out["cloud_chroma_blur_absmax"] = round(float(np.abs(blur[m]).max()), 1)
        # fraction of cloud w/ magenta tint (R-B > +8) after blur
        out["cloud_magenta_tint_pct"] = round(100*float((blur[m] > 8).mean()), 2)
        out["cloud_cyan_tint_pct"] = round(100*float((blur[m] < -8).mean()), 2)

    # 6) horizontal streaking: row-wise std of luminance vs col-wise
    out["row_std_mean"] = round(float(L.std(axis=1).mean()), 2)
    out["col_std_mean"] = round(float(L.std(axis=0).mean()), 2)

    # 7) edge-enhanced count of strong local edges (seam detection): gradient magnitude > 20
    gx = np.abs(np.diff(L, axis=1)); gy = np.abs(np.diff(L, axis=0))
    out["strong_edges_pct"] = round(100*float((gx[:-1,:] > 20).mean()), 3)
    # vertical line check: columns whose mean gradient is much higher
    colgrad = (np.abs(np.diff(L, axis=1)) > 15).mean(axis=0)
    out["worst_col_edge_share"] = round(float(colgrad.max()), 3)

    return out

res = {f: analyze(f) for f in FILES}
print(json.dumps(res, indent=1))
