#!/usr/bin/env python3
"""r19_light_e2e.py — round-19 light/HDR feedback regression suite.

Covers the five r19 layers:
  T1  L1 indoor sun ALIVE (intensity == outdoor value, castShadow) — the (indoor?0:1) kill is gone
  T2  L1 window shaft follows the sun azimuth (room fixture: az through-window vs solid-wall
      differ; floor bright fraction shifts)
  T3  L2 realistic night keyDir == uMoonDir (dot > 0.999) + color lerped to the moon tone
  T4  L2 classic night keyDir UNCHANGED (== remapped sunDirection — the byte-exact live path)
  T5  L2 dusk sweep el 10..-30 (realistic): keyDir finite, y >= 0.05, no >25deg jump while the
      key intensity >= 0.1 (the slide lives inside the intensity trough)
  T6  L4 sky body does NOT bloom (classic + realistic, default pose, |delta| < 2 at thr 1.0)
  T7  L4 realistic sun + moon DO bloom (ring/core deltas at the aimed discs: sun core > +20,
      moon ring > +5)
  T8  L5 indoor IBL == 0 (survives a style re-click); outdoor == 0.30
  T9  L5 interior delta classic<->realistic INDOOR ~ 0 (both styles no IBL indoors)
  T10 console errors == 0
"""
import json
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
S = "r19e2e"
BW, BH = 1016, 313
RESULTS = []

def cap(name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)

def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + ("  — " + detail if detail else ""))

def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB")).astype(np.float32)

def luma(X):
    return X @ [0.299, 0.587, 0.114]

# high-vantage aim at a world az/el (maxPolarAngle pre-cleared — the stale boot-pose clamp
# eats fresh aims otherwise; camera y=40 keeps it outside scene figures at the origin)
def aim(az, el):
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

def set_hdr(bloom, thr=1.0):
    ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:%s, bloomThreshold:%s, exposure:1.0})" % (bloom, thr))
    time.sleep(1.4)

# ============ Session A: plain, synthetic_tracks — state arms (T1, T3, T4, T5, T8) ============
ab.close(S); time.sleep(1)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r19e2e")
time.sleep(4.5)

# T1: indoor sun alive
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  a.setLightCustom(128.66, 57.38);
  a.setIndoor(false); a.env.applyDaylight(a.light);
  const out = {};
  let sun=null; a.scene.traverse(function(o){ if (o.type==='DirectionalLight') sun=o; });
  out.outdoorI = +sun.intensity.toFixed(3);
  a.setIndoor(true); a.env.applyDaylight(a.light);
  out.indoorI = +sun.intensity.toFixed(3);
  out.indoorCast = !!sun.castShadow;
  out.indoorVis = !!sun.visible;
  a.setIndoor(false);
  return JSON.stringify(out);
})()""")
d = json.loads(r)
check("T1 indoor sun ALIVE (== outdoor intensity, casting)", d["indoorI"] > 0 and abs(d["indoorI"] - d["outdoorI"]) < 1e-9 and d["indoorCast"] and d["indoorVis"],
      f"outdoor={d['outdoorI']} indoor={d['indoorI']} cast={d['indoorCast']} (pre-r19 indoor was 0)")

# T3/T4: night key direction sync
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  const out = {};
  const kd = function(){ const k=a.env.keyDirection; return [k.x,k.y,k.z]; };
  const norm = function(v){ const n=Math.hypot(v[0],v[1],v[2]); return v.map(x=>x/n); };
  // classic night (byte-exact remap)
  a.setSkyStyle('classic'); a.setLightCustom(0, -30); a.env.applyDaylight(a.light);
  const az=0*Math.PI/180;
  const elR=(25-(-30))*Math.PI/180;
  out.classicDir = norm(kd()).map(v=>+v.toFixed(3));
  out.classicExpect = [Math.sin(az)*Math.cos(elR), Math.sin(elR), -Math.cos(az)*Math.cos(elR)].map(v=>+v.toFixed(3));
  let sun=null; a.scene.traverse(function(o){ if (o.type==='DirectionalLight') sun=o; });
  out.classicCol = '#'+sun.color.getHexString();
  // realistic night (moonlight)
  a.setSkyStyle('realistic'); a.env.applyDaylight(a.light);
  let md=null; a.scene.traverse(function(o){ if (o.material && o.material.uniforms && o.material.uniforms.uMoonDir) md=o.material.uniforms.uMoonDir.value.toArray(); });
  out.moonUniform = md.map(v=>+v.toFixed(3));
  out.realDir = norm(kd()).map(v=>+v.toFixed(3));
  out.dot = out.realDir[0]*md[0]+out.realDir[1]*md[1]+out.realDir[2]*md[2];
  out.realCol = '#'+sun.color.getHexString();
  return JSON.stringify(out);
})()""")
d = json.loads(r)
cd = max(abs(a - b) for a, b in zip(d["classicDir"], d["classicExpect"]))
check("T4 classic night keyDir == remapped sunDirection (unchanged)", cd < 0.005,
      f"dir={d['classicDir']} expect={d['classicExpect']} col={d['classicCol']}")
