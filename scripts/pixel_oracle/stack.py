#!/usr/bin/env python3
"""stack.py — diagnostic 3-panel stack: live | ours | amplified diff.

Uses diff.py's loader (same auto-crop + canvas sizes) so the stack shows
exactly the pixels the metric sees. The diff panel is the per-pixel
mean-abs channel difference amplified (default ×20, clip 255) — faint
divergences become visible; the masks are NOT applied here (diagnostic
view: masked UI chrome shows up as constant bright bands — ignore them).

Usage:
  stack.py LIVE.png OURS.png OUT.png [--cameras] [AMP]
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import diff as D  # noqa: E402


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("live_png")
    ap.add_argument("ours_png")
    ap.add_argument("out_png")
    ap.add_argument("--cameras", action="store_true",
                    help="through-the-lens mode (805x452, no UI masks)")
    ap.add_argument("amp", nargs="?", type=int, default=20,
                    help="diff amplification (default 20)")
    args = ap.parse_args()

    size = D.CAMERAS_SIZE if args.cameras else D.SCENE_SIZE
    L = D.load_canvas(args.live_png, size, D.LIVE_CANVAS_OFF, None, "live")
    O = D.load_canvas(args.ours_png, size, D.OURS_CANVAS_OFF, None, "ours")
    d = np.abs(L - O).mean(axis=2)

    heat = np.clip(d.astype(np.float32) * args.amp, 0, 255).astype(np.uint8)
    diff_rgb = np.stack([heat, heat, heat], axis=2)
    sep = np.full((size[1], 4, 3), 255, dtype=np.uint8)
    stack = np.concatenate([L.astype(np.uint8), sep, O.astype(np.uint8),
                            sep, diff_rgb], axis=1)
    Image.fromarray(stack).save(args.out_png)
    print(f"{args.out_png}  live|ours|diff x{args.amp}  "
          f"(mean {d.mean():.3f}, >8px {(d > 8).sum()})")


if __name__ == "__main__":
    main()
