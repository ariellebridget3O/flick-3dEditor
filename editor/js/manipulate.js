// manipulate.js — picking + click selection (ua port) + TransformControls (ozr port)
// + drag commit pipeline (SZt port) + keyboard (Hzr port).
import * as THREE from 'three';
import { TransformControls } from './vendor/controls/TransformControls.js';
import { applyCustomGizmo } from './gizmo.js';
import { deleteObjects } from './ui.js';
import { C, smoothstep } from './const.js';
import { isPersonKind, camMovePose, unwrapEulerVs, subjectlessItem, CAM_ITEM_KINDS } from './tracks.js';
import { itemDuration } from './schema.js';
import { syncToolHighlight } from './ui.js';

// kv: lookAt rotation (yaw+pitch) from position → target (rotateY π — camera faces −Z)
const _lkM = new THREE.Matrix4(), _lkQ = new THREE.Quaternion(), _lkE = new THREE.Euler();
export function lookAtEuler(pos, target) {
  _lkM.lookAt(new THREE.Vector3(...pos), new THREE.Vector3(...target), new THREE.Vector3(0, 1, 0));
  _lkQ.setFromRotationMatrix(_lkM);
  _lkE.setFromQuaternion(_lkQ);
  return [_lkE.x, _lkE.y, _lkE.z];
}
// oBe: forward vector of an euler
export function forwardOfEuler(euler) {
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(...euler));
  const v = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
  return [v.x, v.y, v.z];
}

export class Manipulator {
  constructor(app) {
    this.app = app;
    this.dragging = false;
    this.scrubbing = false;
    this.transform = null;
    this.raycaster = new THREE.Raycaster();
    this.enabled = true;
    this._downPos = null;
    this._downTime = 0;
    this._lastClick = 0;
    this._lastClickPos = [0, 0];
    this._prevSelection = null;
    this.hoverPickBudget = { last: 0, took: 0 };
    this._installTransformControls();
    this._installPointer();
    this._installKeyboard();
  }

  isMeshDragged(mesh) { return this.dragging && this._dragMesh === mesh; }

  // ================= TransformControls (ozr + Mzr restyle) =================
  _installTransformControls() {
    const app = this.app;
    this.transform = new TransformControls(app.camera, app.renderer.domElement);
    const helper = this.transform.getHelper();       // r169+ API [A:F10]
    app.scene.add(helper);
    app.planningAids.push(helper);
    this.transform.addEventListener('dragging-changed', e => {
      this.dragging = e.value;
      app.orbit.enabled = !e.value;
      this._dragMesh = e.value ? this._attached : null;
      if (e.value) {
        this._dragStartObj = this._attached ? { ...app.objects.get(this._attached.userData.objectId) } : null;
        app.show.beginEditGesture();
      } else this._commit();
    });
    this.transform.addEventListener('objectChange', () => this._onObjectChange());
    // mode mapping F(): translate default; camera scale → translate; track-driven → translate
    this.transform.setMode('translate');
    // custom gizmo meshes (Mzr exact): one-sided shafts+cones, plane discs, ring set, centre
    // sphere/box w/ dark shell, negative-axis pickers dropped, hover amber (bzr)
    applyCustomGizmo(this.transform);
  }

  attachToSelection() {
    const app = this.app;
    const ids = app.objects.selectedIds;
    if (ids.length === 0) { this.transform.detach(); this._attached = null; return; }
    if (ids.length > 1) {
      // multi: temporary group at centroid (B())
      const meshes = ids.map(id => app.meshById.get(id)).filter(Boolean);
      if (meshes.length < 2) { this.transform.detach(); return; }
      const g = new THREE.Group();
      const c = new THREE.Vector3();
      for (const m of meshes) c.add(m.getWorldPosition(new THREE.Vector3()));
      c.divideScalar(meshes.length);
      g.position.copy(c);
      app.scene.add(g);
      this._dragParents = new Map();   // remember ORIGINAL parents for commit restore
      for (const m of meshes) { this._dragParents.set(m, m.parent); g.attach(m); }
      this._multiGroup = g;
      this._attached = g;
      this.transform.attach(g);
      return;
    }
    const mesh = app.meshById.get(ids[0]);
    this._attached = mesh ?? null;
    if (mesh) {
      // mode rules F(): track-driven → forced translate; camera scale → translate
      const obj = app.objects.get(ids[0]);
      const driven = this._isTrackDriven(ids[0]);
      if (driven && this.transform.mode !== 'translate') this.transform.setMode('translate');
      if (obj?.kind === 'camera' && this.transform.mode === 'scale') this.transform.setMode('translate');
      this.transform.attach(mesh);
    } else this.transform.detach();
  }

