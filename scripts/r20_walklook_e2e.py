#!/usr/bin/env python3
"""r20_walklook_e2e.py — round-20 L7 draw-path walking LOOK regression suite.

The complaint: "your 'look' is locked while it is walking the path, not usable at all".
Covers D1-D6 (R20_DRAWPATH_LOOK §4/§6):

  T1  combobox round-trip: ONE "Look at" control (no separate Aim/Subject rows); picking a
      subject writes {aim:'subject', subjectId} ATOMICALLY; head+neck track the subject
      during playback; picking Travel yields aim 'travel' with subjectId RETAINED (live-exact)
  T2  the OLD bug is dead: with a subject picked via the combobox the head deflection
      EXCEEDS the walk-cycle wiggle (|headYaw| > 0.06; the reproduced complaint pegged it
      at <= 0.03) and respects the ±70° head budget
  T3  non-person locked: a prop path OFFERS 'locked' (and a locked prop walker translates
      WITHOUT turning); a person path does NOT offer it
  T4  figure-walker vertical-offset case (audit L7-3 — required BEFORE the D2 commit): a
      simple_figure walker aimed at a subject with vertical offset gets
      ezHeadRotation(yaw, pitch) (roll != 0), NOT the naive [pitch, yaw, 0]
  T5  gazeSplit guards: (a) subject straight above (horiz < 1e-6) → pose unchanged early-out;
      (b) |Δ| > 110° → the π−|Δ| headYaw clamp term engages (head takes less, body more,
      total gaze identical) — all cases compared against a pasted reference HM from the bundle
  T6  rig-posed walker: a rig-transform segment selected at rest on a subject-aimed walker →
      the keyed rig pose is NOT stomped by the head look (rigPoseObjectId gate); deselect →
      the look engages (control)
  T7  keyed-head resolver: w2r lerp between keys + the live-look precedence
      (a keyed transform starting AFTER the look wins; one starting before loses) + the
      integration case on the figure walker
  T8  curYaw from the LOCAL quaternion: a walker parented under a rotated group approaches
      the TANGENT world yaw while playing (the world-quaternion read converged parentYaw off)
  T9  console errors == 0

Run: python3 scripts/r20_walklook_e2e.py [--only T1,T2,...]
"""
import json
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "pixel_oracle"))
import ab

S = "r20wl"
BASE = "http://localhost:3000/editor/index.html"
URL = BASE + "?scene=samples/synthetic_tracks.json&noAutosave=1&v=r20wlE2E"
TMP = "/tmp/r20wl"
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


# NB: THREE is NOT a global in the page — vectors/quaternions come from instance .clone(),
# world positions from matrixWorld.elements, containers from the Scene constructor.
# ================================================================= bootstrap + fixture
ab.close(S)
time.sleep(1)
ab.open_url(S, URL)
time.sleep(6)

