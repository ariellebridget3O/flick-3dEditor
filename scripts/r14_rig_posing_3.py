#!/usr/bin/env python3
"""r14 rig posing patch 3 — manipulate.js: pWr rig branches (drag start/end), the two
objectChange live-drag handlers, the B() attach order (multi-object → rig →
transformPose/selected), and the pointerup joint-sphere pick (ua order)."""
P = "/home/z/my-project/flick-3dEditor/editor/js/manipulate.js"
s = open(P).read()
orig = s

# --- imports ---
old = "import { lookAtEuler, forwardOfEuler } from"
i = s.find(old)
if i < 0:
    # find the existing import from figures/const to extend
    import re
    m = re.search(r"^import .*from '\./(const|curves|schema)\.js';", s, re.M)
    assert m, "no import anchor"
    s = s[:m.end()] + "\nimport { jointSnapshot, jointOffset, applyHandleDelta, toggleJointSelection, filterAncestorJoints, cloneJoint, IDENTITY_JOINT } from './figures.js';" + s[m.end():]
else:
    s = s.replace(old, "import { jointSnapshot, jointOffset, applyHandleDelta, toggleJointSelection, filterAncestorJoints, cloneJoint, IDENTITY_JOINT } from './figures.js';\nimport { lookAtEuler, forwardOfEuler } from", 1)

# --- the multi-joint handle group x (created next to the TC install) ---
old = """    this.transform.addEventListener('dragging-changed', e => {
      this.dragging = e.value;
      app.orbit.enabled = !e.value;
      this._dragMesh = e.value ? this._attached : null;
      if (e.value) {
        this._dragStartObj = this._attached ? { ...app.objects.get(this._attached.userData.objectId) } : null;
        app.show.beginEditGesture();
      } else this._commit();
    });"""
new = """    // r14 rig posing: the multi-joint handle group (live `x`) — a bare Group seated at
    // the selected bones' centroid; TransformControls attaches to it for multi-joint drags
    this._jointHandle = new THREE.Group();
    app.scene.add(this._jointHandle);
    app.planningAids.push(this._jointHandle);
    this._rigDragSingle = null;      // live `v` — {objectId, joint, clipLocal}
    this._rigDragMulti = null;       // live `w` — {objectId, start, joints:[{joint,clipLocal,startOffset}]}
    this.transform.addEventListener('dragging-changed', e => {
      this.dragging = e.value;
      app.orbit.enabled = !e.value;
      const obj = this.transform.object;
      // ---- rig branches (live order: BEFORE the generic object-drag path; no
      // beginEditGesture — the capture's addRigKeyframe self-brackets) ----
      if (e.value && obj === this._jointHandle) {          // multi-joint drag start
        const id = app.rigPoseObjectId;
        const pairs = id ? this._rigJointPairs(id, app.rigHandlesSelectedJoints()) : [];
        if (!id || pairs.length === 0) { this.transform.detach(); return; }
        this._rigDragMulti = {
          objectId: id,
          start: { position: this._jointHandle.position.clone() },
          joints: pairs.map(({ joint, bone }) => ({
            joint,
            clipLocal: app.clipLocalOf(id, joint) ?? jointSnapshot(bone),
            startOffset: this._rigOffsetOf(id, joint, bone),
          })),
        };
        app.setLiveRigDrag({ objectId: id, offsets: Object.fromEntries(this._rigDragMulti.joints.map(j => [j.joint, j.startOffset])) });
        return;
      }
      if (e.value && obj instanceof THREE.Bone) {          // single-joint drag start
        const id = app.rigPoseObjectId;
        const joint = id ? (this._rigJointPairs(id, app.rigHandlesSelectedJoints()).find(p => p.bone === obj)?.joint ?? null) : null;
        if (!id || !joint) { this.transform.detach(); return; }
        this._rigDragSingle = { objectId: id, joint, clipLocal: app.clipLocalOf(id, joint) ?? jointSnapshot(obj) };
        app.setLiveRigDrag({ objectId: id, offsets: { [joint]: this._rigOffsetOf(id, joint, obj) } });
        return;
      }
      if (!e.value && this._rigDragMulti) {                // multi-joint drag end → capture + reseat
        const off = this._rigMultiOffsets();
        this._rigDragMulti = null;
        app.setLiveRigDrag(null);
        if (off) app.captureFocusedRigPose(off);
        this.attachToSelection();                          // B()
        return;
      }
      if (!e.value && this._rigDragSingle) {               // single-joint drag end → capture
        const v = this._rigDragSingle;
        this._rigDragSingle = null;
        const bone = app.boneOf(v.objectId, v.joint);
        const off = bone ? this._rigOffsetOf(v.objectId, v.joint, bone) : null;
        app.setLiveRigDrag(null);
        if (off) app.captureFocusedRigPose({ [v.joint]: off });
        return;
      }
      // ---- generic object drag (unchanged) ----
      this._dragMesh = e.value ? this._attached : null;
      if (e.value) {
        this._dragStartObj = this._attached ? { ...app.objects.get(this._attached.userData.objectId) } : null;
        app.show.beginEditGesture();
      } else this._commit();
    });
    // r14: the two live objectChange handlers (@5647353) — the drag follows the gizmo
    // by recomputing offsets from the TC-moved pose every change (the per-frame rig tick
    // restores to clipLocal then applies these — the offset absorbs the TC write)
    this.transform.addEventListener('objectChange', () => {
      const obj = this.transform.object;
      if (this._rigDragSingle && obj instanceof THREE.Bone) {
        const v = this._rigDragSingle;
        app.setLiveRigDrag({ objectId: v.objectId, offsets: { [v.joint]: this._rigOffsetOf(v.objectId, v.joint, obj) } });
        return;
      }
      if (this._rigDragMulti && obj === this._jointHandle) {
        const off = this._rigMultiOffsets();
        if (off) app.setLiveRigDrag({ objectId: this._rigDragMulti.objectId, offsets: off });
      }
    });"""