  _isTrackDriven(id) {
    const app = this.app;
    const items = app.show.trackOf(id)?.items ?? [];
    const t = app.page.playheadS;
    for (const it of items) {
      if (t < it.startS) break;
      if (['path', 'play', 'cam-path', 'cam-move', 'cam-manual', 'cam-follow'].includes(it.kind)
        && t < it.startS + itemDuration(it)) return true;
    }
    return false;
  }

  _onObjectChange() {
    // live update: write gizmo TRS through to store on commit only (objects store updated in _commit)
  }

  _commit() { // SZt/kZt split — cameras+targets take the pipeline, everything else commits freely
    const app = this.app;
    if (!this._attached) { app.show.endEditGesture(); return; }
    const closeGesture = () => app.show.endEditGesture();   // close AFTER the writes (undo capture)
    const attached = this._attached;
    // ---- multi-select group: restore children to ORIGINAL parents, bake full TRS (GA-unwrapped)
    if (this._multiGroup) {
      const entries = [...this._multiGroup.children].map(m => ({ m, parent: this._dragParents?.get(m) ?? app.scene }));
      for (const { m, parent } of entries) {
        const id = m.userData.objectId;
        parent.attach(m);
        if (id && app.objects.get(id)) {
          const base = app.objects.get(id);
          app.objects.update(id, {
            position: [m.position.x, m.position.y, m.position.z],
            rotation: unwrapEulerVs([m.rotation.x, m.rotation.y, m.rotation.z], base.rotation ?? [0, 0, 0]),
            scale: [m.scale.x, m.scale.y, m.scale.z],
          });
        }
      }
      app.scene.remove(this._multiGroup);
      this._multiGroup = null;
      this._dragParents = null;
      this.attachToSelection();
      return;
    }
    const id = attached.userData.objectId;
    if (!id || !app.objects.get(id)) return;
    const obj = app.objects.get(id);
    const world = {
      position: attached.getWorldPosition(new THREE.Vector3()),
      rotation: (() => { const q = attached.getWorldQuaternion(new THREE.Quaternion()); const e = new THREE.Euler().setFromQuaternion(q); return [e.x, e.y, e.z]; })(),
    };
    const local = {
      position: [attached.position.x, attached.position.y, attached.position.z],
      rotation: [attached.rotation.x, attached.rotation.y, attached.rotation.z],
      scale: [attached.scale.x, attached.scale.y, attached.scale.z],
    };
    const mode = this.transform.mode;
    const isCamOrTarget = obj.kind === 'camera' || obj.kind === 'target';
    const outcome = isCamOrTarget ? this._commitSZt(id, obj, attached, world, local, mode)
      : this._commitKZt(id, obj, local);
    closeGesture();
    if (outcome?.outcome === 'refused') {
      app.toast?.(this._refusalText(outcome.reason));
      // revert to the pre-drag state
      const src = this._dragStartObj;
      if (src) app.objects.update(id, { position: src.position, rotation: src.rotation, scale: src.scale });
      attached.position.set(...(src?.position ?? [0, 0, 0]));
      attached.rotation.set(...(src?.rotation ?? [0, 0, 0]));
      attached.scale.set(...(src?.scale ?? [1, 1, 1]));
    } else if (outcome?.outcome === 'unbased') {
      app.toast?.('Camera move could not be re-based (' + outcome.reason + ')');
    }
    return outcome;
  }