# Fixture mutations (research doc §7 gotchas: move the sample cube OFF the walker's XZ —
# it sits at the walker's start and shadows plan-canvas hits). Subjects:
#   SubjectFig (simple_figure, (4,0,6))  — the T1/T2 look target, well off the path tangent
#   HighBox   (cube, (0.5,3,-1.5))       — the T4 vertical-offset target
#   FigWalker (simple_figure, (-3,0,-3)) — the figure walker, path (-3,0,-3)->(3,0,-3)
#   Podium    moved to (3,0.5,-3)        — gets a prop path (aim locked) for T3
#   rig-transform item on the Walker track (startS 16, keyed DEF-neck) for T6
r = ev_file("setup", r'''
(() => {
  const a = window.__app, os = a.objects, show = a.show;
  const out = {};
  const ids = k => Object.keys(os.all()).filter(id => os.get(id).kind === k);
  out.walker = ids('humanoid')[0];
  out.cube = ids('cube')[0];
  os.update(out.cube, { position: [3, 0.5, -3], scale: [2, 1, 2] });
  out.subjectFig = os.add({ kind: 'simple_figure', name: 'SubjectFig', position: [4, 0, 6],
    rotation: [0, 0, 0], scale: [1, 1, 1] });
  out.highBox = os.add({ kind: 'cube', name: 'HighBox', position: [0.5, 3, -1.5],
    rotation: [0, 0, 0], scale: [0.6, 0.6, 0.6] });
  out.figWalker = os.add({ kind: 'simple_figure', name: 'FigWalker', position: [-3, 0, -3],
    rotation: [0, 0, 0], scale: [1, 1, 1] });
  os.changed();
  // FigWalker path 0-6s (person → aim UNSET, like a drawn path)
  const figPath = show.addItem(out.figWalker, { kind: 'path', anchors: [
    { pos: [-3, 0, -3], in: [0, 0, 0], out: [1, 0, 0] },
    { pos: [3, 0, -3], in: [-1, 0, 0], out: [0, 0, 0] }], speedUnitsPerS: 1 });
  out.figPathItem = figPath.id;
  out.figTrack = show.show.tracks.find(t => t.characterId === out.figWalker).id;
  // prop path on the cube (startS 12, after the walker's dance 10-15; live
  // replaceMoveFromSamples → aim locked)
  const propPath = show.addItem(out.cube, { kind: 'path', startS: 12, anchors: [
    { pos: [3, 0.5, -3], in: [0, 0, 0], out: [1, 0, 0] },
    { pos: [6, 0.5, -3], in: [-1, 0, 0], out: [0, 0, 0] }], speedUnitsPerS: 1, aim: 'locked' });
  out.propPathItem = propPath.id;
  out.propTrack = show.show.tracks.find(t => t.characterId === out.cube).id;
  // rig-transform item on the Walker track (startS 16) with a keyed DEF-neck pose
  const wTrack = show.show.tracks.find(t => t.characterId === out.walker);
  out.walkerTrack = wTrack.id;
  const rig = show.addItem(out.walker, { kind: 'rig-transform', startS: 16, durationS: 4,
    keys: [{ tS: 0, joints: { 'DEF-neck': { position: [0, 0, 0], rotation: [0.3, 0, 0], scale: [1, 1, 1] } } }] });
  out.rigItem = rig.id;
  out.walkerPathItem = wTrack.items.find(i => i.kind === 'path').id;
  // read-back (SKILL #88)
  out.okMeshes = [out.subjectFig, out.highBox, out.figWalker].every(id => !!a.meshById.get(id));
  out.okFigItem = show.show.tracks.find(t => t.id === out.figTrack).items.some(i => i.id === out.figPathItem);
  out.okRigItem = show.show.tracks.find(t => t.id === out.walkerTrack).items.some(i => i.id === out.rigItem && i.kind === 'rig-transform');
  return JSON.stringify(out);
})()
''')
FX = parse(r)
for k in ("walker", "cube", "subjectFig", "highBox", "figWalker", "figPathItem", "figTrack",
          "propPathItem", "propTrack", "walkerTrack", "rigItem", "walkerPathItem"):
    assert FX.get(k), f"setup missing {k}: {r}"
check("SETUP fixture objects/track items created", FX.get("okMeshes") and FX.get("okFigItem") and FX.get("okRigItem"), str(r)[:300])

