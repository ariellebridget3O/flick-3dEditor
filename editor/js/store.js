// store.js — three stores (object/show/page) mirroring the live app's split [A:F7],
// with op-based undo and beginEditGesture/endEditGesture bracketing.
import { uuid, packItems, itemDuration } from './schema.js';
import { arcLength, polylineOf, buildTangents } from './curves.js';
import { C, CAM_MOVE_PRESETS } from './const.js';   // CAM_MOVES_FOCUSABLE/STILL_* via the second const import below
import { moveItemToIndex, canDuplicateOnto, dropSelfRefs, moveKey, maxEnd, appendPlace, placeAvoiding, NON_CAMERA_KINDS, remapAction } from './place.js';
import { CAM_ITEM_KINDS, subjectlessItem, isPersonKind, rigJointsAtTime } from './tracks.js';
import { cloneJoints } from './figures.js';
import { CAM_MOVES_FOCUSABLE, STILL_DUR, STILL_MIN_DUR } from './const.js';
import * as THREE from 'three';

// ---- r8b aim-math helpers (verbatim family: CP/wDe/pie/VWt/Zo/cN/s$/NP/VDe/uje/kv) ----
// s2e — angle wrap to (−π, π]
const s2e = v => v - 2 * Math.PI * Math.ceil((v - Math.PI) / (2 * Math.PI));
const _ae = new THREE.Euler();
// wDe — decompose with the euler-flip heuristic (x+π, π−y, z+π when |x|+|z| smaller by >1e-9)
function decomposeTRSFlip(m) {
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  m.decompose(p, q, s);
  _ae.setFromQuaternion(q, 'XYZ');
  const flip = [s2e(_ae.x + Math.PI), s2e(Math.PI - _ae.y), s2e(_ae.z + Math.PI)];
  const rot = (Math.abs(flip[0]) + Math.abs(flip[2]) < Math.abs(_ae.x) + Math.abs(_ae.z) - 1e-9) ? flip : [_ae.x, _ae.y, _ae.z];
  return { position: [p.x, p.y, p.z], rotation: rot, scale: [s.x, s.y, s.z] };
}
// Zo @4908770 — one-level world TRS: parent·child (VWt), else local
function worldTRSof(objects, id) {
  const o = objects[id];
  if (!o) return { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] };
  const local = { position: o.position ?? [0, 0, 0], rotation: o.rotation ?? [0, 0, 0], scale: o.scale ?? [1, 1, 1] };
  const p = o.parentId ? objects[o.parentId] : null;
  if (!p) return local;
  const m = composeMatrix(p.position ?? [0, 0, 0], p.rotation ?? [0, 0, 0], p.scale ?? [1, 1, 1])
    .multiply(composeMatrix(local.position, local.rotation, local.scale));
  return decomposeTRSFlip(m);
}
// uje @5263906 — object height from kind (humanoid jP·scaleY; prop catalog dims; target/spotlight 0)
function propHeightOf(obj, propDims) {
  if (obj.kind === 'humanoid' || obj.kind === 'simple_figure') return C.FIG_HEIGHT * obj.scale[1];
  const cat = obj.kind === 'prop' && obj.propKey ? propDims?.(obj.propKey) : undefined;
  if (cat) return (cat[1] || 1) * obj.scale[1];
  return obj.kind === 'target' || obj.kind === 'spotlight' ? 0 : obj.scale[1];
}
// VDe @5264034 — world Y bounds (groups fold non-aid children; fie = camera/target/spotlight skip)
function objectWorldBounds(id, obj, objs, propDims) {
  if (obj.kind !== 'group') {
    const a = worldTRSof(objs, id);
    return { minY: a.position[1], maxY: a.position[1] + propHeightOf({ ...obj, scale: a.scale }, propDims) };
  }
  let lo = Infinity, hi = -Infinity;
  for (const [cid, c] of Object.entries(objs)) {
    if (c.parentId !== id || c.kind === 'camera' || c.kind === 'target' || c.kind === 'spotlight') continue;
    const a = worldTRSof(objs, cid);
    lo = Math.min(lo, a.position[1]);
    hi = Math.max(hi, a.position[1] + propHeightOf({ ...c, scale: a.scale }, propDims));
  }
  return lo === Infinity ? { minY: obj.position[1], maxY: obj.position[1] } : { minY: lo, maxY: hi };
}
// pie/cN @4908396 — convert a world-space TRS patch into parent-local space
function parentLockedTRS(obj, objs, patch, propDims) {
  const p = obj.parentId ? objs[obj.parentId] : null;
  if (!p) return patch;
  const inv = composeMatrix(p.position ?? [0, 0, 0], p.rotation ?? [0, 0, 0], p.scale ?? [1, 1, 1]).invert();
  return decomposeTRSFlip(inv.multiply(composeMatrix(patch.position, patch.rotation, patch.scale)));
}
// s$ @4908529 — the target position that keeps it aiming at the world-space aim point
function keepAimPoint(obj, objs, aimWorld, propDims) {
  return parentLockedTRS(obj, objs, { position: aimWorld, rotation: [0, 0, 0], scale: [1, 1, 1] }, propDims).position;
}
// Kzt @4325070 — heightCurve validation (u monotonic 0..1, height 0..Y2r=20, handles well-formed)
const CURVE_MAX_H = C.HEIGHT_CURVE_MAX;                  // Y2r = 100 (bundle-verified)
function validHeightCurve(t) {
  if (!Array.isArray(t) || t.length < 2) return undefined;
  const okHandle = h => Array.isArray(h) && h.length === 2 && h.every(Number.isFinite);
  return t.every((n, r) => {
    if (!n || typeof n !== 'object') return false;
    const { u, heightM, in: o, out: l } = n;
    return typeof u === 'number' && (r === 0 ? u === 0 : u > t[r - 1].u)
      && (r < t.length - 1 || u === 1)
      && typeof heightM === 'number' && heightM >= 0 && heightM <= CURVE_MAX_H
      && okHandle(o) && okHandle(l) && o[0] <= 0 && l[0] >= 0;
  }) ? t : undefined;
}
// kv @4911593 — lookAt rotation (yaw+pitch) from position→aim, then rotateY(π) (camera faces −Z)
const _kvObj = new THREE.Object3D();
function lookAtEulerRZ(pos, aim) {
  _kvObj.position.set(pos[0], pos[1], pos[2]);
  _kvObj.lookAt(aim[0], aim[1], aim[2]);
  _kvObj.rotateY(Math.PI);
  return [_kvObj.rotation.x, _kvObj.rotation.y, _kvObj.rotation.z];
}

