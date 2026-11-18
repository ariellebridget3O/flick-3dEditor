#!/usr/bin/env python3
"""r14 rig posing patch 2 — main.js: App facade + xqr overlay + frame wiring."""
P = "/home/z/my-project/flick-3dEditor/editor/js/main.js"
s = open(P).read()
orig = s

# --- imports ---
old = "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation } from './figures.js';"
new = "import { headLookOffsets, mergeRigOffsets, applyHeadRotation, getHeadRotation, ezHeadRotation, jointSnapshot, jointOffset, applyHandleDelta, toggleJointSelection, filterAncestorJoints, isMajorJoint, IDENTITY_JOINT } from './figures.js';"
assert old in s, "main figures import anchor"
s = s.replace(old, new, 1)

# --- App fields + accessors: find the rigJointPickables init line ---
old = "    this.rigJointPickables = [];"
new = """    this.rigJointPickables = [];      // xqr pickables (r14 rig posing)
    this.liveRigDrag = null;          // h — {objectId, offsets} while a joint drag is live (setLiveRigDrag)
    this._rigSelectedJoints = [];     // xqr closure `l` — selected joint names
    this._rigSpheres = new Map();     // xqr `c` — joint name → sphere mesh
    this._rigSpheresFor = null;       // xqr `d` — object id the spheres were built for
    this._lastRigPoseId = undefined;  // frame watcher: reseat the gizmo when rigPoseObjectId flips"""
assert old in s, "rigJointPickables anchor"
s = s.replace(old, new, 1)

# --- facade getters + accessors + capture: insert before the camera mesh poser section ---
old = "  // ================= camera mesh poser (live mqr Q @5720949) ================="
new = """  // ================= rig posing facade (r14 verbatim) =================
  // rigPoseObjectId (computed @5804170): the character of the SELECTED rig-transform
  // segment, null while playing — drives the joint spheres + the gizmo rig branches.
  get rigPoseObjectId() {
    if (this.page.playing) return null;
    const seg = this.page.selectedSegment;
    if (!seg) return null;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    return track?.items.find(x => x.id === seg.itemId)?.kind === 'rig-transform'
      ? track.characterId ?? null : null;
  }
  // transformPoseObjectId (computed @5804140): same for transform/cam-transform — the
  // gizmo prefers this object over the plain selection (B() `ct`).
  get transformPoseObjectId() {
    if (this.page.playing) return null;
    const seg = this.page.selectedSegment;
    if (!seg) return null;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    return track?.items.find(x => x.id === seg.itemId)?.kind === 'transform' || track?.items.find(x => x.id === seg.itemId)?.kind === 'cam-transform'
      ? track.characterId ?? null : null;
  }
  // env accessors (verbatim shapes @5673270): boneOf / majorJointsOf / clipLocalOf
  boneOf(id, name) { return this.objectManager.humanoidRigs.get(id)?.bones.get(name) ?? null; }
  majorJointsOf(id) {
    const r = this.objectManager.humanoidRigs.get(id);
    return r ? [...r.bones.entries()].filter(([n]) => isMajorJoint(n)).map(([, b]) => b) : [];
  }
  clipLocalOf(id, name) { return this.objectManager.humanoidRigs.get(id)?.clipLocal.get(name) ?? null; }
  setLiveRigDrag(state) { this.liveRigDrag = state; }
  // captureFocusedRigPose (verbatim @5536618): bake the dragged offsets as a rig key at
  // the playhead inside the SELECTED rig-transform segment.
  captureFocusedRigPose(offsets) {
    const seg = this.page.selectedSegment;
    if (!seg) return;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (!item || item.kind !== 'rig-transform') return;
    const tS = this.page.playheadS - item.startS;
    if (tS < 0 || tS > itemDuration(item)) return;
    this.show.addSampledRigKeyframe(seg.trackId, seg.itemId, tS, offsets);
  }

  // ---- xqr joint-sphere overlay (verbatim @5731200) ----
  _setupRigHandles() {
    const RIG_JOINT_R = 0.028;                       // bqr
    this.rigJointGroup = new THREE.Group();          // r: renderOrder 1
    this.rigJointGroup.renderOrder = 1;
    this.scene.add(this.rigJointGroup);
    this.planningAids.push(this.rigJointGroup);
    this._rigSphereGeo = new THREE.SphereGeometry(RIG_JOINT_R, 12, 8);
    this._rigMatIdle = new THREE.MeshBasicMaterial({ color: 0x44AAFF, depthTest: false });   // yqr 4500223
    this._rigMatSel = new THREE.MeshBasicMaterial({ color: 0xFFCC44, depthTest: false });    // vqr 16763972
  }
  rigHandlesSelectedJoints() { return this._rigSelectedJoints; }
  rigHandlesSetSelectedJoints(list) { this._rigSelectedJoints = list; }
  _rigSpheresClear() {                               // u()
    for (const m of this._rigSpheres.values()) this.rigJointGroup.remove(m);
    this._rigSpheres.clear();
    this.rigJointPickables.length = 0;
    this._rigSpheresFor = null;
  }
  _rigSpheresBuild(id) {                             // h(m)
    this._rigSpheresClear();
    for (const bone of this.majorJointsOf(id)) {
      const m = new THREE.Mesh(this._rigSphereGeo, this._rigMatIdle);
      m.userData.rigJoint = bone.name;
      m.userData.rigObjectId = id;
      this.rigJointGroup.add(m);
      this._rigSpheres.set(bone.name, m);
      this.rigJointPickables.push(m);
    }
    this._rigSpheresFor = this._rigSpheres.size > 0 ? id : null;
  }
  _rigWindowActive() {                               // f(): selected segment is rig-transform AND playhead inside its window
    const seg = this.page.selectedSegment;
    if (!seg) return false;
    const track = this.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (item?.kind !== 'rig-transform') return false;
    const t = this.page.playheadS - item.startS;
    return t >= 0 && t <= itemDuration(item);
  }
  _rigHandlesTick() {                                // xqr.tick()
    const id = this.rigPoseObjectId;
    if (!id || !this._rigWindowActive()) {
      this.rigJointGroup.visible = false;
      if (this._rigSpheresFor !== null || this._rigSpheres.size > 0) this._rigSpheresClear();
      this._rigSelectedJoints = [];
      return;
    }
    this.rigJointGroup.visible = true;
    if (this._rigSpheresFor !== id) this._rigSpheresBuild(id);
    const w = new THREE.Vector3();
    for (const [name, m] of this._rigSpheres) {
      const bone = this.boneOf(id, name);
      if (bone) {
        bone.getWorldPosition(m.position);
        m.material = this._rigSelectedJoints.includes(name) ? this._rigMatSel : this._rigMatIdle;
      }
    }
  }

  // ================= camera mesh poser (live mqr Q @5720949) ================="""