# ================================================================= T1 + T2: combobox + walking look
# T1a: the ONE control exists, old rows gone; the person path offers NO 'locked';
#      cameras/spotlights/paired targets absent from the options.
r = ev_file("t1a", r'''
(() => {
  const a = window.__app;
  const out = {};
  a.page.selectedSegment = { trackId: %s, itemId: %s };
  a._ui.refreshInspector();
  const sec = document.getElementById('actionSection');
  out.hasLookAt = !!sec.querySelector('select[data-actf="lookat"]');
  out.oldAimRow = !!sec.querySelector('select[data-actf="aim"]');
  out.oldSubjectRow = !!sec.querySelector('select[data-actf="subject"]');
  const sel = sec.querySelector('select[data-actf="lookat"]');
  out.options = [...sel.options].map(o => ({ v: o.value, t: o.textContent }));
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["walkerTrack"]), json.dumps(FX["walkerPathItem"])))
d = parse(r)
check("T1 ONE Look-at control (Aim/Subject rows gone)", d.get("hasLookAt") and not d.get("oldAimRow") and not d.get("oldSubjectRow"), str(d))
check("T1 person path offers NO 'locked'", not any(o["v"] == "locked" for o in (d.get("options") or [])), str(d.get("options")))
check("T1 camera absent from subject options", not any((o.get("t") or "") == "OrbitCam" for o in (d.get("options") or [])), str(d.get("options")))

# T1b: pick a subject THROUGH THE UI (real change event) → atomic write; then playback
# sampling: neck/head bones + body yaw vs the subject direction; then Travel round-trip.
r = ev_file("t1b", r'''
(async () => {
  const a = window.__app, show = a.show;
  const out = {};
  const sel0 = document.querySelector('#actionSection select[data-actf="lookat"]');
  sel0.value = %s;
  sel0.dispatchEvent(new Event('change', { bubbles: true }));
  const it = show.show.tracks.find(t => t.id === %s).items.find(i => i.id === %s);
  out.afterPick = { aim: it.aim, subjectId: it.subjectId };
  const sec = document.getElementById('actionSection');
  const sel = sec.querySelector('select[data-actf="lookat"]');
  out.displayValue = sel.options[sel.selectedIndex].textContent;
  // playback: sample every 120ms for 2.4s from t=1 (mid-walk, look active)
  const mesh = a.meshById.get(%s);
  const neck = mesh.getObjectByName('DEF-neck'), head = mesh.getObjectByName('DEF-head');
  const subjMesh = a.meshById.get(%s);
  const S = [];
  a.page.seek(1); a.page.play();
  await new Promise(res => {
    const t0 = Date.now();
    const poll = () => {
      const t = a.page.playheadS;
      subjMesh.updateWorldMatrix(true, false);
      const e = subjMesh.matrixWorld.elements;
      S.push({ t: +t.toFixed(3),
        body: +mesh.rotation.y.toFixed(4),
        neck: +(2 * Math.atan2(neck.quaternion.y, neck.quaternion.w)).toFixed(4),
        head: +(2 * Math.atan2(head.quaternion.y, head.quaternion.w)).toFixed(4),
        sx: +e[12].toFixed(3), sz: +e[14].toFixed(3),
        wx: +mesh.position.x.toFixed(3), wz: +mesh.position.z.toFixed(3) });
      if (Date.now() - t0 > 2400) res(); else setTimeout(poll, 120);
    };
    poll();
  });
  a.page.stop();
  out.samples = S;
  // back to Travel through the UI
  const sec2 = document.getElementById('actionSection');
  const sel2 = sec2.querySelector('select[data-actf="lookat"]');
  sel2.value = 'travel';
  sel2.dispatchEvent(new Event('change', { bubbles: true }));
  const it2 = show.show.tracks.find(t => t.id === %s).items.find(i => i.id === %s);
  out.afterTravel = { aim: it2.aim, subjectId: it2.subjectId };
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["subjectFig"]), json.dumps(FX["walkerTrack"]), json.dumps(FX["walkerPathItem"]),
       json.dumps(FX["walker"]), json.dumps(FX["subjectFig"]),
       json.dumps(FX["walkerTrack"]), json.dumps(FX["walkerPathItem"])))
d = parse(r)
samples = d.get("samples") or []
check("T1 picking a subject writes {aim,subjectId} ATOMICALLY",
      (d.get("afterPick") or {}).get("aim") == "subject" and (d.get("afterPick") or {}).get("subjectId") == FX["subjectFig"],
      str(d.get("afterPick")))
check("T1 value display = subject name when aimed", (d.get("displayValue") or "") == "SubjectFig", str(d.get("displayValue")))
check("T1 Travel round-trip: aim 'travel', subjectId RETAINED",
      (d.get("afterTravel") or {}).get("aim") == "travel" and (d.get("afterTravel") or {}).get("subjectId") == FX["subjectFig"],
      str(d.get("afterTravel")))

# T1c/T2: from the samples — the gaze (body + neck + head) points at the subject mid-walk;
#         |head| deflection exceeds the ±0.03 walk wiggle and respects the head budget.
mid = [s for s in samples if 1.4 < s["t"] < 3.2]
if mid:
    tgt_errs = []
    for s in mid:
        tgt = math.atan2(-(s["sx"] - s["wx"]), -(s["sz"] - s["wz"]))
        tot = s["body"] + s["neck"] + s["head"]
        tgt_errs.append(abs(math.atan2(math.sin(tgt - tot), math.cos(tgt - tot))))
    maxhead = max(abs(s["head"]) for s in mid)
    maxneck = max(abs(s["neck"]) for s in mid)
    check("T1 head+neck track the subject during playback (gaze err < 0.45 rad)",
          max(tgt_errs) < 0.45, f"max err {max(tgt_errs):.3f}")
    check("T2 the OLD bug is dead: |head| > walk wiggle (0.06) mid-walk",
          maxhead > 0.06 and maxneck > 0.03, f"max|head|={maxhead:.3f} max|neck|={maxneck:.3f}")
    check("T2 head yaw within the ±70° budget", maxhead <= math.radians(70) + 0.08, f"max|head|={maxhead:.3f}")