  // kZt: focused transform segment + playhead inside → write a KEY; else full TRS. NO refusal.
  _commitKZt(id, obj, local) {
    const app = this.app;
    if (this._captureFocusedTransformPose(id, local)) return { outcome: 'keyed' };
    app.objects.update(id, {
      position: local.position,
      rotation: unwrapEulerVs(local.rotation, obj.rotation ?? [0, 0, 0]),
      scale: local.scale,
    });
    return { outcome: 'committed' };
  }

  // captureFocusedTransformPose: selected segment is a transform item covering the playhead
  _captureFocusedTransformPose(id, local) {
    const app = this.app;
    const seg = app.page.selectedSegment;
    if (!seg) return false;
    const track = app.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (!track || item?.kind !== 'transform') return false;
    if (track.characterId !== id) return false;
    const tS = app.page.playheadS - item.startS;
    if (tS < 0 || tS > itemDuration(item)) return false;
    app.show.addTransformKeyframe(seg.trackId, seg.itemId, {
      tS, position: local.position, rotation: local.rotation, scale: local.scale,
    });
    return true;
  }

  // SZt — the full camera/target commit pipeline (refusal → keyed → follow-offset → rebase → gates)
  _commitSZt(id, obj, attached, world, local, mode) {
    const app = this.app;
    const t = app.page.playheadS;
    const track = app.show.trackOf(id);
    const items = track ? track.items : [];
    const reason = this._refusalReason(items, t, mode);
    if (reason) return { outcome: 'refused', reason };
    // 1. keyed camera: focused cam-transform segment covering the playhead
    if (this._captureFocusedCameraPose(id, obj, world)) return { outcome: 'keyed' };
    // 2. keyed target: focused transform segment
    if (obj.kind === 'target' && this._captureFocusedTransformPose(id, local)) return { outcome: 'keyed' };
    // 3. active cam-follow: re-derive the follow offset from the dragged world pose (V8r)
    const follow = this._activeFollowItem(id, t);
    if (follow) {
      const followedMesh = app.meshById.get(follow.item.objectId);
      if (followedMesh) {
        followedMesh.updateWorldMatrix(true, false);
        const sp = followedMesh.getWorldPosition(new THREE.Vector3());
        const sq = followedMesh.getWorldQuaternion(new THREE.Quaternion());
        const inv = sq.clone().invert();
        const e = new THREE.Euler(...world.rotation);
        const wq = new THREE.Quaternion().setFromEuler(e);
        const dp = world.position.clone().sub(sp).applyQuaternion(inv);
        const dq = inv.clone().multiply(wq);
        app.show.setCameraItemFields(follow.trackId, follow.item.id, {
          offset: { position: [dp.x, dp.y, dp.z], quaternion: [dq.x, dq.y, dq.z, dq.w] },
        });
      }
    }
    // 4. cam-move chain rebase (_Zt/GOr)
    const targetObj = obj.targetId ? app.objects.get(obj.targetId) : null;
    const rebase = targetObj ? this._rebaseCamMove(id, world, t) : { outcome: 'refused', reason: 'no-move' };
    if (rebase.outcome === 'refused' && rebase.reason !== 'no-move') return { outcome: 'unbased', reason: rebase.reason };
    let pose = { position: world.position.toArray(), rotation: world.rotation };
    if (rebase.outcome === 'rebased') {
      pose.position = rebase.position;
      if (rebase.rotation && typeof rebase.rotation === 'object') {
        // kv: lookAt rotation from position → aimAt
        pose.rotation = lookAtEuler(pose.position, rebase.rotation.aimAt);
      }
    }
    const framesMarker = this._framesMarkerNow(id, t);
    const rotationAllowed = rebase.outcome !== 'rebased' || rebase.rotation === 'free'
      ? !framesMarker
      : rebase.rotation !== 'keep';                                    // VOr
    const positionAllowed = !this._driveChainActive(items, t);          // !UOr
    const patch = {};
    if (positionAllowed) patch.position = pose.position;
    if (rotationAllowed) patch.rotation = unwrapEulerVs(pose.rotation, obj.rotation ?? [0, 0, 0]); // GA vs windFrom
    app.objects.update(id, patch);
    // 5. no-move refused translate → reaim (aim the cam-move item at its subject again)
    if (rebase.outcome === 'refused' && rebase.reason === 'no-move' && mode === 'translate') this._reaimCamera(id);
    // 6. paired target: rotated together during drag (XWt) — commit its new position
    if (targetObj && this._dragStartObj) {
      const tgtMesh = app.meshById.get(obj.targetId);
      if (tgtMesh) {
        const tid = tgtMesh.userData.objectId;
        const tp = [tgtMesh.position.x, tgtMesh.position.y, tgtMesh.position.z];
        const parent = tgtMesh.parent && tgtMesh.parent !== app.scene ? tgtMesh.parent : null;
        if (parent) { const v = new THREE.Vector3(...tp); parent.worldToLocal(v); app.objects.update(tid, { position: [v.x, v.y, v.z] }); }
        else app.objects.update(tid, { position: tp });
      }
    }
    return { outcome: 'committed' };
  }

