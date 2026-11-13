// schema.js — scene v10 load / migrate / normalize / save.
// Ports: iGt/f6r/prt/c6r/a6r/u6r/h6r/p6r/l6r/o6r/b6r/g6r/m6r (see analysis/TRACK_SYSTEM.md §9).
import { C } from './const.js';
import { buildTangents, polylineOf, arcLength } from './curves.js';

export const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  }));

const clampSpeed = v => Number.isFinite(v) && v > 0 ? Math.max(v, C.SPEED_STORE_FLOOR) : C.SPEED_UI_FLOOR; // bie/i6r
const isPathKind = it => it.kind === 'path' || it.kind === 'cam-path'; // g2

// item duration (yd): path kinds derive from arc/speed
export function itemDuration(it) {
  if (isPathKind(it)) return it.anchors.length < 2 ? 0 : arcLength(polylineOf(it.anchors)) / it.speedUnitsPerS;
  return it.durationS;
}

// ---- v1→v2 (c6r): performances map → single show ----
function v1to2(t) {
  const perfs = t.performances ?? {};
  const active = t.activePerformanceId ? perfs[t.activePerformanceId] : null;
  const show = active ?? Object.values(perfs)[0] ?? { name: 'Show', tracks: [] };
  return { ...t, v: 2, show };
}
// ---- v2→v3 (a6r): legacy points[] → anchors via tangent builder ----
function v2to3(show) {
  if (!show) return { name: 'Show', tracks: [] };
  const tracks = (show.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => it.kind === 'path' && it.points
      ? { ...it, anchors: buildTangents(it.points), points: undefined } : it),
  }));
  return { ...show, tracks };
}
// ---- v4→v5 (u6r/d6r): camera shot object → camera fields + one track ----
function v4to5(t) {
  const objects = { ...t.objects };
  const tracks = [...(t.show?.tracks ?? [])];
  for (const [id, obj] of Object.entries(t.objects)) {
    if (obj.kind !== 'camera' || !obj.shot) continue;
    const shot = obj.shot;
    const preset = { kind: 'orbit', durationS: 8, angleDeg: 360, heightDeltaUnits: 0, distanceScale: 1, direction: 'ccw', subjectId: null, ...shot.preset };
    const rail = { a: null, b: null, speedUnitsPerS: 2, followTarget: true, followObjectId: null, ...shot.rail };
    const s = { shotMode: 'still', ...shot, preset, rail, followObjectId: shot.followObjectId ?? null, focalLengthMm: shot.focalLengthMm ?? C.FOCAL_DEFAULT, shake: shot.shake ?? 'off' };
    const show = { name: t.show?.name ?? 'Show', tracks };
    objects[id] = { ...obj, focalLengthMm: s.focalLengthMm, shake: s.shake, legacyShot: shot, shot: undefined };
    tracks.push({ id: uuid(), characterId: id, items: [{ ...shotToItem(s, show), id: uuid(), startS: 0 }] });
  }
  return { ...t, v: 5, objects, show: { ...t.show, tracks } };
}
function showDuration(show) { // rx-lite for hrt
  let end = 0;
  for (const tr of show?.tracks ?? []) for (const it of tr.items ?? []) end = Math.max(end, it.startS + itemDuration(it));
  return end;
}
function shotToItem(shot, show) { // d6r
  switch (shot.shotMode) {
    case 'preset': return { kind: 'cam-move', durationS: shot.preset.durationS, move: shot.preset.kind, subjectId: shot.preset.subjectId, direction: shot.preset.direction, angleDeg: shot.preset.angleDeg, heightDeltaUnits: shot.preset.heightDeltaUnits, distanceScale: shot.preset.distanceScale };
    case 'rail': {
      const { a, b, speedUnitsPerS } = shot.rail;
      return !a || !b ? { kind: 'cam-still', durationS: shot.preset.durationS }
        : { kind: 'cam-path', anchors: buildTangents([a, b]), speedUnitsPerS: clampSpeed(speedUnitsPerS), aim: shot.rail.followTarget ? 'subject' : 'locked', subjectId: shot.rail.followObjectId };
    }
    case 'follow': return { kind: 'cam-follow', durationS: Math.max(showDuration(show), C.ITEM_DEFAULT_DUR), objectId: shot.followObjectId, ...(shot.followOffset ? { offset: shot.followOffset } : {}) };
    case 'manual': return { kind: 'cam-manual', durationS: Math.max(showDuration(show), C.ITEM_DEFAULT_DUR), samples: [] };
    default: return { kind: 'cam-still', durationS: shot.preset.durationS };
  }
}
// ---- v5→v6 (h6r): prop yawDeg baked into rotation[1] ----
function v5to6(t, propCatalog) {
  const objects = {}; const yawByObject = {};
  for (const [id, obj] of Object.entries(t.objects)) {
    if (obj.kind === 'prop' && obj.propKey && propCatalog[obj.propKey]?.yawDeg) {
      const yaw = propCatalog[obj.propKey].yawDeg * Math.PI / 180;
      yawByObject[id] = yaw;
      objects[id] = { ...obj, rotation: [obj.rotation[0], obj.rotation[1] - yaw, obj.rotation[2]] };
    } else objects[id] = { ...obj };
  }
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => {
      if (it.kind !== 'transform' || !yawByObject[tr.characterId]) return it;
      return { ...it, keys: (it.keys ?? []).map(k => ({ ...k, rotation: [k.rotation[0], k.rotation[1] - yawByObject[tr.characterId], k.rotation[2]] })) };
    }),
  }));
  return { ...t, v: 6, objects, show: { ...t.show, tracks } };
}
// ---- v7→v8 (p6r): transform key rotations unwrapped per axis ----
function v7to8(t) {
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => it.kind !== 'transform' ? it : {
      ...it,
      keys: (it.keys ?? []).map((k, i, keys) => {
        if (i === 0) return k;
        const prev = keys[i - 1];
        return { ...k, rotation: k.rotation.map((r, a) => prev.rotation[a] + wrapPi(r - prev.rotation[a])) };
      }),
    }),
  }));
  return { ...t, v: 8, show: { ...t.show, tracks } };
}
export const wrapPi = a => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

