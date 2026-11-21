#!/usr/bin/env python3
"""r23_e2e.py — round-23 regression suite (L1 eye adaptation, L2 dome clouds,
L3 geo->rings solve, L4 glow regex fix).

L1  T1  outdoor auto == manual (KEY anchored; no look jump enabling auto)
    T2  indoor day: auto brighter than manual by > 10 mean luma
    T3  night: auto brighter but still dark (< 90)
    T4  UI: checkbox + 'metered'/'manual' state + label swap to 'Exposure bias'
    T5  toggle off -> manual look restored
L2  T6  dome clouds: structure at GRAZING aim (row-std > 40) + zenith + mid
L3  T7  season labels Spring/Summer/Autumn/Winter + Winter click -> doy 355 + ring reflects
    T8  lon solar-time equivalence: setLightGeo({lon:60}) == setLightGeo({time:+4h})
    T9  custom-mode geo hint mentions re-solve
L4  T10 CC0 night: warm-bright pixel count < 20 (was 170); rails/upright/wall emissive #000000
    T11 keepers still glow: shaded_lamp shade + Console lamp emissive 0xFFC98A in the E2E room
T99 console errors == 0
"""
import os, sys, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab
from PIL import Image
import statistics

S = "r23e2e"
BASE = "http://localhost:3000/editor/index.html"
RESULTS = []

def ok(name, cond, detail=""):
    RESULTS.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ("  " + str(detail)[:170] if detail else ""))

def ev(code, tmo=90):
    return ab.eval_js(S, code, timeout=tmo)

def mean_lum(p):
    im = Image.open(p).convert("L")
    px = list(im.getdata())
    return sum(px) / len(px)

# ---------- boot (outdoor synthetic, finish on) ----------
ab.close(S)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r23e2e&finish=1")
time.sleep(10)

# ---- L1 ----
ev("window.__app.setHdr({enabled: true, autoExposure: false})")
time.sleep(2.5); ab.screenshot(S, "/tmp/render/e2o_man.png")
ev("window.__app.setHdr({autoExposure: true})")
time.sleep(3.0); ab.screenshot(S, "/tmp/render/e2o_auto.png")
m_man, m_auto = mean_lum("/tmp/render/e2o_man.png"), mean_lum("/tmp/render/e2o_auto.png")
ok("T1 outdoor auto == manual (no look jump)", abs(m_auto - m_man) < 6, {"man": round(m_man, 1), "auto": round(m_auto, 1)})

# indoor CC0
ab.close(S)
ab.open_url(S, BASE + "?scene=samples/upstream/scene_fdc2c6af-8996-4737-ac2d-0b7e9d49debe.json&noAutosave=1&v=r23e2e&finish=1")
time.sleep(10)
ev("window.__app.setHdr({enabled: true, autoExposure: false})")
time.sleep(2.5); ab.screenshot(S, "/tmp/render/e2i_man.png")
ev("window.__app.setHdr({autoExposure: true})")
time.sleep(3.0); ab.screenshot(S, "/tmp/render/e2i_auto.png")
i_man, i_auto = mean_lum("/tmp/render/e2i_man.png"), mean_lum("/tmp/render/e2i_auto.png")
ok("T2 indoor auto brighter (+10 or more)", i_auto - i_man > 10, {"man": round(i_man, 1), "auto": round(i_auto, 1)})
ev("window.__app.light.elevationDeg = -18")
ev("window.__app.setHdr({autoExposure: false})")
time.sleep(2.5); ab.screenshot(S, "/tmp/render/e2n_man.png")
n_man = mean_lum("/tmp/render/e2n_man.png")
ev("window.__app.setHdr({autoExposure: true})")
time.sleep(3.0); ab.screenshot(S, "/tmp/render/e2n_auto.png")
n_auto = mean_lum("/tmp/render/e2n_auto.png")
ok("T3 night auto brighter but still dark", n_man < n_auto < 90, {"night_man": round(n_man, 1), "night_auto": round(n_auto, 1)})

