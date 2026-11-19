#!/usr/bin/env python3
"""r17 camera-mode E2E — T1 entry/takeOver/state, T2 drive (rig physics + shift + tripod pan),
T3 rig shake (oEr wakes; run stride + steadicam subtle + gimbal off), T4 weight (step/slider/persist),
T5 zoom (wheel + focal write), T6 monitor bar (fields/menus/aspect), T7 exit (pose restore + draft
cleanup + undo no-op), T8 edit-mode ha WASD, T9 delete cascade + lane-head selectTrack, T10 R/REC toast.
Run: python3 scripts/r17_camera_e2e.py
"""
import json, os, sys, time

sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

S = "r17c"
URL = "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=r17e2e"
TMP = "/tmp/r17c"

os.makedirs(TMP, exist_ok=True)
PASS, FAIL = [], []

def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))

def ev_file(name, js, wait=0.0):
    if wait: time.sleep(wait)
    p = os.path.join(TMP, name + ".js")
    open(p, "w").write(js)
    return ab.eval_file(S, p)

def ev(js, wait=0.0):
    if wait: time.sleep(wait)
    return ab.eval_js(S, js)

def parse(r):
    if isinstance(r, (dict, list)): return r
    try: return json.loads(str(r))
    except Exception: return {}

ab.close(S)
ab.open_url(S, URL)
# boot poll (SKILL #88 — headless load times vary)
for _ in range(40):
    time.sleep(0.5)
    try:
        if str(ev('!!window.__app')) == 'true':
            break
    except Exception:
        pass
time.sleep(1)

# ---------------------------------------------------------------- T1 entry + takeOver
r = parse(ev_file("t1", r'''
(() => {
  const a = window.__app;
  const cam = Object.entries(a.objects.all()).find(([id, o]) => o.kind === 'camera');
  const id = cam[0];
  const editorPose = a.camera.position.toArray().map(v => +v.toFixed(3));
  const undoBefore = a.show.undoStack.length;
  const tracksBefore = a.show.show.tracks.length;
  const armed = a.armManualFlight(id);
  if (armed) a.startFilming(id);
  const mesh = a.meshById.get(id);
  const mw = mesh.matrixWorld.elements;
  const meshPos = mw.slice(12, 15).map(v => +v.toFixed(3));
  const camPos = a.camera.position.toArray().map(v => +v.toFixed(3));
  return JSON.stringify({
    armed, mode: a.page.mode, filming: a.filmingCameraId === id,
    editorPose, meshPos, camPos,
    takeOver: JSON.stringify(meshPos) === JSON.stringify(camPos),
    draft: a._draft ? { madeTrack: a._draft.madeTrack } : null,
    manual: a._manualFlight ? { trackId: a._draft.trackId === a._manualFlight.trackId } : null,
    camTrackItems: (a.show.show.tracks.find(t => t.characterId === id)?.items.map(i => i.kind)) ?? null,
    undoBefore, tracksBefore,
    rigDefaults: [a.rigs.rig, a.rigs.speedMps, a.rigs.panDegPerS, a.rigs.weight],
    orbitOff: a.orbit.enabled === false,
  });
})()'''))
check("T1 entry/takeOver", r.get("armed") and r.get("mode") == "camera" and r.get("takeOver")
      and r.get("draft") and r.get("manual", {}).get("trackId") and r.get("orbitOff")
      and r.get("rigDefaults") == ["gimbal", 1.8, 20, 0],
      json.dumps(r))
r = parse(ev_file("t1b", r"""
(() => JSON.stringify({
  monitorVisible: getComputedStyle(document.querySelector('.monitor')).display,
  guideVisible: document.getElementById('frameGuide').style.display,
}))()""", wait=0.4))
check("T1 monitor+guide visible", r.get("monitorVisible") == "block" and r.get("guideVisible") == "block", json.dumps(r))