assert old in s, "dragging-changed anchor"
s = s.replace(old, new, 1)

# --- rig helper methods (k/S/T/A verbatim), next to attachToSelection ---
old = "  attachToSelection() {\n    const app = this.app;"
new = """  // ---- r14 rig helpers (live k/S/T/A verbatim) ----
  // k(): selected joint names → ancestor-filtered {joint, bone} pairs (Rzr: a joint
  // whose bone-parent chain contains another selected joint is dropped)
  _rigJointPairs(id, names) {
    return filterAncestorJoints(names, j => {
      const p = this.app.boneOf(id, j)?.parent;
      return p instanceof THREE.Bone ? p.name : null;
    }).map(j => ({ joint: j, bone: this.app.boneOf(id, j) })).filter(p => !!p.bone);
  }
  // S(): seat the multi-joint handle at the bones' centroid, identity rotation
  _rigSeatHandle(bones) {
    const c = new THREE.Vector3(), w = new THREE.Vector3();
    for (const b of bones) c.add(b.getWorldPosition(w));
    c.divideScalar(bones.length);
    this._jointHandle.position.copy(c);
    this._jointHandle.quaternion.identity();
    this._jointHandle.scale.set(1, 1, 1);
    this._jointHandle.updateMatrixWorld(true);
  }
  // T(): current offset of a joint = mBe(bone, clipLocalOf ?? single-drag snapshot)
  _rigOffsetOf(id, joint, bone) {
    const cl = this.app.clipLocalOf(id, joint) ?? this._rigDragSingle?.clipLocal;
    return cl ? jointOffset(bone, cl) : cloneJoint(IDENTITY_JOINT);
  }
  // A(): multi-drag offsets from the handle delta — per joint Dzr(clipLocal + startOffset + delta)
  _rigMultiOffsets() {
    const w = this._rigDragMulti;
    if (!w) return null;
    const delta = {
      position: this._jointHandle.position.clone().sub(w.start.position),
      quaternion: this._jointHandle.quaternion.clone(),
      scale: this._jointHandle.scale.clone(),
    };
    const out = {};
    for (const { joint, clipLocal, startOffset } of w.joints) {
      const bone = this.app.boneOf(w.objectId, joint);
      if (bone) out[joint] = applyHandleDelta(bone, clipLocal, startOffset, delta);
    }
    return Object.keys(out).length > 0 ? out : null;
  }

  attachToSelection() {
    const app = this.app;"""
assert old in s, "attachToSelection anchor"
s = s.replace(old, new, 1)

# --- B() order: insert the rig branch after the multi-object branch ---
old = """    const mesh = app.meshById.get(ids[0]);
    this._attached = mesh ?? null;
    if (mesh) {
      // mode rules F(): track-driven → forced translate; camera scale → translate
      const obj = app.objects.get(ids[0]);"""
new = """    // ---- r14 B() rig branch: a rig-transform segment is selected + joints picked →
    // the gizmo drives the joints (1 = the bone itself, >1 = the centroid handle) ----
    const rigId = app.rigPoseObjectId;
    const rigJoints = app.rigHandlesSelectedJoints();
    if (rigId && rigJoints.length > 0) {
      const pairs = this._rigJointPairs(rigId, rigJoints);
      if (pairs.length > 1) {
        this._rigSeatHandle(pairs.map(p => p.bone));
        this._attached = this._jointHandle;
        this.transform.attach(this._jointHandle);
        return;
      }
      if (pairs.length === 1) {
        this._attached = pairs[0].bone;
        this.transform.attach(pairs[0].bone);
        return;
      }
    }
    // ---- B() `ct`: the transform/cam-transform segment's object outranks the selection ----
    const poseId = app.transformPoseObjectId ?? ids[0];
    const mesh = poseId ? app.meshById.get(poseId) : undefined;
    this._attached = mesh ?? null;
    if (mesh) {
      // mode rules F(): track-driven → forced translate; camera scale → translate
      const obj = app.objects.get(poseId);"""
assert old in s, "B order anchor"
s = s.replace(old, new, 1)

# --- pointerup: joint-sphere pick BEFORE object selection (ua order: paint → joints → objects) ---
old = """      if (app.page.paint) { app.pathEditor.onFloorClick(pick, e); return; }

      if (isDbl) {"""
new = """      if (app.page.paint) { app.pathEditor.onFloorClick(pick, e); return; }

      // r14 rig posing: joint spheres pick FIRST (live ua order) — toggle the joint
      // selection (Fzr: additive with meta/ctrl/shift) and reseat the gizmo
      if (app.rigJointPickables.length > 0) {
        const jh = this._raycaster
          ? this._raycaster.intersectObjects(app.rigJointPickables, false)[0]
          : (() => { const rc = new THREE.Raycaster(); this._raycaster = rc; return rc.intersectObjects(app.rigJointPickables, false)[0]; })();
        if (jh) {
          const jname = jh.object.userData.rigJoint;
          app.rigHandlesSetSelectedJoints(
            toggleJointSelection(app.rigHandlesSelectedJoints(), jname, e.metaKey || e.ctrlKey || e.shiftKey));
          this.attachToSelection();
          return;
        }
      }

      if (isDbl) {"""
assert old in s, "pointerup anchor"
s = s.replace(old, new, 1)

open(P, "w").write(s)
print("manipulate.js patched", len(s) - len(orig), "bytes added")
