#!/usr/bin/env python3
"""r20_l1_sweep2.py — L1 sky-bloom sweep, robust harness.

Per-style FRESH sessions (no cross-arm state), explicit light reset + state verification
before every capture (SKILL #88 discipline), r19 capture idiom (hdr always enabled, bloom
0.0 vs 0.35), finish forced via localStorage BEFORE load.
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
BW, BH = 1016, 313


def cap(S, name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)


def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB")).astype(np.float32)


def luma(X):
    return X @ [0.299, 0.587, 0.114]


def boot(S, v, style, gain_prop, gain_val):
    """Fresh session: finish pref BEFORE load, explicit day light, style, gain, verify."""
    ab.close(S); time.sleep(1)
    ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=" + v)
    time.sleep(4.0)
    ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
    ab.eval_js(S, "location.reload()")
    time.sleep(5.5)
    r = ab.eval_js(S, """(function(){
      const a=window.__app;
      a.setLightCustom(128.66, 57.38);           // explicit DAY reset (fixture default)
      a.setHdr({enabled:true, bloom:0.0, exposure:1.0});
      a.setSkyStyle('""" + style + """');
      return import('/editor/js/const.js').then(m => { m.C.""" + gain_prop + """ = """ + str(gain_val) + """;
        return JSON.stringify({el: a.light.elevationDeg, style: a.light.skyStyle, gain: m.C.""" + gain_prop + """});
      });
    })()""")
    time.sleep(2.0 if style == "classic" else 4.0)
    return r


def aim(S):
    ab.eval_js(S, """(function(){
      const a=window.__app;
      const az = 308.66 * Math.PI/180, el = 38 * Math.PI/180;
      const d = [Math.sin(az)*Math.cos(el), Math.sin(el), -Math.cos(az)*Math.cos(el)];
      a.orbit.maxPolarAngle = Math.PI;
      a.camera.position.set(-d[0]*40, 40, -d[2]*40);
      a.orbit.target.set(a.camera.position.x + d[0]*60, a.camera.position.y + d[1]*60, a.camera.position.z + d[2]*60);
      a.orbit.enableDamping = false; a.orbit.update();
      a.renderFrame(); return 'aimed';
    })()""")
    time.sleep(0.8)


def verify(S, style):
    r = ab.eval_js(S, """(function(){
      const a=window.__app;
      const env=a.env;
      let domeInfo='';
      if('""" + style + """'==='realistic'){ const d=env.realisticSky()._debug; domeInfo='lut:'+d.lutDirty; }
      const fin = env.getFinishOn ? env.getFinishOn() : null;
      return JSON.stringify({style:a.light.skyStyle, el:a.light.elevationDeg, finish:fin, hdr:!!a.light.hdr, domeInfo});
    })()""")
    return r


def measure(S, tag):
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
    return {
        "sky_mean": float(sky.mean()), "sky_p99": float(np.percentile(skyN, 99)),
        "p25": float(np.percentile(D, 25)), "floor": float(floor.mean()),
        "lid": float((np.abs(skyN - 243.0) <= 1.0).mean() * 100),
        "b0_top": float(B[: int(BH * 0.55), :].mean()),
        "on_top": float(N[: int(BH * 0.55), :].mean()),
        "errs": ab.console_errors(S),
    }


def main():
    print("=== classic dome-only body gain (HDR_CLASSIC_BODY_GAIN; fog stays at lift 1.06) ===")
    for i, cand in enumerate([1.14, 1.16, 1.18, 1.20, 1.22]):
        S = f"r20l2c{i}"
        boot(S, f"r20l1c{i}", "classic", "HDR_CLASSIC_BODY_GAIN", cand)
        aim(S)
        st = verify(S, "classic")
        r = measure(S, f"l2c_{str(cand).replace('.','')}")
        print(f"gain {cand}: skyΔ={r['sky_mean']:+.2f} b0top={r['b0_top']:.0f}→{r['on_top']:.0f} p99={r['sky_p99']:.0f} p25Δ={r['p25']:+.2f} floorΔ={r['floor']:+.2f} lid%={r['lid']:.2f} errs={len(r['errs'])} st={st}")
        ab.close(S)

    print("=== realistic HDR_REALISTIC_GAIN (gradient body — partial crossing) ===")
    for i, cand in enumerate([1.45, 1.55, 1.65]):
        S = f"r20l2r{i}"
        boot(S, f"r20l1r{i}", "realistic", "HDR_REALISTIC_GAIN", cand)
        aim(S)
        st = verify(S, "realistic")
        r = measure(S, f"l2r_{str(cand).replace('.','')}")
        print(f"gain {cand}: skyΔ={r['sky_mean']:+.2f} b0top={r['b0_top']:.0f}→{r['on_top']:.0f} p99={r['sky_p99']:.0f} p25Δ={r['p25']:+.2f} floorΔ={r['floor']:+.2f} lid%={r['lid']:.2f} errs={len(r['errs'])} st={st}")
        ab.close(S)


if __name__ == "__main__":
    main()