# UI state
ev("window.__app.light.elevationDeg = 30")
time.sleep(1.0)
ev("document.getElementById('btnLight').click()")
time.sleep(0.6)
r = ev("""(() => { const g = id => document.getElementById(id);
  return JSON.stringify({auto: g('lpAutoExp').checked, state: g('lpAutoState').textContent,
    expLabel: g('lpExpRow').firstChild.textContent, hint: g('lpHdrHint').textContent.slice(0, 40)}); })()""")
d = json.loads(r)
ok("T4 auto-exposure UI state", d["auto"] and d["state"] == "metered" and d["expLabel"] == "Exposure bias", d)

# toggle off restores manual
ev("document.getElementById('lpAutoExp').click()")
time.sleep(2.5); ab.screenshot(S, "/tmp/render/e2i_man2.png")
m2 = mean_lum("/tmp/render/e2i_man2.png")
r = ev("JSON.stringify({s: document.getElementById('lpAutoState').textContent})")
d2 = json.loads(r)
ok("T5 toggle off -> manual restored", d2["s"] == "manual" and abs(m2 - i_man) < 8, {"m2": round(m2, 1), "man": round(i_man, 1), **d2})
ev("document.getElementById('lpAutoExp').click()")   # back to auto for later arms

# ---- L2 dome clouds (realistic + layered) ----
ev("""(() => { const a = window.__app;
  a.light.skyStyle = 'realistic';
  a.light.clouds = Object.assign({}, a.light.clouds, {enabled: true, coverage: 0.55, cirrus: 0.2});
  return 'clouds on'; })()""")
