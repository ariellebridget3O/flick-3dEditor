#!/usr/bin/env python3
"""diff.py — masked pixel diff between a live capture and our capture.

Metric (matches the r11 session's numbers — M2 = 99.30% ≤8, mean 0.354):
  * per-pixel difference = mean absolute channel difference (RGB averaged),
    NOT the max channel (max-channel gives mean 0.774 on the same pair).
  * UI masks exclude chrome pixels that only exist on one side:
      live:  left toolbar x<41
      ours:  bottom-left (x<160, y>300), right edge x>950,
             nav ball (900<x<990, 15<y<60)
    (--cameras mode: NO masks — the through-the-lens feed is clean.)
  * blobs: 4-connected components of per-pixel diff>8 with area>25px,
    computed on the masked image. (M2 residuals: 2 blobs ≈ label-chip text
    AA + a soft wall luminance drift — accepted divergences.)
  * PASS: masked mean ≤ 1.0 AND masked %≤8 ≥ 97.0  (M2: 0.354 / 99.30)

Inputs may be full screenshots OR pre-cropped canvas images. Auto-crop:
if the image is already the target canvas size (1000x375 scene / 805x452
cameras) it is used as-is; otherwise it is cropped at the known canvas
offset (live (0,75), ours (0,88)) — override with --live-rect/--ours-rect.

Exit code: 0 = PASS, 1 = FAIL, 2 = usage/error.
"""
import argparse
import json
import sys
from collections import deque

import numpy as np
from PIL import Image

SCENE_SIZE = (1000, 375)    # w,h
CAMERAS_SIZE = (805, 452)
LIVE_CANVAS_OFF = (0, 75)   # full-screenshot offset of the live canvas
OURS_CANVAS_OFF = (0, 88)   # full-screenshot offset of our canvas

MEAN_MAX = 1.0
P8_MIN = 97.0

# UI masks (canvas-relative px) — which side each region belongs to
MASK_LIVE = [("live left toolbar", lambda X, Y: X < 41)]
MASK_OURS = [
    ("ours bottom-left", lambda X, Y: (X < 160) & (Y > 300)),
    ("ours right edge", lambda X, Y: X > 950),
    ("ours nav ball", lambda X, Y: (X > 900) & (X < 990) & (Y > 15) & (Y < 60)),
]


def load_canvas(path, size, default_off, rect_override=None, side=""):
    """Load a PNG as a canvas crop of `size`. Full screenshots are cropped
    at the known offset; already-cropped images pass through."""
    im = Image.open(path).convert("RGB")
    W, H = size
    if im.size == (W, H):
        return np.asarray(im, dtype=np.int16)
    if rect_override:
        x, y, w, h = rect_override
        if (w, h) != (W, H):
            raise SystemExit(f"{side} rect override {rect_override} != canvas {size}")
    else:
        x, y = default_off
        if im.size[0] < x + W or im.size[1] < y + H:
            raise SystemExit(
                f"{side} image {im.size} too small for canvas {size} at offset {(x, y)} "
                f"— pass --{'live' if side == 'live' else 'ours'}-rect x,y,w,h")
    return np.asarray(im.crop((x, y, x + W, y + H)), dtype=np.int16)


def build_mask(size, cameras):
    """Boolean mask of EXCLUDED pixels (live mask ∪ ours mask)."""
    if cameras:
        return np.zeros(size[::-1], dtype=bool), []
    H, W = size[1], size[0]
    X, Y = np.meshgrid(np.arange(W), np.arange(H))
    mask = np.zeros((H, W), dtype=bool)
    used = []
    for _, fn in MASK_LIVE + MASK_OURS:
        m = fn(X, Y)
        if m.any():
            mask |= m
            used.append(_)
    return mask, used


