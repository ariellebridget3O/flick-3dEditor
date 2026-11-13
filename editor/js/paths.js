// paths.js — path editing UX (UGr/§3 port): paint mode, anchors, tangent + height handles,
// curve display, walkable-surface clicks, flown-vs-walked anchor Y (anchorPosFor).
import * as THREE from 'three';
import { C } from './const.js';
import { curveDisplayPoints, polylineOf, nearestSegmentXZ, buildTangents } from './curves.js';
import { isPersonKind } from './tracks.js';

export class PathEditor {
  constructor(app) {
    this.app = app;
    this.group = new THREE.Group();
    this.group.visible = false;
    app.scene.add(this.group);
    app.planningAids.push(this.group);
    this.selectedAnchor = null;
    this._drag = null;
    this._installDrag();
  }

  get paint() { return this.app.page.paint; }

  // ---- store helpers ----
  _item() {
    const p = this.paint;
    if (!p) return null;
    const tr = this.app.show.show.tracks.find(t => t.id === p.trackId);
    return tr?.items.find(i => i.id === p.itemId) ?? null;
  }
  _isFlown() { // cameras / non-persons keep anchor Y (anchorPosFor)
    const p = this.paint;
    if (!p) return false;
    const tr = this.app.show.show.tracks.find(t => t.id === p.trackId);
    const obj = tr ? this.app.objects.get(tr.characterId) : null;
    return !obj || !isPersonKind(obj.kind);
  }
  _ownerMesh() {
    const p = this.paint;
    const tr = this.app.show.show.tracks.find(t => t.id === p.trackId);
    return tr ? this.app.meshById.get(tr.characterId) : null;
  }
  _anchorPosFor(pos, idx) {
    const item = this._item();
    const base = this._ownerMesh();
    if (!this._isFlown()) return [pos.x, pos.y, pos.z];
    const existing = item?.anchors?.[idx]?.pos;
    const y = existing ? existing[1] : (base ? base.position.y : 1.6);
    return [pos.x, y, pos.z];
  }

  // ---- enter/exit paint ----
  enterPaint(trackId, itemId) {
    this.app.page.paint = { trackId, itemId, selectedAnchor: null };
    this.app.page.keyboardOwner = 'stage';
    this.selectedAnchor = null;
    this.rebuild();
    this.app.page.changed();
  }
  finishPaint() {
    const item = this._item();
    const p = this.paint;
    if (item && item.anchors.length < 2 && p) this.app.show.removeItem(p.trackId, p.itemId);
    this.app.page.paint = null;
    this.group.visible = false;
    this._clearPickables();
    this.app.page.changed();
  }
  _clearPickables() { this.app.pathEditPickables.length = 0; }

  seedFirstAnchor() { // seedPathStart: anchor at object's world position
    const mesh = this._ownerMesh();
    const p = this.paint;
    if (!mesh || !p) return;
    const wp = mesh.getWorldPosition(new THREE.Vector3());
    const item = this._item();
    if (item && item.anchors.length === 0)
      this.app.show.appendPathAnchor(p.trackId, p.itemId, [wp.x, wp.y, wp.z]);
  }

  // ---- floor clicks while painting (§3.3) ----
  onFloorClick(pick, e) {
    if (!pick || (pick.type !== 'floor' && pick.type !== 'object')) return;
    const point = pick.type === 'floor' ? pick.point : pick.hit.point;
    const p = this.paint;
    const item = this._item();
    if (!p || !item) return;
    // hit on an anchor/handle sphere? → select it (click-without-move)
    if (pick.type === 'pathEdit') return;
    const pos = this._anchorPosFor(point, item.anchors.length - 1);
    const [idx, dist] = nearestSegmentXZ(item.anchors, pos);
    if (item.anchors.length >= 2 && dist < C.PATH_INSERT_THRESHOLD)
      this.app.show.insertPathAnchor(p.trackId, p.itemId, idx, pos);
    else
      this.app.show.appendPathAnchor(p.trackId, p.itemId, pos);
  }

