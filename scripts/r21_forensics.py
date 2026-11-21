#!/usr/bin/env python3
"""r21_forensics.py — reproduce the user's sky complaints against the r20 tree.

Arms (all aimed at a sky-heavy view, el +25 looking up):
  A1 classic + HDR off          -> sky mean (bloom baseline sanity)
  A2 classic + HDR on  b=0.35   -> BLACKOUT? (user: 'in HDR, blackout where skies are shown')
  A3 realistic + HDR off        -> sky mean (r20 body-gain 80 sanity)
  A4 realistic + HDR on b=0.35  -> BLACKOUT?
  A5 classic + clouds layered   -> blob look capture
  A6 realistic + clouds layered -> blob look capture
Plus: disc drag immediacy probe + console errors.
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
BASE = "http://localhost:3000/editor/index.html"
S = "r21foren"
BW, BH = 1016, 313

def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB"), dtype=np.float32)

def luma(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114

def sky_stats(name):
    a = load(name)
    h = a.shape[0]
    sky = luma(a[: h // 2])          # upper half = sky region at this aim
    full = luma(a)
    return dict(sky_mean=round(float(sky.mean()), 1),
                sky_p05=round(float(np.percentile(sky, 5)), 1),
                sky_black_frac=round(float((sky < 10).mean()), 3),
                full_mean=round(float(full.mean()), 1))

def aim_up(az=180, el=25):
    ab.eval_js(S, """(function(){
  const a=window.__app;
  const az=%f*Math.PI/180, el=%f*Math.PI/180;
  const d=[Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
  a.orbit.maxPolarAngle = Math.PI;
  a.camera.position.set(-d[0]*40, 40, -d[2]*40);
  a.orbit.target.set(a.camera.position.x+d[0]*60, a.camera.position.y+d[1]*60, a.camera.position.z+d[2]*60);
  a.orbit.enableDamping = false; a.orbit.update();
  a.renderFrame(); return 'aimed';
})()""" % (az, el))
    time.sleep(0.6)

def cap(name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)

# ---- boot fresh (finish flag cleared via fresh profile storage) ----
ab.close(S)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r21f")
time.sleep(7)
ab.eval_js(S, "(function(){window.__app.setHdr({enabled:false}); return 'hdr off';})()")
time.sleep(1.2)

R = {}
# A1 classic HDR off
ab.eval_js(S, "window.__app.setSkyStyle('classic')"); time.sleep(1.5)
aim_up(); cap("r21_A1_classic_hdr_off.png"); R["A1_classic_hdr_off"] = sky_stats("r21_A1_classic_hdr_off.png")
# A2 classic HDR on
ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:0.35, bloomThreshold:1.0, exposure:1.0})"); time.sleep(1.6)
cap("r21_A2_classic_hdr_on.png"); R["A2_classic_hdr_on"] = sky_stats("r21_A2_classic_hdr_on.png")
# A3 realistic HDR off
ab.eval_js(S, "window.__app.setHdr({enabled:false})"); time.sleep(1.2)
ab.eval_js(S, "window.__app.setSkyStyle('realistic')"); time.sleep(2.5)
cap("r21_A3_real_hdr_off.png"); R["A3_real_hdr_off"] = sky_stats("r21_A3_real_hdr_off.png")
# A4 realistic HDR on
ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:0.35, bloomThreshold:1.0, exposure:1.0})"); time.sleep(1.6)
cap("r21_A4_real_hdr_on.png"); R["A4_real_hdr_on"] = sky_stats("r21_A4_real_hdr_on.png")

# clouds (layered, defaults-ish coverage) — back to HDR off, both styles
ab.eval_js(S, "window.__app.setHdr({enabled:false})"); time.sleep(1.0)
ab.eval_js(S, "window.__app.setClouds({enabled:true, mode:'layered', coverage:0.45, density:1.0, cirrus:0.3})"); time.sleep(2.2)
ab.eval_js(S, "window.__app.setSkyStyle('classic')"); time.sleep(1.5)
aim_up(180, 12); cap("r21_A5_classic_clouds.png"); R["A5_classic_clouds"] = sky_stats("r21_A5_classic_clouds.png")
ab.eval_js(S, "window.__app.setSkyStyle('realistic')"); time.sleep(2.5)
cap("r21_A6_real_clouds.png"); R["A6_real_clouds"] = sky_stats("r21_A6_real_clouds.png")

# disc drag immediacy probe
drag = ab.eval_js(S, """(function(){
  const a=window.__app;
  const disc=document.getElementById('sunDir');
  if(!disc) return 'no disc';
  const r=disc.getBoundingClientRect();
  const cx=r.x+r.width/2, cy=r.y+r.height/2;
  const before=a.light ? a.light.azimuthDeg : (a.page&&a.page.light?a.page.light.azimuthDeg:null);
  const ev=(t,x,y,id)=>{disc.dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:x,clientY:y,bubbles:true,isPrimary:true,button:0,buttons:1}));};
  ev('pointerdown',cx,cy-10,991);
  ev('pointermove',cx+60,cy-10,991);   // drag toward E (right)
  const knob=document.getElementById('sunDirKnob');
  const kn=knob.getBoundingClientRect();
  const after=a.light ? a.light.azimuthDeg : (a.page&&a.page.light?a.page.light.azimuthDeg:null);
  ev('pointerup',cx+60,cy-10,991);
  return JSON.stringify({before, after, knobMoved: Math.abs(kn.x-cx)>8});
})()""")
R["disc_drag"] = drag

errs = ab.console_errors(S)
R["console_errors"] = errs[:5]
R["console_error_count"] = len(errs)

print(json.dumps(R, indent=1))
