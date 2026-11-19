#!/usr/bin/env python3
"""r18 sky-feedback baseline probe — captures the user-visible states before any fix.

Arms (all synthetic_tracks, default light, plain render unless noted):
  A. layered clouds current look: clear/cloudy(rain) weathers, coverage .45 + .85
  B. interior-lighting delta: light.indoor, classic vs realistic -> whole-frame diff stats
  C. HDR bloom sensitivity (finish=1 session): threshold sweep 0.6/1.0/1.5/2.0 at bloom .35
     + bloom 0 reference -> where the sky stops blooming = its linear luminance bracket
     (both sky styles)
"""
import os
import sys
import time

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)
sys.path.insert(0, os.path.join(_HERE, "pixel_oracle"))
import ab
import numpy as np
from PIL import Image
from bb import capture_png

OUT = "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle/out"
os.makedirs(OUT, exist_ok=True)
BASE = "http://localhost:3000/editor/index.html"
S = "r18probe"


def png(p):
    return os.path.join(OUT, p)


BW, BH = 1016, 313   # headless drawing buffer (probe-verified this session)


def cap(s, name):
    capture_png(s, png(name), w=BW, h=BH)


def stats(a, b, label, rows=(0.0, 1.0)):
    A = np.asarray(Image.open(png(a)).convert("RGB")).astype(np.float32)
    B = np.asarray(Image.open(png(b)).convert("RGB")).astype(np.float32)
    h = A.shape[0]
    r0, r1 = int(h * rows[0]), int(h * rows[1])
    d = np.abs(A[r0:r1] - B[r0:r1]).mean(axis=2)
    print(f"  {label}: mean|d|={d.mean():6.2f}  p95={np.percentile(d, 95):6.2f}  max={d.max():5.0f}"
          f"  rows[{rows[0]:.0%}:{rows[1]:.0%}]")


def sky_region_mean(a):
    A = np.asarray(Image.open(png(a)).convert("RGB")).astype(np.float32)
    band = A[: int(A.shape[0] * 0.45)]
    return (band @ [0.299, 0.587, 0.114]).mean()


ab.close(S)
time.sleep(1)
# ---------- arms A + B: plain render session ----------
ab.open_url(S, f"{BASE}?scene=samples/synthetic_tracks.json&noAutosave=1&cloudsGate=0&v=r18p")
time.sleep(4)
ab.eval_js(S, "window.__app && window.__app.objectManager.humanoidRigs.size")

print("== arm A: layered current look ==")
for name, mutate in [
    ("A1_layered_clear_c45", "app.setClouds({enabled:true, mode:'layered', coverage:0.45}); app.setWeather('clear')"),
    ("A2_layered_clear_c85", "app.setClouds({enabled:true, mode:'layered', coverage:0.85})"),
    ("A3_layered_rain_c45", "app.setClouds({enabled:true, mode:'layered', coverage:0.45}); app.setWeather('rain')"),
    ("A4_proc_clear_c45", "app.setClouds({enabled:true, mode:'procedural', coverage:0.45}); app.setWeather('clear')"),
]:
    ab.eval_js(S, f"(function(){{ const app=window.__app; {mutate}; app.env.clouds().setStatic(true); return 1; }})()")
    time.sleep(1.6)   # LUT rebake 80ms + PMREM debounce 250ms + settle
    cap(S, f"r18_{name}.png")
    print(f"  captured {name}")

print("== arm B: interior delta classic vs realistic (indoor light) ==")
ab.eval_js(S, "(function(){ const app=window.__app; app.setClouds({enabled:false}); app.setWeather('clear'); app.setIndoor(true); return 1; })()")
time.sleep(1.0)
ab.eval_js(S, "window.__app.setSkyStyle('classic')")
time.sleep(1.2)
cap(S, "r18_B_classic_indoor.png")
ab.eval_js(S, "window.__app.setSkyStyle('realistic')")
time.sleep(2.5)   # full LUT + PMREM bake
cap(S, "r18_B_realistic_indoor.png")
stats("r18_B_classic_indoor.png", "r18_B_realistic_indoor.png", "indoor classic vs realistic")
stats("r18_B_classic_indoor.png", "r18_B_realistic_indoor.png", "  floor rows", rows=(0.6, 1.0))
# also outdoor shadow side (default light, no indoor): whole-frame + sky rows excluded
ab.eval_js(S, "(function(){ const app=window.__app; app.setIndoor(false); return 1; })()")
time.sleep(1.0)
ab.eval_js(S, "window.__app.setSkyStyle('classic')")
time.sleep(1.2)
cap(S, "r18_B_classic_outdoor.png")
ab.eval_js(S, "window.__app.setSkyStyle('realistic')")
time.sleep(2.5)
cap(S, "r18_B_realistic_outdoor.png")
stats("r18_B_classic_outdoor.png", "r18_B_realistic_outdoor.png", "outdoor classic vs realistic")
stats("r18_B_classic_outdoor.png", "r18_B_realistic_outdoor.png", "  ground rows", rows=(0.6, 1.0))
ab.close(S)
time.sleep(1)

# ---------- arm C: HDR bloom sensitivity (finish forced) ----------
print("== arm C: HDR bloom sensitivity ==")
ab.open_url(S, f"{BASE}?scene=samples/synthetic_tracks.json&noAutosave=1&v=r18h")
time.sleep(4)
ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
ab.eval_js(S, "location.reload()")
time.sleep(5)
for style in ("classic", "realistic"):
    ab.eval_js(S, f"window.__app.setSkyStyle('{style}')")
    time.sleep(2.2 if style == "realistic" else 1.2)
    ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:0.0, bloomThreshold:1.0, exposure:1.0})")
    time.sleep(1.2)
    cap(S, f"r18_C_{style}_bloom0.png")
    for thr in (0.6, 1.0, 1.5, 2.0):
        ab.eval_js(S, f"window.__app.setHdr({{enabled:true, bloom:0.35, bloomThreshold:{thr}, exposure:1.0}})")
        time.sleep(1.2)
        cap(S, f"r18_C_{style}_thr{thr}.png")
    ref = sky_region_mean(f"r18_C_{style}_bloom0.png")
    print(f"  {style}: sky-band luma bloom0={ref:.1f}")
    for thr in (0.6, 1.0, 1.5, 2.0):
        m = sky_region_mean(f"r18_C_{style}_thr{thr}.png")
        print(f"    thr {thr}: sky luma {m:6.1f}  (delta {m - ref:+6.1f})")
ab.eval_js(S, "(function(){ localStorage.removeItem('stage-finish'); localStorage.removeItem('stage-hdr'); return 1; })()")
ab.close(S)
print("done — outputs in scripts/pixel_oracle/out/r18_*")
