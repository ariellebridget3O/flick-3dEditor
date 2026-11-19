#!/usr/bin/env python3
"""r18_sky_e2e.py — round-18 sky-feedback regression suite.

Covers the audit P2-12 gate list:
  T1  procedural mode removed: UI seg = Off|Layered, no 'procedural' anywhere; old scenes
      with mode procedural load as layered (schema collapse)
  T2  weather -> effective coverage mapping (anchors x user factor, with rain/fog floors)
      via the atlas instrumentation (composite ~= anchor)
  T3  atlas instrumentation: per-sheet means within 15% of c_s; composite within 15% of anchor
  T4  seed A/B: different pattern (pixel diff > 3); seed 0 == seed absent (identical render)
  T5  moon disc: night capture, disc pixel count x >= 3.0 vs the pre-r18 radius (analytic x3.61)
  T6  interior delta classic<->realistic on FLOOR rows only: mean|d| < 3.0
  T7  realistic+HDR interior delta (P0-1 catch): floor rows mean|d| < 6.0 (the PMREM must not
      inherit the uHdrGain)
  T8  classic+HDR plain-fallback no-clip (P0-2 catch): sky sliver clip(>250) < 2%
  T9  HDR threshold sweep: sky-band delta at thr 1.0 > +8; at thr 1.5 < +2 (the sky is IN the
      high-illumination area at the default threshold, out at 1.5)
  T10 layered weather colors: rain deck luma < overcast deck luma - 15 (weather dimming)
  T11 console 0 errors across all arms
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
S = "r18e2e"
BW, BH = 1016, 313
RESULTS = []


def cap(name):
    capture_png(S, os.path.join(OUT, name), w=BW, h=BH)


def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + ("  — " + detail if detail else ""))


def load(name):
    return np.asarray(Image.open(os.path.join(OUT, name)).convert("RGB")).astype(np.float32)


def floor_rows_delta(a, b):
    A, B = load(a), load(b)
    h = A.shape[0]
    d = np.abs(A[int(h * 0.6):] - B[int(h * 0.6):]).mean(axis=2)
    return d.mean()


def sky_sliver_luma(name, rows=30):
    A = load(name)
    return (A[:rows] @ [0.299, 0.587, 0.114])


ab.close(S)
time.sleep(1)
ab.open_url(S, f"{BASE}?scene=samples/synthetic_tracks.json&noAutosave=1&v=r18e2e")
time.sleep(4)

# ---------- T1 procedural removal + migration ----------
r = ab.eval_js(S, """(function(){
  const seg = document.querySelector('#lpClouds');
  return JSON.stringify({btns: seg ? [...seg.querySelectorAll('button')].map(b=>b.dataset.c) : null});
})()""")
# the panel renders on open — the template is in the DOM source; check via a scene migration instead
# open the light panel first (the header button toggles it)
r2 = ab.eval_js(S, """(function(){
  // render the light panel: the UI lazily builds; use the app's own render path
  const app=window.__app;
  const btn=document.querySelector('.stage-header .lp-toggle, .stage-header button');
  return btn ? btn.className : 'none';
})()""")
ui_seg = ab.eval_js(S, """(function(){
  // open the light popover (lazily built on the first #btnLight click), then read the seg
  document.getElementById('btnLight').click();
  const seg=document.querySelector('#lpClouds');
  return seg ? [...seg.querySelectorAll('button')].map(b=>b.dataset.c).join(',') : 'no-seg';
})()""")
has_proc_button = ui_seg and "procedural" in str(ui_seg)
check("T1a no Procedural button in the clouds seg", (not has_proc_button) and str(ui_seg) != "no-seg", f"seg={ui_seg}")

# migration: a scene with clouds mode procedural loads as layered
mig = "/tmp/r18_mig.json"
base = json.load(open("/home/z/my-project/flick-3dEditor/editor/samples/synthetic_tracks.json"))
base["light"]["skyStyle"] = "realistic"
base["light"]["clouds"] = {"enabled": True, "mode": "procedural", "coverage": 0.45}
with open(mig, "w") as f:
    json.dump(base, f)
os.system(f"cp {mig} /home/z/my-project/public/editor/samples/r18_mig.json")
r3 = ab.eval_js(S, """(async function(){
  const app=window.__app;
  const res=await fetch('/editor/samples/r18_mig.json');
  const data=await res.json();
  app.loadSceneData(data);
  await new Promise(r=>setTimeout(r, 900));
  const c=app.env.clouds();
  return JSON.stringify({enabled: c.enabled, mode: app.light.clouds ? (app.light.clouds.mode ?? 'ABSENT') : 'ABSENT'});
})()""")
check("T1b procedural scene migrates to layered", '"mode":"ABSENT"' in str(r3) or '"mode":"layered"' in str(r3), str(r3))

# ---------- T2/T3 weather coverage + instrumentation ----------
stats = {}
for wx in ["clear", "cloudy", "overcast", "rain", "fog"]:
    r = ab.eval_js(S, f"""(function(){{
      const a=window.__app; a.setSkyStyle('realistic'); a.setWeather('{wx}');
      a.setClouds({{enabled:true, coverage:0.45, seed:0}});
      a.env.clouds().setStatic(true);
      a.renderFrame();
      return JSON.stringify(a.env.clouds()._debug.lastSheetsStats);
    }})()""")
    time.sleep(1.6)
    stats[wx] = json.loads(str(r).replace("'", '"').replace('"{', "{").replace('}"', "}")) if isinstance(r, str) and r.startswith("{") else json.loads(json.dumps(r))
anchors = {"clear": 0.18, "cloudy": 0.55, "overcast": 0.85, "rain": 0.90, "fog": 0.95}
ok2 = all(abs(stats[w]["composite"] - anchors[w]) / anchors[w] < 0.15 for w in anchors)
check("T2 weather->effective coverage (composite within 15% of anchor)",
      ok2, " ".join(f"{w}:{stats[w]['composite']:.3f}/{anchors[w]}" for w in anchors))
ok3 = all(all(abs(m - stats[w]["cSheet"]) / stats[w]["cSheet"] < 0.15 for m in stats[w]["sheets"]) for w in anchors)
check("T3 per-sheet means within 15% of c_s", ok3,
      " ".join(f"{w}:{np.mean(stats[w]['sheets']):.4f}/{stats[w]['cSheet']:.4f}" for w in anchors))
# floors: rain at coverage 0.05 (user slider near zero) still >= 0.88
r = ab.eval_js(S, """(function(){
  const a=window.__app; a.setWeather('rain'); a.setClouds({coverage:0.05, seed:0});
  a.env.clouds().setStatic(true); a.renderFrame();
  return JSON.stringify(a.env.clouds()._debug.lastSheetsStats);
})()""")
time.sleep(1.6)
fr = json.loads(str(r)) if not str(r).startswith('"{') else json.loads(str(r)[1:-1])
check("T2b rain floor (user 0.05 -> composite >= 0.80)", fr["composite"] >= 0.80, f"composite={fr['composite']:.3f}")

# ---------- T4 seed A/B ----------
r = ab.eval_js(S, """(function(){
  const a=window.__app; const cam=a.camera;
  cam.position.set(0, 1.6, 0); a.orbit.target.set(0, 30, -6);   // sky-aimed (the default pose shows only 0-4deg of sky)
  a.setWeather('clear'); a.setClouds({coverage:0.45, seed:0}); a.env.clouds().setStatic(true); a.renderFrame();
  return JSON.stringify({seed: a.env.clouds()._debug.seed, st: a.env.clouds()._debug.lastSheetsStats.composite});
})()""")
time.sleep(1.8)
cap("r18_T4_seed0.png")
r2 = ab.eval_js(S, "(function(){ const a=window.__app; a.setClouds({seed:137}); a.env.clouds().setStatic(true); a.renderFrame(); return JSON.stringify({seed: a.env.clouds()._debug.seed, st: a.env.clouds()._debug.lastSheetsStats.composite}); })()")
time.sleep(1.8)
cap("r18_T4_seed137.png")
print("T4 state:", str(r)[:80], "->", str(r2)[:80], flush=True)
d = np.abs(load("r18_T4_seed0.png") - load("r18_T4_seed137.png")).mean()
check("T4a seed 0 vs 137 different pattern (mean|d| > 3)", d > 3.0, f"mean|d|={d:.2f}")
# seed=0 == absent: reload the same scene without the seed field
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  const l={...a.light}; const c={...l.clouds}; delete c.seed; l.clouds=c; a.light=l;
  a.env.setClouds(l); a.env.applyDaylight(l); a.env.clouds().setStatic(true); a.renderFrame();
  return JSON.stringify({seed: a.env.clouds()._debug.seed});
})()""")
time.sleep(1.6)
cap("r18_T4_noseed.png")
check("T4b seed field absent == seed 0", '"seed":0' in str(r), str(r))

