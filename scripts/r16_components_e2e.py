#!/usr/bin/env python3
"""r16 component-drop family E2E — T1 store family, T2 undo, T3 viewport ghost drop,
T4 camera default track, T5 prop drag, T6 dock drop.
Run: python3 scripts/r16_components_e2e.py
"""
import json, os, sys, time

sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab

S = "r16c"
URL = "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=r16e2e"
TMP = "/tmp/r16"

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
  const app = window.__app, os = app.objects;
  const out = {};
  const c1 = os.addObject('cube');   const o1 = os.get(c1);
  const c2 = os.addObject('sphere'); const o2 = os.get(c2);
  const c3 = os.addObject('cylinder'); const o3 = os.get(c3);
  out.spawn = [o1.position, o2.position, o3.position];
  out.names = [o1.name, o2.name, o3.name];
  const t1 = os.addObject('target'); out.targetPos = os.get(t1).position;
  const s1 = os.addObject('spotlight'); const s1o = os.get(s1);
  out.spotPos = s1o.position; out.spotRot = s1o.rotation;
  const camCountBefore = Object.values(os.all()).filter(o => o.kind === 'camera').length;
  const m1 = os.addCameraMarker(undefined); const m1o = os.get(m1);
  out.markerPos = m1o.position; out.markerR = camCountBefore * 1.5;
  const h1 = os.addComponent({kind:'humanoid'}); out.humanoidAnim = os.get(h1).animation;
  const f1 = os.addComponent({kind:'simple_figure'}); out.figureRot = os.get(f1).rotation.map(x => +x.toFixed(4));
  out.unknownProp = os.addComponent({kind:'prop', propKey:'no_such_key_xyz'}) ?? null;
  out.propLabelExpected = os.propCatalog['chair']?.label ?? null;
  const p1 = os.addComponent({kind:'prop', propKey:'chair'}); const p1o = p1 ? os.get(p1) : null;
  out.propName = p1o ? p1o.name : null; out.propKind = p1o ? p1o.kind : null;
  [c1,c2,c3,t1,s1,m1,h1,f1,p1].forEach(id => os.remove(id, true));
  os.changed();
  return JSON.stringify(out);
})()
''')
d = parse(r)
sp = d.get('spawn', [[None]*3]*3)
check("T1 spawn-grid x=(u%5)*1.5-3", sp[0][0] == -3 and sp[1][0] == -1.5 and sp[2][0] == 0, str(sp))
check("T1 spawn y=0 z=0", all(p[1] == 0 and p[2] == 0 for p in sp))
check("T1 defaultName numbered", str(d.get('names', [''])[0]).startswith('Cube '), str(d.get('names')))
check("T1 target y=1 (UWt)", (d.get('targetPos') or [0,0,0])[1] == 1, str(d.get('targetPos')))
check("T1 spotlight sGt [u4: 3,3.5,0+3]", d.get('spotPos') == [3, 3.5, 3], str(d.get('spotPos')))
# aim kv: from [3,3.5,3] toward [3,0,0] — pitch -atan2(3.5,3)≈-0.8622, yaw 0 (straight -Z)
check("T1 spotlight aim kv pitch/yaw", abs((d.get('spotRot') or [0,0,0])[0] + 0.86217) < 1e-3 and abs((d.get('spotRot') or [0,0,0])[1]) < 1e-9, str(d.get('spotRot')))
check("T1 camera marker [4+r,1.6,4]", abs((d.get('markerPos') or [0,0,0])[1] - 1.6) < 1e-9 and abs((d.get('markerPos') or [0,0,0])[0] - (4 + d.get('markerR', -1))) < 1e-6, str(d.get('markerPos')) + " r=" + str(d.get('markerR')))
check("T1 humanoid ere animation", (d.get('humanoidAnim') or {}).get('clip') == 'idle' and (d.get('humanoidAnim') or {}).get('playing') == False, str(d.get('humanoidAnim')))
check("T1 figure Bst yaw pi", abs((d.get('figureRot') or [0,0,0])[1] - 3.14159) < 1e-3, str(d.get('figureRot')))
check("T1 unknown prop refuses", d.get('unknownProp') is None, str(d.get('unknownProp')))
# defaultName('prop', key) = catalog label (wU); ~100 catalog labels are raw i18n ids
# (offline catalog limitation, SKILL #34) — the contract is name == catalog label.
check("T1 prop adds + label = catalog label", d.get('propKind') == 'prop' and d.get('propName') == d.get('propLabelExpected'), str(d.get('propName')) + " vs " + str(d.get('propLabelExpected')))

# ---------------------------------------------------------------- T2 undo of component add
r = ev(r'''(()=>{const a=window.__app,os=a.objects;
  const before=Object.keys(os.all()).length;
  const id=a.addComponent({kind:'cube'});
  const afterAdd=Object.keys(os.all()).length;
  a.show.undo();
  const afterUndo=Object.keys(os.all()).length;
  return JSON.stringify({before,afterAdd,afterUndo,gone:!os.get(id)})})()''', wait=0.4)
d = parse(r)
check("T2 component add undoable", d.get('afterAdd') == d.get('before', -1) + 1 and d.get('afterUndo') == d.get('before') and d.get('gone') == True, str(d))

# ---------------------------------------------------------------- T3 viewport ghost drop
r = ev_file("t3a", r'''
(() => {
  const app = window.__app, os = app.objects;
  const canvas = app.renderer.domElement;
  const dt = new DataTransfer();
  window.__r16dt = dt;
  const btn = document.querySelector('.add-grid button[data-add="cube"]');
  const mk = (type, x, y) => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  btn.dispatchEvent(mk('dragstart', 10, 10));
  const sig = JSON.stringify(os.draggingComponent);
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const over = mk('dragover', cx, cy);
  canvas.dispatchEvent(over);
  return JSON.stringify({sig, dp1: over.defaultPrevented, types: [...dt.types]});
})()
''')
d = parse(r)
check("T3 dragstart sets signal", 'cube' in str(d.get('sig')), str(d.get('sig')))
check("T3 payload MIME present", 'application/x-stage-component' in str(d.get('types')), str(d.get('types')))
check("T3 dragover preventDefault (drop allowed)", d.get('dp1') == True, str(d.get('dp1')))

time.sleep(0.7)
r = ev_file("t3b", r'''
(() => {
  const app = window.__app;
  const canvas = app.renderer.domElement;
  const dt = window.__r16dt;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const e = new DragEvent('dragover', {bubbles: true, cancelable: true, clientX: cx, clientY: cy});
  Object.defineProperty(e, 'dataTransfer', {value: dt});
  canvas.dispatchEvent(e);
  const ghosts = [];
  app.scene.traverse(o => {
    if (o.isMesh && o.geometry?.type === 'BoxGeometry' && o.material?.transparent
        && Math.abs((o.material.opacity ?? 0) - 0.45) < 1e-6 && o.visible) ghosts.push(o);
  });
  const v = ghosts.length ? ghosts[0].getWorldPosition(ghosts[0].position) : null;   // own .position as target — window.THREE is undefined (ES modules)
  return JSON.stringify({ghostCount: ghosts.length, gx: v ? +v.x.toFixed(3) : null,
                         gy: ghosts.length ? +ghosts[0].position.y.toFixed(3) : null, gz: v ? +v.z.toFixed(3) : null});
})()
''')
d = parse(r)
check("T3 ghost rendered transparent .45", (d.get('ghostCount') or 0) >= 1, str(d.get('ghostCount')))
check("T3 ghost on ground plane (y=0)", d.get('gy') == 0, str(d.get('gy')))

r = ev_file("t3c", r'''
(() => {
  const app = window.__app, os = app.objects;
  const canvas = app.renderer.domElement;
  const dt = window.__r16dt;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const mk = type => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: cx, clientY: cy});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  const before = Object.keys(os.all()).length;
  canvas.dispatchEvent(mk('drop'));
  // real drags fire dragend on the SOURCE tile after drop — that is where the live
  // clears the signal (m9r onDragEnd @5371849 → clearDraggingComponent); VUr does not.
  const btn = document.querySelector('.add-grid button[data-add="cube"]');
  btn.dispatchEvent(mk('dragend', 10, 10));
  const added = Object.values(os.all()).find(o => o.kind === 'cube' && o.name?.startsWith('Cube'));
  return JSON.stringify({before, after: Object.keys(os.all()).length,
                         cleared: os.draggingComponent === null,
                         addedPos: added ? added.position : null});
})()
''')
d = parse(r)
check("T3 drop adds object", d.get('after') == d.get('before', -1) + 1, str(d.get('before')) + "->" + str(d.get('after')))
check("T3 drop clears signal", d.get('cleared') == True, str(d.get('cleared')))
check("T3 added at ground point (y=0)", (d.get('addedPos') or [0,9,9])[1] == 0, str(d.get('addedPos')))

# ---------------------------------------------------------------- T4 camera drop → default track
r = ev_file("t4", r'''
(() => {
  const app = window.__app, os = app.objects, show = app.show;
  const canvas = app.renderer.domElement;
  const rect = canvas.getBoundingClientRect();
  const dt = new DataTransfer();
  const btn = document.querySelector('.add-grid button[data-add="camera"]');
  const mk = (type, x, y) => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  btn.dispatchEvent(mk('dragstart', 10, 10));
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  canvas.dispatchEvent(mk('dragover', cx, cy));
  const tracksBefore = show.tracks().length;
  return new Promise(res => setTimeout(() => {
    canvas.dispatchEvent(mk('drop', cx, cy));
    const cam = Object.values(os.all()).filter(o => o.kind === 'camera').pop();
    const tracksAfter = show.tracks().length;
    const tr = show.tracks()[show.tracks().length - 1];
    res(JSON.stringify({pos: cam ? cam.position : null, rot: cam ? cam.rotation.map(v => +v.toFixed(3)) : null,
                        tracksBefore, tracksAfter, lastKind: tr?.items[0]?.kind, subj: tr?.characterId}));
  }, 400));
})()
''', wait=1.0)
d = parse(r)
check("T4 camera drop y=1.6 (WWt)", abs((d.get('pos') or [0,0,0])[1] - 1.6) < 1e-9, str(d.get('pos')))
check("T4 camera default track added", d.get('tracksAfter', 0) == d.get('tracksBefore', 0) + 1, str(d.get('tracksBefore')) + "->" + str(d.get('tracksAfter')))
check("T4 default item = cam-still", d.get('lastKind') == 'cam-still', str(d.get('lastKind')))
check("T4 aim rotation nonzero", abs((d.get('rot') or [0,0,0])[1]) > 0.01, str(d.get('rot')))

# ---------------------------------------------------------------- T5 prop drag from picker
r = ev_file("t5a", r'''
(() => {
  const app = window.__app, os = app.objects;
  document.querySelector('.add-grid button[data-add="prop"]').click();
  const item = document.querySelector('#propList .prop-item');
  if (!item) return JSON.stringify({err: 'no picker items'});
  const key = item.dataset.key;
  const canvas = app.renderer.domElement;
  const dt = new DataTransfer();
  window.__r16dt2 = dt;
  const mk = (type, x, y) => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  item.dispatchEvent(mk('dragstart', 10, 10));
  const sig = JSON.stringify(os.draggingComponent);
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  canvas.dispatchEvent(mk('dragover', cx, cy));
  return JSON.stringify({key, sig, expectedName: app.propCatalog[key]?.label});
})()
''')
d = parse(r)
KEY = d.get('key'); EXPECTED = d.get('expectedName')
check("T5 prop dragstart signal", 'prop' in str(d.get('sig')), str(d.get('sig')))

time.sleep(1.0)
r = ev_file("t5b", r'''
(() => {
  const app = window.__app, os = app.objects;
  const canvas = app.renderer.domElement;
  const dt = window.__r16dt2;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const mk = type => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: cx, clientY: cy});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  canvas.dispatchEvent(mk('dragover'));
  const ghosts = [];
  app.scene.traverse(o => { if (o.isMesh && o.material?.transparent && Math.abs((o.material.opacity ?? 0) - 0.45) < 1e-6 && o.visible) ghosts.push(o); });
  return JSON.stringify({ghostMid: ghosts.length});
})()
''')
d = parse(r)
check("T5 prop ghost appears", (d.get('ghostMid') or 0) >= 1, str(d.get('ghostMid')))

r = ev_file("t5c", r'''
(() => {
  const app = window.__app, os = app.objects;
  const canvas = app.renderer.domElement;
  const dt = window.__r16dt2;
  const rect = canvas.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const mk = type => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: cx, clientY: cy});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  canvas.dispatchEvent(mk('drop'));
  const btn = document.querySelector('#propList .prop-item');
  if (btn) btn.dispatchEvent(mk('dragend', 10, 10));
  return JSON.stringify({cleared: os.draggingComponent === null});
})()
''')
d = parse(r)
check("T5 drop clears signal", d.get('cleared') == True, str(d.get('cleared')))

# cleanup T5's prop + verify the add landed (name = catalog label)
r = ev(r'''(()=>{const a=window.__app,os=a.objects;
  const p=Object.values(os.all()).filter(o=>o.kind==='prop').pop();
  const out=p?{propKey:p.propKey,name:p.name,pos:p.position}:null;
  if(p)os.remove(Object.keys(os.all()).find(k=>os.all()[k]===p),true);
  a.objects.changed();
  return JSON.stringify({out,cleared:a.objects.draggingComponent===null})})()''', wait=0.4)
d = parse(r)
out = d.get('out') or {}
check("T5 prop drop adds + label", out.get('name') == EXPECTED, str(out.get('name')) + " expected " + str(EXPECTED))
check("T5 prop y=0", (out.get('pos') or [0,9,9])[1] == 0, str(out.get('pos')))

# ---------------------------------------------------------------- T6 dock drop (spawn grid)
r = ev_file("t6", r'''
(() => {
  const app = window.__app, os = app.objects;
  const dt = new DataTransfer();
  const btn = document.querySelector('.add-grid button[data-add="sphere"]');
  const panel = document.getElementById('panelScene');
  const pr = panel.getBoundingClientRect();
  const mk = (type, x, y) => {
    const e = new DragEvent(type, {bubbles: true, cancelable: true, clientX: x, clientY: y});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  btn.dispatchEvent(mk('dragstart', pr.left + 5, pr.top + 5));
  const over = mk('dragover', pr.left + 30, pr.top + 30);
  panel.dispatchEvent(over);
  const dp = over.defaultPrevented;
  const before = Object.keys(os.all()).length;
  panel.dispatchEvent(mk('drop', pr.left + 30, pr.top + 30));
  const after = Object.keys(os.all()).length;
  const added = Object.values(os.all()).filter(o => o.kind === 'sphere').pop();
  return JSON.stringify({dp, before, after, cleared: os.draggingComponent === null,
                         pos: added ? added.position : null});
})()
''', wait=0.6)
d = parse(r)
check("T6 dock dragover preventDefault", d.get('dp') == True, str(d.get('dp')))
check("T6 dock drop adds at spawn", d.get('after') == d.get('before', -1) + 1, str(d.get('before')) + "->" + str(d.get('after')))
check("T6 spawn-grid position (y=0)", (d.get('pos') or [0,9,9])[1] == 0, str(d.get('pos')))
check("T6 signal cleared", d.get('cleared') == True, str(d.get('cleared')))

# ---------------------------------------------------------------- console
time.sleep(0.5)
errs = str(ab.console_errors(S) or '').strip()
check("console errors == 0", errs in ('', '0'), repr(errs))

print(f"\n==== r16 components E2E: {len(PASS)} PASS / {len(FAIL)} FAIL ====")
if FAIL: print("FAILED:", FAIL)
sys.exit(1 if FAIL else 0)
