#!/usr/bin/env python3
"""lens_smooth.py — is live-ours a smooth screen-space field (overlay) or content noise (tonemap)?"""
import numpy as np
from PIL import Image
import os

HERE = os.path.dirname(os.path.abspath(__file__))

def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)

def smoothness(D, tag):
    # high-frequency energy: |D - blur(D)| vs |D - mean|
    h, w = D.shape
    # 5x5 box blur
    k = 2
    P = np.pad(D, k, mode="edge")
    blur = np.zeros_like(D)
    for dy in range(-k, k + 1):
        for dx in range(-k, k + 1):
            blur += P[k + dy : k + dy + h, k + dx : k + dx + w]
    blur /= 25
    hf = np.abs(D - blur).mean()
    tot = np.abs(D - D.mean()).mean()
    print(f"  {tag}: mean {D.mean():.1f}  hf-energy {hf:.1f}  total-var {tot:.1f}  smoothness {1-hf/max(tot,1e-9):.2f}")
    return 1 - hf / max(tot, 1e-9)

def plane_fit(D, tag):
    h, w = D.shape
    yy, xx = np.mgrid[0:h, 0:w]
    A = np.stack([xx.ravel()/w, yy.ravel()/h, (xx.ravel()/w)**2, (yy.ravel()/h)**2, xx.ravel()*yy.ravel()/(w*h), np.ones(h*w)], 1)
    coef, *_ = np.linalg.lstsq(A, D.ravel(), rcond=None)
    pred = (A @ coef).reshape(h, w)
    resid = np.abs(D - pred).mean()
    print(f"  {tag}: quadric coeffs x {coef[0]:.1f} y {coef[1]:.1f} x2 {coef[2]:.1f} y2 {coef[3]:.1f} xy {coef[4]:.1f} c {coef[5]:.1f}  resid {resid:.1f} (D mean {D.mean():.1f})")

def grid_report(D, tag, n=6):
    h, w = D.shape
    print(f"  {tag} {n}x{n} grid of mean D:")
    for gy in range(n):
        row = []
        for gx in range(n):
            cell = D[gy*h//n:(gy+1)*h//n, gx*w//n:(gx+1)*w//n]
            row.append(f"{cell.mean():6.0f}")
        print("    " + " ".join(row))

for case in ("m1_lens", "m5_cam_path"):
    live = load(os.path.join(HERE, "golden", f"{case}_live.png"))
    ours = load(os.path.join(HERE, "out", f"ours_{case}.png"))
    h = min(live.shape[0], ours.shape[0]); w = min(live.shape[1], ours.shape[1])
    live = live[:h, :w]; ours = ours[:h, :w]
    D = live.mean(2) - ours.mean(2)
    print(f"\n===== {case} =====")
    smoothness(D, "D=live-ours")
    plane_fit(D, "D quadric")
    grid_report(D, "D")
    # per-channel D grid for channel-dependence (white veil: equal; colored veil: not)
    for ch, nm in enumerate("RGB"):
        grid_report(live[:, :, ch] - ours[:, :, ch], f"D_{nm}", 3)
    # save visualizations
    dn = np.clip(D + 128, 0, 255).astype(np.uint8)
    Image.fromarray(dn).save(os.path.join(HERE, "out", f"tmp_D_{case}.png"))
    lo = ours.mean(2); ll = live.mean(2)
    m = lo > 20
    r = np.zeros_like(lo); r[m] = np.clip(ll[m] / lo[m] * 63.75, 0, 255)
    Image.fromarray(r.astype(np.uint8)).save(os.path.join(HERE, "out", f"tmp_ratio_{case}.png"))
print("\nwrote out/tmp_D_*.png + out/tmp_ratio_*.png (D shifted +128, ratio scaled 2->255)")