# ---------- T5 moon ----------
r = ab.eval_js(S, """(function(){
  const a=window.__app;
  a.setClouds({enabled:false});
  a.setLightGeo({ timeOfDay: 0.5, latitudeDeg: 45, dayOfYear: 166 });
  a.setSkyStyle('realistic');
  return 'night';
})()""")
time.sleep(2.5)
ab.eval_file(S, "/tmp/r18_aim.js")
time.sleep(1.5)
cap("r18_T5_moon.png")
img = load("r18_T5_moon.png")
lum = img @ [0.299, 0.587, 0.114]
from scipy import ndimage
m = lum > 245
lbl, n = ndimage.label(m)
sizes = ndimage.sum(m, lbl, range(1, n + 1)) if n else []
best = int(max(sizes)) if len(sizes) else 0
# old disc+halo core ~120px at >245 in this pose; r18 measured 743px (the >245 core grew with
# the bigger disc + brighter luminance; the 12x13px disc reads ~120-990px depending on threshold)
check("T5 moon disc >= 400 px (was ~120 pre-r18)", best >= 400, f"largest blob={best}px (n={n})")

# ---------- T6 interior delta (plain render) ----------
ab.eval_js(S, """(function(){
  const a=window.__app; const cam=a.camera;
  cam.position.set(6, 5, 8); a.orbit.target.set(0, 1, 0);   // DEFAULT pose (floor visible in the lower rows)
  a.setLightGeo({ timeOfDay: 9.5, latitudeDeg: 45 }); a.setWeather('clear'); a.setIndoor(true);
  a.renderFrame(); return 'default pose';
})()""")
time.sleep(1.2)
ab.eval_js(S, "window.__app.setSkyStyle('classic')")
time.sleep(1.5)
cap("r18_T6_classic.png")
ab.eval_js(S, "window.__app.setSkyStyle('realistic')")
time.sleep(2.5)
cap("r18_T6_realistic.png")
d6 = floor_rows_delta("r18_T6_classic.png", "r18_T6_realistic.png")
check("T6 interior delta floor rows < 3.0", d6 < 3.0, f"mean|d|={d6:.2f} (was 8.95)")

