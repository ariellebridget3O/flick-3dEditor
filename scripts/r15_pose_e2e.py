#!/usr/bin/env python3
"""r15 held-pose family E2E — setObjectPose / pendingPoses / bakeRigPoseSegment /
bakePendingPose / sampleClipRigOffsets / onSkeletonReady wiring (verbatim ports).

Steps:
 T1 sampleClipRigOffsets: real pose clip -> non-empty joints; 'idle' -> all-zero map
    (fWr on identical clips yields zero offsets — bundle math; the live's N gate
    short-circuits 'idle' BEFORE the solver, so callers never see this);
    unknown pose -> null (rig-missing -> null)
 T2 setObjectPose wrapper: clears pendingPoses + store record animation={clip,playing:false};
    rig eval poses paused at t=0 after a frame
 T3 bakeRigPoseSegment: fresh track + rig-transform item (UNSELECTED) + key {tS:0,joints}
    deep-equal to the sampled map; gate: object WITH an existing track -> false
 T4 pending flow end-to-end: new humanoid + markPosePending BEFORE skeleton load ->
    onSkeletonReady resolves it -> baked track appears, pendingPoses cleared
 T5 bakePendingPose fallback: pending on an object that ALREADY has a track -> solver
    succeeds but bake fails -> setObjectPose fallback + pending cleared
 T6 pixel regression: pixel matrix 7/7 (run separately)
 T7 0 console errors
"""
import json, sys, time
sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

def ev(code, t=60):
    r = ab.eval_js("r15", code, timeout=t)
    return str(r)

def frame_wait(s=0.6):
    time.sleep(s)

ab.close("r15")
ab.open_url("r15", "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=" + str(int(time.time())))
time.sleep(5)

print("T1: sampleClipRigOffsets (real rig, real clips)")
r = ev("""(()=>{const a=window.__app;
  const hid=[...a.objectManager.humanoidRigs.keys()][0];
  const j=a.sampleClipRigOffsets(hid,'crouch_idle');
  const idleJ=a.sampleClipRigOffsets(hid,'idle');
  const unknownJ=a.sampleClipRigOffsets(hid,'no_such_clip');
  const noRig=a.sampleClipRigOffsets('no_such_object','crouch_idle');
  const n=j?Object.keys(j).length:0;
  const finite=j?Object.values(j).every(k=>k.position.every(Number.isFinite)&&k.rotation.every(Number.isFinite)&&k.scale.every(Number.isFinite)):false;
  const zero=idleJ?Object.values(idleJ).every(k=>k.position.every(v=>v===0)&&k.rotation.every(v=>v===0)&&k.scale.every(v=>v===1)):null;
  return JSON.stringify({hid, joints:n, finite, idleZeroMap:idleJ?Object.keys(idleJ).length:null, idleAllZero:zero, unknownNull:unknownJ===null, noRigNull:noRig===null})})()""")
print("  ", r)
t1 = json.loads(r)
assert t1["joints"] > 0 and t1["finite"], "crouch_idle must sample to a finite joints map"
assert t1["idleAllZero"] and t1["idleZeroMap"] == 22, "idle-vs-idle = 22-entry all-zero map (bundle fWr math)"
assert t1["unknownNull"] and t1["noRigNull"], "unknown pose / missing rig must be null"

print("T2: setObjectPose wrapper (clears pending, pauses the clip)")
r = ev("""(()=>{const a=window.__app;
  const hid=[...a.objectManager.humanoidRigs.keys()][0];
  a.markPosePending(hid,'dance');
  a.setObjectPose(hid,'crouch_idle');
  return JSON.stringify({pending:a.pendingPoses.size,
    anim:a.objects.get(hid).animation})})()""")
print("  ", r)
t2 = json.loads(r)
assert t2["pending"] == 0, "wrapper must clear the pending entry"
assert t2["anim"]["clip"] == "crouch_idle" and t2["anim"]["playing"] is False, "held-pose representation"
frame_wait()
r = ev("""(()=>{const a=window.__app;
  const hid=[...a.objectManager.humanoidRigs.keys()][0];
  const rig=a.objectManager.humanoidRigs.get(hid);
  const act=rig.actions.get('crouch_idle');
  return JSON.stringify({clip:rig.currentClip, paused:act?act.paused:null, time:act?act.time:null})})()""")