  _refusalText(reason) { // TZt
    return reason === 'manual' ? 'This camera is filming a manual shot'
      : reason === 'path-position' ? 'This camera is on a camera path'
      : reason === 'path-look' ? 'This camera is looking down a camera path'
      : 'This camera is anchored to a subject';
  }

  // wZt/_je: the drive chain = last started camera item at t; refusal only for cam-manual/cam-path
  _driveChainItem(items, t) {
    let n = null;
    for (const it of items) {
      if (t < it.startS) break;
      if (CAM_ITEM_KINDS.has(it.kind)) n = it;
      if (t < it.startS + itemDuration(it)) break;
    }
    if (!n || t > n.startS + itemDuration(n)) return null;
    if (n.kind === 'cam-manual' && (n.samples?.length ?? 0) > 0) return n;
    if (n.kind === 'cam-path' && (n.anchors?.length ?? 0) >= 2) return n;
    return null;
  }
  _driveChainActive(items, t) { return this._driveChainItem(items, t) !== null; }  // UOr via wZt
  _refusalReason(items, t, mode) { // _je
    const r = this._driveChainItem(items, t);
    if (!r) return null;
    if (r.kind === 'cam-manual') return 'manual';
    if (mode !== 'rotate') return 'path-position';
    if ((r.aim ?? 'travel') !== 'locked') return 'path-look';
    const onlyStillBefore = items.every(a => !CAM_ITEM_KINDS.has(a.kind) || a.startS >= r.startS || a.kind === 'cam-still');
    return onlyStillBefore ? null : 'path-anchored';
  }

  // captureFocusedCameraPose: focused cam-transform segment covering the playhead → key
  _captureFocusedCameraPose(id, obj, world) {
    const app = this.app;
    const seg = app.page.selectedSegment;
    if (!seg) return false;
    const track = app.show.show.tracks.find(t => t.id === seg.trackId);
    const item = track?.items.find(x => x.id === seg.itemId);
    if (!track || item?.kind !== 'cam-transform' || track.characterId !== id) return false;
    const tS = app.page.playheadS - item.startS;
    if (tS < 0 || tS > itemDuration(item)) return false;
    app.show.addCameraKeyframe(seg.trackId, seg.itemId, {
      tS, position: [...world.position.toArray()], rotation: [...world.rotation],
      focalLengthMm: obj.focalLengthMm ?? C.FOCAL_DEFAULT,
    });
    return true;
  }

  // bFr: active cam-follow item for camera id at time t
  _activeFollowItem(id, t) {
    const app = this.app;
    const track = app.show.trackOf(id);
    if (!track) return null;
    let n = null;
    for (const it of track.items) {
      if (t < it.startS) break;
      if (CAM_ITEM_KINDS.has(it.kind)) n = it;
      if (t < it.startS + itemDuration(it)) break;
    }
    return n?.kind === 'cam-follow' && t <= n.startS + itemDuration(n) ? { trackId: track.id, item: n } : null;
  }

  // xq ≈ framesMarkerNow: camera has a target and is driven by an active camera item (or chain)
  _framesMarkerNow(id, t) {
    const app = this.app;
    const obj = app.objects.get(id);
    if (!obj?.targetId) return false;
    const items = app.show.trackOf(id)?.items ?? [];
    const n = this._driveChainItem(items, t);
    if (n) return subjectlessItem(n);   // YN: needs the camera's target
    return !!(obj.targetId && items.some(subjectlessItem));
  }

