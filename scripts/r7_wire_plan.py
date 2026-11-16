#!/usr/bin/env python3
"""R7-1: wire main.js + manipulate.js to the exact-port plan subsystem. Assert-based (fails loudly)."""
import re, sys

ED = '/home/z/my-project/flick-3dEditor/editor/js'

# ---------------- main.js ----------------
src = open(f'{ED}/main.js').read()
def rep(old, new, what):
    global src
    if new in src: print(f'  main.js: {what} already applied'); return
    assert old in src, f'main.js: missing anchor for {what}'
    assert src.count(old) == 1, f'main.js: anchor not unique for {what}'
    src = src.replace(old, new)
    print(f'  main.js: {what} OK')

rep("import { PlanView } from './plan.js';",
    "import { PlanStore, PlanCanvas } from './plan.js';\nimport { getHeadRotation } from './figures.js';\nimport { evalCameraObject, fovFromFocal } from './tracks.js';",
    'imports')

rep("""    // round 6 (C): top-down plan canvas
    this.propCatalogDims = key => this.objectManager?.propCatalog?.[key]?.dims;
    this.planView = new PlanView(this, document.getElementById('viewport'));""",
    """    // round 7 (R7-1): top-down plan canvas — exact port (rDr store + rBr canvas)
    this.propCatalogDims = key => this.objectManager?.propCatalog?.[key]?.dims;
    this.plan = new PlanStore(this);
    this.planView = new PlanCanvas(this, document.getElementById('viewport'), this.plan);
    this._drawPreview = null; this._drawPreviewId = null;""",
    'constructor wiring')

# shownPose + pickPersonKind + drawPreview ghost — insert before loadSceneData section
rep("""  // ================= scene load/save =================""",
    """  // ================= plan facade (round 7 R7-1) =================
  shownPose(id) {  // live shownPose_impl: mesh world TRS (Bie) + fovDeg (cameras) + headRotation (figures)
    const mesh = this.meshById.get(id);
    if (!mesh) return null;
    mesh.updateWorldMatrix(true, false);
    const pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
    mesh.matrixWorld.decompose(pos, quat, scl);
    const e = new THREE.Euler().setFromQuaternion(quat, 'XYZ');
    const out = { position: [pos.x, pos.y, pos.z], rotation: [e.x, e.y, e.z], scale: [scl.x, scl.y, scl.z] };
    const kind = this.objects.get(id)?.kind;
    if (kind === 'camera') {
      // evaluated fov at the playhead (live O.cameraFovDeg): run dZt over the camera's items
      const obj = this.objects.get(id);
      const track = this.show.trackOf(id);
      const aspect = this.page.aspectOf?.() ?? (() => { const k = this.page.recordAspect ?? '16:9'; return { '16:9': 16/9, '9:16': 9/16, '1:1': 1, '4:3': 4/3, '1.85:1': 1.85, '2.39:1': 2.39 }[k] ?? 16/9; })();
      let fovDeg = fovFromFocal(obj.focalLengthMm ?? 50, aspect);
      if (track) {
        const o = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), fovDeg: 0 };
        evalCameraObject({ base: { position: obj.position ?? [0, 1.6, 0], rotation: obj.rotation ?? [0, 0, 0], focalLengthMm: obj.focalLengthMm ?? 50 }, out: o, items: track.items, timeS: this.page.playheadS, aspect, resolvers: this.resolvers() });
        if (o.fovDeg > 0) fovDeg = o.fovDeg;
      }
      out.fovDeg = fovDeg;
    }
    if (kind === 'simple_figure') out.headRotation = getHeadRotation(mesh);
    return out;
  }
  pickPersonKind(id, kind) {   // live pickPersonKind — mesh rebuilds via syncOne kind check
    if (this.objects.get(id)?.kind === kind) return;
    this.objects.update(id, { kind });
    this.objects.changed();
  }
  tickDrawPreview() {  // z port: pose the mesh to the stroke preview ghost; restore on end
    const d = this._drawPreview;
    if (d) {
      const m = this.meshById.get(d.id);
      if (m) {
        this._drawPreviewId = d.id;
        m.position.set(...d.position);
        m.rotation.set(...d.rotation);
        if (d.look && m.userData.figure) m.userData.figure.head.rotation.set(0, d.look.headYawRad, d.look.headPitchRad);
      }
    } else if (this._drawPreviewId) {
      const id = this._drawPreviewId; this._drawPreviewId = null;
      const obj = this.objects.get(id); const m = this.meshById.get(id);
      if (obj && m) {  // restore stored pose
        m.position.set(...(obj.position ?? [0, 0, 0]));
        m.rotation.set(...(obj.rotation ?? [0, 0, 0]));
      }
    }
  }

  // ================= scene load/save =================""",
    'plan facade methods')