print("  ", r)
t2b = json.loads(r)
assert t2b["clip"] == "crouch_idle" and t2b["paused"] is True, "rig must pose the held clip paused"

print("T3: bakeRigPoseSegment on a FRESH humanoid (no track yet) + existing-track gate")
r = ev("""(()=>{const a=window.__app;
  const id=a.objects.add({kind:'humanoid', name:'BakeTest', position:[-2,0,0], rotation:[0,0,0],
    scale:[1,1,1], animation:{clip:'idle', playing:false}});
  return JSON.stringify({id, rigs:a.objectManager.humanoidRigs.has(id)})})()""")
print("  ", r)
BAKE_ID = json.loads(r)["id"]
for _ in range(40):
    frame_wait(0.5)
    r = ev(f"JSON.stringify({{rig:a0=window.__app.objectManager.humanoidRigs.has('{BAKE_ID}')}})")
    if json.loads(r)["rig"]:
        break
r = ev(f"""(()=>{{const a=window.__app;
  const j=a.sampleClipRigOffsets('{BAKE_ID}','crouch_idle');
  const before=a.show.show.tracks.length;
  const ok=a.bakeRigPoseSegment('{BAKE_ID}',j);
  const tr=a.show.show.tracks[a.show.show.tracks.length-1];
  const it=tr.items[tr.items.length-1];
  const same=it.keys&&it.keys[0]?JSON.stringify(it.keys[0].joints)===JSON.stringify(j):false;
  const existingGate=a.bakeRigPoseSegment('{BAKE_ID}',j);   // now HAS a track -> false
  return JSON.stringify({{ok, before, after:a.show.show.tracks.length, character:tr.characterId==='{BAKE_ID}',
    kind:it.kind, selected:a.page.selectedSegment&&a.page.selectedSegment.itemId===it.id,
    tS0:it.keys&&it.keys[0]?it.keys[0].tS:null, jointsSame:same, existingGate}})}})()""")
print("  ", r)
t3 = json.loads(r)
assert t3["ok"] is True and t3["after"] == t3["before"] + 1, "bake creates exactly one track"
assert t3["character"] and t3["kind"] == "rig-transform" and t3["tS0"] == 0, "rig-transform track shape"
assert t3["jointsSame"], "baked joints must equal the sampled map verbatim"
assert not t3["selected"], "addRigTransformItem(track, undefined, FALSE) must not select"
assert t3["existingGate"] is False, "existing track -> addPerformanceTrack null -> bake false"

print("T4: pending flow on a NEW humanoid (mark BEFORE skeleton loads)")
r = ev("""(()=>{const a=window.__app;
  const id=a.objects.add({kind:'humanoid', name:'Pending', position:[2,0,0], rotation:[0,0,0],
    scale:[1,1,1], animation:{clip:'idle', playing:false}});
  a.markPosePending(id,'dance');
  return JSON.stringify({id, pending:a.pendingPoses.get(id), rigsBefore:a.objectManager.humanoidRigs.has(id)})})()""")
print("  ", r)
t4 = json.loads(r)
assert t4["pending"] == "dance" and t4["rigsBefore"] is False, "pending set while skeleton loads"
NEW = t4["id"]
for _ in range(40):
    frame_wait(0.5)
    r = ev(f"""(()=>{{const a=window.__app; return JSON.stringify({{rig:a.objectManager.humanoidRigs.has('{NEW}'), pending:a.pendingPoses.has('{NEW}')}})}})()""")
    d = json.loads(r)
    if d["rig"]:
        break
print("   rig ready:", r)
frame_wait()   # onSkeletonReady runs synchronously inside _loadHumanoid before rig visible? it fires right after set — poll pending
r = ev(f"""(()=>{{const a=window.__app;
  const tr=a.show.show.tracks.find(t=>t.characterId==='{NEW}');
  const it=tr&&tr.items.find(i=>i.kind==='rig-transform');
  return JSON.stringify({{pending:a.pendingPoses.has('{NEW}'), hasTrack:!!tr, itemKind:it?it.kind:null,
    keyJoints:it&&it.keys[0]?Object.keys(it.keys[0].joints).length:0,
    anim:a.objects.get('{NEW}').animation}})}})()""")