  onShowChanged() { if (this.paint) this.rebuild(); }

  // ---- visuals (UGr.y port) ----
  rebuild() {
    // dispose previous
    while (this.group.children.length) {
      const c = this.group.children.pop();
      c.geometry?.dispose?.(); c.material?.dispose?.();
    }
    this._clearPickables();
    const item = this._item();
    if (!item || !this.paint) { this.group.visible = false; return; }
    this.group.visible = true;
    const app = this.app;

    // curve polyline (+y .02, violet)
    const pts = curveDisplayPoints(item);
    if (pts.length >= 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(
        pts.map(p => new THREE.Vector3(p[0], p[1] + C.PATH_Y_OFFSET, p[2])));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: C.PATH_COLOR, fog: false }));
      line.userData.__pathCurve = true;
      this.group.add(line);
    }

    // anchors + number sprites
    item.anchors.forEach((a, i) => {
      const sel = this.paint.selectedAnchor === i;
      const r = C.PATH_ANCHOR_R * (sel ? C.PATH_ANCHOR_SEL_SCALE : 1);
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12),
        new THREE.MeshBasicMaterial({ color: sel ? C.PATH_COLOR_SEL : C.PATH_COLOR, fog: false, depthTest: false }));
      mesh.position.set(a.pos[0], a.pos[1] + 0.02, a.pos[2]);
      mesh.renderOrder = 10;
      mesh.userData.pathAnchorIndex = i;
      this.group.add(mesh);
      app.pathEditPickables.push(mesh);
      // number sprite
      const sprite = makeNumberSprite(i + 1);
      sprite.position.set(a.pos[0], a.pos[1] + 0.35, a.pos[2]);
      this.group.add(sprite);
      // height handle (flown only, when selected or high)
      if (this._isFlown() && (sel || a.pos[1] > C.PATH_HEIGHT_SHOW_MIN)) {
        const h = a.pos[1];
        const hy = C.PATH_HEIGHT_LADDER_A + h * C.PATH_HEIGHT_LADDER_K;
        const lg = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(a.pos[0], 0, a.pos[2]), new THREE.Vector3(a.pos[0], hy, a.pos[2])]);
        this.group.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: C.PATH_COLOR_HEIGHT, fog: false })));
        const hh = new THREE.Mesh(new THREE.SphereGeometry(C.PATH_HEIGHT_R, 12, 8),
          new THREE.MeshBasicMaterial({ color: C.PATH_COLOR_HEIGHT, fog: false, depthTest: false }));
        hh.position.set(a.pos[0], hy, a.pos[2]);
        hh.renderOrder = 10;
        hh.userData.pathHeightAnchor = i;
        this.group.add(hh);
        app.pathEditPickables.push(hh);
      }
      // tangent handles (selected anchor only)
      if (sel) {
        for (const [key, color] of [['in', C.PATH_COLOR_TANGENT], ['out', C.PATH_COLOR_TANGENT]]) {
          const v = a[key];
          if (!v || (v[0] === 0 && v[1] === 0 && v[2] === 0)) continue;
          const tip = [a.pos[0] + v[0], a.pos[1] + v[1], a.pos[2] + v[2]];
          const lg = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(...a.pos), new THREE.Vector3(...tip)]);
          this.group.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color, fog: false })));
          const h = new THREE.Mesh(new THREE.SphereGeometry(C.PATH_HANDLE_R, 12, 8),
            new THREE.MeshBasicMaterial({ color, fog: false, depthTest: false }));
          h.position.set(...tip);
          h.renderOrder = 10;
          h.userData.pathHandle = key;
          h.userData.pathHandleAnchor = i;
          this.group.add(h);
          app.pathEditPickables.push(h);
        }
      }
    });
  }

  tick() {
    // keep visuals fresh while painting (rebuild on store change handled by onShowChanged)
  }

  // ---- drag interaction (pWr Hn/Gr/zn port) ----
  _installDrag() {
    const app = this.app;
    const el = app.renderer.domElement;
    let moved = null;

    el.addEventListener('pointerdown', e => {
      if (!this.paint || e.button !== 0) return;
      const pick = app.manipulator._pick(e.clientX, e.clientY);
      if (pick?.type !== 'pathEdit') return;
      const ud = pick.hit.object.userData;
      app.orbit.enabled = false;
      el.setPointerCapture(e.pointerId);
      moved = { ud, start: [e.clientX, e.clientY], hit: pick.hit };
    }, true);

    el.addEventListener('pointermove', e => {
      if (!moved || !this.paint) return;
      if (!moved.dragging && Math.hypot(e.clientX - moved.start[0], e.clientY - moved.start[1]) < 3) return;
      moved.dragging = true;
      const p = this.paint;
      const item = this._item();
      if (!item) return;
      const ud = moved.ud;

      if (ud.pathAnchorIndex !== undefined) {
        // raycast walkable surfaces
        const hit = this._rayWalkable(e);
        if (hit) {
          const idx = ud.pathAnchorIndex;
          const pos = this._anchorPosFor(hit.point, idx);
          app.show.movePathAnchor(p.trackId, p.itemId, idx, pos);
        }
      } else if (ud.pathHeightAnchor !== undefined) {
        // plane ⟂ (camera→anchor, y-flattened) through anchor; y → inverse ladder MOr
        const a = item.anchors[ud.pathHeightAnchor];
        const camDir = new THREE.Vector3().subVectors(app.camera.position, new THREE.Vector3(...a.pos));
        camDir.y = 0;
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir.normalize(), new THREE.Vector3(...a.pos));
        const hit = this._rayPlane(e, plane);
        if (hit) {
          const h = Math.max(0, (hit.y - C.PATH_HEIGHT_LADDER_A) / C.PATH_HEIGHT_LADDER_K);
          app.show.setPathAnchorHeight(p.trackId, p.itemId, ud.pathHeightAnchor, h);
        }
      } else if (ud.pathHandle !== undefined) {
        // plane y = anchor.y; XZ drag; alt = break
        const a = item.anchors[ud.pathHandleAnchor];
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -a.pos[1]);
        const hit = this._rayPlane(e, plane);
        if (hit) {
          const v = [hit.x - a.pos[0], 0, hit.z - a.pos[2]];
          app.show.movePathHandle(p.trackId, p.itemId, ud.pathHandleAnchor, ud.pathHandle, v, e.altKey);
        }
      }
    }, true);

    const end = e => {
      if (!moved) return;
      if (!moved.dragging) {
        // click-without-move → select anchor (shows tangent handles)
        const ud = moved.ud;
        if (ud.pathAnchorIndex !== undefined) {
          this.paint.selectedAnchor = ud.pathAnchorIndex;
          this.selectedAnchor = ud.pathAnchorIndex;
          this.rebuild();
          app.page.changed();
        }
      } else app.show.snapshot(); // make the drag undoable as one op
      moved = null;
      app.orbit.enabled = true;
    };
    el.addEventListener('pointerup', end, true);
    el.addEventListener('pointercancel', end, true);
  }

  _rayFromEvent(e) {
    const r = this.app.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const rc = new THREE.Raycaster();
    rc.setFromCamera(ndc, this.app.camera);
    return rc;
  }
  _rayWalkable(e) {
    const rc = this._rayFromEvent(e);
    const hits = rc.intersectObjects(this.app.walkableSurfaces(), false);
    return hits[0] ?? null;
  }
  _rayPlane(e, plane) {
    const rc = this._rayFromEvent(e);
    const p = new THREE.Vector3();
    return rc.ray.intersectPlane(plane, p) ? p : null;
  }
}

function makeNumberSprite(n) {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 40px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 5;
  ctx.strokeText(String(n), 32, 34);
  ctx.fillText(String(n), 32, 34);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  s.scale.setScalar(0.35);
  s.renderOrder = 11;
  return s;
}
