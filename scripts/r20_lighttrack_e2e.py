#!/usr/bin/env python3
"""r20_lighttrack_e2e.py — round-20 L3 time-of-day animation track regression suite.

The ask (issue 3): sun position as an animatable light source on the timeline. No light
track exists in the original — the sanctioned deviation (R20_LIGHTTRACK_SUNUI §1.D) is a
singleton TRACK with characterId 'sun' (NO objects row — audit L3-5) carrying
`light-transform` items {startS, durationS, keys:[{tS, azimuthDeg, elevationDeg,
nightLights?}]}, evaluated through the effLight pipeline (audit L3-1: the track NEVER
writes this.light).

  T1  ensureLightTrack singleton — calling twice = ONE lane (the ☀ Daylight head, the
      one refreshTimeline special case); the header "☀ Daylight" entry re-creates after
      a lane ✕ delete (audit L3-7)
  T2  keys via the inspector (Azimuth°/Elevation° numbers + the ◆ Key button) — keys land
      SORTED by tS, deduped within tolerance (a re-edit at the same playhead REPLACES)
  T3  capture-at-playhead (audit L3-6): segment selected, seek t, NATIVE drag on the
      direction disc -> ONE key at tS = playhead − startS lands on endEditGesture with
      the dragged azimuth and the track's elevation (the other axis is preserved); undo
      removes it (L3-8: capture rides the gesture brackets)
  T4  playback moves the sun: a 2-key dusk track (el 57 -> -20 over 10 s) — effLight()
      probes at t=0/5/10 give 57/18.5/-20 with SHORTEST-ARC azimuth (350 -> 10 wraps
      through 0, +2°/s during play, not the 340° long way)
  T5  THE AUDIT L3-1 REGRESSION GUARD: after playing + stopping, app.light (the scene
      light) is BYTE-UNCHANGED (deep-equal the pre-play snapshot) and the applied light
      reverts to it (stop semantics, audit L3-2)
  T6  the popover mirrors the track: segment selected + playhead mid-track (rest-eval
      after a seek) -> the light popover's az/el readout == effLight (NOT the scene light)
  T7  save/load round-trip: currentSceneJSON has the track + v13; loadSceneData restores
      it; the keys survive normItems (sorted, ≤0.01 s dedupe, az mod 360, el clamp,
      non-finite keys dropped) and a raw v12 scene migrates through the new accept arm
  T8  a NO-TRACK scene re-lights exactly as before: fresh load of
      samples/synthetic_tracks.json (v10 -> v13 migration chain) — effLight() IS the
      scene light (reference-identical), the scene light unchanged from the file
  T9  console errors == 0

Run: python3 scripts/r20_lighttrack_e2e.py [--only T1,T2,...]
"""
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab

S = "r20l3e2e"
BASE = "http://localhost:3000/editor/index.html"
URL = BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20l3e2e"
TMP = "/tmp/r20l3"
os.makedirs(TMP, exist_ok=True)
PASS, FAIL = [], []
ONLY = None
if len(sys.argv) > 1 and sys.argv[1] == "--only":
    ONLY = set(sys.argv[2].split(","))


def check(name, cond, detail=""):
    tid = name.split()[0]
    if ONLY and tid not in ONLY:
        return
    (PASS if cond else FAIL).append(name)
    print(("PASS " if cond else "FAIL ") + name + (f"  [{detail}]" if detail and not cond else ""))


def ev_file(name, js, wait=0.0):
    if wait:
        time.sleep(wait)
    p = os.path.join(TMP, name + ".js")
    with open(p, "w") as f:
        f.write(js)
    return ab.eval_file(S, p)


def parse(r):
    if isinstance(r, (dict, list)):
        return r
    try:
        return json.loads(str(r))
    except Exception:
        return {}


def near(a, b, eps=0.01):
    return a is not None and b is not None and abs(a - b) <= eps


# ================================================================= bootstrap
ab.close(S)
time.sleep(1)
ab.open_url(S, URL)
time.sleep(6)

