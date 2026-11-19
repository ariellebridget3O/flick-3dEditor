#!/usr/bin/env python3
"""r16 segment-drag-to-object E2E — T1 store family, T2 viewport glow candidates,
T3 pointerup drop duplicates into the target track (native pointer flow through the
timeline drag → viewport), T4 dropTaken suppresses the timeline commit, T5 undo.
Run: python3 scripts/r16_segment_e2e.py
"""
import json, os, sys, time

sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

S = "r16s"
URL = "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=r16seg"
TMP = "/tmp/r16s"

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
time.sleep(6)

# ---------------------------------------------------------------- T1 store family
r = ev_file("t1", r'''
(() => {
  const a = window.__app, show = a.show, os = a.objects;
  const out = {};
  const humanIds = Object.keys(os.all()).filter(id => os.get(id).kind === 'humanoid');
  const hA = humanIds[0], hB = humanIds[1] ?? humanIds[0];
  const trA = show.tracks().find(t => t.characterId === hA);
  const clip = trA.items.find(i => i.kind === 'clip');
  out.setup = { hA, hB, clip: clip?.id, trackA: trA?.id };
  if (!clip) return JSON.stringify(out);
  show.beginSegmentDrag({ trackId: trA.id, itemId: clip.id });
  out.dragged = show.draggedSegment()?.id ?? null;
  out.canDropSelf = show.canDropSegmentOnObject(hA);
  out.canDropOtherHuman = show.canDropSegmentOnObject(hB);
  const camId = Object.keys(os.all()).find(id => os.get(id).kind === 'camera');
  out.canDropCamera = camId ? show.canDropSegmentOnObject(camId) : null;
  const tid = os.addObject('target');
  out.canDropTarget = show.canDropSegmentOnObject(tid);
  os.remove(tid, true); os.changed();
  show.endSegmentDrag();
  out.draggedAfterEnd = show.draggedSegment();
  return JSON.stringify(out);
})()
''')
d = parse(r)
check("T1 draggedSegment resolves", d.get('dragged') == (d.get('setup') or {}).get('clip'), str(d.get('dragged')))
check("T1 canDrop self (own track exists)", d.get('canDropSelf') == True, str(d.get('canDropSelf')))
check("T1 canDrop other humanoid", d.get('canDropOtherHuman') == True, str(d.get('canDropOtherHuman')))
check("T1 camera refuses (Art gate)", d.get('canDropCamera') == False, str(d.get('canDropCamera')))
check("T1 target refuses (camera-target exclusion Xu)", d.get('canDropTarget') == False, str(d.get('canDropTarget')))
check("T1 endSegmentDrag clears", d.get('draggedAfterEnd') is None, str(d.get('draggedAfterEnd')))

# ---------------------------------------------------------------- T2 glow candidates on drag start
r = ev_file("t2", r'''
(() => {
  const a = window.__app, show = a.show, os = a.objects;
  const humanIds = Object.keys(os.all()).filter(id => os.get(id).kind === 'humanoid');
  const trA = show.tracks().find(t => t.characterId === humanIds[0]);
  const clip = trA.items.find(i => i.kind === 'clip');
  show.beginSegmentDrag({ trackId: trA.id, itemId: clip.id });
  const glowing = [];
  for (const id of Object.keys(os.all())) {
    const mesh = a.meshById.get(id);
    if (!mesh) continue;
    let g = null;
    mesh.traverse(o => { if (o.isMesh && o.material?.emissive && o.material.emissive.getHex() === 0x3a6fd8) g = true; });
    if (g) glowing.push(id);
  }
  return new Promise(res => setTimeout(() => {
    show.endSegmentDrag();
    const glowingAfter = [];
    for (const id of Object.keys(os.all())) {
      const mesh = a.meshById.get(id);
      if (!mesh) continue;
      let g = null;
      mesh.traverse(o => { if (o.isMesh && o.material?.emissive && o.material.emissive.getHex() === 0x3a6fd8) g = true; });
      if (g) glowingAfter.push(id);
    }
    res(JSON.stringify({glowing, glowingAfter, humanIds}));
  }, 250));
})()
''', wait=0.6)
d = parse(r)
humanIds = d.get('humanIds') or []
check("T2 candidates glow idle-blue on drag start", len(d.get('glowing') or []) >= 1 and all(h in (d.get('glowing') or []) for h in humanIds[:1]), str(d.get('glowing')))
check("T2 glow cleared on drag end", (d.get('glowingAfter') or []) == [], str(d.get('glowingAfter')))

