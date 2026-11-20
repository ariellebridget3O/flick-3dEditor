#!/usr/bin/env python3
"""r20_l1_sweep3.py — realistic body gain sweep at the PROVEN r19 T6b aim (308.66, 57.38)."""
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
BW, BH = 1016, 313


def cap(S, name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)


def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB")).astype(np.float32)


def luma(X):
    return X @ [0.299, 0.587, 0.114]


for i, cand in enumerate([60.0, 80.0, 100.0]):
    S = f"r20l3r{i}"
    ab.close(S); time.sleep(1)
    ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20l3r%d" % i)
    time.sleep(4.0)
    ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
    ab.eval_js(S, "location.reload()")
    time.sleep(5.5)
    ab.eval_js(S, """(function(){
      const a=window.__app;
      a.setLightCustom(128.66, 57.38);
      a.setHdr({enabled:true, bloom:0.0, exposure:1.0});
      a.setSkyStyle('realistic');
      return import('/editor/js/const.js').then(m => { m.C.HDR_REALISTIC_GAIN = %s; return 'g'; });
    })()""" % cand)
    time.sleep(4.5)
    # the PROVEN r19 T6b aim
    ab.eval_js(S, """(function(){
      const a=window.__app;
      const az=308.66*Math.PI/180, el=57.38*Math.PI/180;
      const d=[Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
      a.orbit.maxPolarAngle = Math.PI;
      a.camera.position.set(-d[0]*40, 40, -d[2]*40);
      a.orbit.target.set(a.camera.position.x+d[0]*60, a.camera.position.y+d[1]*60, a.camera.position.z+d[2]*60);
      a.orbit.enableDamping = false; a.orbit.update();
      a.renderFrame(); return 'aimed';
    })()""")
    time.sleep(0.9)
    tag = "l3r_" + str(int(cand))
    ab.eval_js(S, "(function(){ const a=window.__app; a.setHdr({enabled:true, bloom:0.0, exposure:1.0}); return 1; })()")
    time.sleep(1.6)
    cap(S, tag + "_b0.png")
    ab.eval_js(S, "(function(){ const a=window.__app; a.setHdr({enabled:true, bloom:0.35, exposure:1.0}); return 1; })()")
    time.sleep(1.6)
    cap(S, tag + "_on.png")
    B, N = luma(load(tag + "_b0.png")), luma(load(tag + "_on.png"))
    D = N - B
    sky = D[: int(BH * 0.55), :]
    floor = D[int(BH * 0.80):, :]
    skyN = N[: int(BH * 0.55), :]
    errs = ab.console_errors(S)
    print(f"gain {cand}: skyΔ={sky.mean():+.2f} b0top={B[:int(BH*0.55),:].mean():.0f} p99={np.percentile(skyN,99):.0f} p25Δ={np.percentile(D,25):+.2f} floorΔ={floor.mean():+.2f} lid={(np.abs(skyN-243.0)<=1.0).mean()*100:.2f}% errs={len(errs)}")
    ab.close(S)