// ---- TRS compose/decompose helpers (pie/VWt group math; plain THREE.Matrix4) ----
function composeMatrix(position, rotation, scale) {
  const m = new THREE.Matrix4();
  m.compose(
    new THREE.Vector3(...(position ?? [0, 0, 0])),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rotation ?? [0, 0, 0]), 'XYZ')),
    new THREE.Vector3(...(scale ?? [1, 1, 1])));
  return m;
}
function decomposeTRS(m) {
  const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  m.decompose(p, q, s);
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ');
  return { position: [p.x, p.y, p.z], rotation: [e.x, e.y, e.z], scale: [s.x, s.y, s.z] };
}

const TAKE_RANGE_MIN_S = 0.1;   // eie — min take-range width
// rx().durationS — raw show length = max item endS (no span floor)
const showDurationS = show => Math.max(0, ...(show.tracks ?? []).flatMap(t =>
  t.items.map(it => it.startS + itemDuration(it))));

const KEY_EPS = 0.001;   // ym

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
    this.spawnIndex = 0;          // @5258094 — spawn-grid cursor (addObject without pos2)
    this.draggingComponent = null;
    this.propCatalog = null;      // main.js boot wires the catalog (addComponent prop gate)
  }
  get(id) { return this.objects[id]; }
  all() { return this.objects; }
  setObjects(objects) { this.objects = objects; this.changed(); }
  update(id, patch) {
    if (!this.objects[id]) return;
    this.objects[id] = { ...this.objects[id], ...patch };
    this.changed();
  }
  // setObjectPose (verbatim @5266864 — the held-pose representation: a PAUSED clip ref;
  // the un-baked form the AI-ops fall back to when baking is unavailable)
  setObjectPose(id, pose) {
    const r = this.objects[id];
    if (r) this.update(id, { animation: { clip: pose, playing: false } });
  }
  // defaultName (verbatim @5259538) — `${label} ${countOf(kind)+1}`; labels are i18n
  // catalog ids → semantic English equivalents (SKILL #34). propKey branch: the live
  // derives the display name from the catalog entry (wU) — our prop add path names
  // explicitly, so only the catalog dims-name is used as a fallback.
  defaultName(kind, propKey) {
    const n = label => `${label} ${Object.values(this.objects).filter(o => o.kind === kind).length + 1}`;
    switch (kind) {
      case 'cube': return n('Cube');
      case 'sphere': return n('Sphere');
      case 'cylinder': return n('Cylinder');
      case 'humanoid': return n('Human');
      case 'simple_figure': return n('Figure');
      case 'camera': return n('Camera');
      case 'target': return n('Target');
      case 'spotlight': return n('Spotlight');
      case 'prop': return propKey ? (this.propCatalog?.[propKey]?.label ?? propKey) : undefined;   // wU label
      default: return undefined;
    }
  }
  // setPersonKind (verbatim @5266962): strip animation + name (auto-named
  // `${oldLabel} N` renames to defaultName(newKind), custom names keep), set kind,
  // re-seed humanoid defaults (ere = {animation:{clip:'idle',playing:false}})
  setPersonKind(id, kind) {
    const r = this.objects[id];
    if (!r || !isPersonKind(r.kind) || r.kind === kind) return;
    const { animation, name, ...o } = r;
    const label = r.kind === 'humanoid' ? 'Human' : 'Figure';
    const autoNamed = name?.startsWith(`${label} `) && /^\d+$/.test(name.slice(label.length + 1));
    this.objects[id] = {
      ...o,
      kind,
      ...(kind === 'humanoid' ? { animation: { clip: 'idle', playing: false } } : {}),
      ...(name !== undefined ? { name: autoNamed ? this.defaultName(kind) : name } : {}),
    };
    this.changed();
  }
  add(obj) {
    const id = obj.id ?? uuid();
    // addObject default (verbatim @5260119): name omitted -> defaultName(kind, propKey)
    // (numbered 'Human 1'/'Figure 2'...); explicit names (prop picker, scene load) keep
    const d = obj.name === undefined ? this.defaultName(obj.kind, obj.propKey) : undefined;
    this.objects[id] = { ...obj, id, ...d && { name: d } };
    this.changed();
    return id;
  }
  // ---- component-drop family (r16 verbatim: consts @5257398, addObject @5260119,
  // addCameraMarker @5259124, addComponent @5260542) ----
  // Spawn grid: nL=1.5 step, V2e=5 cols × rMr=6 rows; rL=[4,WWt,4] camera-marker base,
  // sL=[0,1,0] its aim point; UWt: target y=1 (zWt) else 0. NO gesture bracket here —
  // the facade/UI layer brackets (SKILL #39; the store must stay double-bracket-free).
  addObject(kind, props = {}, pos2, opts = {}) {
    const SPAWN_STEP = 1.5, SPAWN_COLS = 5, SPAWN_ROWS = 6;           // nL / V2e / rMr
    const id = uuid();
    let x, z;
    if (pos2) [x, z] = pos2;
    else {
      const u = this.spawnIndex++ % (SPAWN_COLS * SPAWN_ROWS);
      x = (u % SPAWN_COLS) * SPAWN_STEP - 3;
      z = Math.floor(u / SPAWN_COLS) * SPAWN_STEP;
    }
    const placement = kind === 'spotlight'                            // sGt @4907099: y G8r=3.5, z+q8r=3, aim kv
      ? (() => { const p = [x, 3.5, z + 3]; return { position: p, rotation: lookAtEulerRZ(p, [x, 0, z]) }; })()
      : { position: [x, kind === 'target' ? 1 : 0, z], rotation: [0, 0, 0] };   // UWt @4902049 (zWt=1)
    const d = props.name === undefined ? this.defaultName(kind, props.propKey) : undefined;
    this.objects[id] = { kind, ...placement, scale: [1, 1, 1], ...(d && { name: d }), ...props };
    if (opts.select !== false) this.select([id]);
    this.changed();
    return id;
  }
  addCameraMarker(pos2) {
    const nL = 1.5, WWt = 1.6;                                        // camera-count offset step / marker y
    const CAMERA_BASE = [4, 1.6, 4], CAMERA_AIM = [0, 1, 0];          // rL / sL @5257398
    const r = Object.values(this.objects).filter(o => o.kind === 'camera').length * nL;
    const s = pos2 ? [pos2[0], pos2[1]] : [CAMERA_BASE[0] + r, CAMERA_BASE[2]];
    const a = pos2 ? [pos2[0] + (CAMERA_AIM[0] - CAMERA_BASE[0]), pos2[1] + (CAMERA_AIM[2] - CAMERA_BASE[2])]
                   : [CAMERA_AIM[0] + r, CAMERA_AIM[2]];
    const o = [s[0], WWt, s[1]];
    const id = uuid();
    this.objects[id] = { kind: 'camera', position: o, rotation: lookAtEulerRZ(o, [a[0], CAMERA_AIM[1], a[1]]), scale: [1, 1, 1], name: this.defaultName('camera') };
    this.select([id]);
    this.changed();
    return id;
  }
  addComponent(spec, pos2) {
    switch (spec.kind) {
      case 'cube': case 'sphere': case 'cylinder': return this.addObject(spec.kind, {}, pos2);
      case 'camera': return this.addCameraMarker(pos2);
      case 'target': return this.addObject('target', {}, pos2);
      case 'spotlight': return this.addObject('spotlight', {}, pos2);
      case 'humanoid': return this.addObject('humanoid', { animation: { clip: 'idle', playing: false } }, pos2);   // ere
      case 'simple_figure': return this.addObject('simple_figure', { rotation: [0, Math.PI, 0] }, pos2);          // Bst()
      case 'prop': return spec.propKey in (this.propCatalog ?? {}) ? this.addObject('prop', { propKey: spec.propKey }, pos2) : undefined;
      default: return undefined;
    }
  }
  setDraggingComponent(c) { this.draggingComponent = c; }               // @5258094
  clearDraggingComponent() { this.draggingComponent = null; }
  remove(id, force = false) {
    // round 6 live-exact: group delete = RECURSIVE subtree delete (children, nested groups,
    // cameras take their paired targets). Standalone paired-target deletion REFUSES (live Xu).
    // (Round-5 followed EDITOR_UX §2.7's wrong “re-parent children to scene” claim — R2 verified
    // the bundle: remove() recurses; TWr is only the mesh-layer safety net for UNGROUP.)
    const o = this.objects[id];
    if (!o) return false;
    if (!force && o.kind === 'target') {
      // paired target (a camera references it) refuses — deleting the camera removes it
      const paired = Object.values(this.objects).some(c => c.kind === 'camera' && c.targetId === id);
      if (paired) return false;
    }
    const kids = Object.entries(this.objects).filter(([, c]) => c.parentId === id).map(([cid]) => cid);
    if (o.kind === 'camera' && o.targetId && this.objects[o.targetId]) kids.push(o.targetId);
    for (const k of [...kids]) this.remove(k, true);   // recurse: nested groups + paired targets (force)
    delete this.objects[id];
    this.select(this.selectedIds.filter(s => s !== id));
    this.changed();
    return true;
  }
  select(ids) {
    this.selectedIds = [...ids];   // live setSelection has no clamp (WWr caps footprint DRAW only)
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
    const newId = this._dupOne(src, idMap, id);
    // cameras duplicate with their target (Die)
    if (src.kind === 'camera' && src.targetId && this.objects[src.targetId]) {
      const tid = this._dupOne(this.objects[src.targetId], idMap, src.targetId);
      this.update(newId, { targetId: tid });
    }
    if (showStore) showStore.cloneTracksFor(idMap);
    return newId;
  }
  _dupOne(src, idMap, srcId) {
    const nid = uuid();
    idMap.set(srcId ?? src.id, nid);   // scene-loaded records may lack inline .id — the store key is authoritative
    // offset duplicate slightly
    const pos = src.position ? [src.position[0] + 0.5, src.position[1], src.position[2]] : src.position;
    this.objects[nid] = { ...src, id: nid, name: src.name ? `${src.name} copy` : src.name, position: pos };
    return nid;
  }
  copy() {
    // carry the store key as .id so paste()'s idMap (and track cloning) matches (scene JSON has key-only ids)
    this.clipboard = this.selectedIds
      .map(id => { const c = JSON.parse(JSON.stringify(this.objects[id])); return c ? { ...c, id } : null; })
      .filter(Boolean);
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
  // ---- groups (round 6: live-exact groupSelection/ungroup pie/VWt) ----
  // ≥2 selected → create group at child CENTROID, children re-based to LOCAL (pie), selection=[gid].
  // Single GROUP selected → ungroup (VWt): children world back, parentId stripped, group deleted, selection=children.
  // Returns {ok, toast?} — callers surface the toasts (live toasts on <2 groupable / partial skips).
  groupOrUngroup() {
    const all = this.objects;
    const sel = this.selectedIds.filter(id => all[id]);
    // ungroup path: single group selected
    if (sel.length === 1 && all[sel[0]]?.kind === 'group') {
      const gid = sel[0];
      const g = all[gid];
      const gs = g.scale ?? [1, 1, 1];
      const gp = g.position ?? [0, 0, 0];
      const childIds = Object.entries(all).filter(([, o]) => o.parentId === gid).map(([i]) => i);
      for (const cid of childIds) {
        const c = all[cid];
        // VWt: world = group ∘ local — full matrix compose (covers groups later moved/rotated/scaled)
        const local = composeMatrix(c.position, c.rotation, c.scale);
        const world = composeMatrix(gp, g.rotation ?? [0, 0, 0], gs);
        world.multiply(local);
        const dec = decomposeTRS(world);
        this.update(cid, { parentId: undefined, position: dec.position, rotation: dec.rotation, scale: dec.scale });
      }
      delete this.objects[gid];
      this.select(childIds);
      this.changed();
      return { ok: true, ungrouped: childIds.length };
    }
    // create path: groupable = non-group, TOP-LEVEL only (parentId undefined) — live groupSelection
    const groupable = sel.filter(id => all[id].kind !== 'group' && !all[id].parentId);
    if (groupable.length < 2) {
      return { ok: false, toast: sel.length < 2 ? null : 'Select at least two ungrouped objects (children of a group can\u2019t be grouped again)' };
    }
    const skipped = sel.length - groupable.length;
    // centroid of child positions (world — all are top-level, so store TRS = world)
    let cx = 0, cy = 0, cz = 0;
    for (const id of groupable) { const p = all[id].position ?? [0, 0, 0]; cx += p[0]; cy += p[1]; cz += p[2]; }
    cx /= groupable.length; cy /= groupable.length; cz /= groupable.length;
    const gid = uuid();
    this.objects[gid] = { id: gid, kind: 'group', name: 'Group', position: [cx, cy, cz], rotation: [0, 0, 0], scale: [1, 1, 1] };
    for (const id of groupable) {
      // pie: local = inv(group) ∘ world; group rot=0 scale=1 at creation → local = world − centroid
      const o = all[id];
      const p = o.position ?? [0, 0, 0];
      this.update(id, { parentId: gid, position: [p[0] - cx, p[1] - cy, p[2] - cz] });
    }
    this.select([gid]);
    this.changed();
    return { ok: true, grouped: groupable.length, skipped, partial: skipped > 0 };
  }
}