// ---- post-normalizers (prt) ----
function normLegacyRail(t) { // l6r
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => it.kind !== 'cam-rail' ? it : {
      kind: 'cam-path',
      anchors: buildTangents([it.a, it.b].filter(Boolean)),
      speedUnitsPerS: clampSpeed(it.a && it.b ? dist3(it.a, it.b) / Math.max(0.1, it.durationS) : C.SPEED_DEFAULT),
      aim: it.followTarget === false ? 'locked' : 'subject',
      subjectId: it.followObjectId ?? null,
      startS: it.startS, id: it.id, durationS: undefined,
    }),
  }));
  return { ...t, show: { ...t.show, tracks } };
}
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function normSpeeds(t) { // o6r
  let needs = false;
  for (const tr of t.show?.tracks ?? []) for (const it of tr.items ?? [])
    if (isPathKind(it) && clampSpeed(it.speedUnitsPerS) !== it.speedUnitsPerS) needs = true;
  if (!needs) return t;
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => isPathKind(it) ? { ...it, speedUnitsPerS: clampSpeed(it.speedUnitsPerS) } : it),
  }));
  return { ...t, show: { ...t.show, tracks } };
}

function validPace(p) { // C2r/X2r
  if (!Array.isArray(p) || p.length < 2 || !p.every(Number.isFinite)) return false;
  for (let i = 1; i < p.length; i++) if (p[i] < p[i - 1]) return false;
  return p[0] === 0 && Math.abs(p[p.length - 1] - 1) < 1e-9;
}
function validHeightCurve(c) { // Kzt
  if (!Array.isArray(c) || c.length === 0) return false;
  for (let i = 0; i < c.length; i++) {
    const p = c[i];
    if (!Number.isFinite(p.u) || !Number.isFinite(p.heightM) || p.heightM < 0 || p.heightM > C.HEIGHT_CURVE_MAX) return false;
    if (i > 0 && p.u <= c[i - 1].u) return false;
  }
  return true;
}
function normItems(t) { // b6r
  const ids = new Set(Object.keys(t.objects ?? {}));
  const tracks = (t.show?.tracks ?? []).map(tr => ({
    ...tr,
    items: (tr.items ?? []).map(it => {
      const out = { ...it };
      if (out.pace !== undefined && !validPace(out.pace)) delete out.pace;
      if (out.heightCurve !== undefined && !validHeightCurve(out.heightCurve)) delete out.heightCurve;
      if (out.kind === 'cam-still' && out.subjectId && !ids.has(out.subjectId)) delete out.subjectId;
      return out;
    }),
  }));
  return { ...t, show: { ...t.show, tracks } };
}