else:
    check("T1 playback samples collected", False, str(d)[:300])

# ================================================================= T3: non-person locked
r = ev_file("t3", r'''
(async () => {
  const a = window.__app;
  const out = {};
  // prop path segment → combobox OFFERS locked (selected: aim locked by construction)
  a.page.selectedSegment = { trackId: %s, itemId: %s };
  a._ui.refreshInspector();
  const sec = document.getElementById('actionSection');
  const sel = sec.querySelector('select[data-actf="lookat"]');
  out.propOptions = [...sel.options].map(o => o.value);
  out.propLockedSelected = sel.options[sel.selectedIndex].value === 'locked';
  // locked prop walker translates WITHOUT turning: seek into the prop path
  const cube = a.meshById.get(%s);
  a.page.selectedSegment = null;
  a.page.seek(13);
  await new Promise(r => setTimeout(r, 400));
  out.propMid = { x: +cube.position.x.toFixed(3), rotY: +cube.rotation.y.toFixed(4) };
  a.page.seek(14.5);
  await new Promise(r => setTimeout(r, 400));
  out.propLate = { x: +cube.position.x.toFixed(3), rotY: +cube.rotation.y.toFixed(4) };
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 300));
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["propTrack"]), json.dumps(FX["propPathItem"]), json.dumps(FX["cube"])))
d = parse(r)
check("T3 prop path OFFERS 'locked' (selected)", "locked" in (d.get("propOptions") or []) and d.get("propLockedSelected"), str(d.get("propOptions")))
pm, pl = d.get("propMid") or {}, d.get("propLate") or {}
check("T3 locked prop walker translates without turning",
      pm.get("x", 0) != pl.get("x", 0) and abs(pm.get("rotY", 1)) < 1e-6 and abs(pl.get("rotY", 1)) < 1e-6,
      f"mid={pm} late={pl}")

# ================================================================= T4: figure walker vertical offset (BEFORE the D2 commit — audit L7-3)
r = ev_file("t4", r'''
(async () => {
  const a = window.__app, show = a.show;
  const out = {};
  // aim the FigWalker path at HighBox THROUGH THE UI (the D1 combobox on a figure path)
  a.page.selectedSegment = { trackId: %s, itemId: %s };
  a._ui.refreshInspector();
  const sec = document.getElementById('actionSection');
  const sel = sec.querySelector('select[data-actf="lookat"]');
  out.figHasLocked = [...sel.options].some(o => o.value === 'locked');
  sel.value = %s;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  const it = show.show.tracks.find(t => t.id === %s).items.find(i => i.id === %s);
  out.afterPick = { aim: it.aim, subjectId: it.subjectId };
  // seek to mid-path (t=3): walker ~(0,0,-3), HighBox at (0.5,3,-1.5) → yaw∧pitch both ≠ 0
  a.page.selectedSegment = null;
  a.page.seek(3);
  await new Promise(r => setTimeout(r, 400));
  const T = await import('/editor/js/tracks.js');
  const F = await import('/editor/js/figures.js');
  const mesh = a.meshById.get(%s);
  const head = mesh.userData.figure.head;
  out.observed = [+head.rotation.x.toFixed(6), +head.rotation.y.toFixed(6), +head.rotation.z.toFixed(6)];
  // recompute the split the app used: final body yaw + ownAim + subject(NP) aim point
  const subj = a.meshById.get(%s);
  subj.updateWorldMatrix(true, false);
  const se = subj.matrixWorld.elements;
  const np = show.subjectHeightOffset(%s, a.objects.objects);
  const target = [se[12], se[13] + np, se[14]];
  mesh.updateWorldMatrix(true, false);
  const me = mesh.matrixWorld.elements;
  const split = T.gazeSplit(mesh.rotation.y, [me[12], me[13] + 1.6, me[14]], target);
  out.split = { yaw: +split.headYawRad.toFixed(6), pitch: +split.headPitchRad.toFixed(6) };
  out.expected = F.ezHeadRotation(split.headYawRad, split.headPitchRad).map(v => +v.toFixed(6));
  out.naive = [split.headPitchRad, split.headYawRad, 0].map(v => +v.toFixed(6));
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 300));
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["figTrack"]), json.dumps(FX["figPathItem"]), json.dumps(FX["highBox"]),
       json.dumps(FX["figTrack"]), json.dumps(FX["figPathItem"]),
       json.dumps(FX["figWalker"]), json.dumps(FX["highBox"]), json.dumps(FX["highBox"])))
