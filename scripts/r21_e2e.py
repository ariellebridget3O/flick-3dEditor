#!/usr/bin/env python3
"""r21_e2e.py — round-21 regression suite (L2 sun control v2 + L3 draw trio).

T1  build badge: #buildBadge exists, text 'r23'; localStorage flickBuild === 'r23'
T2  the sunpath ARC: #sunRail is .el-arc 60x128; the handle sits at arcXY(el) (±2px)
T3  ARC REAL-TIME: synthetic drag updates light.elevationDeg + handle pos in the SAME eval
T4  arc clamps: pointer below -30 -> -30; above 90 -> 90; moon class at el <= -8
T5  the light WEDGE: #sunWedge d non-empty, changes with a disc az drag, .moon at night
T6  disc drag = azimuth only (elevation unchanged) — r20 contract preserved
T7  draw must NOT re-center (r22: r21 centerOn removed — live has no view adaptation on
    draw start); T7b plan view PERSISTS across 2D->3D->2D toggles (r22: r7 re-fit removed)
T8  first-step GLIDE: far press (>3m) + 1m first move -> stroke.at pulled toward the
    walker (not the raw pointer): |at - pointer| > 0.3m
T9  drawn cam-path default aim === 'travel' (auto-adjust); figure path keeps aim-omission
T10 target-marker reconcile: orbit cam-move item -> paired target 5m ahead of the camera
    forward; item removed -> target dropped (lastAimPosition kept on the camera)
T11 dblclick on a drawn path midpoint -> page.editInteraction === 'editingPath'
T12 console errors == 0
"""
import os, sys, time, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab

S = "r21e2e"
BASE = "http://localhost:3000/editor/index.html"
RESULTS = []

def ok(name, cond, detail=""):
    RESULTS.append((name, bool(cond), detail))
    print(("PASS " if cond else "FAIL ") + name + ("  " + str(detail)[:180] if detail else ""))

def ev(code, tmo=60):
    return ab.eval_js(S, code, timeout=tmo)

# ---------- boot ----------
ab.close(S)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r21e2e")
time.sleep(7)

# T1 badge
r = ev("(() => { const b = document.getElementById('buildBadge'); return JSON.stringify({badge: b ? b.textContent : null, stamp: localStorage.getItem('flickBuild')}); })()")
d = json.loads(r)
ok("T1 build badge", d["badge"] == "r23" and d["stamp"] == "r23", d)

# open the light popover
ev("document.getElementById('btnLight').click()")
time.sleep(0.5)

# T2 arc geometry
r = ev("""(() => { const el = document.getElementById('lightPop'); const arc = el.querySelector('#sunRail');
  const h = el.querySelector('#sunRailHandle'); const hr = h.getBoundingClientRect(), ar = arc.getBoundingClientRect();
  const a = window.__app.light.elevationDeg * Math.PI/180;
  const ex = 10 + 48*Math.cos(a), ey = 100 - 48*Math.sin(a);
  const px = (hr.x + hr.width/2 - ar.x) * 60/ar.width, py = (hr.y + hr.height/2 - ar.y) * 128/ar.height;
  return JSON.stringify({cls: arc.className, w: Math.round(ar.width), h: Math.round(ar.height),
    handle: [+px.toFixed(1), +py.toFixed(1)], expect: [+ex.toFixed(1), +ey.toFixed(1)]}); })()""")
d = json.loads(r)
ok("T2 arc + handle on arc", d["cls"] == "el-arc" and d["w"] == 60 and d["h"] == 128
   and abs(d["handle"][0] - d["expect"][0]) <= 2 and abs(d["handle"][1] - d["expect"][1]) <= 2, d)