time.sleep(2.5)
rowstds = {}
for tag, tgt in [("mid", [0, 30, -40]), ("graze", [0, 4, -60]), ("zenith", [0, 60, 0])]:
    ev(f"(() => {{ const a = window.__app; a.orbit.target.set({tgt[0]},{tgt[1]},{tgt[2]}); return '{tag}'; }})()")
    time.sleep(1.8)
    p = f"/tmp/render/e2_clouds_{tag}.png"
    ab.screenshot(S, p)
    im = Image.open(p).convert("L")
    w, h = im.size
    rows = [statistics.pstdev([im.getpixel((x, y)) for x in range(0, w, 4)]) for y in range(20, h // 2, 12)]
    rowstds[tag] = round(statistics.mean(rows), 1)
ok("T6 dome cloud structure at all aims", all(v > 40 for v in rowstds.values()), rowstds)

# ---- L3 geo -> rings ----
ev("""(() => { const a = window.__app; a.light.skyStyle = 'classic';
  a.light.clouds = Object.assign({}, a.light.clouds, {enabled: false}); return 'back'; })()""")
time.sleep(1.5)
r = ev("""(() => { const bs = [...document.querySelectorAll('.lp-date [data-doy]')];
  const w = bs.find(b => b.textContent.trim() === 'Winter'); w.click();
  const a = window.__app;
  const act = bs.filter(b => b.classList.contains('on')).map(b => b.textContent.trim());
  return JSON.stringify({labels: bs.map(b => b.textContent.trim()), doy: a.light.geo.dayOfYear,
    active: act, mode: a.light.mode, el: +a.light.elevationDeg.toFixed(1)}); })()""")
d = json.loads(r)
ok("T7 seasons: names + Winter solves onto rings", d["labels"] == ["Spring", "Summer", "Autumn", "Winter"]
   and d["doy"] == 355 and d["active"] == ["Winter"] and d["mode"] == "geographic", d)
r = ev("""(() => { const a = window.__app;
  a.setLightGeo({longitudeDeg: 60, timeOfDay: 9.5});
  const lonArm = [+(a.light.azimuthDeg).toFixed(2), +(a.light.elevationDeg).toFixed(2)];
  a.setLightGeo({longitudeDeg: 0, timeOfDay: 13.5});
  const timeArm = [+(a.light.azimuthDeg).toFixed(2), +(a.light.elevationDeg).toFixed(2)];
  return JSON.stringify({lonArm, timeArm}); })()""")
d = json.loads(r)
ok("T8 lon solar-time equivalence (lon E60 == +4h)", d["lonArm"] == d["timeArm"], d)
ev("window.__app.setLightCustom(200, 30)")
time.sleep(0.4)
r = ev("document.getElementById('lpGeoHint').textContent")
ok("T9 custom geo hint mentions re-solve", "re-solves onto the rings" in r, r[:80])
ev("document.getElementById('btnLight').click()")   # close popover

# ---- L4 glow ----
# CC0 night: warm count + formerly-flagged emissive
ev("window.__app.light.elevationDeg = -18; window.__app.light.azimuthDeg = 200;")
time.sleep(2.5)
p = "/tmp/render/e2_cc0_night.png"
ab.screenshot(S, p)
im = Image.open(p).convert("RGB"); w, h = im.size; px = im.load()
warm = sum(1 for y in range(0, h, 3) for x in range(0, w, 3)
           if px[x, y][0] > 240 and px[x, y][1] > 180 and px[x, y][0] - px[x, y][2] > 60)
r = ev("""(() => { const a = window.__app;
  const probe = nm => { const id = Object.keys(a.objects.all()).find(k => a.objects.get(k).name === nm);
    if (!id) return 'missing'; let mesh = null;
    a.scene.traverse(n => { if (!mesh && n.isMesh) { let o = n; while (o && (!o.userData || o.userData.objectId !== id)) o = o.parent; if (o) mesh = n; } });
    return mesh && mesh.material.emissive !== undefined ? '#' + mesh.material.emissive.getHexString() : null; };
  return JSON.stringify({rail: probe('left_window_rail_0'), upright: probe('rear_window_upright_0'),
    wall: probe('left_wall_below_window')}); })()""")
d = json.loads(r)
ok("T10 CC0 night: no structure glow", warm < 20 and d["rail"] == "#000000" and d["upright"] == "#000000" and d["wall"] == "#000000",
   {"warm": warm, **d})

# keepers in the E2E Living Room (agent) scene
ab.close(S)
ab.open_url(S, BASE + "?scene=samples/upstream/scene_b6780d03-dc55-4c41-8bff-f959f7faf95e.json&noAutosave=1&v=r23e2e&finish=1")
time.sleep(10)
ev("window.__app.light.elevationDeg = -18; window.__app.light.azimuthDeg = 200;")
time.sleep(3.0)
r = ev("""(() => { const a = window.__app;
  const probe = nm => { const id = Object.keys(a.objects.all()).find(k => a.objects.get(k).name === nm);
    if (!id) return 'missing'; let mesh = null;
    a.scene.traverse(n => { if (!mesh && n.isMesh) { let o = n; while (o && (!o.userData || o.userData.objectId !== id)) o = o.parent; if (o) mesh = n; } });
    return mesh && mesh.material.emissive !== undefined ? '#' + mesh.material.emissive.getHexString() : null; };
  return JSON.stringify({lamp: probe('Console lamp 2'), shade: probe('shaded_lamp_0_shade'),
    stem: probe('shaded_lamp_0_stem')}); })()""")
d = json.loads(r)
ok("T11 keepers glow, structure does not", d["lamp"] == "#ffc98a" and d["shade"] == "#ffc98a" and d["stem"] == "#000000", d)

# ---- console ----
errs = ab.console_errors(S)
ok("T99 console errors == 0", len(errs) == 0, errs[:3])

fails = [r for r in RESULTS if not r[1]]
print("\n%d/%d PASS" % (len(RESULTS) - len(fails), len(RESULTS)))
sys.exit(1 if fails else 0)