d = parse(r)
obs, exp, naive = d.get("observed") or [], d.get("expected") or [], d.get("naive") or []
d_err = max(abs(a - b) for a, b in zip(obs, exp)) if obs and exp else 9
d_naive = max(abs(a - b) for a, b in zip(obs, naive)) if obs and naive else 0
check("T4 figure path is a person path (no 'locked' option)", d.get("figHasLocked") is False, str(d.get("figHasLocked")))
check("T4 figure subject pick atomic via combobox",
      (d.get("afterPick") or {}).get("aim") == "subject" and (d.get("afterPick") or {}).get("subjectId") == FX["highBox"],
      str(d.get("afterPick")))
check("T4 fig-walker head == ezHeadRotation(yaw,pitch) (vertical-offset subject)",
      d_err < 1e-4, f"obs={obs} exp={exp} split={d.get('split')} err={d_err}")
check("T4 ...and != naive [pitch,yaw,0] (roll component present)", d_naive > 0.05, f"naive dist={d_naive} naive={naive}")

# ================================================================= T5: gazeSplit guards (D3)
r = ev_file("t5", r'''
(async () => {
  const T = await import('/editor/js/tracks.js');
  const out = {};
  // reference HM pasted from the bundle (@5482972 region)
  const QHr = 70 * Math.PI / 180, JHr = 35 * Math.PI / 180;
  const eBr = (t, e) => Math.max(-e, Math.min(e, t));
  const Vit = t => Math.atan2(Math.sin(t), Math.cos(t));
  const HM = (t, e, n) => {
    const r = n[0] - e[0], s = n[1] - e[1], a = n[2] - e[2], o = Math.hypot(r, a);
    if (o < 1e-6) return { bodyYawRad: t, headPitchRad: 0, headYawRad: 0 };
    const l = Math.atan2(-r, -a), c = Vit(l - t);
    const d = Math.sign(c) * Math.min(Math.abs(c), QHr, Math.PI - Math.abs(c));
    return { bodyYawRad: Vit(t + c - d), headPitchRad: eBr(Math.atan2(s, o), JHr), headYawRad: d };
  };
  const cases = [
    [1.0, [0, 1, 0], [0, 3, 0]],        // (a) straight above → horiz < 1e-6 early-out
    [0, [0, 0, 0], [0.05, 0, 1]],       // (b) ~straight behind → π−|Δ| term
    [0.4, [1, 0, 1], [-2, 0.5, 3]],     // ordinary case
    [-2.2, [0, 0, 0], [1, 2, -0.3]],    // pitch clamp case
  ];
  out.cases = cases.map(c => ({ ref: HM(c[0], c[1], c[2]), ours: T.gazeSplit(c[0], c[1], c[2]) }));
  return JSON.stringify(out);
})()
''')
d = parse(r)
cases = d.get("cases") or []
if len(cases) == 4:
    a0 = cases[0]
    ok_a = (abs(a0["ours"]["bodyYawRad"] - 1.0) < 1e-9 and abs(a0["ours"]["headYawRad"]) < 1e-9
            and abs(a0["ours"]["headPitchRad"]) < 1e-9)
    check("T5a subject straight above → pose unchanged early-out", ok_a, str(a0))
    b = cases[1]
    ok_b = (abs(b["ours"]["headYawRad"] - b["ref"]["headYawRad"]) < 1e-9
            and abs(b["ours"]["bodyYawRad"] - b["ref"]["bodyYawRad"]) < 1e-9
            and abs(b["ours"]["headYawRad"]) < 0.1)
    check("T5b |Δ|>110° → π−|Δ| head clamp (head small, body takes the rest; == reference HM)", ok_b, str(b))
    ok_c = all(abs(x["ours"][k] - x["ref"][k]) < 1e-9 for x in cases for k in ("bodyYawRad", "headYawRad", "headPitchRad"))
    check("T5 gazeSplit matches reference HM on all 4 cases (incl pitch clamp)", ok_c, str(cases))
else:
    check("T5 gazeSplit probes ran", False, str(d)[:300])

