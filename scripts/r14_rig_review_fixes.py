#!/usr/bin/env python3
"""r14 rig posing review fixes (P1-1..P1-3, P2-1, P2-2, P3-1/2/3/5/6)."""
P = "/home/z/my-project/flick-3dEditor/editor/js/manipulate.js"
s = open(P).read()
orig = s

# ---- P1-1 + P2-1 + P2-2 + P1-2(empty-ids fall-through): rewrite attachToSelection head to the bundle B() order ----
old = """  attachToSelection() {
    const app = this.app;
    // ---- r14 B() rig branch FIRST (verbatim order: mid-drag → multi-object → RIG →
    // single) — independent of OBJECT selection: the gizmo drives the joints of the
    // selected rig-transform segment even with nothing selected ----
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
    const ids = app.objects.selectedIds;
    if (ids.length === 0) { this.transform.detach(); this._attached = null; return; }
    if (ids.length > 1) {"""
new = """  attachToSelection() {
    const app = this.app;
    // B() verbatim (@5648276): mid-drag guard → multi-object → RIG →
    // transformPoseObjectId??selectedId → detach. No empty-ids early return (the
    // bundle falls through to detach via the ct lookup).
    if ((this.dragging && this._multiGroup) || this._rigDragMulti) return;   // if (b || w) return
    const ids = app.objects.selectedIds;
    // Ve gate (@5648294): edit + idle + not performing — the rig + pose branches are gated
    const ve = app.page.mode !== 'play' && app.page.editInteraction === 'idle' && !app.page.playing;
    if (ve && ids.length > 1) {"""
assert old in s, "attach head anchor"
s = s.replace(old, new, 1)

# now insert the RIG branch after the multi-object branch (before the `ct` lookup)
old = """    // ---- B() `ct`: the transform/cam-transform segment's object outranks the selection ----
    const poseId = app.transformPoseObjectId ?? ids[0];"""
new = """    // ---- B() rig branch (@5648310, AFTER multi-object): the gizmo drives the joints
    // of the selected rig-transform segment — independent of OBJECT selection ----
    const rigId = ve ? app.rigPoseObjectId : null;
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
    // ---- B() `ct` (@5803870): the transform/cam-transform segment's object outranks the selection ----
    const poseId = (ve ? app.transformPoseObjectId : null) ?? ids[0];"""
assert old in s, "ct anchor"
s = s.replace(old, new, 1)

# the single-mesh tail: if no mesh at all → detach (bundle fall-through)
old = """    const mesh = poseId ? app.meshById.get(poseId) : undefined;
    this._attached = mesh ?? null;
    if (mesh) {"""
new = """    const mesh = poseId ? app.meshById.get(poseId) : undefined;
    if (!mesh) { this.transform.detach(); this._attached = null; return; }
    this._attached = mesh;
    {"""
assert old in s, "mesh tail anchor"
s = s.replace(old, new, 1)

# ---- P3-3: share the constructor raycaster + use pointer-UP coords ----
old = """      if (app.rigJointPickables.length > 0) {
        if (!this._raycaster) this._raycaster = new THREE.Raycaster();
        const r = app.renderer.domElement.getBoundingClientRect();
        this._raycaster.setFromCamera(new THREE.Vector2(
          ((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1), app.camera);
        const jh = this._raycaster.intersectObjects(app.rigJointPickables, false)[0];"""
new = """      if (app.rigJointPickables.length > 0) {
        const r = app.renderer.domElement.getBoundingClientRect();      // bundle uses the UP event coords (@5661054)
        this.raycaster.setFromCamera(new THREE.Vector2(
          ((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), app.camera);
        const jh = this.raycaster.intersectObjects(app.rigJointPickables, false)[0];"""
assert old in s, "raycaster anchor"
s = s.replace(old, new, 1)

# ---- P3-5: the joint handle joins the scene only (not planningAids) ----
old = """    this._jointHandle = new THREE.Group();
    app.scene.add(this._jointHandle);
    app.planningAids.push(this._jointHandle);"""
new = """    this._jointHandle = new THREE.Group();
    app.scene.add(this._jointHandle);            // bundle: scene.add(x) only (@5641308)"""
assert old in s, "jointHandle aids anchor"
s = s.replace(old, new, 1)