// ============ show store: tracks + items, undoable ops ============
function camItemFocusSubject(item) {                 // Cit @5523845 — cam-path needs aim==='subject'; cam-move/cam-still take subjectId directly
  return item.kind === 'cam-path' ? (item.aim === 'subject' ? item.subjectId ?? null : null)
    : item.kind === 'cam-move' || item.kind === 'cam-still' ? item.subjectId ?? null : null;
}

export class ShowStore extends StoreBase {
  constructor() {
    super();
    this.show = { name: 'Show', tracks: [] };
    this.undoStack = [];
    this.redoStack = [];
    this._gestureSnapshots = null; // [sceneRef, showRef] at outermost gesture start
    this._gestureDepth = 0;         // nestable brackets: undo pushed when depth returns to 0
  }
  setShow(show) { this.show = show; this.undoStack = []; this.redoStack = []; this.changed(); }
  tracks() { return this.show.tracks; }

  // ---- take range (setTakeRange @5548675 + She @4320286, eie/tie) ----
  // eie=.1 — minimum range width in seconds; tie(startS,endS) validity (>= eie - 1e-6)
  setTakeRange(e) {
    if (this._takeLocked?.()) return false;            // live: recording !== null refuses
    if (!e) {                                          // null clears the range
      this.beginEditGesture();
      if (this.show.range !== undefined) delete this.show.range;
      this.endEditGesture();
      this.changed();
      return true;
    }
    const r2 = a => Math.round(a * 100) / 100;         // round to 0.01 s
    const a = r2(Math.max(0, Math.min(e.startS, e.endS)));
    const b = r2(Math.max(e.startS, e.endS));
    if (!(b - a >= TAKE_RANGE_MIN_S - 1e-6)) return false;   // tie(r,s)
    this.beginEditGesture();
    this.show.range = { startS: a, endS: b };
    this.endEditGesture();
    this.changed();
    return true;
  }
  // She(show, durationS) — the effective play/film span; range clamped to the show, else full
  takeSpan(durationS) {
    const n = this.show.range;
    if (n) {
      const r = Math.min(Math.max(n.startS, 0), durationS);
      const s = Math.min(Math.max(n.endS, 0), durationS);
      if (s - r >= TAKE_RANGE_MIN_S - 1e-6) return { fromS: r, toS: s };
    }
    return { fromS: 0, toS: durationS };
  }
  filmedARange() {                                     // live filmedARange: fromS>0 || toS<duration
    const d = showDurationS(this.show);
    const { fromS, toS } = this.takeSpan(d);
    return fromS > 0 || toS < d;
  }
  durationS() { return showDurationS(this.show); }
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

