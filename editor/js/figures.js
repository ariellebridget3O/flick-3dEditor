// figures.js — simple_figure (exact Zqt port) + humanoid GLB pipeline.
// See analysis/HUMANOID.md + bundle Zqt/Kqt/aqt/$Nr/HNr for the de-minified originals.
import * as THREE from 'three';
import { C } from './const.js';

const FIG_DEFAULT_FILL = 0xf29a5c;  // Phe
const MARK_WHITE = 0xffffff;       // Pst
const MARK_DARK = 0x1c0f09;        // BIr
const MARK_LUMA_T = 0.72;          // HIr

// contrast mark color (aqt): hex string; luma > .72 → dark, else white
export function figureMarkColor(hexString) {
  const e = parseInt(String(hexString).replace('#', '').slice(0, 6), 16);
  if (Number.isNaN(e)) return MARK_WHITE;
  const r = e >> 16 & 255, g = e >> 8 & 255, b = e & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > MARK_LUMA_T ? MARK_DARK : MARK_WHITE;
}
export function setFigureColor(group, colorHex) { // Kqt
  const f = group.userData.figure;
  if (!f) return;
  const hex = colorHex ?? FIG_DEFAULT_FILL;
  f.fill.color.set(hex);
  f.mark.color.setHex(figureMarkColor(`#${f.fill.color.getHexString()}`));
}

// ---------- simple_figure (Zqt) — EXACT ----------
export function buildSimpleFigure() {
  const [W, H, D] = C.FIG_BODY;                  // PP
  const tat = 0.002;
  const fill = new THREE.MeshStandardMaterial({ roughness: 1 });  // Io({roughness:X_=1})
  const mark = new THREE.MeshStandardMaterial({ roughness: 1 });
  const g = new THREE.Group();                   // Ci

  // body: Box(W,H,D) translated up H/2 (feet at y=0)
  const body = new THREE.BoxGeometry(W, H, D);
  body.translate(0, H / 2, 0);
  g.add(new THREE.Mesh(body, fill));

  // band: Plane(W, c−l) rotated Y+π at y=(l+c)/2, z=−(D/2+tat) — ON THE BODY, mark material
  const [l, c] = C.FIG_BAND;                     // LIr = [.8·sA, .88·sA]
  const band = new THREE.PlaneGeometry(W, c - l);
  band.rotateY(Math.PI);
  band.translate(0, (l + c) / 2, -D / 2 - tat);
  g.add(new THREE.Mesh(band, mark));

  // head group at OIr; sphere (fill) + visor zone (mark)
  const head = new THREE.Group();
  head.position.y = C.FIG_HEAD_Y;                // OIr
  head.add(new THREE.Mesh(new THREE.SphereGeometry(C.FIG_HEAD_R, 32, 16), fill));
  // visor: SphereGeometry(Nie+tat, 32, 4, 3π/2−Pie, 2·Pie, π/2−f, f−h)
  const arc = C.FIG_VISOR_ARC;                   // Pie = 72°
  const [h0, f0] = [-6 * Math.PI / 180, 14 * Math.PI / 180]; // DIr = [−6°, 14°]
  const visor = new THREE.SphereGeometry(C.FIG_HEAD_R + tat, 32, 4,
    1.5 * Math.PI - arc, 2 * arc, Math.PI / 2 - f0, f0 - h0);
  head.add(new THREE.Mesh(visor, mark));

  g.add(head);
  g.userData.figure = { fill, mark, head };
  setFigureColor(g, undefined);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
export function getHeadRotation(group) { // nat
  const r = group.userData.figure?.head.rotation;
  return r ? [r.x, r.y, r.z] : [0, 0, 0];
}
export function applyHeadRotation(group, headRotation) { // o$
  const f = group.userData.figure;
  const [x, y, z] = headRotation ?? [0, 0, 0];
  if (f) f.head.rotation.set(x, y, z);
}

// ---------- name labels (canvas sprite) ----------
export function makeLabelSprite(name) {
  const canvas = document.createElement('canvas');
  const font = 'bold 32px sans-serif';
  let ctx = canvas.getContext('2d');
  ctx.font = font;
  const text = String(name ?? '');
  const w = Math.max(64, Math.ceil(ctx.measureText(text).width) + 24);
  canvas.width = w; canvas.height = 64;
  ctx = canvas.getContext('2d');
  ctx.font = font;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 64, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  sprite.scale.set(w / 64 * 0.22, 0.22, 1);
  sprite.renderOrder = 100;
  return sprite;
}

// ---------- humanoid pipeline ($Nr/Hhe) ----------
// placeholder while GLB loads (u5r — exact)
export function buildHumanoidPlaceholder() {
  // u5r — exact: capsule body/head + 4 limb capsules, orange (Phe), roughness 1
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: FIG_DEFAULT_FILL, roughness: 1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.5, 4, 12), mat);
  body.position.y = 1.15;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), mat);
  head.position.y = 1.62;
  const limb = (r, len) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 8), mat);
  const armL = limb(0.055, 0.55); armL.position.set(-0.27, 1.15, 0);
  const armR = limb(0.055, 0.55); armR.position.set(0.27, 1.15, 0);
  const legL = limb(0.07, 0.65); legL.position.set(-0.1, 0.42, 0);
  const legR = limb(0.07, 0.65); legR.position.set(0.1, 0.42, 0);
  g.add(body, head, armL, armR, legL, legR);
  return g;
}

