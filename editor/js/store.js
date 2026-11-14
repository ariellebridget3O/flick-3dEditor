// store.js — three stores (object/show/page) mirroring the live app's split [A:F7],
// with op-based undo and beginEditGesture/endEditGesture bracketing.
import { uuid, packItems, itemDuration } from './schema.js';
import { arcLength, polylineOf, buildTangents } from './curves.js';
import { C } from './const.js';

function emit(listeners) { for (const fn of listeners) fn(); }

class StoreBase {
  constructor() { this.listeners = new Set(); }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  changed() { emit(this.listeners); }
}

// ============ object store: objects map, selection, transform mode, clipboard ============
export class ObjectStore extends StoreBase {
  constructor() {
    super();
    this.objects = {};            // id → object (v10 fields)
    this.selectedIds = [];
    this.selectedId = null;       // primary (last) selection
    this.transformMode = 'translate';
    this.clipboard = null;
    this.spawn = null;
  }
  get(id) { return this.objects[id]; }
  all() { return this.objects; }
  setObjects(objects) { this.objects = objects; this.changed(); }
  update(id, patch) {
    if (!this.objects[id]) return;
    this.objects[id] = { ...this.objects[id], ...patch };
    this.changed();
  }
  add(obj) {
    const id = obj.id ?? uuid();
    this.objects[id] = { ...obj, id };
    this.changed();
    return id;
  }
  remove(id) {
    // groups re-parent children to scene root (TWr)
    for (const [cid, c] of Object.entries(this.objects))
      if (c.parentId === id) this.objects[cid] = { ...c, parentId: undefined };
    delete this.objects[id];
    this.select(this.selectedIds.filter(s => s !== id));
    this.changed();
  }
  select(ids) {
    this.selectedIds = ids.slice(0, C.SEL_MAX);
    this.selectedId = this.selectedIds[this.selectedIds.length - 1] ?? null;
    this.changed();
  }
  toggleSelect(id) {
    const has = this.selectedIds.includes(id);
    this.select(has ? this.selectedIds.filter(s => s !== id) : [...this.selectedIds, id]);
  }
  duplicate(id, showStore) {
    const src = this.objects[id];
    if (!src) return null;
    const idMap = new Map();
    const newId = this._dupOne(src, idMap);
    // cameras duplicate with their target (Die)
    if (src.kind === 'camera' && src.targetId && this.objects[src.targetId]) {
      const tid = this._dupOne(this.objects[src.targetId], idMap);
      this.update(newId, { targetId: tid });
    }
    if (showStore) showStore.cloneTracksFor(idMap);
    return newId;
  }
  _dupOne(src, idMap) {
    const nid = uuid();
    idMap.set(src.id, nid);
    // offset duplicate slightly
    const pos = src.position ? [src.position[0] + 0.5, src.position[1], src.position[2]] : src.position;
    this.objects[nid] = { ...src, id: nid, name: src.name ? `${src.name} copy` : src.name, position: pos };
    return nid;
  }
  copy() {
    this.clipboard = this.selectedIds.map(id => JSON.parse(JSON.stringify(this.objects[id]))).filter(Boolean);
    return this.clipboard.length;
  }
  paste(showStore) {
    if (!this.clipboard?.length) return [];
    const idMap = new Map();
    const newIds = this.clipboard.map(src => this._dupOne(src, idMap));
    // remap parent/target refs within the pasted set
    for (const nid of newIds) {
      const o = this.objects[nid];
      const srcId = [...idMap.entries()].find(([, n]) => n === nid)?.[0];
      if (o.parentId && idMap.has(o.parentId)) this.objects[nid] = { ...o, parentId: idMap.get(o.parentId) };
      if (o.targetId && idMap.has(o.targetId)) this.objects[nid] = { ...o, targetId: idMap.get(o.targetId) };
    }
    if (showStore) showStore.cloneTracksFor(idMap);
    this.select(newIds);
    this.changed();
    return newIds;
  }
  groupOrUngroup() {
    if (this.selectedIds.length < 2) return null;
    const gid = uuid();
    this.objects[gid] = { id: gid, kind: 'group', name: 'Group', position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
    for (const id of this.selectedIds) this.update(id, { parentId: gid });
    this.select([gid]);
    return gid;
  }
}

// ============ show store: tracks + items, undoable ops ============
export class ShowStore extends StoreBase {
  constructor() {
    super();
    this.show = { name: 'Show', tracks: [] };
    this.undoStack = [];
    this.redoStack = [];
    this._gestureSnapshots = null; // [sceneRef, showRef] at gesture start
  }
  setShow(show) { this.show = show; this.undoStack = []; this.redoStack = []; this.changed(); }
  tracks() { return this.show.tracks; }
  trackOf(characterId) { return this.show.tracks.find(t => t.characterId === characterId); }
  ensureTrack(characterId) {
    let tr = this.trackOf(characterId);
    if (!tr) { tr = { id: uuid(), characterId, items: [] }; this.show.tracks.push(tr); this.changed(); }
    return tr;
  }
  removeTrack(trackId) {
    this.show.tracks = this.show.tracks.filter(t => t.id !== trackId);
    this.changed();
  }