print("  ", r)
t4b = json.loads(r)
assert t4b["pending"] is False, "onSkeletonReady must resolve the pending pose"
assert t4b["hasTrack"] and t4b["keyJoints"] > 0, "baked rig-transform track with joints"

print("T5: bake-failure fallback (pending on an object that already has a track)")
r = ev(f"""(()=>{{const a=window.__app;
  a.markPosePending('{NEW}','dance');          // {NEW} now HAS a track -> bake will fail
  a.bakePendingPose('{NEW}',(oid,p)=>a.sampleClipRigOffsets(oid,p)??null);
  return JSON.stringify({{pending:a.pendingPoses.has('{NEW}'),
    anim:a.objects.get('{NEW}').animation}})}})()""")
print("  ", r)
t5 = json.loads(r)
assert t5["pending"] is False, "fallback clears pending"
assert t5["anim"]["clip"] == "dance" and t5["anim"]["playing"] is False, "setObjectPose fallback"

print("T6: person-kind switch (confirm gate + strip + rename + pending clear)")
# Fresh auto-named humanoid with a clip item + a held pose (setObjectPose — deterministic;
# note: marking pending BEFORE the skeleton while a track exists exercises the T5 fallback
# instead — that's bundle-correct, just not what this test probes)
r = ev("""(()=>{const a=window.__app;
  const id=a.objects.add({kind:'humanoid', name:'Human 9', position:[0,0,-2], rotation:[0,0,0],
    scale:[1,1,1], animation:{clip:'idle', playing:false}});
  const tr=a.show.addPerformanceTrack(id);
  a.show.addClipItem(tr,'walk');
  a.setObjectPose(id,'dance');   // held pose (un-baked form) -> UNr pose:true
  return JSON.stringify({id, tr, tracks:a.show.show.tracks.length, anim:a.objects.get(id).animation})})()""")
SW = json.loads(r)["id"]; SWTR = json.loads(r)["tr"]
for _ in range(40):
    frame_wait(0.5)
    r = ev(f"JSON.stringify({{rig:window.__app.objectManager.humanoidRigs.has('{SW}')}})")
    if json.loads(r)["rig"]:
        break
r = ev(f"""(()=>{{const a=window.__app;
  const before={{kind:a.objects.get('{SW}').kind, name:a.objects.get('{SW}').name,
    tracks:a.show.show.tracks.length, anim:a.objects.get('{SW}').animation,
    pending:a.pendingPoses.has('{SW}')}};
  const info=a.switchPersonKind('{SW}','simple_figure',{{}});   // verbatim first run: confirm gate returns info, NOTHING changes
  const mid={{kind:a.objects.get('{SW}').kind, tracks:a.show.show.tracks.length,
    anim:a.objects.get('{SW}').animation, pending:a.pendingPoses.has('{SW}')}};
  return JSON.stringify({{before,
    hasInfo:!!(info&&(info.items&&info.pose!==undefined)),
    infoItems:info?info.items.length:null, infoPose:info?info.pose:null, mid}})}})()""")
print("  ", r)
t6 = json.loads(r)
assert t6["before"]["kind"] == "humanoid" and t6["before"]["anim"]["clip"] == "dance", "setup: humanoid + held pose"
assert t6["hasInfo"] and t6["infoItems"] == 1 and t6["infoPose"] is True, "UNr info: clip item + held pose"
assert t6["mid"]["kind"] == "humanoid" and t6["mid"]["tracks"] == t6["before"]["tracks"], "confirm gate refuses until confirmed"
# the toast path: pickPersonKind first run shows the confirm toast with the action button
r = ev(f"""(()=>{{const a=window.__app;
  a.pickPersonKind('{SW}','simple_figure');
  const t=document.getElementById('toast');
  return JSON.stringify({{shown:t.style.display==='block',
    hasAction:!!t.querySelector('.toast-action'), label:t.querySelector('.toast-action')?.textContent}})}})()""")