# ================================================================= T1: the singleton lane
r = ev_file("setup", r'''
(() => {
  const a = window.__app;
  const out = {};
  const lanesBefore = a.show.show.tracks.length;
  const t1 = a.ensureLightTrack();
  const t2 = a.ensureLightTrack();          // singleton: the second call returns the SAME track
  out.singleton = t1.id === t2.id;
  out.sunTracks = a.show.show.tracks.filter(t => t.characterId === 'sun').length;
  out.laneCount = a.show.show.tracks.length - lanesBefore;
  out.otherLanes = a.show.show.tracks.filter(t => t.characterId !== 'sun').length;
  return JSON.stringify(out);
})()
''')
FX = parse(r)
r = ev_file("t1", r'''
(() => {
  const a = window.__app;
  const out = {};
  out.oneLane = a.show.show.tracks.filter(t => t.characterId === 'sun').length === 1;
  // the lane HEAD renders "☀ Daylight" (the one refreshTimeline special case)
  a._ui.refreshTimeline();
  const lane = document.querySelector('.lane.sun');
  out.laneClass = !!lane;
  out.head = lane?.querySelector('.lane-head')?.textContent.replace('✕', '').trim();
  // no objects row was created (audit L3-5) — store, hierarchy, pickers all clean
  out.noObject = !a.objects.get('sun');
  out.hierClean = ![...document.querySelectorAll('#hierarchy .hier-row')].some(x => x.textContent.includes('Daylight'));
  // the header entry exists; the lane ✕ deletes; the entry re-creates (audit L3-7)
  out.headerBtn = !!document.getElementById('btnDaylight');
  const sunTrackId = a.show.show.tracks.find(t => t.characterId === 'sun').id;
  a.show.removeTrack(sunTrackId);
  a._ui.refreshTimeline();
  out.deletedLaneGone = !document.querySelector('.lane.sun');
  document.getElementById('btnDaylight').click();
  out.recreated = a.show.show.tracks.filter(t => t.characterId === 'sun').length === 1
    && a.show.show.tracks.find(t => t.characterId === 'sun').items.some(i => i.kind === 'light-transform');
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T1 ensureLightTrack singleton (twice = one ☀ Daylight lane, no object row, header entry re-creates)",
      FX.get("singleton") and FX.get("sunTracks") == 1 and FX.get("laneCount") == 1 and (FX.get("otherLanes") or 0) > 0
      and d.get("oneLane") and d.get("laneClass") and d.get("head") == "☀ Daylight" and d.get("noObject")
      and d.get("hierClean") and d.get("headerBtn") and d.get("deletedLaneGone") and d.get("recreated"),
      f"fx={FX} d={d}")

# ================================================================= T2: inspector keys (numbers + ◆)
r = ev_file("t2", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  const lane = () => a.show.show.tracks.find(t => t.characterId === 'sun');
  const item = () => lane().items.find(i => i.kind === 'light-transform');
  // stretch the fresh segment to 10 s so keys can land up to tS = 10
  a.show.trimItem(lane().id, item().id, 10);
  out.dur = item().durationS;
  // select the segment through the BLOCK click (the natural entry)
  a._ui.refreshTimeline();
  document.querySelector(`.blk[data-item="${item().id}"]`).click();
  out.selected = JSON.stringify(a.page.selectedSegment) === JSON.stringify({ trackId: lane().id, itemId: item().id });
  // seek 2, type Azimuth 90 -> a key at tS 2 (Elevation preserved from the current sun)
  a.page.seek(2); await sleep(150);
  let az = document.querySelector('[data-actf="laz"]');
  out.fieldsRender = !!az && !!document.querySelector('[data-actf="lel"]')
    && !!document.querySelector('[data-actf="lnight"]') && !!document.querySelector('[data-actf="ktoggle"]');
  az.value = '90'; az.dispatchEvent(new Event('change'));
  await sleep(80);
  out.k1 = item().keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  // seek 7, type Elevation -12 -> key at tS 7, az preserved (90)
  a.page.seek(7); await sleep(150);
  az = document.querySelector('[data-actf="laz"]');
  const el = document.querySelector('[data-actf="lel"]');
  el.value = '-12'; el.dispatchEvent(new Event('change'));
  await sleep(80);
  out.k2 = item().keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  // the ◆ Key button at playhead 0 -> a third key; keys stay sorted by tS
  a.page.seek(0); await sleep(150);
  document.querySelector('[data-actf="ktoggle"]').click();
  await sleep(80);
  out.k3 = item().keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  out.sorted = item().keys.every((k, i, arr) => i === 0 || arr[i - 1].tS <= k.tS);
  // dedupe: re-editing at the SAME playhead replaces (no 4th key)
  a.page.seek(7); await sleep(150);
  az = document.querySelector('[data-actf="laz"]');
  az.value = '120'; az.dispatchEvent(new Event('change'));
  await sleep(80);
  out.k4 = item().keys.map(k => [k.tS, k.azimuthDeg]);
  // diamonds render on the block (the generic KF_KINDS layer)
  a._ui.refreshTimeline();
  out.diamonds = document.querySelectorAll(`.blk[data-item="${item().id}"] .kf-diamond`).length;
  return JSON.stringify(out);
})()
''')
d = parse(r)
k2 = d.get("k2") or []
check("T2 inspector keys (Azimuth°/Elevation° + ◆) land sorted + deduped",
      d.get("dur") == 10 and d.get("selected") and d.get("fieldsRender")
      and len(d.get("k1", [])) == 1 and near(d["k1"][0][0], 2) and near(d["k1"][0][1], 90)
      and len(k2) == 2 and near(k2[1][0], 7) and near(k2[1][1], 90) and near(k2[1][2], -12)
      and len(d.get("k3", [])) == 3 and near(d["k3"][0][0], 0) and d.get("sorted")
      and len(d.get("k4", [])) == 3 and near(d["k4"][2][0], 7) and near(d["k4"][2][1], 120)
      and d.get("diamonds") == 3,
      f"d={d}")