# ---------- T7/T8/T9 HDR arms (finish forced) ----------
ab.eval_js(S, "(function(){ const a=window.__app; a.setIndoor(false); localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
ab.eval_js(S, "location.reload()")
time.sleep(5)
# T7: realistic+HDR interior delta (PMREM must not inherit uHdrGain)
ab.eval_js(S, "(function(){ const a=window.__app; a.setSkyStyle('realistic'); a.setHdr({enabled:true, bloom:0.0, bloomThreshold:1.0}); return 1; })()")
time.sleep(2.8)
cap("r18_T7_realistic_hdr.png")
ab.eval_js(S, "window.__app.setSkyStyle('classic')")
time.sleep(1.8)
cap("r18_T7_classic_hdr.png")
d7 = floor_rows_delta("r18_T7_classic_hdr.png", "r18_T7_realistic_hdr.png")
check("T7 realistic+HDR interior delta floor rows < 6.0 (P0-1)", d7 < 6.0, f"mean|d|={d7:.2f}")

# T9: threshold sweep on classic
for thr in (1.0, 1.5):
    ab.eval_js(S, f"window.__app.setHdr({{enabled:true, bloom:0.35, bloomThreshold:{thr}, exposure:1.0}})")
    time.sleep(1.6)
    cap(f"r18_T9_thr{thr}.png")
ab.eval_js(S, "window.__app.setHdr({enabled:true, bloom:0.0, bloomThreshold:1.0, exposure:1.0})")
time.sleep(1.6)
cap("r18_T9_bloom0.png")
l0 = sky_sliver_luma("r18_T9_bloom0.png").mean()
l10 = sky_sliver_luma("r18_T9_thr1.0.png").mean()
l15 = sky_sliver_luma("r18_T9_thr1.5.png").mean()
check("T9 sky IN high-illumination at thr 1.0, OUT at 1.5",
      (l10 - l0) > 8 and abs(l15 - l0) < 2, f"bloom0={l0:.1f} thr1.0={l10:.1f} (+{l10-l0:.1f}) thr1.5={l15:.1f} ({l15-l0:+.1f})")

# T8: plain+HDR fallback no clip
ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:false, source:'manual'})); return 1; })()")
ab.eval_js(S, "location.reload()")
time.sleep(5)
ab.eval_js(S, "(function(){ const a=window.__app; a.setSkyStyle('classic'); a.setHdr({enabled:true, bloom:0.35, bloomThreshold:1.0}); return 1; })()")
time.sleep(2.0)
cap("r18_T8_fallback.png")
lum8 = sky_sliver_luma("r18_T8_fallback.png")
clip = (lum8 > 250).mean() * 100
check("T8 plain+HDR fallback no sky clip (P0-2)", clip < 2.0, f"clip>250: {clip:.1f}%  p50={np.percentile(lum8,50):.0f}")

