#!/usr/bin/env python3
"""r14 rig posing UX — verbatim port of xqr (joint spheres) + Dzr/Fzr/mBe family +
captureFocusedRigPose + the manipulator rig-drag branches (pWr rig flow).

Bundle ground truth (index-DBE17t4T.js):
  xqr  @5731200..5732620  — joint-sphere overlay (bqr .028, yqr 4500223, vqr 16763972)
  Fzr/Rzr/cot/Hzt/$zt/Uie/mBe/aKt/Dzr @5635700..5637000, @3925214
  store: addSampledRigKeyframe + captureFocusedRigPose @5536400..5537400
  facade: rigPoseObjectId/transformPoseObjectId computed @5803300..5804700
  env: f()/m()/g() merge (live drag SPREAD-REPLACES per joint) @5668474
  manipulator: drag branches @5642900..5644200, objectChange handlers @5647353,
               B() attach order @5648200 (multi-object → rig → transformPose/selected)
  pointerup joint-pick (ua) @5661100..5662400
"""
import re

# ============================================================ figures.js
P = "/home/z/my-project/flick-3dEditor/editor/js/figures.js"
s = open(P).read()
orig = s

# extract aKt as an exported helper (the tick body keeps using it)
old = """const _aKtE = new THREE.Euler(), _aKtQ = new THREE.Quaternion();"""
new = """const _aKtE = new THREE.Euler(), _aKtQ = new THREE.Quaternion();
// aKt (verbatim): apply a joint offset ADDITIVELY to any Object3D-like pose holder
export function applyJointOffset(target, j) {
  target.position.x += j.position?.[0] ?? 0; target.position.y += j.position?.[1] ?? 0; target.position.z += j.position?.[2] ?? 0;
  target.quaternion.multiply(_aKtQ.setFromEuler(_aKtE.set(j.rotation?.[0] ?? 0, j.rotation?.[1] ?? 0, j.rotation?.[2] ?? 0)));
  target.scale.x *= j.scale?.[0] ?? 1; target.scale.y *= j.scale?.[1] ?? 1; target.scale.z *= j.scale?.[2] ?? 1;
  return target;
}"""
assert old in s, "figures aKt anchor"
s = s.replace(old, new, 1)

old = """        this.clipLocal.set(name, { position: b.position.clone(), quaternion: b.quaternion.clone(), scale: b.scale.clone() });
        b.position.x += j.position?.[0] ?? 0; b.position.y += j.position?.[1] ?? 0; b.position.z += j.position?.[2] ?? 0;
        b.quaternion.multiply(_aKtQ.setFromEuler(_aKtE.set(j.rotation?.[0] ?? 0, j.rotation?.[1] ?? 0, j.rotation?.[2] ?? 0)));
        b.scale.x *= j.scale?.[0] ?? 1; b.scale.y *= j.scale?.[1] ?? 1; b.scale.z *= j.scale?.[2] ?? 1;"""
new = """        this.clipLocal.set(name, { position: b.position.clone(), quaternion: b.quaternion.clone(), scale: b.scale.clone() });
        applyJointOffset(b, j);"""
assert old in s, "figures tick aKt inline anchor"
s = s.replace(old, new, 1)