# ---------------------------------------------------------------- T2 drive physics
r = parse(ev_file("t2", r'''
(() => {
  const a = window.__app;
  const out = {};
  // (a) 1s of W at gimbal: moves forward along the takeOver facing, eased ramp
  const p0 = a._driveCam.position.toArray();
  const q0 = a._driveCam.quaternion.toArray();
  const rig = JSON.parse(JSON.stringify(window.__app.rigs && { s: 1 }));  // placeholder unused
  for (let i = 0; i < 60; i++) a.driveTickDirect ? null : a._drive.tick(1/60, {
    rig: { speedMps: 1.8, startEaseS: .35, stopEaseS: .18, lookEaseS: .18, stickCurve: 1.3, level: true, shake: 'off', turnRoll: 0, strafeRoll: 0, rollEaseS: .6 },
    stickX: 0, stickY: 1, vertical: 0, shift: false, speedMps: 1.8, panDegPerS: 20 });
  const p1 = a._driveCam.position.toArray();
  out.gimbalFwd = +Math.hypot(p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]).toFixed(3);
  // forward = the drive cam's -Z at entry
  const e = new Float32Array(a._driveCam ? 0 : 0); // skip
  out.movedForward = p1[2] !== p0[2] || p1[0] !== p0[0];
  // (b) shift scales the STICK (eWr .4): same 60 ticks with shift → ~0.4× the distance
  a._drive.reset(); a._driveCam.position.set(...p0);
  for (let i = 0; i < 60; i++) a._drive.tick(1/60, {
    rig: { speedMps: 1.8, startEaseS: .35, stopEaseS: .18, lookEaseS: .18, stickCurve: 1.3, level: true, shake: 'off', turnRoll: 0, strafeRoll: 0, rollEaseS: .6 },
    stickX: 0, stickY: 1, vertical: 0, shift: true, speedMps: 1.8, panDegPerS: 20 });
  const p2 = a._driveCam.position.toArray();
  out.shiftFwd = +Math.hypot(p2[0]-p0[0], p2[1]-p0[1], p2[2]-p0[2]).toFixed(3);
  out.shiftRatio = +(out.shiftFwd / Math.max(1e-6, out.gimbalFwd)).toFixed(3);
  // (c) q/e vertical moves y
  a._drive.reset(); a._driveCam.position.set(...p0);
  for (let i = 0; i < 60; i++) a._drive.tick(1/60, {
    rig: { speedMps: 1.8, startEaseS: .35, stopEaseS: .18, lookEaseS: .18, stickCurve: 1.3, level: true, shake: 'off', turnRoll: 0, strafeRoll: 0, rollEaseS: .6 },
    stickX: 0, stickY: 0, vertical: 1, shift: false, speedMps: 1.8, panDegPerS: 20 });
  const p3 = a._driveCam.position.toArray();
  out.verticalDy = +(p3[1] - p0[1]).toFixed(3);
  // (d) tripod: pan springs (panDegPerS 20) rotate yaw with stickX; no translation
  a._drive.reset(); a._driveCam.position.set(...p0);
  const yaw0 = a._drive.yaw.value;
  for (let i = 0; i < 60; i++) a._drive.tick(1/60, {
    rig: { speedMps: 0, startEaseS: .35, stopEaseS: .2, lookEaseS: .2, stickCurve: 1.4, level: true, shake: 'off', turnRoll: 0, strafeRoll: 0, rollEaseS: .6 },
    stickX: 1, stickY: 0, vertical: 1, shift: false, speedMps: 0, panDegPerS: 20 });
  const p4 = a._driveCam.position.toArray();
  out.tripodYawDelta = +(a._drive.yaw.value - yaw0).toFixed(4);
  out.tripodMoved = +Math.hypot(p4[0]-p0[0], p4[1]-p0[1], p4[2]-p0[2]).toFixed(4);
  return JSON.stringify(out);
})()'''))
check("T2 drive gimbal fwd", r.get("gimbalFwd", 0) > 0.3 and r.get("gimbalFwd", 0) < 1.8, json.dumps(r))
check("T2 shift stick ~0.4×", 0.1 < r.get("shiftRatio", 0) < 0.75, json.dumps(r))
check("T2 q/e vertical", r.get("verticalDy", 0) > 0.3, json.dumps(r))
check("T2 tripod pan (yaw, no move)", r.get("tripodYawDelta", 0) != 0 and abs(r.get("tripodMoved", 1)) < 1e-6, json.dumps(r))