// prepare loaded humanoid (Hhe): NO extra yaw on main stage (GLB Rig bakes 180°, facing = −Z),
// scale so height = 1.75 m, XZ-centre, feet at min.y, roughness 1, M_Main → orange.
export function prepareHumanoid(gltfScene) {
  const root = gltfScene;
  const box = new THREE.Box3().setFromObject(root);
  const h = box.max.y - box.min.y;
  if (h > 0) root.scale.multiplyScalar(C.FIG_HEIGHT / h);   // ≈ 0.956964 — computed, not hardcoded
  const box2 = new THREE.Box3().setFromObject(root);
  const c = box2.getCenter(new THREE.Vector3());
  root.position.set(-c.x, -box2.min.y, -c.z);
  root.traverse(o => {
    if (o.isMesh) {
      if (o.material) {
        const m = o.material.clone();
        m.roughness = 1;
        if (m.name === 'M_Main') m.color.setHex(FIG_DEFAULT_FILL);
        o.material = m;
      }
      o.castShadow = true; o.receiveShadow = true;
    }
  });
  return root;
}

// humanoid rig — EXACT port of the live AWr rig manager per-rig state:
//   l() ctor: eager action per clip, bones map, EMPTY dynamic clipLocal
//   b() applyClip: clip switching (prev fadeOut Sot, next reset().fadeIn(prev?Sot:0).play()),
//      then paused/time semantics: playback-with-time → paused + wrapped time;
//      playback-no-time → unpaused (mixer advances freely, wall-clock);
//      rest → paused = !animation.playing, time=0 when not playing.
//   tick: m() restore offset-bearing bones to last pre-offset pose → mixer.update →
//      g() re-snapshot those bones and apply offsets ADDITIVELY (aKt) on the current pose.
// clipLocal is NOT a bind snapshot (that design caused the T-pose flicker: three's
// PropertyMixer change-detection skips writes when the sampled pose is static, so a
// bind-restore leaves the bone at bind = T-pose for those frames).
const _aKtE = new THREE.Euler(), _aKtQ = new THREE.Quaternion();
// aKt (verbatim): apply a joint offset ADDITIVELY to any Object3D-like pose holder
export function applyJointOffset(target, j) {
  target.position.x += j.position?.[0] ?? 0; target.position.y += j.position?.[1] ?? 0; target.position.z += j.position?.[2] ?? 0;
  target.quaternion.multiply(_aKtQ.setFromEuler(_aKtE.set(j.rotation?.[0] ?? 0, j.rotation?.[1] ?? 0, j.rotation?.[2] ?? 0)));
  target.scale.x *= j.scale?.[0] ?? 1; target.scale.y *= j.scale?.[1] ?? 1; target.scale.z *= j.scale?.[2] ?? 1;
  return target;
}
export class HumanoidRig {
  constructor(root, clips) {
    this.root = root;
    this.mixer = new THREE.AnimationMixer(root);
    this.actions = new Map();          // l(): eager — one action per clip
    for (const c of clips) this.actions.set(c.name, this.mixer.clipAction(c));
    this.currentClip = null;
    this.bones = new Map();
    root.traverse(o => { if (o.isBone) this.bones.set(o.name, o); });
    this.clipLocal = new Map();        // name → {position,quaternion,scale} — dynamic, per-frame
  }
  dispose() {                          // c(): stopAllAction + uncacheRoot
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
  // b(): playback = {clip, timeS|null} | null; animation = object record .animation | null
  applyClip(playback, animation) {
    const name = playback?.clip ?? animation?.clip;
    if (name === undefined) return;
    if (this.currentClip !== name) {
      const next = this.actions.get(name);
      if (!next) return;               // live: `continue` — unknown clip is a no-op
      const prev = this.currentClip ? this.actions.get(this.currentClip) : undefined;
      if (prev) prev.fadeOut(C.CROSSFADE_S);                       // Sot = .25
      next.reset().fadeIn(prev ? C.CROSSFADE_S : 0).play();
      this.currentClip = name;
    }
    const action = this.actions.get(name);
    if (!action) return;
    if (playback && playback.timeS !== null) {
      const dur = action.getClip().duration;
      action.paused = true;
      action.time = dur > 0 ? ((playback.timeS % dur) + dur) % dur : 0;
    } else if (playback) action.paused = false;
    else {
      action.paused = !animation?.playing;
      if (!animation?.playing) action.time = 0;
    }
  }
  // SWr(): hard-finish fades — every action stopFading, enabled = (name === current)
  finishFades() {
    for (const [n, a] of this.actions) { a.stopFading(); a.enabled = n === this.currentClip; }
  }
  tick(dt, rigOffsets) {
    // m(): restore offset-bearing bones to their last pre-offset (mixer) pose
    for (const [name, cl] of this.clipLocal) {
      const b = this.bones.get(name);
      if (b) { b.position.copy(cl.position); b.quaternion.copy(cl.quaternion); b.scale.copy(cl.scale); }
    }
    this.mixer.update(dt);
    // g(): clear, re-snapshot CURRENT locals for offset joints, then apply aKt additively
    this.clipLocal.clear();
    if (rigOffsets) {
      for (const [name, j] of Object.entries(rigOffsets)) {
        const b = this.bones.get(name);
        if (!b) continue;
        this.clipLocal.set(name, { position: b.position.clone(), quaternion: b.quaternion.clone(), scale: b.scale.clone() });
        applyJointOffset(b, j);
      }
    }
  }
}

// head-look rig offsets (jZt): DEF-neck 40% / DEF-head 60%; rotation built as
// euler(pitch·f, yaw·f, 0, 'YXZ') converted to XYZ (EZt), pitch NEGATED.
const _jzE = new THREE.Euler(), _jzQ = new THREE.Quaternion();
export function ezHeadRotation(yaw, pitch) { // EZt
  _jzQ.setFromEuler(_jzE.set(pitch, yaw, 0, 'YXZ'));
  _jzE.setFromQuaternion(_jzQ);
  return [_jzE.x, _jzE.y, _jzE.z];
}
export function headLookOffsets(split) {
  const k = C.NECK_HEAD_SPLIT;   // Wat = .4
  const f = f2 => ({ position: [0, 0, 0], rotation: ezHeadRotation(split.headYawRad * f2, -(split.headPitchRad ?? 0) * f2), scale: [1, 1, 1] });
  return { 'DEF-neck': f(k), 'DEF-head': f(1 - k) };
}

// IZt: merge rig-offset maps by SUMMING rotations (not spread-overwrite)
export function mergeRigOffsets(base, add) {
  const out = { ...base };
  for (const [name, j] of Object.entries(add ?? {})) {
    const a = out[name];
    out[name] = a
      ? { ...a, rotation: [a.rotation[0] + j.rotation[0], a.rotation[1] + j.rotation[1], a.rotation[2] + j.rotation[2]] }
      : j;
  }
  return out;
}


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

// ================= held-pose sampling family (r15 verbatim port) =================
// Cye (verbatim @5667050): sample one track `${bone}.${prop}` from a clip — null if absent
export function clipTrackSample(clip, boneName, prop, t) {
  const tr = clip.tracks.find(x => x.name === `${boneName}.${prop}`);
  return tr ? tr.createInterpolant().evaluate(t) : null;
}

// Aot (verbatim @5667128): pose of one bone from a clip at time t — per-channel fallback
// to the bone's CURRENT locals (Uie @5635998 = jointSnapshot) for missing tracks
export function sampleBonePose(clip, boneName, bone, t) {
  const bind = jointSnapshot(bone);
  const p = clipTrackSample(clip, boneName, 'position', t),
        q = clipTrackSample(clip, boneName, 'quaternion', t),
        s = clipTrackSample(clip, boneName, 'scale', t);
  return {
    position: p ? new THREE.Vector3(p[0], p[1], p[2]) : bind.position,
    quaternion: q ? new THREE.Quaternion(q[0], q[1], q[2], q[3]) : bind.quaternion,
    scale: s ? new THREE.Vector3(s[0], s[1], s[2]) : bind.scale,
  };
}

// fWr (verbatim @5665638): joints diff — offset of each pose-channel transform vs the
// idle reference (oQ scratch Object3D @5665635), via mBe
const _fwrObj = new THREE.Object3D();
export function diffRigPose(idle, pose) {
  const out = {};
  for (const [name, p] of Object.entries(pose)) {
    const ref = idle[name];
    if (!ref) continue;
    _fwrObj.position.copy(p.position);
    _fwrObj.quaternion.copy(p.quaternion);
    _fwrObj.scale.copy(p.scale);
    out[name] = jointOffset(_fwrObj, ref);
  }
  return out;
}