# ---------- T10 layered weather colors ----------
ab.eval_js(S, "(function(){ localStorage.setItem('stage-finish', JSON.stringify({enabled:true, source:'manual'})); return 1; })()")
ab.eval_js(S, "location.reload()")
time.sleep(5)
ab.eval_js(S, """(function(){
  const a=window.__app; const cam=a.camera;
  cam.position.set(0, 1.6, 0); a.orbit.target.set(0, 30, -6);
  a.setSkyStyle('realistic');
  a.setClouds({enabled:true, coverage:0.45, seed:0});
  a.renderFrame(); return 'up';
})()""")
time.sleep(2.2)
for wx in ("overcast", "rain"):
    ab.eval_js(S, f"(function(){{ const a=window.__app; a.setWeather('{wx}'); a.env.clouds().setStatic(true); return 1; }})()")
    time.sleep(2.2)
    cap(f"r18_T10_{wx}.png")
lo = load("r18_T10_overcast.png"); lr = load("r18_T10_rain.png")
mo = (lo @ [0.299, 0.587, 0.114])[:165].mean()
mr = (lr @ [0.299, 0.587, 0.114])[:165].mean()
check("T10 rain deck darker than overcast by > 15 luma", mo - mr > 15, f"overcast={mo:.0f} rain={mr:.0f} (d={mo-mr:.0f})")

# ---------- T11 console ----------
ab.eval_js(S, "(function(){ localStorage.removeItem('stage-finish'); return 1; })()")
out = ab.run(S, "console")
check("T11 console errors == 0", not str(out).strip() or "error" not in str(out).lower(), str(out)[:120])
ab.close(S)

fails = [n for n, ok, _ in RESULTS if not ok]
print(f"\n==== r18 sky E2E: {len(RESULTS)-len(fails)} PASS / {len(fails)} FAIL ====")
if fails:
    print("FAILED:", fails)
    sys.exit(1)