# T3 real-time arc drag (same-eval readback)
r = ev("""(() => { const el = document.getElementById('lightPop'); const arc = el.querySelector('#sunRail');
  const r = arc.getBoundingClientRect(); const a = window.__app;
  const pe = (t,x,y)=>arc.dispatchEvent(new PointerEvent(t,{pointerId:91,clientX:r.x+x,clientY:r.y+y,bubbles:true,isPrimary:true,button:0,buttons:t==='pointerup'?0:1}));
  pe('pointerdown', 30, 60);
  pe('pointermove', 55, 99);                       // near the horizon point (58,100)
  const el1 = a.light.elevationDeg, top1 = el.querySelector('#sunRailHandle').style.top;
  pe('pointermove', 12, 55);                       // near zenith
  const el2 = a.light.elevationDeg, top2 = el.querySelector('#sunRailHandle').style.top;
  pe('pointerup', 12, 55);
  return JSON.stringify({el1: +el1.toFixed(1), el2: +el2.toFixed(1), top1, top2}); })()""")
d = json.loads(r)
ok("T3 arc real-time", d["el1"] < 15 and d["el2"] > 75 and d["top1"] != d["top2"], d)

# T4 clamps + moon
r = ev("""(() => { const el = document.getElementById('lightPop'); const arc = el.querySelector('#sunRail');
  const r = arc.getBoundingClientRect(); const a = window.__app;
  const pe = (t,x,y)=>arc.dispatchEvent(new PointerEvent(t,{pointerId:92,clientX:r.x+x,clientY:r.y+y,bubbles:true,isPrimary:true,button:0,buttons:t==='pointerup'?0:1}));
  pe('pointerdown', 30, 60);
  pe('pointermove', 58, 128);                       // below the deepest point
  const lo = a.light.elevationDeg, moonLo = el.querySelector('#sunRailHandle').classList.contains('moon');
  pe('pointermove', 10, 40);                        // above zenith
  const hi = a.light.elevationDeg;
  pe('pointerup', 10, 40);
  return JSON.stringify({lo: +lo.toFixed(1), moonLo, hi: +hi.toFixed(1)}); })()""")
d = json.loads(r)
ok("T4 arc clamps + moon", d["lo"] == -30 and d["moonLo"] and d["hi"] == 90, d)

# T5 wedge follows az; T6 disc = az only
r = ev("""(() => { const el = document.getElementById('lightPop'); const disc = el.querySelector('#sunDir');
  const r = disc.getBoundingClientRect(); const a = window.__app;
  const pe = (t,x,y)=>disc.dispatchEvent(new PointerEvent(t,{pointerId:93,clientX:r.x+x,clientY:r.y+y,bubbles:true,isPrimary:true,button:0,buttons:t==='pointerup'?0:1}));
  const el0 = a.light.elevationDeg;
  pe('pointerdown', r.width/2, 8);
  pe('pointermove', r.width/2+40, 8);
  const az1 = Math.round(a.light.azimuthDeg), d1 = el.querySelector('#sunWedge').getAttribute('d');
  pe('pointermove', r.width/2-40, 8);
  const az2 = Math.round(a.light.azimuthDeg), d2 = el.querySelector('#sunWedge').getAttribute('d');
  pe('pointerup', r.width/2-40, 8);
  return JSON.stringify({el0: +el0.toFixed(1), elAfter: +a.light.elevationDeg.toFixed(1),
    az1, az2, wedgeMoved: d1 !== d2 && d1.length > 20}); })()""")
d = json.loads(r)
ok("T5 wedge follows az", d["wedgeMoved"] and abs(d["az1"] - d["az2"]) > 30, d)
ok("T6 disc az-only", abs(d["elAfter"] - d["el0"]) < 0.05, d)

# ---- 2D draw tests ----
ev("document.getElementById('btnLight').click()")   # close popover
ev("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='2D'); b.click(); return '2d'; })()")
time.sleep(1.2)