# ================================================================= T6: rig-posed walker gate (D4)
r = ev_file("t6", r'''
(async () => {
  const a = window.__app, show = a.show;
  const out = {};
  // aim the walker path at SubjectFig again (the UI path is proven in T1)
  show.updatePathItemAim(%s, %s, 'subject', %s);
  // (1) rig-transform segment SELECTED at rest → seek inside the path → gate skips the merge
  a.page.selectedSegment = { trackId: %s, itemId: %s };
  a._ui.refreshInspector();
  a.page.seek(5);
  await new Promise(r => setTimeout(r, 400));
  const gated = a.rigOffsets.get(%s);
  out.gatedNeck = gated && gated['DEF-neck'] ? gated['DEF-neck'].rotation.map(v => +v.toFixed(4)) : null;
  out.gatedHasHead = !!(gated && gated['DEF-head']);
  // (2) deselect → seek again → the look engages (control)
  a.page.selectedSegment = null;
  a._ui.refreshInspector();
  a.page.seek(5.5);
  await new Promise(r => setTimeout(r, 400));
  const open = a.rigOffsets.get(%s);
  out.openNeck = open && open['DEF-neck'] ? open['DEF-neck'].rotation.map(v => +v.toFixed(4)) : null;
  out.openHasHead = !!(open && open['DEF-head']);
  // restore travel for later arms
  show.updatePathItemAim(%s, %s, 'travel', null);
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 300));
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["walkerTrack"]), json.dumps(FX["walkerPathItem"]), json.dumps(FX["subjectFig"]),
       json.dumps(FX["walkerTrack"]), json.dumps(FX["rigItem"]),
       json.dumps(FX["walker"]), json.dumps(FX["walker"]),
       json.dumps(FX["walkerTrack"]), json.dumps(FX["walkerPathItem"])))
d = parse(r)
check("T6 rig-posed at rest: keyed DEF-neck pose NOT stomped (no look merge)",
      d.get("gatedNeck") == [0.3, 0, 0] and d.get("gatedHasHead") is False,
      f"neck={d.get('gatedNeck')} hasHead={d.get('gatedHasHead')}")
check("T6 control: deselected → head look engages (DEF-neck offset merged + DEF-head present)",
      (d.get("openNeck") or [9, 9, 9])[:1] != [0.3] or (d.get("openNeck") or [0, 0, 0])[1:] != [0, 0] or d.get("openHasHead") is True,
      f"neck={d.get('openNeck')} hasHead={d.get('openHasHead')}")

# ================================================================= T7: keyed head resolver (D6)
r = ev_file("t7", r'''
(async () => {
  const a = window.__app, show = a.show;
  const out = {};
  // unit probes: w2r lerp + precedence (xie/Xyr verbatim semantics)
  const M = await import('/editor/js/tracks.js');
  if (M.keyedHeadRotation) {
    const items = [
      { kind: 'transform', startS: 0, durationS: 10, keys: [
        { tS: 0, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], headRotation: [0, 0, 0] },
        { tS: 4, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], headRotation: [0, 0.8, 0] } ] },
    ];
    const mid = M.keyedHeadRotation(items, 2, [0, 0, 0], null);
    out.lerpMid = mid.map(v => +v.toFixed(4));                       // expect [0, 0.4, 0]
    const liveLate = M.keyedHeadRotation(items, 6, [0, 0, 0], () => ({ sinceS: 1, headRotation: [0.2, 0.2, 0] }));
    out.liveAfterKeyed = liveLate.map(v => +v.toFixed(4));           // sinceS 1 >= startS 0 → live wins
    const liveEarly = M.keyedHeadRotation(items, 6, [0, 0, 0], () => ({ sinceS: -1, headRotation: [0.2, 0.2, 0] }));
    out.liveBeforeKeyed = liveEarly.map(v => +v.toFixed(4));         // sinceS -1 < startS 0 → keyed wins (last key)
  } else {
    out.noExport = true;
  }
  // integration: FigWalker (still subject-aimed from T4, look sinceS 0) + a keyed
  // headRotation transform item starting at 2 → at t=4 the KEYED rotation wins
  const kItem = show.addItem(%s, { kind: 'transform', startS: 2, durationS: 4,
    keys: [{ tS: 0, position: [-3, 0, -3], rotation: [0, 0, 0], scale: [1, 1, 1], headRotation: [0, 0.9, 0] }] });
  a.page.seek(4);
  await new Promise(r => setTimeout(r, 400));
  const mesh = a.meshById.get(%s);
  out.keyedWins = +mesh.userData.figure.head.rotation.y.toFixed(4);
  show.removeItem(%s, kItem.id);
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 300));
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["figWalker"]), json.dumps(FX["figWalker"]), json.dumps(FX["figTrack"])))
d = parse(r)
if d.get("noExport"):
    check("T7 keyedHeadRotation exported (D6)", False, "not implemented yet")
