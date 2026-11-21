#!/usr/bin/env python3
"""r23 L4 repro: night overbright meshes in the CC0 Living Room scene (sun below horizon).

The user: 'several mesh light up to that bright warm yellow tone... seems to be the sun,
when it is BELOW horizon, for some reason affecting some mesh. When the sun is above
horizon these abnormal lighten mesh go back to normal.'

Plan: load the scene, sweep elevation from day (+45) through night (-20) at fixed az,
capture at each step, measure per-region brightness; find meshes that GAIN brightness as
the sun sinks (anti-correlated with daylight).
"""
import os, sys, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab
from PIL import Image

S = "r23l4"
BASE = "http://localhost:3000/editor/index.html"
SCENE = "samples/upstream/scene_fdc2c6af-8996-4737-ac2d-0b7e9d49debe.json"

def ev(code, tmo=60):
    return ab.eval_js(S, code, timeout=tmo)

ab.close(S)
ab.open_url(S, BASE + f"?scene={SCENE}&noAutosave=1&v=r23l4")
time.sleep(9)

r = ev("(() => { const a = window.__app; return JSON.stringify({n: Object.keys(a.objects.all()).length, light: a.light ? {az: a.light.azimuthDeg, el: a.light.elevationDeg} : null}); })()")
print("boot:", r)

# The editor camera defaults somewhere; use the scene camera for the view? First: editor view.
# Sweep elevation at fixed azimuth, day -> night.
els = [45, 10, 0, -5, -10, -20, -30]
caps = {}
for el in els:
    ev(f"(() => {{ const a = window.__app; a.light.elevationDeg = {el}; a.light.azimuthDeg = 200; return 'set'; }})()")
    time.sleep(2.5)
    p = f"/tmp/render/l4_el{el:+d}.png"
    ab.screenshot(S, p)
    im = Image.open(p).convert("RGB")
    w, h = im.size
    # find the brightest pixels and count how many are VERY bright warm
    px = im.load()
    hot = 0
    warm_hot = 0
    maxv = 0
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            r_, g_, b_ = px[x, y]
            v = max(r_, g_, b_)
            if v > maxv: maxv = v
            if v > 240:
                hot += 1
                if r_ > 200 and g_ > 150 and b_ < r_ * 0.75:  # warm yellow
                    warm_hot += 1
    total = (w // 3) * (h // 3)
    caps[el] = {"max": maxv, "hot": hot, "warm_hot": warm_hot, "pct": round(100.0 * warm_hot / total, 2)}
    print(f"el={el:+d}: max={maxv} hot={hot} warm_hot={warm_hot} ({caps[el]['pct']}%)")

ev("window.__app.light.elevationDeg = 45")
ab.close(S)
print(json.dumps(caps))