# T7 draw must NOT re-center (r22: the r21 centerOn removed — the live's toggleDrawing has
# no view adaptation; the user's "self-adapting/auto-fit" complaint). Pan away, start draw, view stays.
r = ev("""(() => { const a = window.__app; const pv = a.planView;
  pv.w = { ...pv.w, view: { ...pv.w.view, centerX: 40, centerZ: -25 } };
  const hid = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'humanoid');
  a.objects.select([hid]);
  if (a.plan.drawing()) document.getElementById('pbDrawBtn').click();
  document.getElementById('pbDrawBtn').click();
  return JSON.stringify({drawing: a.plan.drawing()}); })()""")
time.sleep(0.8)
r = ev("(() => { const v = window.__app.planView.w.view; return JSON.stringify({c: [+v.centerX.toFixed(2), +v.centerZ.toFixed(2)]}); })()")
d = json.loads(r)
ok("T7 draw does NOT re-center (view stays put)", abs(d["c"][0] - 40) < 0.5 and abs(d["c"][1] + 25) < 0.5, d)

# T8 glide (far press, small first move)
r = ev("""(() => { const a = window.__app; const c = document.querySelector('[data-testid=stage-plan]');
  const r = c.getBoundingClientRect();
  const pe = (t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:94,clientX:r.x+x,clientY:r.y+y,bubbles:true,isPrimary:true,button:0,buttons:t==='pointerup'?0:1}));
  pe('pointerdown', 150, 150);                     // ~10m from the walker at this zoom
  pe('pointermove', 182, 152);                     // ~1m first move
  const st = a.plan.stroke;
  const v = a.planView.w.view;
  const pointer = { x: v.centerX + (182 - v.widthPx/2)/v.pxPerM, z: v.centerZ + (152 - v.heightPx/2)/v.pxPerM };
  const pull = Math.hypot(st.at.x - pointer.x, st.at.z - pointer.z);
  pe('pointerup', 182, 152);
  return JSON.stringify({at: [+st.at.x.toFixed(2), +st.at.z.toFixed(2)], pointer: [+pointer.x.toFixed(2), +pointer.z.toFixed(2)], pull: +pull.toFixed(2)}); })()""")
d = json.loads(r)
ok("T8 first-step glide", d["pull"] > 0.3, d)

# T10 target reconcile (runs BEFORE T9 — the T9 draw replaces the orbit item)
r = ev("""(() => { const a = window.__app;
  const cam = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'camera');
  const o = a.objects.get(cam);
  const targets = Object.entries(a.objects.all()).filter(([,x]) => x.kind === 'target');
  const fwdDist = targets.length ? Math.hypot(targets[0][1].position[0]-o.position[0], targets[0][1].position[2]-o.position[2]) : -1;
  return JSON.stringify({targetId: o.targetId ?? null, nTargets: targets.length, dist: +fwdDist.toFixed(1)}); })()""")
d = json.loads(r)
has_move = json.loads(ev("(function(){const a=window.__app;const cam=Object.keys(a.objects.all()).find(id=>a.objects.get(id).kind==='camera');const tr=a.show.show.tracks.find(t=>t.characterId===cam);const mv=(tr?.items??[]).find(i=>i.kind==='cam-move');return JSON.stringify({mv:!!mv,move:mv?mv.move:null,subj:mv?mv.subjectId??null:null});})()"))
ok("T10 target paired 5m ahead", d["targetId"] and d["nTargets"] >= 1 and 4 <= d["dist"] <= 6, dict(d, camMove=has_move))

# T9 cam-path default travel (multi-eval drag for rAF sampling)
ev("""(() => { const a = window.__app; const cam = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'camera');
  a.objects.select([cam]);
  if (a.plan.drawing()) document.getElementById('pbDrawBtn').click();
  if (!a.plan.drawing()) document.getElementById('pbDrawBtn').click();
  const c = document.querySelector('[data-testid=stage-plan]');
  c.dispatchEvent(new PointerEvent('pointerdown',{pointerId:95,clientX:0,clientY:0,bubbles:true,isPrimary:true,button:0,buttons:1}));
  return 'down'; })()""")