s += """

// ================= rig posing family (r14 verbatim port) =================
// QCe — identity joint offset
export const IDENTITY_JOINT = { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };

// Uie — snapshot an Object3D pose
export function jointSnapshot(o) {
  return { position: o.position.clone(), quaternion: o.quaternion.clone(), scale: o.scale.clone() };
}

// Hzt — shallow-clone a plain joint record
export function cloneJoint(j) {
  return { position: [...j.position], rotation: [...j.rotation], scale: [...j.scale] };
}

// $zt — deep-clone a joints map
export function cloneJoints(map) {
  const out = {};
  for (const [n, j] of Object.entries(map ?? {})) out[n] = cloneJoint(j);
  return out;
}

// mBe (verbatim @5636760): offset of pose vs reference — position diff, inv(refQ)*poseQ
// as XYZ euler, scale ratio (0-reference guards to 1)
const _mbeQ1 = new THREE.Quaternion(), _mbeQ2 = new THREE.Quaternion(), _mbeE = new THREE.Euler();
export function jointOffset(pose, ref) {
  _mbeQ1.copy(ref.quaternion).invert();
  _mbeQ2.copy(_mbeQ1).multiply(pose.quaternion);
  _mbeE.setFromQuaternion(_mbeQ2);
  return {
    position: [pose.position.x - ref.position.x, pose.position.y - ref.position.y, pose.position.z - ref.position.z],
    rotation: [_mbeE.x, _mbeE.y, _mbeE.z],
    scale: [ref.scale.x === 0 ? 1 : pose.scale.x / ref.scale.x,
            ref.scale.y === 0 ? 1 : pose.scale.y / ref.scale.y,
            ref.scale.z === 0 ? 1 : pose.scale.z / ref.scale.z],
  };
}

// Dzr (verbatim @5636846): joint offset after a handle delta — builds the drag-start
// pose (clipLocal + startOffset), conjugates the handle delta into bone-parent space
// (pot = inv(parentQ) * deltaQ * parentQ), applies, returns the offset vs clipLocal.
// NOTE: `bone` is used ONLY for its parent (the pose math is all vs clipLocal).
const _dzrObj = new THREE.Object3D(), _dzrPQ = new THREE.Quaternion(),
      _dzrInv = new THREE.Quaternion(), _dzrPot = new THREE.Quaternion(), _dzrV = new THREE.Vector3();
export function applyHandleDelta(bone, clipLocal, startOffset, delta) {
  _dzrObj.position.copy(clipLocal.position);
  _dzrObj.quaternion.copy(clipLocal.quaternion);
  _dzrObj.scale.copy(clipLocal.scale);
  applyJointOffset(_dzrObj, startOffset);
  if (bone.parent) bone.parent.getWorldQuaternion(_dzrPQ); else _dzrPQ.identity();
  _dzrInv.copy(_dzrPQ).invert();
  _dzrPot.copy(_dzrInv).multiply(delta.quaternion).multiply(_dzrPQ);
  _dzrObj.quaternion.premultiply(_dzrPot);
  _dzrObj.position.add(_dzrV.copy(delta.position).applyQuaternion(_dzrInv));
  _dzrObj.scale.multiply(delta.scale);
  return jointOffset(_dzrObj, clipLocal);
}

// Fzr (verbatim @5635932): joint selection toggle — additive keeps a set (toggles out
// if present), plain click is exclusive
export function toggleJointSelection(list, joint, additive) {
  return additive
    ? (list.includes(joint) ? list.filter(j => j !== joint) : [...list, joint])
    : [joint];
}

// Rzr (verbatim @5635915): drop selected joints whose ANCESTOR chain (via parentOf)
// contains another selected joint (no parent+child dragged together)
export function filterAncestorJoints(list, parentOf) {
  const set = new Set(list);
  return list.filter(j => {
    for (let p = parentOf(j); p !== null; p = parentOf(p)) if (set.has(p)) return false;
    return true;
  });
}

// cot (verbatim @5635890): major joint — everything but root and finger/thumb DEF bones
export function isMajorJoint(name) {
  return name === 'root' ? false : !/^DEF-(f_|thumb)/.test(name);
}
"""
open(P, "w").write(s)
print("figures.js patched", len(s) - len(orig), "bytes added")

# ============================================================ store.js
P = "/home/z/my-project/flick-3dEditor/editor/js/store.js"
s = open(P).read()
orig = s

old = "import { CAM_ITEM_KINDS, subjectlessItem, isPersonKind } from './tracks.js';"
new = """import { CAM_ITEM_KINDS, subjectlessItem, isPersonKind, rigJointsAtTime } from './tracks.js';
import { cloneJoints } from './figures.js';"""
assert old in s, "store import anchor"
s = s.replace(old, new, 1)

old = """  addRigKeyframe(trackId, itemId, key) {         // rig keys merge joints at the same tS
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['rig-transform'], { mergeJoints: true }));
  }"""
new = """  addRigKeyframe(trackId, itemId, key) {         // rig keys merge joints at the same tS
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['rig-transform'], { mergeJoints: true }));
  }
  // addSampledRigKeyframe (verbatim @5536618): sample the rig-transform eval at
  // item.startS + tS (the LATEST rig item at that time — T2r semantics) and merge the
  // captured `extra` joints over it, so a partial capture keeps the other joints' state.
  addSampledRigKeyframe(trackId, itemId, tS, extra = {}) {
    const track = this.show.tracks.find(t => t.id === trackId);
    const item = track?.items.find(x => x.id === itemId);
    if (item?.kind !== 'rig-transform') return;
    const l = rigJointsAtTime(track.items, item.startS + tS);
    this.addRigKeyframe(trackId, itemId, { tS, joints: { ...(l ? cloneJoints(l) : {}), ...extra } });
  }"""
assert old in s, "store addRigKeyframe anchor"
s = s.replace(old, new, 1)
open(P, "w").write(s)
print("store.js patched", len(s) - len(orig), "bytes added")