function normLight(t) { // g6r/N8r/SDe
  const l = t.light;
  if (!l || typeof l !== 'object' || !Number.isFinite(l.azimuthDeg) || !Number.isFinite(l.elevationDeg)) {
    const out = { ...t }; delete out.light; return out;
  }
  const n = { azimuthDeg: ((l.azimuthDeg % 360) + 360) % 360, elevationDeg: Math.min(C.ELEV_MAX, Math.max(C.ELEV_MIN, l.elevationDeg)) };
  if (l.nightLights === false) n.nightLights = false;
  return { ...t, light: n };
}

function normSpotlight(t) { // m6r/nGt
  const objects = {};
  for (const [id, obj] of Object.entries(t.objects ?? {})) {
    if (!obj.spotlight || typeof obj.spotlight !== 'object') { objects[id] = obj; continue; }
    const s = obj.spotlight;
    const shape = s.shape === 'square' ? 'square' : s.shape === 'round' ? 'round' : null;
    const intensity = Number.isFinite(s.intensity) ? Math.min(100, Math.max(0, s.intensity)) : null;
    const diffusion = Number.isFinite(s.diffusion) ? Math.min(100, Math.max(0, s.diffusion)) : null;
    if (!shape || intensity === null || diffusion === null) {
      const o = { ...obj }; delete o.spotlight; objects[id] = o; continue;
    }
    objects[id] = { ...obj, spotlight: { shape, intensity, diffusion } };
  }
  return { ...t, objects };
}

export function normalizeScene(t, propCatalog = {}) {
  return normSpotlight(normLight(normItems(normSpeeds(normLegacyRail(t)))));
}

export function loadScene(input, propCatalog = {}) {
  // accepts raw scene or {row, scene} wrapper
  let t = input && typeof input === 'object' ? input : null;
  if (t && t.scene && t.scene.v !== undefined) t = t.scene;
  if (!t || typeof t !== 'object') return null;
  try {
    if (t.v === 10) return normalizeScene(deepCopy(t), propCatalog);
    let n = deepCopy(t);
    if (n.v === 1) { if (!n.performances) return null; n = v1to2(n); }
    if (n.v === 2) n = { ...n, v: 3, show: v2to3(n.show) };
    if (n.v === 3) n = { ...n, v: 4 };
    if (n.v === 4) n = v4to5(n);
    if (n.v === 5) n = v5to6(n, propCatalog);
    if (n.v === 6) n = { ...n, v: 7 };
    if (n.v === 7) n = v7to8(n);
    if (n.v === 8) n = { ...n, v: 9 };
    if (n.v === 9) n = { ...n, v: 10 };
    return n.v === 10 ? normalizeScene(n, propCatalog) : null;
  } catch (e) {
    console.error('Stage: scene migration failed, refusing the row', e);
    return null;
  }
}

function deepCopy(t) { return JSON.parse(JSON.stringify(t)); }

// ---- save: strip undefined + pack items (lje sequential bumping) ----
export function saveScene(scene) {
  const out = JSON.parse(JSON.stringify(scene, (k, v) => v === undefined ? undefined : v));
  for (const tr of out.show?.tracks ?? []) tr.items = packItems(tr.items);
  return out;
}
export function packItems(items) { // lje: sort by startS, bump overlaps
  let cursor = 0;
  return [...items].sort((a, b) => a.startS - b.startS).map(it => {
    const s = Math.max(it.startS, cursor);
    cursor = s + itemDuration(it);
    return s === it.startS ? it : { ...it, startS: s };
  });
}

export function emptyScene() {
  return { v: C.SCHEMA_V, objects: {}, show: { name: 'Show', tracks: [] }, recordAspect: '16:9' };
}