open(P, "w").write(s)
print("manipulate.js review fixes:", len(s) - len(orig), "bytes delta")

# ================================================================ main.js
P = "/home/z/my-project/flick-3dEditor/editor/js/main.js"
s = open(P).read()
orig = s

# P1-2: watcher also reseats on transformPoseObjectId flips
old = """    this._rigHandlesTick();
    const _rpid = this.rigPoseObjectId;
    if (this._lastRigPoseId !== _rpid) {
      this._lastRigPoseId = _rpid;
      this.manipulator?.attachToSelection();
    }"""
new = """    this._rigHandlesTick();
    const _rpid = this.rigPoseObjectId;
    const _tpid = this.transformPoseObjectId;      // transform/cam-transform segment flips reseat too (B() dep @5649052)
    if (this._lastRigPoseId !== _rpid || this._lastTransformPoseId !== _tpid) {
      this._lastRigPoseId = _rpid;
      this._lastTransformPoseId = _tpid;
      this.manipulator?.attachToSelection();
    }"""
assert old in s, "watcher anchor"
s = s.replace(old, new, 1)

# P3-2: trim unused imports
old = "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation, jointSnapshot, jointOffset, applyHandleDelta, toggleJointSelection, filterAncestorJoints, isMajorJoint, IDENTITY_JOINT } from './figures.js';"
new = "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation, isMajorJoint } from './figures.js';"
assert old in s, "import trim anchor"
s = s.replace(old, new, 1)

# P3-1: dead vector in _rigHandlesTick
old = """    this.rigJointGroup.visible = true;
    if (this._rigSpheresFor !== id) this._rigSpheresBuild(id);
    const w = new THREE.Vector3();
    for (const [name, m] of this._rigSpheres) {"""
new = """    this.rigJointGroup.visible = true;
    if (this._rigSpheresFor !== id) this._rigSpheresBuild(id);
    for (const [name, m] of this._rigSpheres) {"""
assert old in s, "dead vector anchor"
s = s.replace(old, new, 1)

# P3-6: fix the transformPoseObjectId offset comment
s = s.replace("get transformPoseObjectId() {", "get transformPoseObjectId() {   // computed @5803870", 1)

# init the new watcher field
old = "    this._lastRigPoseId = undefined;  // frame watcher: reseat the gizmo when rigPoseObjectId flips"
new = "    this._lastRigPoseId = undefined;  // frame watcher: reseat the gizmo when rigPoseObjectId flips\n    this._lastTransformPoseId = undefined;"
assert old in s, "watcher field anchor"
s = s.replace(old, new, 1)

open(P, "w").write(s)
print("main.js review fixes:", len(s) - len(orig), "bytes delta")

# ================================================================ store.js (P3-6 comment fix)
P = "/home/z/my-project/flick-3dEditor/editor/js/store.js"
s = open(P).read()
orig = s
old = "  // addSampledRigKeyframe (verbatim @5536618): sample the rig-transform eval at"
new = "  // addSampledRigKeyframe (verbatim @5536122): sample the rig-transform eval at"
assert old in s
s = s.replace(old, new, 1)
open(P, "w").write(s)
print("store.js comment fixed")

# ================================================================ ui.js (P1-3: ◆ Key samples)
P = "/home/z/my-project/flick-3dEditor/editor/js/ui.js"
s = open(P).read()
orig = s
old = """        if (it.kind === 'rig-transform') key.joints = {};"""
new = """        if (it.kind === 'rig-transform') { addSampled(seg, t); return; }   // bundle @5583961: full sampled pose, not an empty key"""
assert old in s, "ui key anchor"
s = s.replace(old, new, 1)
# define addSampled next to the key button handler — find the enclosing function start
# (insert a helper just before the block that uses it)
old = """        else app.show.addRigKeyframe(seg.trackId, seg.itemId, key);"""
new = """        else app.show.addRigKeyframe(seg.trackId, seg.itemId, key);
      };
      const addSampled = (seg, t) => app.show.addSampledRigKeyframe(seg.trackId, seg.itemId, Math.max(0, t));"""
assert old in s, "addRigKeyframe anchor"
s = s.replace(old, new, 1)
open(P, "w").write(s)
print("ui.js ◆ Key fix")
