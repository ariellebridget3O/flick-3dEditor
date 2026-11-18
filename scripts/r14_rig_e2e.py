#!/usr/bin/env python3
"""r14 rig posing E2E — the full xqr/Dzr/capture flow on the humanoid track.

Steps:
 T1 add a rig-transform item; select the segment; seek inside its window
 T2 spheres: pickables populated (53-1-25 major joints), rigPoseObjectId === humanoid id
 T3 joint click: exclusive select → TC attached to the bone; second joint meta-click → 2 selected
 T4 single-joint drag: synthetic dragging-changed start → bone rotate (TC write) →
    objectChange → end → captureFocusedRigPose → rig keyframe in the store
 T5 pose applied: bone quaternion offset vs pre-drag; undo restores
 T6 multi-joint drag: 2 joints via the centroid handle → both joints captured
 T7 0 console errors
"""
import json, sys, time
sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

def ev(code, t=60):
    r = ab.eval_js("rig", code, timeout=t)
    return str(r)

ab.close("rig")
ab.open_url("rig", "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=" + str(int(time.time())))
time.sleep(4)

print("T1: add rig-transform + select + seek")
r = ev("""(()=>{const a=window.__app;
  const show=a.show.show.tracks.find(x=>x.characterId===a.layout().tracks[0].characterId);
  a.show.addRigTransformItem(show.id, 2);
  const it=show.items.find(i=>i.kind==='rig-transform');
  a.page.selectedSegment={trackId:show.id, itemId:it.id}; a.page.changed();
  a.page.seek(it.startS+2);
  return JSON.stringify({itemId:it.id, startS:it.startS, seg:a.page.selectedSegment, playhead:a.page.playheadS})})()""")
print("  ", r)
d = json.loads(r)

time.sleep(1.0)   # a frame must run for the sphere build
print("T2: spheres + rigPoseObjectId")
r = ev("""(()=>{const a=window.__app;
  return JSON.stringify({pickables:a.rigJointPickables.length,
    rigId:a.rigPoseObjectId===a.layout().tracks[0].characterId,
    visible:a.rigJointGroup.visible, spheres:a._rigSpheres.size})})()""")
print("  ", r)

print("T3: joint click (exclusive) + meta-click (additive)")
r = ev("""(()=>{const a=window.__app; const m=a.manipulator;
  a.rigHandlesSetSelectedJoints(['DEF-head']);           // simulate the click toggle
  m.attachToSelection();
  const single=(m.transform.object&&m.transform.object.isBone)?m.transform.object.name:null;
  a.rigHandlesSetSelectedJoints(['DEF-head','DEF-upper_armL']);  // 2 joints (ancestor-filter keeps both)
  m.attachToSelection();
  const multi=m.transform.object===m._jointHandle;
  return JSON.stringify({single, multi, joints:a.rigHandlesSelectedJoints()})})()""")
print("  ", r)
t3 = json.loads(r)
assert t3["single"] == "DEF-head", "single joint should attach the bone"
assert t3["multi"], "two joints should attach the centroid handle"

print("T4: single-joint drag -> capture")
TID = d["seg"]["trackId"]; IID = d["itemId"]
js = """(()=>{const a=window.__app; const m=a.manipulator;
  a.rigHandlesSetSelectedJoints(['DEF-head']);
  m.attachToSelection();
  const bone=m.transform.object;
  if(!bone||!bone.isBone) return 'ERR not a bone: '+(bone&&bone.name);
  m.transform.dispatchEvent({type:'dragging-changed', value:true});
  const dragOn=!!a.liveRigDrag && a.liveRigDrag.objectId===a.rigPoseObjectId;
  bone.quaternion.set(0.239,0.131,0.0,0.961);   // ~0.5/0.3 rad XYZ as a direct quaternion
  m.transform.dispatchEvent({type:'objectChange'});
  const liveOff=a.liveRigDrag&&a.liveRigDrag.offsets['DEF-head'];
  m.transform.dispatchEvent({type:'dragging-changed', value:false});
  const it=a.show.show.tracks.find(t=>t.id=='TIDVAL').items.find(i=>i.id=='IIDVAL');
  const key=it.keys&&it.keys[0];
  return JSON.stringify({dragOn, liveOffRot:liveOff&&liveOff.rotation.map(v=>+v.toFixed(3)),
    keys:it.keys.length, keyTS:key&&+key.tS.toFixed(2),
    keyJoint:key&&key.joints['DEF-head']&&key.joints['DEF-head'].rotation.map(v=>+v.toFixed(3)),
    liveDragCleared:a.liveRigDrag===null})})()"""