# ---------------------------------------------------------------- T3 rig shake (oEr wakes)
r = parse(ev_file("t3", r'''
(() => {
  const a = window.__app;
  const out = {};
  // run rig at speed → stride phase advances + nonzero rot offset (0.12 base sway)
  a.rigs.setRig('run', a.rigs.peekSpeeds());
  a._stridePhase = 0; a._shakeGroundPos = null;
  let pose = null;
  for (let i = 0; i < 30; i++) pose = a._rigShakePose(1/60);   // 0 speed: amount 0, base sway only
  out.runZeroSpeed = pose ? pose.rotationOffsetDeg.map(v => +v.toFixed(4)) : null;
  // simulate motion: the ground pos lags the camera → speed > 0 → amount > 0
  a._stridePhase = 0;
  a._shakeGroundPos = null;
  const poses = [];
  for (let i = 0; i < 60; i++) {
    a.camera.position.x += 5 / 60;   // 5 m/s → amount ramps to 1
    poses.push(a._rigShakePose(1/60));
  }
  const last = poses[59];
  out.runMoving = { rot: last.rotationOffsetDeg.map(v => +v.toFixed(4)), pos: last.positionOffset.map(v => +v.toFixed(4)) };
  out.stridePhaseAdvanced = +(a._stridePhase).toFixed(3);
  // steadicam → subtle preset (Dzt path)
  a.rigs.setRig('steadicam', a.rigs.peekSpeeds());
  a._shakeT = 10;
  const sub = a._rigShakePose(1/60);
  out.steadicam = sub ? { pos: sub.positionOffset.map(v => +v.toFixed(5)), rot: sub.rotationOffsetDeg.map(v => +v.toFixed(4)) } : null;
  // gimbal/drone → off → null pose
  a.rigs.setRig('gimbal', a.rigs.peekSpeeds());
  out.gimbalOff = a._rigShakePose(1/60) === null || a._rigShakePose(1/60) === undefined;
  // the frame-loop bracket: tickShake applies + restoreShake restores
  a.rigs.setRig('handheld', a.rigs.peekSpeeds());
  const preX = a.camera.position.x, preQ = a.camera.quaternion.toArray();
  a.tickShake(1/60);
  const appliedX = a.camera.position.x, appliedQ = a.camera.quaternion.toArray();
  a.restoreShake();
  const restoredX = a.camera.position.x, restoredQ = a.camera.quaternion.toArray();
  out.bracket = { applied: appliedX !== preX || JSON.stringify(appliedQ) !== JSON.stringify(preQ),
                  restored: restoredX === preX && JSON.stringify(restoredQ) === JSON.stringify(preQ) };
  return JSON.stringify(out);
})()'''))
runz = r.get("runZeroSpeed") or []
check("T3 run@0speed base sway", len(runz) == 3 and abs(runz[0]) <= 0.12 + 1e-6, json.dumps(r))
runm = r.get("runMoving") or {}
check("T3 run@5m/s stride pose", (runm.get("rot") or [0, 0, 0])[0] != 0 and r.get("stridePhaseAdvanced", 0) > 1, json.dumps(r))
sub = r.get("steadicam") or {}
check("T3 steadicam subtle (Dzt)", sub and (sub.get("pos") or [0])[0] != 0, json.dumps(r))
check("T3 gimbal off", r.get("gimbalOff"), json.dumps(r))
check("T3 bracket apply/restore", r.get("bracket", {}).get("applied") and r.get("bracket", {}).get("restored"), json.dumps(r))

# ---------------------------------------------------------------- T4 weight
r = parse(ev_file("t4", r'''
(() => {
  const a = window.__app;
  const out = {};
  out.w0 = a.rigs.weight;
  a.stepWeight(1); a.stepWeight(1);
  out.w2 = +a.rigs.weight.toFixed(4);           // 0.5
  // HDe clamp: step to beyond ±log2(3)
  for (let i = 0; i < 20; i++) a.stepWeight(1);
  out.wMax = +a.rigs.weight.toFixed(4);
  // deadzone: |w| < .08 snaps to 0 (HDe) — direct set (stepping overshoots by design)
  a.rigs.setWeight(0.05);
  out.wDeadzone = +a.rigs.weight.toFixed(4);
  a.rigs.setWeight(-1.585); out.wMin = +a.rigs.weight.toFixed(4);
  a.rigs.setWeight(0);
  // persistence (localStorage)
  a.rigs.setWeight(0.5);
  out.stored = localStorage.getItem('flick3dEditor.rig-weights');
  // per-rig weights: run gets its own
  a.rigs.setRig('run', a.rigs.peekSpeeds());
  a.rigs.setWeight(1);
  out.runW = a.rigs.weight;
  a.rigs.setRig('gimbal', a.rigs.peekSpeeds());
  out.gimbalW = a.rigs.weight;
  // cleanup: reset weights
  a.rigs.setRig('run', a.rigs.peekSpeeds()); a.rigs.setWeight(0);
  a.rigs.setRig('gimbal', a.rigs.peekSpeeds()); a.rigs.setWeight(0);
  return JSON.stringify(out);
})()'''))
check("T4 weight step/clamp/deadzone", r.get("w0") == 0 and abs(r.get("w2", 0) - 0.5) < 1e-3
      and abs(r.get("wMax", 0) - 1.5849625007211562) < 1e-3 and r.get("wDeadzone") == 0
      and abs(r.get("wMin", 0) + 1.5849625007211562) < 1e-3, json.dumps(r))
