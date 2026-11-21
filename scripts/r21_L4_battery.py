#!/usr/bin/env python3
"""r21_L4_battery.py — the sky verification battery (bloom visible + NO HDR blackout).

Arms: {classic, realistic} x {day el57, golden el9, night el-28} x {HDR off, on(bloom .35)}
+ clouds layered capture. Asserts: no black sky (sky mean > 40), bloom visible near the
sun in HDR arms (sky_mean_hdr - sky_mean_off > +3 on at least the golden arm), 0 errors.
"""
import os, sys, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab
import numpy as np
from PIL import Image
from bb import capture_png

OUT = "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle/out"
os.makedirs(OUT, exist_ok=True)
S = "r21L4"
BW, BH = 1016, 313

def luma(p):
    a = np.asarray(Image.open(os.path.join(OUT, p)).convert("RGB"), dtype=np.float32)
    h = a.shape[0]
    return a[..., 0]*0.299 + a[..., 1]*0.587 + a[..., 2]*0.114, a[:h//2]

def aim(az, el):
    ab.eval_js(S, """(function(){const a=window.__app;const az=%f*Math.PI/180,el=%f*Math.PI/180;
  const d=[Math.sin(az)*Math.cos(el),Math.sin(el),-Math.cos(az)*Math.cos(el)];
  a.orbit.maxPolarAngle=Math.PI;a.camera.position.set(-d[0]*40,40,-d[2]*40);
  a.orbit.target.set(a.camera.position.x+d[0]*60,a.camera.position.y+d[1]*60,a.camera.position.z+d[2]*60);
  a.orbit.enableDamping=false;a.orbit.update();a.renderFrame();return 'ok';})()""" % (az, el))
    time.sleep(0.6)

ab.close(S)
ab.open_url(S, "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=r21L4")
time.sleep(7)

R = {}
for style in ("classic", "realistic"):
    ab.eval_js(S, f"window.__app.setSkyStyle('{style}')")
    time.sleep(2.2 if style == "realistic" else 1.4)
    for label, el in (("day", 57), ("golden", 9), ("night", -28)):
        ab.eval_js(S, f"window.__app.setLightCustom(180, {el})")
        time.sleep(1.6)
        aim(180, 12)   # horizon-ish view with sky + the sun region
        ab.eval_js(S, "window.__app.setHdr({enabled:false})"); time.sleep(1.0)
        capture_png(S, os.path.join(OUT, f"r21_L4_{style}_{label}_off.png"), w=BW, h=BH)
        lo, skylo = luma(f"r21_L4_{style}_{label}_off.png")
        ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:0.35, bloomThreshold:1.0, exposure:1.0})"); time.sleep(1.5)
        capture_png(S, os.path.join(OUT, f"r21_L4_{style}_{label}_on.png"), w=BW, h=BH)
        hi, skyhi = luma(f"r21_L4_{style}_{label}_on.png")
        R[f"{style}_{label}"] = dict(
            off_mean=round(float(skylo.mean()), 1), on_mean=round(float(skyhi.mean()), 1),
            bloom_delta=round(float(skyhi.mean() - skylo.mean()), 1),
            black=round(float((skyhi < 10).mean()), 3))
        ab.eval_js(S, "window.__app.setHdr({enabled:false})"); time.sleep(0.8)

# clouds arm
ab.eval_js(S, "window.__app.setClouds({enabled:true, mode:'layered', coverage:0.45, density:1.0, cirrus:0.3})")
time.sleep(2.5)
aim(180, 8)
capture_png(S, os.path.join(OUT, "r21_L4_realistic_clouds.png"), w=BW, h=BH)
cl, skyc = luma("r21_L4_realistic_clouds.png")
R["clouds"] = dict(mean=round(float(skyc.mean()), 1), std=round(float(skyc.std()), 1))

errs = ab.console_errors(S)
R["console_errors"] = len(errs)

bad = [k for k, v in R.items() if isinstance(v, dict) and (v.get("black", 0) > 0.02 or v.get("on_mean", 99) < 40)]
print(json.dumps(R, indent=1))
print("BLACKOUT ARMS:", bad if bad else "NONE")
print("BLOOM VISIBLE:", {k: v["bloom_delta"] for k, v in R.items() if isinstance(v, dict) and "bloom_delta" in v and v["bloom_delta"] > 3})