# ================================================================= T4a: exact probes via seek (rest-eval)
r = ev_file("t4a", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  const lane = () => a.show.show.tracks.find(t => t.characterId === 'sun');
  const item = () => lane().items.find(i => i.kind === 'light-transform');
  // replace the T2 keys with the canonical 2-key dusk track: el 57 -> -20 over 10 s,
  // az 350 -> 10 (the shortest arc wraps through 0)
  a.show.removePerformanceItem(lane().id, item().id);
  a.show.addItem('sun', { kind: 'light-transform', durationS: 10, keys: [], startS: 0 });
  a.show.addLightKeyframe(lane().id, item().id, { tS: 0, azimuthDeg: 350, elevationDeg: 57 });
  a.show.addLightKeyframe(lane().id, item().id, { tS: 10, azimuthDeg: 10, elevationDeg: -20 });
  out.keys = item().keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  a.page.selectedSegment = { trackId: lane().id, itemId: item().id };
  const at = async t => { a.page.seek(t); await sleep(150); return [+a.effLight().azimuthDeg.toFixed(2), +a.effLight().elevationDeg.toFixed(2)]; };
  out.t0 = await at(0); out.t5 = await at(5); out.t10 = await at(10);
  // the pure function cross-check (oracle-style exactness)
  out.pure = await (async () => {
    const T = await import('/editor/js/tracks.js');
    return [0, 5, 10].map(t => { const l = T.lightAtTime(item().keys, t); return [l.azimuthDeg, l.elevationDeg]; });
  })();
  // the frame loop's APPLIED light follows the track (keyDirection derives from the
  // applied az/el inside applyDaylight — the shadow fit re-applies effLight memo-gated)
  const kd = () => [+a.env.keyDirection.x.toFixed(3), +a.env.keyDirection.y.toFixed(3), +a.env.keyDirection.z.toFixed(3)];
  out.appliedAt10 = kd();
  await at(5);
  out.appliedAt5 = kd();
  return JSON.stringify(out);
})()
''')
d = parse(r)
pure = d.get("pure") or [[], [], []]
check("T4a effLight probes t=0/5/10 -> el 57/18.5/-20, az 350/0/10 (shortest arc) + the applied sun follows",
      d.get("keys") == [[0, 350, 57], [10, 10, -20]]
      and d.get("t0") == [350, 57] and near((d.get("t5") or [9, 9])[0], 0) and near(d["t5"][1], 18.5) and d.get("t10") == [10, -20]
      and near(pure[1][0], 0, 1e-6) and near(pure[1][1], 18.5, 1e-6)
      and d.get("appliedAt10") != d.get("appliedAt5"),
      f"d={d}")

# ================================================================= T4b: real playback moves the sun
r = ev_file("t4b", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  a.page.seek(0); await sleep(150);
  out.preEl = a.effLight().elevationDeg;
  a.page.play();
  await sleep(1000);
  out.s1 = { t: +a.page.playheadS.toFixed(2), az: +a.effLight().azimuthDeg.toFixed(2), el: +a.effLight().elevationDeg.toFixed(2), playing: a.page.playing };
  await sleep(1100);
  out.s2 = { t: +a.page.playheadS.toFixed(2), az: +a.effLight().azimuthDeg.toFixed(2), el: +a.effLight().elevationDeg.toFixed(2) };
  // shortest arc: az climbs 350 -> 360/0 -> 10 (+2°/s). The long way would DESCEND toward 10.
  out.azUp = out.s1.az > 349 && out.s2.az > out.s1.az - 0.5 && out.s2.az < 360.5;
  out.elDown = out.s1.el < out.preEl && out.s2.el < out.s1.el;
  a.stopPerformance();
  return JSON.stringify(out);
})()
''')
d = parse(r)
s1 = d.get("s1") or {}
s2 = d.get("s2") or {}
check("T4b playback moves the sun (el descends 57 -> -20, az wraps through 0 the short way)",
      s1.get("playing") is True and s1.get("t", 0) > 0.5 and (s2.get("t", 0) - s1.get("t", 0)) > 0.8
      and s1.get("el", 999) < d.get("preEl", 0) and s2.get("el", 0) < s1.get("el", 999)
      and d.get("azUp") and d.get("elDown"),
      f"d={d}")