check("T4 weight persist + per-rig", '"run"' in (r.get("stored") or "") and r.get("runW") == 1 and r.get("gimbalW") == 0, json.dumps(r))

# ---------------------------------------------------------------- T5 zoom
r = parse(ev_file("t5", r'''
(() => {
  const a = window.__app;
  const out = {};
  const camId = a.filmingCameraId ?? a.activeCameraId();
  out.f0 = a.objects.get(camId).focalLengthMm ?? 50;
  a.zoomByWheel(-120, 0);
  out.zoomState = !!a._zoom;
  return JSON.stringify(out);
})()'''))
f0 = r.get("f0", 50)
def wait_settled(max_s=8.0):
    t0 = time.time()
    while time.time() - t0 < max_s:
        rr = ev('window.__app._zoom === null')
        if str(rr) == 'true': return True
        time.sleep(0.2)
    return False
settled1 = wait_settled()
r2 = parse(ev_file("t5b", r'''
(() => {
  const a = window.__app;
  const camId = a.filmingCameraId ?? a.activeCameraId();
  const out = { f1: +(a.objects.get(camId).focalLengthMm ?? 50).toFixed(2), settled: a._zoom === null };
  // wheel out (zoom back) 3×120 + clamped bounds: many notches → 14mm floor
  for (let i = 0; i < 30; i++) a.zoomByWheel(120, 0);
  return JSON.stringify(out);
})()'''))
settled2 = wait_settled()
r3 = parse(ev_file("t5c", r'''
(() => {
  const a = window.__app;
  const camId = a.filmingCameraId ?? a.activeCameraId();
  return JSON.stringify({ fMin: +(a.objects.get(camId).focalLengthMm ?? 50).toFixed(2), settled: a._zoom === null });
})()'''))
check("T5 wheel zoom-in writes the camera object", r2.get("f1", 0) > f0 and r3.get("fMin") == 14.0 and r3.get("settled") and settled1 and settled2, f"{r} {r2} {r3} settled1={settled1} settled2={settled2}")

# ---------------------------------------------------------------- T6 monitor bar
r = parse(ev_file("t6", r'''
(() => {
  const a = window.__app;
  const q = s => document.querySelector(s);
  const out = {};
  out.rigLabel = q('.mon-rig').textContent;
  out.speedLabel = q('.mon-speed').textContent;
  out.weightLabel = q('.mon-weight').textContent;
  out.focalLabel = q('.mon-focal').textContent;
  out.tc = q('.mon-tc').textContent;
  out.state = q('.mon-state').textContent;
  // aspect menu open → rows → pick 9:16
  q('.mon-aspect').click();
  out.menuOpen = q('.mon-aspect').getAttribute('aria-expanded') === 'true';
  const rows = [...document.querySelectorAll('.mon-aspect-row')];
  out.rowCount = rows.length;
  out.checkedFirst = rows.find(x => x.getAttribute('aria-checked') === 'true')?.dataset.aspect;
  rows.find(x => x.dataset.aspect === '9:16').click();
  out.aspectPicked = a.page.recordAspect;
  out.menuClosedAfter = q('.mon-aspect').getAttribute('aria-expanded') === 'false';
  // weight menu + slider
  q('.mon-weight').click();
  const range = q('.mon-weight-range');
  out.rangeAttrs = [range.min, range.max, range.step];
  range.value = '0.75';
  range.dispatchEvent(new Event('input', { bubbles: true }));
  out.sliderWeight = +a.rigs.weight.toFixed(4);
  q('.mon-weight').click();   // close
  // rig/speed buttons cycle
  q('.mon-rig').click();
  out.cycled = a.rigs.rig;
  a.cycleRig(-1);   // back to gimbal
  q('.mon-speed').click();
  out.speedAfterCycleBtn = a.rigs.speedMps;
  // level + grid toggles
  q('.mon-grid-toggle').click();
  out.gridShown = q('.mon-grid').style.display === 'block';
  q('.mon-grid-toggle').click();
  // back button exits
  q('.mon-back').click();
  out.exited = a.page.mode === 'edit';
  return JSON.stringify(out);
})()'''))
check("T6 monitor fields", r.get("rigLabel") == "Gimbal" and r.get("weightLabel") == "Normal"
      and r.get("tc") == "00:00:00:00" and r.get("state") == "STBY" and "mm" in (r.get("focalLabel") or ""), json.dumps(r))