check("T3 realistic night keyDir == uMoonDir (moonlight sync)", d["dot"] > 0.999,
      f"dot={d['dot']:.4f} dir={d['realDir']} moon={d['moonUniform']} col={d['realCol']}")

# T5: dusk sweep (realistic)
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  a.setSkyStyle('realistic');
  const steps = [];
  let sun=null; a.scene.traverse(function(o){ if (o.type==='DirectionalLight') sun=o; });
  for (let el = 10; el >= -30; el -= 2) {
    a.setLightCustom(0, el); a.env.applyDaylight(a.light);
    const k = a.env.keyDirection;
    steps.push({el: el, y: +k.y.toFixed(3), i: +sun.intensity.toFixed(3)});
  }
  return JSON.stringify(steps);
})()""")
steps = json.loads(r)
ok5 = all(s["y"] >= 0.049 and abs(s["y"]) <= 1 for s in steps)
jumps = []
for i in range(1, len(steps)):
    if steps[i]["i"] >= 0.1 and steps[i-1]["i"] >= 0.1:
        dy = abs(steps[i]["y"] - steps[i-1]["y"])
        if dy > 0.42:  # ~25deg in y-component between 2deg steps while the key is lit
            jumps.append((steps[i-1]["el"], steps[i]["el"], round(dy, 3)))
check("T5 dusk sweep: keyDir.y floored >= 0.05, no >25deg jump while lit", ok5 and not jumps,
      f"y-range [{min(s['y'] for s in steps):.2f},{max(s['y'] for s in steps):.2f}] jumps={jumps}")

# T8: IBL indoor/outdoor split (+ the style re-click race)
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  const out = {};
  a.setLightCustom(128.66, 57.38);
  a.setSkyStyle('realistic'); a.env.applyDaylight(a.light);
  out.outdoor = a.scene.environmentIntensity;
  a.setIndoor(true); a.env.applyDaylight(a.light);
  out.indoor = a.scene.environmentIntensity;
  a.setSkyStyle('realistic');   // re-click the ACTIVE style (the r18 P1-1 race)
  out.reclick = a.scene.environmentIntensity;
  a.setIndoor(false); a.env.applyDaylight(a.light);
  out.backOutdoor = a.scene.environmentIntensity;
  a.setSkyStyle('classic');
  return JSON.stringify(out);
})()""")
d = json.loads(r)
check("T8 IBL split: outdoor 0.30 / indoor 0 (survives re-click)", abs(d["outdoor"] - 0.30) < 1e-6 and d["indoor"] == 0 and d["reclick"] == 0 and abs(d["backOutdoor"] - 0.30) < 1e-6,
      json.dumps(d))

# ============ Session B: plain, room fixture — T2 shaft ============
ab.close(S); time.sleep(1)
ab.open_url(S, BASE + "?scene=samples/r19_room.json&noAutosave=1&v=r19e2eb")
time.sleep(4.5)
ab.eval_js(S, """(function(){
  const a=window.__app;
  a.camera.position.set(0, 1.6, -3.2);
  a.orbit.target.set(0, 1.6, 4);
  a.orbit.maxPolarAngle = Math.PI;
  a.orbit.enableDamping = false;
  a.orbit.update();
  a.setIndoor(true);
  a.renderFrame(); return 'aimed';
})()""")
time.sleep(1.0)
for az, name in ((180, "r19_T2_in.png"), (0, "r19_T2_blocked.png")):
    ab.eval_js(S, "(function(){const a=window.__app; a.setLightCustom(%d, 35); return 'set';})()" % az)
    time.sleep(1.2)
    cap(name)
A, C = luma(load("r19_T2_in.png")), luma(load("r19_T2_blocked.png"))
d2 = np.abs(A - C).mean()
floor_in = (A[int(BH*0.60):] > 200).mean()
floor_bl = (C[int(BH*0.60):] > 200).mean()
check("T2 window shaft follows the sun azimuth (through vs blocked)", d2 > 4.0 and floor_in > floor_bl + 0.03,
      f"mean|d|={d2:.2f} floor>200: {floor_in*100:.0f}% vs {floor_bl*100:.0f}%")