  // GOr/_Zt — invert the active cam-move chain from the dragged world position
  _rebaseCamMove(id, world, t) {
    const app = this.app;
    const items = app.show.trackOf(id)?.items ?? [];
    const e = items.find(it => it.kind === 'cam-move' && t >= it.startS && t <= it.startS + itemDuration(it)) ?? null;
    if (!e) return { outcome: 'refused', reason: 'no-move' };
    const earlier = items.filter(it => CAM_ITEM_KINDS.has(it.kind) && it.startS < e.startS);
    if (!earlier.every(it => it.kind === 'cam-move' || it.kind === 'cam-still')) return { outcome: 'refused', reason: 'anchored' };
    const r = t - e.startS;
    const aimOf = item => this._itemAimPoint(id, item);   // XN/WY subject target
    // zat: forward-eval the move from the dragged position at progress u
    let s = camMovePose({
      kind: e.move, t: e.durationS > 0 ? r / e.durationS : 0,
      start: world.position.toArray(), target: aimOf(e),
      direction: e.direction, angleDeg: e.angleDeg, heightDeltaUnits: e.heightDeltaUnits, distanceScale: e.distanceScale,
    }).position;
    for (let i = earlier.length - 1; i >= 0 && s; i--) {
      const u = earlier[i];
      if (u.kind === 'cam-move') s = camMovePose({
        kind: u.move, t: 1, start: s, target: aimOf(u),
        direction: u.direction, angleDeg: u.angleDeg, heightDeltaUnits: u.heightDeltaUnits, distanceScale: u.distanceScale,
      }).position;
    }
    if (!s) return { outcome: 'refused', reason: 'not-invertible' };
    const looksDownAim = earlier.every(it => it.kind !== 'cam-move' || (it.move !== 'pan_sweep' && it.subjectId === e.subjectId));
    const noMoves = earlier.every(it => it.kind !== 'cam-move');
    if (e.move === 'pan_sweep') {
      if (!noMoves) return { outcome: 'rebased', position: s, rotation: 'keep', looksDownAim };
      // b2r: sweep direction from the dragged world rotation
      const dir = forwardOfEuler(world.rotation);
      const sweep = e.direction ?? 'ccw';
      const ang = (e.angleDeg ?? 90) * Math.PI / 180 * (sweep === 'ccw' ? 1 : -1) * smoothstep(e.durationS > 0 ? r / e.durationS : 0);
      const c = Math.cos(ang), sn = Math.sin(ang);
      const d = [dir[0] * c - dir[2] * sn, dir[1], dir[0] * sn + dir[2] * c];
      return { outcome: 'rebased', position: s, rotation: { from: 'turn', aimAt: [s[0] + d[0], s[1] + d[1], s[2] + d[2]] }, looksDownAim };
    }
    if (!noMoves && (!aimOf(e) || earlier.some(it => it.kind === 'cam-move' && it.move === 'pan_sweep')))
      return { outcome: 'rebased', position: s, rotation: 'keep', looksDownAim };
    const chainItem = [...earlier, e].find(it => it.kind === 'cam-move' && it.move !== 'pan_sweep' && this._itemAimPoint(id, it) !== null);
    const c = chainItem ? (chainItem === e ? aimOf(e) : aimOf(chainItem)) : null;
    return { outcome: 'rebased', position: s, rotation: c ? { from: 'framing', aimAt: c } : 'free', looksDownAim };
  }

  // XN: cam item subject aim point (subject world pos + aimOffsetUnits)
  _itemAimPoint(id, item) {
    const app = this.app;
    const subjectId = 'subjectId' in item ? item.subjectId : null;
    if (!subjectId) return null;
    const p = app._subjectPos(subjectId, app.page.playheadS);
    if (!p) return null;
    const off = item.aimOffsetUnits ?? 0;
    return [p[0], p[1] + off, p[2]];
  }

