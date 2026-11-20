#!/usr/bin/env python3
"""r20_l1_sweep.py — L1 sky-bloom recalibration sweep.

Measures, per candidate HDR_SKY_LIFT (classic) / HDR_REALISTIC_GAIN (realistic), at a
sky-aimed pose (r19 idiom), through the finish+ACES output transform:
  - sky-region bloom delta (rows 0..55%) — target +2..+8
  - whole-frame p25 delta — wash guard <= +2
  - floor-region delta (rows 80..100%) — wash guard <= +1.5
  - sky-region p99 + flat-lid fraction (luma in [242,244]) — no ACES lid
Runtime constant overrides: C.HDR_SKY_LIFT / C.HDR_REALISTIC_GAIN mutated in-page (both are
read per-apply/per-frame in env.js:342 / sky.js:807).
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab
import numpy as np
from PIL import Image
from bb import capture_png

OUT = "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle/out"
os.makedirs(OUT, exist_ok=True)
BASE = "http://localhost:3000/editor/index.html"
S = "r20l1"
BW, BH = 1016, 313

AIM_UP = """(function(){
  const a=window.__app;
  a.orbit.maxPolarAngle = Math.PI; a.orbit.enableDamping = false;
  a.camera.position.set(0, 26, 0);
  a.orbit.target.set(58, 46, -20);
  a.orbit.update();
  return 'aimed';
})()"""

AIM_AT_SUN_OPPOSITE = """(function(){
  const a=window.__app;
  const az = 308.66 * Math.PI/180, el = 38 * Math.PI/180;
  const d = [Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
  a.orbit.maxPolarAngle = Math.PI;
  a.camera.position.set(-d[0]*40, 40, -d[2]*40);
  a.orbit.target.set(a.camera.position.x + d[0]*60, a.camera.position.y + d[1]*60, a.camera.position.z + d[2]*60);
  a.orbit.enableDamping = false; a.orbit.update();
  a.renderFrame(); return 'aimed-body';
})()"""


def cap(name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)


def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB")).astype(np.float32)


def luma(X):
    return X @ [0.299, 0.587, 0.114]


def set_const(prop, val):
    # const.js is a module — mutate through a dynamic import (same module instance the app uses)
    ab.eval_js(S, f"""(function(){{
      return import('/editor/js/const.js').then(m => {{ m.C.{prop} = {val}; return 'set {prop}={val}'; }});
    }})()""")
    time.sleep(0.3)


def rekey():
    """Force applyDaylight re-run after a constant change (bloom re-key the memo)."""
    ab.eval_js(S, """(function(){
      const a=window.__app;
      a.setHdr({enabled:true, bloom:0.0, exposure:1.0});
      a.setHdr({enabled:true, bloom:0.01, exposure:1.0});
      a.setHdr({enabled:true, bloom:0.0, exposure:1.0});
      return 1;
    })()""")
    time.sleep(0.5)


def measure(style, cand, is_gain=False):
    prop = "HDR_REALISTIC_GAIN" if is_gain else "HDR_CLASSIC_BODY_GAIN"
    ab.eval_js(S, f"window.__app.setSkyStyle('{style}')")
    time.sleep(1.2 if style == "classic" else 3.2)
    ab.eval_js(S, AIM_AT_SUN_OPPOSITE)
    time.sleep(0.8)
    set_const(prop, cand)
    rekey()
    tag = f"l1_{style[:4]}_{str(cand).replace('.','')}"
    # r19 idiom: hdr stays ENABLED; bloom 0.0 vs 0.35 — same composite path/exposure/RTs,
    # only the bloom contribution differs (toggling enabled rebuilds the graph + auto-measure)
    ab.eval_js(S, "(function(){ const a=window.__app; a.setHdr({enabled:true, bloom:0.0, exposure:1.0}); return 1; })()")
    time.sleep(1.5)
    cap(tag + "_b0.png")
    ab.eval_js(S, "(function(){ const a=window.__app; a.setHdr({enabled:true, bloom:0.35, exposure:1.0}); return 1; })()")
    time.sleep(1.5)
    cap(tag + "_on.png")
    B, N = luma(load(tag + "_b0.png")), luma(load(tag + "_on.png"))
    D = N - B
    sky = D[: int(BH * 0.55), :]
    floor = D[int(BH * 0.80):, :]
    skyN = N[: int(BH * 0.55), :]
    p25 = float(np.percentile(D, 25))
    lid = float((np.abs(skyN - 243.0) <= 1.0).mean() * 100)
    return {
        "sky_mean": float(sky.mean()), "sky_p99": float(np.percentile(skyN, 99)),
        "p25": p25, "floor": float(floor.mean()), "lid_pct": lid,
    }


def main():
    ab.close(S); time.sleep(1)
    ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20l1a")
    time.sleep(4.5)
    ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
    ab.eval_js(S, "location.reload()")
    time.sleep(5.5)
    ab.eval_js(S, AIM_UP)
    time.sleep(0.8)

    print("=== classic HDR_SKY_LIFT sweep (sun az 128.66 el 57.38; aim anti-solar) ===")
    # aim away from the sun: target roughly opposite az (128.66+180=308) elevated
    ab.eval_js(S, """(function(){
      const a=window.__app;
      a.orbit.maxPolarAngle = Math.PI; a.orbit.enableDamping = false;
      const az = 308.66 * Math.PI/180, el = 38 * Math.PI/180;
      const d = [Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
      a.camera.position.set(-d[0]*40, 40, -d[2]*40);
      a.orbit.target.set(a.camera.position.x + d[0]*60, 40 + d[1]*60, a.camera.position.z + d[2]*60);
      a.orbit.update(); return 'aimed-body';
    })()""")
    time.sleep(0.6)
    for cand in [1.14, 1.18, 1.22, 1.28, 1.34]:
        r = measure("classic", cand)
        print(f"lift {cand}: skyΔ={r['sky_mean']:+.2f} p99={r['sky_p99']:.0f} p25Δ={r['p25']:+.2f} floorΔ={r['floor']:+.2f} lid%={r['lid_pct']:.2f}")

    print("=== realistic HDR_REALISTIC_GAIN sweep (same aim) ===")
    for cand in [1.40, 1.55, 1.70]:
        r = measure("realistic", cand, is_gain=True)
        print(f"gain {cand}: skyΔ={r['sky_mean']:+.2f} p99={r['sky_p99']:.0f} p25Δ={r['p25']:+.2f} floorΔ={r['floor']:+.2f} lid%={r['lid_pct']:.2f}")

    ab.close(S)


if __name__ == "__main__":
    main()