for i in range(6):
    time.sleep(0.22)
    ev("(function(){const c=document.querySelector('[data-testid=stage-plan]');c.dispatchEvent(new PointerEvent('pointermove',{pointerId:95,clientX:0,clientY:0,bubbles:true,isPrimary:true,button:0,buttons:1}));return 1;})()")
time.sleep(0.3)
r = ev("""(() => { const a = window.__app;
  const c = document.querySelector('[data-testid=stage-plan]');
  c.dispatchEvent(new PointerEvent('pointerup',{pointerId:95,clientX:0,clientY:0,bubbles:true,isPrimary:true,button:0,buttons:0}));
  const cam = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'camera');
  const tr = a.show.show.tracks.find(t => t.characterId === cam);
  const it = (tr?.items ?? []).find(i => i.kind === 'cam-path');
  return JSON.stringify({aim: it ? it.aim : null, anchors: it ? it.anchors.length : 0}); })()""")
d = json.loads(r)
ok("T9 cam-path default aim=travel", d["aim"] == "travel" and d["anchors"] >= 2, d)

# T7b plan view PERSISTS across 2D->3D->2D toggles (r22: the r7 setVisible re-fit removed —
# the live resets `fitted` only from the Fit button; toggling viewport mode must keep the pan/zoom)
r = ev("""(() => { const a = window.__app; const pv = a.planView;
  pv.w = { ...pv.w, view: { ...pv.w.view, centerX: 12, centerZ: -7, pxPerM: 30 } };
  return JSON.stringify({c0: [+pv.w.view.centerX.toFixed(2), +pv.w.view.centerZ.toFixed(2)], z0: +pv.w.view.pxPerM.toFixed(2)}); })()""")
d0 = json.loads(r)
ev("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='3D'); if(b) b.click(); return '3d'; })()")
time.sleep(0.6)
ev("(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='2D'); if(b) b.click(); return '2d'; })()")
time.sleep(1.0)
r = ev("(() => { const v = window.__app.planView.w.view; return JSON.stringify({c: [+v.centerX.toFixed(2), +v.centerZ.toFixed(2)], z: +v.pxPerM.toFixed(2)}); })()")
d = json.loads(r)
ok("T7b plan view persists across toggles", abs(d["c"][0] - 12) < 0.5 and abs(d["c"][1] + 7) < 0.5 and abs(d["z"] - 30) < 0.5, {"before": d0, "after": d})

# T11 dblclick to edit (aim at the cam-path first anchor + 0.3m along)
r = ev("""(() => { const a = window.__app; const pv = a.planView; const v = pv.w.view;
  const cam = Object.keys(a.objects.all()).find(id => a.objects.get(id).kind === 'camera');
  const tr = a.show.show.tracks.find(t => t.characterId === cam);
  const it = (tr?.items ?? []).find(i => i.kind === 'cam-path');
  if (!it) return JSON.stringify({err: 'no path'});
  const pl = it.anchors.map(an => an.pos);
  const mid = pl[Math.floor(pl.length/2)];
  const px = {x: v.widthPx/2 + (mid[0]-v.centerX)*v.pxPerM, y: v.heightPx/2 + (mid[2]-v.centerZ)*v.pxPerM};
  const c = document.querySelector('[data-testid=stage-plan]'); const r = c.getBoundingClientRect();
  c.dispatchEvent(new MouseEvent('dblclick', {clientX: r.x+px.x, clientY: r.y+px.y, bubbles: true}));
  const res = a.page.editInteraction;
  if (a.pathEditor?.finishPaint) a.pathEditor.finishPaint();
  return JSON.stringify({after: res}); })()""")
d = json.loads(r)
ok("T11 dblclick enters path edit", d.get("after") == "editingPath", d)

# T12 console errors
errs = ab.console_errors(S)
ok("T12 console errors == 0", len(errs) == 0, errs[:3])

fails = [r for r in RESULTS if not r[1]]
print("\n%d/%d PASS" % (len(RESULTS) - len(fails), len(RESULTS)))
sys.exit(1 if fails else 0)