assert old in s, "camera poser anchor"
s = s.replace(old, new, 1)

# --- frame step 1: merge live drag (spread-replace AFTER the ghost IZt merge) ---
old = """    for (const [id, rig] of this.objectManager.humanoidRigs) {
      let off = this.rigOffsets.get(id);
      if (_ghostLook && id === _ghost.id) off = mergeRigOffsets(off ?? {}, _ghostLook);
      rig.tick(dt, off);
    }"""
new = """    for (const [id, rig] of this.objectManager.humanoidRigs) {
      let off = this.rigOffsets.get(id);
      if (_ghostLook && id === _ghost.id) off = mergeRigOffsets(off ?? {}, _ghostLook);
      // f() verbatim: the live drag SPREAD-REPLACES the per-joint entries of the rig-item
      // offsets (NOT rotation-summed like the ghost head-look IZt merge above)
      if (this.liveRigDrag && this.liveRigDrag.objectId === id) off = { ...off, ...this.liveRigDrag.offsets };
      rig.tick(dt, off);
    }"""
assert old in s, "frame step1 anchor"
s = s.replace(old, new, 1)

# --- frame tail: sphere tick + gizmo reseat watcher (after navBall, before plan gate) ---
old = """    // 12. nav ball roll (lZr.tick) — after selection so camera state is final
    this.navBall?.tick(dt);"""
new = """    // 12. nav ball roll (lZr.tick) — after selection so camera state is final
    this.navBall?.tick(dt);

    // 12a. r14 rig posing: joint spheres track the posed bones; the gizmo reseats when
    // rigPoseObjectId flips (segment change / play state / window crossing) — the live
    // subscribes B() to the same signals incl. performanceTimeS
    this._rigHandlesTick();
    const _rpid = this.rigPoseObjectId;
    if (this._lastRigPoseId !== _rpid) {
      this._lastRigPoseId = _rpid;
      this.manipulator?.attachToSelection();
    }"""
assert old in s, "frame tail anchor"
s = s.replace(old, new, 1)

open(P, "w").write(s)
print("main.js patched", len(s) - len(orig), "bytes added")