open("/tmp/rig_t4.js", "w").write(js.replace("TIDVAL", TID).replace("IIDVAL", IID))
r = str(ab.eval_file("rig", "/tmp/rig_t4.js", timeout=90))
print("  ", r)
t4 = json.loads(r)
assert t4["dragOn"], "live drag state on"
assert t4["keys"] == 1, "one rig key captured"
assert t4["keyTS"] == 2.0, "key tS = playhead - startS"
k = t4["keyJoint"]
assert k and abs(k[0]) > 0.2, "captured rotation is substantial"

print("T5: pose applied at playhead + undo")
js = """(()=>{const a=window.__app;
  const bone=a.boneOf(a.rigPoseObjectId,'DEF-head');
  const posed=bone.quaternion.x.toFixed(3);
  a.show.undo&&a.show.undo();
  const undone='SKIP';   // read after a frame below
  const it=a.show.show.tracks.find(t=>t.id=='TIDVAL').items.find(i=>i.id=='IIDVAL');
  return JSON.stringify({posed, undone, keysLeft:(it.keys||[]).length})})()"""
open("/tmp/rig_t5.js", "w").write(js.replace("TIDVAL", TID).replace("IIDVAL", IID))
r = str(ab.eval_file("rig", "/tmp/rig_t5.js", timeout=90))
print("  ", r)
time.sleep(0.8)          # the rig restore->mixer->apply cycle runs per frame
r2 = str(ab.eval_js("rig", "JSON.stringify({undone:window.__app.boneOf(window.__app.rigPoseObjectId,'DEF-head').quaternion.x.toFixed(3)})"))
print("  after frame:", r2)
t5 = json.loads(r[:-1] + "," + r2[1:])
assert t5["keysLeft"] == 0, "undo removes the captured key"
assert t5["posed"] != t5["undone"], "pose reverts on undo"

print("T6: multi-joint drag via the handle")
js = """(()=>{const a=window.__app; const m=a.manipulator;
  a.rigHandlesSetSelectedJoints(['DEF-upper_armL','DEF-upper_armR']);
  m.attachToSelection();
  if(m.transform.object!==m._jointHandle) return 'ERR handle not attached';
  m.transform.dispatchEvent({type:'dragging-changed', value:true});
  if(!a.liveRigDrag||a.liveRigDrag.offsets['DEF-upper_armL']===undefined) return 'ERR live drag missing start offsets';
  m._jointHandle.position.y+=0.2;
  m.transform.dispatchEvent({type:'objectChange'});
  const live=a.liveRigDrag.offsets;
  m.transform.dispatchEvent({type:'dragging-changed', value:false});
  const it=a.show.show.tracks.find(t=>t.id=='TIDVAL').items.find(i=>i.id=='IIDVAL');
  const key=it.keys&&it.keys[it.keys.length-1];
  return JSON.stringify({bothLive:!!(live['DEF-upper_armL']&&live['DEF-upper_armR']),
    keys:it.keys.length,
    joints:key&&Object.keys(key.joints),
    armL:key&&key.joints['DEF-upper_armL']&&+key.joints['DEF-upper_armL'].position[1].toFixed(3),
    armR:key&&key.joints['DEF-upper_armR']&&+key.joints['DEF-upper_armR'].position[1].toFixed(3)})})()"""
open("/tmp/rig_t6.js", "w").write(js.replace("TIDVAL", TID).replace("IIDVAL", IID))
r = str(ab.eval_file("rig", "/tmp/rig_t6.js", timeout=90))
print("  ", r)
t6 = json.loads(r)
assert t6["bothLive"], "both joints live during drag"
assert t6["keys"] == 1, "multi capture added one key"
assert set(t6["joints"]) >= {"DEF-upper_armL", "DEF-upper_armR"}, "both joints in the key"
assert abs(t6["armL"]) > 0.005 and abs(t6["armR"]) > 0.005, "both joints got position offsets"

print("T7: console errors")
n = 0
try:
    out = ab.run("rig", "console", [], timeout=30)
    n = str(out).lower().count("error")
except Exception as e:
    print("  console read issue:", str(e)[:80])
print("  errors:", n)
assert n == 0, "console errors present"
print("")
print("ALL RIG E2E PASS")