print("  ", r)
t6t = json.loads(r)
assert t6t["shown"] and t6t["hasAction"], "confirm toast with action button shows"
# confirm: removeHumanOnly -> strip + switch + rename (auto-named Human 9 -> Figure N)
r = ev(f"""(()=>{{const a=window.__app;
  a.switchPersonKind('{SW}','simple_figure',{{removeHumanOnly:true}});
  const o=a.objects.get('{SW}');
  return JSON.stringify({{kind:o.kind, name:o.name, anim:o.animation===undefined||o.animation===null?'stripped':o.animation,
    itemsGone:(a.show.show.tracks.find(t=>t.id==='{SWTR}')?.items??[]).length===0,
    pending:a.pendingPoses.has('{SW}'), rigGone:!a.objectManager.humanoidRigs.has('{SW}')}})}})()""")
print("  ", r)
t6b = json.loads(r)
assert t6b["kind"] == "simple_figure", "kind switched"
assert t6b["anim"] == "stripped", "setPersonKind strips animation (held pose cleared)"
assert t6b["itemsGone"], "performance items removed (the empty track remains — verbatim removePerformanceItem filters items only)"
assert t6b["pending"] is False, "pendingPoses.delete(id)"
assert t6b["rigGone"], "figure rebuild disposes the rig record"
assert t6b["name"].startswith("Figure "), "auto-named person renames to defaultName(newKind)"
# undo the confirm run (gesture-bracketed) — kind + items restore
r = ev(f"""(()=>{{const a=window.__app; a.show.undo();
  const o=a.objects.get('{SW}');
  return JSON.stringify({{kind:o.kind, name:o.name,
    itemsBack:(a.show.show.tracks.find(t=>t.id==='{SWTR}')?.items??[]).length>0}})}})()""")
print("  ", r)
t6c = json.loads(r)
assert t6c["kind"] == "humanoid" and t6c["itemsBack"], "undo restores the confirm run"
# switch BACK humanoid->figure->humanoid re-seeds ere animation
r = ev(f"""(()=>{{const a=window.__app;
  a.switchPersonKind('{SW}','simple_figure',{{removeHumanOnly:true}});
  a.switchPersonKind('{SW}','humanoid',{{}});
  const o=a.objects.get('{SW}');
  return JSON.stringify({{kind:o.kind, anim:o.animation}})}})()""")
print("  ", r)
t6d = json.loads(r)
assert t6d["kind"] == "humanoid" and t6d["anim"]["clip"] == "idle" and t6d["anim"]["playing"] is False, "humanoid re-seed (ere)"
# T6b: the UI ADD path names via defaultName (numbered) — the autoNamed rename keys on it
r = ev("""(()=>{const a=window.__app;
  const n0=a.show.show.tracks.length;
  const id=a.objects.add({kind:'humanoid', position:[0,0,2], rotation:[0,0,0], scale:[1,1,1],
    animation:{clip:'idle', playing:false}});
  const nm0=a.objects.get(id).name;
  a.switchPersonKind(id,'simple_figure',{});
  const nm1=a.objects.get(id).name;
  a.switchPersonKind(id,'humanoid',{});
  const nm2=a.objects.get(id).name;
  return JSON.stringify({id, nm0, auto:!!nm0&&/^Human \\d+$/.test(nm0),
    nm1, renamed:!!nm1&&/^Figure \\d+$/.test(nm1), nm2, sameBack:nm2===nm0})})()""")
print("  ", r)
t6e = json.loads(r)
assert t6e["auto"], "UI add (name omitted) -> defaultName 'Human N'"
assert t6e["renamed"], "switch humanoid->figure renames the auto-named person to 'Figure M'"
assert t6e["sameBack"], "switching back re-numbers consistently"

print("T7: console errors")
try:
    errs = str(ab.console_errors("r15")).strip()
except Exception as e:
    errs = f"(errors cmd failed: {e})"
print("   errors:", errs[:400] if errs else "(empty)")
assert errs == "" or errs.lower() in ("none", "no errors"), "zero console errors"

print("ALL PASS")
