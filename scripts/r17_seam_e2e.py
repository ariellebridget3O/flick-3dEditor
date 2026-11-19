#!/usr/bin/env python3
"""r17 seams E2E: plan-canvas component drop + rotation multi-turn snap."""
import json, os, sys, time
sys.path.insert(0, "/home/z/my-project/flick-3dEditor/scripts/pixel_oracle")
import ab
S, TMP = "r17s2", "/tmp/r17s2"
os.makedirs(TMP, exist_ok=True)
PASS, FAIL = [], []
def check(n, c, d=""):
    (PASS if c else FAIL).append(n); print(("PASS " if c else "FAIL ") + n + (f"  [{d}]" if d and not c else ""))
def ev_file(name, js, wait=0.0):
    if wait: time.sleep(wait)
    p = os.path.join(TMP, name + ".js"); open(p, "w").write(js); return ab.eval_file(S, p)
def parse(r):
    if isinstance(r, (dict, list)): return r
    try: return json.loads(str(r))
    except Exception: return {}
ab.close(S)
ab.open_url(S, "http://localhost:3000/editor/index.html?scene=samples/synthetic_tracks.json&noAutosave=1&v=r17seam")
for _ in range(40):
    time.sleep(0.5)
    try:
        if str(ab.eval_js(S, '!!window.__app')) == 'true': break
    except Exception: pass
time.sleep(1)

# S1: plan-canvas component drop (synthetic DragEvent per SKILL #59)
r = parse(ev_file("s1b", r"""
(() => {
  const a = window.__app;
  a.objects.setDraggingComponent ? a.objects.setDraggingComponent({kind: 'prop', kind: 'cube'}) : null;
  const canvas = document.querySelector('canvas[data-testid="stage-plan"]');
  const mk = (type) => {
    const dt = new DataTransfer();
    dt.setData('application/x-stage-component', 'x');
    const e = new DragEvent(type, {bubbles: true, cancelable: true});
    Object.defineProperty(e, 'dataTransfer', {value: dt});
    return e;
  };
  canvas.dispatchEvent(mk('dragover'));
  const before = Object.keys(a.objects.all()).length;
  canvas.dispatchEvent(mk('drop'));
  const after = Object.keys(a.objects.all()).length;
  a.objects.setDraggingComponent(null);
  return JSON.stringify({draggingSet: a.objects.draggingComponent !== undefined, added: after - before});
})()""", wait=0.4))
check("S1 plan drop adds the component", r.get("added") == 1, json.dumps(r))

# S2: rotation multi-turn snap — simulate the objectChange flow
r = parse(ev_file("s2", r"""
(() => {
  const a = window.__app;
  const manip = a.manipulator;
  // pick a prop, attach the gizmo, simulate a rotate drag: base 0.3; spin the object +4.2π
  const prop = Object.entries(a.objects.all()).find(([id, o]) => o.kind === 'prop' || o.kind === 'cube');
  if (!prop) return JSON.stringify({err: 'no prop'});
  const id = prop[0];
  a.objects.select([id]);
  manip.attachToSelection();
  const obj = manip.transform.object;
  if (!obj) return JSON.stringify({err: 'not attached'});
  obj.rotation.set(0.3, 0.5, 0.1);
  manip._rotSnapBase = [0.3, 0.5, 0.1];
  obj.rotation.set(0.3 + 4 * 2 * Math.PI, 0.5, 0.1);        // 4 extra full turns on x
  manip.transform.dispatchEvent({type: 'objectChange'});
  const snapped = [obj.rotation.x, obj.rotation.y, obj.rotation.z];
  manip._rotSnapBase = null;
  return JSON.stringify({snapped: snapped.map(v => +v.toFixed(4)), nearBase: Math.abs(snapped[0] - 0.3) < 1e-6 && Math.abs(snapped[1] - 0.5) < 1e-6 && Math.abs(snapped[2] - 0.1) < 1e-6});
})()""", wait=0.4))
check("S2 rotation snap keeps values near the base", r.get("nearBase"), json.dumps(r))

errs = ab.console_errors(S)
check("S-console 0 errors", not errs, str(errs)[:200])
print(f"\nr17 seams E2E: {len(PASS)} PASS / {len(FAIL)} FAIL")
sys.exit(1 if FAIL else 0)