  // reaimCamera: re-aim the camera's cam-move item at its subject
  _reaimCamera(id) {
    const app = this.app;
    const track = app.show.trackOf(id);
    const item = track?.items.find(it => it.kind === 'cam-move');
    if (!track || !item) return;
    const subjectId = item.subjectId ?? app.objects.get(id)?.targetId ?? null;
    if (!subjectId) return;
    const p = app._subjectPos(subjectId, app.page.playheadS);
    if (!p) return;
    // place the camera base so the move starts aimed at the subject
    const off = item.aimOffsetUnits ?? 0;
    const aim = [p[0], p[1] + off, p[2]];
    app.show.setCameraItemFields(track.id, item.id, {});
    // nudge: set the camera's stored rotation to look at the subject
    const obj = app.objects.get(id);
    if (obj) app.objects.update(id, { rotation: lookAtEuler(obj.position ?? [0, 0, 0], aim) });
  }

  _unwrapRotation(euler, prev) { // GA: rotation continuity on release
    if (!prev) return [euler.x, euler.y, euler.z];
    const wrap = (a, b) => b + 2 * Math.PI * Math.round((a - b) / (2 * Math.PI));
    return [wrap(prev[0], euler.x), wrap(prev[1], euler.y), wrap(prev[2], euler.z)];
  }

  tick() {
    // re-attach when selection changes (driven by store subscription in ui.js)
  }

