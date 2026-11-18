#!/usr/bin/env python3
"""r14 rig posing E2E part 2 — the multi-joint + regression steps (daemon-safe: ab.py)."""
import json, sys, time
sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

def ev(code, t=90):
    return str(ab.eval_js("rig2", code, timeout=t))

ab.close("rig2")
ab.open_url("rig2", "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=" + str(int(time.time())))
time.sleep(5)

print("setup")
r = ev("""(()=>{const a=window.__app;
  const show=a.show.show.tracks.find(x=>x.characterId===a.layout().tracks[0].characterId);
  a.show.addRigTransformItem(show.id,2);
  const it=show.items.find(i=>i.kind==='rig-transform');
  a.page.selectedSegment={trackId:show.id,itemId:it.id}; a.page.changed();
  a.page.seek(it.startS+2);
  return JSON.stringify({trackId:show.id, itemId:it.id, ph:a.page.playheadS})})()""")
print("  ", r)
d = json.loads(r)
time.sleep(1.0)                       # a frame must run: the spheres build in _rigHandlesTick
r = ev("JSON.stringify({spheres:window.__app.rigJointPickables.length})")
print("  spheres:", r)
assert json.loads(r)["spheres"] > 0

ev("""(()=>{const a=window.__app; const m=a.manipulator; window.__attLog=[];
  const orig=m.attachToSelection.bind(m);
  m.attachToSelection=function(){try{window.__attLog.push({o:m.transform.object?(m.transform.object.name||m.transform.object.type):'null', j:a.rigHandlesSelectedJoints().length, ids:a.objects.selectedIds.length, s:((new Error()).stack.split('\\\\n')[2]||'').trim().slice(0,50)});}catch(e){} return orig();};
  return 'logged'})()""")

print("T3b: multi-joint attach")
r = ev("""(()=>{const a=window.__app; const m=a.manipulator;
  a.rigHandlesSetSelectedJoints(['DEF-head','DEF-upper_armL']);
  const pairs=m._rigJointPairs(a.rigPoseObjectId, a.rigHandlesSelectedJoints());
  let err=null;
  try { m.attachToSelection(); } catch(e) { err=String(e); }
  return JSON.stringify({pairs:pairs.map(p=>p.joint),
    obj:m.transform.object===m._jointHandle?'handle':(m.transform.object&&m.transform.object.name)||'none',
    err})})()""")
print("  ", r)
t = json.loads(r)
assert not t["err"], t["err"]
assert t["obj"] == "handle", f"expected handle, got {t['obj']}"

print("T6: multi-joint drag → both captured")
r = ev("""(()=>{const a=window.__app; const m=a.manipulator;
  m.transform.dispatchEvent({type:'dragging-changed', value:true});   // drag start (handle already attached)
  if(!a.liveRigDrag) return 'ERR no live drag after start';
  m._jointHandle.position.y+=0.2;                 // TC write on the handle
  m.transform.dispatchEvent({type:'objectChange'});
  const live=a.liveRigDrag&&a.liveRigDrag.offsets;
  m.transform.dispatchEvent({type:'dragging-changed', value:false});
  const show=a.show.show.tracks.find(t=>t.id==='%s');
  const it=show.items.find(i=>i.id==='%s');
  const key=it.keys&&it.keys[it.keys.length-1];
  return JSON.stringify({bothLive:!!(live&&live['DEF-head']&&live['DEF-upper_armL']),
    keys:(it.keys||[]).length,
    joints:key&&Object.keys(key.joints),
    headY:key&&key.joints['DEF-head']&&+key.joints['DEF-head'].position[1].toFixed(3),
    armY:key&&key.joints['DEF-upper_armL']&&+key.joints['DEF-upper_armL'].position[1].toFixed(3)})})()""" % (d["trackId"], d["itemId"]))
print("  ", r)
t6 = json.loads(r)
assert t6["bothLive"], "both joints live during drag"
assert t6["keys"] == 1
assert set(t6["joints"]) >= {"DEF-head", "DEF-upper_armL"}
assert abs(t6["headY"]) > 0.01 and abs(t6["armY"]) > 0.01, "both joints got position offsets"

