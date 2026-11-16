// place.js — exact port of the live timeline placement solver + keyframe time
// helpers + cross-object kind compatibility (bundle names: q5r/_ie/W5r/lje/kGt/
// oje/Xne/wie/MP/G5r/Kne/O8/B2r/xbe/bGt/a$/yGt/Art/DHr/Q0).
import { itemDuration } from './schema.js';

export const MAGNET_PX = 12;   // Kne — magnet snap radius in px
const EPS = 1e-6;              // O8
const KEY_EPS = 0.001;         // ym — keyframe time equality
const KEY_GAP = 0.01;          // Ott — min spacing between neighbouring keys

// wie — item → [startS, endS] interval
const intervalOf = it => ({ startS: it.startS, endS: it.startS + itemDuration(it) });

// MP — latest end among items (0 when empty)
export const maxEnd = items => items.reduce((m, it) => Math.max(m, intervalOf(it).endS), 0);

// oje — strict interval overlap (touching edges do NOT overlap)
const overlaps = (a, b) =>
  !(a.endS - a.startS <= EPS || b.endS - b.startS <= EPS) &&
  a.startS < b.endS - EPS && b.startS < a.endS - EPS;

// Xne — magnet snap: try each marker as start or as end (marker - duration)
export function magnetSnap({ desiredStartS, durationS, markersS, radiusS }) {
  if (radiusS <= 0) return desiredStartS;
  let best = desiredStartS, bestD = radiusS + EPS;
  for (const m of markersS) {
    for (const cand of [m, m - durationS]) {
      const d = Math.abs(cand - desiredStartS);
      if (d < bestD) { bestD = d; best = cand; }
    }
  }
  return best;
}

// _ie — place a duration avoiding obstacles, magnet-snapped, guides for drawn markers
export function placeAvoiding({ desiredStartS, durationS, obstacles, markersS, radiusS, fallbackStartS }) {
  const snapped = Math.max(0, magnetSnap({ desiredStartS, durationS, markersS, radiusS }));
  const isFree = s => s >= -EPS && !obstacles.some(o => overlaps({ startS: s, endS: s + durationS }, o));
  let start;
  if (isFree(snapped)) {
    start = snapped;
  } else {
    const desired = { startS: snapped, endS: snapped + durationS };
    start = obstacles
      .filter(o => overlaps(desired, o))
      .flatMap(o => [o.startS - durationS, o.endS])   // just before / just after the blocking obstacle
      .filter(isFree)
      .sort((a, b) => Math.abs(a - snapped) - Math.abs(b - snapped))[0]
      ?? fallbackStartS;
  }
  const end = start + durationS;
  const guidesS = [...new Set(markersS.filter(m => Math.abs(m - start) < EPS || Math.abs(m - end) < EPS))];
  return { startS: start, guidesS };
}

// W5r — plain append-place (palette drops): no magnet, no markers
export const appendPlace = (items, durationS, desiredStartS) =>
  placeAvoiding({
    desiredStartS, durationS,
    obstacles: items.map(intervalOf),
    markersS: [], radiusS: 0,
    fallbackStartS: maxEnd(items),
  }).startS;

// lje — repack items sequentially from 0, sorted by startS (packing keeps order)
export function repackSequential(items) {
  let cursor = 0;
  return [...items]
    .sort((a, b) => a.startS - b.startS)
    .map(it => {
      const start = Math.max(it.startS, cursor);
      cursor = start + itemDuration(it);
      return start === it.startS ? it : { ...it, startS: start };
    });
}

// G5r — item midpoint
const midpoint = it => it.startS + itemDuration(it) / 2;

// q5r — drag plan: free at desired → magnet move; blocked → reorder insertion index
export function planMove({ items, draggedId, desiredStartS, durationS, markersS, radiusS, fallbackStartS }) {
  const others = items.filter(it => it.id !== draggedId);
  const desired = { startS: desiredStartS, endS: desiredStartS + durationS };
  if (!others.some(it => overlaps(desired, intervalOf(it)))) {
    const { startS, guidesS } = placeAvoiding({
      desiredStartS, durationS,
      obstacles: others.map(intervalOf),
      markersS, radiusS, fallbackStartS,
    });
    return { kind: 'move', startS, guidesS };
  }
  return { kind: 'reorder', toIndex: others.filter(it => midpoint(it) <= desiredStartS).length };
}

// kGt — reorder: move item to a slot index; startS inherits the slot's original start
export function moveItemToIndex(items, itemId, toIndex) {
  const sorted = [...items].sort((a, b) => a.startS - b.startS);
  const me = sorted.find(it => it.id === itemId);
  if (!me) return [...items];
  const rest = sorted.filter(it => it.id !== itemId);
  const idx = Math.max(0, Math.min(toIndex, rest.length));
  const occupant = idx < rest.length ? rest[idx] : undefined;
  const startS = occupant ? occupant.startS : maxEnd(rest);
  const moved = { ...me, startS };
  return [...rest.slice(0, idx), moved, ...rest.slice(idx)];
}