  // ================= pointer picking (ua port) =================
  _pick(x, y) {
    const app = this.app;
    const r = app.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, app.camera);
    // path-edit pickables first
    const pathHits = this.raycaster.intersectObjects(app.pathEditPickables, false);
    if (pathHits.length) return { type: 'pathEdit', hit: pathHits[0] };
    const meshes = [...app.meshById.values()].filter(m => m.visible && m.userData.objectId);
    const hits = this.raycaster.intersectObjects(meshes, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.objectId && o.parent) o = o.parent;
      if (o?.userData.objectId) return { type: 'object', id: o.userData.objectId, hit: hits[0] };
    }
    const floorHits = this.raycaster.intersectObject(app.env.floor, false);
    if (floorHits.length) return { type: 'floor', point: floorHits[0].point };
    return null;
  }

  _objectIdAt(hit) {
    let o = hit.object;
    while (o && !o.userData.objectId && o.parent) o = o.parent;
    return o?.userData?.objectId ?? null;
  }

  _groupPromotion(objects, id, selectedId) { // JEe + _De (round 6: camera/target/spotlight never promote)
    const obj = objects[id];
    if (!obj?.parentId) return id;
    const parent = objects[obj.parentId];
    if (parent?.kind !== 'group') return id;
    if (obj.kind === 'camera' || obj.kind === 'target' || obj.kind === 'spotlight') return id;  // _De
    if (selectedId && (selectedId === obj.parentId || objects[selectedId]?.parentId === obj.parentId)) return id;
    return obj.parentId;
  }

  _installPointer() {
    const app = this.app;
    const el = app.renderer.domElement;
    el.addEventListener('contextmenu', e => e.preventDefault());

    // ---- lasso (br/Nr/ua/jt port): drag rect → select projected positions ----
    this._lasso = null;   // {x, y} pointer start while editInteraction==='lasso'
    const LASSO_THRESHOLD = 8;   // Sye
    const lassoCursor = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><ellipse cx="13" cy="9" rx="8" ry="5.5"/><path d="M13 14.5 C12 19 9 21 6 24"/></g><g fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round"><ellipse cx="13" cy="9" rx="8" ry="5.5"/><path d="M13 14.5 C12 19 9 21 6 24"/></g></svg>')}") 6 24, crosshair`;
    const lassoRectFrom = (p0, cx, cy) => {   // dt(): normalized rect, canvas-relative
      const r = el.getBoundingClientRect();
      const x0 = p0.x - r.left, y0 = p0.y - r.top;
      const x1 = cx - r.left, y1 = cy - r.top;
      app.page.setLassoRect({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) });
    };
    // jt(): select every mesh whose projected world position lands inside the rect
    const _wp = new THREE.Vector3();
    const lassoSelect = (p0, p1) => {
      const r = el.getBoundingClientRect();
      const x0 = Math.min(p0.x, p1.x) - r.left, x1 = Math.max(p0.x, p1.x) - r.left;
      const y0 = Math.min(p0.y, p1.y) - r.top, y1 = Math.max(p0.y, p1.y) - r.top;
      const objs = app.objects.all();
      const aimed = new Set(
        Object.values(objs).filter(o => o.kind === 'camera' && o.targetId)
          .map(o => o.targetId).filter(id => objs[id]?.kind === 'target'));   // Xu: target kind gate (stale targetIds ignored)
      const ids = [];
      for (const [id, mesh] of app.objectManager.meshById) {
        if (!objs[id]?.kind || aimed.has(id)) continue;
        mesh.getWorldPosition(_wp).project(app.camera);
        if (_wp.z > 1) continue;
        const sx = (_wp.x * 0.5 + 0.5) * r.width;
        const sy = (-_wp.y * 0.5 + 0.5) * r.height;
        if (sx >= x0 && sx <= x1 && sy >= y0 && sy <= y1) ids.push(id);
      }
      app.objects.select(ids);
    };
    // editInteraction watcher: lasso on → disable orbit + set cursor (live disposers subscription)
    app.page.subscribe(() => {
      if (app.page.editInteraction === 'lasso') {
        if (this._orbitWasEnabled === undefined) this._orbitWasEnabled = app.orbit.enabled;
        app.orbit.enabled = false;
        app.container.style.cursor = lassoCursor;
      } else if (this._orbitWasEnabled !== undefined) {
        app.orbit.enabled = this._orbitWasEnabled;
        app.container.style.cursor = '';
        this._orbitWasEnabled = undefined;
        this._lasso = null;
        app.page.lassoRect = null;
      }
    });

    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (app.page.editInteraction === 'lasso') {
        this._lasso = { x: e.clientX, y: e.clientY };
        lassoRectFrom(this._lasso, e.clientX, e.clientY);
        this._downPos = null;
        try { el.setPointerCapture(e.pointerId); } catch (_) {}
        return;
      }
      this._downPos = [e.clientX, e.clientY];
      this._downTime = performance.now();
      this._downMoved = false;
    });
    el.addEventListener('pointermove', e => {
      if (this._lasso) { lassoRectFrom(this._lasso, e.clientX, e.clientY); return; }
      if (app.page.editInteraction === 'lasso') return;   // no hover picking while lasso cursor is up
      if (this._downPos && Math.hypot(e.clientX - this._downPos[0], e.clientY - this._downPos[1]) > C.CLICK_SLOP_PX)
        this._downMoved = true;
      // hover picking (throttled, CGr budget)
      const now = performance.now();
      if (now - this.hoverPickBudget.last > 33 || this.hoverPickBudget.took < 2) {
        const t0 = performance.now();
        const pick = this._pick(e.clientX, e.clientY);
        this.hoverPickBudget = { last: now, took: performance.now() - t0 };
        if (pick?.type === 'object') {
          app.hoverPoint = pick.hit.point.clone();
          app.hoverNormal = pick.hit.face ? pick.hit.face.normal.clone().transformDirection(pick.hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
          app.hoverId = pick.id;
        } else if (pick?.type === 'floor') {
          app.hoverPoint = pick.point.clone();
          app.hoverNormal = new THREE.Vector3(0, 1, 0);
          app.hoverId = null;
        } else { app.hoverPoint = null; app.hoverNormal = null; app.hoverId = null; }
        app.container.style.cursor = pick?.type === 'object' ? 'none' : '';
      }
    });
    el.addEventListener('pointerup', e => {
      if (e.button !== 0) return;
      if (this._lasso) {
        const start = this._lasso;
        this._lasso = null;
        app.page.lassoRect = null;
        if (el.hasPointerCapture?.(e.pointerId)) { try { el.releasePointerCapture(e.pointerId); } catch (_) {} }
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > LASSO_THRESHOLD) {
          lassoSelect(start, { x: e.clientX, y: e.clientY });
          app.page.setEditInteraction('idle');   // one-shot: back to idle after a completed drag
        } else {
          app.page.changed();
        }
        return;
      }
      if (!this._downPos) return;
      const moved = this._downMoved;
      const [x, y] = this._downPos;
      this._downPos = null;
      if (moved) return;
      // path-edit interactions handled by PathEditor via app.page.paint
      const pick = this._pick(x, y);
      const now = performance.now();
      const isDbl = now - this._lastClick < C.DBLCLICK_MS
        && Math.hypot(x - this._lastClickPos[0], y - this._lastClickPos[1]) < C.DBLCLICK_PX;
      this._lastClick = now; this._lastClickPos = [x, y];

      if (app.page.paint) { app.pathEditor.onFloorClick(pick, e); return; }

      if (isDbl) {
        if (pick?.type === 'object') { const id = altRaw(pick.id, e); app.focusObject(id); }
        else if (pick?.type === 'floor') {
          if (this._prevSelection) app.objects.select(this._prevSelection);
          app._animateFocus(pick.point, Math.min(3 * app.camera.position.distanceTo(app.orbit.target), 20), false);
        }
        return;
      }
      this._prevSelection = [...app.objects.selectedIds];
      if (pick?.type === 'object') {
        let id = pick.id;
        if (!e.altKey) id = this._groupPromotion(app.objects.all(), id, app.objects.selectedId);
        if (e.metaKey || e.ctrlKey) app.objects.toggleSelect(e.altKey ? pick.id : id);
        else app.objects.select([id]);
      } else if (pick?.type === 'floor') {
        app.objects.select([]);
      }
    });
    const altRaw = (id, e) => e.altKey ? id : id;
  }

  // ================= keyboard (Hzr port) =================
  _installKeyboard() {
    const app = this.app;
    app._keys = new Set();
    window.addEventListener('keydown', e => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const k = e.key.toLowerCase();
      app._keys.add(k);
      if (app.page.keyboardOwner !== 'stage') return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? app.show.redo() : app.show.undo(); }
      else if (mod && k === 'y') { e.preventDefault(); app.show.redo(); }
      else if (mod && k === 'c') { app.objects.copy(); }
      else if (mod && k === 'v') { app.show.beginEditGesture(); try { app.objects.paste(app.show); } finally { app.show.endEditGesture(); } }
      else if (mod && k === 'g') {
        e.preventDefault();
        app.show.beginEditGesture();
        let res;
        try { res = app.objects.groupOrUngroup(); } finally { app.show.endEditGesture(); }
        if (res && !res.ok && res.toast) app.toast(res.toast);
        if (res && res.ok && res.partial) app.toast('Grouped ' + res.grouped + ' object' + (res.grouped > 1 ? 's' : '') + ' (' + res.skipped + ' already in a group — skipped)');
      }
      else if (k === 'delete' || k === 'backspace') {
        if (app.page.paint) {
          // live keymap: path editing → deletePathAnchor(selectedAnchor)
          const p = app.page.paint;
          if (p.selectedAnchor !== null && p.selectedAnchor !== undefined) {
            app.show.deletePathAnchor(p.trackId, p.itemId, p.selectedAnchor);
            app.pathEditor.selectAnchor(null);
          }
        } else {
          app.show.beginEditGesture();
          try { deleteObjects(app, app.objects.selectedIds); }
          finally { app.show.endEditGesture(); }
        }
      }
      else if (k === 'escape') {
        if (app.page.paint) app.pathEditor.finishPaint();
        if (app.page.editInteraction === 'lasso') app.page.setEditInteraction('idle');
      }
      else if (k === 'enter') { if (app.page.paint) app.pathEditor.finishPaint(); }
      else if (k === 'f') { if (app.objects.selectedId) app.focusObject(app.objects.selectedId); }
      else if (k === 'x' || k === 'z' || k === 'c') {
        if (mod) return;
        // tool modes (live: X rotate Z move C scale — but ours: z/x/c per DOM tooltips "Move (Z) Rotate (X) Scale (C)")
        if (k === 'z' && !mod) { this.transform.setMode('translate'); }
        if (k === 'x' && !mod) { this.transform.setMode('rotate'); }
        if (k === 'c' && !mod) { this.transform.setMode('scale'); }
        syncToolHighlight(app);   // toolbar reflects keyboard mode changes too
      }
    });
    window.addEventListener('keyup', e => app._keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => app._keys.clear());
  }
}