# frame loop: drawPreview tick + plan tick with ms timestamp
rep("""    if (this.page.viewportMode === 'plan' && this.page.mode === 'edit' && !this.page.playing) {
      this.scene.updateMatrixWorld();
      this.planView?.tick();
      return;
    }""",
    """    if (this.page.viewportMode === 'plan' && this.page.mode === 'edit' && !this.page.playing) {
      this.scene.updateMatrixWorld();
      this.tickDrawPreview();
      this.planView?.tick(performance.now());
      return;
    }""",
    'frame loop plan gating')

open(f'{ED}/main.js', 'w').write(src)
print('main.js written')

# ---------------- manipulate.js ----------------
src = open(f'{ED}/manipulate.js').read()
def rep2(old, new, what):
    global src
    if new in src: print(f'  manipulate.js: {what} already applied'); return
    assert old in src, f'manipulate.js: missing anchor for {what}'
    assert src.count(old) == 1, f'manipulate.js: anchor not unique for {what}'
    src = src.replace(old, new)
    print(f'  manipulate.js: {what} OK')

# plan-commit adapters at the end of the Manipulator class: find the class end (last method) —
# insert before the final closing of the class. Anchor on _refusalText start to insert BEFORE it is risky;
# instead append methods right after _commitSZt's closing (anchor: the 'return { outcome: "committed" };' + close braces of _commitSZt)
rep2("""    return { outcome: 'committed' };
  }

  _refusalText(reason) { // TZt""",
    """    return { outcome: "committed" };
  }

  // ---- round 7 (R7-1): plan-store commit adapters (rDr.commitOne → SZt/kZt pipelines) ----
  // Cameras+targets take the full SZt pipeline with the plan's pre-computed world pose.
  // planTarget {id, position} replaces the gizmo's mesh-read paired-target position (rDr XWt).
  commitPlanCamera(id, worldPose, mode, planStore) {
    const app = this.app;
    const obj = app.objects.get(id);
    if (!obj) return null;
    const world = {
      position: new THREE.Vector3(...worldPose.position),
      rotation: [...worldPose.rotation],
    };
    const local = planStore.toLocal(id, worldPose);
    const outcome = this._commitSZt(id, obj, null, world, local, mode, planStore);
    if (outcome?.outcome === 'refused') app.toast?.(this._refusalText(outcome.reason));
    else if (outcome?.outcome === 'unbased') app.toast?.('Camera move could not be re-based (' + outcome.reason + ')');
    return outcome;
  }
  _commitPlanTransform(id, localPose) {  // kZt free commit from plan drags
    const app = this.app;
    const obj = app.objects.get(id);
    if (!obj) return null;
    return this._commitKZt(id, obj, localPose);
  }

  _refusalText(reason) { // TZt""",
    'plan commit adapters')

# _commitSZt gains the planTarget seam: paired-target position from plan when provided
rep2("""    // 6. paired target: rotated together during drag (XWt) — commit its new position
    if (targetObj && this._dragStartObj) {""",
    """    // 6. paired target: rotated together during drag (XWt) — commit its new position
    if (planStore?.drag?.planTargetPos && targetObj) {
      app.objects.update(targetObj.id, { position: planStore.drag.planTargetPos(targetObj.id) });
    } else if (targetObj && this._dragStartObj) {""",
    'planTarget seam')

# signature update
rep2("  _commitSZt(id, obj, attached, world, local, mode) {",
    "  _commitSZt(id, obj, attached, world, local, mode, planStore = null) {",
    '_commitSZt signature')

open(f'{ED}/manipulate.js', 'w').write(src)
print('manipulate.js written')