// ---- keyframe time helpers ----

// xbe — move the key at fromTS to toTS (filter + concat + sort)
export function moveKey(keys, fromTS, toTS) {
  const hit = keys.find(k => Math.abs(k.tS - fromTS) <= KEY_EPS);
  return hit
    ? keys.filter(k => k !== hit).concat({ ...hit, tS: toTS }).sort((a, b) => a.tS - b.tS)
    : keys;
}

// B2r — clamp a dragged key between its neighbours (±0.01) and [0, durationS]
export function clampKeyTime(keys, fromTS, desiredTS, durationS) {
  const sorted = [...keys].sort((a, b) => a.tS - b.tS);
  const idx = sorted.findIndex(k => Math.abs(k.tS - fromTS) <= KEY_EPS);
  const lo = idx > 0 ? sorted[idx - 1].tS + KEY_GAP : 0;
  const hi = idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1].tS - KEY_GAP : durationS;
  return Math.min(Math.max(desiredTS, lo), hi);
}

// ---- cross-object kind compatibility (bGt / a$ / yGt / Art / DHr) ----

// Q0 — object kinds that can own "object/path" items (everything except cameras)
export const NON_CAMERA_KINDS = new Set(['humanoid', 'simple_figure', 'cube', 'sphere', 'cylinder', 'prop', 'group', 'target', 'spotlight']);

// bGt — normalize an item to an abstract action
function actionOf(it) {
  switch (it.kind) {
    case 'path': return { kind: 'path' };
    case 'play': return { kind: 'play' };
    case 'clip': return { kind: 'clip', clip: it.clip };
    case 'rotate': return { kind: 'object', action: 'rotate' };
    case 'revolve': return { kind: 'object', action: 'revolve' };
    case 'scale': return { kind: 'object', action: it.factor >= 1 ? 'scale-up' : 'scale-down' };
    case 'transform': return { kind: 'object', action: 'transform' };
    case 'rig-transform': return { kind: 'object', action: 'rig-transform' };
    case 'cam-still': return { kind: 'camera', action: 'still' };
    case 'cam-move': return { kind: 'camera', action: it.move };
    case 'cam-path': return { kind: 'camera', action: 'path' };
    case 'cam-follow': return { kind: 'camera', action: 'follow' };
    case 'cam-transform': return { kind: 'camera', action: 'transform' };
    case 'cam-manual': return { kind: 'camera', action: 'manual' };
  }
  return null;
}

// a$ — remap an action for a destination owner kind (null = incompatible)
export function remapAction(act, ownerKind) {
  if (ownerKind === 'camera') {
    if (act.kind === 'camera') return act;
    if (act.kind === 'path') return { kind: 'camera', action: 'path' };
    if (act.kind === 'object' && act.action === 'transform') return { kind: 'camera', action: 'transform' };
    return null;
  }
  if (act.kind === 'camera') {
    if (act.action === 'path') return NON_CAMERA_KINDS.has(ownerKind) ? { kind: 'path' } : null;
    if (act.action === 'transform') return NON_CAMERA_KINDS.has(ownerKind) ? { kind: 'object', action: 'transform' } : null;
    return null;
  }
  if (act.kind === 'object') {
    if (act.action === 'rig-transform') return ownerKind === 'humanoid' ? act : null;
    return NON_CAMERA_KINDS.has(ownerKind) ? act : null;
  }
  if (act.kind === 'path') return NON_CAMERA_KINDS.has(ownerKind) ? act : null;
  return ownerKind === 'humanoid' ? act : null;   // clip / play live only on humanoids
}

// yGt — does the remapped action preserve the original semantics?
function sameAction(a, b) {
  if (!a || !b || a.kind !== b.kind) return false;
  if ((a.kind === 'object' && b.kind === 'object') || (a.kind === 'camera' && b.kind === 'camera')) return a.action === b.action;
  if (a.kind === 'clip' && b.kind === 'clip') return a.clip === b.clip;
  return true;
}

// Art — may this item be duplicated onto a track owned by ownerKind?
export const canDuplicateOnto = (item, ownerKind) => {
  const act = actionOf(item);
  const remapped = remapAction(act, ownerKind);
  return remapped !== null && sameAction(act, remapped);
};

// DHr — after duplicating to a new owner, drop references that would point at the new owner
export function dropSelfRefs(item, newOwnerId) {
  if (item.kind === 'revolve' && item.centerObjectId === newOwnerId) return { ...item, centerObjectId: null };
  if ((item.kind === 'path' || item.kind === 'cam-move' || item.kind === 'cam-path') && item.subjectId === newOwnerId) return { ...item, subjectId: null };
  if (item.kind === 'cam-still' && item.subjectId === newOwnerId) {
    const { subjectId, ...rest } = item;
    return rest;
  }
  return item.kind === 'cam-follow' && item.objectId === newOwnerId ? { ...item, objectId: null } : item;
}