  // ---- undo ----
  beginEditGesture() {
    if (this._gestureSnapshots) return;
    this._gestureSnapshots = JSON.stringify(this.show);
  }
  endEditGesture() {
    if (!this._gestureSnapshots) return;
    const before = this._gestureSnapshots;
    const after = JSON.stringify(this.show);
    this._gestureSnapshots = null;
    if (before !== after) {
      this.undoStack.push({ show: before, redo: after });
      if (this.undoStack.length > 200) this.undoStack.shift();
      this.redoStack = [];
      this.changed();
    }
  }
  snapshot() { this.beginEditGesture(); this.endEditGesture(); }
  undo() {
    const op = this.undoStack.pop();
    if (!op) return false;
    this.show = JSON.parse(op.show);
    this.redoStack.push(op);
    this.changed();
    return true;
  }
  redo() {
    const op = this.redoStack.pop();
    if (!op) return false;
    this.show = JSON.parse(op.redo);
    this.undoStack.push(op);
    this.changed();
    return true;
  }

  // ---- item ops (all push through packItems) ----
  _commit(trackId, mutate) {
    this.beginEditGesture();
    const tr = this.show.tracks.find(t => t.id === trackId);
    if (tr) { mutate(tr); tr.items = packItems(tr.items); }
    this.endEditGesture();
    this.changed();
  }
  addItem(characterId, item) {
    const tr = this.ensureTrack(characterId);
    const it = { id: uuid(), startS: 0, ...item };
    this._commit(tr.id, t => t.items.push(it));
    return it;
  }
  patchItem(trackId, itemId, patch) {
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i >= 0) t.items[i] = { ...t.items[i], ...patch };
    });
  }
  removeItem(trackId, itemId) {
    this._commit(trackId, t => { t.items = t.items.filter(x => x.id !== itemId); });
  }
  moveItem(trackId, itemId, desiredStartS) {
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i >= 0) t.items[i] = { ...t.items[i], startS: Math.max(0, desiredStartS) };
    });
  }
  trimItem(trackId, itemId, durationS) {
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i < 0) return;
      const it = t.items[i];
      if (it.kind === 'path' || it.kind === 'cam-path') {
        // trim recomputes speed = arc/duration (MR(nx(anchors))/dur)
        const arc = it.anchors.length >= 2 ? arcLength(polylineOf(it.anchors)) : 0;
        t.items[i] = { ...it, speedUnitsPerS: Math.max(C.SPEED_STORE_FLOOR, arc / Math.max(0.05, durationS)) };
      } else {
        t.items[i] = { ...it, durationS: Math.max(0.05, durationS) };
      }
    });
  }
  duplicateItemTo(trackId, itemId, toTrackId) {
    const tr = this.show.tracks.find(t => t.id === trackId);
    const it = tr?.items.find(x => x.id === itemId);
    if (!it) return null;
    const copy = { ...JSON.parse(JSON.stringify(it)), id: uuid() };
    this._commit(toTrackId, t => t.items.push(copy));
    return copy;
  }

  // ---- keyframe capture (addTransformKeyframe/addCameraKeyframe/setCameraItemFields — SZt/kZt) ----
  _replaceKeyAt(itemId, key, kinds) {
    return t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i < 0 || !kinds.includes(t.items[i].kind)) return;
      const keys = [...(t.items[i].keys ?? [])].filter(k => Math.abs(k.tS - key.tS) > 0.001); // ym
      keys.push(key);
      keys.sort((a, b) => a.tS - b.tS);
      t.items[i] = { ...t.items[i], keys };
    };
  }
  addTransformKeyframe(trackId, itemId, key) {   // Bzt keys (position/rotation/scale/headRotation)
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['transform']));
  }
  addCameraKeyframe(trackId, itemId, key) {      // cam-transform keys (position/rotation/focalLengthMm)
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['cam-transform']));
  }
  setCameraItemFields(trackId, itemId, fields) { // OHr-equivalent patch for camera item kinds
    const CAM_KINDS = ['cam-still', 'cam-move', 'cam-path', 'cam-follow', 'cam-transform', 'cam-manual'];
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i >= 0 && CAM_KINDS.includes(t.items[i].kind)) {
        t.items[i] = { ...t.items[i], ...fields };
      }
    });
  }

  // ---- path item ops (paint mode) ----
  addPathItem(characterId, startS) {
    return this.addItem(characterId, {
      kind: 'path', anchors: [], speedUnitsPerS: C.SPEED_DEFAULT, gait: 'walk', startS,
    });
  }
  appendPathAnchor(trackId, itemId, pos) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it) return;
      const pts = it.anchors.map(a => a.pos); pts.push([...pos]);
      it.anchors = buildTangents(pts);
    });
  }
  insertPathAnchor(trackId, itemId, index, pos) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it) return;
      const pts = it.anchors.map(a => a.pos); pts.splice(index + 1, 0, [...pos]);
      it.anchors = buildTangents(pts);
    });
  }
  movePathAnchor(trackId, itemId, index, pos) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it || !it.anchors[index]) return;
      it.anchors = it.anchors.map((a, i) => i === index ? { ...a, pos: [...pos] } : a);
    });
  }
  setPathAnchorHeight(trackId, itemId, index, h) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it || !it.anchors[index]) return;
      it.anchors = it.anchors.map((a, i) => i === index ? { ...a, pos: [a.pos[0], h, a.pos[2]] } : a);
      if (it.heightCurve) delete it.heightCurve; // HHr: anchor height change drops the curve
    });
  }
  movePathHandle(trackId, itemId, index, handle, vec, breakSymmetry) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it || !it.anchors[index]) return;
      const opp = handle === 'in' ? 'out' : 'in';
      it.anchors = it.anchors.map((a, i) => {
        if (i !== index) return a;
        const next = { ...a, [handle]: [...vec] };
        if (!breakSymmetry) next[opp] = [-vec[0], -vec[1], -vec[2]];
        return next;
      });
    });
  }
  deletePathAnchor(trackId, itemId, index) {
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it) return;
      const pts = it.anchors.filter((_, i) => i !== index).map(a => a.pos);
      it.anchors = buildTangents(pts);
    });
  }

  // ---- detach references on object delete (DHr) ----
  detachReferences(deletedId) {
    this.beginEditGesture();
    for (const tr of this.show.tracks) {
      for (let i = 0; i < tr.items.length; i++) {
        const it = tr.items[i];
        let patch = null;
        if (it.centerObjectId === deletedId) patch = { centerObjectId: null };
        if (it.subjectId === deletedId) patch = { ...patch, subjectId: null };
        if (it.kind === 'cam-still' && it.subjectId === deletedId) patch = { subjectId: undefined };
        if (it.objectId === deletedId) patch = { ...patch, objectId: null };
        if (patch) tr.items[i] = { ...it, ...patch };
      }
    }
    this.show.tracks = this.show.tracks.filter(t => t.characterId !== deletedId);
    this.endEditGesture();
    this.changed();
  }

  cloneTracksFor(idMap) {
    this.beginEditGesture();
    for (const tr of this.show.tracks) {
      const newChar = idMap.get(tr.characterId);
      if (!newChar) continue;
      this.show.tracks.push({
        ...JSON.parse(JSON.stringify(tr)), id: uuid(), characterId: newChar,
        items: tr.items.map(it => ({
          ...JSON.parse(JSON.stringify(it)), id: uuid(),
          subjectId: it.subjectId && idMap.has(it.subjectId) ? idMap.get(it.subjectId) : it.subjectId,
          objectId: it.objectId && idMap.has(it.objectId) ? idMap.get(it.objectId) : it.objectId,
          centerObjectId: it.centerObjectId && idMap.has(it.centerObjectId) ? idMap.get(it.centerObjectId) : it.centerObjectId,
        })),
      });
    }
    this.endEditGesture();
    this.changed();
  }
}

// ============ page store: mode, playhead, recordAspect, paint state ============
export class PageStore extends StoreBase {
  constructor() {
    super();
    this.mode = 'edit';                  // edit | camera
    this.stageView = 'editor';           // editor | cameras
    this.controlMode = 'default';        // default | unreal
    this.recordAspect = '16:9';
    this.focalLengthMm = C.FOCAL_DEFAULT;
    this.playheadS = 0;
    this.playing = false;
    this.playStartPerfT = 0;             // performance.now() at play start
    this.playStartS = 0;
    this.paint = null;                   // {trackId, itemId, selectedAnchor} while path painting
    this.selectedSegment = null;         // {trackId, itemId} for timeline block selection
    this.keyboardOwner = 'stage';
    this.finishEnabled = false;
  }
  seek(s) { this.playheadS = s; this.changed(); }
  play() {
    if (this.playing) return;
    this.playing = true;
    this.playStartPerfT = performance.now();
    this.playStartS = this.playheadS;
    this.changed();
  }
  stop() { this.playing = false; this.changed(); }
  tickClock() {
    if (!this.playing) return this.playheadS;
    const t = this.playStartS + (performance.now() - this.playStartPerfT) / 1000;
    this.playheadS = t;
    return t;
  }
}
