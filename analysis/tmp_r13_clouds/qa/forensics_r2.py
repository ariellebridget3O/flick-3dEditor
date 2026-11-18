#!/usr/bin/env python3
"""Pixel forensics for cloud-renderer captures (r13 QA round 2)."""
import numpy as np
from PIL import Image
import json, sys

FILES = {
    "tune_cov25.png":   {"expect": "discrete cumulus, ~48% blue gaps, near-white cores 240-255, darker undersides"},
    "tune_cov75.png":   {"expect": "broad deck ~95% coverage, shaded lobes 195-205 vs rims 225-230, no clip"},
    "tune_base.png":    {"expect": "partial ~60% cloud, mix of structure and blue"},
    "tune_layered.png": {"expect": "soft semi-transparent veil, brighter w/ subtle texture, no flat 250+ white"},
}

FLOOR_CUT = 0.45  # bottom 45% is fog floor — exclude

def luminance(a):
    return 0.2126*a[...,0] + 0.7152*a[...,1] + 0.0722*a[...,2]

def analyze(path):
    im = Image.open(path)
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    H, W, _ = rgb.shape
    sky = rgb[:int(H*(1-FLOOR_CUT)), :, :]
    skyL = luminance(sky)
    h, w = skyL.shape

    out = {"size": f"{W}x{H}", "sky_region": f"{w}x{h}"}

    # --- classification: blue sky vs cloud ---
    R, G, B = sky[...,0], sky[...,1], sky[...,2]
    blue_gap = (B > R + 15) & (B > 110) & (skyL < 170)
    cloud = ~blue_gap
    out["blue_gap_pct"] = round(100*blue_gap.mean(), 1)
    out["cloud_pct"]    = round(100*cloud.mean(), 1)

    # --- cloud luminance stats ---
    cl = skyL[cloud] if cloud.any() else np.array([0.0])
    out["cloud_lum"] = {k: round(float(v),1) for k,v in {
        "p1": np.percentile(cl,1), "p25": np.percentile(cl,25),
        "median": np.median(cl), "p75": np.percentile(cl,75),
        "p99": np.percentile(cl,99), "max": cl.max()}.items()}

    # --- clipping ---
    out["clip250_pct_sky"] = round(100*(skyL >= 250).mean(), 2)
    out["clip250_pct_cloudarea"] = round(100*(skyL[cloud] >= 250).mean(), 2) if cloud.any() else 0.0
    out["clip255_pct_sky"] = round(100*(skyL >= 254.5).mean(), 2)
    # largest connected pure-white component (quick flood via label-free approach: use scipy? do row-run approximation)
    try:
        from scipy import ndimage
        white = skyL >= 250
        lab, n = ndimage.label(white)
        if n > 0:
            sizes = ndimage.sum(white, lab, range(1, n+1))
            largest = sizes.max() if len(sizes) else 0
            out["largest_white_blob_pct_sky"] = round(100*largest/white.size, 2)
            out["white_blob_count"] = int(n)
    except ImportError:
        # fallback: largest axis-aligned run scan (rows)
        white = (skyL >= 250).astype(np.int32)
        # longest horizontal run
        best = 0
        for row in white:
            c = 0
            for v in row:
                c = c+1 if v else 0
                best = max(best, c)
        out["longest_white_row_run_px"] = int(best)
        out["longest_white_row_run_pct_w"] = round(100*best/w, 1)

    # --- flatness: unique colors & dominant color share ---
    q = (sky // 2).astype(np.uint8)  # quantize to reduce jpeg-ish noise
    flat = q[...,0].astype(np.int32)*65536 + q[...,1].astype(np.int32)*256 + q[...,2].astype(np.int32)
    vals, counts = np.unique(flat, return_counts=True)
    order = np.argsort(counts)[::-1]
    top3 = [(round(100*counts[i]/flat.size,1)) for i in order[:3]]
    out["top_color_share_pct"] = top3
    out["unique_qcolors"] = int(len(vals))

    # largest exactly-uniform run (rows) in full precision — banding/flat deck check
    eq = np.all(sky[1:,:,:] == sky[:-1,:,:], axis=(1,2))
    best_run = cur = 0
    for v in eq:
        cur = cur+1 if v else 0
        best_run = max(best_run, cur)
    out["longest_identical_row_run"] = int(best_run)
    # same for columns
    eqc = np.all(sky[:,1:,:] == sky[:,:-1,:], axis=(0,2))
    bestc = curc = 0
    for v in eqc:
        curc = curc+1 if v else 0
        bestc = max(bestc, curc)
    out["longest_identical_col_run"] = int(bestc)

    # --- noise / high-frequency energy (Laplacian) ---
    L = skyL
    lap = np.abs(4*L[1:-1,1:-1] - L[:-2,1:-1] - L[2:,1:-1] - L[1:-1,:-2] - L[1:-1,2:])
    out["laplacian_mean"] = round(float(lap.mean()), 3)
    out["laplacian_p99"]  = round(float(np.percentile(lap, 99)), 2)
    # noise estimate: median absolute laplacian (robust to structure)
    out["laplacian_median"] = round(float(np.median(lap)), 3)

    # --- banding: row-mean luminance first-difference ---
    rowmean = L.mean(axis=1)
    drow = np.abs(np.diff(rowmean))
    out["row_mean_max_jump"] = round(float(drow.max()), 3)
    colmean = L.mean(axis=0)
    dcol = np.abs(np.diff(colmean))
    out["col_mean_max_jump"] = round(float(dcol.max()), 3)

    # --- chroma noise: R-B difference variance inside cloud (cyan/magenta blotch) ---
    if cloud.any():
        rb = (R - B)[cloud]
        out["cloud_RB_diff"] = {"mean": round(float(rb.mean()),2),
                                "std": round(float(rb.std()),2),
                                "p1": round(float(np.percentile(rb,1)),1),
                                "p99": round(float(np.percentile(rb,99)),1)}
        # blotchiness: low-frequency variance of R-B map on cloud (blur then std)
        rbmap = (R - B)
        # box blur 21px
        k = 21
        cum = np.cumsum(np.cumsum(np.pad(rbmap, ((k//2,k//2),(k//2,k//2))), axis=0), axis=1)
        blur = (cum[k:, k:] - cum[:-k, k:] - cum[k:, :-k] + cum[:-k, :-k]) / (k*k)
        mask_blur = np.zeros_like(blur, bool)
        mask_blur[k//2:k//2+h, :] = False  # placeholder, we just measure overall low-freq chroma var
        out["chroma_lowfreq_std"] = round(float(blur.std()), 2)

    # --- sun-direction shading: luminance of cloud pixels left vs right, top vs bottom ---
    if cloud.any():
        thirds_x = np.array_split(np.arange(w), 3)
        thirds_y = np.array_split(np.arange(h), 3)
        xs = []
        for i, cols in enumerate(thirds_x):
            m = cloud[:, cols]
            lvals = L[:, cols][m]
            xs.append(round(float(lvals.mean()),1) if lvals.size else None)
        ys = []
        for i, rows in enumerate(thirds_y):
            m = cloud[rows, :]
            lvals = L[rows, :][m]
            ys.append(round(float(lvals.mean()),1) if lvals.size else None)
        out["cloud_lum_by_third_x(left->right)"] = xs
        out["cloud_lum_by_third_y(top->bottom)"] = ys

    # --- tiling/duplication: autocorrelation at plausible tile offsets ---
    # downsample L to speed; normalized cross-corr of (L - mean) with shifted self
    small = L[::2, ::2]
    small = small - small.mean()
    denom = np.sqrt((small**2).sum())
    offs = [64, 128, 256, -128, -256]
    ac = {}
    for o in offs:
        if o == 0: continue
        if o > 0:
            a = small[:, o:]; b = small[:, :-o]
        else:
            a = small[:, :o]; b = small[:, -o:]
        if a.size == 0: continue
        num = (a*b).sum()
        d = np.sqrt((a**2).sum() * (b**2).sum())
        ac[o] = round(float(num/d), 3) if d > 0 else 0.0
    # vertical
    for o in [64, 128]:
        if o > 0:
            a = small[o:, :]; b = small[:-o, :]
        else:
            a = small[:o, :]; b = small[-o:, :]
        if a.size == 0: continue
        num = (a*b).sum()
        d = np.sqrt((a**2).sum() * (b**2).sum())
        ac[f"y{o}"] = round(float(num/d), 3) if d > 0 else 0.0
    out["autocorr_offsets"] = ac

    return out

res = {}
for f, meta in FILES.items():
    try:
        res[f] = analyze(f)
    except Exception as e:
        res[f] = {"error": str(e)}
print(json.dumps(res, indent=1))