  // ---- undo (observer-history-equivalent: show + companion objects store, gesture-bracketed) ----
  setUndoCompanion(objectsStore) { this._companion = objectsStore; }
  _snap() {
    return { show: JSON.stringify(this.show), objects: this._companion ? JSON.stringify(this._companion.all()) : null };
  }
  beginEditGesture() {
    this._gestureDepth = (this._gestureDepth ?? 0) + 1;
    if (this._gestureDepth === 1) this._gestureSnapshots = this._snap();   // snapshot at the OUTERMOST begin only
  }
  endEditGesture() {
    if (this._gestureDepth > 0) this._gestureDepth--;
    if (this._gestureDepth > 0) return;   // still inside an outer gesture — no undo push yet
    const before = this._gestureSnapshots;
    this._gestureSnapshots = null;
    if (!before) return;
    const after = this._snap();
    if (before.show !== after.show || before.objects !== after.objects) {
      this.undoStack.push({ ...before, redoShow: after.show, redoObjects: after.objects });
      if (this.undoStack.length > 200) this.undoStack.shift();
      this.redoStack = [];
      this.changed();
    }
  }
  snapshot() { this.beginEditGesture(); this.endEditGesture(); }
  _restore(op, dir) {
    this.show = JSON.parse(dir === 'undo' ? op.show : op.redoShow);
    if (this._companion && op.objects !== null) {
      const objs = JSON.parse(dir === 'undo' ? op.objects : op.redoObjects);
      this._companion.setObjects(objs);
    }
    this.changed();
  }
  undo() {
    const op = this.undoStack.pop();
    if (!op) return false;
    this.redoStack.push(op);
    this._restore(op, 'undo');
    return true;
  }
  redo() {
    const op = this.redoStack.pop();
    if (!op) return false;
    this.undoStack.push(op);
    this._restore(op, 'redo');
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
  // removePerformanceItem (verbatim @5546806): filter the item + finish-paint gate
  // (the live checks performancePaint; ours routes through the page.paint + hook)
  removePerformanceItem(trackId, itemId) {
    this._commit(trackId, t => { t.items = t.items.filter(x => x.id !== itemId); });
    const page = this._hooks?.page;
    if (page?.paint?.itemId === itemId && this._hooks?.finishPerformancePaint) this._hooks.finishPerformancePaint();
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
      const dur = Math.min(120, Math.max(0.1, durationS));   // store clamps [.1, 120] (Ije/QZt); UI floor .05 is the drag stop (WAr)
      if (it.kind === 'path' || it.kind === 'cam-path') {
        // trim recomputes speed = arc/duration (MR(nx(anchors))/dur)
        const arc = it.anchors.length >= 2 ? arcLength(polylineOf(it.anchors)) : 0;
        t.items[i] = { ...it, speedUnitsPerS: Math.max(C.SPEED_STORE_FLOOR, arc / dur) };
      } else {
        t.items[i] = { ...it, durationS: dur };
      }
    });
  }
  // duplicateItem (live 4-arg form): kind-compat gate + DHr self-ref drop + startS
  duplicateItemTo(trackId, itemId, toTrackId, startS = 0) {
    const tr = this.show.tracks.find(t => t.id === trackId);
    const it = tr?.items.find(x => x.id === itemId);
    if (!it) return null;
    const dest = this.show.tracks.find(t => t.id === toTrackId);
    if (!dest) return null;
    const owner = this._companion ? this._companion.get(dest.characterId) : null;
    if (!owner || !canDuplicateOnto(it, owner.kind)) return null;   // live Art(): missing owner refuses all kinds
    const copy = dropSelfRefs({ ...JSON.parse(JSON.stringify(it)), id: uuid(), startS: Math.max(0, startS) }, dest.characterId);
    this._commit(toTrackId, t => { t.items = [...t.items, copy]; });
    return copy;
  }
  // kGt: move item to slot index (startS inherits the slot's original start)
  reorderItem(trackId, itemId, toIndex) {
    this._commit(trackId, t => { t.items = moveItemToIndex(t.items, itemId, toIndex); });
  }

  // ===== actions palette store family (live BHr methods, r8 extraction @5543181..5544343
  // + r8b aim/seed units @4908396..5547928). Hooks injected at boot (main.js):
  // _hooks = { page, updateObjectTransform, enterPathEdit, seedAnchorY, propDims }.
  // Live keeps selectedSegment in the same signal store; our split routes through PageStore.
  _objs() { return this._companion?.all() ?? {}; }

  isCameraTarget(id) {                                   // Xu @4909267
    const o = this._objs()[id];
    return o?.kind === 'target' && Object.values(this._objs()).some(c => c.kind === 'camera' && c.targetId === id);
  }
  canOwnTrack(id) { return !this.isCameraTarget(id); }   // BHr @5543438
  setDraggingAction(payload) { this.draggingAction = payload; }        // BHr @5543181 (verbatim surface)
  clearDraggingAction() { this.draggingAction = null; }                // BHr @5543229
  resolveActionForObject(id, payload) {                  // BHr @5543283 = a$(payload, kind)
    return remapAction(payload, this._objs()[id]?.kind);
  }
  canDropActionOnObject(id, payload) {                   // BHr @5543348
    return this.canOwnTrack(id) && this.resolveActionForObject(id, payload) !== null;
  }
  addPerformanceTrack(id) {                              // BHr @5542786 — Xzt gate = Q0||camera; !Xu; no existing track
    const kind = this._objs()[id]?.kind;
    if (!(NON_CAMERA_KINDS.has(kind) || kind === 'camera') || this.isCameraTarget(id)) return null;
    if (this.show.tracks.some(t => t.characterId === id)) return null;
    const tr = { id: uuid(), characterId: id, items: [] };
    this.show.tracks.push(tr);
    this.changed();
    return tr.id;
  }
  placeItemS(items, durationS, atS) {                    // @5528347: atS===undefined ? MP : W5r
    return atS === undefined ? maxEnd(items) : appendPlace(items, durationS, atS);
  }
  _selectSegment(trackId, itemId) {                      // live selectedSegment.set (same-store signal)
    const page = this._hooks?.page;
    if (page) { page.selectedSegment = { trackId, itemId }; page.changed(); }
  }
  _kindOfTrack(trackId) {                                // trackObjectKind @5544574
    const tr = this.show.tracks.find(t => t.id === trackId);
    return tr ? this._objs()[tr.characterId]?.kind : undefined;
  }
  addClipItem(trackId, clip, atS) {                      // @5544717 — humanoid gate, N8=5 FIXED duration
    if (this._kindOfTrack(trackId) !== 'humanoid') return null;
    const id = uuid();
    this._commit(trackId, tr => {
      tr.items.push({ id, kind: 'clip', clip, durationS: C.ITEM_DEFAULT_DUR, startS: this.placeItemS(tr.items, C.ITEM_DEFAULT_DUR, atS) });
    });
    this._selectSegment(trackId, id);
    return id;
  }
  addPlayItem(trackId, atS) {                            // @5544957 — humanoid gate
    if (this._kindOfTrack(trackId) !== 'humanoid') return null;
    const id = uuid();
    this._commit(trackId, tr => {
      tr.items.push({ id, kind: 'play', durationS: 0, samples: [], keymap: {}, startS: this.placeItemS(tr.items, 0, atS) });
    });
    this._selectSegment(trackId, id);
    return id;
  }
  _addObjectItem(trackId, durationS, build, atS, select = true) {   // addObjectItem @5545089 — Q0 gate
    if (!NON_CAMERA_KINDS.has(this._kindOfTrack(trackId))) return null;
    const id = uuid();
    this._commit(trackId, tr => {
      const startS = this.placeItemS(tr.items, durationS, atS);
      tr.items.push(build(id, startS, durationS));
    });
    if (select) this._selectSegment(trackId, id);
    return id;
  }
  addRotateItem(trackId, atS) {                          // @5545634 — axis y, SHr=90, N8=5
    return this._addObjectItem(trackId, C.ITEM_DEFAULT_DUR, (id, s, d) => ({ id, kind: 'rotate', axis: 'y', degPerS: 90, durationS: d, startS: s }), atS);
  }
  addRevolveItem(trackId, atS) {                         // @5545690 — center = firstOtherObjectId, THr=60
    return this._addObjectItem(trackId, C.ITEM_DEFAULT_DUR, (id, s, d) => ({ id, kind: 'revolve', centerObjectId: this.firstOtherObjectId(trackId), degPerS: 60, durationS: d, startS: s }), atS);
  }
  addScaleItem(trackId, factor, atS) {                   // @5545742 — factor AHr=2 / CHr=.5 from dispatch
    return this._addObjectItem(trackId, C.ITEM_DEFAULT_DUR, (id, s, d) => ({ id, kind: 'scale', factor, durationS: d, startS: s }), atS);
  }
  addTransformItem(trackId, atS) {                       // @5545792 — Jae=4, keys []
    return this._addObjectItem(trackId, 4, (id, s, d) => ({ id, kind: 'transform', durationS: d, keys: [], startS: s }), atS);
  }
  addRigTransformItem(trackId, atS, select = true) {     // @5546822 — humanoid gate, Jae=4
    const tr = this.show.tracks.find(t => t.id === trackId);
    if (!tr || this._objs()[tr.characterId]?.kind !== 'humanoid') return null;
    return this._addObjectItem(trackId, 4, (id, s, d) => ({ id, kind: 'rig-transform', durationS: d, keys: [], startS: s }), atS, select);
  }
  firstSubjectId() {                                     // @5548276 — first person, else first non-spotlight Q0
    const objs = this._objs();
    for (const [id, o] of Object.entries(objs)) if (o.kind === 'humanoid' || o.kind === 'simple_figure') return id;
    for (const [id, o] of Object.entries(objs)) if (NON_CAMERA_KINDS.has(o.kind) && o.kind !== 'spotlight') return id;
    return null;
  }
  firstOtherObjectId(trackId) {                          // @5548475 — first other non-spotlight Q0
    const charId = this.show.tracks.find(t => t.id === trackId)?.characterId;
    for (const [id, o] of Object.entries(this._objs()))
      if (id !== charId && NON_CAMERA_KINDS.has(o.kind) && o.kind !== 'spotlight') return id;
    return null;
  }
  _cameraItemBuild(action, id, startS, dur, subject) {   // LHr @5538958
    switch (action) {
      case 'still': return { id, kind: 'cam-still', startS, durationS: dur };
      case 'path': return { id, kind: 'cam-path', startS, anchors: [], speedUnitsPerS: 2, aim: 'travel', subjectId: subject };
      case 'follow': return { id, kind: 'cam-follow', startS, durationS: dur, objectId: subject };
      case 'transform': return { id, kind: 'cam-transform', startS, durationS: dur, keys: [] };
      case 'manual': return { id, kind: 'cam-manual', startS, durationS: 0, samples: [] };
      default: {
        const p = CAM_MOVE_PRESETS[action];
        return { id, kind: 'cam-move', startS, durationS: dur, move: action, subjectId: subject, direction: 'ccw', angleDeg: p.angleDeg, heightDeltaUnits: p.heightDeltaUnits, distanceScale: p.distanceScale };
      }
    }
  }
  _cameraActionDuration(action) {                        // sje @5081533
    if (action in CAM_MOVE_PRESETS) return CAM_MOVE_PRESETS[action].durationS;
    if (action === 'path' || action === 'manual') return 0;
    if (action === 'transform') return 4;
    return C.ITEM_DEFAULT_DUR;
  }
  addCameraItem(trackId, action, atS, subjectId, opts) { // @5546971 → appendCameraItem @5547047
    const id = this._appendCameraItem(trackId, action, atS, subjectId, opts);
    if (id) this._selectSegment(trackId, id);
    return id;
  }
  _appendCameraItem(trackId, action, atS, subjectId, opts) {
    const tr = this.show.tracks.find(t => t.id === trackId);
    if (!tr) return null;
    if (this._objs()[tr.characterId]?.kind !== 'camera') return null;
    const id = uuid();
    const dur = this._cameraActionDuration(action);
    let startS = 0, subject = null, preItems = [];
    this._commit(trackId, t => {
      startS = this.placeItemS(t.items, dur, atS);
      subject = subjectId === undefined ? this.firstSubjectId() : subjectId;
      preItems = t.items;
      t.items.push(this._cameraItemBuild(action, id, startS, dur, subject));
    });
    if (action === 'path') {
      this._enterPathEdit(trackId, id);
      if (opts?.seedStart !== false) this.seedPathStart(tr.characterId);
    } else if (action !== 'still' && subject) {
      this.aimCameraAtSubject(tr.characterId, preItems, id, startS, subject);
    }
    return id;
  }
  _enterPathEdit(trackId, itemId) {                      // @5539708 — segment + paint + editInteraction
    const enter = this._hooks?.enterPathEdit;
    if (enter) enter(trackId, itemId);
  }
  seedPathStart(characterId) {                           // @5539606 — anchor at object world pos, Y via anchorPosFor
    const o = this._objs()[characterId];
    if (!o) return;
    const page = this._hooks?.page;
    const p = page?.paint;
    if (!p) return;
    const tr = this.show.tracks.find(t => t.id === p.trackId);
    const it = tr?.items.find(i => i.id === p.itemId);
    const wp = worldTRSof(this._objs(), characterId).position;
    const idx = (it?.anchors.length ?? 1) - 1;
    const seedY = this._hooks?.seedAnchorY
      ? this._hooks.seedAnchorY(p.trackId, p.itemId, wp, idx)
      : wp[1];
    const newIdx = this.appendPathAnchor(p.trackId, p.itemId, [wp[0], seedY, wp[2]]);
    if (page && newIdx >= 0) page.paint = { ...page.paint, selectedAnchor: newIdx };
  }
  subjectHeightOffset(subjectId, objs, k = C.SUBJECT_AIM_K) {  // NP @5264414 — minY−y + k·max(0, maxY−minY); n=.7 (MIr) default, spotlight branch passes NIr=.5 (review P2-1)
    const o = objs[subjectId];
    if (!o) return 0;
    const { minY, maxY } = objectWorldBounds(subjectId, o, objs, this._hooks?.propDims);
    const y = worldTRSof(objs, subjectId).position[1];
    return minY - y + k * Math.max(0, maxY - minY);
  }
  subjectAimPoint(subjectId, extraOffset = 0) {          // @5531839
    const objs = this._objs();
    const o = objs[subjectId];
    if (!o) return null;
    const base = worldTRSof(objs, subjectId).position;
    return [base[0], base[1] + this.subjectHeightOffset(subjectId, objs) + extraOffset, base[2]];
  }
  aimCameraAtSubject(cameraId, items, itemId, startS, subjectId, extraOffset = 0) {  // @5547561 verbatim
    if (!this._hooks?.updateObjectTransform) return;
    if (items.some(g => g.startS < startS && CAM_ITEM_KINDS.has(g.kind) && g.kind !== 'cam-still')) return;
    const objs = this._objs();
    const cam = objs[cameraId];
    const aim = this.subjectAimPoint(subjectId, extraOffset);
    if (!cam || !aim) return;
    const tid = cam.targetId;
    const tobj = tid ? objs[tid] : undefined;
    const otherSubjectless = items.some(g => g.id !== itemId && subjectlessItem(g));   // YN
    if (tid && tobj && tid !== subjectId && !otherSubjectless) {
      this._hooks.updateObjectTransform(tid, { position: keepAimPoint(tobj, objs, aim) });   // s$
    }
    this._turnCameraToward(cameraId, aim);
  }
  _turnCameraToward(cameraId, aim) {                     // @5531977 — kv lookAt + cN parent-lock
    const objs = this._objs();
    const o = objs[cameraId];
    if (!o || !this._hooks?.updateObjectTransform) return;
    const base = worldTRSof(objs, cameraId);
    this._hooks.updateObjectTransform(cameraId, { rotation: parentLockedTRS(o, objs, { ...base, rotation: lookAtEulerRZ(base.position, aim) }).rotation });
  }
  addActionToTrack(trackId, payload, atS) {              // @5543480 verbatim dispatch
    const tr = this.show.tracks.find(t => t.id === trackId);
    if (!tr) return;
    const a = this.resolveActionForObject(tr.characterId, payload);
    if (!a) return;
    switch (a.kind) {
      case 'path': this.addPathItem(trackId, atS); break;
      case 'play': this.addPlayItem(trackId, atS); break;
      case 'clip': this.addClipItem(trackId, a.clip, atS); break;
      case 'camera': this.addCameraItem(trackId, a.action, atS); break;
      case 'object':
        switch (a.action) {
          case 'rotate': this.addRotateItem(trackId, atS); break;
          case 'revolve': this.addRevolveItem(trackId, atS); break;
          case 'scale-up': this.addScaleItem(trackId, C.SCALE_UP_FACTOR, atS); break;
          case 'scale-down': this.addScaleItem(trackId, C.SCALE_DOWN_FACTOR, atS); break;
          case 'transform': this.addTransformItem(trackId, atS); break;
          case 'rig-transform': this.addRigTransformItem(trackId, atS); break;
        }
        break;
    }
  }
  appendActionToObject(id, payload) {                    // @5544148 verbatim
    if (!this.canDropActionOnObject(id, payload)) return;
    const trackId = this.show.tracks.find(t => t.characterId === id)?.id ?? this.addPerformanceTrack(id);
    if (trackId) this.addActionToTrack(trackId, payload);
  }

  // ---- keyframe capture (addTransformKeyframe/addCameraKeyframe/setCameraItemFields — SZt/kZt) ----
  _replaceKeyAt(itemId, key, kinds, { mergeJoints = false } = {}) {
    return t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i < 0 || !kinds.includes(t.items[i].kind)) return;
      const it = t.items[i];
      const sameTS = k => Math.abs(k.tS - key.tS) <= KEY_EPS;
      const existing = (it.keys ?? []).find(sameTS);
      let newKey = key;
      if (mergeJoints && existing) newKey = { tS: existing.tS, joints: { ...existing.joints, ...key.joints } };
      // transform keys inherit headRotation from the key they replace
      if (!mergeJoints && kinds.includes('transform') && !key.headRotation && existing?.headRotation) {
        newKey = { ...key, headRotation: existing.headRotation };
      }
      const keys = [...(it.keys ?? []).filter(k => !sameTS(k)), newKey].sort((a, b) => a.tS - b.tS);
      // durationS always grows to the last key (live behavior)
      t.items[i] = { ...it, keys, durationS: Math.max(it.durationS ?? 0, keys[keys.length - 1].tS) };
    };
  }
  addTransformKeyframe(trackId, itemId, key) {   // Bzt keys (position/rotation/scale/headRotation)
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['transform']));
  }
  addCameraKeyframe(trackId, itemId, key) {      // cam-transform keys (position/rotation/focalLengthMm)
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['cam-transform']));
  }
  addRigKeyframe(trackId, itemId, key) {         // rig keys merge joints at the same tS
    this._commit(trackId, this._replaceKeyAt(itemId, key, ['rig-transform'], { mergeJoints: true }));
  }
  // addSampledRigKeyframe (verbatim @5536122): sample the rig-transform eval at
  // item.startS + tS (the LATEST rig item at that time — T2r semantics) and merge the
  // captured `extra` joints over it, so a partial capture keeps the other joints' state.
  addSampledRigKeyframe(trackId, itemId, tS, extra = {}) {
    const track = this.show.tracks.find(t => t.id === trackId);
    const item = track?.items.find(x => x.id === itemId);
    if (item?.kind !== 'rig-transform') return;
    const l = rigJointsAtTime(track.items, item.startS + tS);
    this.addRigKeyframe(trackId, itemId, { tS, joints: { ...(l ? cloneJoints(l) : {}), ...extra } });
  }
  _removeKeyAt(itemId, tS, kinds) {
    return t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i < 0 || !kinds.includes(t.items[i].kind)) return;
      t.items[i] = { ...t.items[i], keys: (t.items[i].keys ?? []).filter(k => Math.abs(k.tS - tS) > KEY_EPS) };
    };
  }
  removeTransformKeyframe(trackId, itemId, tS) { this._commit(trackId, this._removeKeyAt(itemId, tS, ['transform'])); }
  removeCameraKeyframe(trackId, itemId, tS) { this._commit(trackId, this._removeKeyAt(itemId, tS, ['cam-transform'])); }
  removeRigKeyframe(trackId, itemId, tS) { this._commit(trackId, this._removeKeyAt(itemId, tS, ['rig-transform'])); }
  // xbe — move the key at fromTS to toTS
  moveTransformKeyframe(trackId, itemId, fromTS, toTS) { this._moveKeyAt(trackId, itemId, fromTS, toTS, ['transform']); }
  moveCameraKeyframe(trackId, itemId, fromTS, toTS) { this._moveKeyAt(trackId, itemId, fromTS, toTS, ['cam-transform']); }
  moveRigKeyframe(trackId, itemId, fromTS, toTS) { this._moveKeyAt(trackId, itemId, fromTS, toTS, ['rig-transform']); }
  _moveKeyAt(trackId, itemId, fromTS, toTS, kinds) {
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i < 0 || !kinds.includes(t.items[i].kind)) return;
      t.items[i] = { ...t.items[i], keys: moveKey(t.items[i].keys ?? [], fromTS, toTS) };
    });
  }
  findItem(seg) {
    return this.show.tracks.find(t => t.id === seg.trackId)?.items.find(i => i.id === seg.itemId);
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


  // ---- focus / move-segment family (live show-store methods; r13 audit P0-3 + P1-8;
  // setCameraFocus/keepLookOnClear/moveSegmentOf normalized-identical in DBE17t4T + CaBu3A6T) ----
  _playheadS() { return this._hooks?.playheadS?.() ?? 0; }
  moveSegmentOf(trackId, s) {                              // @5546275 — camera: Fp/V2r set; walker: path|play; covering + first fallback
    const tr = this.show.tracks.find(t => t.id === trackId);
    const objs = this._objs();
    const isCam = objs[tr?.characterId ?? '']?.kind === 'camera';
    const cands = (tr?.items ?? []).filter(o => isCam ? CAM_ITEM_KINDS.has(o.kind) : o.kind === 'path' || o.kind === 'play');
    return cands.find(o => s >= o.startS && s < o.startS + itemDuration(o)) ?? cands[0] ?? null;
  }
  cameraFocusId(cameraId) {                                // @5545617 — covering cam item at playhead -> Cit
    const trackId = this.show.tracks.find(t => t.characterId === cameraId)?.id ?? null;
    const r = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return r ? camItemFocusSubject(r) : null;
  }
  walkerFocusId(walkerId) {                                // @5545745
    const trackId = this.show.tracks.find(t => t.characterId === walkerId)?.id ?? null;
    const r = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return r?.kind === 'path' && r.aim === 'subject' ? r.subjectId ?? null : null;
  }
  setWalkerFocus(walkerId, subjectId) {                    // @5545918 verbatim (guards + covering path at playhead)
    const objs = this._objs();
    if (!isPersonKind(objs[walkerId]?.kind) || subjectId !== null && (subjectId === walkerId || !objs[subjectId])) return false;
    const trackId = this.show.tracks.find(t => t.characterId === walkerId)?.id ?? null;
    const a = trackId ? this.moveSegmentOf(trackId, this._playheadS()) : undefined;
    return !trackId || a?.kind !== 'path' ? false
      : (this.updatePathItemAim(trackId, a.id, subjectId ? 'subject' : 'travel', subjectId), true);
  }
  updatePathItemAim(trackId, itemId, aim, subjectId) {     // @5542837 — subjectId kept when travel (gates check aim)
    this._commit(trackId, t => {
      t.items = t.items.map(o => o.id === itemId && o.kind === 'path' ? { ...o, aim, ...(aim === 'subject' ? { subjectId } : {}) } : o);
    });
  }
  setCameraFocus(cameraId, subjectId, opts) {              // @5544109 verbatim (r13 audit P0-3)
    const objs = this._objs();
    if (objs[cameraId]?.kind !== 'camera' || subjectId !== null && (subjectId === cameraId || !objs[subjectId])) return false;
    const trackId = this.show.tracks.find(t => t.characterId === cameraId)?.id ?? this.addPerformanceTrack(cameraId);
    if (!trackId) return false;
    const items = this.show.tracks.find(t => t.id === trackId).items;
    const c = this.moveSegmentOf(trackId, this._playheadS());
    const patchable = c?.kind === 'cam-path' || c?.kind === 'cam-move' && CAM_MOVES_FOCUSABLE.includes(c.move);   // yP gate
    if (c && !patchable && c.kind !== 'cam-still') return false;   // refuse follow/transform/manual/pan_sweep
    const u = c ? camItemFocusSubject(c) : null;
    if (subjectId === null) {
      if (!c || !u) return false;
      const y = opts?.lookingAt ?? this.subjectAimPoint(u, c.aimOffsetUnits || 0);   // $6
      if (y) this.keepLookOnClear(cameraId, c, items, y);
    }
    if (c && patchable) {
      this.setCameraItemFields(trackId, c.id, { ...(c.kind === 'cam-path' ? { aim: 'subject' } : {}), subjectId });
      return true;
    }
    if (c?.kind === 'cam-still' && subjectId === null) {
      this.setCameraItemFields(trackId, c.id, { subjectId: null });
      return true;
    }
    const h = c?.startS ?? 0;
    const f = this._restDurationS(trackId);               // rx(show minus this track).durationS
    const m = items.find(y => y.startS > h)?.startS ?? Infinity;
    const g = Math.min(m, Math.max(f, h + (c ? itemDuration(c) : STILL_DUR)));       // sje('still') = N8 = 5
    const b = { id: c?.id ?? uuid(), kind: 'cam-still', startS: h,
      durationS: Math.max(STILL_MIN_DUR, g - h),           // Ije = .1
      ...(c && c.focalLengthMm !== undefined ? { focalLengthMm: c.focalLengthMm } : {}), subjectId };
    this._commit(trackId, t => { t.items = [b, ...t.items.filter(v => v.id !== c?.id)]; });
    return true;
  }
  keepLookOnClear(cameraId, item, items, lookPoint) {      // @5545290 verbatim
    if (!this._hooks?.updateObjectTransform) return;
    if (item.kind === 'cam-still') this._turnCameraToward(cameraId, lookPoint);
    const objs = this._objs();
    const o = objs[cameraId];
    const tid = o?.targetId, tobj = tid ? objs[tid] : undefined;
    if (!tid || !tobj) { this._hooks.updateObjectTransform(cameraId, { lastAimPosition: lookPoint }); return; }
    if (!items.some(d => d.id !== item.id && subjectlessItem(d))) this._hooks.updateObjectTransform(tid, { position: keepAimPoint(tobj, objs, lookPoint) });
  }
  _restDurationS(excludeTrackId) {                          // rx({...show minus track}).durationS — max endS over the rest
    let d = 0;
    for (const t of this.show.tracks) {
      if (t.id === excludeTrackId) continue;
      for (const it of t.items) d = Math.max(d, it.startS + itemDuration(it));
    }
    return d;
  }

  // ---- path item ops (paint mode) ----
  addPathItem(trackId, atS, opts) {                     // live addPathItem(trackId, atS, opts) @5544370
    if (!NON_CAMERA_KINDS.has(this._kindOfTrack(trackId))) return null;
    const tr = this.show.tracks.find(t => t.id === trackId);
    const humanoid = this._kindOfTrack(trackId) === 'humanoid';
    const id = uuid();
    this._commit(trackId, t => {
      t.items.push({ id, kind: 'path', anchors: [], speedUnitsPerS: C.SPEED_DEFAULT, ...(humanoid ? { gait: 'walk' } : {}), startS: this.placeItemS(t.items, 0, atS) });
    });
    this._enterPathEdit(trackId, id);
    if (opts?.seedStart !== false) this.seedPathStart(tr.characterId);
    return id;
  }
  appendPathAnchor(trackId, itemId, pos) {
    let idx = -1;
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it) return;
      const pts = it.anchors.map(a => a.pos); pts.push([...pos]);
      it.anchors = buildTangents(pts);
      idx = it.anchors.length - 1;
    });
    return idx;                                   // caller selects the new anchor (live: selectPathAnchor)
  }
  insertPathAnchor(trackId, itemId, index, pos) {
    let idx = -1;
    this._commit(trackId, t => {
      const it = t.items.find(x => x.id === itemId);
      if (!it) return;
      const pts = it.anchors.map(a => a.pos); pts.splice(index + 1, 0, [...pos]);
      it.anchors = buildTangents(pts);
      idx = index + 1;
    });
    return idx;
  }
  setPathHeightCurve(trackId, itemId, curve) {           // @5556468 — cam-path gate + Kzt validation
    const tr = this.show.tracks.find(t => t.id === trackId);
    const it = tr?.items.find(i => i.id === itemId);
    if (!it || it.kind !== 'cam-path' || !validHeightCurve(curve)) return false;
    this._commit(trackId, t => {
      const i = t.items.findIndex(x => x.id === itemId);
      if (i >= 0) t.items[i] = { ...t.items[i], heightCurve: curve };
    });
    return true;
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
    // unlinkTarget: cameras referencing the deleted target drop the reference (live Xu)
    for (const o of Object.values(this.objects))
      if (o.kind === 'camera' && o.targetId === deletedId) this.update(o.id, { targetId: null });
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
    this.viewportMode = '3d';            // round 6 (C): '3d' | 'plan' — the top-down plan canvas
    this.controlMode = 'default';        // default | unreal
    this.recordAspect = '16:9';
    this.focalLengthMm = C.FOCAL_DEFAULT;
    this.playheadS = 0;
    this.playing = false;
    this.playStartPerfT = 0;             // performance.now() at play start
    this.playStartS = 0;
    this.paint = null;                   // {trackId, itemId, selectedAnchor} while path painting
    this.selectedSegment = null;         // {trackId, itemId[, tS]} for timeline block/keyframe selection
    this.keyboardOwner = 'stage';
    this.finishEnabled = false;
    this.editInteraction = 'idle';      // idle | editingPath | lasso
    this.lassoRect = null;              // {x,y,w,h} canvas-relative px while lasso-dragging
    this.navBallVector = null;          // {forward, strafe} -1..1 while dragging the nav ball
  }
  toggleLasso() { this.editInteraction = this.editInteraction === 'lasso' ? 'idle' : 'lasso'; this.changed(); }
  setEditInteraction(v) { this.editInteraction = v; this.changed(); }
  setLassoRect(r) { this.lassoRect = r; this.changed(); }
  setNavBallVector(v) { this.navBallVector = v; }   // high-frequency: no change event (consumed per-frame)
  setViewportMode(m) { this.viewportMode = m; this.changed(); }

  seek(s) {
    if (this.playing) this.stop();   // live seekPerformance stops playback first
    this.playheadS = s;
    this.seekEpoch = (this.seekEpoch ?? 0) + 1;   // observable "a seek happened" signal (same-t seeks included)
    this.changed();
  }
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