# ============ Session C: finish forced — T6/T7/T9 ============
ab.close(S); time.sleep(1)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r19e2ec")
time.sleep(4.5)
ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
ab.eval_js(S, "location.reload()")
time.sleep(5.5)

# default pose
ab.eval_js(S, """(function(){
  const a=window.__app;
  a.camera.position.set(6, 5, 8); a.orbit.target.set(0, 1, 0);
  a.orbit.maxPolarAngle = Math.PI; a.orbit.enableDamping = false; a.orbit.update();
  return 'default';
})()""")
time.sleep(0.6)

# T6a classic body
ab.eval_js(S, "window.__app.setSkyStyle('classic')"); time.sleep(1.5)
set_hdr(0.0); cap("r19_T6_c_b0.png")
set_hdr(0.35); cap("r19_T6_c_t10.png")
d6 = (luma(load("r19_T6_c_t10.png")) - luma(load("r19_T6_c_b0.png"))).mean()
check("T6a classic sky body no bloom (|d| < 2)", abs(d6) < 2.0, f"{d6:+.2f}")

# T6b realistic body (anti-sun aim)
ab.eval_js(S, "window.__app.setSkyStyle('realistic')"); time.sleep(2.5)
aim(308.66, 57.38)
set_hdr(0.0); cap("r19_T6_r_b0.png")
set_hdr(0.35); cap("r19_T6_r_t10.png")
d6r = (luma(load("r19_T6_r_t10.png")) - luma(load("r19_T6_r_b0.png"))).mean()
check("T6b realistic sky body no bloom (|d| < 2)", abs(d6r) < 2.0, f"{d6r:+.2f}")

# T7a realistic sun disc (midday, at the sun)
aim(128.66, 57.38)
set_hdr(0.0); cap("r19_T7_sun_b0.png")
set_hdr(0.35); cap("r19_T7_sun_t10.png")
S0, S1 = luma(load("r19_T7_sun_b0.png")), luma(load("r19_T7_sun_t10.png"))
yy, xx = np.mgrid[0:BH, 0:BW]
rad = np.sqrt((yy - BH//2)**2 + (xx - BW//2)**2)
core_d = (S1 - S0)[rad < 12].mean()
check("T7a realistic sun disc blooms (core delta > +20)", core_d > 20, f"core={core_d:+.1f}")

# T7b realistic moon (night, at the moon)
ab.eval_js(S, "window.__app.setLightCustom(0, -30)"); time.sleep(2.5)
aim(163.9, 28.1)
set_hdr(0.0); cap("r19_T7_moon_b0.png")
set_hdr(0.35); cap("r19_T7_moon_t10.png")
M0, M1 = luma(load("r19_T7_moon_b0.png")), luma(load("r19_T7_moon_t10.png"))
ring_d = (M1 - M0)[(rad >= 10) & (rad <= 50)].mean()
core_dm = (M1 - M0)[rad < 12].mean()
check("T7b realistic moon blooms (ring > +5, core > +20)", ring_d > 5 and core_dm > 20,
      f"ring={ring_d:+.1f} core={core_dm:+.1f}")

# T9: interior delta classic<->realistic INDOOR (both no IBL now — L5)
ab.eval_js(S, """(function(){
  const a=window.__app;
  a.setLightCustom(128.66, 57.38);
  a.setIndoor(true);
  a.camera.position.set(6, 5, 8); a.orbit.target.set(0, 1, 0);
  a.orbit.enableDamping = false; a.orbit.update();
  a.setHdr({enabled:false});
  return 'set';
})()""")
time.sleep(1.5)
ab.eval_js(S, "window.__app.setSkyStyle('classic')"); time.sleep(1.8)
cap("r19_T9_classic.png")
ab.eval_js(S, "window.__app.setSkyStyle('realistic')"); time.sleep(2.8)
cap("r19_T9_realistic.png")
A9, B9 = load("r19_T9_classic.png"), load("r19_T9_realistic.png")
h9 = A9.shape[0]
d9 = np.abs(A9[int(h9*0.6):] - B9[int(h9*0.6):]).mean(axis=2).mean()
check("T9 indoor style delta ~ 0 (floor rows < 1.5)", d9 < 1.5, f"mean|d|={d9:.2f} (r18 was 2.32)")

# T10 console
ab.eval_js(S, "(function(){ localStorage.removeItem('stage-finish'); return 1; })()")
errs = ab.console_errors(S)
check("T10 console errors == 0", not errs, str(errs)[:120])
ab.close(S)

fails = [n for n, ok, _ in RESULTS if not ok]
print(f"\n==== r19 light E2E: {len(RESULTS)-len(fails)} PASS / {len(fails)} FAIL ====")
if fails:
    print("FAILED:", fails)
    sys.exit(1)