check("T6 aspect menu verbatim rows", r.get("menuOpen") and r.get("rowCount") == 6
      and r.get("checkedFirst") == "16:9" and r.get("aspectPicked") == "9:16" and r.get("menuClosedAfter"), json.dumps(r))
check("T6 weight slider", r.get("rangeAttrs") == ["-1.584962500721156", "1.584962500721156", ".01"]
      and abs(r.get("sliderWeight", 0) - 0.75) < 0.011, json.dumps(r))
check("T6 buttons cycle + back exits", r.get("cycled") == "steadicam" and r.get("speedAfterCycleBtn") in (2.4, 1.8)
      and r.get("exited"), json.dumps(r))

# ---------------------------------------------------------------- T7 exit: restore + draft cleanup + undo
r = parse(ev_file("t7", r'''
(() => {
  const a = window.__app;
  const out = {};
  const camId = Object.entries(a.objects.all()).find(([id, o]) => o.kind === 'camera')[0];
  const editorPose = a.camera.position.toArray().map(v => +v.toFixed(3));
  const undo0 = a.show.undoStack.length;
  const items0 = (a.show.show.tracks.find(t => t.characterId === camId)?.items ?? []).length;
  a.armManualFlight(camId); a.startFilming(camId);
  // drive away
  for (let i = 0; i < 30; i++) a._drive.tick(1/60, {
    rig: { speedMps: 1.8, startEaseS: .35, stopEaseS: .18, lookEaseS: .18, stickCurve: 1.3, level: true, shake: 'off', turnRoll: 0, strafeRoll: 0, rollEaseS: .6 },
    stickX: 1, stickY: 1, vertical: 0, shift: false, speedMps: 1.8, panDegPerS: 20 });
  a.camera.position.copy(a._driveCam.position);
  out.drove = JSON.stringify(a.camera.position.toArray().map(v => +v.toFixed(2))) !== JSON.stringify(editorPose);
  a.exitCameraMode();
  const poseRestored = a.camera.position.toArray().map(v => +v.toFixed(3));
  out.poseRestored = JSON.stringify(poseRestored) === JSON.stringify(editorPose);
  out.draftCleared = a._draft === null && a._manualFlight === null;
  out.filmingCleared = a.filmingCameraId === null;
  out.itemsRestored = (a.show.show.tracks.find(t => t.characterId === camId)?.items ?? []).length === items0;
  out.undoNoop = a.show.undoStack.length === undo0;
  out.monitorHidden = getComputedStyle(document.querySelector('.monitor')).display === 'none';
  out.orbitBack = a.orbit.enabled === true;
  return JSON.stringify(out);
})()''', wait=0.3))
check("T7 exit restores pose/state/draft", r.get("drove") and r.get("poseRestored") and r.get("draftCleared")
      and r.get("filmingCleared") and r.get("itemsRestored") and r.get("undoNoop")
      and r.get("monitorHidden") and r.get("orbitBack"), json.dumps(r))

