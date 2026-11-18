#!/usr/bin/env python3
"""Round 3: histogram shape, gizmo contamination, cov25 billow segmentation."""
import numpy as np
from PIL import Image
from scipy import ndimage
import json

FLOOR_CUT = 0.45

def lum(a): return 0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]

def run(path):
    im = Image.open(path).convert("RGB")
    rgb = np.asarray(im).astype(np.float32)
    H, W, _ = rgb.shape
    h = int(H*(1-FLOOR_CUT))
    sky = rgb[:h]; L = lum(sky); R,G,B = sky[...,0],sky[...,1],sky[...,2]
    out = {}

    # --- gizmo contamination in sky band ---
    teal = (G > 140) & (B > 140) & (R < G - 40) & (R < B - 40)   # wireframe frustum
    out["teal_wire_px_in_sky"] = int(teal.sum())
    # dark UI (labels) - near black pixels
    out["near_black_px_in_sky"] = int((L < 60).sum())
    # the shading sphere blob region (x 950-1000, y 15-60)
    out["sphere_blob_region"] = "x950-1000,y15-60"

    # --- luminance histogram shape for bright areas (deck analysis) ---
    bright = L > 180
    hist, _ = np.histogram(L[bright], bins=76, range=(180,256))
    out["hist_180_256_step1"] = hist.astype(int).tolist()

    # --- cov25 billow segmentation: bright + not-strongly-blue ---
    if "cov25" in path:
        results = {}
        for bt in (195, 205, 215):
            for bluet in (25, 40):
                m = (L > bt) & ((B - R) < bluet)
                m = ndimage.binary_opening(m, np.ones((3,3)))
                lab, n = ndimage.label(m)
                sizes = np.array(ndimage.sum(m, lab, range(1, n+1))) if n else np.array([])
                big = sizes[sizes > 400]
                results[f"L>{bt}_BR<{bluet}"] = {
                    "mask_pct": round(100*m.mean(),1),
                    "clusters_gt400": int(len(big)),
                    "cluster_sizes": sorted(big.astype(int).tolist(), reverse=True)[:10]}
        out["billow_seg"] = results
        # gap = strongly blue
        for gt in (30, 40, 50, 60):
            out[f"bluegap_BR>{gt}_pct"] = round(100*float((B-R > gt).mean()),1)
    return out

for f in ["tune_cov25.png","tune_cov75.png","tune_base.png","tune_layered.png"]:
    print("=====", f)
    print(json.dumps(run(f), indent=1))