else:
    lm = d.get("lerpMid") or []
    check("T7 w2r lerp between headRotation keys (t=2 → half of 0.8)",
          len(lm) == 3 and abs(lm[1] - 0.4) < 1e-3 and abs(lm[0]) < 1e-6, str(lm))
    la, le = d.get("liveAfterKeyed") or [], d.get("liveBeforeKeyed") or []
    check("T7 precedence: live look (sinceS >= item.startS) wins over keyed",
          len(la) == 3 and abs(la[1] - 0.2) < 1e-6, str(la))
    check("T7 precedence: keyed item starting after the look wins (sinceS < startS)",
          len(le) == 3 and abs(le[1] - 0.8) < 1e-6, str(le))
    check("T7 integration: keyed headRotation (startS 2 > look sinceS 0) beats the subject look at t=4",
          abs((d.get("keyedWins") or 0) - 0.9) < 1e-3, str(d.get("keyedWins")))

# ================================================================= T8: curYaw local quaternion (D5)
r = ev_file("t8", r'''
(async () => {
  const a = window.__app;
  const out = {};
  const mesh = a.meshById.get(%s);
  // parent the walker under a Y-rotated container (mesh-LOCAL rotation must drive the
  // approach; the world-quaternion read mis-estimates the step by parentYaw — with the
  // harness rAF at ~10fps the step is 0.8 rad, so parentYaw 2.5 keeps |Δ| > step and the
  // wrong read OSCILLATES ~2.4 rad off the tangent instead of tracking it)
  const SceneCtor = Object.getPrototypeOf(a.scene).constructor;
  const g = new SceneCtor();
  g.rotation.y = 2.5;
  a.scene.add(g);
  g.updateMatrixWorld(true);
  g.add(mesh);
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 350));
  a.page.play();
  const T = await import('/editor/js/tracks.js');
  const track = a.layout().tracks.find(t => t.characterId === %s);
  const S = [];
  await new Promise(res => {
    const t0 = Date.now();
    const poll = () => {
      const t = a.page.playheadS;
      const st = T.evalCharacterTrack(track, t);
      const tanYaw = st.tangent ? Math.atan2(-st.tangent[0], -st.tangent[2]) : null;
      mesh.updateWorldMatrix(true, false);
      const q = mesh.getWorldQuaternion(mesh.quaternion.clone());
      const wy = Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.z * q.z));
      S.push({ t: +t.toFixed(3), tanYaw: tanYaw === null ? null : +tanYaw.toFixed(4), worldYaw: +wy.toFixed(4) });
      if (Date.now() - t0 > 1500) res(); else setTimeout(poll, 100);
    };
    poll();
  });
  a.page.stop();
  a.scene.add(mesh);   // unparent
  g.removeFromParent();
  a.page.seek(0);
  await new Promise(r => setTimeout(r, 300));
  out.samples = S.filter(s => s.tanYaw !== null && s.t > 0.6);
  return JSON.stringify(out);
})()
''' % (json.dumps(FX["walker"]), json.dumps(FX["walker"])))
d = parse(r)
samples = d.get("samples") or []
if samples:
    errs = [abs(math.atan2(math.sin(s["worldYaw"] - s["tanYaw"]), math.cos(s["worldYaw"] - s["tanYaw"]))) for s in samples]
    check("T8 parented walker tracks the TANGENT world yaw (local-quaternion curYaw)",
          max(errs) < 0.25, f"max err {max(errs):.3f} (the world-read bug oscillates ~2.4 rad off at parentYaw 2.5)")
else:
    check("T8 parented-walker samples collected", False, str(d)[:300])

# ================================================================= T9: console errors
errs = ab.console_errors(S)
check("T9 console errors == 0", not errs, str(errs)[:300])

print()
print("=" * 60)
print(f"r20 walk-look E2E: {len(PASS)} passed, {len(FAIL)} failed")
if FAIL:
    print("FAILED: " + ", ".join(FAIL))
print("=" * 60)
sys.exit(1 if FAIL else 0)
