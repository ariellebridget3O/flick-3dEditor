// manipulate.js — picking + click selection (ua port) + TransformControls (ozr port)
// + drag commit pipeline (SZt port) + keyboard (Hzr port).
import * as THREE from 'three';
import { TransformControls } from './vendor/controls/TransformControls.js';
import { C } from './const.js';
import { isPersonKind } from './tracks.js';
import { itemDuration } from './schema.js';

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
    // restyle: axis colours (h$) — traverse helper children and tint by name
    helper.traverse(o => {
      if (o.material?.color && /X/i.test(o.name)) o.material.color.setHex(0xe5534b);
      else if (o.material?.color && /Y/i.test(o.name)) o.material.color.setHex(0x55b35e);
      else if (o.material?.color && /Z/i.test(o.name)) o.material.color.setHex(0x4a86e8);
    });
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
      for (const m of meshes) g.attach(m);
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

  _commit() { // SZt port (minimum viable set [A:F6])
    const app = this.app;
    app.show.endEditGesture();
    if (!this._attached) return;
    const attached = this._attached;
    const finish = () => {
      if (this._multiGroup) {
        // restore children to parents, bake world TRS
        const meshes = [...this._multiGroup.children];
        for (const m of meshes) {
          const id = m.userData.objectId;
          app.scene.attach(m);
          if (id) app.objects.update(id, {
            position: [m.position.x, m.position.y, m.position.z],
            rotation: [m.rotation.x, m.rotation.y, m.rotation.z],
          });
        }
        app.scene.remove(this._multiGroup);
        this._multiGroup = null;
        this.attachToSelection();
        return;
      }
      const id = attached.userData.objectId;
      if (!id || !app.objects.get(id)) return;
      const obj = app.objects.get(id);
      // drive refusal (SZt): track-driven at playhead → refuse with toast
      if (this._isTrackDriven(id)) {
        app.toast?.('This object is driven by a track item at the playhead');
        // revert
        const src = this._dragStartObj;
        if (src) app.objects.update(id, { position: src.position, rotation: src.rotation, scale: src.scale });
        attached.position.set(...(src?.position ?? [0, 0, 0]));
        attached.rotation.set(...(src?.rotation ?? [0, 0, 0]));
        attached.scale.set(...(src?.scale ?? [1, 1, 1]));
        return;
      }
      app.objects.update(id, {
        position: [attached.position.x, attached.position.y, attached.position.z],
        rotation: this._unwrapRotation(attached.rotation, obj.rotation),
        scale: [attached.scale.x, attached.scale.y, attached.scale.z],
      });
      // camera+target pairing: move target with camera
      if (obj.kind === 'camera' && obj.targetId) {
        const tgt = app.meshById.get(obj.targetId);
        if (tgt && this._dragStartObj) {
          const dx = attached.position.x - (this._dragStartObj.position?.[0] ?? 0);
          const dy = attached.position.y - (this._dragStartObj.position?.[1] ?? 0);
          const dz = attached.position.z - (this._dragStartObj.position?.[2] ?? 0);
          const tid = tgt.userData.objectId;
          const tobj = app.objects.get(tid);
          if (tobj) app.objects.update(tid, {
            position: [tobj.position[0] + dx, tobj.position[1] + dy, tobj.position[2] + dz],
          });
        }
      }
    };
    finish();
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

  _groupPromotion(objects, id, selectedId) { // JEe
    const obj = objects[id];
    if (!obj?.parentId) return id;
    const parent = objects[obj.parentId];
    if (parent?.kind !== 'group') return id;
    if (selectedId && (selectedId === obj.parentId || objects[selectedId]?.parentId === obj.parentId)) return id;
    return obj.parentId;
  }

  _installPointer() {
    const app = this.app;
    const el = app.renderer.domElement;
    el.addEventListener('contextmenu', e => e.preventDefault());

    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      this._downPos = [e.clientX, e.clientY];
      this._downTime = performance.now();
      this._downMoved = false;
    });
    el.addEventListener('pointermove', e => {
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
      if (e.button !== 0 || !this._downPos) return;
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
      else if (mod && k === 'v') { app.objects.paste(app.show); }
      else if (mod && k === 'g') { e.preventDefault(); app.objects.groupOrUngroup(); }
      else if (k === 'delete' || k === 'backspace') {
        for (const id of app.objects.selectedIds) {
          app.show.detachReferences(id);
          app.objects.remove(id);
        }
      }
      else if (k === 'escape') { if (app.page.paint) app.pathEditor.finishPaint(); }
      else if (k === 'enter') { if (app.page.paint) app.pathEditor.finishPaint(); }
      else if (k === 'f') { if (app.objects.selectedId) app.focusObject(app.objects.selectedId); }
      else if (k === 'x' || k === 'z' || k === 'c') {
        if (mod) return;
        // tool modes (live: X rotate Z move C scale — but ours: z/x/c per DOM tooltips "Move (Z) Rotate (X) Scale (C)")
        if (k === 'z' && !mod) { this.transform.setMode('translate'); }
        if (k === 'x' && !mod) { this.transform.setMode('rotate'); }
        if (k === 'c' && !mod) { this.transform.setMode('scale'); }
      }
    });
    window.addEventListener('keyup', e => app._keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => app._keys.clear());
  }
}