# ---------------------------------------------------------------- T8 edit-mode ha WASD
r = parse(ev_file("t8", r'''
(() => {
  const a = window.__app;
  const out = {};
  // simulate holding W via _keys (the real key handler populates it on keydown)
  const p0 = a.camera.position.toArray();
  const t0 = a.orbit.target.toArray();
  a._keys.add('w');
  a._wasd(0.5);   // 0.5s at 4 m/s = 2m along camera-forward (bot drive)
  a._wasd(0.5);
  a._keys.delete('w');
  const p1 = a.camera.position.toArray();
  const t1 = a.orbit.target.toArray();
  out.moved = +Math.hypot(p1[0]-p0[0], p1[1]-p0[1], p1[2]-p0[2]).toFixed(3);
  out.targetFollows = +Math.hypot(t1[0]-t0[0], t1[1]-t0[1], t1[2]-t0[2]).toFixed(3);
  // q/e vertical moves both camera and target
  const y0 = a.camera.position.y, ty0 = a.orbit.target.y;
  a._keys.add('e'); a._wasd(0.25); a._keys.delete('e');
  out.dy = +(a.camera.position.y - y0).toFixed(3);
  out.targetDy = +(a.orbit.target.y - ty0).toFixed(3);
  // nav progress accumulates
  out.navPan = a.page.navProgress.pan > 0;
  // gates: playing → no drive
  a.page.playing = true;
  const p2 = a.camera.position.toArray();
  a._keys.add('w'); a._wasd(0.5); a._keys.delete('w');
  a.page.playing = false;
  out.gatedWhilePlaying = JSON.stringify(a.camera.position.toArray().map(v=>+v.toFixed(3))) === JSON.stringify(p2.map(v=>+v.toFixed(3)));
  return JSON.stringify(out);
})()'''))
check("T8 ha WASD bot-drive", r.get("moved", 0) > 3 and abs(r.get("moved", 0) - r.get("targetFollows", -1)) < 1e-6, json.dumps(r))
check("T8 q/e vertical + navProgress + gates", abs(r.get("dy", 0) - 1) < 1e-6 and abs(r.get("targetDy", 0) - 1) < 1e-6
      and r.get("navPan") and r.get("gatedWhilePlaying"), json.dumps(r))

# ---------------------------------------------------------------- T9 delete cascade + lane-head
r = parse(ev_file("t9", r'''
(() => {
  const a = window.__app;
  const out = {};
  const human = Object.entries(a.objects.all()).find(([id, o]) => o.kind === 'humanoid');
  const hid = human ? human[0] : null;
  const tr = a.show.show.tracks.find(t => t.characterId === hid);
  const item = tr.items[0];
  // (a) selected item → removePerformanceItem
  a.page.selectedSegment = { trackId: tr.id, itemId: item.id }; a.page.changed();
  const items0 = tr.items.length;
  const undo0 = a.show.undoStack.length;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  out.itemDeleted = (a.show.show.tracks.find(t => t.id === tr.id).items.length === items0 - 1);
  out.itemUndo = a.show.undoStack.length > undo0 ? (a.show.undo(), a.show.undoStack.length === undo0) : false;
  // (b) selected track (lane-head) → removeTrack via cascade
  a.page.selectedSegment = null;
  a.show.selectTrack(tr.id);
  const tracks0 = a.show.show.tracks.length;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }));
  out.trackDeleted = a.show.show.tracks.length === tracks0 - 1;
  out.selectedTrackCleared = a.page.selectedTrack === null;
  // (c) lane-head DOM: re-render + click selects (the camera lane — the humanoid track was deleted)
  a.onTimeline ? a.onTimeline() : null;
  const head = document.querySelector('.lane-head');
  out.headDataset = head?.parentElement.dataset.track ?? null;
  out.trackNow = a.show.show.tracks[0]?.id ?? null;
  head?.click();
  out.headSelects = a.page.selectedTrack?.trackId === out.headDataset;
  const head2 = document.querySelector('.lane-head');   // the click re-rendered the lanes
  out.headClass = head2?.classList.contains('track-sel') ?? false;
  return JSON.stringify(out);
})()''', wait=0.3))
check("T9 cascade item→undo", r.get("itemDeleted") and r.get("itemUndo"), json.dumps(r))
check("T9 cascade track + lane-head", r.get("trackDeleted") and r.get("selectedTrackCleared")
      and r.get("headSelects") and r.get("headClass"), json.dumps(r))

# ---------------------------------------------------------------- T10 R key toast + console
r = parse(ev_file("t10", r'''
(() => {
  const a = window.__app;
  const camId = Object.entries(a.objects.all()).find(([id, o]) => o.kind === 'camera')[0];
  a.armManualFlight(camId); a.startFilming(camId);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
  const toast = document.getElementById('toast');
  out = { mode: a.page.mode, toastShown: toast.textContent.length > 10 };
  a.exitCameraMode();
  return JSON.stringify(out);
})()''', wait=0.3))
check("T10 R toast", r.get("mode") == "camera" and r.get("toastShown"), json.dumps(r))

# console errors gate
errs = ab.console_errors(S) if hasattr(ab, "console_errors") else ''
check("T-console 0 errors", not errs, str(errs)[:400])

print(f"\n{'='*50}\nr17 camera-mode E2E: {len(PASS)} PASS / {len(FAIL)} FAIL")
if FAIL:
    print("FAILED:", FAIL)
    sys.exit(1)