# ---------------------------------------------------------------- T3/T4 pointerup drop
# Real flow: beginSegmentDrag (as the timeline threshold does) → document pointermove
# until the target mesh shows the hover glow (grid search — avoids hand-rolled matrix
# math) → pointerup there (capture listener fires dropSegmentOnObject + segmentDropTaken).
r = ev_file("t3", r'''
(async () => {
  const a = window.__app, show = a.show, os = a.objects;
  const humanIds = Object.keys(os.all()).filter(id => os.get(id).kind === 'humanoid');
  const hA = humanIds[0];
  // ensure a SECOND humanoid (cross-object drop): spawn-grid add if the scene has one rig
  const hB = humanIds[1] ?? os.addObject('humanoid');
  const trA = show.tracks().find(t => t.characterId === hA);
  const clip = trA.items.find(i => i.kind === 'clip');
  const trBExists = !!show.tracks().find(t => t.characterId === hB);
  const targetId = hB;
  const canvas = a.renderer.domElement;
  // the spawned humanoid's GLB mesh loads async — poll until it is raycastable
  if (!a.meshById.get(targetId)) {
    await new Promise(res => {
      const t0 = Date.now();
      const poll = () => (a.meshById.get(targetId) || Date.now() - t0 > 6000) ? res() : setTimeout(poll, 200);
      poll();
    });
  }
  const rect = canvas.getBoundingClientRect();
  const glowOn = id => {
    const mesh = a.meshById.get(id);
    let g = false;
    mesh?.traverse(o => { if (o.isMesh && o.material?.emissive && o.material.emissive.getHex() === 0x33cc88) g = true; });
    return g;
  };
  const tracksCountBefore = show.tracks().length;
  const itemsCountBefore = show.tracks().reduce((n, t) => n + t.items.length, 0);
  show.beginSegmentDrag({ trackId: trA.id, itemId: clip.id });
  let dropPt = null;
  outer:
  for (let gy = 0.2; gy <= 0.9; gy += 0.1) {
    for (let gx = 0.2; gx <= 0.9; gx += 0.1) {
      const px = rect.left + gx * rect.width, py = rect.top + gy * rect.height;
      document.dispatchEvent(new PointerEvent('pointermove', {bubbles: true, cancelable: true, clientX: px, clientY: py, pointerType: 'mouse', pointerId: 7}));
      if (glowOn(targetId)) { dropPt = [px, py]; break outer; }
    }
  }
  if (!dropPt) { show.endSegmentDrag(); return JSON.stringify({err: 'no hover point found', targetId}); }
  document.dispatchEvent(new PointerEvent('pointerup', {bubbles: true, cancelable: true, clientX: dropPt[0], clientY: dropPt[1], pointerType: 'mouse', pointerId: 7}));
  const taken = show.wasSegmentDropTaken();
  const itemsCountAfter = show.tracks().reduce((n, t) => n + t.items.length, 0);
  const tracksCountAfter = show.tracks().length;
  show.endSegmentDrag();
  return JSON.stringify({dropPt, hB, trBExists, taken, itemsCountBefore, itemsCountAfter,
                         tracksCountBefore, tracksCountAfter, signalCleared: show.draggingSegment === null});
})()
''', wait=1.0)
d = parse(r)
check("T3 hover point found on target", d.get('err') is None and d.get('dropPt') is not None, str(d))
check("T3 pointerup drop sets dropTaken", d.get('taken') == True, str(d.get('taken')))
check("T3 duplicate added to target", d.get('itemsCountAfter') == d.get('itemsCountBefore', 0) + 1, str(d.get('itemsCountBefore')) + "->" + str(d.get('itemsCountAfter')))
check("T3 target track exists or was created", d.get('trBExists') == True or d.get('tracksCountAfter') == d.get('tracksCountBefore', 0) + 1, str(d.get('tracksCountBefore')) + "->" + str(d.get('tracksCountAfter')))
check("T3 signal cleared after end", d.get('signalCleared') == True, str(d.get('signalCleared')))

# ---------------------------------------------------------------- T5 undo of the duplicate
# r16 review P2-1: undo must remove BOTH the duplicate item AND the created track (the
# dropSegmentOnObject bracket = one history beat, like the live's coalescing observer).
r = ev(r'''(()=>{const a=window.__app,show=a.show;
  const n0=show.tracks().reduce((n,t)=>n+t.items.length,0);
  const t0=show.tracks().length;
  show.undo();
  const n1=show.tracks().reduce((n,t)=>n+t.items.length,0);
  const t1=show.tracks().length;
  return JSON.stringify({n0,n1,t0,t1})})()''', wait=0.5)
d = parse(r)
check("T5 duplicate undoable (item)", d.get('n1') == d.get('n0', 0) - 1, str(d))
# P2-1: ONE undo removes item AND the created track (t1 == t0 - 1 when the drop created it;
# the drop created a track in this flow since hB spawns without one)
check("T5 created track removed too (one beat)", d.get('t1') == d.get('t0', 0) - 1, str(d.get('t0')) + "->" + str(d.get('t1')))

# ---------------------------------------------------------------- console
time.sleep(0.5)
errs = str(ab.console_errors(S) or '').strip()
check("console errors == 0", errs in ('', '0'), repr(errs))

print(f"\n==== r16 segment E2E: {len(PASS)} PASS / {len(FAIL)} FAIL ====")
if FAIL: print("FAILED:", FAIL)
sys.exit(1 if FAIL else 0)