def blobs(diff, excluded, thr=8, min_area=25):
    """4-connected components of diff>thr (masked pixels force-broken),
    area > min_area. Returns [(area, x0, y0, x1, y1), ...] descending."""
    bad = (diff > thr) & (~excluded)
    H, W = bad.shape
    seen = np.zeros_like(bad, dtype=bool)
    out = []
    for sy in range(H):
        row = bad[sy]
        for sx in np.nonzero(row & ~seen[sy])[0]:
            if seen[sy, sx]:
                continue
            # BFS
            q = deque([(sy, sx)])
            seen[sy, sx] = True
            area = 0
            x0 = x1 = sx
            y0 = y1 = sy
            while q:
                y, x = q.popleft()
                area += 1
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < H and 0 <= nx < W and bad[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            if area > min_area:
                out.append((area, x0, y0, x1, y1))
    out.sort(reverse=True)
    return out


def compare(live_png, ours_png, cameras=False, live_rect=None, ours_rect=None):
    size = CAMERAS_SIZE if cameras else SCENE_SIZE
    L = load_canvas(live_png, size, LIVE_CANVAS_OFF, live_rect, "live")
    O = load_canvas(ours_png, size, OURS_CANVAS_OFF, ours_rect, "ours")
    mask, used_masks = build_mask(size, cameras)
    # per-pixel mean-abs channel diff (the metric that reproduces 0.354/99.30)
    D = np.abs(L - O).mean(axis=2)
    dm = D[~mask]
    stats = {
        "mode": "cameras" if cameras else "scene",
        "canvas": f"{size[0]}x{size[1]}",
        "masks": used_masks,
        "n_compared": int(dm.size),
        "n_excluded": int(mask.sum()),
        "mean": round(float(dm.mean()), 4),
        "p_le8": round(float((dm <= 8).mean() * 100), 2),
        "p_le24": round(float((dm <= 24).mean() * 100), 2),
        "blobs": [
            {"px": int(a), "bbox": [int(x0), int(y0), int(x1), int(y1)]}
            for a, x0, y0, x1, y1 in blobs(D, mask)
        ],
    }
    stats["pass"] = bool(stats["mean"] <= MEAN_MAX and stats["p_le8"] >= P8_MIN)
    return stats


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("live_png")
    ap.add_argument("ours_png")
    ap.add_argument("--cameras", action="store_true",
                    help="through-the-lens mode: no UI masks (the feed is clean)")
    ap.add_argument("--live-rect", help="canvas crop rect x,y,w,h in the LIVE image")
    ap.add_argument("--ours-rect", help="canvas crop rect x,y,w,h in OUR image")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    ap.add_argument("--mean-max", type=float, default=MEAN_MAX)
    ap.add_argument("--p8-min", type=float, default=P8_MIN)
    args = ap.parse_args()

    def parse_rect(s):
        if not s:
            return None
        return tuple(int(v) for v in s.split(","))

    stats = compare(args.live_png, args.ours_png, cameras=args.cameras,
                    live_rect=parse_rect(args.live_rect),
                    ours_rect=parse_rect(args.ours_rect))
    stats["pass"] = bool(stats["mean"] <= args.mean_max and stats["p_le8"] >= args.p8_min)

    if args.json:
        print(json.dumps(stats))
    else:
        print(f"mode           : {stats['mode']}  canvas {stats['canvas']}")
        print(f"masks          : {', '.join(stats['masks']) or 'NONE (cameras)'}"
              f"  (excluded {stats['n_excluded']} px, compared {stats['n_compared']})")
        print(f"mean           : {stats['mean']:.4f} / 255   (threshold ≤ {args.mean_max})")
        print(f"%≤8            : {stats['p_le8']:.2f}        (threshold ≥ {args.p8_min})")
        print(f"%≤24           : {stats['p_le24']:.2f}")
        bl = stats["blobs"]
        print(f"blobs >25px    : {len(bl)}"
              + ("" if bl else "   (none)"))
        for b in bl:
            print(f"  - {b['px']} px  bbox x{b['bbox'][0]}-{b['bbox'][2]} y{b['bbox'][1]}-{b['bbox'][3]}")
        print(f"RESULT         : {'PASS' if stats['pass'] else 'FAIL'}")
    sys.exit(0 if stats["pass"] else 1)


if __name__ == "__main__":
    main()