# ================================================================= T5: audit L3-1 regression guard
r = ev_file("t5", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  out.snapshot = JSON.parse(JSON.stringify(a.light));   // deep pre-play snapshot
  a.page.seek(0); await sleep(150);
  a.page.play();
  await sleep(2300);                                    // mid-sweep
  out.midEffEl = +a.effLight().elevationDeg.toFixed(2); // the animated value
  out.midSceneEl = a.light.elevationDeg;                // the scene light stays at its own value
  a.stopPerformance();
  await sleep(150);
  out.after = JSON.parse(JSON.stringify(a.light));
  out.byteUnchanged = JSON.stringify(out.snapshot) === JSON.stringify(out.after);
  // stop semantics (audit L3-2): the applied light reverts to the scene light
  out.effAfterStop = [a.effLight().azimuthDeg, a.effLight().elevationDeg];
  out.scene = [a.light.azimuthDeg, a.light.elevationDeg];
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T5 audit L3-1 guard: play+stop leaves app.light BYTE-UNCHANGED; the applied light reverts",
      d.get("byteUnchanged") and abs(d.get("midEffEl", 0) - d.get("midSceneEl", 999)) > 0.5
      and d.get("effAfterStop") == d.get("scene"),
      f"d={d}")

# ================================================================= T3: native disc drag -> key at playhead
r = ev_file("t3-prep", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const lane = () => a.show.show.tracks.find(t => t.characterId === 'sun');
  const item = () => lane().items.find(i => i.kind === 'light-transform');
  a.page.selectedSegment = { trackId: lane().id, itemId: item().id };
  a.page.seek(6); await sleep(200);   // mid-track rest-eval: eff = (2.0, 10.8)
  const out = {
    keys: item().keys.map(k => k.tS),
    preEff: [a.effLight().azimuthDeg, a.effLight().elevationDeg],
    playhead: a.page.playheadS,
  };
  document.getElementById('btnLight').click();   // open the light popover
  await sleep(250);
  const rct = document.getElementById('sunDir').getBoundingClientRect();
  out.cx = rct.x + rct.width / 2; out.cy = rct.y + rct.height / 2;
  out.open = document.getElementById('lightPop').classList.contains('open');
  return JSON.stringify(out);
})()
''')
T3 = parse(r)
assert T3.get("open") and T3.get("cx"), f"t3 prep failed: {r}"

# native pointer drag: down near the knob, move east, up (pointer capture routes the moves)
ab.mouse_move(S, int(T3["cx"]) - 30, int(T3["cy"]) - 6)
ab.run(S, "mouse", "down")
ab.mouse_move(S, int(T3["cx"]) + 42, int(T3["cy"]) + 4)
ab.mouse_move(S, int(T3["cx"]) + 48, int(T3["cy"]) + 6)
time.sleep(0.3)
ab.run(S, "mouse", "up")
time.sleep(0.4)

r = ev_file("t3", r'''
(() => {
  const a = window.__app;
  const out = {};
  const lane = () => a.show.show.tracks.find(t => t.characterId === 'sun');
  const item = () => lane().items.find(i => i.kind === 'light-transform');
  out.keysAfterDrag = item().keys.map(k => [k.tS, +k.azimuthDeg.toFixed(2), +k.elevationDeg.toFixed(2)]);
  out.scene = [a.light.azimuthDeg, a.light.elevationDeg];
  a.show.undo();   // L3-8: the capture rides the drag's gesture bracket
  out.afterUndo = item().keys.map(k => k.tS);
  a.show.redo();
  out.afterRedo = item().keys.map(k => k.tS);
  a.show.undo();   // leave the 2-key dusk track for T6
  document.getElementById('btnLight').click();   // close the popover
  return JSON.stringify(out);
})()
''')
d = parse(r)
key6 = next((k for k in d.get("keysAfterDrag", []) if near(k[0], 6)), None)
ok_t3 = (key6 is not None
         and abs(key6[1] - d.get("scene", [0, 0])[0]) < 0.01      # the dragged azimuth
         and near(key6[2], 10.8, 0.01)                             # the track's elevation preserved
         and abs(key6[1] - T3["preEff"][0]) > 1                     # the drag actually moved it
         and len([k for k in d["keysAfterDrag"] if near(k[0], 6)]) == 1
         and len(d.get("afterUndo") or []) == 2
         and len(d.get("afterRedo") or []) == 3)
check("T3 native disc drag captures ONE key at tS = playhead − startS (dragged az, track el); undo removes it",
      ok_t3, f"d={d} T3prep={T3}")

# ================================================================= T6: the popover mirrors the track
r = ev_file("t6", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  const lane = () => a.show.show.tracks.find(t => t.characterId === 'sun');
  const item = () => lane().items.find(i => i.kind === 'light-transform');
  a.page.selectedSegment = { trackId: lane().id, itemId: item().id };
  a.page.seek(5); await sleep(250);   // mid-track rest-eval
  const eff = a.effLight();
  out.eff = [eff.azimuthDeg, eff.elevationDeg];
  out.scene = [a.light.azimuthDeg, a.light.elevationDeg];
  out.differs = Math.abs(out.eff[0] - out.scene[0]) + Math.abs(out.eff[1] - out.scene[1]) > 1;
  document.getElementById('btnLight').click();
  await sleep(300);
  out.readout = document.getElementById('lpAzEl').textContent;
  out.expected = `az ${Math.round(eff.azimuthDeg)}° · el ${Math.round(eff.elevationDeg)}°`;
  out.phase = document.getElementById('lpPhase').textContent;
  out.knobLeft = document.getElementById('sunDirKnob').style.left;    // the disc mirrors too
  out.handleTop = document.getElementById('sunRailHandle').style.top;
  document.getElementById('btnLight').click();
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T6 the light popover readout == effLight (the animated sun at the playhead, NOT the scene light)",
      d.get("differs") and d.get("readout") == d.get("expected")
      and near((d.get("eff") or [0, 0])[1], 18.5) and d.get("phase") and d.get("knobLeft") and d.get("handleTop"),
      f"d={d}")

# ================================================================= T7: save/load round-trip + normalization + v12 arm
r = ev_file("t7", r'''
(async () => {
  const a = window.__app;
  const out = {};
  const json = a.currentSceneJSON();
  out.v = json.v;
  out.trackInSave = !!json.show.tracks.find(t => t.characterId === 'sun'
    && t.items.some(i => i.kind === 'light-transform' && i.keys.length === 2));
  // round-trip through loadSceneData (normalizeScene + normItems run inside loadScene)
  out.reload = await a.loadSceneData(JSON.parse(JSON.stringify(json)));
  const lane = a.show.show.tracks.find(t => t.characterId === 'sun');
  out.restored = lane?.items.find(i => i.kind === 'light-transform')?.keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  // the normalization arm: a raw hand-crafted scene with bad keys (unsorted, a ≤0.01 s
  // duplicate cluster, az out of range, el out of clamp, a non-finite key) comes back clean
  const dirty = {
    v: 13,
    objects: {},
    show: { name: 'Show', tracks: [{ id: 't1', characterId: 'sun', items: [
      { id: 'i1', kind: 'light-transform', startS: 0, durationS: 4, keys: [
        { tS: 2, azimuthDeg: 400, elevationDeg: 120 },
        { tS: 2.005, azimuthDeg: 10, elevationDeg: -50 },
        { tS: 1, azimuthDeg: -10, elevationDeg: 0 },
        { tS: 3, azimuthDeg: NaN, elevationDeg: 5 },
      ] },
    ] }] },
    light: { azimuthDeg: 128.66, elevationDeg: 57.38 },
  };
  out.dirtyLoad = await a.loadSceneData(dirty);
  const d2 = a.show.show.tracks.find(t => t.characterId === 'sun');
  out.dirtyKeys = d2?.items.find(i => i.kind === 'light-transform')?.keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  // the raw v12 accept arm: a v12 scene carrying the track migrates to v13 intact
  const v12 = JSON.parse(JSON.stringify(dirty));
  v12.v = 12;
  out.v12Load = await a.loadSceneData(v12);
  out.v12Keys = a.show.show.tracks.find(t => t.characterId === 'sun')?.items.find(i => i.kind === 'light-transform')?.keys.map(k => [k.tS, k.azimuthDeg, k.elevationDeg]);
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T7 save/load round-trip (v13 + track + keys) and normItems validation (sorted, 0.01 s dedupe, az mod 360, el clamp, NaN key dropped, v12 accept arm)",
      d.get("v") == 13 and d.get("trackInSave") and d.get("reload") and d.get("restored") == [[0, 350, 57], [10, 10, -20]]
      and d.get("dirtyLoad") and d.get("dirtyKeys") == [[1, 350, 0], [2.005, 10, -30]]
      and d.get("v12Load") and d.get("v12Keys") == [[1, 350, 0], [2.005, 10, -30]],
      f"d={d}")

# ================================================================= T8: no-track scene re-lights exactly as before
ab.close(S)
time.sleep(1)
ab.open_url(S, BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20l3e2e2")
time.sleep(6)
r = ev_file("t8", r'''
(async () => {
  const a = window.__app;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const out = {};
  // the sample is v10 -> migrated to v13 in memory
  out.migrated = a.currentSceneJSON().v === 13;
  out.noSunTrack = !a.show.show.tracks.some(t => t.characterId === 'sun');
  // effLight IS the scene light (reference-identical) at rest and through a seek
  out.identical = a.effLight() === a.light;
  a.page.seek(3); await sleep(250);
  out.identicalAfterSeek = a.effLight() === a.light;
  out.effAfterSeek = [a.effLight().azimuthDeg, a.effLight().elevationDeg];
  // the file's own light survived the migration untouched (the v10 values)
  const sj = a.currentSceneJSON();
  out.savedLight = [sj.light.azimuthDeg, sj.light.elevationDeg];
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T8 NO-TRACK scene re-lights exactly as before (effLight === the scene light, v10 file values intact)",
      d.get("migrated") and d.get("noSunTrack") and d.get("identical") and d.get("identicalAfterSeek")
      and near((d.get("effAfterSeek") or [0, 0])[0], 128.66) and near(d["effAfterSeek"][1], 57.38)
      and near((d.get("savedLight") or [0, 0])[0], 128.66) and near(d["savedLight"][1], 57.38),
      f"d={d}")

# ================================================================= T9: console errors
errs = ab.console_errors(S)
check("T9 console errors == 0", errs.strip() in ("", "0", "[]"), errs[:300])

# ================================================================= summary
print()
print(f"==== R20 L3 LIGHTTRACK E2E: {len(PASS)} PASS / {len(FAIL)} FAIL ====")
for f in FAIL:
    print("  FAILED: " + f)
sys.exit(1 if FAIL else 0)