print("T-spheres: real mouse click on a sphere (raycast + Fzr + attach)")
import ab as _ab
ev("""(()=>{const a=window.__app;
  const sp=a.rigJointPickables[0];
  if(!sp) return 'ERR no pickables';
  const e=sp.matrixWorld.elements;
  a.orbit.target.set(e[12],e[13],e[14]);
  a.orbit.update&&a.orbit.update();
  return 'aimed'})()""")
time.sleep(0.5)
r = ev("""(()=>{const a=window.__app;
  const cam=a.camera; const pe=cam.projectionMatrix.elements, ve=cam.matrixWorldInverse.elements;
  function mul(m,v){return[m[0]*v[0]+m[4]*v[1]+m[8]*v[2]+m[12]*v[3],m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13]*v[3],m[2]*v[0]+m[6]*v[1]+m[10]*v[2]+m[14]*v[3],m[3]*v[0]+m[7]*v[1]+m[11]*v[2]+m[15]*v[3]];}
  const rect=a.renderer.domElement.getBoundingClientRect();
  for(const sp of a.rigJointPickables){
    const e=sp.matrixWorld.elements;
    let v=mul(ve,[e[12],e[13],e[14],1]); v=mul(pe,v);
    if(v[3]<=0) continue;
    const nx=v[0]/v[3], ny=v[1]/v[3];
    if(nx<-0.7||nx>0.7||ny<-0.7||ny>0.7) continue;
    return JSON.stringify({joint:sp.userData.rigJoint, px:Math.round(rect.x+(nx*0.5+0.5)*rect.width), py:Math.round(rect.y+(-ny*0.5+0.5)*rect.height)});
  }
  return 'ERR none in frame'})()""")
print("  ", r)
c = json.loads(r)
assert "joint" in c, c
_ab.run("rig2", "mouse", "move", c["px"], c["py"], timeout=30)
time.sleep(0.3)
_ab.run("rig2", "mouse", "down", timeout=30)
time.sleep(0.15)
_ab.run("rig2", "mouse", "up", timeout=30)
time.sleep(0.8)
r = ev("""(()=>{const a=window.__app; const m=a.manipulator;
  return JSON.stringify({joints:a.rigHandlesSelectedJoints(),
    attached:m.transform.object?(m.transform.object.name||'group'):'none',
    isBone:!!(m.transform.object&&m.transform.object.isBone)})})()""")
print("  after click:", r)
t = json.loads(r)
assert t["joints"] == [c["joint"]], f"expected {[c['joint']]}, got {t['joints']}"
assert t["isBone"] and t["attached"] == c["joint"], "TC attaches the clicked bone"

print("T-window: spheres hide outside the item window")
r = ev("JSON.stringify({inWin:window.__app.rigJointGroup.visible})")
ev("window.__app.page.seek(1)")                     # before the item start — a frame must run
time.sleep(0.6)
r2 = ev("JSON.stringify({outWin:window.__app.rigJointGroup.visible, pickCleared:window.__app.rigJointPickables.length===0, jointsCleared:window.__app.rigHandlesSelectedJoints().length===0})")
r = r[:-1] + "," + r2[1:]
print("  ", r)
t = json.loads(r)
assert t["inWin"] and not t["outWin"] and t["pickCleared"] and t["jointsCleared"]

print("T-regress: generic gizmo still attaches to selected objects")
r = ev("""(()=>{const a=window.__app; const m=a.manipulator;
  const cam=a.layout().tracks.find(t=>a.objects.get(t.characterId)?.kind==='camera');
  a.objects.select([cam.characterId]);
  m.attachToSelection();
  const ok1=m.transform.object&&m.transform.object.userData.objectId===cam.characterId;
  a.objects.select([]);
  m.attachToSelection();
  return JSON.stringify({cameraAttach:ok1})})()""")
time.sleep(0.8)                     # let the store subscription + a frame settle
r2 = ev("JSON.stringify({emptyDetaches:!window.__app.manipulator.transform.object, tail:(window.__attLog||[]).slice(-6)})")
r = r[:-1] + "," + r2[1:]
print("  ", r)
t = json.loads(r)
assert t["cameraAttach"] and t["emptyDetaches"], t

print("\nconsole errors:")
n = 0
try:
    out = ab.run("rig2", "console", [], timeout=30)
    n = str(out).lower().count("error")
except Exception as e:
    print("  (console read failed:", str(e)[:80], ")")
print("  errors:", n)
assert n == 0
print("\nRIG E2E PART2 ALL PASS")
